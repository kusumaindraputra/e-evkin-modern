import request from 'supertest';
import app from '../../app';
import { User } from '../../models';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

describe('Authentication E2E Tests', () => {
    let testUser: any;
    let validToken: string;

    beforeAll(async () => {
        testUser = await User.findOne({ where: { role: 'puskesmas' } });
        if (testUser) {
            validToken = jwt.sign(
                { id: testUser.id, username: testUser.username, role: testUser.role },
                config.jwt.secret,
                { expiresIn: '1h' }
            );
        }
    });

    describe('POST /api/auth/login', () => {
        it('should return 400 for missing credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({});

            expect(response.status).toBe(400);
        });

        it('should return 401 for invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ username: 'nonexistent', password: 'wrongpassword' });

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/auth/me', () => {
        it('should return 401 without token', async () => {
            const response = await request(app).get('/api/auth/me');
            expect(response.status).toBe(401);
        });

        it('should return user data with valid token', async () => {
            if (!validToken) {
                console.warn('Skipping test: No test user found');
                return;
            }

            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(testUser.id);
        });

        it('should return 401 with expired token', async () => {
            const expiredToken = jwt.sign(
                { id: 1, username: 'test', role: 'puskesmas' },
                config.jwt.secret,
                { expiresIn: '-1h' }
            );

            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${expiredToken}`);

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should successfully logout', async () => {
            if (!validToken) return;

            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBeLessThan(500);
        });
    });
});
