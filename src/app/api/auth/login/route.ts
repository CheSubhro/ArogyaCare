import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Session from '@/models/Session';

import { loginSchema } from '@/lib/validations/auth';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { createHash } from 'crypto';

export async function POST(request: Request) {
    try {
        await connectDB();

        const body = await request.json();

        const validationResult = loginSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Validation failed',
                    errors: validationResult.error.flatten().fieldErrors,
                },
                { status: 400 },
            );
        }

        const { identifier, password, rememberMe } = validationResult.data;

        const normalizedIdentifier = identifier.toLowerCase();

        const user = await User.findOne({
            $or: [{ email: normalizedIdentifier }, { username: normalizedIdentifier }],
        }).select('+password');

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid email/username or password',
                },
                { status: 401 },
            );
        }

        if (user.accountStatus !== 'ACTIVE') {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Your account is inactive. Please contact the administrator.',
                },
                { status: 403 },
            );
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid email/username or password',
                },
                { status: 401 },
            );
        }

        /*
         * Create temporary session first.
         * We need the session ID inside the refresh token.
         */
        const session = await Session.create({
            userId: user._id,
            refreshTokenHash: 'temporary',
            userAgent: request.headers.get('user-agent') || undefined,
            ipAddress:
                request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                request.headers.get('x-real-ip') ||
                undefined,
            expiresAt: new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000),
        });

        const accessToken = generateAccessToken({
            userId: user._id.toString(),
            role: user.role,
        });

        const refreshToken = generateRefreshToken({
            userId: user._id.toString(),
            sessionId: session._id.toString(),
        });

        const refreshTokenHash = createHash('sha256').update(refreshToken).digest('hex');

        session.refreshTokenHash = refreshTokenHash;

        await session.save();

        const response = NextResponse.json(
            {
                success: true,
                message: 'Login successful',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    accountStatus: user.accountStatus,
                },
            },
            { status: 200 },
        );

        response.cookies.set('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 15 * 60,
        });

        response.cookies.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: (rememberMe ? 30 : 7) * 24 * 60 * 60,
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Something went wrong during login',
            },
            { status: 500 },
        );
    }
}
