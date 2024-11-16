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

describe('Tenant API', () => {
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

  describe('Tenant Creation (POST /api/tenants)', () => {
    describe('Validation', () => {
      const requiredFields = [
        { field: 'Name', fieldKey: 'name', testData: {} },
        { field: 'Industry', fieldKey: 'industry', testData: { name: 'Test Tenant' } },
        { field: 'Contact email', fieldKey: 'contact_email', testData: { name: 'Test Tenant', industry: 'Finance' } },
        { field: 'Subscription tier', fieldKey: 'subscription_tier', testData: { name: 'Test Tenant', industry: 'Finance', contact_email: 'test@example.com' } },
        { field: 'Compliance level', fieldKey: 'compliance_level', testData: { name: 'Test Tenant', industry: 'Finance', contact_email: 'test@example.com', subscription_tier: 'Professional' } }
      ];

      test.each(requiredFields)(
        'should require $field field',
        async ({ field, testData }) => {
          const res = await request(app)
            .post('/api/tenants')
            .set('Authorization', `Bearer ${authToken}`)
            .send(testData);

          expect(res.status).toBe(400);
          expect(res.body.message).toContain(`${field} is required`);
        }
      );

      const invalidEmails = [
        'invalid-email',
        'test@',
        '@domain.com',
        'test@domain',
        'test.com'
      ];

      test.each(invalidEmails)(
        'should reject invalid email: %s',
        async (email) => {
          const res = await request(app)
            .post('/api/tenants')
            .set('Authorization', `Bearer ${authToken}`)
            .send(testUtils.createTestTenantData({ contact_email: email }));

          expect(res.status).toBe(400);
          expect(res.body.message).toMatch(/Invalid email format/);
        }
      );

      const invalidIndustries = [
        'InvalidIndustry',
        'Unknown',
        ''
      ];

      test.each(invalidIndustries)(
        'should reject invalid industry: %s',
        async (industry) => {
          const res = await request(app)
            .post('/api/tenants')
            .set('Authorization', `Bearer ${authToken}`)
            .send(testUtils.createTestTenantData({ industry }));

          expect(res.status).toBe(400);
          expect(res.body.message).toMatch(/Invalid industry/);
        }
      );
    });
  });

  describe('GET /api/tenants', () => {
    it('should get all tenants with pagination', async () => {
      const tenants = Array.from({ length: 15 }, (_, i) => ({
        ...testUtils.createTestTenantData(),
        name: `Test Tenant ${i + 1}`,
        contact_email: `test${Date.now()}-${i}@example.com`
      }));
      await Tenant.create(tenants);

      const res = await request(app)
        .get('/api/tenants')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(10);
      expect(res.body.pagination).toMatchObject({
        currentPage: 1,
        totalPages: 2,
        totalItems: 15
      });
    });

    it('should filter by search and industry', async () => {
      await Tenant.create([
        testUtils.createTestTenantData({ name: 'Alpha Tech', industry: 'Technology' }),
        testUtils.createTestTenantData({ name: 'Beta Finance', industry: 'Finance' }),
        testUtils.createTestTenantData({ name: 'Alpha Finance', industry: 'Finance' })
      ]);

      const res = await request(app)
        .get('/api/tenants')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          search: 'Alpha',
          industry: 'Finance'
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Alpha Finance');
    });
  });
});