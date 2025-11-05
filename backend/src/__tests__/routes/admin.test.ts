import request from 'supertest';
import app from '../../app';
import { User } from '../../models';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

describe('Admin Routes Security Tests', () => {
  let adminToken: string;
  let puskesmasToken: string;
  let adminUser: any;
  let puskesmasUser: any;

  beforeAll(async () => {
    adminUser = await User.findOne({ where: { role: 'admin' } });
    puskesmasUser = await User.findOne({ where: { role: 'puskesmas' } });

    adminToken = jwt.sign(
      { id: adminUser.id, username: adminUser.username, role: 'admin' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    puskesmasToken = jwt.sign(
      { id: puskesmasUser.id, username: puskesmasUser.username, role: 'puskesmas' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  describe('GET /api/admin/verifikasi - Admin Verification List', () => {
    it('should return 401 without token', async () => {
      const response = await request(app).get('/api/admin/verifikasi');
      expect(response.status).toBe(401);
    });

    it('should return 403 for puskesmas user', async () => {
      const response = await request(app)
        .get('/api/admin/verifikasi')
        .set('Authorization', `Bearer ${puskesmasToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Access denied');
    });

    it('should allow admin access', async () => {
      const response = await request(app)
        .get('/api/admin/verifikasi')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/admin/verifikasi?page=1&pageSize=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.pageSize).toBe(5);
    });

    it('should support filtering by puskesmas', async () => {
      const response = await request(app)
        .get(`/api/admin/verifikasi?puskesmas=${puskesmasUser.nama_puskesmas}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/admin/laporan/:userId/:bulan/:tahun - Admin Laporan Detail', () => {
    it('should return 401 without token', async () => {
      const response = await request(app)
        .get(`/api/admin/laporan/${puskesmasUser.id}/Januari/2025`);
      expect(response.status).toBe(401);
    });

    it('should return 403 for puskesmas user', async () => {
      const response = await request(app)
        .get(`/api/admin/laporan/${puskesmasUser.id}/Januari/2025`)
        .set('Authorization', `Bearer ${puskesmasToken}`);

      expect(response.status).toBe(403);
    });

    it('should allow admin access', async () => {
      const response = await request(app)
        .get(`/api/admin/laporan/${puskesmasUser.id}/Januari/2025`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('PUT /api/admin/laporan/:id/verify - Verify Single Laporan', () => {
    it('should return 401 without token', async () => {
      const response = await request(app)
        .put('/api/admin/laporan/some-id/verify')
        .send({ status: 'diverifikasi' });
      
      expect(response.status).toBe(401);
    });

    it('should return 403 for puskesmas user', async () => {
      const response = await request(app)
        .put('/api/admin/laporan/some-id/verify')
        .set('Authorization', `Bearer ${puskesmasToken}`)
        .send({ status: 'diverifikasi' });

      expect(response.status).toBe(403);
    });

    it('should require valid status', async () => {
      const response = await request(app)
        .put('/api/admin/laporan/some-id/verify')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid-status' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/admin/laporan/bulk-verify - Bulk Verify', () => {
    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/admin/laporan/bulk-verify')
        .send({ 
          user_id: puskesmasUser.id,
          bulan: 'Januari',
          tahun: 2025,
          status: 'diverifikasi'
        });
      
      expect(response.status).toBe(401);
    });

    it('should return 403 for puskesmas user', async () => {
      const response = await request(app)
        .post('/api/admin/laporan/bulk-verify')
        .set('Authorization', `Bearer ${puskesmasToken}`)
        .send({ 
          user_id: puskesmasUser.id,
          bulan: 'Januari',
          tahun: 2025,
          status: 'diverifikasi'
        });

      expect(response.status).toBe(403);
    });

    it('should require all fields', async () => {
      const response = await request(app)
        .post('/api/admin/laporan/bulk-verify')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ 
          bulan: 'Januari',
          tahun: 2025
        });

      expect(response.status).toBe(400);
    });
  });
});
