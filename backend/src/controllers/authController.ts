import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { JWTService } from '../utils/jwt';
import { validationResult } from 'express-validator';
import { ref } from 'process';

export class AuthController {
    static async register(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() })
            }

            const { email, password, first_name, last_name } = req.body;

            // Check if user exists
            const existingUser = await UserModel.findByEmail(email);
            if (existingUser) {
                return res.status(409).json({ error: 'User already exists' });
            }

            // Create user
            const user = await UserModel.create({ email, password, first_name, last_name });

            // Generate Tokens
            const tokenPayload = { userId: user.id, email: user.email, role: user.role };
            const accessToken = JWTService.generateAccessToken(tokenPayload);
            const refreshToken = JWTService.generateRefreshToken(tokenPayload);

            await JWTService.storeRefreshToken(user.id, refreshToken);

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

            const user = await UserModel.findByEmail(email);
            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
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
                await UserModel.updateFailedAttempts(user.id, user.failed_login_attempts + 1);
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Reset failed attempts
            await UserModel.resetFailedAttempts(user.id);

            // Generate Token
            const tokenPayload = { userId: user.id, email: user.email, role: user.role };
            const accessToken = JWTService.generateAccessToken(tokenPayload);
            const refreshToken = JWTService.generateRefreshToken(tokenPayload);

            await JWTService.storeRefreshToken(user.id, refreshToken);

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

            if (!refreshToken) {
                return res.status(400).json({ error: 'Refresh token required' });
            }

            const isValid = await JWTService.validateRefreshToken(refreshToken);
            if (!isValid) {
                return res.status(401).json({ error: 'Invalid or expired refresh token' });
            }

            const payload = JWTService.verifyRefreshToken(refreshToken);
            const user = await UserModel.findById(payload.userId);

            if (!user || !user.is_active) {
                return res.status(401).json({ error: 'User not found or inactive' });
            }

            // Revoke old token and generate new ones
            await JWTService.revokeRefreshToken(refreshToken);

            const tokenPayload = { userId: user.id, email: user.email, role: user.role };
            const newAccessToken = JWTService.generateAccessToken(tokenPayload);
            const newRefreshToken = JWTService.generateRefreshToken(tokenPayload);

            await JWTService.storeRefreshToken(user.id, newRefreshToken);

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

            if (refreshToken) {
                await JWTService.revokeRefreshToken(refreshToken);
            }
            return res.status(200).json({ message: 'Logout successfull' });
        } catch (error) {
            console.error('Logout error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async me(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const user = await UserModel.findById(req.user.userId);

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            return res.status(200).json({
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                is_active: user.is_active,
                email_verified: user.email_verified
            });
        } catch (error) {
            console.error('Get user error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

}