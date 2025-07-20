// backend/routes/surveys.js
const express = require("express");
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');

// Controllers
const surveyController = require('../controllers/surveyController');

// Middleware
const { authenticateToken, adminOnly, optionalAuth } = require('../middleware/auth');

// Rate limiting configurations
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const submissionRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 survey submissions per hour
  message: {
    success: false,
    error: 'Too many survey submissions from this IP, please try again later.'
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
const validateSurveyCreation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('reward')
    .isInt({ min: 0, max: 10000 })
    .withMessage('Reward must be between 0 and 10000'),
  
  body('category')
    .optional()
    .isIn(['lifestyle', 'technology', 'entertainment', 'health', 'education', 'business', 'other'])
    .withMessage('Invalid category'),
  
  body('targetAudience')
    .optional()
    .isObject()
    .withMessage('Target audience must be an object'),
  
  body('questions')
    .isArray({ min: 1, max: 50 })
    .withMessage('Survey must have between 1 and 50 questions'),
  
  body('questions.*.question')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Each question must be between 5 and 500 characters'),
  
  body('questions.*.type')
    .isIn(['multiple_choice', 'single_choice', 'text', 'rating', 'boolean', 'date'])
    .withMessage('Invalid question type'),
  
  body('questions.*.required')
    .optional()
    .isBoolean()
    .withMessage('Required field must be boolean'),
  
  body('estimatedTime')
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage('Estimated time must be between 1 and 60 minutes'),
  
  body('maxResponses')
    .optional()
    .isInt({ min: 1, max: 100000 })
    .withMessage('Max responses must be between 1 and 100000'),
  
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
];

const validateSurveyUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('reward')
    .optional()
    .isInt({ min: 0, max: 10000 })
    .withMessage('Reward must be between 0 and 10000'),
  
  body('status')
    .optional()
    .isIn(['draft', 'active', 'paused', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  
  body('category')
    .optional()
    .isIn(['lifestyle', 'technology', 'entertainment', 'health', 'education', 'business', 'other'])
    .withMessage('Invalid category'),
];

const validateSurveySubmission = [
  body('surveyId')
    .isMongoId()
    .withMessage('Invalid survey ID'),
  
  body('responses')
    .isArray({ min: 1 })
    .withMessage('Responses must be a non-empty array'),
  
  body('responses.*.questionId')
    .isMongoId()
    .withMessage('Invalid question ID'),
  
  body('responses.*.answer')
    .notEmpty()
    .withMessage('Answer cannot be empty'),
  
  body('timeSpent')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Time spent must be a positive integer'),
];

const validateSurveyQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('category')
    .optional()
    .isIn(['lifestyle', 'technology', 'entertainment', 'health', 'education', 'business', 'other'])
    .withMessage('Invalid category'),
  
  query('status')
    .optional()
    .isIn(['draft', 'active', 'paused', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  
  query('minReward')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum reward must be non-negative'),
  
  query('maxReward')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Maximum reward must be non-negative'),
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

// Public routes (no authentication required)
router.get('/public', 
  generalRateLimit,
  validateSurveyQuery,
  handleValidationErrors,
  surveyController.getPublicSurveys
);

router.get('/public/:id', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid survey ID'),
  handleValidationErrors,
  surveyController.getPublicSurvey
);

// Routes that work with or without authentication
router.get('/', 
  generalRateLimit,
  optionalAuth,
  validateSurveyQuery,
  handleValidationErrors,
  surveyController.getSurveys
);

router.get('/:id', 
  generalRateLimit,
  optionalAuth,
  param('id').isMongoId().withMessage('Invalid survey ID'),
  handleValidationErrors,
  surveyController.getSurvey
);

// Protected routes (require authentication)
router.use(authenticateToken);

// User survey interactions
router.post('/submit', 
  submissionRateLimit,
  validateSurveySubmission,
  handleValidationErrors,
  surveyController.submitSurvey
);

router.get('/my/completed', 
  generalRateLimit,
  surveyController.getMyCompletedSurveys
);

router.get('/my/available', 
  generalRateLimit,
  surveyController.getMyAvailableSurveys
);

router.get('/my/progress', 
  generalRateLimit,
  surveyController.getMySurveyProgress
);

router.get('/my/earnings', 
  generalRateLimit,
  surveyController.getMySurveyEarnings
);

router.get('/my/history', 
  generalRateLimit,
  surveyController.getMySurveyHistory
);

// Survey interaction tracking
router.post('/:id/start', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid survey ID'),
  handleValidationErrors,
  surveyController.startSurvey
);

router.post('/:id/pause', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid survey ID'),
  handleValidationErrors,
  surveyController.pauseSurvey
);

router.post('/:id/resume', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid survey ID'),
  handleValidationErrors,
  surveyController.resumeSurvey
);

router.post('/:id/abandon', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid survey ID'),
  handleValidationErrors,
  surveyController.abandonSurvey
);

// Survey feedback and rating
router.post('/:id/feedback', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid survey ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('feedback').optional().trim().isLength({ max: 1000 }).withMessage('Feedback cannot exceed 1000 characters'),
  handleValidationErrors,
  surveyController.submitSurveyFeedback
);

// Survey discovery and recommendations
router.get('/recommendations/for-me', 
  generalRateLimit,
  surveyController.getSurveyRecommendations
);

router.get('/categories', 
  generalRateLimit,
  surveyController.getSurveyCategories
);

router.get('/trending', 
  generalRateLimit,
  surveyController.getTrendingSurveys
);

// Admin routes
router.use(adminOnly);

// Admin survey management
router.post('/', 
  generalRateLimit,
  validateSurveyCreation,
  handleValidationErrors,
  surveyController.createSurvey
);

router.put('/:id', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid survey ID'),
  validateSurveyUpdate,
  handleValidationErrors,
  surveyController.updateSurvey
);

router.delete('/:id', 
  strictRateLimit,
  param('id').isMongoId().withMessage('Invalid survey ID'),
  handleValidationErrors,
  surveyController.deleteSurvey
);

// Admin survey status management
router.put('/:id/status', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid survey ID'),
  body('status').isIn(['draft', 'active', 'paused', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
  handleValidationErrors,
  surveyController.updateSurveyStatus
);

router.post('/:id/duplicate', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid survey ID'),
  handleValidationErrors,
  surveyController.duplicateSurvey
);

// Admin survey analytics
router.get('/:id/analytics', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid survey ID'),
  handleValidationErrors,
  surveyController.getSurveyAnalytics
);

router.get('/:id/responses', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid survey ID'),
  handleValidationErrors,
  surveyController.getSurveyResponses
);

router.get('/:id/statistics', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid survey ID'),
  handleValidationErrors,
  surveyController.getSurveyStatistics
);

// Admin global analytics
router.get('/admin/analytics', 
  generalRateLimit,
  surveyController.getGlobalSurveyAnalytics
);

router.get('/admin/stats', 
  generalRateLimit,
  surveyController.getAdminSurveyStats
);

router.get('/admin/performance', 
  generalRateLimit,
  surveyController.getSurveyPerformanceMetrics
);

// Admin user management
router.get('/admin/users/:userId/surveys', 
  generalRateLimit,
  param('userId').isMongoId().withMessage('Invalid user ID'),
  handleValidationErrors,
  surveyController.getUserSurveys
);

router.get('/admin/users/:userId/responses', 
  generalRateLimit,
  param('userId').isMongoId().withMessage('Invalid user ID'),
  handleValidationErrors,
  surveyController.getUserSurveyResponses
);

// Admin bulk operations
router.post('/admin/bulk-update', 
  strictRateLimit,
  body('surveyIds').isArray().withMessage('Survey IDs must be an array'),
  body('action').isIn(['activate', 'pause', 'complete', 'cancel', 'delete']).withMessage('Invalid action'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
  handleValidationErrors,
  surveyController.bulkUpdateSurveys
);

router.post('/admin/bulk-delete', 
  strictRateLimit,
  body('surveyIds').isArray().withMessage('Survey IDs must be an array'),
  body('confirmDelete').equals('DELETE').withMessage('Please type DELETE to confirm'),
  handleValidationErrors,
  surveyController.bulkDeleteSurveys
);

// Admin survey templates
router.get('/admin/templates', 
  generalRateLimit,
  surveyController.getSurveyTemplates
);

router.post('/admin/templates', 
  generalRateLimit,
  validateSurveyCreation,
  handleValidationErrors,
  surveyController.createSurveyTemplate
);

router.post('/admin/templates/:id/use', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid template ID'),
  handleValidationErrors,
  surveyController.createSurveyFromTemplate
);

// Admin reporting
router.get('/admin/reports/completion', 
  generalRateLimit,
  surveyController.getSurveyCompletionReport
);

router.get('/admin/reports/engagement', 
  generalRateLimit,
  surveyController.getSurveyEngagementReport
);

router.get('/admin/reports/revenue', 
  generalRateLimit,
  surveyController.getSurveyRevenueReport
);

// Admin survey quality management
router.post('/:id/flag', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid survey ID'),
  body('reason').notEmpty().withMessage('Reason is required'),
  handleValidationErrors,
  surveyController.flagSurvey
);

router.delete('/:id/flag', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid survey ID'),
  handleValidationErrors,
  surveyController.unflagSurvey
);

// Admin response management
router.get('/admin/responses/flagged', 
  generalRateLimit,
  surveyController.getFlaggedResponses
);

router.put('/admin/responses/:responseId/verify', 
  generalRateLimit,
  param('responseId').isMongoId().withMessage('Invalid response ID'),
  body('verified').isBoolean().withMessage('Verified must be boolean'),
  handleValidationErrors,
  surveyController.verifyResponse
);

router.delete('/admin/responses/:responseId', 
  strictRateLimit,
  param('responseId').isMongoId().withMessage('Invalid response ID'),
  handleValidationErrors,
  surveyController.deleteResponse
);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Survey service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

