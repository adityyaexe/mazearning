// backend/routes/transactions.js

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');

// Controllers
const transactionController = require('../controllers/transactionController');

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
    error: 'Too many transaction creation requests from this IP, please try again later.'
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
const validateTransactionCreation = [
  body('userId')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  body('amount')
    .isFloat({ min: 0.01, max: 1000000 })
    .withMessage('Amount must be between 0.01 and 1,000,000'),
  
  body('currency')
    .isIn(['INR', 'USD', 'EUR', 'GBP'])
    .withMessage('Currency must be one of: INR, USD, EUR, GBP'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('paymentGateway')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Payment gateway name cannot exceed 50 characters'),
  
  body('transactionId')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Transaction ID cannot exceed 100 characters'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address'),
  
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object'),
];

const validateTransactionUpdate = [
  body('paymentStatus')
    .optional()
    .isIn(['successful', 'pending', 'failed', 'cancelled', 'refunded'])
    .withMessage('Invalid payment status'),
  
  body('amount')
    .optional()
    .isFloat({ min: 0.01, max: 1000000 })
    .withMessage('Amount must be between 0.01 and 1,000,000'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  
  body('gatewayResponse')
    .optional()
    .isObject()
    .withMessage('Gateway response must be an object'),
];

const validateTransactionQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('userId')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  query('status')
    .optional()
    .isIn(['successful', 'pending', 'failed', 'cancelled', 'refunded'])
    .withMessage('Invalid status'),
  
  query('currency')
    .optional()
    .isIn(['INR', 'USD', 'EUR', 'GBP'])
    .withMessage('Invalid currency'),
  
  query('minAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum amount must be non-negative'),
  
  query('maxAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum amount must be non-negative'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO8601 date'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'amount', 'paymentStatus', 'currency'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

const validateRefundRequest = [
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Refund amount must be positive'),
  
  body('reason')
    .notEmpty()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters'),
  
  body('refundMethod')
    .optional()
    .isIn(['original', 'wallet', 'bank_transfer'])
    .withMessage('Invalid refund method'),
];

const validateBulkOperation = [
  body('transactionIds')
    .isArray({ min: 1, max: 100 })
    .withMessage('Transaction IDs must be an array with 1-100 items'),
  
  body('transactionIds.*')
    .isMongoId()
    .withMessage('Invalid transaction ID format'),
  
  body('action')
    .isIn(['updateStatus', 'delete', 'refund', 'approve', 'reject'])
    .withMessage('Invalid bulk action'),
  
  body('newStatus')
    .if(body('action').equals('updateStatus'))
    .isIn(['successful', 'pending', 'failed', 'cancelled', 'refunded'])
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

// User transaction routes
router.get('/', 
  generalRateLimit,
  validateTransactionQuery,
  handleValidationErrors,
  transactionController.listTransactions
);

router.get('/:id', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid transaction ID format'),
  handleValidationErrors,
  transactionController.getTransaction
);

// User transaction history and analytics
router.get('/my/history', 
  generalRateLimit,
  validateTransactionQuery,
  handleValidationErrors,
  transactionController.getMyTransactionHistory
);

router.get('/my/summary', 
  generalRateLimit,
  transactionController.getMyTransactionSummary
);

router.get('/my/analytics', 
  generalRateLimit,
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  handleValidationErrors,
  transactionController.getMyTransactionAnalytics
);

// Transaction status tracking
router.get('/:id/status-history', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid transaction ID format'),
  handleValidationErrors,
  transactionController.getTransactionStatusHistory
);

// Transaction receipts and documentation
router.get('/:id/receipt', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid transaction ID format'),
  handleValidationErrors,
  transactionController.getTransactionReceipt
);

router.get('/:id/invoice', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid transaction ID format'),
  handleValidationErrors,
  transactionController.generateTransactionInvoice
);

// Transaction disputes and support
router.post('/:id/dispute', 
  strictRateLimit,
  param('id').isMongoId().withMessage('Invalid transaction ID format'),
  body('reason').notEmpty().withMessage('Dispute reason is required'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  handleValidationErrors,
  transactionController.createTransactionDispute
);

router.get('/:id/dispute', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid transaction ID format'),
  handleValidationErrors,
  transactionController.getTransactionDispute
);

// Admin-only routes
router.use(adminOnly);

// Admin transaction management
router.post('/', 
  createRateLimit,
  validateTransactionCreation,
  handleValidationErrors,
  transactionController.createTransaction
);

router.put('/:id', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid transaction ID format'),
  validateTransactionUpdate,
  handleValidationErrors,
  transactionController.updateTransaction
);

router.delete('/:id', 
  strictRateLimit,
  param('id').isMongoId().withMessage('Invalid transaction ID format'),
  handleValidationErrors,
  transactionController.deleteTransaction
);

// Admin transaction status management
router.put('/:id/status', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid transaction ID format'),
  body('status').isIn(['successful', 'pending', 'failed', 'cancelled', 'refunded']).withMessage('Invalid status'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
  handleValidationErrors,
  transactionController.updateTransactionStatus
);

router.post('/:id/approve', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid transaction ID format'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
  handleValidationErrors,
  transactionController.approveTransaction
);

router.post('/:id/reject', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid transaction ID format'),
  body('reason').notEmpty().withMessage('Rejection reason is required'),
  handleValidationErrors,
  transactionController.rejectTransaction
);

// Admin refund management
router.post('/:id/refund', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid transaction ID format'),
  validateRefundRequest,
  handleValidationErrors,
  transactionController.processRefund
);

router.get('/:id/refunds', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid transaction ID format'),
  handleValidationErrors,
  transactionController.getTransactionRefunds
);

// Admin bulk operations
router.post('/bulk-action', 
  strictRateLimit,
  validateBulkOperation,
  handleValidationErrors,
  transactionController.bulkTransactionAction
);

router.post('/bulk-export', 
  strictRateLimit,
  body('filters').optional().isObject().withMessage('Filters must be an object'),
  body('format').optional().isIn(['csv', 'xlsx', 'pdf']).withMessage('Invalid export format'),
  handleValidationErrors,
  transactionController.bulkExportTransactions
);

// Admin analytics and reporting
router.get('/admin/analytics', 
  generalRateLimit,
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  query('groupBy').optional().isIn(['day', 'week', 'month']).withMessage('Invalid groupBy'),
  handleValidationErrors,
  transactionController.getAdminTransactionAnalytics
);

router.get('/admin/statistics', 
  generalRateLimit,
  transactionController.getTransactionStatistics
);

router.get('/admin/performance', 
  generalRateLimit,
  transactionController.getTransactionPerformanceMetrics
);

router.get('/admin/revenue-report', 
  generalRateLimit,
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  handleValidationErrors,
  transactionController.getRevenueReport
);

// Admin fraud detection and monitoring
router.get('/admin/suspicious', 
  generalRateLimit,
  transactionController.getSuspiciousTransactions
);

router.post('/:id/flag', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid transaction ID format'),
  body('reason').notEmpty().withMessage('Flag reason is required'),
  body('severity').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid severity level'),
  handleValidationErrors,
  transactionController.flagTransaction
);

router.delete('/:id/flag', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid transaction ID format'),
  handleValidationErrors,
  transactionController.unflagTransaction
);

// Admin user transaction management
router.get('/admin/users/:userId/transactions', 
  generalRateLimit,
  param('userId').isMongoId().withMessage('Invalid user ID format'),
  validateTransactionQuery,
  handleValidationErrors,
  transactionController.getUserTransactions
);

router.get('/admin/users/:userId/summary', 
  generalRateLimit,
  param('userId').isMongoId().withMessage('Invalid user ID format'),
  handleValidationErrors,
  transactionController.getUserTransactionSummary
);

// Admin dispute management
router.get('/admin/disputes', 
  generalRateLimit,
  transactionController.getTransactionDisputes
);

router.put('/admin/disputes/:disputeId', 
  generalRateLimit,
  param('disputeId').isMongoId().withMessage('Invalid dispute ID format'),
  body('status').isIn(['open', 'investigating', 'resolved', 'rejected']).withMessage('Invalid dispute status'),
  body('resolution').optional().trim().isLength({ max: 1000 }).withMessage('Resolution cannot exceed 1000 characters'),
  handleValidationErrors,
  transactionController.updateDisputeStatus
);

// Admin reconciliation
router.get('/admin/reconciliation', 
  generalRateLimit,
  query('date').optional().isISO8601().withMessage('Invalid date format'),
  handleValidationErrors,
  transactionController.getReconciliationReport
);

router.post('/admin/reconciliation/run', 
  strictRateLimit,
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  handleValidationErrors,
  transactionController.runReconciliation
);

// Admin gateway management
router.get('/admin/gateways/status', 
  generalRateLimit,
  transactionController.getGatewayStatus
);

router.get('/admin/gateways/performance', 
  generalRateLimit,
  transactionController.getGatewayPerformance
);

// Admin audit trails
router.get('/admin/audit-trail', 
  generalRateLimit,
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('action').optional().isString().withMessage('Action must be a string'),
  handleValidationErrors,
  transactionController.getAuditTrail
);

// Admin settings and configuration
router.get('/admin/settings', 
  generalRateLimit,
  transactionController.getTransactionSettings
);

router.put('/admin/settings', 
  generalRateLimit,
  body('autoApprovalLimit').optional().isFloat({ min: 0 }).withMessage('Auto approval limit must be non-negative'),
  body('manualReviewThreshold').optional().isFloat({ min: 0 }).withMessage('Manual review threshold must be non-negative'),
  body('fraudDetectionEnabled').optional().isBoolean().withMessage('Fraud detection enabled must be boolean'),
  handleValidationErrors,
  transactionController.updateTransactionSettings
);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Transaction service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
