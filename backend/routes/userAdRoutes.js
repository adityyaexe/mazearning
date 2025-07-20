// backend/routes/userAdRoutes.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');

// Controllers
const userAdController = require('../controllers/userAdController');

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
    error: 'Too many ad creation requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const interactionRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 interaction requests per minute
  message: {
    success: false,
    error: 'Too many ad interaction requests from this IP, please try again later.'
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
const validateUserAdCreation = [
  body('user_id')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  body('ad_id')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Ad ID must be between 1 and 100 characters'),
  
  body('status')
    .optional()
    .isIn(['active', 'paused', 'completed', 'deleted', 'expired'])
    .withMessage('Status must be one of: active, paused, completed, deleted, expired'),
  
  body('campaign.name')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Campaign name cannot exceed 200 characters'),
  
  body('campaign.category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Campaign category cannot exceed 100 characters'),
  
  body('campaign.priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Campaign priority must be low, medium, or high'),
  
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO8601 date'),
  
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO8601 date')
    .custom((value, { req }) => {
      if (req.body.startDate && new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  body('dailyLimit')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Daily limit must be non-negative'),
  
  body('totalLimit')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total limit must be non-negative'),
  
  body('targetingCriteria')
    .optional()
    .isObject()
    .withMessage('Targeting criteria must be an object'),
];

const validateUserAdUpdate = [
  body('status')
    .optional()
    .isIn(['active', 'paused', 'completed', 'deleted', 'expired'])
    .withMessage('Status must be one of: active, paused, completed, deleted, expired'),
  
  body('campaign.name')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Campaign name cannot exceed 200 characters'),
  
  body('campaign.category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Campaign category cannot exceed 100 characters'),
  
  body('campaign.priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Campaign priority must be low, medium, or high'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  
  body('dailyLimit')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Daily limit must be non-negative'),
  
  body('totalLimit')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total limit must be non-negative'),
];

const validateUserAdQuery = [
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
    .isIn(['active', 'paused', 'completed', 'deleted', 'expired'])
    .withMessage('Invalid status'),
  
  query('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category cannot exceed 100 characters'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  
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
    .isIn(['createdAt', 'updatedAt', 'status', 'ad_id', 'earnings'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

const validateBulkOperation = [
  body('ids')
    .isArray({ min: 1, max: 100 })
    .withMessage('IDs must be an array with 1-100 items'),
  
  body('ids.*')
    .isMongoId()
    .withMessage('Invalid user ad ID format'),
  
  body('action')
    .isIn(['updateStatus', 'delete'])
    .withMessage('Invalid bulk action'),
  
  body('newStatus')
    .if(body('action').equals('updateStatus'))
    .isIn(['active', 'paused', 'completed', 'deleted', 'expired'])
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

// User routes (authenticated users can access their own ads)
router.get('/my/ads', 
  generalRateLimit,
  validateUserAdQuery,
  handleValidationErrors,
  userAdController.getMyUserAds
);

router.get('/my/stats', 
  generalRateLimit,
  userAdController.getMyUserAdStats
);

router.get('/my/analytics', 
  generalRateLimit,
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  handleValidationErrors,
  userAdController.getMyUserAdAnalytics
);

router.get('/my/earnings', 
  generalRateLimit,
  userAdController.getMyUserAdEarnings
);

router.get('/my/performance', 
  generalRateLimit,
  userAdController.getMyUserAdPerformance
);

// User ad interaction routes
router.post('/:id/view', 
  interactionRateLimit,
  param('id').isMongoId().withMessage('Invalid user ad ID format'),
  handleValidationErrors,
  userAdController.recordAdView
);

router.post('/:id/click', 
  interactionRateLimit,
  param('id').isMongoId().withMessage('Invalid user ad ID format'),
  handleValidationErrors,
  userAdController.recordAdClick
);

router.post('/:id/conversion', 
  interactionRateLimit,
  param('id').isMongoId().withMessage('Invalid user ad ID format'),
  body('earningAmount').optional().isFloat({ min: 0 }).withMessage('Earning amount must be non-negative'),
  handleValidationErrors,
  userAdController.recordAdConversion
);

// General routes (access controlled by individual controller methods)
router.get('/', 
  generalRateLimit,
  validateUserAdQuery,
  handleValidationErrors,
  userAdController.listUserAds
);

router.get('/:id', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user ad ID format'),
  handleValidationErrors,
  userAdController.getUserAdById
);

// User management of their own ads
router.post('/my/create', 
  createRateLimit,
  validateUserAdCreation,
  handleValidationErrors,
  userAdController.createMyUserAd
);

router.put('/my/:id', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user ad ID format'),
  validateUserAdUpdate,
  handleValidationErrors,
  userAdController.updateMyUserAd
);

router.delete('/my/:id', 
  strictRateLimit,
  param('id').isMongoId().withMessage('Invalid user ad ID format'),
  handleValidationErrors,
  userAdController.deleteMyUserAd
);

// User ad status management
router.put('/my/:id/pause', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user ad ID format'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
  handleValidationErrors,
  userAdController.pauseMyUserAd
);

router.put('/my/:id/resume', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user ad ID format'),
  handleValidationErrors,
  userAdController.resumeMyUserAd
);

router.put('/my/:id/complete', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user ad ID format'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
  handleValidationErrors,
  userAdController.completeMyUserAd
);

// User ad summary and history
router.get('/my/:id/summary', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user ad ID format'),
  handleValidationErrors,
  userAdController.getMyUserAdSummary
);

router.get('/my/:id/history', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user ad ID format'),
  handleValidationErrors,
  userAdController.getMyUserAdHistory
);

// Public ad discovery routes
router.get('/discover/active', 
  generalRateLimit,
  validateUserAdQuery,
  handleValidationErrors,
  userAdController.getActiveUserAds
);

router.get('/discover/categories', 
  generalRateLimit,
  userAdController.getUserAdCategories
);

router.get('/discover/trending', 
  generalRateLimit,
  userAdController.getTrendingUserAds
);

// Admin-only routes
router.use(adminOnly);

// Admin user ad management
router.post('/', 
  createRateLimit,
  validateUserAdCreation,
  handleValidationErrors,
  userAdController.createUserAd
);

router.put('/:id', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user ad ID format'),
  validateUserAdUpdate,
  handleValidationErrors,
  userAdController.updateUserAd
);

router.delete('/:id', 
  strictRateLimit,
  param('id').isMongoId().withMessage('Invalid user ad ID format'),
  handleValidationErrors,
  userAdController.deleteUserAd
);

// Admin user ad status management
router.put('/:id/status', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user ad ID format'),
  body('status').isIn(['active', 'paused', 'completed', 'deleted', 'expired']).withMessage('Invalid status'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
  handleValidationErrors,
  userAdController.updateUserAdStatus
);

router.post('/:id/approve', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user ad ID format'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
  handleValidationErrors,
  userAdController.approveUserAd
);

router.post('/:id/reject', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user ad ID format'),
  body('reason').notEmpty().withMessage('Rejection reason is required'),
  handleValidationErrors,
  userAdController.rejectUserAd
);

// Admin bulk operations
router.post('/bulk-actions', 
  strictRateLimit,
  validateBulkOperation,
  handleValidationErrors,
  userAdController.bulkActions
);

router.post('/bulk-export', 
  strictRateLimit,
  body('filters').optional().isObject().withMessage('Filters must be an object'),
  body('format').optional().isIn(['csv', 'xlsx', 'pdf']).withMessage('Invalid export format'),
  handleValidationErrors,
  userAdController.bulkExportUserAds
);

// Admin analytics and reporting
router.get('/admin/analytics', 
  generalRateLimit,
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  query('groupBy').optional().isIn(['day', 'week', 'month']).withMessage('Invalid groupBy'),
  handleValidationErrors,
  userAdController.getAdminUserAdAnalytics
);

router.get('/admin/statistics', 
  generalRateLimit,
  userAdController.getUserAdStatistics
);

router.get('/admin/performance', 
  generalRateLimit,
  userAdController.getUserAdPerformanceMetrics
);

router.get('/admin/revenue-report', 
  generalRateLimit,
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  handleValidationErrors,
  userAdController.getUserAdRevenueReport
);

// Admin user management
router.get('/admin/users/:userId/ads', 
  generalRateLimit,
  param('userId').isMongoId().withMessage('Invalid user ID format'),
  validateUserAdQuery,
  handleValidationErrors,
  userAdController.getUserAdsByUserId
);

router.get('/admin/users/:userId/summary', 
  generalRateLimit,
  param('userId').isMongoId().withMessage('Invalid user ID format'),
  handleValidationErrors,
  userAdController.getUserAdSummaryByUserId
);

router.get('/admin/users/:userId/performance', 
  generalRateLimit,
  param('userId').isMongoId().withMessage('Invalid user ID format'),
  handleValidationErrors,
  userAdController.getUserAdPerformanceByUserId
);

// Admin quality management
router.post('/:id/flag', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user ad ID format'),
  body('reason').notEmpty().withMessage('Flag reason is required'),
  body('severity').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid severity level'),
  handleValidationErrors,
  userAdController.flagUserAd
);

router.delete('/:id/flag', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid user ad ID format'),
  handleValidationErrors,
  userAdController.unflagUserAd
);

router.get('/admin/flagged', 
  generalRateLimit,
  userAdController.getFlaggedUserAds
);

// Admin campaign management
router.get('/admin/campaigns', 
  generalRateLimit,
  userAdController.getAdCampaigns
);

router.get('/admin/campaigns/:campaignId/ads', 
  generalRateLimit,
  param('campaignId').notEmpty().withMessage('Campaign ID is required'),
  handleValidationErrors,
  userAdController.getAdsByCampaign
);

router.get('/admin/campaigns/:campaignId/performance', 
  generalRateLimit,
  param('campaignId').notEmpty().withMessage('Campaign ID is required'),
  handleValidationErrors,
  userAdController.getCampaignPerformance
);

// Admin optimization and recommendations
router.get('/admin/optimization/recommendations', 
  generalRateLimit,
  userAdController.getOptimizationRecommendations
);

router.get('/admin/optimization/underperforming', 
  generalRateLimit,
  userAdController.getUnderperformingAds
);

router.get('/admin/optimization/top-performers', 
  generalRateLimit,
  userAdController.getTopPerformingAds
);

// Admin audit trail
router.get('/admin/audit-trail', 
  generalRateLimit,
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('action').optional().isString().withMessage('Action must be a string'),
  handleValidationErrors,
  userAdController.getUserAdAuditTrail
);

// Admin settings
router.get('/admin/settings', 
  generalRateLimit,
  userAdController.getUserAdSettings
);

router.put('/admin/settings', 
  generalRateLimit,
  body('autoApproval').optional().isBoolean().withMessage('Auto approval must be boolean'),
  body('defaultStatus').optional().isIn(['active', 'paused']).withMessage('Invalid default status'),
  body('maxAdsPerUser').optional().isInt({ min: 1 }).withMessage('Max ads per user must be positive'),
  handleValidationErrors,
  userAdController.updateUserAdSettings
);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'UserAd service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

