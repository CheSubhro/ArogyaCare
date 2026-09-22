import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';
import { seedPermissions } from '@/lib/seed/permissions';

export async function POST() {
    try {
        await connectDB();

        await seedPermissions();

        return NextResponse.json(
            {
                success: true,
                message: 'Permissions seeded successfully',
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Permission seed error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to seed permissions',
            },
            { status: 500 },
        );
    }
}
