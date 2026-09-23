import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { createTestCategorySchema } from '@/lib/validations/test-category';
import TestCategory from '@/models/TestCategory';

interface RouteContext {
    params: Promise<{
        id: string;
    }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
    try {
        await requireAuth(request);
        await connectDB();

        const { id } = await context.params;

        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid test category ID',
                },
                { status: 400 },
            );
        }

        const category = await TestCategory.findById(id)
            .populate('parentCategory', 'name code')
            .lean();

        if (!category) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Test category not found',
                },
                { status: 404 },
            );
        }

        return NextResponse.json(
            {
                success: true,
                category,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Get test category error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch test category',
            },
            { status: 500 },
        );
    }
}

export async function PUT(request: NextRequest, context: RouteContext) {
    try {
        await requireAuth(request);
        await connectDB();

        const { id } = await context.params;

        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid test category ID',
                },
                { status: 400 },
            );
        }

        const existingCategory = await TestCategory.findById(id);

        if (!existingCategory) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Test category not found',
                },
                { status: 404 },
            );
        }

        const body = await request.json();

        const validationResult = createTestCategorySchema.safeParse(body);

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

        const duplicateCategory = await TestCategory.findOne({
            code: data.code,
            _id: {
                $ne: id,
            },
        }).lean();

        if (duplicateCategory) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'A test category with this code already exists',
                    errors: {
                        code: 'This category code is already in use',
                    },
                },
                { status: 409 },
            );
        }

        if (data.parentCategory) {
            if (data.parentCategory === id) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'A category cannot be its own parent',
                        errors: {
                            parentCategory: 'A category cannot be its own parent',
                        },
                    },
                    { status: 400 },
                );
            }

            const parentCategory = await TestCategory.findById(data.parentCategory).lean();

            if (!parentCategory) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Parent category not found',
                        errors: {
                            parentCategory: 'Selected parent category does not exist',
                        },
                    },
                    { status: 400 },
                );
            }
        }

        existingCategory.name = data.name;
        existingCategory.code = data.code;
        existingCategory.description = data.description || '';
        existingCategory.department = data.department || '';
        existingCategory.modality = data.modality || '';
        existingCategory.parentCategory = data.parentCategory
            ? new mongoose.Types.ObjectId(data.parentCategory)
            : null;
        existingCategory.displayOrder = data.displayOrder ?? 0;
        existingCategory.status = data.status ?? 'ACTIVE';

        await existingCategory.save();

        const updatedCategory = await TestCategory.findById(id)
            .populate('parentCategory', 'name code')
            .lean();

        return NextResponse.json(
            {
                success: true,
                message: 'Test category updated successfully',
                category: updatedCategory,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Update test category error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to update test category',
            },
            { status: 500 },
        );
    }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        await requireAuth(request);
        await connectDB();

        const { id } = await context.params;

        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid test category ID',
                },
                { status: 400 },
            );
        }

        const category = await TestCategory.findById(id);

        if (!category) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Test category not found',
                },
                { status: 404 },
            );
        }

        const body = await request.json();

        const status = body.status;

        if (status !== 'ACTIVE' && status !== 'INACTIVE') {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid category status',
                },
                { status: 400 },
            );
        }

        category.status = status;

        await category.save();

        const updatedCategory = await TestCategory.findById(id)
            .populate('parentCategory', 'name code')
            .lean();

        return NextResponse.json(
            {
                success: true,
                message:
                    status === 'ACTIVE'
                        ? 'Test category activated successfully'
                        : 'Test category deactivated successfully',
                category: updatedCategory,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Update test category status error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to update test category status',
            },
            { status: 500 },
        );
    }
}
