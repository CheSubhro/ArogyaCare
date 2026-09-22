import { NextResponse } from 'next/server';

import { requirePermission } from '@/lib/auth';

export async function GET(request: Request) {
    const authResult = await requirePermission(request, 'patients.view');

    if (!authResult.success) {
        return authResult.response;
    }

    return NextResponse.json(
        {
            success: true,
            message: 'Patients permission verified successfully',
            user: authResult.user,
            permission: 'patients.view',
        },
        { status: 200 },
    );
}
