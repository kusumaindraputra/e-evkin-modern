import request from 'supertest';
import app from '../../app';
import { User } from '../../models';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

describe('Authentication Middleware Tests', () => {
  let validToken: string;
  let expiredToken: string;
  let invalidToken: string;
  let testUser: any;

  beforeAll(async () => {
    // Get a test user
    testUser = await User.findOne({ where: { role: 'puskesmas' } });

    // Generate valid token
    validToken = jwt.sign(
      { id: testUser.id, username: testUser.username, role: testUser.role },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    // Generate expired token
    expiredToken = jwt.sign(
      { id: testUser.id, username: testUser.username, role: testUser.role },
      config.jwt.secret,
      { expiresIn: '-1h' } // Already expired
    );

    // Invalid token
    invalidToken = 'invalid.token.here';
  });

  describe('Protected Routes', () => {
    it('should deny access without token', async () => {
      const response = await request(app).get('/api/laporan');
      expect(response.status).toBe(401);
      expect(response.body.message).toContain('No token provided');
    });

    it('should deny access with invalid token', async () => {
      const response = await request(app)
        .get('/api/laporan')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid token');
    });

    it('should deny access with expired token', async () => {
      const response = await request(app)
        .get('/api/laporan')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid token');
    });

    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/api/laporan')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
    });

    it('should deny access with malformed Authorization header', async () => {
      const response = await request(app)
        .get('/api/laporan')
        .set('Authorization', 'InvalidFormat'); // Not "Bearer token" format

      expect(response.status).toBe(401);
    });
  });

  describe('Token Payload', () => {
    it('should attach user info to request object', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testUser.id);
      expect(response.body.username).toBe(testUser.username);
      expect(response.body.role).toBe(testUser.role);
    });
  });
});
