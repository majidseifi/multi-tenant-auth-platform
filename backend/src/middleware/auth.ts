import { Request, Response, NextFunction } from 'express';
import { JWTService } from '../utils/jwt';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const payload = JWTService.verifyAccessToken(token);

        req.user = payload;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' })
    }
};

export const authorize = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficent permissions' });
        }

        next();
    }
}