/**
 * Swagger API Documentation Configuration
 */

import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-EVKIN API Documentation',
      version: '1.0.0',
      description: 'API documentation for E-EVKIN (Evaluasi Kinerja) application - Health Center Performance Evaluation System',
      contact: {
        name: 'Dinkes Bogor',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'API Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            username: { type: 'string' },
            nama: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'puskesmas'] },
            nama_puskesmas: { type: 'string' },
            kecamatan: { type: 'string' },
          },
        },
        Laporan: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            id_sub_kegiatan: { type: 'integer' },
            id_sumber_anggaran: { type: 'integer' },
            bulan: { type: 'string' },
            tahun: { type: 'integer' },
            target_k: { type: 'number' },
            target_rp: { type: 'number' },
            angkas: { type: 'number' },
            realisasi_k: { type: 'number' },
            realisasi_rp: { type: 'number' },
            realisasi_fisik: { type: 'number' },
            permasalahan: { type: 'string' },
            upaya: { type: 'string' },
            status: { type: 'string', enum: ['tersimpan', 'terkirim'] },
          },
        },
        SubKegiatan: {
          type: 'object',
          properties: {
            id_sub_kegiatan: { type: 'integer' },
            kode_sub: { type: 'string' },
            kegiatan: { type: 'string' },
            indikator_kinerja: { type: 'string' },
            id_kegiatan: { type: 'integer' },
          },
        },
        SumberAnggaran: {
          type: 'object',
          properties: {
            id_sumber: { type: 'integer' },
            sumber: { type: 'string' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Laporan', description: 'Report management' },
      { name: 'Dashboard', description: 'Dashboard statistics (Admin)' },
      { name: 'Reference', description: 'Reference data (Satuan, Sumber Anggaran)' },
      { name: 'Master Data', description: 'Master data management (Admin)' },
      { name: 'Target', description: 'Target management' },
      { name: 'Users', description: 'User management (Admin)' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: any): void {
  if (process.env.NODE_ENV === 'production') return;

  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'E-EVKIN API Docs',
  }));

  // JSON spec endpoint
  app.get('/api-docs.json', (_req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

export default swaggerSpec;
