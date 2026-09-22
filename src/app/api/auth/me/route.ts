import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { verifyAccessToken } from '@/lib/jwt';

export async function GET(request: Request) {
    try {
        await connectDB();

        const accessToken = request.headers
            .get('cookie')
            ?.split(';')
            .map((cookie) => cookie.trim())
            .find((cookie) => cookie.startsWith('accessToken='))
            ?.split('=')
            .slice(1)
            .join('=');

        if (!accessToken) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Authentication required',
                },
                { status: 401 },
            );
        }

        let payload;

        try {
            payload = verifyAccessToken(accessToken);
        } catch {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid or expired access token',
                },
                { status: 401 },
            );
        }

        const user = await User.findById(payload.userId).select('-password');

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'User not found',
                },
                { status: 404 },
            );
        }

        if (user.accountStatus !== 'ACTIVE') {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Your account is inactive',
                },
                { status: 403 },
            );
        }

        return NextResponse.json(
            {
                success: true,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    username: user.username,
                    mobileNumber: user.mobileNumber,
                    role: user.role,
                    accountStatus: user.accountStatus,
                    emailVerified: user.emailVerified,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                },
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Get current user error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Something went wrong',
            },
            { status: 500 },
        );
    }
}
