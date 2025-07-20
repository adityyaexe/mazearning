// backend/routes/auth.js

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

// Controllers
const authController = require('../controllers/authController');
const profileController = require('../controllers/profileController');

// Middleware
const { authenticateToken, adminOnly, optionalAuth } = require('../middleware/auth');

// ─── Rate Limiters ───────────────────────────────────────────

const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  }
});

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Too many authentication attempts from this IP, please try again later.'
  }
});

const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  }
});

// ─── Validation Middleware ──────────────────────────────────

const validateRegistration = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces'),
  body('email').isEmail().withMessage('Provide a valid email').normalizeEmail().isLength({ max: 100 }),
  body('password').isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8–128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must include uppercase, lowercase, number, and symbol'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin')
];

const validateLogin = [
  body('email').isEmail().withMessage('Provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

const validatePasswordReset = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail()
];

const validatePasswordChange = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8–128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('New password must include uppercase, lowercase, number, and symbol'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) throw new Error('Passwords do not match');
    return true;
  })
];

const validateEmailVerification = [
  body('token')
    .notEmpty().withMessage('Token is required')
    .isLength({ min: 32, max: 128 }).withMessage('Invalid token length')
];

const validateRefreshToken = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
];

// Retry-helper
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

// ─── Public Auth Routes ──────────────────────────────────────

router.post('/register', authRateLimit, validateRegistration, handleValidationErrors, authController.register);
router.post('/login', authRateLimit, validateLogin, handleValidationErrors, authController.login);
router.post('/logout', generalRateLimit, optionalAuth, authController.logout);
router.post('/refresh-token', authRateLimit, validateRefreshToken, handleValidationErrors, authController.refreshToken);

// ─── Password Reset ──────────────────────────────────────────
router.post('/forgot-password', strictRateLimit, validatePasswordReset, handleValidationErrors, authController.forgotPassword);

router.post('/reset-password/:token',
  strictRateLimit,
  body('password')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be between 8–128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must be strong'),
  handleValidationErrors,
  authController.resetPassword
);

// ─── Email Verification ──────────────────────────────────────
router.post('/send-verification', strictRateLimit, authenticateToken, authController.sendVerificationEmail);
router.post('/verify-email', generalRateLimit, validateEmailVerification, handleValidationErrors, authController.verifyEmail);

// ─── Protected Authenticated User Routes ─────────────────────
router.use(authenticateToken);

// Profile management
router.get('/profile', generalRateLimit, profileController.getProfile);
router.put('/profile',
  generalRateLimit,
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
  body('email').optional().isEmail().withMessage('Email must be valid'),
  handleValidationErrors,
  profileController.updateProfile
);

// Change password
router.put('/change-password', authRateLimit, validatePasswordChange, handleValidationErrors, authController.changePassword);

// Delete or deactivate account
router.delete('/account',
  strictRateLimit,
  body('password').notEmpty().withMessage('Password required to delete account'),
  handleValidationErrors,
  authController.deleteAccount
);

router.post('/deactivate', strictRateLimit, authController.deactivateAccount);
router.post('/reactivate', strictRateLimit, authController.reactivateAccount);

// ─── Two-Factor Authentication ───────────────────────────────
router.post('/2fa/enable', authRateLimit, authController.enableTwoFactorAuth);
router.post('/2fa/disable',
  authRateLimit,
  body('password').notEmpty().withMessage('Password required to disable 2FA'),
  handleValidationErrors,
  authController.disableTwoFactorAuth
);
router.post('/2fa/verify',
  authRateLimit,
  body('token')
    .isLength({ min: 6, max: 6 }).withMessage('2FA token must be 6 digits')
    .isNumeric().withMessage('2FA token must be numeric'),
  handleValidationErrors,
  authController.verifyTwoFactorAuth
);

// ─── Session Management ──────────────────────────────────────
router.get('/sessions', generalRateLimit, authController.getUserSessions);
router.delete('/sessions/:sessionId', generalRateLimit, authController.revokeSession);
router.delete('/sessions', generalRateLimit, authController.revokeAllSessions);

// ─── Admin-Only Routes ───────────────────────────────────────
router.use(adminOnly);

// Admin: Create/Add User
router.post('/admin/create-user', authRateLimit, validateRegistration, handleValidationErrors, authController.adminCreateUser);

// Admin: Role & Status Management
router.put('/admin/users/:userId/role',
  authRateLimit,
  body('role').isIn(['user', 'admin']),
  handleValidationErrors,
  authController.adminUpdateUserRole
);

router.put('/admin/users/:userId/status',
  authRateLimit,
  body('status').isIn(['active', 'suspended', 'deleted']),
  body('reason').optional().isLength({ max: 500 }),
  handleValidationErrors,
  authController.adminUpdateUserStatus
);

router.post('/admin/users/:userId/reset-password', strictRateLimit, authController.adminResetUserPassword);
router.post('/admin/users/:userId/unlock', generalRateLimit, authController.adminUnlockUser);

// Admin: Sessions
router.get('/admin/users/:userId/sessions', generalRateLimit, authController.adminGetUserSessions);
router.delete('/admin/users/:userId/sessions', generalRateLimit, authController.adminRevokeUserSessions);

// Admin Analytics
router.get('/admin/stats', generalRateLimit, authController.getAuthStats);
router.get('/admin/failed-attempts', generalRateLimit, authController.getFailedAttempts);
router.get('/admin/active-sessions', generalRateLimit, authController.getActiveSessions);

// ─── Health Check ─────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
