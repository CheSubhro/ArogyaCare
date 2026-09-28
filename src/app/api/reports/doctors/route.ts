import { NextResponse } from 'next/server';
import { PipelineStage } from 'mongoose';

import { requireAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
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
        const search = searchParams.get('search')?.trim() || '';
        const referralType = searchParams.get('referralType')?.trim() || '';
        const status = searchParams.get('status')?.trim() || '';

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

        const allowedReferralTypes = ['INDIVIDUAL', 'HOSPITAL', 'CLINIC', 'OTHER'];

        if (referralType && !allowedReferralTypes.includes(referralType)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid referral type.',
                },
                { status: 400 },
            );
        }

        const allowedStatuses = ['ACTIVE', 'INACTIVE'];

        if (status && !allowedStatuses.includes(status)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid doctor status.',
                },
                { status: 400 },
            );
        }

        /**
         * Search/filter doctors through the
         * populated doctor document.
         */
        const doctorMatch: Record<string, unknown> = {};

        if (search) {
            doctorMatch.$or = [
                {
                    'doctor.name': {
                        $regex: search,
                        $options: 'i',
                    },
                },
                {
                    'doctor.registrationNumber': {
                        $regex: search,
                        $options: 'i',
                    },
                },
                {
                    'doctor.specialization': {
                        $regex: search,
                        $options: 'i',
                    },
                },
            ];
        }

        if (referralType) {
            doctorMatch['doctor.referralType'] = referralType;
        }

        if (status) {
            doctorMatch['doctor.status'] = status;
        }

        /**
         * Only non-cancelled bills are counted
         * as actual referrals/visits.
         */
        const aggregation: PipelineStage[] = [
            {
                $match: {
                    billDate: {
                        $gte: startDate,
                        $lte: endDate,
                    },

                    billStatus: {
                        $ne: 'CANCELLED',
                    },

                    doctor: {
                        $ne: null,
                    },
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
                    preserveNullAndEmptyArrays: false,
                },
            },
        ];

        if (Object.keys(doctorMatch).length > 0) {
            aggregation.push({
                $match: doctorMatch,
            });
        }

        /**
         * Group by referring doctor.
         */
        aggregation.push(
            {
                $group: {
                    _id: '$doctor._id',

                    doctorName: {
                        $first: '$doctor.name',
                    },

                    registrationNumber: {
                        $first: '$doctor.registrationNumber',
                    },

                    specialization: {
                        $first: '$doctor.specialization',
                    },

                    referralType: {
                        $first: '$doctor.referralType',
                    },

                    status: {
                        $first: '$doctor.status',
                    },

                    mobileNumber: {
                        $first: '$doctor.mobileNumber',
                    },

                    email: {
                        $first: '$doctor.email',
                    },

                    clinicName: {
                        $first: '$doctor.clinicName',
                    },

                    hospitalName: {
                        $first: '$doctor.hospitalName',
                    },

                    totalBills: {
                        $sum: 1,
                    },

                    totalTests: {
                        $sum: {
                            $reduce: {
                                input: {
                                    $ifNull: ['$items', []],
                                },

                                initialValue: 0,

                                in: {
                                    $add: [
                                        '$$value',
                                        {
                                            $ifNull: ['$$this.quantity', 1],
                                        },
                                    ],
                                },
                            },
                        },
                    },

                    patientIds: {
                        $addToSet: '$patient',
                    },
                },
            },

            {
                $addFields: {
                    totalPatients: {
                        $size: '$patientIds',
                    },
                },
            },

            {
                $sort: {
                    totalBills: -1,
                    doctorName: 1,
                },
            },
        );

        const allDoctors = await Bill.aggregate(aggregation);

        const totalReferringDoctors = allDoctors.length;

        const totalReferrals = allDoctors.reduce(
            (sum, doctor) => sum + Number(doctor.totalBills || 0),
            0,
        );

        const totalReferredPatients = allDoctors.reduce(
            (sum, doctor) => sum + Number(doctor.totalPatients || 0),
            0,
        );

        const totalReferredTests = allDoctors.reduce(
            (sum, doctor) => sum + Number(doctor.totalTests || 0),
            0,
        );

        /**
         * Referral type summary.
         */
        const referralTypeSummary: Record<string, number> = {};

        for (const doctor of allDoctors) {
            const type = doctor.referralType || 'OTHER';

            referralTypeSummary[type] = (referralTypeSummary[type] || 0) + 1;
        }

        /**
         * Pagination.
         */
        const skip = (page - 1) * limit;

        const doctors = allDoctors.slice(skip, skip + limit);

        return NextResponse.json({
            success: true,

            dateRange: {
                from: startDate.toISOString(),
                to: endDate.toISOString(),
            },

            summary: {
                totalReferringDoctors,
                totalReferrals,
                totalReferredPatients,
                totalReferredTests,
            },

            referralTypeSummary,

            doctors,

            pagination: {
                page,
                limit,
                total: totalReferringDoctors,
                totalPages: Math.ceil(totalReferringDoctors / limit),
            },
        });
    } catch (error) {
        console.error('Doctor report error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to load doctor report.',
            },
            { status: 500 },
        );
    }
}
