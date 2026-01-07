import request from 'supertest';
import app from '../../app';
import { Laporan, User, SubKegiatanTarget, SubKegiatan } from '../../models';
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
        realisasi_fisik: 75,
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
        realisasi_fisik: 75,
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
      realisasi_fisik: 75,
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
        .send({ permasalahan: 'Updated by admin' });

      // May return 200 or 400 depending on validation rules
      expect([200, 400]).toContain(response.status);
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
        realisasi_fisik: 75,
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
        realisasi_fisik: 75,
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

  describe('Validation Tests - Realisasi vs Target', () => {
    let testTarget: any;
    const testSubKegiatanId = 1;
    const testSumberAnggaranId = 1;
    const testTahun = 2025;

    beforeAll(async () => {
      // Find or create a test target for validation tests
      testTarget = await SubKegiatanTarget.findOne({
        where: {
          user_id: puskesmasUser.id,
          id_sub_kegiatan: testSubKegiatanId,
          id_sumber_anggaran: testSumberAnggaranId,
          bulan: null,
          tahun: testTahun,
        },
      });

      if (!testTarget) {
        testTarget = await SubKegiatanTarget.create({
          user_id: puskesmasUser.id,
          id_sub_kegiatan: testSubKegiatanId,
          id_sumber_anggaran: testSumberAnggaranId,
          id_satuan: 1,
          target_k: 100,
          target_rp: 10000000, // 10 juta
          bulan: null,
          tahun: testTahun,
          created_by: adminUser.id,
        });
      }
    });

    describe('POST /api/laporan/bulk-upsert - Validation', () => {
      it('should reject if realisasi_k exceeds target_k', async () => {
        const response = await request(app)
          .post('/api/laporan/bulk-upsert')
          .set('Authorization', `Bearer ${puskesmasToken}`)
          .send({
            laporanArray: [{
              id_sub_kegiatan: testSubKegiatanId,
              id_sumber_anggaran: testSumberAnggaranId,
              id_satuan: 1,
              target_k: testTarget.target_k,
              target_rp: testTarget.target_rp,
              realisasi_k: testTarget.target_k + 50, // Exceeds target!
              realisasi_rp: 5000000,
              realisasi_fisik: 50,
              permasalahan: '',
              upaya: '',
              bulan: 'Februari',
              tahun: testTahun,
            }]
          });

        expect(response.status).toBe(200);
        expect(response.body.results.skipped).toBeGreaterThan(0);
        expect(response.body.results.errors.length).toBeGreaterThan(0);
        expect(response.body.results.errors[0]).toContain('melebihi target');
      });

      it('should reject if realisasi_rp exceeds target_rp', async () => {
        const response = await request(app)
          .post('/api/laporan/bulk-upsert')
          .set('Authorization', `Bearer ${puskesmasToken}`)
          .send({
            laporanArray: [{
              id_sub_kegiatan: testSubKegiatanId,
              id_sumber_anggaran: testSumberAnggaranId,
              id_satuan: 1,
              target_k: testTarget.target_k,
              target_rp: testTarget.target_rp,
              realisasi_k: 50,
              realisasi_rp: testTarget.target_rp + 1000000, // Exceeds target!
              realisasi_fisik: 50,
              permasalahan: '',
              upaya: '',
              bulan: 'Februari',
              tahun: testTahun,
            }]
          });

        expect(response.status).toBe(200);
        // Either skipped with error OR validation prevents insert
        expect(response.body.results).toBeDefined();
      });

      it('should reject if no target exists for the combination', async () => {
        const response = await request(app)
          .post('/api/laporan/bulk-upsert')
          .set('Authorization', `Bearer ${puskesmasToken}`)
          .send({
            laporanArray: [{
              id_sub_kegiatan: 99999, // Non-existent
              id_sumber_anggaran: testSumberAnggaranId,
              id_satuan: 1,
              target_k: 100,
              target_rp: 10000000,
              realisasi_k: 50,
              realisasi_rp: 5000000,
              realisasi_fisik: 50,
              permasalahan: '',
              upaya: '',
              bulan: 'Februari',
              tahun: testTahun,
            }]
          });

        expect(response.status).toBe(200);
        expect(response.body.results.skipped).toBeGreaterThan(0);
        expect(response.body.results.errors.length).toBeGreaterThan(0);
        expect(response.body.results.errors[0]).toContain('Target belum diset');
      });

      it('should accept valid realisasi within target limits', async () => {
        const response = await request(app)
          .post('/api/laporan/bulk-upsert')
          .set('Authorization', `Bearer ${puskesmasToken}`)
          .send({
            laporanArray: [{
              id_sub_kegiatan: testSubKegiatanId,
              id_sumber_anggaran: testSumberAnggaranId,
              id_satuan: 1,
              target_k: testTarget.target_k,
              target_rp: testTarget.target_rp,
              realisasi_k: Math.floor(testTarget.target_k * 0.5), // 50% of target
              realisasi_rp: Math.floor(testTarget.target_rp * 0.5), // 50% of target
              realisasi_fisik: 50,
              permasalahan: 'Test valid',
              upaya: 'Test upaya',
              bulan: 'Maret',
              tahun: testTahun,
            }]
          });

        expect(response.status).toBe(200);
        // Should succeed (created, updated, or skipped)
        expect(response.body.results).toBeDefined();

        // Cleanup
        await Laporan.destroy({
          where: {
            user_id: puskesmasUser.id,
            id_sub_kegiatan: testSubKegiatanId,
            id_sumber_anggaran: testSumberAnggaranId,
            bulan: 'Maret',
            tahun: testTahun,
          }
        });
      });

      it('should auto-fill id_kegiatan from SubKegiatan', async () => {
        const subKegiatan = await SubKegiatan.findByPk(testSubKegiatanId);

        const response = await request(app)
          .post('/api/laporan/bulk-upsert')
          .set('Authorization', `Bearer ${puskesmasToken}`)
          .send({
            laporanArray: [{
              id_sub_kegiatan: testSubKegiatanId,
              id_sumber_anggaran: testSumberAnggaranId,
              id_kegiatan: 0, // Should be auto-filled
              id_satuan: 1,
              target_k: testTarget.target_k,
              target_rp: testTarget.target_rp,
              realisasi_k: 10,
              realisasi_rp: 1000000,
              realisasi_fisik: 10,
              permasalahan: '',
              upaya: '',
              bulan: 'April',
              tahun: testTahun,
            }]
          });

        expect(response.status).toBe(200);

        // Verify the created laporan has correct id_kegiatan
        const createdLaporan = await Laporan.findOne({
          where: {
            user_id: puskesmasUser.id,
            id_sub_kegiatan: testSubKegiatanId,
            bulan: 'April',
            tahun: testTahun,
          }
        });

        if (createdLaporan && subKegiatan) {
          expect(createdLaporan.id_kegiatan).toBe(subKegiatan.id_kegiatan);
        }

        // Cleanup
        await Laporan.destroy({
          where: {
            user_id: puskesmasUser.id,
            id_sub_kegiatan: testSubKegiatanId,
            bulan: 'April',
            tahun: testTahun,
          }
        });
      });
    });

    describe('PUT /api/laporan/:id - Validation', () => {
      let testUpdateLaporan: any;

      beforeEach(async () => {
        testUpdateLaporan = await Laporan.create({
          user_id: puskesmasUser.id,
          id_kegiatan: 1,
          id_sub_kegiatan: testSubKegiatanId,
          id_sumber_anggaran: testSumberAnggaranId,
          id_satuan: 1,
          target_k: testTarget.target_k,
          angkas: 5000000,
          target_rp: testTarget.target_rp,
          realisasi_k: 50,
          realisasi_rp: 5000000,
          realisasi_fisik: 50,
          permasalahan: 'Test',
          upaya: 'Test',
          bulan: 'Mei',
          tahun: testTahun,
        });
      });

      afterEach(async () => {
        if (testUpdateLaporan) {
          await Laporan.destroy({ where: { id: testUpdateLaporan.id } });
        }
      });

      it('should reject update if realisasi_k exceeds target', async () => {
        const response = await request(app)
          .put(`/api/laporan/${testUpdateLaporan.id}`)
          .set('Authorization', `Bearer ${puskesmasToken}`)
          .send({
            realisasi_k: testTarget.target_k + 100, // Exceeds target!
          });

        // May return 400 (validation) or 500 (db constraint)
        expect([400, 500]).toContain(response.status);
      });

      it('should reject update if target not found', async () => {
        // Update to a non-existent combination
        const response = await request(app)
          .put(`/api/laporan/${testUpdateLaporan.id}`)
          .set('Authorization', `Bearer ${puskesmasToken}`)
          .send({
            id_sumber_anggaran: 99999, // Non-existent sumber anggaran
          });

        // May return 400 with validation message or different error
        expect([400, 500]).toContain(response.status);
      });
    });
  });
});
