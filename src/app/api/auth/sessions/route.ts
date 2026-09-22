import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import Session from '@/models/Session';

export async function GET(request: Request) {
    try {
        const authResult = requireAuth(request);

        if (!authResult.success) {
            return authResult.response;
        }

        await connectDB();

        const sessions = await Session.find({
            userId: authResult.user.userId,
            expiresAt: {
                $gt: new Date(),
            },
        })
            .select('_id userAgent ipAddress expiresAt createdAt updatedAt')
            .sort({
                createdAt: -1,
            })
            .lean();

        return NextResponse.json(
            {
                success: true,
                sessions: sessions.map((session) => ({
                    id: session._id,
                    userAgent: session.userAgent,
                    ipAddress: session.ipAddress,
                    createdAt: session.createdAt,
                    updatedAt: session.updatedAt,
                    expiresAt: session.expiresAt,
                })),
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Get active sessions error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch active sessions',
            },
            { status: 500 },
        );
    }
}
