const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const testUtils = {
  createTestTenantData: (overrides = {}) => ({
    name: 'Test Tenant',
    industry: 'Finance',
    contact_email: `test${Date.now()}-${Math.random().toString(36).substring(7)}@testtenant.com`,
    subscription_tier: 'Professional',
    compliance_level: 'Enhanced',
    metadata: {
      industry: 'Finance',
      region: 'NA',
      country: 'US',
      companySize: '11-50',
      primaryContact: {
        name: 'John Doe',
        position: 'CEO',
        phone: '+1234567890'
      },
      tags: ['test', 'demo']
    },
    settings: {
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      language: 'en-US',
      notificationPreferences: {
        email: true,
        slack: false
      }
    },
    ...overrides
  }),

  generateAuthToken: (role = 'admin') => {
    return jwt.sign(
      { id: new mongoose.Types.ObjectId(), role },
      process.env.JWT_SECRET || 'test-secret-key'
    );
  },

  clearDatabase: async () => {
    try {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
    } catch (error) {
      console.error('Error clearing database:', error);
      throw error;
    }
  }
};

module.exports = testUtils;