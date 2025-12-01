import request from 'supertest';
import app from '../server';
import pool from '../config/database';
import { TenantModel } from '../models/Tenant';

describe('Auth API', () => {
    let accessToken: string;
    let refreshToken: string;
    let tenantSlug: string;
    const testUser = {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        first_name: 'Test',
        last_name: 'User'
    };

    beforeAll(async () => {
        // Create a test tenant
        const tenant = await TenantModel.create({
            name: 'Auth Test Company',
            slug: `authtest-${Date.now()}`
        });
        tenantSlug = tenant.slug;

        // Clean up any existing test data
        await pool.query('DELETE FROM refresh_tokens WHERE tenant_id = $1', [tenant.id]);
    });

    afterAll(async () => {
        // Cleanup
        await pool.query("DELETE FROM tenants WHERE slug LIKE 'authtest-%'");
        await pool.end();
    });

    describe('POST /api/t/:tenantSlug/auth/register', () => {
        it('should register a new user', async () => {
            const response = await request(app)
                .post(`/api/t/${tenantSlug}/auth/register`)
                .send(testUser)
                .expect(201);
            expect(response.body.user).toHaveProperty('id');
            expect(response.body.user.email).toBe(testUser.email);
            expect(response.body).toHaveProperty('accessToken');
            expect(response.body).toHaveProperty('refreshToken');

            accessToken = response.body.accessToken;
            refreshToken = response.body.refreshToken;
        });

        it('should not register duplicate email', async () => {
            await request(app)
                .post(`/api/t/${tenantSlug}/auth/register`)
                .send(testUser)
                .expect(409);
        });

        it('should validate email format', async () => {
            await request(app)
                .post(`/api/t/${tenantSlug}/auth/register`)
                .send({ ...testUser, email: 'invalid-email' })
                .expect(400);
        });

        it('should enforce password length', async () => {
            await request(app)
                .post(`/api/t/${tenantSlug}/auth/register`)
                .send({ ...testUser, email: 'new@test.com', password: 'short' })
                .expect(400);
        });
    });

    describe('POST /api/t/:tenantSlug/auth/login', () => {
        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post(`/api/t/${tenantSlug}/auth/login`)
                .send({ email: testUser.email, password: testUser.password })
                .expect(200);

            expect(response.body).toHaveProperty('accessToken');
            expect(response.body).toHaveProperty('refreshToken');
            expect(response.body.user.email).toBe(testUser.email);
        });

        it('should reject invalid password', async () => {
            await request(app)
                .post(`/api/t/${tenantSlug}/auth/login`)
                .send({ email: testUser.email, password: 'wrongpassword' })
                .expect(401);
        });

        it('should reject non-existent user', async () => {
            await request(app)
                .post(`/api/t/${tenantSlug}/auth/login`)
                .send({ email: 'nonexistent@test.com', password: 'password' })
                .expect(401);
        });
    });

    describe('POST /api/t/:tenantSlug/auth/me', () => {
        it('should get current user with valid token', async () => {
            const response = await request(app)
                .post(`/api/t/${tenantSlug}/auth/me`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(response.body.email).toBe(testUser.email);
        });

        it('should reject request without token', async () => {
            await request(app)
                .post(`/api/t/${tenantSlug}/auth/me`)
                .expect(401);
        });
    });

    describe('POST /api/t/:tenantSlug/auth/refresh', () => {
        it('should refresh access token', async () => {
            const response = await request(app)
                .post(`/api/t/${tenantSlug}/auth/refresh`)
                .send({ refreshToken })
                .expect(200);
            expect(response.body).toHaveProperty('accessToken');
            expect(response.body).toHaveProperty('refreshToken');
        });
    });

    describe('POST /api/t/:tenantSlug/auth/logout', () => {
        it('should logout successfully', async () => {
            await request(app)
                .post(`/api/t/${tenantSlug}/auth/logout`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ refreshToken })
                .expect(200);
        });
    });
})