import { NextResponse } from 'next/server';
import { createHash } from 'crypto';

import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Session from '@/models/Session';

import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@/lib/jwt';

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

        if (!refreshToken) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Refresh token is missing',
                },
                { status: 401 },
            );
        }

        let payload;

        try {
            payload = verifyRefreshToken(refreshToken);
        } catch {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid or expired refresh token',
                },
                { status: 401 },
            );
        }

        const refreshTokenHash = createHash('sha256').update(refreshToken).digest('hex');

        const session = await Session.findOne({
            _id: payload.sessionId,
            userId: payload.userId,
            refreshTokenHash,
            expiresAt: { $gt: new Date() },
        }).select('+refreshTokenHash');

        if (!session) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Session is invalid or expired',
                },
                { status: 401 },
            );
        }

        const user = await User.findById(payload.userId);

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'User not found',
                },
                { status: 401 },
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

        /*
         * Generate new Access Token
         */
        const accessToken = generateAccessToken({
            userId: user._id.toString(),
            role: user.role,
        });

        /*
         * Generate new Refresh Token
         */
        const newRefreshToken = generateRefreshToken({
            userId: user._id.toString(),
            sessionId: session._id.toString(),
        });

        /*
         * Hash new Refresh Token before storing it
         */
        const newRefreshTokenHash = createHash('sha256').update(newRefreshToken).digest('hex');

        session.refreshTokenHash = newRefreshTokenHash;

        await session.save();

        const response = NextResponse.json(
            {
                success: true,
                message: 'Tokens refreshed successfully',
            },
            { status: 200 },
        );

        /*
         * New Access Token Cookie
         */
        response.cookies.set('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 15 * 60,
        });

        /*
         * New Refresh Token Cookie
         */
        response.cookies.set('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 30 * 24 * 60 * 60,
        });

        return response;
    } catch (error) {
        console.error('Refresh token error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Something went wrong while refreshing token',
            },
            { status: 500 },
        );
    }
}
