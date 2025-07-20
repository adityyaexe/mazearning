// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');

// Controllers
const userController = require('../controllers/userController');

// Middleware
const { authenticateToken, adminOnly, requireOwnershipOrAdmin } = require('../middleware/auth');

// Rate limiting configurations
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const createRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 create requests per windowMs
  message: {
    success: false,
    error: 'Too many user creation requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
const validateUserCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email cannot exceed 100 characters'),
  
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin'),
  
  body('status')
    .optional()
    .isIn(['active', 'suspended', 'deleted'])
    .withMessage('Status must be active, suspended, or deleted'),
  
  body('total_points')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total points must be non-negative'),
];

const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email cannot exceed 100 characters'),
  
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin'),
  
  body('status')
    .optional()
    .isIn(['active', 'suspended', 'deleted'])
    .withMessage('Status must be active, suspended, or deleted'),
  
  body('total_points')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total points must be non-negative'),
  
  body('kyc_verified')
    .optional()
    .isBoolean()
    .withMessage('KYC verified must be boolean'),
];

const validateUserQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  
  query('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be user or admin'),
  
  query('status')
    .optional()
    .isIn(['active', 'suspended', 'deleted'])
    .withMessage('Status must be active, suspended, or deleted'),
  
  query('kyc_verified')
    .optional()
    .isBoolean()
    .withMessage('KYC verified must be boolean'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO8601 date'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'name', 'email', 'total_points', 'status'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

const validateStatusUpdate = [
  body('status')
    .isIn(['active', 'suspended', 'deleted'])
    .withMessage('Status must be active, suspended, or deleted'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
];

const validatePointsUpdate = [
  body('points')
    .isInt()
    .withMessage('Points must be an integer'),
  
  body('operation')
    .isIn(['add', 'subtract', 'set'])
    .withMessage('Operation must be add, subtract, or set'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
];

const validateBulkOperation = [
  body('userIds')
    .isArray({ min: 1, max: 100 })
    .withMessage('User IDs must be an array with 1-100 items'),
  
  body('userIds.*')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  body('action')
    .isIn(['updateStatus', 'updateRole', 'delete', 'verify', 'unverify'])
    .withMessage('Invalid bulk action'),
  
  body('newStatus')
    .if(body('action').equals('updateStatus'))
    .isIn(['active', 'suspended', 'deleted'])
    .withMessage('Invalid status for updateStatus action'),
  
  body('newRole')
    .if(body('action').equals('updateRole'))
    .isIn(['user', 'admin'])
    .withMessage('Invalid role for updateRole action'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
];

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// All routes require authentication
router.use(authenticateToken);

// User self-service routes
router.get('/me/profile', 
  generalRateLimit,
  userController.getProfile
);

router.put('/me/profile', 
  generalRateLimit,
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').optional().isEmail().withMessage('Please provide a valid email address'),
  body('phone').optional().matches(/^\+?[1-9]\d{1,14}$/).withMessage('Please provide a valid phone number'),
  handleValidationErrors,
  userController.updateProfile
);

router.get('/me/activity/recent', 
  generalRateLimit,
  userController.recentActivity
);

router.get('/me/statistics', 
  generalRateLimit,
  userController.getMyStatistics
);

router.get('/me/analytics', 
  generalRateLimit,
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  handleValidationErrors,
  userController.getMyAnalytics
);

router.get('/me/transactions', 
  generalRateLimit,
  validateUserQuery,
  handleValidationErrors,
  userController.getMyTransactions
);

router.get('/me/earnings', 
  generalRateLimit,
  userController.getMyEarnings
);

router.get('/me/achievements', 
  generalRateLimit,
  userController.getMyAchievements
);

// User account management
router.put('/me/password', 
  strictRateLimit,
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8, max: 128 }).withMessage('New password must be between 8 and 128 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Password confirmation does not match new password');
    }
    return true;
  }),
  handleValidationErrors,
  userController.changePassword
);

router.post('/me/deactivate', 
  strictRateLimit,
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
  handleValidationErrors,
  userController.deactivateAccount
);

