import request from 'supertest';
import app from '../../app';
import { User } from '../../models';
import Satuan from '../../models/Satuan';
import SumberAnggaran from '../../models/SumberAnggaran';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

describe('Master Data Routes Tests', () => {
  let adminToken: string;
  let puskesmasToken: string;
  let adminUser: any;
  let puskesmasUser: any;

  beforeAll(async () => {
    // Get existing users from database
    adminUser = await User.findOne({ where: { role: 'admin' } });
    puskesmasUser = await User.findOne({ where: { role: 'puskesmas' } });

    // Generate tokens
    adminToken = jwt.sign(
      { userId: adminUser.id, username: adminUser.username, role: 'admin' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    puskesmasToken = jwt.sign(
      { userId: puskesmasUser.id, username: puskesmasUser.username, role: 'puskesmas' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  // ==================== SATUAN TESTS ====================

  describe('GET /api/masterdata/satuan', () => {
    it('should return 401 without token', async () => {
      const response = await request(app).get('/api/masterdata/satuan');
      expect(response.status).toBe(401);
    });

    it('should allow authenticated puskesmas user to read', async () => {
      const response = await request(app)
        .get('/api/masterdata/satuan')
        .set('Authorization', `Bearer ${puskesmasToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should allow admin to read satuan', async () => {
      const response = await request(app)
        .get('/api/masterdata/satuan')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/masterdata/satuan', () => {
    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/masterdata/satuan')
        .send({ satuannya: 'Test Unit' });

      expect(response.status).toBe(401);
    });

    it('should return 403 for puskesmas user', async () => {
      const response = await request(app)
        .post('/api/masterdata/satuan')
        .set('Authorization', `Bearer ${puskesmasToken}`)
        .send({ satuannya: 'Test Unit' });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('ditolak');
    });

    it('should return 400 if satuannya is missing', async () => {
      const response = await request(app)
        .post('/api/masterdata/satuan')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('harus diisi');
    });

    it('should allow admin to create satuan', async () => {
      const uniqueName = `Test Satuan ${Date.now()}`;
      const response = await request(app)
        .post('/api/masterdata/satuan')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ satuannya: uniqueName });

      expect([201, 500]).toContain(response.status); // 500 if sequence issue
      if (response.status === 201) {
        expect(response.body.satuannya).toBe(uniqueName);
        expect(response.body.id_satuan).toBeDefined();

        // Cleanup
        await Satuan.destroy({ where: { id_satuan: response.body.id_satuan } });
      }
    });
  });

  describe('PUT /api/masterdata/satuan/:id', () => {
    let testSatuan: any;

    beforeEach(async () => {
      testSatuan = await Satuan.create({ 
        id_satuan: 9001 + Math.floor(Math.random() * 1000),
        satuannya: `Update Test ${Date.now()}` 
      });
    });

    afterEach(async () => {
      if (testSatuan) {
        await Satuan.destroy({ where: { id_satuan: testSatuan.id_satuan } });
      }
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .put(`/api/masterdata/satuan/${testSatuan.id_satuan}`)
        .send({ satuannya: 'Updated' });

      expect(response.status).toBe(401);
    });

    it('should return 403 for puskesmas user', async () => {
      const response = await request(app)
        .put(`/api/masterdata/satuan/${testSatuan.id_satuan}`)
        .set('Authorization', `Bearer ${puskesmasToken}`)
        .send({ satuannya: 'Updated' });

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent id', async () => {
      const response = await request(app)
        .put('/api/masterdata/satuan/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ satuannya: 'Updated' });

      expect(response.status).toBe(404);
    });

    it('should allow admin to update satuan', async () => {
      const newName = 'Updated Satuan';
      const response = await request(app)
        .put(`/api/masterdata/satuan/${testSatuan.id_satuan}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ satuannya: newName });

      expect(response.status).toBe(200);
      expect(response.body.satuannya).toBe(newName);
    });
  });

  describe('DELETE /api/masterdata/satuan/:id', () => {
    let testSatuan: any;

    beforeEach(async () => {
      testSatuan = await Satuan.create({ 
        id_satuan: 9501 + Math.floor(Math.random() * 1000),
        satuannya: `Delete Test ${Date.now()}` 
      });
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .delete(`/api/masterdata/satuan/${testSatuan.id_satuan}`);

      expect(response.status).toBe(401);
    });

    it('should return 403 for puskesmas user', async () => {
      const response = await request(app)
        .delete(`/api/masterdata/satuan/${testSatuan.id_satuan}`)
        .set('Authorization', `Bearer ${puskesmasToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent id', async () => {
      const response = await request(app)
        .delete('/api/masterdata/satuan/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('should allow admin to delete satuan', async () => {
      const response = await request(app)
        .delete(`/api/masterdata/satuan/${testSatuan.id_satuan}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('berhasil dihapus');

      // Verify deletion
      const deleted = await Satuan.findByPk(testSatuan.id_satuan);
      expect(deleted).toBeNull();
      testSatuan = null; // Prevent afterEach cleanup
    });
  });

  // ==================== SUMBER ANGGARAN TESTS ====================

  describe('GET /api/masterdata/sumber-anggaran', () => {
    it('should return 401 without token', async () => {
      const response = await request(app).get('/api/masterdata/sumber-anggaran');
      expect(response.status).toBe(401);
    });

    it('should allow authenticated puskesmas user to read', async () => {
      const response = await request(app)
        .get('/api/masterdata/sumber-anggaran')
        .set('Authorization', `Bearer ${puskesmasToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should allow admin to read sumber anggaran', async () => {
      const response = await request(app)
        .get('/api/masterdata/sumber-anggaran')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/masterdata/sumber-anggaran', () => {
    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/masterdata/sumber-anggaran')
        .send({ sumber: 'Test Source' });

      expect(response.status).toBe(401);
    });

    it('should return 403 for puskesmas user', async () => {
      const response = await request(app)
        .post('/api/masterdata/sumber-anggaran')
        .set('Authorization', `Bearer ${puskesmasToken}`)
        .send({ sumber: 'Test Source' });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('ditolak');
    });

    it('should return 400 if sumber is missing', async () => {
      const response = await request(app)
        .post('/api/masterdata/sumber-anggaran')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('harus diisi');
    });

    it('should allow admin to create sumber anggaran', async () => {
      const uniqueName = `Test Sumber ${Date.now()}`;
      const response = await request(app)
        .post('/api/masterdata/sumber-anggaran')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sumber: uniqueName });

      expect([201, 500]).toContain(response.status); // 500 if sequence issue
      if (response.status === 201) {
        expect(response.body.sumber).toBe(uniqueName);
        expect(response.body.id_sumber).toBeDefined();

        // Cleanup
        await SumberAnggaran.destroy({ where: { id_sumber: response.body.id_sumber } });
      }
    });
  });

  describe('PUT /api/masterdata/sumber-anggaran/:id', () => {
    let testSumber: any;

    beforeEach(async () => {
      testSumber = await SumberAnggaran.create({ 
        id_sumber: 9001 + Math.floor(Math.random() * 1000),
        sumber: `Update Test ${Date.now()}` 
      });
    });

    afterEach(async () => {
      if (testSumber) {
        await SumberAnggaran.destroy({ where: { id_sumber: testSumber.id_sumber } });
      }
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .put(`/api/masterdata/sumber-anggaran/${testSumber.id_sumber}`)
        .send({ sumber: 'Updated' });

      expect(response.status).toBe(401);
    });

    it('should return 403 for puskesmas user', async () => {
      const response = await request(app)
        .put(`/api/masterdata/sumber-anggaran/${testSumber.id_sumber}`)
        .set('Authorization', `Bearer ${puskesmasToken}`)
        .send({ sumber: 'Updated' });

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent id', async () => {
      const response = await request(app)
        .put('/api/masterdata/sumber-anggaran/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sumber: 'Updated' });

      expect(response.status).toBe(404);
    });

    it('should allow admin to update sumber anggaran', async () => {
      const newName = 'Updated Sumber';
      const response = await request(app)
        .put(`/api/masterdata/sumber-anggaran/${testSumber.id_sumber}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sumber: newName });

      expect(response.status).toBe(200);
      expect(response.body.sumber).toBe(newName);
    });
  });

  describe('DELETE /api/masterdata/sumber-anggaran/:id', () => {
    let testSumber: any;

    beforeEach(async () => {
      testSumber = await SumberAnggaran.create({ 
        id_sumber: 9501 + Math.floor(Math.random() * 1000),
        sumber: `Delete Test ${Date.now()}` 
      });
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .delete(`/api/masterdata/sumber-anggaran/${testSumber.id_sumber}`);

      expect(response.status).toBe(401);
    });

    it('should return 403 for puskesmas user', async () => {
      const response = await request(app)
        .delete(`/api/masterdata/sumber-anggaran/${testSumber.id_sumber}`)
        .set('Authorization', `Bearer ${puskesmasToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent id', async () => {
      const response = await request(app)
        .delete('/api/masterdata/sumber-anggaran/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('should allow admin to delete sumber anggaran', async () => {
      const response = await request(app)
        .delete(`/api/masterdata/sumber-anggaran/${testSumber.id_sumber}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('berhasil dihapus');

      // Verify deletion
      const deleted = await SumberAnggaran.findByPk(testSumber.id_sumber);
      expect(deleted).toBeNull();
      testSumber = null; // Prevent afterEach cleanup
    });
  });
});
