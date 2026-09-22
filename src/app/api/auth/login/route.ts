import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Session from '@/models/Session';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { loginSchema } from '@/lib/validations/auth';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

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

        const normalizedIdentifier = identifier.trim().toLowerCase();

        /*
         * Find user by email OR username.
         *
         * Explicitly select security fields because some
         * of them are select:false in the schema.
         */
        const user = await User.findOne({
            $or: [{ email: normalizedIdentifier }, { username: normalizedIdentifier }],
        }).select('+password +failedLoginAttempts +lockedUntil');

        /*
         * Do not reveal whether the account exists.
         */
        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid email/username or password',
                },
                { status: 401 },
            );
        }

        /*
         * Check account status.
         */
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
         * Check temporary account lock.
         */
        if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
            const remainingMinutes = Math.ceil(
                (user.lockedUntil.getTime() - Date.now()) / (60 * 1000),
            );

            return NextResponse.json(
                {
                    success: false,
                    message: `Account is temporarily locked. Please try again in ${remainingMinutes} minute(s).`,
                },
                { status: 403 },
            );
        }

        /*
         * If lock has expired, clear it.
         */
        if (user.lockedUntil && user.lockedUntil.getTime() <= Date.now()) {
            user.lockedUntil = undefined;
            user.failedLoginAttempts = 0;

            await user.save();
        }

        /*
         * Verify password.
         */
        const isPasswordValid = await bcrypt.compare(password, user.password);

        /*
         * Handle incorrect password.
         */
        if (!isPasswordValid) {
            user.failedLoginAttempts += 1;

            /*
             * Lock account after maximum failed attempts.
             */
            if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
                user.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);

                await user.save();

                return NextResponse.json(
                    {
                        success: false,
                        message:
                            'Too many failed login attempts. Your account has been temporarily locked for 15 minutes.',
                    },
                    { status: 403 },
                );
            }

            await user.save();

            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid email/username or password',
                    remainingAttempts: MAX_FAILED_ATTEMPTS - user.failedLoginAttempts,
                },
                { status: 401 },
            );
        }

        /*
         * Successful login:
         * reset failed login security state.
         */
        user.failedLoginAttempts = 0;
        user.lockedUntil = undefined;

        /*
         * Capture request IP.
         */
        const forwardedFor = request.headers.get('x-forwarded-for');

        const realIp = request.headers.get('x-real-ip');

        const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || undefined;

        user.lastLoginAt = new Date();
        user.lastLoginIp = ipAddress;

        await user.save();

        /*
         * Create session.
         */
        const session = await Session.create({
            userId: user._id,
            refreshTokenHash: 'temporary',
            userAgent: request.headers.get('user-agent') || undefined,
            ipAddress,
            expiresAt: new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000),
        });

        /*
         * Generate JWT tokens.
         */
        const accessToken = generateAccessToken({
            userId: user._id.toString(),
            role: user.role,
        });

        const refreshToken = generateRefreshToken({
            userId: user._id.toString(),
            sessionId: session._id.toString(),
        });

        /*
         * Store only the hash of the refresh token.
         */
        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

        session.refreshTokenHash = refreshTokenHash;

        await session.save();

        /*
         * Cookie configuration.
         */
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

        response.cookies.set({
            name: 'accessToken',
            value: accessToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 15 * 60,
        });

        response.cookies.set({
            name: 'refreshToken',
            value: refreshToken,
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