const mongoose = require('mongoose');
const { 
  paginateResults, 
  validatePaginationParams,
  buildSortOptions,
  buildSearchQuery 
} = require('../../utils/pagination');
const Tenant = require('../../models/tenantModel');

describe('Pagination Utilities', () => {
  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI_TEST);
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Tenant.deleteMany({});
  });

  describe('paginateResults', () => {
    beforeEach(async () => {
      // Create 15 test tenants
      const testTenants = Array.from({ length: 15 }, (_, i) => ({
        name: `Test Tenant ${i + 1}`,
        industry: i % 2 === 0 ? 'Technology' : 'Finance',
        contact_email: `test${i + 1}@example.com`,
        subscription_tier: 'Professional',
        compliance_level: 'Enhanced'
      }));
      await Tenant.insertMany(testTenants);
    });

    it('should return paginated results with default options', async () => {
      const result = await paginateResults(Tenant);
      
      expect(result.data).toHaveLength(10); // Default limit
      expect(result.pagination).toMatchObject({
        currentPage: 1,
        totalPages: 2,
        totalItems: 15,
        limit: 10,
        hasNext: true,
        hasPrev: false
      });
    });

    it('should handle custom page and limit', async () => {
      const result = await paginateResults(Tenant, {}, { page: 2, limit: 5 });
      
      expect(result.data).toHaveLength(5);
      expect(result.pagination).toMatchObject({
        currentPage: 2,
        totalPages: 3,
        totalItems: 15,
        limit: 5,
        hasNext: true,
        hasPrev: true
      });
    });

    it('should handle search queries', async () => {
      const result = await paginateResults(Tenant, {}, { 
        search: 'Technology',
        sortField: 'name',
        sortOrder: 1
      });
      
      expect(result.data.every(item => item.industry === 'Technology')).toBe(true);
    });

    it('should handle empty results', async () => {
      await Tenant.deleteMany({});
      const result = await paginateResults(Tenant);
      
      expect(result.data).toHaveLength(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  describe('validatePaginationParams', () => {
    it('should handle invalid inputs', () => {
      const testCases = [
        { input: { page: 'abc', limit: 'def' }, expected: { page: 1, limit: 10 } },
        { input: { page: -1, limit: 0 }, expected: { page: 1, limit: 1 } },
        { input: { page: 1000, limit: 1000 }, expected: { page: 1000, limit: 100 } },
        { input: { page: null, limit: undefined }, expected: { page: 1, limit: 10 } }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = validatePaginationParams(input.page, input.limit);
        expect(result).toEqual(expected);
      });
    });
  });

  describe('buildSortOptions', () => {
    it('should handle valid and invalid sort fields', () => {
      const testCases = [
        { 
          input: { sortBy: 'name', orderBy: 'asc' }, 
          expected: { sortField: 'name', sortOrder: 1 } 
        },
        { 
          input: { sortBy: 'invalid_field', orderBy: 'desc' }, 
          expected: { sortField: 'created_at', sortOrder: -1 } 
        },
        { 
          input: { sortBy: 'industry', orderBy: 'invalid_order' }, 
          expected: { sortField: 'industry', sortOrder: -1 } 
        }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = buildSortOptions(input.sortBy, input.orderBy);
        expect(result).toEqual(expected);
      });
    });
  });

  describe('buildSearchQuery', () => {
    it('should build correct search queries', () => {
      const testCases = [
        {
          input: { searchTerm: 'test', searchFields: ['name'] },
          expected: {
            $or: [{ name: { $regex: 'test', $options: 'i' } }]
          }
        },
        {
          input: { searchTerm: '' },
          expected: {}
        },
        {
          input: { 
            searchTerm: 'tech', 
            searchFields: ['name', 'industry', 'email'] 
          },
          expected: {
            $or: [
              { name: { $regex: 'tech', $options: 'i' } },
              { industry: { $regex: 'tech', $options: 'i' } },
              { email: { $regex: 'tech', $options: 'i' } }
            ]
          }
        }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = buildSearchQuery(
          input.searchTerm, 
          input.searchFields
        );
        expect(result).toEqual(expected);
      });
    });
  });
});