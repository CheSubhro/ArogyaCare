import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import { connectDB } from '@/lib/db';
import { requirePermission } from '@/lib/auth';

import User from '@/models/User';
import Role from '@/models/Role';

import { updateUserSchema } from '@/lib/validations/user';

interface RouteContext {
    params: Promise<{
        id: string;
    }>;
}

export async function GET(request: Request, context: RouteContext) {
    try {
        await connectDB();

        const permissionResult = await requirePermission(request, 'users.view');

        if (!permissionResult.success) {
            return permissionResult.response;
        }

        const { id } = await context.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid user ID',
                },
                { status: 400 },
            );
        }

        const user = await User.findById(id)
            .select(
                'name email username mobileNumber role accountStatus emailVerified lastLoginAt createdAt updatedAt',
            )
            .lean();

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'User not found',
                },
                { status: 404 },
            );
        }

        return NextResponse.json({
            success: true,
            user,
        });
    } catch (error) {
        console.error('Get user error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Something went wrong while fetching user',
            },
            { status: 500 },
        );
    }
}

export async function PATCH(request: Request, context: RouteContext) {
    try {
        await connectDB();

        const permissionResult = await requirePermission(request, 'users.edit');

        if (!permissionResult.success) {
            return permissionResult.response;
        }

        const { id } = await context.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid user ID',
                },
                { status: 400 },
            );
        }

        const body = await request.json();

        const validationResult = updateUserSchema.safeParse(body);

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

        const existingUser = await User.findById(id);

        if (!existingUser) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'User not found',
                },
                { status: 404 },
            );
        }

        const { name, email, username, mobileNumber, role, accountStatus, password } =
            validationResult.data;

        if (email && email !== existingUser.email) {
            const emailExists = await User.findOne({
                email,
                _id: { $ne: id },
            });

            if (emailExists) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Email is already registered',
                    },
                    { status: 409 },
                );
            }
        }

        if (username && username !== existingUser.username) {
            const usernameExists = await User.findOne({
                username,
                _id: { $ne: id },
            });

            if (usernameExists) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Username is already taken',
                    },
                    { status: 409 },
                );
            }
        }

        if (role && role !== existingUser.role) {
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
        }

        if (name !== undefined) {
            existingUser.name = name;
        }

        if (email !== undefined) {
            existingUser.email = email;
        }

        if (username !== undefined) {
            existingUser.username = username || undefined;
        }

        if (mobileNumber !== undefined) {
            existingUser.mobileNumber = mobileNumber || undefined;
        }

        if (role !== undefined) {
            existingUser.role = role;
        }

        if (accountStatus !== undefined) {
            existingUser.accountStatus = accountStatus;
        }

        if (password) {
            existingUser.password = await bcrypt.hash(password, 12);
        }

        await existingUser.save();

        return NextResponse.json({
            success: true,
            message: 'User updated successfully',
            user: {
                id: existingUser._id,
                name: existingUser.name,
                email: existingUser.email,
                username: existingUser.username,
                mobileNumber: existingUser.mobileNumber,
                role: existingUser.role,
                accountStatus: existingUser.accountStatus,
                lastLoginAt: existingUser.lastLoginAt,
                createdAt: existingUser.createdAt,
                updatedAt: existingUser.updatedAt,
            },
        });
    } catch (error) {
        console.error('Update user error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Something went wrong while updating user',
            },
            { status: 500 },
        );
    }
}
