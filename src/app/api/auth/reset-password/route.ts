import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { resetPasswordSchema } from '@/lib/validations/auth';

export async function POST(request: Request) {
    try {
        await connectDB();

        const body = await request.json();

        const validationResult = resetPasswordSchema.safeParse(body);

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

        const { token, password } = validationResult.data;

        /*
         * Hash the token received from the user.
         */
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        /*
         * Find a user with:
         * - matching token hash
         * - token not expired
         */
        const user = await User.findOne({
            passwordResetToken: tokenHash,
            passwordResetTokenExpiry: {
                $gt: new Date(),
            },
        }).select('+passwordResetToken +passwordResetTokenExpiry');

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid or expired password reset token',
                },
                { status: 400 },
            );
        }

        /*
         * Hash the new password.
         */
        const hashedPassword = await bcrypt.hash(password, 12);

        user.password = hashedPassword;

        /*
         * Invalidate the reset token immediately.
         */
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpiry = undefined;

        /*
         * Optional security improvement:
         * reset failed-login state after successful password reset.
         */
        user.failedLoginAttempts = 0;
        user.lockedUntil = undefined;

        await user.save();

        return NextResponse.json(
            {
                success: true,
                message: 'Password has been reset successfully',
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Reset password error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Something went wrong. Please try again later.',
            },
            { status: 500 },
        );
    }
}
