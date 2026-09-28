import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { generateBillNumber } from '@/lib/bill';
import { createBillSchema } from '@/lib/validations/bill';

import Bill from '@/models/Bill';
import Patient from '@/models/Patient';
import Doctor from '@/models/Doctor';
import Test from '@/models/Test';

function isValidObjectId(value: string): boolean {
    return /^[a-f\d]{24}$/i.test(value);
}

export async function POST(request: Request) {
    try {
        const authResult = requireAuth(request);

        if (!authResult.success) {
            return authResult.response;
        }

        await connectDB();

        const body = await request.json();

        const validationResult = createBillSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Please correct the validation errors.',
                    errors: validationResult.error.flatten().fieldErrors,
                },
                { status: 400 },
            );
        }

        const data = validationResult.data;

        // Validate Patient ID
        if (!isValidObjectId(data.patient)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid patient ID.',
                },
                { status: 400 },
            );
        }

        // Validate Doctor ID if provided
        if (data.doctor && !isValidObjectId(data.doctor)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid doctor ID.',
                },
                { status: 400 },
            );
        }

        // Validate all Test IDs
        for (const item of data.items) {
            if (!isValidObjectId(item.test)) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Invalid test ID.',
                    },
                    { status: 400 },
                );
            }
        }

        // Patient must exist
        const patient = await Patient.findById(data.patient).select('_id patientId name status');

        if (!patient) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Patient not found.',
                },
                { status: 404 },
            );
        }

        // Doctor validation
        let doctor = null;

        if (data.doctor) {
            doctor = await Doctor.findById(data.doctor).select('_id doctorId name status');

            if (!doctor) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Doctor not found.',
                    },
                    { status: 404 },
                );
            }
        }

        /*
         * Fetch all tests from database.
         *
         * We do not trust test name/code/price
         * sent by the frontend.
         */
        const testIds = data.items.map((item) => item.test);

        const tests = await Test.find({
            _id: {
                $in: testIds,
            },
        }).select('_id name code price status discountAllowed');

        if (tests.length !== new Set(testIds).size) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'One or more selected tests were not found.',
                },
                { status: 404 },
            );
        }

        const testMap = new Map(tests.map((test) => [test._id.toString(), test]));

        /*
         * Build bill items from trusted
         * database values.
         */
        const billItems = data.items.map((item) => {
            const test = testMap.get(item.test);

            if (!test) {
                throw new Error('Test not found while creating bill.');
            }

            if (test.status !== 'ACTIVE') {
                throw new Error(`Test "${test.name}" is inactive.`);
            }

            const quantity = item.quantity;

            const unitPrice = Number(test.price.toFixed(2));

            const itemSubtotal = Number((quantity * unitPrice).toFixed(2));

            /*
             * Only allow item discount
             * when the Test permits it.
             */
            const discountAmount = test.discountAllowed
                ? Number(Math.min(item.discountAmount, itemSubtotal).toFixed(2))
                : 0;

            const totalAmount = Number((itemSubtotal - discountAmount).toFixed(2));

            return {
                test: test._id,
                testName: test.name,
                testCode: test.code,
                quantity,
                unitPrice,
                discountAmount,
                totalAmount,
            };
        });

        /*
         * Recalculate all financial values
         * on the server.
         */
        const subtotal = Number(
            billItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0).toFixed(2),
        );

        const itemDiscountAmount = Number(
            billItems.reduce((sum, item) => sum + item.discountAmount, 0).toFixed(2),
        );

        /*
         * Bill-level discount.
         *
         * The frontend sends the requested
         * discount, but the server validates
         * it against the available amount.
         */
        const billDiscountAmount = Number(data.discountAmount.toFixed(2));

        const maximumDiscount = Number((subtotal - itemDiscountAmount).toFixed(2));

        if (billDiscountAmount > maximumDiscount) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Bill discount cannot exceed the available bill amount.',
                },
                { status: 400 },
            );
        }

        const taxAmount = Number(data.taxAmount.toFixed(2));

        const grandTotal = Number(
            (subtotal - itemDiscountAmount - billDiscountAmount + taxAmount).toFixed(2),
        );

        const paidAmount = Number(data.paidAmount.toFixed(2));

        if (paidAmount > grandTotal) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Paid amount cannot exceed grand total.',
                },
                { status: 400 },
            );
        }

        const dueAmount = Number((grandTotal - paidAmount).toFixed(2));

        /*
         * Determine payment status
         * from actual amounts.
         */
        let paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';

        if (paidAmount === 0) {
            paymentStatus = 'UNPAID';
        } else if (paidAmount === grandTotal) {
            paymentStatus = 'PAID';
        } else {
            paymentStatus = 'PARTIAL';
        }

        /*
         * Payment method is required
         * whenever payment is received.
         */
        if (paidAmount > 0 && !data.paymentMethod) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Payment method is required when payment has been received.',
                },
                { status: 400 },
            );
        }

        const billNumber = await generateBillNumber();

        const bill = await Bill.create({
            billNumber,
            patient: patient._id,
            doctor: doctor?._id || null,
            items: billItems,
            subtotal,
            discountAmount: billDiscountAmount + itemDiscountAmount,
            taxAmount,
            grandTotal,
            paidAmount,
            dueAmount,
            paymentStatus,
            paymentMethod: data.paymentMethod || undefined,
            billStatus: data.billStatus,
            billDate: new Date(data.billDate),
            notes: data.notes?.trim() || undefined,
        });

        const populatedBill = await Bill.findById(bill._id)
            .populate('patient', 'patientId name mobile')
            .populate('doctor', 'doctorId name specialization')
            .populate('items.test', 'name code price')
            .lean();

        return NextResponse.json(
            {
                success: true,
                message: 'Bill created successfully.',
                bill: populatedBill,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error('Create bill error:', error);

        if (error instanceof Error && error.message.includes('is inactive')) {
            return NextResponse.json(
                {
                    success: false,
                    message: error.message,
                },
                { status: 400 },
            );
        }

        if (
            error instanceof Error &&
            'code' in error &&
            (error as { code?: number }).code === 11000
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'A bill with this number already exists. Please try again.',
                },
                { status: 409 },
            );
        }

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to create bill.',
            },
            { status: 500 },
        );
    }
}

