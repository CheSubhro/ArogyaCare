import { NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth';

export async function GET(request: Request) {
    const authResult = requireRole(request, ['SUPER_ADMIN', 'ADMIN']);

    if (!authResult.success) {
        return authResult.response;
    }

    return NextResponse.json(
        {
            success: true,
            message: 'Admin endpoint accessed successfully',
            user: authResult.user,
        },
        { status: 200 },
    );
}
