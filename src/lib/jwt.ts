import jwt from 'jsonwebtoken';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

if (!JWT_ACCESS_SECRET) {
    throw new Error('JWT_ACCESS_SECRET is not defined in .env.local');
}

export interface AccessTokenPayload {
    userId: string;
    role: string;
}

export function generateAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, JWT_ACCESS_SECRET, {
        expiresIn: '15m',
    });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, JWT_ACCESS_SECRET) as AccessTokenPayload;
}
