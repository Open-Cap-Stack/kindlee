/**
 * Utility for handling pagination in MongoDB queries
 */
const paginateResults = async (model, query = {}, options = {}) => {
  // Extract and validate pagination parameters
  const page = Math.max(1, parseInt(options.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 10));
  const skip = (page - 1) * limit;
  
  // Extract and validate sorting parameters
  const sortField = options.sortField || 'created_at';
  const sortOrder = options.sortOrder || -1;
  
  // Build search query if search term is provided
  const searchQuery = options.search ? {
    $or: [
      { name: { $regex: options.search, $options: 'i' } },
      { industry: { $regex: options.search, $options: 'i' } }
    ]
  } : {};

  // Combine search query with existing query
  const finalQuery = { ...query, ...searchQuery };

  try {
    // Execute queries in parallel for better performance
    const [results, total] = await Promise.all([
      model
        .find(finalQuery)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      model.countDocuments(finalQuery)
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    return {
      data: results,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    throw new Error(`Pagination error: ${error.message}`);
  }
};

/**
 * Validate pagination parameters
 */
const validatePaginationParams = (page, limit) => {
  return {
    page: Math.max(1, parseInt(page) || 1),
    limit: Math.min(100, Math.max(1, parseInt(limit) || 10))
  };
};

/**
 * Build sort options for queries
 */
const buildSortOptions = (sortBy, orderBy) => {
  const validSortFields = ['name', 'created_at', 'updated_at', 'industry', 'status'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
  const sortOrder = orderBy === 'asc' ? 1 : -1;
  return { sortField, sortOrder };
};

/**
 * Build search query for MongoDB
 */
const buildSearchQuery = (searchTerm, searchFields = ['name', 'industry']) => {
  if (!searchTerm) return {};
  
  return {
    $or: searchFields.map(field => ({
      [field]: { $regex: searchTerm, $options: 'i' }
    }))
  };
};

module.exports = {
  paginateResults,
  validatePaginationParams,
  buildSortOptions,
  buildSearchQuery
};