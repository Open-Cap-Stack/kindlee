const mongoose = require('mongoose');

// Check database connection status
const checkConnection = async (connection) => {
  if (!connection || connection.readyState !== 1) {
    throw new Error('Database connection not available');
  }
};

// Validate if an ID is a valid MongoDB ObjectId
const validateTenantId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid tenant ID format');
  }
};

// Handle Mongoose errors and return formatted responses
const handleError = (error) => {
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map((err) => err.message);
    return { status: 400, message: messages.join(', ') };
  }
  if (error.message === 'Invalid tenant ID format') {
    return { status: 400, message: error.message };
  }
  return { status: 500, message: 'Internal server error' };
};

module.exports = {
  checkConnection,
  validateTenantId,
  handleError,
};
