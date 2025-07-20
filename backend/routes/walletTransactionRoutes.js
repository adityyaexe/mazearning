// backend/routes/walletTransactionRoutes.js
const express = require("express");
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');

// Controllers
const walletTransactionController = require("../controllers/walletTransactionController");

// Middleware
const { authenticateToken, adminOnly, requireOwnershipOrAdmin } = require("../middleware/auth");

// Rate limiting configurations
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const financialRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 financial operations per windowMs
  message: {
    success: false,
    error: 'Too many financial requests from this IP, please try again later.'
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
  
  body('isInflow')
    .isBoolean()
    .withMessage('isInflow must be boolean'),
  
  body('paymentMethod')
    .isIn([
      'internal', 'razorpay', 'paytm', 'phonepe', 'googlepay', 'upi', 
      'netbanking', 'credit_card', 'debit_card', 'wallet', 'bank_transfer', 
      'cash', 'admin_adjustment', 'referral_bonus', 'task_reward', 
      'cashback', 'refund', 'withdrawal'
    ])
    .withMessage('Invalid payment method'),
  
  body('currency')
    .isIn(['INR', 'USD', 'EUR', 'GBP'])
    .withMessage('Currency must be one of: INR, USD, EUR, GBP'),
  
  body('status')
    .optional()
    .isIn(['successful', 'pending', 'failed', 'cancelled', 'refunded'])
    .withMessage('Invalid status'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('category')
    .optional()
    .isIn([
      'earning', 'withdrawal', 'refund', 'bonus', 'penalty', 
      'adjustment', 'transfer', 'purchase', 'reward', 'cashback', 'referral'
    ])
    .withMessage('Invalid transaction category'),
  
  body('externalTransactionId')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('External transaction ID cannot exceed 200 characters'),
  
  body('fee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Fee must be non-negative'),
  
  body('tax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Tax must be non-negative'),
  
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object'),
];

const validateTransactionUpdate = [
  body('status')
    .optional()
    .isIn(['successful', 'pending', 'failed', 'cancelled', 'refunded'])
    .withMessage('Invalid status'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('adminNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Admin notes cannot exceed 1000 characters'),
  
  body('gatewayResponse')
    .optional()
    .isObject()
    .withMessage('Gateway response must be an object'),
  
  body('fee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Fee must be non-negative'),
  
  body('tax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Tax must be non-negative'),
  
  body('processedBy')
    .optional()
    .isMongoId()
    .withMessage('Invalid processed by user ID format'),
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
  
  query('paymentMethod')
    .optional()
    .isString()
    .withMessage('Payment method must be a string'),
  
  query('category')
    .optional()
    .isIn([
      'earning', 'withdrawal', 'refund', 'bonus', 'penalty', 
      'adjustment', 'transfer', 'purchase', 'reward', 'cashback', 'referral'
    ])
    .withMessage('Invalid category'),
  
  query('currency')
    .optional()
    .isIn(['INR', 'USD', 'EUR', 'GBP'])
    .withMessage('Invalid currency'),
  
  query('isInflow')
    .optional()
    .isBoolean()
    .withMessage('isInflow must be boolean'),
  
  query('minAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum amount must be non-negative'),
  
  query('maxAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum amount must be non-negative'),
  
  query('fromDate')
    .optional()
    .isISO8601()
    .withMessage('From date must be a valid ISO8601 date'),
  
  query('toDate')
    .optional()
    .isISO8601()
    .withMessage('To date must be a valid ISO8601 date'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'amount', 'status', 'paymentMethod', 'processedAt'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  query('isFlagged')
    .optional()
    .isBoolean()
    .withMessage('isFlagged must be boolean'),
];

const validateBulkOperation = [
  body('transactionIds')
    .isArray({ min: 1, max: 100 })
    .withMessage('Transaction IDs must be an array with 1-100 items'),
  
  body('transactionIds.*')
    .isMongoId()
    .withMessage('Invalid transaction ID format'),
  
  body('action')
    .isIn(['updateStatus', 'delete', 'flag', 'unflag', 'verify', 'process'])
    .withMessage('Invalid bulk action'),
  
  body('newStatus')
    .if(body('action').equals('updateStatus'))
    .isIn(['successful', 'pending', 'failed', 'cancelled', 'refunded'])
    .withMessage('Invalid status for updateStatus action'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
  
  body('flagReason')
    .if(body('action').equals('flag'))
    .notEmpty()
    .withMessage('Flag reason is required for flag action'),
];

const validateVerification = [
  body('verified')
    .isBoolean()
    .withMessage('Verified must be boolean'),
  
  body('verificationNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Verification notes cannot exceed 1000 characters'),
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

// User transaction routes (users can access their own transactions)
router.get('/my/transactions', 
  generalRateLimit,
  validateTransactionQuery,
  handleValidationErrors,
  walletTransactionController.getMyTransactions
);

router.get('/my/summary', 
  generalRateLimit,
  walletTransactionController.getMyTransactionSummary
);

router.get('/my/analytics', 
  generalRateLimit,
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  handleValidationErrors,
  walletTransactionController.getMyTransactionAnalytics
);

router.get('/my/balance-history', 
  generalRateLimit,
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  query('granularity').optional().isIn(['day', 'week', 'month']).withMessage('Invalid granularity'),
  handleValidationErrors,
  walletTransactionController.getMyBalanceHistory
);

router.get('/my/recent', 
  generalRateLimit,
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  handleValidationErrors,
  walletTransactionController.getMyRecentTransactions
);

// User transaction statements and reports
router.get('/my/statement', 
  generalRateLimit,
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('format').optional().isIn(['pdf', 'csv', 'excel']).withMessage('Invalid format'),
  handleValidationErrors,
  walletTransactionController.generateMyStatement
);

router.get('/my/monthly-statement/:year/:month', 
  generalRateLimit,
  param('year').isInt({ min: 2020, max: 2030 }).withMessage('Invalid year'),
  param('month').isInt({ min: 1, max: 12 }).withMessage('Invalid month'),
  handleValidationErrors,
  walletTransactionController.getMyMonthlyStatement
);

// General routes (access controlled by individual controller methods)
router.get('/', 
  generalRateLimit,
  validateTransactionQuery,
  handleValidationErrors,
  walletTransactionController.listTransactions
);

router.get('/:id', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid transaction ID format'),
  handleValidationErrors,
  walletTransactionController.getTransactionById
);

// Transaction dispute and support
router.post('/:id/dispute', 
  strictRateLimit,
  param('id').isMongoId().withMessage('Invalid transaction ID format'),
  body('reason').notEmpty().withMessage('Dispute reason is required'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('evidence').optional().isArray().withMessage('Evidence must be an array'),
  handleValidationErrors,
  walletTransactionController.createTransactionDispute
);

router.get('/:id/dispute', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid transaction ID format'),
  handleValidationErrors,
  walletTransactionController.getTransactionDispute
);

// Transaction verification (for high-value transactions)
router.post('/:id/verify-otp', 
  strictRateLimit,
  param('id').isMongoId().withMessage('Invalid transaction ID format'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  handleValidationErrors,
  walletTransactionController.verifyTransactionOTP
);

router.post('/:id/resend-otp', 
  strictRateLimit,
  param('id').isMongoId().withMessage('Invalid transaction ID format'),
  handleValidationErrors,
  walletTransactionController.resendTransactionOTP
);

// Admin-only routes
router.use(adminOnly);

// Admin transaction management
router.post('/', 
  financialRateLimit,
  validateTransactionCreation,
  handleValidationErrors,
  walletTransactionController.createTransaction
);

router.put('/:id', 
  financialRateLimit,
  param('id').isMongoId().withMessage('Invalid transaction ID format'),
  validateTransactionUpdate,
  handleValidationErrors,
  walletTransactionController.updateTransaction
);

router.delete('/:id', 
  strictRateLimit,
  param('id').isMongoId().withMessage('Invalid transaction ID format'),
  handleValidationErrors,
  walletTransactionController.deleteTransaction
);

// Admin transaction status management
router.put('/:id/status', 
  financialRateLimit,
  param('id').isMongoId().withMessage('Invalid transaction ID format'),
  body('status').isIn(['successful', 'pending', 'failed', 'cancelled', 'refunded']).withMessage('Invalid status'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
  body('notifyUser').optional().isBoolean().withMessage('Notify user must be boolean'),
  handleValidationErrors,
  walletTransactionController.updateTransactionStatus
);

router.post('/:id/approve', 
  financialRateLimit,
  param('id').isMongoId().withMessage('Invalid transaction ID format'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
  body('processImmediately').optional().isBoolean().withMessage('Process immediately must be boolean'),
  handleValidationErrors,
  walletTransactionController.approveTransaction
);

router.post('/:id/reject', 
  financialRateLimit,
  param('id').isMongoId().withMessage('Invalid transaction ID format'),
  body('reason').notEmpty().withMessage('Rejection reason is required'),
  body('refundAmount').optional().isFloat({ min: 0 }).withMessage('Refund amount must be non-negative'),
  handleValidationErrors,
  walletTransactionController.rejectTransaction
);

router.post('/:id/process', 
  financialRateLimit,
  param('id').isMongoId().withMessage('Invalid transaction ID format'),
  body('forceProcess').optional().isBoolean().withMessage('Force process must be boolean'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
  handleValidationErrors,
  walletTransactionController.processTransaction
);

// Admin transaction verification and compliance
router.post('/:id/verify', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid transaction ID format'),
  validateVerification,
  handleValidationErrors,
  walletTransactionController.verifyTransaction
);

router.post('/:id/flag', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid transaction ID format'),
  body('reason').notEmpty().withMessage('Flag reason is required'),
  body('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity level'),
  body('category').optional().isIn(['fraud', 'suspicious', 'compliance', 'technical']).withMessage('Invalid flag category'),
  body('autoAction').optional().isIn(['none', 'hold', 'freeze_wallet']).withMessage('Invalid auto action'),
  handleValidationErrors,
  walletTransactionController.flagTransaction
);

router.delete('/:id/flag', 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid transaction ID format'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
  handleValidationErrors,
  walletTransactionController.unflagTransaction
);

// Admin bulk operations
router.post('/bulk-actions', 
  strictRateLimit,
  validateBulkOperation,
  handleValidationErrors,
  walletTransactionController.bulkActions
);

router.post('/bulk-export', 
  strictRateLimit,
  body('filters').optional().isObject().withMessage('Filters must be an object'),
  body('format').optional().isIn(['csv', 'xlsx', 'pdf']).withMessage('Invalid export format'),
  body('fields').optional().isArray().withMessage('Fields must be an array'),
  body('includeMetadata').optional().isBoolean().withMessage('Include metadata must be boolean'),
  handleValidationErrors,
  walletTransactionController.bulkExportTransactions
);

router.post('/bulk-import', 
  strictRateLimit,
  walletTransactionController.bulkImportTransactions
);

router.post('/bulk-process', 
  strictRateLimit,
  body('transactionIds').isArray({ min: 1, max: 50 }).withMessage('Transaction IDs must be an array with 1-50 items'),
  body('batchSize').optional().isInt({ min: 1, max: 10 }).withMessage('Batch size must be between 1 and 10'),
  body('delayBetweenBatches').optional().isInt({ min: 0, max: 10000 }).withMessage('Delay must be between 0 and 10000ms'),
  handleValidationErrors,
  walletTransactionController.bulkProcessTransactions
);

// Admin analytics and reporting
router.get('/admin/analytics', 
  generalRateLimit,
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  query('groupBy').optional().isIn(['hour', 'day', 'week', 'month']).withMessage('Invalid groupBy'),
  query('currency').optional().isIn(['INR', 'USD', 'EUR', 'GBP', 'all']).withMessage('Invalid currency'),
  handleValidationErrors,
  walletTransactionController.getTransactionAnalytics
);

router.get('/admin/statistics', 
  generalRateLimit,
  query('real_time').optional().isBoolean().withMessage('Real time must be boolean'),
  handleValidationErrors,
  walletTransactionController.getTransactionStatistics
);

router.get('/admin/daily-summary/:date', 
  generalRateLimit,
  param('date').isISO8601().withMessage('Invalid date format'),
  handleValidationErrors,
  walletTransactionController.getDailyTransactionSummary
);

router.get('/admin/hourly-volume', 
  generalRateLimit,
  query('date').optional().isISO8601().withMessage('Invalid date format'),
  handleValidationErrors,
  walletTransactionController.getHourlyTransactionVolume
);

router.get('/admin/payment-method-breakdown', 
  generalRateLimit,
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  handleValidationErrors,
  walletTransactionController.getPaymentMethodBreakdown
);

router.get('/admin/success-rate', 
  generalRateLimit,
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  query('groupBy').optional().isIn(['day', 'week', 'month']).withMessage('Invalid groupBy'),
  handleValidationErrors,
  walletTransactionController.getTransactionSuccessRate
);

// Admin fraud detection and monitoring
router.get('/admin/flagged', 
  generalRateLimit,
  query('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity'),
  query('category').optional().isIn(['fraud', 'suspicious', 'compliance', 'technical']).withMessage('Invalid category'),
  validateTransactionQuery,
  handleValidationErrors,
  walletTransactionController.getFlaggedTransactions
);

router.get('/admin/suspicious', 
  generalRateLimit,
  query('timeframe').optional().isIn(['1h', '24h', '7d', '30d']).withMessage('Invalid timeframe'),
  query('threshold').optional().isFloat({ min: 0 }).withMessage('Threshold must be non-negative'),
  query('pattern').optional().isIn(['velocity', 'amount', 'frequency', 'location']).withMessage('Invalid pattern'),
  handleValidationErrors,
  walletTransactionController.getSuspiciousTransactions
);

router.get('/admin/pending', 
  generalRateLimit,
  query('olderThan').optional().isInt({ min: 1 }).withMessage('Older than must be positive'),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  validateTransactionQuery,
  handleValidationErrors,
  walletTransactionController.getPendingTransactions
);

router.get('/admin/failed-analysis', 
  generalRateLimit,
  query('period').optional().isIn(['7d', '30d', '90d']).withMessage('Invalid period'),
  query('groupBy').optional().isIn(['error_code', 'payment_method', 'amount_range']).withMessage('Invalid groupBy'),
  handleValidationErrors,
  walletTransactionController.getFailedTransactionAnalysis
);

// Admin user transaction management
router.get('/admin/users/:userId/transactions', 
  generalRateLimit,
  param('userId').isMongoId().withMessage('Invalid user ID format'),
  validateTransactionQuery,
  handleValidationErrors,
  walletTransactionController.getUserTransactions
);

router.get('/admin/users/:userId/summary', 
  generalRateLimit,
  param('userId').isMongoId().withMessage('Invalid user ID format'),
  query('period').optional().isIn(['7d', '30d', '90d', '1y', 'all']).withMessage('Invalid period'),
  handleValidationErrors,
  walletTransactionController.getUserTransactionSummary
);

router.get('/admin/users/:userId/patterns', 
  generalRateLimit,
  param('userId').isMongoId().withMessage('Invalid user ID format'),
  query('period').optional().isIn(['30d', '90d', '1y']).withMessage('Invalid period'),
  handleValidationErrors,
  walletTransactionController.getUserTransactionPatterns
);

// Admin dispute management
router.get('/admin/disputes', 
  generalRateLimit,
  query('status').optional().isIn(['open', 'investigating', 'resolved', 'rejected']).withMessage('Invalid dispute status'),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  validateTransactionQuery,
  handleValidationErrors,
  walletTransactionController.getTransactionDisputes
);

router.put('/admin/disputes/:disputeId', 
  generalRateLimit,
  param('disputeId').isMongoId().withMessage('Invalid dispute ID format'),
  body('status').isIn(['investigating', 'resolved', 'rejected']).withMessage('Invalid dispute status'),
  body('resolution').optional().trim().isLength({ max: 1000 }).withMessage('Resolution cannot exceed 1000 characters'),
  body('compensationAmount').optional().isFloat({ min: 0 }).withMessage('Compensation amount must be non-negative'),
  handleValidationErrors,
  walletTransactionController.updateDisputeStatus
);

// Admin reconciliation and auditing
router.get('/admin/reconciliation', 
  generalRateLimit,
  query('date').optional().isISO8601().withMessage('Invalid date format'),
  query('gateway').optional().isString().withMessage('Gateway must be a string'),
  query('autoReconcile').optional().isBoolean().withMessage('Auto reconcile must be boolean'),
  handleValidationErrors,
  walletTransactionController.getReconciliationReport
);

router.post('/admin/reconciliation/run', 
  strictRateLimit,
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('gateway').optional().isString().withMessage('Gateway must be a string'),
  body('dryRun').optional().isBoolean().withMessage('Dry run must be boolean'),
  body('autoFix').optional().isBoolean().withMessage('Auto fix must be boolean'),
  handleValidationErrors,
  walletTransactionController.runReconciliation
);

router.get('/admin/audit-trail', 
  generalRateLimit,
  query('transactionId').optional().isMongoId().withMessage('Invalid transaction ID format'),
  query('adminId').optional().isMongoId().withMessage('Invalid admin ID format'),
  query('action').optional().isString().withMessage('Action must be a string'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  validateTransactionQuery,
  handleValidationErrors,
  walletTransactionController.getTransactionAuditTrail
);

// Admin gateway management and monitoring
router.get('/admin/gateways/status', 
  generalRateLimit,
  walletTransactionController.getGatewayStatus
);

router.get('/admin/gateways/performance', 
  generalRateLimit,
  query('period').optional().isIn(['1h', '24h', '7d', '30d']).withMessage('Invalid period'),
  query('gateway').optional().isString().withMessage('Gateway must be a string'),
  handleValidationErrors,
  walletTransactionController.getGatewayPerformance
);

router.post('/admin/gateways/:gateway/test', 
  strictRateLimit,
  param('gateway').isString().withMessage('Gateway must be a string'),
  body('testType').optional().isIn(['connectivity', 'transaction', 'webhook']).withMessage('Invalid test type'),
  handleValidationErrors,
  walletTransactionController.testGatewayConnection
);

// Admin system health and monitoring
router.get('/admin/health-metrics', 
  generalRateLimit,
  walletTransactionController.getTransactionHealthMetrics
);

router.get('/admin/processing-queue', 
  generalRateLimit,
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  handleValidationErrors,
  walletTransactionController.getProcessingQueue
);

router.post('/admin/processing-queue/clear', 
  strictRateLimit,
  body('reason').notEmpty().withMessage('Clear reason is required'),
  body('scope').optional().isIn(['failed', 'stuck', 'all']).withMessage('Invalid scope'),
  handleValidationErrors,
  walletTransactionController.clearProcessingQueue
);

// Admin configuration and settings
router.get('/admin/settings', 
  generalRateLimit,
  walletTransactionController.getTransactionSettings
);

router.put('/admin/settings', 
  generalRateLimit,
  body('autoProcessingEnabled').optional().isBoolean().withMessage('Auto processing enabled must be boolean'),
  body('autoProcessingThreshold').optional().isFloat({ min: 0 }).withMessage('Auto processing threshold must be non-negative'),
  body('fraudDetectionEnabled').optional().isBoolean().withMessage('Fraud detection enabled must be boolean'),
  body('maxRetryAttempts').optional().isInt({ min: 0, max: 10 }).withMessage('Max retry attempts must be between 0 and 10'),
  body('retryDelayMinutes').optional().isInt({ min: 1, max: 1440 }).withMessage('Retry delay must be between 1 and 1440 minutes'),
  body('suspiciousAmountThreshold').optional().isFloat({ min: 0 }).withMessage('Suspicious amount threshold must be non-negative'),
  body('dailyLimitEnabled').optional().isBoolean().withMessage('Daily limit enabled must be boolean'),
  body('defaultDailyLimit').optional().isFloat({ min: 0 }).withMessage('Default daily limit must be non-negative'),
  handleValidationErrors,
  walletTransactionController.updateTransactionSettings
);

// Admin maintenance and operations
router.post('/admin/maintenance/reprocess-failed', 
  strictRateLimit,
  body('fromDate').optional().isISO8601().withMessage('Invalid from date'),
  body('toDate').optional().isISO8601().withMessage('Invalid to date'),
  body('batchSize').optional().isInt({ min: 1, max: 100 }).withMessage('Batch size must be between 1 and 100'),
  body('dryRun').optional().isBoolean().withMessage('Dry run must be boolean'),
  handleValidationErrors,
  walletTransactionController.reprocessFailedTransactions
);

router.post('/admin/maintenance/cleanup-old', 
  strictRateLimit,
  body('olderThanDays').isInt({ min: 30, max: 3650 }).withMessage('Older than days must be between 30 and 3650'),
  body('statusesToCleanup').optional().isArray().withMessage('Statuses to cleanup must be an array'),
  body('dryRun').optional().isBoolean().withMessage('Dry run must be boolean'),
  handleValidationErrors,
  walletTransactionController.cleanupOldTransactions
);

// Emergency operations
router.post('/admin/emergency/halt-processing', 
  strictRateLimit,
  body('reason').notEmpty().withMessage('Emergency halt reason is required'),
  body('scope').optional().isIn(['all', 'gateway_specific', 'user_specific']).withMessage('Invalid scope'),
  body('duration').optional().isInt({ min: 1, max: 1440 }).withMessage('Duration must be between 1 and 1440 minutes'),
  handleValidationErrors,
  walletTransactionController.emergencyHaltProcessing
);

router.post('/admin/emergency/resume-processing', 
  strictRateLimit,
  body('reason').notEmpty().withMessage('Resume reason is required'),
  handleValidationErrors,
  walletTransactionController.resumeProcessing
);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Wallet Transaction service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
