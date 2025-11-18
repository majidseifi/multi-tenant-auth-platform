import pool from '../config/database';
import bcrypt from 'bcrypt';

export interface User {
    id: number;
    tenant_id: string;
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
    tenant_id: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    role?: 'admin' | 'user' | 'viewer';
}

export class UserModel {
    // Create user - Scoped to tenant

    static async create(userData: CreateUserInput): Promise<User> {
        const { tenant_id, email, password, first_name, last_name, role = 'user' } = userData;
        const password_hash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [tenant_id, email, password_hash, first_name, last_name, role]
        );
        return result.rows[0];
    }

    // Find by Email  - Scoped to tenant

    static async findByEmail(email: string, tenantId: string): Promise<User | null> {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND tenant_id = $2',
            [email, tenantId]
        );
        return result.rows[0] || null;
    }

    // Find by ID  - Scoped to tenant

    static async findById(id: number, tenantId: string): Promise<User | null> {
        const result = await pool.query(
            'SELECT * FROM users WHERE id = $1 AND tenant_id= $2',
            [id, tenantId]
        );
        return result.rows[0] || null;
    }

    // Find by ID (global) for platform admins only
    static async findByIdGlobal(id: number): Promise<User | null> {
        const result = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    }

    // Verify password 

    static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(plainPassword, hashedPassword);
    }

    // Update failed attempts - Scoped to tenant

    static async updateFailedAttempts(userId: number, tenantId: string, attempts: number): Promise<void> {
        const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null; // 15 min lock
        await pool.query(
            'UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3 AND tenant_id = $4',
            [attempts, lockUntil, userId, tenantId]
        );
    }

    // Reset failed attempts - Scoped to tenant

    static async resetFailedAttempts(userId: number, tenantId: string): Promise<void> {
        await pool.query(
            'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1 AND tenant_id = $2',
            [userId, tenantId]
        );
    }

    // Update role - Scoped to tenant

    static async updateRole(userId: number, tenantId: string, role: 'admin' | 'user' | 'viewer'): Promise<void> {
        await pool.query('UPDATE users SET role = $1, updated_at= NOW() WHERE id = $2 AND tenant_id = $3', [role, userId, tenantId]);
    }

    // Get all users - Scoped to tenant

    static async getAll(tenantId: string, limit: number = 50, offset: number = 0): Promise<User[]> {
        const result = await pool.query(
            `SELECT id, email, first_name, last_name, role, is_Active, emaol_verified, created_at
            FROM users
            WHERE tenant_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3`,
            [tenantId, limit, offset]
        );

        return result.rows;
    }

}