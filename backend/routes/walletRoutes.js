// backend/routes/walletRoutes.js
const express = require("express");
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');

// Controllers
const walletController = require("../controllers/walletController");

// Middleware
const { authenticateToken, adminOnly } = require("../middleware/auth");

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
const validateWalletCreation = [
  body('userId')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  body('currency')
    .optional()
    .isIn(['INR', 'USD', 'EUR', 'GBP'])
    .withMessage('Currency must be one of: INR, USD, EUR, GBP'),
  
  body('initialBalance')
    .optional()
    .isFloat({ min: 0, max: 1000000 })
    .withMessage('Initial balance must be between 0 and 1,000,000'),
  
  body('limits.dailyWithdrawal')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Daily withdrawal limit must be non-negative'),
  
  body('limits.monthlyWithdrawal')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Monthly withdrawal limit must be non-negative'),
  
  body('limits.maxBalance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum balance limit must be non-negative'),
  
  body('limits.minWithdrawal')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum withdrawal amount must be non-negative'),
  
  body('status')
    .optional()
    .isIn(['active', 'frozen', 'suspended', 'closed'])
    .withMessage('Status must be one of: active, frozen, suspended, closed'),
  
  body('isVerified')
    .optional()
    .isBoolean()
    .withMessage('isVerified must be boolean'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
];

const validateWalletUpdate = [
  body('balance')
    .optional()
    .isFloat({ min: 0, max: 10000000 })
    .withMessage('Balance must be between 0 and 10,000,000'),
  
  body('currency')
    .optional()
    .isIn(['INR', 'USD', 'EUR', 'GBP'])
    .withMessage('Currency must be one of: INR, USD, EUR, GBP'),
  
  body('status')
    .optional()
    .isIn(['active', 'frozen', 'suspended', 'closed'])
    .withMessage('Status must be one of: active, frozen, suspended, closed'),
  
  body('isVerified')
    .optional()
    .isBoolean()
    .withMessage('isVerified must be boolean'),
  
  body('limits.dailyWithdrawal')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Daily withdrawal limit must be non-negative'),
  
  body('limits.monthlyWithdrawal')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Monthly withdrawal limit must be non-negative'),
  
  body('limits.maxBalance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum balance limit must be non-negative'),
  
  body('limits.minWithdrawal')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum withdrawal amount must be non-negative'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  
  body('lastUpdatedBy')
    .optional()
    .isMongoId()
    .withMessage('Invalid lastUpdatedBy user ID format'),
];

const validateBalanceOperation = [
  body('amount')
    .isFloat({ min: 0.01, max: 1000000 })
    .withMessage('Amount must be between 0.01 and 1,000,000'),
  
  body('reason')
    .notEmpty()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  body('reference')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Reference cannot exceed 100 characters'),
];

const validateWalletQuery = [
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
    .isIn(['active', 'frozen', 'suspended', 'closed'])
    .withMessage('Invalid wallet status'),
  
  query('currency')
    .optional()
    .isIn(['INR', 'USD', 'EUR', 'GBP'])
    .withMessage('Invalid currency'),
  
  query('isVerified')
    .optional()
    .isBoolean()
    .withMessage('isVerified must be boolean'),
  
  query('isFlagged')
    .optional()
    .isBoolean()
    .withMessage('isFlagged must be boolean'),
  
  query('minBalance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum balance must be non-negative'),
  
  query('maxBalance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum balance must be non-negative'),
  
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
    .isIn(['createdAt', 'balance', 'lastTransactionDate', 'status', 'totalTransactions'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

const validateBulkOperation = [
  body('walletIds')
    .isArray({ min: 1, max: 100 })
    .withMessage('Wallet IDs must be an array with 1-100 items'),
  
  body('walletIds.*')
    .isMongoId()
    .withMessage('Invalid wallet ID format'),
  
  body('action')
    .isIn(['adjustBalance', 'resetBalance', 'freeze', 'unfreeze', 'suspend', 'activate', 'verify', 'unverify', 'delete'])
    .withMessage('Invalid bulk action'),
  
  body('balanceAdjustment')
    .if(body('action').equals('adjustBalance'))
    .isFloat()
    .withMessage('Balance adjustment must be a number'),
  
  body('reason')
    .notEmpty()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
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

// All routes require admin authentication
router.use(authenticateToken, adminOnly);

// Basic wallet management
router.get("/", 
  generalRateLimit,
  validateWalletQuery,
  handleValidationErrors,
  walletController.listWallets
);

router.get("/:id", 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid wallet ID format'),
  handleValidationErrors,
  walletController.getWalletById
);

router.post("/", 
  financialRateLimit,
  validateWalletCreation,
  handleValidationErrors,
  walletController.createWallet
);

router.put("/:id", 
  financialRateLimit,
  param('id').isMongoId().withMessage('Invalid wallet ID format'),
  validateWalletUpdate,
  handleValidationErrors,
  walletController.updateWallet
);

router.delete("/:id", 
  strictRateLimit,
  param('id').isMongoId().withMessage('Invalid wallet ID format'),
  handleValidationErrors,
  walletController.deleteWallet
);

// Advanced wallet operations
router.post("/:id/credit", 
  financialRateLimit,
  param('id').isMongoId().withMessage('Invalid wallet ID format'),
  validateBalanceOperation,
  handleValidationErrors,
  walletController.creditWallet
);

router.post("/:id/debit", 
  financialRateLimit,
  param('id').isMongoId().withMessage('Invalid wallet ID format'),
  validateBalanceOperation,
  handleValidationErrors,
  walletController.debitWallet
);

router.post("/:id/freeze", 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid wallet ID format'),
  body('reason').notEmpty().withMessage('Freeze reason is required'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be positive'),
  handleValidationErrors,
  walletController.freezeWallet
);

router.post("/:id/unfreeze", 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid wallet ID format'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
  handleValidationErrors,
  walletController.unfreezeWallet
);

router.post("/:id/suspend", 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid wallet ID format'),
  body('reason').notEmpty().withMessage('Suspension reason is required'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be positive'),
  handleValidationErrors,
  walletController.suspendWallet
);

router.post("/:id/activate", 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid wallet ID format'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
  handleValidationErrors,
  walletController.activateWallet
);

// Wallet verification and compliance
router.post("/:id/verify", 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid wallet ID format'),
  body('verificationLevel').optional().isIn(['basic', 'advanced', 'premium']).withMessage('Invalid verification level'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
  handleValidationErrors,
  walletController.verifyWallet
);

router.post("/:id/unverify", 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid wallet ID format'),
  body('reason').notEmpty().withMessage('Unverification reason is required'),
  handleValidationErrors,
  walletController.unverifyWallet
);

router.post("/:id/flag", 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid wallet ID format'),
  body('reason').notEmpty().withMessage('Flag reason is required'),
  body('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity level'),
  body('category').optional().isIn(['fraud', 'suspicious', 'compliance', 'technical']).withMessage('Invalid flag category'),
  handleValidationErrors,
  walletController.flagWallet
);

router.delete("/:id/flag", 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid wallet ID format'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
  handleValidationErrors,
  walletController.unflagWallet
);

// Wallet reconciliation and auditing
router.post("/:id/reconcile", 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid wallet ID format'),
  body('forceReconcile').optional().isBoolean().withMessage('Force reconcile must be boolean'),
  handleValidationErrors,
  walletController.reconcileWallet
);

router.get("/:id/audit-trail", 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid wallet ID format'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('action').optional().isString().withMessage('Action must be a string'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
  handleValidationErrors,
  walletController.getWalletAuditTrail
);

router.get("/:id/balance-history", 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid wallet ID format'),
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  query('granularity').optional().isIn(['hour', 'day', 'week', 'month']).withMessage('Invalid granularity'),
  handleValidationErrors,
  walletController.getWalletBalanceHistory
);

router.get("/:id/transaction-summary", 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid wallet ID format'),
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  handleValidationErrors,
  walletController.getWalletTransactionSummary
);

// Wallet limits and settings management
router.put("/:id/limits", 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid wallet ID format'),
  body('dailyWithdrawal').optional().isFloat({ min: 0 }).withMessage('Daily withdrawal limit must be non-negative'),
  body('monthlyWithdrawal').optional().isFloat({ min: 0 }).withMessage('Monthly withdrawal limit must be non-negative'),
  body('maxBalance').optional().isFloat({ min: 0 }).withMessage('Maximum balance limit must be non-negative'),
  body('minWithdrawal').optional().isFloat({ min: 0 }).withMessage('Minimum withdrawal amount must be non-negative'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
  handleValidationErrors,
  walletController.updateWalletLimits
);

router.get("/:id/limits", 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid wallet ID format'),
  handleValidationErrors,
  walletController.getWalletLimits
);

router.post("/:id/reset-limits", 
  generalRateLimit,
  param('id').isMongoId().withMessage('Invalid wallet ID format'),
  body('reason').notEmpty().withMessage('Reset reason is required'),
  handleValidationErrors,
  walletController.resetWalletLimits
);

// Bulk operations
router.post("/bulk-actions", 
  strictRateLimit,
  validateBulkOperation,
  handleValidationErrors,
  walletController.bulkActions
);

router.post("/bulk-export", 
  strictRateLimit,
  body('walletIds').optional().isArray().withMessage('Wallet IDs must be an array'),
  body('filters').optional().isObject().withMessage('Filters must be an object'),
  body('format').optional().isIn(['csv', 'xlsx', 'pdf']).withMessage('Invalid export format'),
  body('fields').optional().isArray().withMessage('Fields must be an array'),
  body('includeTransactions').optional().isBoolean().withMessage('Include transactions must be boolean'),
  handleValidationErrors,
  walletController.bulkExportWallets
);

router.post("/bulk-import", 
  strictRateLimit,
  walletController.bulkImportWallets
);

// Analytics and reporting
router.get("/analytics", 
  generalRateLimit,
  query('period').optional().isIn(['7d', '30d', '90d', '1y', 'all']).withMessage('Invalid period'),
  query('groupBy').optional().isIn(['day', 'week', 'month']).withMessage('Invalid groupBy'),
  query('currency').optional().isIn(['INR', 'USD', 'EUR', 'GBP', 'all']).withMessage('Invalid currency'),
  handleValidationErrors,
  walletController.getWalletAnalytics
);

router.get("/statistics", 
  generalRateLimit,
  query('includeHistorical').optional().isBoolean().withMessage('Include historical must be boolean'),
  handleValidationErrors,
  walletController.getWalletStatistics
);

router.get("/balance-distribution", 
  generalRateLimit,
  query('currency').optional().isIn(['INR', 'USD', 'EUR', 'GBP', 'all']).withMessage('Invalid currency'),
  query('buckets').optional().isInt({ min: 5, max: 20 }).withMessage('Buckets must be between 5 and 20'),
  handleValidationErrors,
  walletController.getBalanceDistribution
);

router.get("/transaction-volume", 
  generalRateLimit,
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  query('type').optional().isIn(['credit', 'debit', 'all']).withMessage('Invalid transaction type'),
  handleValidationErrors,
  walletController.getTransactionVolume
);

router.get("/growth-metrics", 
  generalRateLimit,
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  query('metric').optional().isIn(['wallets', 'balance', 'transactions']).withMessage('Invalid metric'),
  handleValidationErrors,
  walletController.getWalletGrowthMetrics
);

// Compliance and monitoring
router.get("/flagged", 
  generalRateLimit,
  query('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity'),
  query('category').optional().isIn(['fraud', 'suspicious', 'compliance', 'technical']).withMessage('Invalid category'),
  validateWalletQuery,
  handleValidationErrors,
  walletController.getFlaggedWallets
);

router.get("/suspicious-activity", 
  generalRateLimit,
  query('timeframe').optional().isIn(['1h', '24h', '7d', '30d']).withMessage('Invalid timeframe'),
  query('threshold').optional().isFloat({ min: 0 }).withMessage('Threshold must be non-negative'),
  handleValidationErrors,
  walletController.getSuspiciousActivity
);

router.get("/large-transactions", 
  generalRateLimit,
  query('threshold').optional().isFloat({ min: 0 }).withMessage('Threshold must be non-negative'),
  query('period').optional().isIn(['1h', '24h', '7d', '30d']).withMessage('Invalid period'),
  query('type').optional().isIn(['credit', 'debit', 'all']).withMessage('Invalid transaction type'),
  handleValidationErrors,
  walletController.getLargeTransactions
);

router.get("/compliance-report", 
  generalRateLimit,
  query('startDate').isISO8601().withMessage('Start date is required and must be valid'),
  query('endDate').isISO8601().withMessage('End date is required and must be valid'),
  query('reportType').optional().isIn(['aml', 'kyc', 'transaction', 'full']).withMessage('Invalid report type'),
  handleValidationErrors,
  walletController.getComplianceReport
);

// System operations and maintenance
router.get("/health-check", 
  generalRateLimit,
  walletController.performWalletHealthCheck
);

router.post("/system-reconciliation", 
  strictRateLimit,
  body('scope').optional().isIn(['all', 'flagged', 'recent']).withMessage('Invalid reconciliation scope'),
  body('dryRun').optional().isBoolean().withMessage('Dry run must be boolean'),
  body('batchSize').optional().isInt({ min: 1, max: 1000 }).withMessage('Batch size must be between 1 and 1000'),
  handleValidationErrors,
  walletController.performSystemReconciliation
);

router.post("/maintenance-mode", 
  strictRateLimit,
  body('enable').isBoolean().withMessage('Enable must be boolean'),
  body('reason').notEmpty().withMessage('Maintenance reason is required'),
  body('duration').optional().isInt({ min: 1, max: 1440 }).withMessage('Duration must be between 1 and 1440 minutes'),
  body('affectedOperations').optional().isArray().withMessage('Affected operations must be an array'),
  handleValidationErrors,
  walletController.setMaintenanceMode
);

// Configuration and settings
router.get("/settings", 
  generalRateLimit,
  walletController.getWalletSystemSettings
);

router.put("/settings", 
  generalRateLimit,
  body('defaultCurrency').optional().isIn(['INR', 'USD', 'EUR', 'GBP']).withMessage('Invalid default currency'),
  body('minWalletBalance').optional().isFloat({ min: 0 }).withMessage('Minimum wallet balance must be non-negative'),
  body('maxWalletBalance').optional().isFloat({ min: 0 }).withMessage('Maximum wallet balance must be non-negative'),
  body('defaultDailyLimit').optional().isFloat({ min: 0 }).withMessage('Default daily limit must be non-negative'),
  body('defaultMonthlyLimit').optional().isFloat({ min: 0 }).withMessage('Default monthly limit must be non-negative'),
  body('autoReconcileEnabled').optional().isBoolean().withMessage('Auto reconcile enabled must be boolean'),
  body('autoReconcileInterval').optional().isInt({ min: 1, max: 1440 }).withMessage('Auto reconcile interval must be between 1 and 1440 minutes'),
  body('fraudDetectionEnabled').optional().isBoolean().withMessage('Fraud detection enabled must be boolean'),
  body('suspiciousTransactionThreshold').optional().isFloat({ min: 0 }).withMessage('Suspicious transaction threshold must be non-negative'),
  handleValidationErrors,
  walletController.updateWalletSystemSettings
);

// User-specific wallet operations
router.get("/user/:userId", 
  generalRateLimit,
  param('userId').isMongoId().withMessage('Invalid user ID format'),
  handleValidationErrors,
  walletController.getUserWallet
);

router.post("/user/:userId/create", 
  financialRateLimit,
  param('userId').isMongoId().withMessage('Invalid user ID format'),
  body('currency').optional().isIn(['INR', 'USD', 'EUR', 'GBP']).withMessage('Invalid currency'),
  body('initialBalance').optional().isFloat({ min: 0 }).withMessage('Initial balance must be non-negative'),
  body('autoVerify').optional().isBoolean().withMessage('Auto verify must be boolean'),
  handleValidationErrors,
  walletController.createUserWallet
);

router.get("/user/:userId/history", 
  generalRateLimit,
  param('userId').isMongoId().withMessage('Invalid user ID format'),
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  query('type').optional().isIn(['credit', 'debit', 'all']).withMessage('Invalid transaction type'),
  validateWalletQuery,
  handleValidationErrors,
  walletController.getUserWalletHistory
);

router.get("/user/:userId/summary", 
  generalRateLimit,
  param('userId').isMongoId().withMessage('Invalid user ID format'),
  query('includeProjections').optional().isBoolean().withMessage('Include projections must be boolean'),
  handleValidationErrors,
  walletController.getUserWalletSummary
);

// Emergency operations
router.post("/emergency/:id/freeze", 
  strictRateLimit,
  param('id').isMongoId().withMessage('Invalid wallet ID format'),
  body('emergencyReason').notEmpty().withMessage('Emergency reason is required'),
  body('severity').isIn(['medium', 'high', 'critical']).withMessage('Severity must be medium, high, or critical'),
  body('notifyUser').optional().isBoolean().withMessage('Notify user must be boolean'),
  handleValidationErrors,
  walletController.emergencyFreezeWallet
);

router.post("/emergency/bulk-freeze", 
  strictRateLimit,
  body('walletIds').isArray({ min: 1, max: 50 }).withMessage('Wallet IDs must be an array with 1-50 items'),
  body('emergencyReason').notEmpty().withMessage('Emergency reason is required'),
  body('severity').isIn(['high', 'critical']).withMessage('Severity must be high or critical'),
  handleValidationErrors,
  walletController.emergencyBulkFreeze
);

// Audit and logging
router.get("/audit-log", 
  generalRateLimit,
  query('walletId').optional().isMongoId().withMessage('Invalid wallet ID format'),
  query('adminId').optional().isMongoId().withMessage('Invalid admin ID format'),
  query('action').optional().isString().withMessage('Action must be a string'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity'),
  validateWalletQuery,
  handleValidationErrors,
  walletController.getWalletAuditLog
);

router.get("/activity-log", 
  generalRateLimit,
  query('timeframe').optional().isIn(['1h', '24h', '7d', '30d']).withMessage('Invalid timeframe'),
  query('activityType').optional().isIn(['creation', 'modification', 'transaction', 'security']).withMessage('Invalid activity type'),
  validateWalletQuery,
  handleValidationErrors,
  walletController.getWalletActivityLog
);

// Health check
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: 'Wallet management service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

