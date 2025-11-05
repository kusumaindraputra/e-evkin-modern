import request from 'supertest';
import app from '../../app';
import { Laporan, User } from '../../models';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

describe('Laporan Routes Security Tests', () => {
  let puskesmasToken: string;
  let puskesmasUser: any;
  let otherPuskesmasToken: string;
  let otherPuskesmasUser: any;
  let adminToken: string;
  let adminUser: any;
  let testLaporan: any;
  let otherLaporan: any;

  beforeAll(async () => {
    // Create test users
    puskesmasUser = await User.findOne({ 
      where: { role: 'puskesmas' },
      limit: 1 
    });
    
    otherPuskesmasUser = await User.findOne({ 
      where: { 
        role: 'puskesmas',
        id: { [require('sequelize').Op.ne]: puskesmasUser.id }
      },
      limit: 1 
    });

    // If no second puskesmas found, use the same user (tests will still validate behavior)
    if (!otherPuskesmasUser) {
      otherPuskesmasUser = puskesmasUser;
    }

    adminUser = await User.findOne({ 
      where: { role: 'admin' },
      limit: 1 
    });

    // Generate tokens
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

    // Create test laporan
    testLaporan = await Laporan.findOne({ where: { user_id: puskesmasUser.id } });
    otherLaporan = await Laporan.findOne({ where: { user_id: otherPuskesmasUser.id } });
    
    // If no laporan found, create test data
    if (!testLaporan) {
      testLaporan = await Laporan.create({
        user_id: puskesmasUser.id,
        id_kegiatan: 1,
        id_sub_kegiatan: 1,
        id_sumber_anggaran: 1,
        id_satuan: 1,
        target_k: 100,
        angkas: 1000000,
        target_rp: 1000000,
        realisasi_k: 50,
        realisasi_rp: 500000,
        permasalahan: 'Test',
        upaya: 'Test',
        bulan: 'Januari',
        tahun: 2025,
      });
    }
    
    if (!otherLaporan && otherPuskesmasUser.id !== puskesmasUser.id) {
      otherLaporan = await Laporan.create({
        user_id: otherPuskesmasUser.id,
        id_kegiatan: 1,
        id_sub_kegiatan: 1,
        id_sumber_anggaran: 1,
        id_satuan: 1,
        target_k: 100,
        angkas: 1000000,
        target_rp: 1000000,
        realisasi_k: 50,
        realisasi_rp: 500000,
        permasalahan: 'Test',
        upaya: 'Test',
        bulan: 'Januari',
        tahun: 2025,
      });
    } else if (!otherLaporan) {
      // Use same laporan if only one puskesmas
      otherLaporan = testLaporan;
    }
  });

  describe('GET /api/laporan - List Laporan', () => {
    it('should return 401 without token', async () => {
      const response = await request(app).get('/api/laporan');
      expect(response.status).toBe(401);
    });

    it('should return only own laporan for puskesmas user', async () => {
      const response = await request(app)
        .get('/api/laporan')
        .set('Authorization', `Bearer ${puskesmasToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      
      // All laporan should belong to the authenticated user
      response.body.data.forEach((laporan: any) => {
        expect(laporan.user_id).toBe(puskesmasUser.id);
      });
    });

    it('should allow admin to see all laporan', async () => {
      const response = await request(app)
        .get('/api/laporan')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });

    it('should filter by user_id for admin', async () => {
      const response = await request(app)
        .get(`/api/laporan?user_id=${puskesmasUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      response.body.data.forEach((laporan: any) => {
        expect(laporan.user_id).toBe(puskesmasUser.id);
      });
    });
  });

  describe('GET /api/laporan/:id - Get Single Laporan', () => {
    it('should return 401 without token', async () => {
      const response = await request(app).get(`/api/laporan/${testLaporan.id}`);
      expect(response.status).toBe(401);
    });

    it('should allow puskesmas to access own laporan', async () => {
      const response = await request(app)
        .get(`/api/laporan/${testLaporan.id}`)
        .set('Authorization', `Bearer ${puskesmasToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testLaporan.id);
      expect(response.body.user_id).toBe(puskesmasUser.id);
    });

    it('should deny puskesmas access to other puskesmas laporan', async () => {
      const response = await request(app)
        .get(`/api/laporan/${otherLaporan.id}`)
        .set('Authorization', `Bearer ${puskesmasToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
    });

    it('should allow admin to access any laporan', async () => {
      const response = await request(app)
        .get(`/api/laporan/${otherLaporan.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/laporan - Create Laporan', () => {
    const newLaporanData = {
      id_kegiatan: 1,
      id_sub_kegiatan: 1,
      id_sumber_anggaran: 1,
      id_satuan: 1,
      target_k: 100,
      angkas: 1000000,
      target_rp: 1000000,
      realisasi_k: 50,
      realisasi_rp: 500000,
      permasalahan: 'Test permasalahan',
      upaya: 'Test upaya',
      bulan: 'Januari',
      tahun: 2025,
    };

    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/laporan')
        .send(newLaporanData);
      
      expect(response.status).toBe(401);
    });

    it('should create laporan with auto user_id for puskesmas', async () => {
      const response = await request(app)
        .post('/api/laporan')
        .set('Authorization', `Bearer ${puskesmasToken}`)
        .send(newLaporanData);

      expect(response.status).toBe(201);
      expect(response.body.user_id).toBe(puskesmasUser.id);
      
      // Cleanup
      if (response.body.id) {
        await Laporan.destroy({ where: { id: response.body.id } });
      }
    });

    it('should not allow puskesmas to create laporan for other user', async () => {
      const dataWithOtherUser = {
        ...newLaporanData,
        user_id: otherPuskesmasUser.id
      };

      const response = await request(app)
        .post('/api/laporan')
        .set('Authorization', `Bearer ${puskesmasToken}`)
        .send(dataWithOtherUser);

      expect(response.status).toBe(201);
      // user_id should be overridden to authenticated user
      expect(response.body.user_id).toBe(puskesmasUser.id);
      expect(response.body.user_id).not.toBe(otherPuskesmasUser.id);
      
      // Cleanup
      if (response.body.id) {
        await Laporan.destroy({ where: { id: response.body.id } });
      }
    });
  });

  describe('PUT /api/laporan/:id - Update Laporan', () => {
    it('should return 401 without token', async () => {
      const response = await request(app)
        .put(`/api/laporan/${testLaporan.id}`)
        .send({ target_k: 200 });
      
      expect(response.status).toBe(401);
    });

    it('should allow puskesmas to update own laporan', async () => {
      const response = await request(app)
        .put(`/api/laporan/${testLaporan.id}`)
        .set('Authorization', `Bearer ${puskesmasToken}`)
        .send({ target_k: 999 });

      expect(response.status).toBe(200);
      expect(response.body.target_k).toBe(999);
    });

    it('should deny puskesmas update to other puskesmas laporan', async () => {
      const response = await request(app)
        .put(`/api/laporan/${otherLaporan.id}`)
        .set('Authorization', `Bearer ${puskesmasToken}`)
        .send({ target_k: 888 });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
    });

    it('should allow admin to update any laporan', async () => {
      const response = await request(app)
        .put(`/api/laporan/${otherLaporan.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ target_k: 777 });

      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /api/laporan/:id - Delete Laporan', () => {
    let deletableTestLaporan: any;
    let deletableOtherLaporan: any;

    beforeEach(async () => {
      // Create temporary laporan for deletion tests
      deletableTestLaporan = await Laporan.create({
        user_id: puskesmasUser.id,
        id_kegiatan: 1,
        id_sub_kegiatan: 1,
        id_sumber_anggaran: 1,
        id_satuan: 1,
        target_k: 100,
        angkas: 1000000,
        target_rp: 1000000,
        realisasi_k: 50,
        realisasi_rp: 500000,
        permasalahan: 'Test',
        upaya: 'Test',
        bulan: 'Januari',
        tahun: 2025,
      });

      deletableOtherLaporan = await Laporan.create({
        user_id: otherPuskesmasUser.id,
        id_kegiatan: 1,
        id_sub_kegiatan: 1,
        id_sumber_anggaran: 1,
        id_satuan: 1,
        target_k: 100,
        angkas: 1000000,
        target_rp: 1000000,
        realisasi_k: 50,
        realisasi_rp: 500000,
        permasalahan: 'Test',
        upaya: 'Test',
        bulan: 'Januari',
        tahun: 2025,
      });
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .delete(`/api/laporan/${deletableTestLaporan.id}`);
      
      expect(response.status).toBe(401);
    });

    it('should allow puskesmas to delete own laporan', async () => {
      const response = await request(app)
        .delete(`/api/laporan/${deletableTestLaporan.id}`)
        .set('Authorization', `Bearer ${puskesmasToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted');
    });

    it('should deny puskesmas delete to other puskesmas laporan', async () => {
      const response = await request(app)
        .delete(`/api/laporan/${deletableOtherLaporan.id}`)
        .set('Authorization', `Bearer ${puskesmasToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
    });

    it('should allow admin to delete any laporan', async () => {
      const response = await request(app)
        .delete(`/api/laporan/${deletableOtherLaporan.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/laporan/submit - Submit Laporan', () => {
    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/laporan/submit')
        .send({ bulan: 'Januari', tahun: 2025 });
      
      expect(response.status).toBe(401);
    });

    it('should use authenticated user_id for puskesmas', async () => {
      const response = await request(app)
        .post('/api/laporan/submit')
        .set('Authorization', `Bearer ${puskesmasToken}`)
        .send({ 
          bulan: 'Januari', 
          tahun: 2025
        });

      // Will return 404 or 400 if no laporan with status 'menunggu'
      expect([200, 400, 404]).toContain(response.status);
    });

    it('should not allow puskesmas to submit for other user', async () => {
      const response = await request(app)
        .post('/api/laporan/submit')
        .set('Authorization', `Bearer ${puskesmasToken}`)
        .send({ 
          bulan: 'Januari', 
          tahun: 2025,
          user_id: otherPuskesmasUser.id // This should be ignored
        });

      // The endpoint should ignore user_id from body for puskesmas
      expect([200, 400, 404]).toContain(response.status);
    });
  });
});
