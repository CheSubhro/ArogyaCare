import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { registerSchema } from '@/lib/validations/auth';

export async function POST(request: Request) {
    try {
        await connectDB();

        const body = await request.json();

        const validationResult = registerSchema.safeParse(body);

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

        const { name, email, username, mobileNumber, password } = validationResult.data;

        const existingEmail = await User.findOne({
            email,
        });

        if (existingEmail) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Email is already registered',
                },
                { status: 409 },
            );
        }

        if (username) {
            const existingUsername = await User.findOne({
                username,
            });

            if (existingUsername) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Username is already taken',
                    },
                    { status: 409 },
                );
            }
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name,
            email,
            username: username || undefined,
            mobileNumber: mobileNumber || undefined,
            password: hashedPassword,

            // User cannot control these values
            role: 'USER',
            accountStatus: 'ACTIVE',
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Registration successful',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    accountStatus: user.accountStatus,
                },
            },
            { status: 201 },
        );
    } catch (error) {
        console.error('Registration error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Something went wrong during registration',
            },
            { status: 500 },
        );
    }
}
