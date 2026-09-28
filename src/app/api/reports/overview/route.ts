import { NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Bill from '@/models/Bill';
import LabSample from '@/models/LabSample';
import Patient from '@/models/Patient';

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

        const now = new Date();

        let startDate: Date;
        let endDate: Date;

        if (from) {
            startDate = new Date(`${from}T00:00:00.000`);
        } else {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        }

        if (to) {
            endDate = new Date(`${to}T23:59:59.999`);
        } else {
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }

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

        const [
            totalPatients,
            newPatients,
            totalBills,
            confirmedBills,
            cancelledBills,
            billFinancials,
            paymentFinancials,
            sampleStatistics,
        ] = await Promise.all([
            Patient.countDocuments(),

            Patient.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lte: endDate,
                },
            }),

            Bill.countDocuments({
                billDate: {
                    $gte: startDate,
                    $lte: endDate,
                },
            }),

            Bill.countDocuments({
                billDate: {
                    $gte: startDate,
                    $lte: endDate,
                },
                billStatus: 'CONFIRMED',
            }),

            Bill.countDocuments({
                billDate: {
                    $gte: startDate,
                    $lte: endDate,
                },
                billStatus: 'CANCELLED',
            }),

            Bill.aggregate([
                {
                    $match: {
                        billDate: {
                            $gte: startDate,
                            $lte: endDate,
                        },
                        billStatus: {
                            $ne: 'CANCELLED',
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        grossAmount: {
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
                    $match: {
                        billDate: {
                            $gte: startDate,
                            $lte: endDate,
                        },
                        billStatus: {
                            $ne: 'CANCELLED',
                        },
                    },
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

            LabSample.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: startDate,
                            $lte: endDate,
                        },
                    },
                },
                {
                    $group: {
                        _id: '$status',
                        count: {
                            $sum: 1,
                        },
                    },
                },
            ]),
        ]);

        const financialData = billFinancials[0] || {
            grossAmount: 0,
            discountAmount: 0,
            taxAmount: 0,
            grandTotal: 0,
            paidAmount: 0,
            dueAmount: 0,
        };

        const paymentMethods = paymentFinancials.map((item) => ({
            method: item._id,
            amount: item.amount,
            transactionCount: item.transactionCount,
        }));

        const samples = {
            pending: 0,
            collected: 0,
            received: 0,
            processed: 0,
            rejected: 0,
            cancelled: 0,
        };

        for (const item of sampleStatistics) {
            const status = String(item._id).toLowerCase();

            if (status in samples) {
                samples[status as keyof typeof samples] = item.count;
            }
        }

        return NextResponse.json({
            success: true,
            dateRange: {
                from: startDate.toISOString(),
                to: endDate.toISOString(),
            },
            overview: {
                totalPatients,
                newPatients,
                totalBills,
                confirmedBills,
                cancelledBills,
                grossAmount: financialData.grossAmount,
                discountAmount: financialData.discountAmount,
                taxAmount: financialData.taxAmount,
                grandTotal: financialData.grandTotal,
                paidAmount: financialData.paidAmount,
                dueAmount: financialData.dueAmount,
            },
            paymentMethods,
            samples,
        });
    } catch (error) {
        console.error('Reports overview error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to load reports overview.',
            },
            { status: 500 },
        );
    }
}
