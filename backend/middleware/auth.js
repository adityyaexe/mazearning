// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');

/**
 * Middleware to authenticate requests via JWT token
 * - Verifies token from Authorization header
 * - Fetches fresh user data from database
 * - Checks user status and existence
 * - Sets req.user with complete user object
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Authorization header missing'
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token missing'
      });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      let errorMessage = 'Invalid or expired token';
      
      if (err.name === 'TokenExpiredError') {
        errorMessage = 'Token has expired';
      } else if (err.name === 'JsonWebTokenError') {
        errorMessage = 'Invalid token format';
      } else if (err.name === 'NotBeforeError') {
        errorMessage = 'Token not active yet';
      }
      
      return res.status(403).json({
        success: false,
        error: errorMessage
      });
    }

    // Validate token payload
    if (!decoded || !decoded.id) {
      return res.status(403).json({
        success: false,
        error: 'Invalid token payload'
      });
    }

    // Fetch fresh user data from database
    const user = await User.findById(decoded.id).select('-passwordHash');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found or account deleted'
      });
    }

    // Check user status
    if (user.status === 'deleted') {
      return res.status(401).json({
        success: false,
        error: 'Account has been deleted'
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: 'Account has been suspended'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Account is not active'
      });
    }

    // Set user data on request object
    req.user = user;
    req.userId = user._id; // Keep for backward compatibility

    next();
  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during authentication'
    });
  }
};

/**
 * Middleware to restrict access to admin users only
 * - Must be used after authenticateToken
 * - Checks if user has admin role
 */
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin privileges required'
    });
  }

  next();
};

/**
 * Middleware to restrict access to specific roles
 * - Must be used after authenticateToken
 * - Accepts array of allowed roles
 */
const requireRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Middleware to check if user can access their own resource or is admin
 * - Must be used after authenticateToken
 * - Allows users to access their own data or admins to access any data
 */
const requireOwnershipOrAdmin = (userIdParam = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const resourceUserId = req.params[userIdParam];
    
    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // User can only access their own resource
    if (req.user._id.toString() !== resourceUserId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You can only access your own resources'
      });
    }

    next();
  };
};

/**
 * Optional middleware to refresh user data
 * - Useful for long-running requests where user data might change
 * - Must be used after authenticateToken
 */
const refreshUserData = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    const freshUser = await User.findById(req.user._id).select('-passwordHash');
    
    if (!freshUser) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    req.user = freshUser;
    next();
  } catch (err) {
    console.error('Error refreshing user data:', err);
    next(); // Continue without refreshing data
  }
};

/**
 * Middleware to log authentication events
 * - Logs successful and failed authentication attempts
 * - Useful for security monitoring
 */
const logAuthEvent = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    const statusCode = res.statusCode;
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ip = req.ip || req.connection.remoteAddress;
    
    if (statusCode === 401 || statusCode === 403) {
      console.log(`[AUTH FAILED] ${new Date().toISOString()} - IP: ${ip} - User-Agent: ${userAgent} - Status: ${statusCode}`);
    } else if (req.user) {
      console.log(`[AUTH SUCCESS] ${new Date().toISOString()} - User: ${req.user.email} - IP: ${ip} - Role: ${req.user.role}`);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

/**
 * Middleware to validate JWT without requiring authentication
 * - Useful for optional authentication endpoints
 * - Sets req.user if token is valid, continues if not
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next();
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return next(); // Continue without authentication
    }

    // Validate token payload
    if (!decoded || !decoded.id) {
      return next();
    }

    // Fetch user data
    const user = await User.findById(decoded.id).select('-passwordHash');
    
    if (user && user.status === 'active') {
      req.user = user;
      req.userId = user._id;
    }

    next();
  } catch (err) {
    console.error('Optional auth error:', err);
    next(); // Continue without authentication
  }
};

module.exports = {
  authenticateToken,
  adminOnly,
  requireRoles,
  requireOwnershipOrAdmin,
  refreshUserData,
  logAuthEvent,
  optionalAuth
};
