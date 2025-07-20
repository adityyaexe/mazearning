// UserApp Routes (backend/routes/userAppRoutes.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');

// Controllers
const userAppController = require('../controllers/userAppController');

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
  max: 50, // limit each IP to 50 create requests per windowMs
  message: {
    success: false,
    error: 'Too many app creation requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const interactionRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 interaction requests per minute
  message: {
    success: false,
    error: 'Too many app interaction requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
const validateUserAppCreation = [
  body('user_id')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  body('app_id')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('App ID must be between 1 and 100 characters'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'pending', 'deleted', 'suspended', 'completed'])
    .withMessage('Status must be one of: active, inactive, pending, deleted, suspended, completed'),
  
  body('appDetails.name')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('App name cannot exceed 200 characters'),
  
  body('appDetails.category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('App category cannot exceed 100 characters'),
  
  body('appDetails.version')
    .optional()
    .trim()
    .matches(/^\d+\.\d+\.\d+$/)
    .withMessage('Version must be in format x.y.z'),
  
  body('appDetails.packageName')
    .optional()
    .trim()
    .matches(/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+[0-9a-z_]$/)
    .withMessage('Invalid package name format'),
  
  body('appDetails.rating')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('appDetails.size')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('App size must be non-negative'),
  
  body('deviceInfo.platform')
    .optional()
    .isIn(['android', 'ios', 'web'])
    .withMessage('Platform must be android, ios, or web'),
  
  body('requirements.minAndroidVersion')
    .optional()
    .matches(/^\d+\.\d+$/)
    .withMessage('Invalid Android version format'),
  
  body('requirements.minIOSVersion')
    .optional()
    .matches(/^\d+\.\d+$/)
    .withMessage('Invalid iOS version format'),
  
  body('requirements.minRAM')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum RAM must be non-negative'),
  
  body('requirements.internetRequired')
    .optional()
    .isBoolean()
    .withMessage('Internet required must be boolean'),
];

const validateUserAppUpdate = [
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'pending', 'deleted', 'suspended', 'completed'])
    .withMessage('Status must be one of: active, inactive, pending, deleted, suspended, completed'),
  
  body('appDetails.name')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('App name cannot exceed 200 characters'),
  
  body('appDetails.category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('App category cannot exceed 100 characters'),
  
  body('appDetails.rating')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  
  body('performanceScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Performance score must be between 0 and 100'),
];

const validateUserAppQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('user_id')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'pending', 'deleted', 'suspended', 'completed'])
    .withMessage('Invalid status'),
  
  query('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category cannot exceed 100 characters'),
  
  query('platform')
    .optional()
    .isIn(['android', 'ios', 'web'])
    .withMessage('Platform must be android, ios, or web'),
  
  query('installed')
    .optional()
    .isBoolean()
    .withMessage('Installed must be boolean'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'status', 'app_id', 'earnings', 'performanceScore'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

const validateTaskCreation = [
  body('taskId')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Task ID must be between 1 and 50 characters'),
  
  body('description')
    .notEmpty()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Task description must be between 5 and 500 characters'),
  
  body('reward')
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Reward must be between 0 and 10000'),
  
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid ISO8601 date'),
];

const validateBulkOperation = [
  body('ids')
    .isArray({ min: 1, max: 100 })
    .withMessage('IDs must be an array with 1-100 items'),
  
  body('ids.*')
    .isMongoId()
    .withMessage('Invalid user app ID format'),
  
  body('action')
    .isIn(['updateStatus', 'delete'])
    .withMessage('Invalid bulk action'),
  
  body('newStatus')
    .if(body('action').equals('updateStatus'))
    .isIn(['active', 'inactive', 'pending', 'deleted', 'suspended', 'completed'])
    .withMessage('Invalid status for update action'),
  
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

// User routes (authenticated users can access their own apps)
router.get('/my/apps', 
  generalRateLimit,
  validateUserAppQuery,
  handleValidationErrors,
  userAppController.getMyUserApps
);

router.get('/my/stats', 
  generalRateLimit,
  userAppController.getMyUserAppStats
);

router.get('/my/analytics', 
  generalRateLimit,
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  handleValidationErrors,
  userAppController.getMyUserAppAnalytics
);

router.get('/my/earnings', 
  generalRateLimit,
  userAppController.getMyUserAppEarnings
);

router.get('/my/performance', 
  generalRateLimit,
  userAppController.getMyUserAppPerformance
);

// User app interaction routes
router.post('/:id/download', 
  interactionRateLimit,
  param('id').isMongoId().withMessage('Invalid user app ID format'),
  handleValidationErrors,
  userAppController.recordAppDownload
);

router.post('/:id/install', 
  interactionRateLimit,
  param('id').isMongoId().withMessage('Invalid user app ID format'),
  handleValidationErrors,
  userAppController.recordAppInstall
);

router.post('/:id/open', 
  interactionRateLimit,
  param('id').isMongoId().withMessage('Invalid user app ID format'),
  body('sessionTime').optional().isInt({ min: 0 }).withMessage('Session time must be non-negative'),
  handleValidationErrors,
  userAppController.recordAppOpen
);

router.post('/:id/uninstall', 
  interactionRateLimit,
  param('id').isMongoId().withMessage('Invalid user app ID format'),
  handleValidationErrors,
  userAppController.recordAppUninstall
);

router.post('/:id/crash', 
  interactionRateLimit,
  param('id').isMongoId().withMessage('Invalid user app ID format'),
  handleValidationErrors,
  userAppController.recordAppCrash
);

// General routes (access controlled by individual controller methods)
router.get('/', 
  generalRateLimit,
  validateUserAppQuery,
  handleValidationErrors,
  userAppController.listUserApps
);

router.get('/:id', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user app ID format'),
  handleValidationErrors,
  userAppController.getUserAppById
);

// User management of their own apps
router.post('/my/create', 
  createRateLimit,
  validateUserAppCreation,
  handleValidationErrors,
  userAppController.createMyUserApp
);

router.put('/my/:id', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user app ID format'),
  validateUserAppUpdate,
  handleValidationErrors,
  userAppController.updateMyUserApp
);

router.delete('/my/:id', 
  strictRateLimit,
  param('id').isMongoId().withMessage('Invalid user app ID format'),
  handleValidationErrors,
  userAppController.deleteMyUserApp
);

// User app status management
router.put('/my/:id/suspend', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user app ID format'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
  handleValidationErrors,
  userAppController.suspendMyUserApp
);

router.put('/my/:id/activate', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user app ID format'),
  handleValidationErrors,
  userAppController.activateMyUserApp
);

router.put('/my/:id/complete', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user app ID format'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
  handleValidationErrors,
  userAppController.completeMyUserApp
);

// Task management for user apps
router.get('/my/:id/tasks', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user app ID format'),
  handleValidationErrors,
  userAppController.getMyUserAppTasks
);

router.post('/my/:id/tasks', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user app ID format'),
  validateTaskCreation,
  handleValidationErrors,
  userAppController.addTaskToMyUserApp
);

router.put('/my/:id/tasks/:taskId/complete', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user app ID format'),
  param('taskId').notEmpty().withMessage('Task ID is required'),
  handleValidationErrors,
  userAppController.completeMyUserAppTask
);

// User app summary and history
router.get('/my/:id/summary', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user app ID format'),
  handleValidationErrors,
  userAppController.getMyUserAppSummary
);

router.get('/my/:id/history', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user app ID format'),
  handleValidationErrors,
  userAppController.getMyUserAppHistory
);

// Public app discovery routes
router.get('/discover/active', 
  generalRateLimit,
  validateUserAppQuery,
  handleValidationErrors,
  userAppController.getActiveUserApps
);

router.get('/discover/categories', 
  generalRateLimit,
  userAppController.getUserAppCategories
);

router.get('/discover/trending', 
  generalRateLimit,
  userAppController.getTrendingUserApps
);

router.get('/discover/top-rated', 
  generalRateLimit,
  userAppController.getTopRatedUserApps
);

router.get('/discover/new-releases', 
  generalRateLimit,
  userAppController.getNewReleaseUserApps
);

// App recommendations
router.get('/recommendations/for-me', 
  generalRateLimit,
  userAppController.getUserAppRecommendations
);

// Admin-only routes
router.use(adminOnly);

// Admin user app management
router.post('/', 
  createRateLimit,
  validateUserAppCreation,
  handleValidationErrors,
  userAppController.createUserApp
);

router.put('/:id', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user app ID format'),
  validateUserAppUpdate,
  handleValidationErrors,
  userAppController.updateUserApp
);

router.delete('/:id', 
  strictRateLimit,
  param('id').isMongoId().withMessage('Invalid user app ID format'),
  handleValidationErrors,
  userAppController.deleteUserApp
);

// Admin user app status management
router.put('/:id/status', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user app ID format'),
  body('status').isIn(['active', 'inactive', 'pending', 'deleted', 'suspended', 'completed']).withMessage('Invalid status'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
  handleValidationErrors,
  userAppController.updateUserAppStatus
);

router.post('/:id/approve', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user app ID format'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
  handleValidationErrors,
  userAppController.approveUserApp
);

router.post('/:id/reject', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user app ID format'),
  body('reason').notEmpty().withMessage('Rejection reason is required'),
  handleValidationErrors,
  userAppController.rejectUserApp
);

// Admin task management
router.get('/:id/tasks', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user app ID format'),
  handleValidationErrors,
  userAppController.getUserAppTasks
);

router.post('/:id/tasks', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user app ID format'),
  validateTaskCreation,
  handleValidationErrors,
  userAppController.addTaskToUserApp
);

router.put('/:id/tasks/:taskId', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user app ID format'),
  param('taskId').notEmpty().withMessage('Task ID is required'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('reward').optional().isFloat({ min: 0 }).withMessage('Reward must be non-negative'),
  handleValidationErrors,
  userAppController.updateUserAppTask
);

router.delete('/:id/tasks/:taskId', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user app ID format'),
  param('taskId').notEmpty().withMessage('Task ID is required'),
  handleValidationErrors,
  userAppController.deleteUserAppTask
);

// Admin bulk operations
router.post('/bulk-actions', 
  strictRateLimit,
  validateBulkOperation,
  handleValidationErrors,
  userAppController.bulkActions
);

router.post('/bulk-export', 
  strictRateLimit,
  body('filters').optional().isObject().withMessage('Filters must be an object'),
  body('format').optional().isIn(['csv', 'xlsx', 'pdf']).withMessage('Invalid export format'),
  handleValidationErrors,
  userAppController.bulkExportUserApps
);

// Admin analytics and reporting
router.get('/admin/analytics', 
  generalRateLimit,
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  query('groupBy').optional().isIn(['day', 'week', 'month']).withMessage('Invalid groupBy'),
  handleValidationErrors,
  userAppController.getAdminUserAppAnalytics
);

router.get('/admin/statistics', 
  generalRateLimit,
  userAppController.getUserAppStatistics
);

router.get('/admin/performance', 
  generalRateLimit,
  userAppController.getUserAppPerformanceMetrics
);

router.get('/admin/engagement-report', 
  generalRateLimit,
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  handleValidationErrors,
  userAppController.getUserAppEngagementReport
);

router.get('/admin/retention-report', 
  generalRateLimit,
  query('period').optional().isIn(['7d', '30d', '90d']).withMessage('Invalid period'),
  handleValidationErrors,
  userAppController.getUserAppRetentionReport
);

// Admin user management
router.get('/admin/users/:userId/apps', 
  generalRateLimit,
  param('userId').isMongoId().withMessage('Invalid user ID format'),
  validateUserAppQuery,
  handleValidationErrors,
  userAppController.getUserAppsByUserId
);

router.get('/admin/users/:userId/summary', 
  generalRateLimit,
  param('userId').isMongoId().withMessage('Invalid user ID format'),
  handleValidationErrors,
  userAppController.getUserAppSummaryByUserId
);

router.get('/admin/users/:userId/performance', 
  generalRateLimit,
  param('userId').isMongoId().withMessage('Invalid user ID format'),
  handleValidationErrors,
  userAppController.getUserAppPerformanceByUserId
);

// Admin quality management
router.post('/:id/flag', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user app ID format'),
  body('reason').notEmpty().withMessage('Flag reason is required'),
  body('severity').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid severity level'),
  handleValidationErrors,
  userAppController.flagUserApp
);

router.delete('/:id/flag', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user app ID format'),
  handleValidationErrors,
  userAppController.unflagUserApp
);

router.get('/admin/flagged', 
  generalRateLimit,
  userAppController.getFlaggedUserApps
);

// Admin performance monitoring
router.get('/admin/stale-apps', 
  generalRateLimit,
  query('daysSinceLastOpen').optional().isInt({ min: 1 }).withMessage('Days must be positive'),
  handleValidationErrors,
  userAppController.getStaleUserApps
);

router.get('/admin/top-performing', 
  generalRateLimit,
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  handleValidationErrors,
  userAppController.getTopPerformingUserApps
);

router.get('/admin/pending-tasks', 
  generalRateLimit,
  userAppController.getUserAppsWithPendingTasks
);

// Admin platform analytics
router.get('/admin/platform-analytics', 
  generalRateLimit,
  userAppController.getPlatformAnalytics
);

router.get('/admin/category-performance', 
  generalRateLimit,
  userAppController.getCategoryPerformance
);

// Admin optimization and recommendations
router.get('/admin/optimization/recommendations', 
  generalRateLimit,
  userAppController.getOptimizationRecommendations
);

router.get('/admin/optimization/underperforming', 
  generalRateLimit,
  userAppController.getUnderperformingApps
);

// Admin audit trail
router.get('/admin/audit-trail', 
  generalRateLimit,
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('action').optional().isString().withMessage('Action must be a string'),
  handleValidationErrors,
  userAppController.getUserAppAuditTrail
);

// Admin settings
router.get('/admin/settings', 
  generalRateLimit,
  userAppController.getUserAppSettings
);

router.put('/admin/settings', 
  generalRateLimit,
  body('autoApproval').optional().isBoolean().withMessage('Auto approval must be boolean'),
  body('defaultStatus').optional().isIn(['active', 'pending']).withMessage('Invalid default status'),
  body('maxAppsPerUser').optional().isInt({ min: 1 }).withMessage('Max apps per user must be positive'),
  body('taskAutoComplete').optional().isBoolean().withMessage('Task auto complete must be boolean'),
  handleValidationErrors,
  userAppController.updateUserAppSettings
);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'UserApp service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

