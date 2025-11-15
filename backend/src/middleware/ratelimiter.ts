import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
    [key: string]: { count: number; resetTime: number };
}

const store: RateLimitStore = {};

export const rateLimiter = (maxRequests: number = 5, windowMs: number = 60000) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (process.env.NODE_ENV === 'test') {
            return next();
        }
        const key = req.ip || 'Unknown';
        const now = Date.now();

        if (!store[key] || now > store[key].resetTime) {
            store[key] = { count: 1, resetTime: now + windowMs };
            return next()
        }

        if (store[key].count < maxRequests) {
            store[key].count++;
            return next()
        }

        const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
        res.set('Retry-After', String(retryAfter));
        return res.status(429).json({
            error: 'Too many requests',
            retryAfter
        });
    };
};