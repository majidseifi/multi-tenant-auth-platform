import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { extractTenantFromSlug, validateTenantMatch } from '../middleware/tenantContext';

const router = Router();

// Helper middleware to check for admin role
const requireAdmin = (req: any, res: any, next: any) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// All user routes are tenant-scoped and require authentication
router.get(
    '/t/:tenantSlug/users',
    extractTenantFromSlug,
    authenticate,
    validateTenantMatch,
    requireAdmin,
    UserController.getAll
);

router.patch(
    '/t/:tenantSlug/users/:userId/role',
    extractTenantFromSlug,
    authenticate,
    validateTenantMatch,
    requireAdmin,
    UserController.updateRole
);

export default router;