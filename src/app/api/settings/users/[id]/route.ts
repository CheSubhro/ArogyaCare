import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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

function isValidObjectId(id: string) {
    return mongoose.Types.ObjectId.isValid(id);
}

function sanitizeUser(user: any) {
    return {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        mobileNumber: user.mobileNumber,
        role: user.role,
        accountStatus: user.accountStatus,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}

/**
 * GET USER
 */
export async function GET(request: Request, context: RouteContext) {
    try {
        const permissionResult = await requirePermission(request, 'users.view');

        if (!permissionResult.success) {
            return permissionResult.response;
        }

        await connectDB();

        const { id } = await context.params;

        if (!isValidObjectId(id)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid user ID',
                },
                { status: 400 },
            );
        }

        const user = await User.findById(id).select(
            'name email username mobileNumber role accountStatus emailVerified lastLoginAt createdAt updatedAt',
        );

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
            user: sanitizeUser(user),
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

/**
 * UPDATE USER
 */
export async function PATCH(request: Request, context: RouteContext) {
    try {
        const permissionResult = await requirePermission(request, 'users.edit');

        if (!permissionResult.success) {
            return permissionResult.response;
        }

        await connectDB();

        const { id } = await context.params;

        if (!isValidObjectId(id)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid user ID',
                },
                { status: 400 },
            );
        }

        const targetUser = await User.findById(id).select(
            '+password +failedLoginAttempts +lockedUntil',
        );

        if (!targetUser) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'User not found',
                },
                { status: 404 },
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

        const data = validationResult.data;

        const isSelf = targetUser._id.toString() === permissionResult.user.userId;

        /*
         * ----------------------------------------------------
         * SECURITY RULE 1
         * User cannot deactivate their own account.
         * ----------------------------------------------------
         */
        if (isSelf && data.accountStatus === 'INACTIVE') {
            return NextResponse.json(
                {
                    success: false,
                    message: 'You cannot deactivate your own account',
                },
                { status: 403 },
            );
        }

        /*
         * ----------------------------------------------------
         * SECURITY RULE 2
         * User cannot change their own role.
         * ----------------------------------------------------
         */
        if (isSelf && data.role && data.role !== targetUser.role) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'You cannot change your own role',
                },
                { status: 403 },
            );
        }

        /*
         * ----------------------------------------------------
         * SECURITY RULE 3
         * SUPER_ADMIN cannot be deactivated by another
         * ordinary administrator.
         *
         * Only SUPER_ADMIN can manage another SUPER_ADMIN.
         * ----------------------------------------------------
         */
        if (targetUser.role === 'SUPER_ADMIN' && permissionResult.user.role !== 'SUPER_ADMIN') {
            if (data.role && data.role !== 'SUPER_ADMIN') {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Only a SUPER_ADMIN can change the role of a SUPER_ADMIN',
                    },
                    { status: 403 },
                );
            }

            if (data.accountStatus && data.accountStatus !== 'ACTIVE') {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Only a SUPER_ADMIN can deactivate a SUPER_ADMIN account',
                    },
                    { status: 403 },
                );
            }

            if (data.password) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Only a SUPER_ADMIN can change the password of a SUPER_ADMIN',
                    },
                    { status: 403 },
                );
            }
        }

        /*
         * ----------------------------------------------------
         * SECURITY RULE 4
         * Prevent the last active SUPER_ADMIN from being
         * deactivated or demoted.
         * ----------------------------------------------------
         */
        if (
            targetUser.role === 'SUPER_ADMIN' &&
            permissionResult.user.role === 'SUPER_ADMIN' &&
            (data.accountStatus === 'INACTIVE' || (data.role && data.role !== 'SUPER_ADMIN'))
        ) {
            const activeSuperAdmins = await User.countDocuments({
                role: 'SUPER_ADMIN',
                accountStatus: 'ACTIVE',
            });

            if (activeSuperAdmins <= 1) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'The last active SUPER_ADMIN cannot be deactivated or demoted',
                    },
                    { status: 403 },
                );
            }
        }

        /*
         * ----------------------------------------------------
         * EMAIL DUPLICATE CHECK
         * ----------------------------------------------------
         */
        if (data.email && data.email !== targetUser.email) {
            const existingEmail = await User.findOne({
                email: data.email,
                _id: { $ne: targetUser._id },
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
        }

        /*
         * ----------------------------------------------------
         * USERNAME DUPLICATE CHECK
         * ----------------------------------------------------
         */
        if (data.username && data.username !== targetUser.username) {
            const existingUsername = await User.findOne({
                username: data.username,
                _id: { $ne: targetUser._id },
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

        /*
         * ----------------------------------------------------
         * ROLE VALIDATION
         * ----------------------------------------------------
         */
        if (data.role) {
            const role = await Role.findOne({
                name: data.role,
                isActive: true,
            });

            if (!role) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Selected role is invalid or inactive',
                    },
                    { status: 400 },
                );
            }
        }

        /*
         * ----------------------------------------------------
         * UPDATE BASIC FIELDS
         * ----------------------------------------------------
         */
        if (data.name !== undefined) {
            targetUser.name = data.name;
        }

        if (data.email !== undefined) {
            targetUser.email = data.email;
        }

        if (data.username !== undefined) {
            targetUser.username = data.username || undefined;
        }

        if (data.mobileNumber !== undefined) {
            targetUser.mobileNumber = data.mobileNumber || undefined;
        }

        if (data.role !== undefined) {
            targetUser.role = data.role;
        }

        if (data.accountStatus !== undefined) {
            targetUser.accountStatus = data.accountStatus;
        }

        /*
         * ----------------------------------------------------
         * PASSWORD CHANGE
         * ----------------------------------------------------
         */
        if (data.password) {
            targetUser.password = await bcrypt.hash(data.password, 12);

            /*
             * Reset login security counters after an
             * administrator changes the password.
             */
            targetUser.failedLoginAttempts = 0;
            targetUser.lockedUntil = undefined;
        }

        await targetUser.save();

        return NextResponse.json({
            success: true,
            message: 'User updated successfully',
            user: sanitizeUser(targetUser),
        });
    } catch (error: any) {
        console.error('Update user error:', error);

        /*
         * Handle MongoDB unique index race conditions.
         */
        if (error?.code === 11000) {
            const duplicateField = Object.keys(error.keyPattern || {})[0];

            return NextResponse.json(
                {
                    success: false,
                    message:
                        duplicateField === 'email'
                            ? 'Email is already registered'
                            : duplicateField === 'username'
                              ? 'Username is already taken'
                              : 'Duplicate value already exists',
                },
                { status: 409 },
            );
        }

        return NextResponse.json(
            {
                success: false,
                message: 'Something went wrong while updating user',
            },
            { status: 500 },
        );
    }
}
