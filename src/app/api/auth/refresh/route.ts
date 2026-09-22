import { NextResponse } from 'next/server';
import crypto from 'crypto';

import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Session from '@/models/Session';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@/lib/jwt';

function getRefreshTokenFromRequest(request: Request): string | null {
    const cookieHeader = request.headers.get('cookie');

    if (!cookieHeader) {
        return null;
    }

    const refreshToken = cookieHeader
        .split(';')
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith('refreshToken='))
        ?.split('=')
        .slice(1)
        .join('=');

    return refreshToken || null;
}

function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

export async function POST(request: Request) {
    try {
        await connectDB();

        const refreshToken = getRefreshTokenFromRequest(request);

        if (!refreshToken) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Refresh token is required',
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

        const refreshTokenHash = hashToken(refreshToken);

        /*
         * Find the session using:
         * - session ID
         * - user ID
         * - hashed refresh token
         * - non-expired session
         */
        const session = await Session.findOne({
            _id: payload.sessionId,
            userId: payload.userId,
            refreshTokenHash,
            expiresAt: {
                $gt: new Date(),
            },
        }).select('+refreshTokenHash');

        /*
         * Token itself is valid, but it does not match
         * the currently stored refresh token.
         *
         * This can indicate refresh-token reuse.
         */
        if (!session) {
            /*
             * Revoke the session associated with the
             * refresh token payload.
             */
            await Session.deleteOne({
                _id: payload.sessionId,
                userId: payload.userId,
            });

            return NextResponse.json(
                {
                    success: false,
                    message: 'Refresh token reuse detected. Session has been revoked.',
                },
                { status: 401 },
            );
        }

        const user = await User.findById(payload.userId);

        if (!user) {
            await Session.deleteOne({
                _id: session._id,
            });

            return NextResponse.json(
                {
                    success: false,
                    message: 'User account not found',
                },
                { status: 401 },
            );
        }

        if (user.accountStatus !== 'ACTIVE') {
            await Session.deleteOne({
                _id: session._id,
            });

            return NextResponse.json(
                {
                    success: false,
                    message: 'Your account is inactive',
                },
                { status: 403 },
            );
        }

        /*
         * Generate new token pair.
         */
        const newAccessToken = generateAccessToken({
            userId: user._id.toString(),
            role: user.role,
        });

        const newRefreshToken = generateRefreshToken({
            userId: user._id.toString(),
            sessionId: session._id.toString(),
        });

        const newRefreshTokenHash = hashToken(newRefreshToken);

        /*
         * Rotate refresh token.
         */
        session.refreshTokenHash = newRefreshTokenHash;

        await session.save();

        const response = NextResponse.json(
            {
                success: true,
                message: 'Token refreshed successfully',
            },
            { status: 200 },
        );

        response.cookies.set({
            name: 'accessToken',
            value: newAccessToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 15 * 60,
        });

        response.cookies.set({
            name: 'refreshToken',
            value: newRefreshToken,
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
                message: 'Something went wrong while refreshing the token',
            },
            { status: 500 },
        );
    }
}
