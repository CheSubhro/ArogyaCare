import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';
import Session from '@/models/Session';
import { requireAuth } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const authResult = requireAuth(request);

        if (!authResult.success) {
            return authResult.response;
        }

        await connectDB();

        /*
         * Delete all active sessions belonging
         * to the authenticated user.
         */
        const result = await Session.deleteMany({
            userId: authResult.user.userId,
        });

        /*
         * Clear current browser cookies as well.
         */
        const response = NextResponse.json(
            {
                success: true,
                message: 'Logged out from all devices successfully',
                sessionsRevoked: result.deletedCount,
            },
            { status: 200 },
        );

        response.cookies.set({
            name: 'accessToken',
            value: '',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0,
        });

        response.cookies.set({
            name: 'refreshToken',
            value: '',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0,
        });

        return response;
    } catch (error) {
        console.error('Logout all devices error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Something went wrong while logging out from all devices',
            },
            { status: 500 },
        );
    }
}
