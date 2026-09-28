import { NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth';
import {connectDB} from '@/lib/db';
import Bill from '@/models/Bill';

export async function GET(request: Request) {
    try {
        const authResult = requireAuth(request);

        if (!authResult.success) {
            return authResult.response;
        }

        await connectDB();

        const { searchParams } = new URL(request.url);

        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const paymentStatus = searchParams.get('paymentStatus') || '';
        const billStatus = searchParams.get('billStatus') || '';
        const paymentMethod = searchParams.get('paymentMethod') || '';
        const search = searchParams.get('search')?.trim() || '';

        const page = Math.max(Number(searchParams.get('page')) || 1, 1);

        const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 10, 1), 100);

        const now = new Date();

        const startDate = from
            ? new Date(`${from}T00:00:00.000`)
            : new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

        const endDate = to
            ? new Date(`${to}T23:59:59.999`)
            : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid date range.',
                },
                { status: 400 },
            );
        }

        if (startDate > endDate) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'From date cannot be after To date.',
                },
                { status: 400 },
            );
        }

        const allowedPaymentStatuses = ['UNPAID', 'PARTIAL', 'PAID', 'REFUNDED'];

        const allowedBillStatuses = ['DRAFT', 'CONFIRMED', 'CANCELLED'];

        const allowedPaymentMethods = ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'OTHER'];

        if (paymentStatus && !allowedPaymentStatuses.includes(paymentStatus)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid payment status.',
                },
                { status: 400 },
            );
        }

        if (billStatus && !allowedBillStatuses.includes(billStatus)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid bill status.',
                },
                { status: 400 },
            );
        }

        if (paymentMethod && !allowedPaymentMethods.includes(paymentMethod)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid payment method.',
                },
                { status: 400 },
            );
        }

        const match: Record<string, unknown> = {
            billDate: {
                $gte: startDate,
                $lte: endDate,
            },
        };

        if (paymentStatus) {
            match.paymentStatus = paymentStatus;
        }

        if (billStatus) {
            match.billStatus = billStatus;
        }

        if (paymentMethod) {
            match['payments.paymentMethod'] = paymentMethod;
        }

        if (search) {
            match.$or = [
                {
                    billNumber: {
                        $regex: search,
                        $options: 'i',
                    },
                },
                {
                    testNameSearch: {
                        $regex: search,
                        $options: 'i',
                    },
                },
            ];
        }

        const baseMatch: Record<string, unknown> = {
            billDate: {
                $gte: startDate,
                $lte: endDate,
            },
        };

        if (paymentStatus) {
            baseMatch.paymentStatus = paymentStatus;
        }

        if (billStatus) {
            baseMatch.billStatus = billStatus;
        }

        if (paymentMethod) {
            baseMatch['payments.paymentMethod'] = paymentMethod;
        }

        const aggregationMatch: Record<string, unknown> = {
            ...baseMatch,
        };

        if (search) {
            aggregationMatch.$or = [
                {
                    billNumber: {
                        $regex: search,
                        $options: 'i',
                    },
                },
            ];
        }

        const skip = (page - 1) * limit;

        const [bills, totalBills, summaryResult, paymentMethodResult] = await Promise.all([
            Bill.aggregate([
                {
                    $match: aggregationMatch,
                },
                {
                    $lookup: {
                        from: 'patients',
                        localField: 'patient',
                        foreignField: '_id',
                        as: 'patient',
                    },
                },
                {
                    $unwind: {
                        path: '$patient',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: 'doctors',
                        localField: 'doctor',
                        foreignField: '_id',
                        as: 'doctor',
                    },
                },
                {
                    $unwind: {
                        path: '$doctor',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $match: search
                        ? {
                              $or: [
                                  {
                                      billNumber: {
                                          $regex: search,
                                          $options: 'i',
                                      },
                                  },
                                  {
                                      'patient.name': {
                                          $regex: search,
                                          $options: 'i',
                                      },
                                  },
                                  {
                                      'patient.mobile': {
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
                              ],
                          }
                        : {},
                },
                {
                    $sort: {
                        billDate: -1,
                        createdAt: -1,
                    },
                },
                {
                    $skip: skip,
                },
                {
                    $limit: limit,
                },
                {
                    $project: {
                        _id: 1,
                        billNumber: 1,
                        billDate: 1,
                        billStatus: 1,
                        paymentStatus: 1,
                        paymentMethod: 1,
                        subtotal: 1,
                        discountAmount: 1,
                        taxAmount: 1,
                        grandTotal: 1,
                        paidAmount: 1,
                        dueAmount: 1,
                        patient: {
                            _id: '$patient._id',
                            name: '$patient.name',
                            mobile: '$patient.mobile',
                            patientId: '$patient.patientId',
                        },
                        doctor: {
                            _id: '$doctor._id',
                            name: '$doctor.name',
                        },
                        items: 1,
                        payments: 1,
                    },
                },
            ]),

            Bill.countDocuments(match),

            Bill.aggregate([
                {
                    $match: baseMatch,
                },
                {
                    $group: {
                        _id: null,
                        subtotal: {
                            $sum: '$subtotal',
                        },
                        discountAmount: {
                            $sum: '$discountAmount',
                        },
                        taxAmount: {
                            $sum: '$taxAmount',
                        },
                        grandTotal: {
                            $sum: '$grandTotal',
                        },
                        paidAmount: {
                            $sum: '$paidAmount',
                        },
                        dueAmount: {
                            $sum: '$dueAmount',
                        },
                    },
                },
            ]),

            Bill.aggregate([
                {
                    $match: baseMatch,
                },
                {
                    $unwind: {
                        path: '$payments',
                        preserveNullAndEmptyArrays: false,
                    },
                },
                {
                    $group: {
                        _id: '$payments.paymentMethod',
                        amount: {
                            $sum: '$payments.amount',
                        },
                        transactionCount: {
                            $sum: 1,
                        },
                    },
                },
                {
                    $sort: {
                        amount: -1,
                    },
                },
            ]),
        ]);

        const summary = summaryResult[0] || {
            subtotal: 0,
            discountAmount: 0,
            taxAmount: 0,
            grandTotal: 0,
            paidAmount: 0,
            dueAmount: 0,
        };

        return NextResponse.json({
            success: true,
            dateRange: {
                from: startDate.toISOString(),
                to: endDate.toISOString(),
            },
            summary: {
                subtotal: summary.subtotal,
                discountAmount: summary.discountAmount,
                taxAmount: summary.taxAmount,
                grandTotal: summary.grandTotal,
                paidAmount: summary.paidAmount,
                dueAmount: summary.dueAmount,
            },
            paymentMethods: paymentMethodResult.map((item) => ({
                method: item._id,
                amount: item.amount,
                transactionCount: item.transactionCount,
            })),
            bills,
            pagination: {
                page,
                limit,
                total: totalBills,
                totalPages: Math.ceil(totalBills / limit),
            },
        });
    } catch (error) {
        console.error('Billing report error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to load billing report.',
            },
            { status: 500 },
        );
    }
}
