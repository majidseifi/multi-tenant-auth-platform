import { Router, Request } from 'express'
import { authenticate, authorize } from "../middleware/auth";
import { UserModel } from '../models/User';

const router = Router();

// Get all users (admin only)
router.get('/', authenticate, authorize('admin'), async (req: Request, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        const users = await UserModel.getAll(limit, offset);
        return res.status(200).json({ users })
    } catch (error) {
        console.error('Get users error', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user role (admin only)
router.patch('/:userId/role', authenticate, authorize('admin'), async (req: Request, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!['admin', 'user', 'viewer'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        await UserModel.updateRole(parseInt(userId), role);
        return res.status(200).json({ message: 'Role updated successfully' });
    } catch (error) {
        console.error('Update role error:', error);
        return res.status(500).json({ error: 'Internal server error' })
    }
});

export default router;