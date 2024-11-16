const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../app');
const { Tenant, ENUMS } = require('../models/tenantModel');

const testUtils = {
  createTestTenantData: (overrides = {}) => ({
    name: 'Test Tenant',
    industry: 'Finance',
    contact_email: `test${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
    subscription_tier: 'Professional',
    compliance_level: 'Enhanced',
    metadata: {
      industry: 'Finance',
      region: 'NA',
      country: 'US',
      companySize: '11-50',
      primaryContact: {
        name: 'John Doe',
        position: 'CEO'
      },
      tags: ['test']
    },
    ...overrides
  }),

  generateAuthToken: (role = 'admin') => {
    return jwt.sign(
      { id: new mongoose.Types.ObjectId(), role },
      process.env.JWT_SECRET || 'test-secret-key'
    );
  }
};

describe('Tenant API - Management Features', () => {
  let authToken;
  let testTenant;

  beforeAll(async () => {
    if (!mongoose.connection || mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI_TEST);
    }
  });

  afterAll(async () => {
    if (mongoose.connection) {
      await mongoose.connection.close();
    }
  });

  beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
    authToken = testUtils.generateAuthToken();
    testTenant = await Tenant.create(testUtils.createTestTenantData());
  });

  describe('CRUD Operations', () => {
    it('should create a new tenant', async () => {
      const newTenantData = testUtils.createTestTenantData({
        name: 'New Test Tenant',
        contact_email: 'new@test.com'
      });

      const res = await request(app)
        .post('/api/tenants')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newTenantData);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe(newTenantData.name);
      expect(res.body.contact_email).toBe(newTenantData.contact_email);
    });

    it('should get a tenant by ID', async () => {
      const res = await request(app)
        .get(`/api/tenants/${testTenant._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(testTenant._id.toString());
    });

    it('should update a tenant', async () => {
      const updateData = {
        name: 'Updated Name',
        industry: 'Technology'
      };

      const res = await request(app)
        .put(`/api/tenants/${testTenant._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe(updateData.name);
      expect(res.body.industry).toBe(updateData.industry);
    });

    it('should delete a tenant', async () => {
      const res = await request(app)
        .delete(`/api/tenants/${testTenant._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);

      const deletedTenant = await Tenant.findById(testTenant._id);
      expect(deletedTenant).toBeNull();
    });
  });

  describe('Status Management', () => {
    // Using test.todo for future implementation
    test.todo('should update tenant status to inactive');
    test.todo('should update tenant status to suspended');
    test.todo('should update tenant status to active');
    test.todo('should reject invalid status');
    test.todo('should get tenant status history');
  });

  describe('Settings Management', () => {
    const validSettings = {
      timezone: 'UTC',
      dateFormat: 'DD/MM/YYYY',
      language: 'en-US',
      notificationPreferences: {
        email: true,
        slack: false
      }
    };

    // Using test.skip for implemented but not ready tests
    it.skip('should update tenant settings', async () => {
      const res = await request(app)
        .put(`/api/tenants/${testTenant._id}/settings`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(validSettings);

      expect(res.status).toBe(200);
      expect(res.body.settings).toMatchObject(validSettings);
    });

    it.skip('should reject invalid timezone', async () => {
      const res = await request(app)
        .put(`/api/tenants/${testTenant._id}/settings`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validSettings,
          timezone: 'Invalid/Timezone'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid timezone');
    });

    it.skip('should get tenant settings', async () => {
      await request(app)
        .put(`/api/tenants/${testTenant._id}/settings`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(validSettings);

      const res = await request(app)
        .get(`/api/tenants/${testTenant._id}/settings`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject(validSettings);
    });
  });

  describe('Bulk Operations', () => {
    let secondTenant;

    beforeEach(async () => {
      secondTenant = await Tenant.create(
        testUtils.createTestTenantData({
          name: 'Second Tenant',
          contact_email: 'second@test.com'
        })
      );
    });

    // Using it.skip for implemented but not ready tests
    it.skip('should bulk update tenant statuses', async () => {
      const res = await request(app)
        .post('/api/tenants/bulk/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tenantIds: [testTenant._id, secondTenant._id],
          status: 'inactive',
          reason: 'Bulk update test'
        });

      expect(res.status).toBe(200);
      expect(res.body.updatedCount).toBe(2);
    });

    it.skip('should handle invalid tenant IDs in bulk update', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/api/tenants/bulk/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tenantIds: [invalidId],
          status: 'inactive',
          reason: 'Test'
        });

      expect(res.status).toBe(404);
    });
  });
});