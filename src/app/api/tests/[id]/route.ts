import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

import Test from '@/models/Test';
import TestCategory from '@/models/TestCategory';

import { createTestSchema } from '@/lib/validations/test';

interface RouteContext {
    params: Promise<{
        id: string;
    }>;
}

export async function GET(request: Request, context: RouteContext) {
    try {
        const authResult = requireAuth(request);

        if (!authResult.success) {
            return authResult.response;
        }

        await connectDB();

        const { id } = await context.params;

        const test = await Test.findById(id)
            .populate('category', 'name code department modality')
            .lean();

        if (!test) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Test not found',
                },
                { status: 404 },
            );
        }

        return NextResponse.json(
            {
                success: true,
                test,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Get test details error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Something went wrong while fetching test details',
            },
            { status: 500 },
        );
    }
}

export async function PUT(request: Request, context: RouteContext) {
    try {
        const authResult = requireAuth(request);

        if (!authResult.success) {
            return authResult.response;
        }

        await connectDB();

        const { id } = await context.params;

        const body = await request.json();

        const validationResult = createTestSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Validation failed',
                    errors: validationResult.error.flatten().fieldErrors,
                },
                { status: 400 },
            );
        }

        const data = validationResult.data;

        const test = await Test.findById(id);

        if (!test) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Test not found',
                },
                { status: 404 },
            );
        }

        /*
         * Validate Test Category
         */
        const category = await TestCategory.findById(data.category);

        if (!category) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Selected test category was not found',
                    errors: {
                        category: ['Selected test category does not exist'],
                    },
                },
                { status: 400 },
            );
        }

        /*
         * Check duplicate Test Code
         */
        const duplicateTest = await Test.findOne({
            code: data.code,
            _id: { $ne: id },
        });

        if (duplicateTest) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'A test with this code already exists',
                    errors: {
                        code: ['Test code must be unique'],
                    },
                },
                { status: 409 },
            );
        }

        /*
         * Update Test
         */
        test.name = data.name;
        test.code = data.code;
        test.category = category._id;

        test.department = data.department || category.department || undefined;

        test.testType = data.testType;

        test.sampleType = data.sampleType || undefined;

        test.specimenSite = data.specimenSite || undefined;

        test.modality = data.modality || category.modality || undefined;

        test.preparationRequired = data.preparationRequired;

        test.preparationInstructions = data.preparationInstructions || undefined;

        test.turnaroundTime = data.turnaroundTime;

        test.turnaroundUnit = data.turnaroundUnit;

        test.price = data.price;

        test.discountAllowed = data.discountAllowed;

        test.reportType = data.reportType;

        test.displayOrder = data.displayOrder;

        test.description = data.description || undefined;

        test.status = data.status;

        await test.save();

        const updatedTest = await Test.findById(id)
            .populate('category', 'name code department modality')
            .lean();

        return NextResponse.json(
            {
                success: true,
                message: 'Test updated successfully',
                test: updatedTest,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Update test error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Something went wrong while updating test',
            },
            { status: 500 },
        );
    }
}

export async function PATCH(request: Request, context: RouteContext) {
    try {
        const authResult = requireAuth(request);

        if (!authResult.success) {
            return authResult.response;
        }

        await connectDB();

        const { id } = await context.params;

        const body = await request.json();

        if (body.status !== 'ACTIVE' && body.status !== 'INACTIVE') {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid test status',
                },
                { status: 400 },
            );
        }

        const test = await Test.findById(id);

        if (!test) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Test not found',
                },
                { status: 404 },
            );
        }

        test.status = body.status;

        await test.save();

        return NextResponse.json(
            {
                success: true,
                message:
                    body.status === 'ACTIVE'
                        ? 'Test activated successfully'
                        : 'Test deactivated successfully',
                test: {
                    id: test._id,
                    code: test.code,
                    name: test.name,
                    status: test.status,
                    updatedAt: test.updatedAt,
                },
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Update test status error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Something went wrong while updating test status',
            },
            { status: 500 },
        );
    }
}
