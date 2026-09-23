import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { createTestSchema } from '@/lib/validations/test';
import Test from '@/models/Test';
import TestCategory from '@/models/TestCategory';

export async function POST(request: NextRequest) {
    try {
        await requireAuth(request);
        await connectDB();

        const body = await request.json();

        const validationResult = createTestSchema.safeParse(body);

        if (!validationResult.success) {
            const errors: Record<string, string> = {};

            validationResult.error.issues.forEach((issue) => {
                const field = issue.path[0];

                if (typeof field === 'string' && !errors[field]) {
                    errors[field] = issue.message;
                }
            });

            return NextResponse.json(
                {
                    success: false,
                    message: 'Please correct the highlighted fields',
                    errors,
                },
                { status: 400 },
            );
        }

        const data = validationResult.data;

        /*
         * Validate category ObjectId
         */
        if (!mongoose.isValidObjectId(data.category)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid test category',
                    errors: {
                        category: 'Selected test category is invalid',
                    },
                },
                { status: 400 },
            );
        }

        /*
         * Check category exists
         */
        const category = await TestCategory.findById(data.category).lean();

        if (!category) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Test category not found',
                    errors: {
                        category: 'Selected test category does not exist',
                    },
                },
                { status: 400 },
            );
        }

        /*
         * Check duplicate test code
         */
        const existingTest = await Test.findOne({
            code: data.code,
        }).lean();

        if (existingTest) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'A test with this code already exists',
                    errors: {
                        code: 'This test code is already in use',
                    },
                },
                { status: 409 },
            );
        }

        /*
         * Create test
         */
        const test = await Test.create({
            name: data.name,
            code: data.code,

            category: new mongoose.Types.ObjectId(data.category),

            department: data.department || category.department || '',

            testType: data.testType || 'LABORATORY',

            sampleType: data.sampleType || '',

            specimenSite: data.specimenSite || '',

            modality: data.modality || category.modality || '',

            preparationRequired: data.preparationRequired ?? false,

            preparationInstructions: data.preparationInstructions || '',

            turnaroundTime: data.turnaroundTime,

            turnaroundUnit: data.turnaroundUnit || 'HOURS',

            price: data.price,

            discountAllowed: data.discountAllowed ?? true,

            reportType: data.reportType || 'NUMERIC',

            displayOrder: data.displayOrder ?? 0,

            description: data.description || '',

            status: data.status || 'ACTIVE',
        });

        /*
         * Return populated test
         */
        const populatedTest = await Test.findById(test._id)
            .populate('category', 'name code department modality')
            .lean();

        return NextResponse.json(
            {
                success: true,
                message: 'Test created successfully',
                test: populatedTest,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error('Create test error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to create test',
            },
            { status: 500 },
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        await requireAuth(request);
        await connectDB();

        const searchParams = request.nextUrl.searchParams;

        const search = searchParams.get('search')?.trim() || '';

        const category = searchParams.get('category')?.trim() || '';

        const department = searchParams.get('department')?.trim() || '';

        const testType = searchParams.get('testType')?.trim() || '';

        const status = searchParams.get('status')?.trim() || '';

        const query: Record<string, unknown> = {};

        /*
         * Search
         */
        if (search) {
            query.$or = [
                {
                    name: {
                        $regex: search,
                        $options: 'i',
                    },
                },
                {
                    code: {
                        $regex: search,
                        $options: 'i',
                    },
                },
                {
                    description: {
                        $regex: search,
                        $options: 'i',
                    },
                },
                {
                    sampleType: {
                        $regex: search,
                        $options: 'i',
                    },
                },
                {
                    specimenSite: {
                        $regex: search,
                        $options: 'i',
                    },
                },
                {
                    modality: {
                        $regex: search,
                        $options: 'i',
                    },
                },
            ];
        }

        /*
         * Category filter
         */
        if (category) {
            if (!mongoose.isValidObjectId(category)) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Invalid test category',
                    },
                    { status: 400 },
                );
            }

            query.category = new mongoose.Types.ObjectId(category);
        }

        /*
         * Department filter
         */
        if (department) {
            query.department = {
                $regex: department,
                $options: 'i',
            };
        }

        /*
         * Test type filter
         */
        if (testType) {
            const validTestTypes = [
                'LABORATORY',
                'IMAGING',
                'CARDIOLOGY',
                'NEUROLOGY',
                'PROCEDURE',
                'OTHER',
            ];

            if (!validTestTypes.includes(testType)) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Invalid test type',
                    },
                    { status: 400 },
                );
            }

            query.testType = testType;
        }

        /*
         * Status filter
         */
        if (status) {
            if (!['ACTIVE', 'INACTIVE'].includes(status)) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Invalid test status',
                    },
                    { status: 400 },
                );
            }

            query.status = status;
        }

        /*
         * Fetch tests
         */
        const tests = await Test.find(query)
            .populate('category', 'name code department modality')
            .sort({
                displayOrder: 1,
                name: 1,
            })
            .lean();

        return NextResponse.json(
            {
                success: true,
                tests,
                count: tests.length,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Get tests error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch tests',
            },
            { status: 500 },
        );
    }
}
