import pool from '../config/database';
import bcrypt from 'bcrypt';

export interface User {
    id: number;
    email: string;
    password_hash: string;
    first_name?: string;
    last_name?: string;
    role: 'admin' | 'user' | 'viewer';
    is_active: boolean;
    failed_login_attempts: number;
    locked_until?: Date;
    email_verified: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface CreateUserInput {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    role?: 'admin' | 'user' | 'viewer';
}

export class UserModel {
    static async create(userData: CreateUserInput): Promise<User> {
        const { email, password, first_name, last_name, role = 'user' } = userData;
        const password_hash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (email, password_hash, first_name, last_name, role)'
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, email, first_name, last_name, role, is_active, email_verified, created_at, updated_at`,
            [email, password_hash, first_name, last_name, role]
        );
        return result.rows[0];
    }

    static async findById(id: number): Promise<User | null> {
        const result = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    }

    static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(plainPassword, hashedPassword);
    }

    static async updateFailedAttempts(userId: number, attempts: number): Promise<void> {
        const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null; // 15 min lock
        await pool.query(
            'UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3',
            [attempts, lockUntil, userId]
        );
    }

    static async resetFailedAttempts(userId: number): Promise<void> {
        await pool.query(
            'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1',
            [userId]
        );
    }

    static async updateRole(userId: number, role: 'admin' | 'user' | 'viewer'): Promise<void> {
        await pool.query('UPDATE users SET role = $1, updated_at= NOW() WHERE id = $2', [role, userId]);
    }

    static async getAll(limit: number = 50, offset: number = 0): Promise<User[]> {
        const result = await pool.query(
            'SELECT id, email, first_name, last_name, role, is_Active, emaol_verified, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );

        return result.rows;
    }

}