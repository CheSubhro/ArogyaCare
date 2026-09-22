import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Session from '@/models/Session';
import { verifyRefreshToken } from '@/lib/jwt';

export async function POST(request: Request) {
    try {
        await connectDB();

        const refreshToken = request.headers
            .get('cookie')
            ?.split(';')
            .map((cookie) => cookie.trim())
            .find((cookie) => cookie.startsWith('refreshToken='))
            ?.split('=')
            .slice(1)
            .join('=');

        if (refreshToken) {
            try {
                const payload = verifyRefreshToken(refreshToken);

                await Session.findOneAndDelete({
                    _id: payload.sessionId,
                    userId: payload.userId,
                });
            } catch {
                // Invalid or expired refresh token.
                // We still clear the cookies below.
            }
        }

        const response = NextResponse.json(
            {
                success: true,
                message: 'Logout successful',
            },
            { status: 200 },
        );

        response.cookies.set('accessToken', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0,
        });

        response.cookies.set('refreshToken', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0,
        });

        return response;
    } catch (error) {
        console.error('Logout error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Something went wrong during logout',
            },
            { status: 500 },
        );
    }
}
