import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { TenantModel } from '../models/Tenant';

const router = Router()

// Public Route: Create tenant (company signup)
router.post(
    '/tenants',
    [
        body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Company name is required'),
        body('slug').trim().isLength({ min: 3, max: 50 }).withMessage('Slug must be 3-50 characters')
            .matches(/^[a-z0-9-]+$/).withMessage('Slug can only contain lowercase letters, numbers, and hyphens')
    ],
    async (req: any, res: any) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { name, slug } = req.body;

            // Check if slug available
            const isAvailable = await TenantModel.isSlugAvailable(slug);
            if (!isAvailable) {
                return res.status(409).json({
                    error: 'Slug already taken',
                    message: `The slug "${slug}" is already in use. Please choose another.`,
                    slug
                });
            }

            // Create tenant
            const tenant = await TenantModel.create({ name, slug });

            return res.status(201).json({
                message: 'Tenant created successfully',
                tenant: {
                    id: tenant.id,
                    name: tenant.name,
                    slug: tenant.slug,
                    plan: tenant.plan
                },
                nextSteps: {
                    loginUrl: `/t/${tenant.slug}/auth/login`,
                    registerUrl: `/t/${tenant.slug}/auth/register`
                }
            });
        } catch (error) {
            console.error('Tenant creation error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// Public route: Get tenant info (for branding)
router.get('/tenants/:slug', async (require, res) => {
    try {
        const { slug } = require.params;

        const tenant = await TenantModel.findBySlug(slug);
        if (!tenant) {
            return res.status(404).json({
                error: 'Tenant not found',
                slug
            });
        }

        // Return public tenant info (not sensitive data)
        return res.json({
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            logo_url: tenant.logo_url,
            primary_color: tenant.primary_color,
            secondary_color: tenant.secondary_color,
            is_active: tenant.is_active
        });
    } catch (error) {
        console.error('Tenant fetch error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Protected route: update tenant branding (admin only)

router.patch(
    '/tenants/:id',
    // TODO: add authentication + admin check middleware
    async (req: any, res: any) => {
        try {
            const { id } = req.params;
            const updates = req.body;

            const tenant = await TenantModel.update(id, updates);
            if (!tenant) {
                return res.status(404).json({ error: 'Tenant not found' });
            }

            return res.json({
                message: 'Tenant updated successfully',
                tenant
            });
        } catch (error) {
            console.error('Tenant update error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
);

export default router;