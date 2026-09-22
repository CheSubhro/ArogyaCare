import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';
import { seedRoles } from '@/lib/seed/roles';

export async function POST() {
    try {
        await connectDB();

        await seedRoles();

        return NextResponse.json(
            {
                success: true,
                message: 'Roles seeded successfully',
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Role seed error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to seed roles',
            },
            { status: 500 },
        );
    }
}