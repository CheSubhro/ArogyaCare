import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { loginSchema } from '@/lib/validations/auth';
import { generateAccessToken } from '@/lib/jwt';

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

        const { identifier, password } = validationResult.data;

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

        // Generate JWT Access Token
        const accessToken = generateAccessToken({
            userId: user._id.toString(),
            role: user.role,
        });

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
