const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../app');
const { Tenant } = require('../models/tenantModel');

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
      }
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

describe('Tenant API - Extended Features', () => {
  let authToken;

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
  });

  describe('Name Validation', () => {
    const testCases = [
      {
        description: 'should reject name when too short',
        name: 'A',
        expectedMessage: 'Name must be at least 2 characters'
      },
      {
        description: 'should reject name when too long',
        name: 'A'.repeat(101),
        expectedMessage: 'Name cannot exceed 100 characters'
      },
      {
        description: 'should reject when only whitespace',
        name: ' ',
        expectedMessage: 'Name is required'
      }
    ];

    test.each(testCases)(
      '$description',
      async ({ name, expectedMessage }) => {
        const res = await request(app)
          .post('/api/tenants')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            ...testUtils.createTestTenantData(),
            name
          });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain(expectedMessage);
      }
    );

    it('should accept valid name', async () => {
      const res = await request(app)
        .post('/api/tenants')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testUtils.createTestTenantData({
          name: 'Valid Tenant Name'
        }));

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Valid Tenant Name');
    });
  });

  describe('Pagination Features', () => {
    beforeEach(async () => {
      const tenants = Array.from({ length: 15 }, (_, i) => ({
        ...testUtils.createTestTenantData(),
        name: `Test Tenant ${i + 1}`,
        contact_email: `test${Date.now()}-${i}@example.com`
      }));
      await Tenant.create(tenants);
    });

    it('should handle pagination correctly', async () => {
      const res = await request(app)
        .get('/api/tenants')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 5 });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(5);
      expect(res.body.pagination).toMatchObject({
        currentPage: 1,
        totalPages: expect.any(Number),
        totalItems: 15
      });
    });

    it('should handle search queries', async () => {
      const specificTenant = await Tenant.create(
        testUtils.createTestTenantData({
          name: 'Unique Search Name'
        })
      );

      const res = await request(app)
        .get('/api/tenants')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'Unique Search' });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some(tenant => 
        tenant.name === 'Unique Search Name'
      )).toBe(true);
    });
  });
});