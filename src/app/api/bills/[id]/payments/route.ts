import { Types } from 'mongoose';
import { NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth';
import {connectDB} from '@/lib/db';
import Bill, { type PaymentMethod } from '@/models/Bill';

interface RouteContext {
    params: Promise<{
        id: string;
    }>;
}

interface PaymentRequestBody {
    amount?: number;
    paymentMethod?: PaymentMethod;
    paymentDate?: string;
    referenceNumber?: string;
    notes?: string;
}

export async function POST(request: Request, context: RouteContext) {
    try {
        const authResult = requireAuth(request);

        if (!authResult.success) {
            return authResult.response;
        }

        await connectDB();

        const { id } = await context.params;

        /*
         * Validate Bill ID
         */
        if (!Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid bill ID.',
                },
                {
                    status: 400,
                },
            );
        }

        /*
         * Parse request body
         */
        let body: PaymentRequestBody;

        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid request body.',
                },
                {
                    status: 400,
                },
            );
        }

        const { amount, paymentMethod, paymentDate, referenceNumber, notes } = body;

        /*
         * Validate amount
         */
        if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Payment amount must be greater than zero.',
                },
                {
                    status: 400,
                },
            );
        }

        /*
         * Round amount to two decimal places
         */
        const paymentAmount = Math.round(amount * 100) / 100;

        /*
         * Validate payment method
         */
        const allowedPaymentMethods: PaymentMethod[] = [
            'CASH',
            'UPI',
            'CARD',
            'BANK_TRANSFER',
            'OTHER',
        ];

        if (!paymentMethod || !allowedPaymentMethods.includes(paymentMethod)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Valid payment method is required.',
                },
                {
                    status: 400,
                },
            );
        }

        /*
         * Validate reference number
         */
        if (referenceNumber !== undefined && typeof referenceNumber !== 'string') {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Reference number must be a string.',
                },
                {
                    status: 400,
                },
            );
        }

        if (referenceNumber && referenceNumber.trim().length > 100) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Reference number cannot exceed 100 characters.',
                },
                {
                    status: 400,
                },
            );
        }

        /*
         * Validate notes
         */
        if (notes !== undefined && typeof notes !== 'string') {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Payment notes must be a string.',
                },
                {
                    status: 400,
                },
            );
        }

        if (notes && notes.trim().length > 500) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Payment notes cannot exceed 500 characters.',
                },
                {
                    status: 400,
                },
            );
        }

        /*
         * Validate payment date
         */
        let finalPaymentDate = new Date();

        if (paymentDate) {
            const parsedDate = new Date(paymentDate);

            if (Number.isNaN(parsedDate.getTime())) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Invalid payment date.',
                    },
                    {
                        status: 400,
                    },
                );
            }

            finalPaymentDate = parsedDate;
        }

        /*
         * Find bill
         */
        const bill = await Bill.findById(id);

        if (!bill) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Bill not found.',
                },
                {
                    status: 404,
                },
            );
        }

        /*
         * Cancelled bills cannot receive payment
         */
        if (bill.billStatus === 'CANCELLED') {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Payment cannot be added to a cancelled bill.',
                },
                {
                    status: 400,
                },
            );
        }

        /*
         * Draft bills should be confirmed first
         */
        if (bill.billStatus === 'DRAFT') {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Please confirm the bill before collecting payment.',
                },
                {
                    status: 400,
                },
            );
        }

        /*
         * Calculate current due amount
         *
         * We calculate from grandTotal and
         * paidAmount instead of trusting dueAmount.
         */
        const currentPaidAmount = Math.round(Number(bill.paidAmount) * 100) / 100;

        const grandTotal = Math.round(Number(bill.grandTotal) * 100) / 100;

        const currentDueAmount = Math.max(
            0,
            Math.round((grandTotal - currentPaidAmount) * 100) / 100,
        );

        /*
         * Do not allow overpayment
         */
        if (paymentAmount > currentDueAmount) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Payment amount cannot exceed the current due amount of ₹${currentDueAmount.toFixed(2)}.`,
                },
                {
                    status: 400,
                },
            );
        }

        /*
         * Calculate new paid and due amounts
         */
        const newPaidAmount = Math.round((currentPaidAmount + paymentAmount) * 100) / 100;

        const newDueAmount = Math.max(0, Math.round((grandTotal - newPaidAmount) * 100) / 100);

        /*
         * Determine payment status
         */
        let newPaymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';

        if (newPaidAmount <= 0) {
            newPaymentStatus = 'UNPAID';
        } else if (newDueAmount <= 0) {
            newPaymentStatus = 'PAID';
        } else {
            newPaymentStatus = 'PARTIAL';
        }

        /*
         * Add payment transaction
         */
        bill.payments.push({
            amount: paymentAmount,
            paymentMethod,
            paymentDate: finalPaymentDate,
            referenceNumber: referenceNumber?.trim() || undefined,
            receivedBy: null,
            notes: notes?.trim() || undefined,
        });

        /*
         * Update bill financial fields
         */
        bill.paidAmount = newPaidAmount;

        bill.dueAmount = newDueAmount;

        bill.paymentStatus = newPaymentStatus;

        /*
         * Keep paymentMethod updated with
         * the latest payment method for
         * backward compatibility.
         */
        bill.paymentMethod = paymentMethod;

        await bill.save();

        /*
         * Fetch updated bill with populated data
         */
        const updatedBill = await Bill.findById(id)
            .populate(
                'patient',
                'patientId name gender dateOfBirth age mobile email address city bloodGroup',
            )
            .populate(
                'doctor',
                'doctorId name qualification specialization registrationNumber mobileNumber email clinicName hospitalName city referralType',
            )
            .populate(
                'items.test',
                'name code department testType sampleType specimenSite modality',
            )
            .populate('payments.receivedBy', 'name email')
            .lean();

        return NextResponse.json(
            {
                success: true,
                message: 'Payment collected successfully.',
                bill: updatedBill,
                payment: {
                    amount: paymentAmount,
                    paymentMethod,
                    paymentDate: finalPaymentDate,
                    referenceNumber: referenceNumber?.trim() || undefined,
                    notes: notes?.trim() || undefined,
                },
            },
            {
                status: 200,
            },
        );
    } catch (error) {
        console.error('POST /api/bills/[id]/payments error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to collect payment.',
            },
            {
                status: 500,
            },
        );
    }
}