router.post('/me/export-data', 
  strictRateLimit,
  userController.exportMyData
);

// Public user discovery (with privacy controls)
router.get('/public/leaderboard', 
  generalRateLimit,
  query('category').optional().isIn(['points', 'apps', 'ads']).withMessage('Invalid category'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  handleValidationErrors,
  userController.getPublicLeaderboard
);

router.get('/public/:id/profile', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user ID format'),
  handleValidationErrors,
  userController.getPublicProfile
);

// Admin-only routes
router.use(adminOnly);

// Admin user management
router.get('/', 
  generalRateLimit,
  validateUserQuery,
  handleValidationErrors,
  userController.listUsers
);

router.get('/:id', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user ID format'),
  handleValidationErrors,
  userController.getUserById
);

router.post('/', 
  createRateLimit,
  validateUserCreation,
  handleValidationErrors,
  userController.createUser
);

router.put('/:id', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user ID format'),
  validateUserUpdate,
  handleValidationErrors,
  userController.updateUser
);

router.delete('/:id', 
  strictRateLimit,
  param('id').isMongoId().withMessage('Invalid user ID format'),
  handleValidationErrors,
  userController.deleteUser
);

// Admin user status management
router.put('/:id/status', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user ID format'),
  validateStatusUpdate,
  handleValidationErrors,
  userController.updateUserStatus
);

router.put('/:id/role', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user ID format'),
  body('role').isIn(['user', 'admin']).withMessage('Role must be user or admin'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
  handleValidationErrors,
  userController.updateUserRole
);

router.put('/:id/points', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user ID format'),
  validatePointsUpdate,
  handleValidationErrors,
  userController.updateUserPoints
);

router.put('/:id/verify', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user ID format'),
  body('verified').isBoolean().withMessage('Verified must be boolean'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
  handleValidationErrors,
  userController.updateUserVerification
);

// Admin user activity and analytics
router.get('/:id/activity', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user ID format'),
  validateUserQuery,
  handleValidationErrors,
  userController.getUserActivity
);

router.get('/:id/statistics', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user ID format'),
  handleValidationErrors,
  userController.getUserStatistics
);

router.get('/:id/analytics', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user ID format'),
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  handleValidationErrors,
  userController.getUserAnalytics
);

router.get('/:id/transactions', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user ID format'),
  validateUserQuery,
  handleValidationErrors,
  userController.getUserTransactions
);

router.get('/:id/earnings', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user ID format'),
  handleValidationErrors,
  userController.getUserEarnings
);

// Admin bulk operations
router.post('/bulk-actions', 
  strictRateLimit,
  validateBulkOperation,
  handleValidationErrors,
  userController.bulkActions
);

router.post('/bulk-export', 
  strictRateLimit,
  body('filters').optional().isObject().withMessage('Filters must be an object'),
  body('format').optional().isIn(['csv', 'xlsx', 'pdf']).withMessage('Invalid export format'),
  body('fields').optional().isArray().withMessage('Fields must be an array'),
  handleValidationErrors,
  userController.bulkExportUsers
);

router.post('/bulk-import', 
  strictRateLimit,
  userController.bulkImportUsers
);

// Admin analytics and reporting
router.get('/admin/analytics', 
  generalRateLimit,
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  query('groupBy').optional().isIn(['day', 'week', 'month']).withMessage('Invalid groupBy'),
  handleValidationErrors,
  userController.getAdminUserAnalytics
);

router.get('/admin/statistics', 
  generalRateLimit,
  userController.getUserStatistics
);

router.get('/admin/growth-metrics', 
  generalRateLimit,
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  handleValidationErrors,
  userController.getUserGrowthMetrics
);

router.get('/admin/engagement-report', 
  generalRateLimit,
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  handleValidationErrors,
  userController.getUserEngagementReport
);

router.get('/admin/retention-report', 
  generalRateLimit,
  query('cohort').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid cohort'),
  handleValidationErrors,
  userController.getUserRetentionReport
);

// Admin user discovery and management
router.get('/admin/top-users', 
  generalRateLimit,
  query('category').optional().isIn(['points', 'apps', 'ads', 'earnings']).withMessage('Invalid category'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
  userController.getTopUsers
);

router.get('/admin/inactive-users', 
  generalRateLimit,
  query('days').optional().isInt({ min: 1 }).withMessage('Days must be positive'),
  validateUserQuery,
  handleValidationErrors,
  userController.getInactiveUsers
);

router.get('/admin/new-users', 
  generalRateLimit,
  query('period').optional().isIn(['today', 'week', 'month']).withMessage('Invalid period'),
  validateUserQuery,
  handleValidationErrors,
  userController.getNewUsers
);

router.get('/admin/suspended-users', 
  generalRateLimit,
  validateUserQuery,
  handleValidationErrors,
  userController.getSuspendedUsers
);

router.get('/admin/unverified-users', 
  generalRateLimit,
  validateUserQuery,
  handleValidationErrors,
  userController.getUnverifiedUsers
);

// Admin user communication
router.post('/:id/send-notification', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user ID format'),
  body('title').notEmpty().trim().isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('message').notEmpty().trim().isLength({ max: 1000 }).withMessage('Message cannot exceed 1000 characters'),
  body('type').optional().isIn(['info', 'warning', 'success', 'error']).withMessage('Invalid notification type'),
  handleValidationErrors,
  userController.sendUserNotification
);

router.post('/bulk-notification', 
  strictRateLimit,
  body('userIds').isArray({ min: 1, max: 1000 }).withMessage('User IDs must be an array with 1-1000 items'),
  body('title').notEmpty().trim().isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('message').notEmpty().trim().isLength({ max: 1000 }).withMessage('Message cannot exceed 1000 characters'),
  body('type').optional().isIn(['info', 'warning', 'success', 'error']).withMessage('Invalid notification type'),
  handleValidationErrors,
  userController.sendBulkNotification
);

// Admin user audit and security
router.get('/:id/audit-trail', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user ID format'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('action').optional().isString().withMessage('Action must be a string'),
  handleValidationErrors,
  userController.getUserAuditTrail
);

router.get('/:id/login-history', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user ID format'),
  validateUserQuery,
  handleValidationErrors,
  userController.getUserLoginHistory
);

router.post('/:id/flag', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user ID format'),
  body('reason').notEmpty().withMessage('Flag reason is required'),
  body('severity').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid severity level'),
  handleValidationErrors,
  userController.flagUser
);

router.delete('/:id/flag', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user ID format'),
  handleValidationErrors,
  userController.unflagUser
);

router.get('/admin/flagged-users', 
  generalRateLimit,
  validateUserQuery,
  handleValidationErrors,
  userController.getFlaggedUsers
);

// Admin settings and configuration
router.get('/admin/settings', 
  generalRateLimit,
  userController.getUserSettings
);

router.put('/admin/settings', 
  generalRateLimit,
  body('registrationEnabled').optional().isBoolean().withMessage('Registration enabled must be boolean'),
  body('emailVerificationRequired').optional().isBoolean().withMessage('Email verification required must be boolean'),
  body('defaultRole').optional().isIn(['user']).withMessage('Default role must be user'),
  body('maxPointsPerDay').optional().isInt({ min: 0 }).withMessage('Max points per day must be non-negative'),
  body('pointsExpiryDays').optional().isInt({ min: 0 }).withMessage('Points expiry days must be non-negative'),
  handleValidationErrors,
  userController.updateUserSettings
);

// Admin user impersonation (for support)
router.post('/:id/impersonate', 
  strictRateLimit,
  param('id').isMongoId().withMessage('Invalid user ID format'),
  body('reason').notEmpty().withMessage('Impersonation reason is required'),
  body('duration').optional().isInt({ min: 1, max: 60 }).withMessage('Duration must be between 1 and 60 minutes'),
  handleValidationErrors,
  userController.impersonateUser
);

router.post('/stop-impersonation', 
  generalRateLimit,
  userController.stopImpersonation
);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'User service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
