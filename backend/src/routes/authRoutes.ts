import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { rateLimiter } from '../middleware/ratelimiter';
import { extractTenantFromSlug, validateTenantMatch } from '../middleware/tenantContext'

const router = Router()

// Validation rules
const registerValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('first_name').optional().trim().isLength({ min: 1 }),
    body('last_name').optional().trim().isLength({ min: 1 })
];

const loginValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
];

// Routes

// Public routes (no auth required, but tenant-scoped)
router.post(
    '/t/:tenantSlug/auth/register',
    extractTenantFromSlug,
    rateLimiter(5, 60000),
    registerValidation,
    AuthController.register
);

router.post(
    '/t/:tenantSlug/auth/login',
    extractTenantFromSlug,
    rateLimiter(5, 60000),
    loginValidation,
    AuthController.login
)

router.post(
    '/t/:tenantSlug/auth/refresh',
    extractTenantFromSlug,
    AuthController.refresh
)

// Protected routes (require authentication + tenant validation)

router.post(
    '/t/:tenantSlug/auth/logout',
    extractTenantFromSlug,
    authenticate,
    validateTenantMatch,
    AuthController.logout
);

router.post(
    '/t/:tenantSlug/auth/me',
    extractTenantFromSlug,
    authenticate,
    validateTenantMatch,
    AuthController.me
);

export default router;