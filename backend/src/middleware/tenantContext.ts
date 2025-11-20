import { Request, Response, NextFunction } from 'express';
import { TenantModel } from '../models/Tenant';

// Extend Express Request to include tenant information
declare global {
    namespace Express {
        interface Request {
            tenant?: {
                id: string;
                slug: string;
                name: string;
            };
            tenantId?: string;
        }
    }
}

/**
 * Extract tenant from URL slug
 * Extract tenant slug from URL
 * Validates tenant exists and is active
 * Attaches tenant info to request object
 *
*/
export const extractTenantFromSlug = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { tenantSlug } = req.params;

        if (!tenantSlug) {
            return res.status(400).json({
                error: 'Tenant slug is required',
                hint: 'URL should be like /t/your-company/auth/login'
            });
        }

        // Find tenant by slug
        const tenant = await TenantModel.findBySlug(tenantSlug);

        if (!tenant) {
            return res.status(404).json({
                error: 'Tenant not found',
                slug: tenantSlug
            });
        }

        if (!tenant.is_active) {
            return res.status(403).json({
                error: 'Tenant is not active',
                message: 'This organization has been deactivated. Please contact support.'
            });
        }

        // Attach tenant information to request
        req.tenant = {
            id: tenant.id,
            slug: tenant.slug,
            name: tenant.name,
        };
        req.tenantId = tenant.id;

        next();
    } catch (error) {
        console.error('Tenant extraction error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/* Extract tenant from JWT token
 * Used for authenticate middleware has run
 */

export const extractTenantFromToken = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = (req as any).user;

        if (!user || !user.tenantId) {
            return res.status(401).json({
                error: 'Tenant context not found in token',
                hint: 'Please login again'
            });
        }

        req.tenantId = user.tenantId;
        next();
    } catch (error) {
        console.error('Tenant token extraction error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Validate that URL tenant matches JWT tenant
 * "Prevents cross-tenant attacks"
 */

export const validateTenantMatch = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const urlTenantId = req.tenantId;
        const tokenTenantId = (req as any).user?.tenantId;

        if (!urlTenantId || !tokenTenantId) {
            return res.status(400).json({
                error: 'Missing tenant context',
                hint: 'Authentication error - please login again'
            });
        }

        if (urlTenantId !== tokenTenantId) {
            // Log security incident
            console.warn('SECURITY WARNING: Tenant mismatch attack attempt', {
                urlTenantId,
                tokenTenantId,
                userId: (req as any).user?.userId,
                ip: req.ip,
                userAgent: req.get('user-agent'),
                timestamp: new Date().toISOString(),
            });

            return res.status(403).json({
                error: 'Tenant mismatch',
                message: 'You cannot access resources from a different organization'
            });
        }
        next();
    } catch (error) {
        console.error('Tenant validation error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};