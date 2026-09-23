import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import TestCategory from '@/models/TestCategory';
import { createTestCategorySchema } from '@/lib/validations/test-category';

export async function POST(request: NextRequest) {
    try {
        await requireAuth(request);
        await connectDB();

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

        const existingCategory = await TestCategory.findOne({
            code: data.code,
        }).lean();

        if (existingCategory) {
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

        const category = await TestCategory.create({
            name: data.name,
            code: data.code,
            description: data.description || '',
            department: data.department || '',
            modality: data.modality || '',
            parentCategory: data.parentCategory || null,
            displayOrder: data.displayOrder ?? 0,
            status: data.status ?? 'ACTIVE',
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Test category created successfully',
                category,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error('Create test category error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to create test category',
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
        const status = searchParams.get('status')?.trim() || '';
        const department = searchParams.get('department')?.trim() || '';

        const query: Record<string, unknown> = {};

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
                    department: {
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

        if (status) {
            if (!['ACTIVE', 'INACTIVE'].includes(status)) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Invalid category status',
                    },
                    { status: 400 },
                );
            }

            query.status = status;
        }

        if (department) {
            query.department = {
                $regex: department,
                $options: 'i',
            };
        }

        const categories = await TestCategory.find(query)
            .populate('parentCategory', 'name code')
            .sort({
                displayOrder: 1,
                name: 1,
            })
            .lean();

        return NextResponse.json(
            {
                success: true,
                categories,
                count: categories.length,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Get test categories error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch test categories',
            },
            { status: 500 },
        );
    }
}
