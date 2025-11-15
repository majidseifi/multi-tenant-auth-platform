import jwt, { JwtPayload } from 'jsonwebtoken';
import pool from '../config/database';
import crypto from 'crypto';
export interface TokenPayload {
    userId: number;
    email: string;
    role: string;
}

export class JWTService {
    static generateAccessToken(payload: TokenPayload): string {
        return jwt.sign(
            { ...payload, jti: crypto.randomUUID() },
            process.env.JWT_ACCESS_SECRET!,
            { expiresIn: '15m' });
    }

    static generateRefreshToken(payload: TokenPayload): string {
        return jwt.sign({ ...payload, jti: crypto.randomUUID() },
            process.env.JWT_REFRESH_SECRET!,
            { expiresIn: '7d' })
    }

    static verifyAccessToken(token: string): TokenPayload {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;
        return {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
        }
    }

    static verifyRefreshToken(token: string): TokenPayload {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any;
        return {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
        }
    }

    static async storeRefreshToken(userId: number, token: string): Promise<void> {
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await pool.query(
            'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [userId, token, expiresAt]
        );
    }

    static async validateRefreshToken(token: string): Promise<boolean> {
        const result = await pool.query(
            'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
            [token]
        );

        return result.rows.length > 0;
    }

    static async revokeRefreshToken(token: string): Promise<void> {
        await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
    }

    static async revokeAllUserTokens(userId: number): Promise<void> {
        await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
    }
}