import { NextResponse } from 'next/server';
import crypto from 'crypto';

import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        await connectDB();

        const body = await request.json();

        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

        if (!email) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Email is required',
                },
                { status: 400 },
            );
        }

        const user = await User.findOne({ email });

        /*
         * Do not reveal whether an email exists.
         */
        if (!user) {
            return NextResponse.json(
                {
                    success: true,
                    message:
                        'If an account exists with this email, a password reset link has been sent.',
                },
                { status: 200 },
            );
        }

        /*
         * Generate a cryptographically secure reset token.
         */
        const resetToken = crypto.randomBytes(32).toString('hex');

        /*
         * Store only the hash of the token.
         */
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

        /*
         * Token expires after 15 minutes.
         */
        const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

        user.passwordResetToken = resetTokenHash;
        user.passwordResetTokenExpiry = resetTokenExpiry;

        await user.save();

        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

        await sendEmail({
            to: user.email,
            subject: 'Reset your ArogyaCare Diagnostics password',
            html: `
        <p>Hello ${user.name},</p>

        <p>
          We received a request to reset your ArogyaCare Diagnostics
          account password.
        </p>

        <p>
          <a href="${resetUrl}">
            Reset Password
          </a>
        </p>

        <p>
          This link will expire in 15 minutes.
        </p>

        <p>
          If you did not request a password reset, you can safely ignore
          this email.
        </p>

        <p>
          Regards,<br />
          ArogyaCare Diagnostics
        </p>
      `,
        });

        return NextResponse.json(
            {
                success: true,
                message:
                    'If an account exists with this email, a password reset link has been sent.',
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Forgot password error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Something went wrong. Please try again later.',
            },
            { status: 500 },
        );
    }
}
