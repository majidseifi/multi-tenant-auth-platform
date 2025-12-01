-- ============================================
-- MULTI-TENANT SCHEMA MIGRATION
-- ============================================
-- This migration adds multi-tenancy support to the existing auth system
-- Author: Majid Seifi Kashani
-- Date: 2025-11-17
-- ============================================

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,

    -- Branding
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#007bff',
    secondary_color VARCHAR(7) DEFAULT '#6c757d',

    -- Subscription info
    plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN('free', 'starter', 'professional', 'enterprise')),
    max_users INTEGER DEFAULT 50,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT slug_lowercase CHECK (slug = lower(slug)),
    CONSTRAINT slug_alphanumeric CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Add tenant_id to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

-- Update email uniqueness constraint
-- Remove global email uniqueness
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- Add per-tenant email uniqueness
ALTER TABLE users
ADD CONSTRAINT users_tenant_email_unique
UNIQUE (tenant_id, email);

-- Add tenant_id to refresh_tokens
ALTER TABLE refresh_tokens
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_tenant_id ON refresh_tokens(tenant_id);

-- Create default tenant for existing data migration
INSERT INTO tenants (name, slug, plan, is_active)
VALUES ('Default Organization', 'default', 'free', true)
ON CONFLICT (slug) DO NOTHING
RETURNING id;

-- Migrate existing users to default tenant
UPDATE users
SET tenant_id = (SELECT id FROM tenants WHERE slug = 'default')
WHERE tenants_id IS NULL;

-- Migrate existing refresh tokens
UPDATE refresh_tokens
SET tenant_id = (SELECT id FROM tenants WHERE slug = 'default')
WHERE tenant_id is NULL;

-- Make tenant_id NOT NULL
ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE refresh_tokens ALTER COLUMN tenant_id  SET NOT NULL;

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.update_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify migration success

SELECT 'Tenants created:' as status, COUNT(*) as count FROM tenants;
SELECT 'Users migrated:' as status, COUNT(*) as count FROM users WHERE tenant_id IS NOT NULL;

Select 'Refresh tokens migrated:' as status, COUNT(*) as count FROM refresh_tokens WHERE tenant_id IS NOT NUlL;

-- Check tenant-user relationship
SELECT
    t.name as tenant_name,
    t.slug as tenant_slug,
    COUNT(u.id) as user_count
FROM tenants t
LEFT JOIN users u ON t.id = u.tenant_id
GROUP BY t.id, t.name, t.slug;
