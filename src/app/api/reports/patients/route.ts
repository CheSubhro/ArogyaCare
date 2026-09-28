import { NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Bill from '@/models/Bill';
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
        const search = searchParams.get('search')?.trim() || '';
        const status = searchParams.get('status') || '';

        const page = Math.max(Number(searchParams.get('page')) || 1, 1);

        const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 10, 1), 100);

        const now = new Date();

        const startDate = from
            ? new Date(`${from}T00:00:00.000`)
            : new Date(now.getFullYear(), now.getMonth(), 1);

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

        const patientMatch: Record<string, unknown> = {};

        if (status) {
            if (!['ACTIVE', 'INACTIVE'].includes(status)) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Invalid patient status.',
                    },
                    { status: 400 },
                );
            }

            patientMatch.status = status;
        }

        if (search) {
            patientMatch.$or = [
                {
                    patientId: {
                        $regex: search,
                        $options: 'i',
                    },
                },
                {
                    name: {
                        $regex: search,
                        $options: 'i',
                    },
                },
                {
                    mobile: {
                        $regex: search,
                        $options: 'i',
                    },
                },
            ];
        }

        const skip = (page - 1) * limit;

        const [patients, totalPatients, activePatients, inactivePatients, newPatients] =
            await Promise.all([
                Patient.aggregate([
                    {
                        $match: patientMatch,
                    },

                    {
                        $lookup: {
                            from: 'bills',
                            let: {
                                patientId: '$_id',
                            },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                {
                                                    $eq: ['$patient', '$$patientId'],
                                                },
                                                {
                                                    $gte: ['$billDate', startDate],
                                                },
                                                {
                                                    $lte: ['$billDate', endDate],
                                                },
                                            ],
                                        },
                                    },
                                },
                            ],
                            as: 'bills',
                        },
                    },

                    {
                        $addFields: {
                            totalBills: {
                                $size: '$bills',
                            },

                            totalTests: {
                                $reduce: {
                                    input: '$bills',
                                    initialValue: 0,
                                    in: {
                                        $add: [
                                            '$$value',
                                            {
                                                $sum: {
                                                    $map: {
                                                        input: {
                                                            $ifNull: ['$$this.items', []],
                                                        },
                                                        as: 'item',
                                                        in: {
                                                            $ifNull: ['$$item.quantity', 1],
                                                        },
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    },

                    {
                        $sort: {
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
                            patientId: 1,
                            name: 1,
                            gender: 1,
                            dob: 1,
                            age: 1,
                            mobile: 1,
                            email: 1,
                            city: 1,
                            status: 1,
                            createdAt: 1,
                            totalBills: 1,
                            totalTests: 1,
                        },
                    },
                ]),

                Patient.countDocuments(patientMatch),

                Patient.countDocuments({
                    ...patientMatch,
                    status: 'ACTIVE',
                }),

                Patient.countDocuments({
                    ...patientMatch,
                    status: 'INACTIVE',
                }),

                Patient.countDocuments({
                    ...patientMatch,
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate,
                    },
                }),
            ]);

        return NextResponse.json({
            success: true,

            dateRange: {
                from: startDate.toISOString(),
                to: endDate.toISOString(),
            },

            summary: {
                totalPatients,
                newPatients,
                activePatients,
                inactivePatients,
            },

            patients,

            pagination: {
                page,
                limit,
                total: totalPatients,
                totalPages: Math.ceil(totalPatients / limit),
            },
        });
    } catch (error) {
        console.error('Patient report error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to load patient report.',
            },
            { status: 500 },
        );
    }
}
