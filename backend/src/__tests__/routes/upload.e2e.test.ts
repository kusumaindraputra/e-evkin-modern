
import request from 'supertest';
import app from '../../app';
import { User, SubKegiatanTarget, sequelize } from '../../models';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';

describe('Excel Upload E2E', () => {
    let adminToken: string;
    let adminUser: any;

    beforeAll(async () => {
        // Ensure DB connection
        await sequelize.authenticate();

        // Find or create an admin user for testing
        adminUser = await User.findOne({ where: { role: 'admin' } });
        if (!adminUser) {
            // Create dummy admin if not exists (fallback)
            adminUser = await User.create({
                username: 'testadmin',
                password: 'password123', // In real app this would be hashed
                role: 'admin',
                nama: 'Test Admin',
                nama_puskesmas: 'Puskesmas Test'
            });
        }

        // Generate token
        const secret = process.env.JWT_SECRET || 'your-secret-key';
        adminToken = jwt.sign({ id: adminUser.id, role: adminUser.role }, secret, { expiresIn: '1h' });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it('should upload targets successfully via Excel', async () => {
        // 1. Create a mock Excel file in memory
        const workbook = XLSX.utils.book_new();
        const data = [
            {
                'Kode Sub Kegiatan': '1.02.01',
                'Nama Sub Kegiatan': 'Pelayanan Kesehatan Ibu Hamil',
                'Sumber Anggaran': 'BOK',
                'Tahun': 2024,
                'Bulan': 'Januari',
                'Volume Target': 100,
                'Satuan': 'Orang',
                'Pagu Anggaran': 5000000
            }
        ];
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // 2. Send request
        const response = await request(app)
            .post('/api/target/upload')
            .set('Authorization', `Bearer ${adminToken}`)
            .attach('file', buffer, 'targets.xlsx');

        // 3. Assertions
        // Note: Depending on actual implementation, status might be 200 or 201
        // If specific implementation details (like column names mapping) differ, this test might need adjustment.
        // For now, checks if the endpoint accepts the file and processes it without 500.

        if (response.status === 500) {
            console.error('Server Error:', response.body);
        }

        expect(response.status).not.toBe(500);
        expect(response.status).toBeLessThan(400); // Expect success 2xx

        // Optional: Check if data was inserted (if we had a clean test DB)
        // const targets = await SubKegiatanTarget.findAll({ where: { tahun: 2024 } });
        // expect(targets.length).toBeGreaterThan(0);
    });
});
