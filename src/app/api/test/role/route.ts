import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import Role from '@/models/Role';

export async function GET(request: Request) {
    const authResult = requireAuth(request);

    if (!authResult.success) {
        return authResult.response;
    }

    try {
        await connectDB();

        const role = await Role.findOne({
            name: authResult.user.role,
            isActive: true,
        }).select('name description permissions isSystemRole isActive');

        if (!role) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'User role is not configured in the system',
                },
                { status: 403 },
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: 'User role verified successfully',
                user: {
                    userId: authResult.user.userId,
                    role: authResult.user.role,
                },
                role: {
                    name: role.name,
                    description: role.description,
                    permissionCount: role.permissions.length,
                    isSystemRole: role.isSystemRole,
                    isActive: role.isActive,
                },
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Role verification error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to verify user role',
            },
            { status: 500 },
        );
    }
}
