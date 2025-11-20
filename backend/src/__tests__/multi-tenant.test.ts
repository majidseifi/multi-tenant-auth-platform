import request from 'supertest';
import app from '../server';
import pool from '../config/database';
import { TenantModel } from '../models/Tenant';
import { UserModel } from '../models/User';

describe('Multi-Tenant Isolation', () => {
    let tenant1Id: string;
    let tenant2Id: string;

    beforeAll(async () => {
        // Clean up any existing test data
        await pool.query("DELETE FROM tenants WHERE slug IN ('newcompany', 'test1', 'test2', 'duplicate')");

        // Create test tenants
        const tenant1 = await TenantModel.create({ name: 'Test Tenant 1', slug: 'test1' });
        const tenant2 = await TenantModel.create({ name: 'Test Tenant 2', slug: 'test2' });
        tenant1Id = tenant1.id;
        tenant2Id = tenant2.id;
    });

    afterAll(async () => {
        // Cleanup
        await pool.query("DELETE FROM tenants WHERE slug LIKE 'test%' OR slug IN ('newcompany', 'duplicate')");
        await pool.end();
    });

    describe('Tenant Creation', () => {
        it('should create a new tenant with unique slug', async () => {
            const res = await request(app)
                .post('/api/tenants')
                .send(({ name: 'New Company', slug: 'newcompany' }));

            expect(res.status).toBe(201);
            expect(res.body.tenant.slug).toBe('newcompany');
            expect(res.body.nextSteps.loginUrl).toBe('/t/newcompany/auth/login');
        });

        it('should reject duplicate slug', async () => {
            await request(app)
                .post('/api/tenants')
                .send({ name: 'Company', slug: 'duplicate' });

            const res = await request(app)
                .post('/api/tenants')
                .send({ name: 'Another Company', slug: 'duplicate' });

            expect(res.status).toBe(409);
            expect(res.body.error).toBe('Slug already taken');
        });

        it('should reject invalid slug format', async () => {
            const res = await request(app)
                .post('/api/tenants')
                .send({ name: 'Company', slug: 'Invalid_Slug!' });

            expect(res.status).toBe(400);
        });
    });

    describe('User Registration', () => {
        it('should register user in correct tenant', async () => {
            const res = await request(app)
                .post('/api/t/test1/auth/register')
                .send({
                    email: 'user@test1.com',
                    password: 'password123',
                    first_name: 'Test',
                    last_name: 'User'
                });

            expect(res.status).toBe(201);
            expect(res.body.user.email).toBe('user@test1.com');
            expect(res.body.accessToken).toBeDefined();
        });

        it('should allow same email in different tenants', async () => {
            const email = 'test-shared@example.com';

            const res1 = await request(app)
                .post('/api/t/test1/auth/register')
                .send({ email, password: 'password123', first_name: 'User1', });

            const res2 = await request(app)
                .post('/api/t/test2/auth/register')
                .send({ email, password: 'password123', first_name: 'User2' });

            expect(res1.status).toBe(201);
            expect(res2.status).toBe(201);
        });

        it('should reject duplicate email within same tenant', async () => {
            const email = 'duplicate@test1.com'
            await request(app)
                .post('/api/t/test1/auth/register')
                .send({ email, password: 'password123' });

            const res = await request(app)
                .post('/api/t/test1/auth/register')
                .send({ email, password: 'password123' });

            expect(res.status).toBe(409);
        });
    });

    describe('Tenant Isolation in Authentication', () => {
        beforeAll(async () => {
            // Create users in different tenants
            await UserModel.create({
                tenant_id: tenant1Id,
                email: 'alice@tenant1.com',
                password: 'password123',
                role: 'admin'
            });

            await UserModel.create({
                tenant_id: tenant2Id,
                email: 'bob@tenant2.com',
                password: 'password123'
            });
        });

        it('should allow login only to correct tenant', async () => {
            const res = await request(app)
                .post('/api/t/test1/auth/login')
                .send({ email: 'alice@tenant1.com', password: 'password123' });

            expect(res.status).toBe(200);
            expect(res.body.user.email).toBe('alice@tenant1.com');
        });

        it('should reject login to wrong tenant', async () => {
            const res = await request(app)
                .post('/api/t/test2/auth/login')
                .send({ email: 'alice@tenant1.com', password: 'password123' });

            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Invalid credentials');
        });

        it('should prevent cross-tenant token usage', async () => {
            const loginRes = await request(app)
                .post('/api/t/test1/auth/login')
                .send({ email: 'alice@tenant1.com', password: 'password123' });

            const token = loginRes.body.accessToken;

            // Try to access tenant2 with tenant1's token
            const res = await request(app)
                .post('/api/t/test2/auth/me')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(403);
            expect(res.body.error).toBe('Tenant mismatch');
        });
    });

    describe('User Management Isolation', () => {
        it('should only return users from same tenant', async () => {
            // Login as admin in tenant1
            const adminRes = await request(app)
                .post('/api/t/test1/auth/login')
                .send({ email: 'alice@tenant1.com', password: 'password123' });

            const token = adminRes.body.accessToken;

            const res = await request(app)
                .get('/api/t/test1/users')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.users).toBeInstanceOf(Array);
            // Verify all users belong to tenant1
            res.body.users.forEach((user: any) => {
                expect(user.tenant_id).toBe(tenant1Id);
            });
        });
    });
});