import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { TenantModel } from '../models/Tenant';
import { off } from 'process';

export class UserController {
    // Get all users (tenant-scoped, admin only)

    static async getAll(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenantId;
            const limit = parseInt(req.query.limit as string) || 50;
            const offset = parseInt(req.query.offset as string) || 0;

            const users = await UserModel.getAll(tenantId, limit, offset);

            return res.json({ users });
        } catch (error) {
            console.error('Get users error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Update user role (tenant-scoped, admin only)

    static async updateRole(req: Request, res: Response) {
        try {
            const { userId } = req.params;
            const { role } = req.body;
            const tenantId = (req as any).user.tenantId;

            if (!['admin', 'user', 'viewer'].includes(role)) {
                return res.status(400).json({
                    error: 'Invalid role',
                    allowed: ['admin', 'user', 'viewer']
                });
            }

            await UserModel.updateRole(parseInt(userId), tenantId, role);

            return res.json({ message: 'User role updated successfully' });
        } catch (error) {
            console.error('Update role error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}