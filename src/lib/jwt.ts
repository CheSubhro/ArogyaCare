import jwt from 'jsonwebtoken';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_ACCESS_SECRET) {
    throw new Error('JWT_ACCESS_SECRET is not defined in .env.local');
}

if (!JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not defined in .env.local');
}

export interface AccessTokenPayload {
    userId: string;
    role: string;
}

export interface RefreshTokenPayload {
    userId: string;
    sessionId: string;
}

export function generateAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, JWT_ACCESS_SECRET, {
        expiresIn: '15m',
    });
}

export function generateRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: '30d',
    });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
    return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;
}
