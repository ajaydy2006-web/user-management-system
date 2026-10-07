const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');

describe('User Management System - RESTful API & Basic Auth Integration Tests', () => {
  const adminAuth = 'Basic ' + Buffer.from('admin:admin123').toString('base64');
  const invalidAuth = 'Basic ' + Buffer.from('wronguser:wrongpass').toString('base64');

  let testUserId = null;

  beforeAll(async () => {
    process.env.USE_MEMORY_DB = 'true';
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  describe('🔐 Basic Authentication & Authorization Security', () => {
    it('should reject request without Authorization header (401 Unauthorized)', async () => {
      const res = await request(app).get('/api/users');
      expect(res.statusCode).toEqual(401);
      expect(res.headers['www-authenticate']).toBeDefined();
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual('Authentication Required');
    });

    it('should reject request with invalid Basic Auth credentials (401 Unauthorized)', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', invalidAuth);
      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });

    it('should accept request with valid Basic Auth credentials (200 OK)', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', adminAuth);
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('📝 User CRUD Operations', () => {
    it('POST /api/users - should create a new user (Create)', async () => {
      const newUser = {
        name: 'Test Automation User',
        email: 'automation.test@example.com',
        password: 'password123',
        role: 'user',
        status: 'active',
        department: 'QA Testing',
        phone: '+1 555-9876',
        bio: 'Automated test suite profile',
      };

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', adminAuth)
        .send(newUser);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.name).toEqual(newUser.name);
      expect(res.body.data.email).toEqual(newUser.email.toLowerCase());
      expect(res.body.data.password).toBeUndefined(); // Ensure password is excluded

      testUserId = res.body.data._id;
    });

    it('POST /api/users - should prevent duplicate email registration (409 Conflict)', async () => {
      const duplicateUser = {
        name: 'Imposter User',
        email: 'automation.test@example.com',
        password: 'password123',
      };

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', adminAuth)
        .send(duplicateUser);

      expect(res.statusCode).toEqual(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual('Duplicate Email');
    });

    it('GET /api/users - should fetch list of users (Read All)', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', adminAuth);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/users/:id - should fetch single user by ID (Read One)', async () => {
      const res = await request(app)
        .get(`/api/users/${testUserId}`)
        .set('Authorization', adminAuth);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toEqual(testUserId);
      expect(res.body.data.email).toEqual('automation.test@example.com');
    });

    it('PUT /api/users/:id - should update user details (Update)', async () => {
      const updateData = {
        name: 'Updated Automation User',
        role: 'manager',
        department: 'Software Engineering',
      };

      const res = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', adminAuth)
        .send(updateData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toEqual('Updated Automation User');
      expect(res.body.data.role).toEqual('manager');
      expect(res.body.data.department).toEqual('Software Engineering');
    });

    it('DELETE /api/users/:id - should delete user by ID (Delete)', async () => {
      const res = await request(app)
        .delete(`/api/users/${testUserId}`)
        .set('Authorization', adminAuth);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);

      // Verify user no longer exists
      const checkRes = await request(app)
        .get(`/api/users/${testUserId}`)
        .set('Authorization', adminAuth);

      expect(checkRes.statusCode).toEqual(404);
    });
  });
});
