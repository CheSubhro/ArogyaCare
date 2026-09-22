import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import Session from '@/models/Session';

interface RouteContext {
    params: Promise<{
        sessionId: string;
    }>;
}

export async function DELETE(request: Request, context: RouteContext) {
    try {
        const authResult = requireAuth(request);

        if (!authResult.success) {
            return authResult.response;
        }

        const { sessionId } = await context.params;

        if (!sessionId) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Session ID is required',
                },
                { status: 400 },
            );
        }

        await connectDB();

        const deletedSession = await Session.findOneAndDelete({
            _id: sessionId,
            userId: authResult.user.userId,
        });

        if (!deletedSession) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Session not found',
                },
                { status: 404 },
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: 'Session revoked successfully',
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Revoke session error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to revoke session',
            },
            { status: 500 },
        );
    }
}
