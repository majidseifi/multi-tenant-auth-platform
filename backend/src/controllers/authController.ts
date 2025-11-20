/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { JWTService } from '../utils/jwt';
import { TenantModel } from '../models/Tenant';
import { validationResult } from 'express-validator';


export class AuthController {
    static async register(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() })
            }

            const { email, password, first_name, last_name } = req.body;
            const tenantId = req.tenantId!;

            // Check if tenant can add more users (plan limit)
            const canAddUser = await TenantModel.canAddUser(tenantId);
            if (!canAddUser) {
                return res.status(403).json({
                    error: 'User limit reached',
                    message: 'Your organization has reached its maximum user limit. Please upgrade your plan or contact support.'
                });
            }

            // Check if user exists in THIS tenants
            const existingUser = await UserModel.findByEmail(email, tenantId);
            if (existingUser) {
                return res.status(409).json({
                    error: 'User already exists',
                    message: 'A user with this email already exists in your organization.'
                });
            }

            // Create user with tenant_id
            const user = await UserModel.create({ tenant_id: tenantId, email, password, first_name, last_name });


            // Generate Tokens with tenant context
            const tokenPayload = { userId: user.id, tenantId: user.tenant_id, email: user.email, role: user.role };
            const accessToken = JWTService.generateAccessToken(tokenPayload);
            const refreshToken = JWTService.generateRefreshToken(tokenPayload);

            await JWTService.storeRefreshToken(user.id, user.tenant_id, refreshToken);

            return res.status(201).json({
                message: 'User registered successfully',
                user: {
                    id: user.id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role
                },
                accessToken,
                refreshToken
            });
        } catch (error) {
            console.error('Registration error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async login(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() })
            }

            const { email, password } = req.body;
            const tenantId = req.tenantId!;

            const user = await UserModel.findByEmail(email, tenantId);
            if (!user) {
                return res.status(401).json({
                    error: 'Invalid credentials',
                    message: 'Email or Password is incorrect.'
                });
            }

            // Check if account is locked
            if (user.locked_until && new Date(user.locked_until) > new Date()) {
                return res.status(423).json({
                    error: 'Account locked due to too many failed attempts',
                    lockedUntil: user.locked_until
                });
            }

            // Verify password
            const isValidPassword = await UserModel.verifyPassword(password, user.password_hash);

            if (!isValidPassword) {
                await UserModel.updateFailedAttempts(user.id, tenantId, user.failed_login_attempts + 1);
                return res.status(401).json({
                    error: 'Invalid credentials',
                    message: 'Email or password is incorrect.'
                });
            }

            // Reset failed attempts
            await UserModel.resetFailedAttempts(user.id, tenantId);

            // Generate Token
            const tokenPayload = { userId: user.id, tenantId: user.tenant_id, email: user.email, role: user.role };
            const accessToken = JWTService.generateAccessToken(tokenPayload);
            const refreshToken = JWTService.generateRefreshToken(tokenPayload);

            await JWTService.storeRefreshToken(user.id, user.tenant_id, refreshToken);

            return res.status(200).json({
                message: 'Login successful',
                user: {
                    id: user.id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role
                },
                accessToken,
                refreshToken
            });
        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({
                error: 'Internal sever error'
            })
        }
    }

    static async refresh(req: Request, res: Response) {
        try {
            const { refreshToken } = req.body;
            const tenantId = req.tenantId!;

            if (!refreshToken) {
                return res.status(400).json({ error: 'Refresh token required' });
            }

            const isValid = await JWTService.validateRefreshToken(refreshToken, tenantId);
            if (!isValid) {
                return res.status(401).json({ error: 'Invalid or expired refresh token' });
            }

            const payload = JWTService.verifyRefreshToken(refreshToken);

            // Extra security: verify tenant matches
            if (payload.tenantId !== tenantId) {
                console.warn('SECURITY WARNING: Refresh token tenant mismatch', {
                    payloadTenant: payload.tenantId,
                    urlTenant: tenantId
                });
                return res.status(403).json({ error: 'Tenant mismatch' });
            }

            const user = await UserModel.findById(payload.userId, tenantId);

            if (!user || !user.is_active) {
                return res.status(401).json({ error: 'User not found or inactive' });
            }

            // Revoke old token and generate new ones
            await JWTService.revokeRefreshToken(refreshToken, tenantId);

            const tokenPayload = { userId: user.id, tenantId: user.tenant_id, email: user.email, role: user.role };
            const newAccessToken = JWTService.generateAccessToken(tokenPayload);
            const newRefreshToken = JWTService.generateRefreshToken(tokenPayload);

            await JWTService.storeRefreshToken(user.id, user.tenant_id, newRefreshToken);

            return res.status(200).json({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            });
        } catch (error) {
            console.error('Token refresh error:', error);
            return res.status(401).json({ error: 'Invalid refresh token' });
        }
    }

    static async logout(req: Request, res: Response) {
        try {
            const { refreshToken } = req.body;
            const user = (req as any).user;
            const tenantId = user.tenantId;

            if (refreshToken) {
                await JWTService.revokeRefreshToken(refreshToken, tenantId);
            } else {
                await JWTService.revokeAllUserTokens(user.userId, tenantId);
            }

            return res.status(200).json({ message: 'Logout successfull' });
        } catch (error) {
            console.error('Logout error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async me(req: Request, res: Response) {
        try {
            const user = (req as any).user;

            if (!user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const userData = await UserModel.findById(user.userId, user.tenantId);

            if (!userData) {
                return res.status(404).json({ error: 'User not found' });
            }

            return res.status(200).json({
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role,
                is_active: user.is_active,
                email_verified: user.email_verified
            });
        } catch (error) {
            console.error('Get user error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

}