import pool from '../config/database';

// Tenant model interface, Each tenant has isolated user data
export interface Tenant {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    primary_color: string;
    secondary_color: string;
    plan: 'free' | 'starter' | 'professional' | 'enterprise';
    max_users: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface CreateTenantInput {
    name: string;
    slug: string;
    plan?: 'free' | 'starter' | 'professional' | 'enterprise';
}

export interface UpdateTenantInput {
    name?: string;
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    plan?: 'free' | 'starter' | 'professional' | 'enterprise';
    max_users?: number;
    is_active?: boolean;
}

export class TenantModel {
    // Create a new tenant
    // Used when a company signs up for the platform
    static async create(input: CreateTenantInput): Promise<Tenant> {
        const { name, slug, plan = 'free' } = input;

        // Validate slug format
        if (!slug.match(/^[a-z0-9-]+$/)) {
            throw new Error('Slug must contain only lowercase letters, numbers, and hyphens');
        }

        // Set max_users based on plan
        const maxUsersByPlan: Record<string, number> = {
            free: 10,
            starter: 50,
            professional: 200,
            enterprise: 1000
        };

        const maxUsers = maxUsersByPlan[plan] || 10;

        const result = await pool.query(
            `INSERT INTO tenants (name, slug, plan, primary_color, secondary_color, max_users, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [name, slug, plan, '#007bff', '#6c757d', maxUsers, true]
        );

        return result.rows[0];
    }

    // Find tenant by ID

    static async findById(id: string): Promise<Tenant | null> {
        const result = await pool.query(
            'SELECT * FROM tenants WHERE id = $1',
            [id]
        );

        return result.rows[0] || null;
    }

    // Find tenant by slug

    static async findBySlug(slug: string): Promise<Tenant | null> {
        const result = await pool.query(
            'SELECT * FROM tenants WHERE slug = $1',
            [slug]
        );

        return result.rows[0] || null;
    }

    // Update tenant information

    static async update(id: string, updates: UpdateTenantInput): Promise<Tenant | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        // Dynamically build UPDATE query
        for (const [key, value] of Object.entries(updates)) {
            if (value !== undefined) {
                fields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        }

        if (fields.length === 0) {
            return this.findById(id);
        }

        values.push(id);
        const result = await pool.query(
            `UPDATE tenants
            SET ${fields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *`,
            values
        );

        return result.rows[0] || null;
    }

    // Get user count for a tenant

    static async getUserCount(tenantId: string): Promise<number> {
        const result = await pool.query(
            'SELECT COUNT(*) as count FROM users WHERE tenant_id = $1',
            [tenantId]
        );
        return parseInt(result.rows[0].count, 10);
    }

    // Check if tenant can add more users (based on plan limits)

    static async canAddUser(tenantId: string): Promise<boolean> {
        const tenant = await this.findById(tenantId);
        if (!tenant || !tenant.is_active) {
            return false;
        }
        const userCount = await this.getUserCount(tenantId);
        return userCount < tenant.max_users;
    }

    // Check if slug is available

    static async isSlugAvailable(slug: string): Promise<boolean> {
        const result = await pool.query(
            'SELECT id FROM tenants WHERE slug = $1',
            [slug]
        );
        return result.rows.length === 0
    }

    // List all tenants (platform admin only)
    static async findAll(limit = 50, offset = 0): Promise<Tenant[]> {
        const result = await pool.query(
            `SELECT * FROM tenants
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        return result.rows;
    }

    // Soft delete tenant (set inactive instead of deleting)
    static async deactivate(id: string): Promise<boolean> {
        const result = await pool.query(
            'UPDATE tenants SET is_active = false WHERE id = $1',
            [id]
        );
        return (result.rowCount ?? 0) > 0;
    }
}