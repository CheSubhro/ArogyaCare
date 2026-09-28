import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { connectDB } from '@/lib/db';
import { requirePermission } from '@/lib/auth';

import User from '@/models/User';
import Role from '@/models/Role';

import { createUserSchema } from '@/lib/validations/user';

export async function GET(request: Request) {
    try {
        await connectDB();

        const permissionResult = await requirePermission(request, 'users.view');

        if (!permissionResult.success) {
            return permissionResult.response;
        }

        const { searchParams } = new URL(request.url);

        const search = searchParams.get('search')?.trim() || '';
        const role = searchParams.get('role')?.trim() || '';
        const accountStatus = searchParams.get('status')?.trim() || '';

        const page = Math.max(Number(searchParams.get('page') || '1'), 1);

        const limit = Math.min(Math.max(Number(searchParams.get('limit') || '10'), 1), 100);

        const skip = (page - 1) * limit;

        const filter: Record<string, unknown> = {};

        if (search) {
            const searchRegex = new RegExp(search, 'i');

            filter.$or = [
                { name: searchRegex },
                { email: searchRegex },
                { username: searchRegex },
                { mobileNumber: searchRegex },
            ];
        }

        if (role) {
            filter.role = role;
        }

        if (accountStatus) {
            filter.accountStatus = accountStatus;
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select(
                    'name email username mobileNumber role accountStatus lastLoginAt createdAt updatedAt',
                )
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            User.countDocuments(filter),
        ]);

        return NextResponse.json({
            success: true,
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get users error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Something went wrong while fetching users',
            },
            { status: 500 },
        );
    }
}

export async function POST(request: Request) {
    try {
        await connectDB();

        const permissionResult = await requirePermission(request, 'users.create');

        if (!permissionResult.success) {
            return permissionResult.response;
        }

        const body = await request.json();

        const validationResult = createUserSchema.safeParse(body);

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

        const { name, email, username, mobileNumber, password, role, accountStatus } =
            validationResult.data;

        const existingEmail = await User.findOne({
            email,
        });

        if (existingEmail) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Email is already registered',
                },
                { status: 409 },
            );
        }

        if (username) {
            const existingUsername = await User.findOne({
                username,
            });

            if (existingUsername) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Username is already taken',
                    },
                    { status: 409 },
                );
            }
        }

        const selectedRole = await Role.findOne({
            name: role,
            isActive: true,
        });

        if (!selectedRole) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Selected role is invalid or inactive',
                },
                { status: 400 },
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name,
            email,
            username: username || undefined,
            mobileNumber: mobileNumber || undefined,
            password: hashedPassword,
            role,
            accountStatus,
        });

        return NextResponse.json(
            {
                success: true,
                message: 'User created successfully',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    username: user.username,
                    mobileNumber: user.mobileNumber,
                    role: user.role,
                    accountStatus: user.accountStatus,
                    lastLoginAt: user.lastLoginAt,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                },
            },
            { status: 201 },
        );
    } catch (error) {
        console.error('Create user error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Something went wrong while creating user',
            },
            { status: 500 },
        );
    }
}
