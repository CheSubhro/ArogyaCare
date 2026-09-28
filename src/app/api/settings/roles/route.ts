import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';
import { requirePermission } from '@/lib/auth';

import Role from '@/models/Role';

export async function GET(request: Request) {
    try {
        await connectDB();

        const permissionResult = await requirePermission(request, 'users.view');

        if (!permissionResult.success) {
            return permissionResult.response;
        }

        const roles = await Role.find({
            isActive: true,
        })
            .select('name description isSystemRole isActive')
            .sort({ name: 1 })
            .lean();

        return NextResponse.json({
            success: true,
            roles,
        });
    } catch (error) {
        console.error('Get roles error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Something went wrong while fetching roles',
            },
            { status: 500 },
        );
    }
}
