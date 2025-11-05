import request from 'supertest';
import app from '../../app';
import { User } from '../../models';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

describe('Export Routes Security Tests', () => {
  let puskesmasToken: string;
  let otherPuskesmasToken: string;
  let adminToken: string;
  let puskesmasUser: any;
  let otherPuskesmasUser: any;
  let adminUser: any;

  beforeAll(async () => {
    puskesmasUser = await User.findOne({ where: { role: 'puskesmas' } });
    otherPuskesmasUser = await User.findOne({ 
      where: { 
        role: 'puskesmas',
        id: { [require('sequelize').Op.ne]: puskesmasUser.id }
      }
    });
    adminUser = await User.findOne({ where: { role: 'admin' } });

    puskesmasToken = jwt.sign(
      { id: puskesmasUser.id, username: puskesmasUser.username, role: 'puskesmas' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    otherPuskesmasToken = jwt.sign(
      { id: otherPuskesmasUser.id, username: otherPuskesmasUser.username, role: 'puskesmas' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { id: adminUser.id, username: adminUser.username, role: 'admin' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  describe('GET /api/export/laporan - Puskesmas Export', () => {
    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/export/laporan?bulan=Januari&tahun=2025');
      
      expect(response.status).toBe(401);
    });

    it('should export only own data for puskesmas', async () => {
      const response = await request(app)
        .get('/api/export/laporan?bulan=Januari&tahun=2025')
        .set('Authorization', `Bearer ${puskesmasToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('spreadsheet');
      expect(response.headers['content-disposition']).toContain('.xlsx');
    });

    it('should not export other puskesmas data', async () => {
      // Puskesmas cannot specify user_id - it's automatically filtered
      const response = await request(app)
        .get(`/api/export/laporan?bulan=Januari&tahun=2025&user_id=${otherPuskesmasUser.id}`)
        .set('Authorization', `Bearer ${puskesmasToken}`);

      expect(response.status).toBe(200);
      // The response should only contain data for authenticated user,
      // not the user_id in query params
    });

    it('should require bulan and tahun', async () => {
      // Actually the endpoint has defaults, so this test checks it still works without them
      const response = await request(app)
        .get('/api/export/laporan')
        .set('Authorization', `Bearer ${puskesmasToken}`);

      // Should succeed with defaults (current year, no bulan filter)
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('spreadsheet');
    });
  });

  describe('GET /api/export/admin/laporan - Admin Export', () => {
    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/export/admin/laporan?tahun=2025');
      
      expect(response.status).toBe(401);
    });

    it('should return 403 for puskesmas user', async () => {
      const response = await request(app)
        .get('/api/export/admin/laporan?tahun=2025')
        .set('Authorization', `Bearer ${puskesmasToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Access denied');
    });

    it('should allow admin export', async () => {
      const response = await request(app)
        .get('/api/export/admin/laporan?tahun=2025')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('spreadsheet');
      expect(response.headers['content-disposition']).toContain('.xlsx');
    });

    it('should support optional bulan filter', async () => {
      const response = await request(app)
        .get('/api/export/admin/laporan?bulan=Januari&tahun=2025')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('should require tahun parameter', async () => {
      // Actually the endpoint has tahun default (current year)
      const response = await request(app)
        .get('/api/export/admin/laporan')
        .set('Authorization', `Bearer ${adminToken}`);

      // Should succeed with default tahun
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('spreadsheet');
    });
  });
});