export async function GET(request: Request) {
    try {
        const authResult = requireAuth(request);

        if (!authResult.success) {
            return authResult.response;
        }

        await connectDB();

        const { searchParams } = new URL(request.url);

        const search = searchParams.get('search')?.trim() || '';

        const patient = searchParams.get('patient')?.trim() || '';

        const paymentStatus = searchParams.get('paymentStatus')?.trim() || '';

        const billStatus = searchParams.get('billStatus')?.trim() || '';

        const pageParam = Number(searchParams.get('page') || '1');

        const limitParam = Number(searchParams.get('limit') || '20');

        const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;

        const limit =
            Number.isFinite(limitParam) && limitParam > 0
                ? Math.min(Math.floor(limitParam), 100)
                : 20;

        const query: Record<string, unknown> = {};

        if (search) {
            query.$or = [
                {
                    billNumber: {
                        $regex: search,
                        $options: 'i',
                    },
                },
                {
                    'items.testName': {
                        $regex: search,
                        $options: 'i',
                    },
                },
                {
                    'items.testCode': {
                        $regex: search,
                        $options: 'i',
                    },
                },
            ];
        }

        if (patient) {
            if (!isValidObjectId(patient)) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Invalid patient ID.',
                    },
                    { status: 400 },
                );
            }

            query.patient = patient;
        }

        if (paymentStatus) {
            const allowedStatuses = ['UNPAID', 'PARTIAL', 'PAID', 'REFUNDED'];

            if (!allowedStatuses.includes(paymentStatus)) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Invalid payment status.',
                    },
                    { status: 400 },
                );
            }

            query.paymentStatus = paymentStatus;
        }

        if (billStatus) {
            const allowedStatuses = ['DRAFT', 'CONFIRMED', 'CANCELLED'];

            if (!allowedStatuses.includes(billStatus)) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Invalid bill status.',
                    },
                    { status: 400 },
                );
            }

            query.billStatus = billStatus;
        }

        const skip = (page - 1) * limit;

        const [bills, total] = await Promise.all([
            Bill.find(query)
                .populate('patient', 'patientId name mobile')
                .populate('doctor', 'doctorId name specialization')
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limit)
                .lean(),

            Bill.countDocuments(query),
        ]);

        const totalPages = Math.ceil(total / limit);

        return NextResponse.json({
            success: true,
            bills,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        });
    } catch (error) {
        console.error('Get bills error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch bills.',
            },
            { status: 500 },
        );
    }
}


