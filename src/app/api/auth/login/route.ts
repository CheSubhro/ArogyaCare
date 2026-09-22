import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { loginSchema } from '@/lib/validations/auth';

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

        return NextResponse.json(
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
