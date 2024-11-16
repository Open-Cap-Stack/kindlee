const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret-key');
      
      // Add user info to request
      req.user = {
        id: decoded.id,
        role: decoded.role
      };
      
      next();
    } catch (error) {
      return res.status(401).json({ 
        message: 'Invalid token.'
      });
    }
  } catch (error) {
    return res.status(500).json({ 
      message: 'Authentication error.'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Forbidden: Insufficient permissions'
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize
};