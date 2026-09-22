import { NextResponse } from 'next/server';

import { verifyAccessToken } from '@/lib/jwt';

export interface AuthenticatedUser {
    userId: string;
    role: string;
}

function getAccessTokenFromRequest(request: Request): string | null {
    const cookieHeader = request.headers.get('cookie');

    if (!cookieHeader) {
        return null;
    }

    const accessToken = cookieHeader
        .split(';')
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith('accessToken='))
        ?.split('=')
        .slice(1)
        .join('=');

    return accessToken || null;
}

export function requireAuth(
    request: Request,
): { success: true; user: AuthenticatedUser } | { success: false; response: NextResponse } {
    const accessToken = getAccessTokenFromRequest(request);

    if (!accessToken) {
        return {
            success: false,
            response: NextResponse.json(
                {
                    success: false,
                    message: 'Authentication required',
                },
                { status: 401 },
            ),
        };
    }

    try {
        const payload = verifyAccessToken(accessToken);

        return {
            success: true,
            user: {
                userId: payload.userId,
                role: payload.role,
            },
        };
    } catch {
        return {
            success: false,
            response: NextResponse.json(
                {
                    success: false,
                    message: 'Invalid or expired access token',
                },
                { status: 401 },
            ),
        };
    }
}
