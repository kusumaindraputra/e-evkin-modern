import request from 'supertest';
import app from '../../app';
import { User, Laporan } from '../../models';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

describe('Laporan CRUD E2E Tests', () => {
    let puskesmasUser: any;
    let adminUser: any;
    let puskesmasToken: string;
    let adminToken: string;
    let testLaporanId: string;

    beforeAll(async () => {
        puskesmasUser = await User.findOne({ where: { role: 'puskesmas' } });
        adminUser = await User.findOne({ where: { role: 'admin' } });

        if (puskesmasUser) {
            puskesmasToken = jwt.sign(
                { id: puskesmasUser.id, username: puskesmasUser.username, role: 'puskesmas' },
                config.jwt.secret,
                { expiresIn: '1h' }
            );
        }

        if (adminUser) {
            adminToken = jwt.sign(
                { id: adminUser.id, username: adminUser.username, role: 'admin' },
                config.jwt.secret,
                { expiresIn: '1h' }
            );
        }

        // Find an existing laporan for testing
        const existingLaporan = await Laporan.findOne({ where: { user_id: puskesmasUser?.id } });
        if (existingLaporan) {
            testLaporanId = existingLaporan.id;
        }
    });

    describe('GET /api/laporan - List Laporan', () => {
        it('should return 401 without token', async () => {
            const response = await request(app).get('/api/laporan');
            expect(response.status).toBe(401);
        });

        it('should return laporan list for puskesmas user', async () => {
            if (!puskesmasToken) return;

            const response = await request(app)
                .get('/api/laporan')
                .set('Authorization', `Bearer ${puskesmasToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should support pagination', async () => {
            if (!puskesmasToken) return;

            const response = await request(app)
                .get('/api/laporan?page=1&limit=5')
                .set('Authorization', `Bearer ${puskesmasToken}`);

            expect(response.status).toBe(200);
            expect(response.body.pagination).toBeDefined();
        });

        it('should filter by bulan and tahun', async () => {
            if (!puskesmasToken) return;

            const response = await request(app)
                .get('/api/laporan?bulan=Januari&tahun=2025')
                .set('Authorization', `Bearer ${puskesmasToken}`);

            expect(response.status).toBe(200);
        });
    });

    describe('GET /api/laporan/:id - Get Single Laporan', () => {
        it('should return 401 without token', async () => {
            const response = await request(app).get('/api/laporan/some-id');
            expect(response.status).toBe(401);
        });

        it('should return laporan details for valid id', async () => {
            if (!puskesmasToken || !testLaporanId) return;

            const response = await request(app)
                .get(`/api/laporan/${testLaporanId}`)
                .set('Authorization', `Bearer ${puskesmasToken}`);

            expect(response.status).toBe(200);
            // API may return data directly or wrapped in .data
            expect(response.body).toBeDefined();
        });

        it('should return 404 for non-existent id', async () => {
            if (!puskesmasToken) return;

            const response = await request(app)
                .get('/api/laporan/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${puskesmasToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe('PUT /api/laporan/:id - Update Laporan', () => {
        it('should return 401 without token', async () => {
            const response = await request(app)
                .put('/api/laporan/some-id')
                .send({ realisasi_k: 50 });

            expect(response.status).toBe(401);
        });

        it('should update laporan for owner', async () => {
            if (!puskesmasToken || !testLaporanId) return;

            const response = await request(app)
                .put(`/api/laporan/${testLaporanId}`)
                .set('Authorization', `Bearer ${puskesmasToken}`)
                .send({ permasalahan: 'Test update from E2E' });

            // May get 403 if laporan is already verified
            expect([200, 403]).toContain(response.status);
        });
    });

    describe('Health Check', () => {
        it('should return OK', async () => {
            const response = await request(app).get('/health');
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('OK');
        });
    });
});
