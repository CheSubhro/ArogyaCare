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

        const department = searchParams.get('department')?.trim() || '';

        const testType = searchParams.get('testType')?.trim() || '';

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

        const allowedTestTypes = [
            'LABORATORY',
            'IMAGING',
            'CARDIOLOGY',
            'NEUROLOGY',
            'PROCEDURE',
            'OTHER',
        ];

        if (testType && !allowedTestTypes.includes(testType)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid test type.',
                },
                { status: 400 },
            );
        }

        /**
         * Bills within selected date range.
         *
         * Cancelled bills are excluded because
         * cancelled services should not count as
         * performed tests.
         */
        const billMatch = {
            billDate: {
                $gte: startDate,
                $lte: endDate,
            },
            billStatus: {
                $ne: 'CANCELLED',
            },
        };

        /**
         * Test filters.
         */
        const testMatch: Record<string, unknown> = {};

        if (search) {
            testMatch.$or = [
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
            ];
        }

        if (department) {
            testMatch['test.department'] = department;
        }

        if (testType) {
            testMatch['test.testType'] = testType;
        }

        /**
         * Explicit PipelineStage[] prevents TypeScript
         * from inferring a narrow union from the first
         * few aggregation stages.
         */
        const aggregation: PipelineStage[] = [
            {
                $match: billMatch,
            },

            {
                $unwind: '$items',
            },

            {
                $lookup: {
                    from: 'tests',
                    localField: 'items.test',
                    foreignField: '_id',
                    as: 'test',
                },
            },

            {
                $unwind: {
                    path: '$test',
                    preserveNullAndEmptyArrays: false,
                },
            },
        ];

        /**
         * Apply test filters only when provided.
         */
        if (Object.keys(testMatch).length > 0) {
            aggregation.push({
                $match: testMatch,
            });
        }

        /**
         * Group all bill items by test.
         */
        aggregation.push(
            {
                $group: {
                    _id: '$items.test',

                    testName: {
                        $first: '$test.name',
                    },

                    testCode: {
                        $first: '$test.code',
                    },

                    category: {
                        $first: '$test.category',
                    },

                    department: {
                        $first: '$test.department',
                    },

                    modality: {
                        $first: '$test.modality',
                    },

                    testType: {
                        $first: '$test.testType',
                    },

                    totalTests: {
                        $sum: {
                            $ifNull: ['$items.quantity', 1],
                        },
                    },

                    billCount: {
                        $sum: 1,
                    },
                },
            },

            {
                $sort: {
                    totalTests: -1,
                    testName: 1,
                },
            },
        );

        /**
         * Run aggregation.
         */
        const allTests = await Bill.aggregate(aggregation);

        /**
         * Overall summary.
         */
        const totalUniqueTests = allTests.length;

        const totalTestsPerformed = allTests.reduce(
            (sum, item) => sum + Number(item.totalTests || 0),
            0,
        );

        /**
         * Test type summary.
         */
        const testTypeSummary = {
            LABORATORY: 0,
            IMAGING: 0,
            CARDIOLOGY: 0,
            NEUROLOGY: 0,
            PROCEDURE: 0,
            OTHER: 0,
        };

        for (const item of allTests) {
            const type = item.testType as keyof typeof testTypeSummary;

            if (type in testTypeSummary) {
                testTypeSummary[type] += Number(item.totalTests || 0);
            }
        }

        /**
         * Department summary.
         */
        const departmentSummary: Record<string, number> = {};

        for (const item of allTests) {
            const departmentName = item.department || 'Other';

            departmentSummary[departmentName] =
                (departmentSummary[departmentName] || 0) + Number(item.totalTests || 0);
        }

        /**
         * Pagination.
         */
        const skip = (page - 1) * limit;

        const tests = allTests.slice(skip, skip + limit);

        return NextResponse.json({
            success: true,

            dateRange: {
                from: startDate.toISOString(),
                to: endDate.toISOString(),
            },

            summary: {
                totalTestsPerformed,
                totalUniqueTests,

                laboratoryTests: testTypeSummary.LABORATORY,

                imagingTests: testTypeSummary.IMAGING,

                cardiologyTests: testTypeSummary.CARDIOLOGY,

                neurologyTests: testTypeSummary.NEUROLOGY,

                procedureTests: testTypeSummary.PROCEDURE,

                otherTests: testTypeSummary.OTHER,
            },

            testTypeSummary,

            departmentSummary,

            tests,

            pagination: {
                page,
                limit,
                total: totalUniqueTests,
                totalPages: Math.ceil(totalUniqueTests / limit),
            },
        });
    } catch (error) {
        console.error('Test report error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to load test report.',
            },
            { status: 500 },
        );
    }
}
