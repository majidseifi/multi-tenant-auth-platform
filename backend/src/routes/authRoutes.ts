import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { rateLimiter } from '../middleware/ratelimiter';

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
router.post('/register', rateLimiter(5, 60000), registerValidation, AuthController.register);
router.post('/login', rateLimiter(5, 60000), loginValidation, AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.get('/me', authenticate, AuthController.me);

export default router;