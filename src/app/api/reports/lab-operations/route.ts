import { NextResponse } from 'next/server';
import { PipelineStage } from 'mongoose';

import { requireAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import LabSample from '@/models/LabSample';

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

        const allowedStatuses = [
            'PENDING',
            'COLLECTED',
            'RECEIVED',
            'REJECTED',
            'PROCESSED',
            'CANCELLED',
        ];

        if (status && !allowedStatuses.includes(status)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid sample status.',
                },
                { status: 400 },
            );
        }

        /**
         * Search is applied after patient/test
         * information is populated.
         */
        const pipeline: PipelineStage[] = [
            {
                $match: {
                    collectionDateTime: {
                        $gte: startDate,
                        $lte: endDate,
                    },
                },
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
                    from: 'tests',
                    localField: 'test',
                    foreignField: '_id',
                    as: 'test',
                },
            },

            {
                $unwind: {
                    path: '$test',
                    preserveNullAndEmptyArrays: true,
                },
            },
        ];

        if (status) {
            pipeline.push({
                $match: {
                    status,
                },
            });
        }

        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        {
                            sampleId: {
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
                            'patient.patientId': {
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
                            'test.name': {
                                $regex: search,
                                $options: 'i',
                            },
                        },
                        {
                            'test.code': {
                                $regex: search,
                                $options: 'i',
                            },
                        },
                    ],
                },
            });
        }

        pipeline.push({
            $sort: {
                collectionDateTime: -1,
                createdAt: -1,
            },
        });

        /**
         * Run complete filtered pipeline.
         */
        const allSamples = await LabSample.aggregate(pipeline);

        /**
         * Overall status summary.
         */
        const statusSummary = {
            PENDING: 0,
            COLLECTED: 0,
            RECEIVED: 0,
            REJECTED: 0,
            PROCESSED: 0,
            CANCELLED: 0,
        };

        for (const sample of allSamples) {
            const sampleStatus = sample.status as keyof typeof statusSummary;

            if (sampleStatus in statusSummary) {
                statusSummary[sampleStatus] += 1;
            }
        }

        const totalSamples = allSamples.length;

        /**
         * Pagination.
         */
        const skip = (page - 1) * limit;

        const samples = allSamples.slice(skip, skip + limit);

        return NextResponse.json({
            success: true,

            dateRange: {
                from: startDate.toISOString(),
                to: endDate.toISOString(),
            },

            summary: {
                totalSamples,

                pendingSamples: statusSummary.PENDING,

                collectedSamples: statusSummary.COLLECTED,

                receivedSamples: statusSummary.RECEIVED,

                rejectedSamples: statusSummary.REJECTED,

                processedSamples: statusSummary.PROCESSED,

                cancelledSamples: statusSummary.CANCELLED,
            },

            statusSummary,

            samples,

            pagination: {
                page,
                limit,
                total: totalSamples,
                totalPages: Math.ceil(totalSamples / limit),
            },
        });
    } catch (error) {
        console.error('Lab operations report error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to load lab operations report.',
            },
            { status: 500 },
        );
    }
}
