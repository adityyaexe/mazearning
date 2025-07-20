// backend/routes/profile.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

// Controllers
const profileController = require('../controllers/profileController');
const userController = require('../controllers/userController');

// Middleware
const { authenticateToken, adminOnly, requireOwnershipOrAdmin } = require('../middleware/auth');

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

const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 upload requests per windowMs
  message: {
    success: false,
    error: 'Too many upload attempts from this IP, please try again later.'
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

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/avatars/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + req.user._id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: fileFilter
});

// Validation middleware
const validateProfileUpdate = [
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
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  
  body('website')
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      const age = now.getFullYear() - date.getFullYear();
      if (age < 13 || age > 120) {
        throw new Error('Age must be between 13 and 120 years');
      }
      return true;
    }),
];

const validatePrivacySettings = [
  body('profileVisibility')
    .optional()
    .isIn(['public', 'private', 'friends'])
    .withMessage('Profile visibility must be public, private, or friends'),
  
  body('showEmail')
    .optional()
    .isBoolean()
    .withMessage('Show email must be a boolean'),
  
  body('showPhone')
    .optional()
    .isBoolean()
    .withMessage('Show phone must be a boolean'),
  
  body('showLocation')
    .optional()
    .isBoolean()
    .withMessage('Show location must be a boolean'),
  
  body('allowMessages')
    .optional()
    .isBoolean()
    .withMessage('Allow messages must be a boolean'),
];

const validateNotificationSettings = [
  body('emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean'),
  
  body('smsNotifications')
    .optional()
    .isBoolean()
    .withMessage('SMS notifications must be a boolean'),
  
  body('pushNotifications')
    .optional()
    .isBoolean()
    .withMessage('Push notifications must be a boolean'),
  
  body('marketingEmails')
    .optional()
    .isBoolean()
    .withMessage('Marketing emails must be a boolean'),
  
  body('transactionAlerts')
    .optional()
    .isBoolean()
    .withMessage('Transaction alerts must be a boolean'),
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

// Basic profile routes
router.get('/', 
  generalRateLimit,
  profileController.getProfile
);

router.put('/', 
  generalRateLimit,
  validateProfileUpdate,
  handleValidationErrors,
  profileController.updateProfile
);

// Extended profile information
router.get('/extended', 
  generalRateLimit,
  profileController.getExtendedProfile
);

router.put('/extended', 
  generalRateLimit,
  body('bio').optional().trim().isLength({ max: 1000 }).withMessage('Bio cannot exceed 1000 characters'),
  body('interests').optional().isArray().withMessage('Interests must be an array'),
  body('skills').optional().isArray().withMessage('Skills must be an array'),
  body('experience').optional().trim().isLength({ max: 2000 }).withMessage('Experience cannot exceed 2000 characters'),
  body('education').optional().trim().isLength({ max: 1000 }).withMessage('Education cannot exceed 1000 characters'),
  handleValidationErrors,
  profileController.updateExtendedProfile
);

// Avatar/Profile picture management
router.post('/avatar', 
  uploadRateLimit,
  upload.single('avatar'),
  profileController.uploadAvatar
);

router.delete('/avatar', 
  generalRateLimit,
  profileController.deleteAvatar
);

router.get('/avatar/:userId', 
  generalRateLimit,
  profileController.getAvatar
);

// Privacy settings
router.get('/privacy', 
  generalRateLimit,
  profileController.getPrivacySettings
);

router.put('/privacy', 
  generalRateLimit,
  validatePrivacySettings,
  handleValidationErrors,
  profileController.updatePrivacySettings
);

// Notification settings
router.get('/notifications', 
  generalRateLimit,
  profileController.getNotificationSettings
);

router.put('/notifications', 
  generalRateLimit,
  validateNotificationSettings,
  handleValidationErrors,
  profileController.updateNotificationSettings
);

// Security settings
router.get('/security', 
  generalRateLimit,
  profileController.getSecuritySettings
);

router.put('/security', 
  generalRateLimit,
  body('twoFactorEnabled').optional().isBoolean().withMessage('Two factor enabled must be a boolean'),
  body('loginAlerts').optional().isBoolean().withMessage('Login alerts must be a boolean'),
  body('sessionTimeout').optional().isInt({ min: 5, max: 1440 }).withMessage('Session timeout must be between 5 and 1440 minutes'),
  handleValidationErrors,
  profileController.updateSecuritySettings
);

// Activity and analytics
router.get('/activity', 
  generalRateLimit,
  profileController.getActivityHistory
);

router.get('/analytics', 
  generalRateLimit,
  profileController.getProfileAnalytics
);

router.get('/recent-activity', 
  generalRateLimit,
  userController.recentActivity
);

// Social connections
router.get('/connections', 
  generalRateLimit,
  profileController.getConnections
);

router.post('/connections/:userId', 
  generalRateLimit,
  profileController.sendConnectionRequest
);

router.put('/connections/:userId', 
  generalRateLimit,
  body('action').isIn(['accept', 'reject']).withMessage('Action must be accept or reject'),
  handleValidationErrors,
  profileController.handleConnectionRequest
);

router.delete('/connections/:userId', 
  generalRateLimit,
  profileController.removeConnection
);

// Preferences
router.get('/preferences', 
  generalRateLimit,
  profileController.getPreferences
);

router.put('/preferences', 
  generalRateLimit,
  body('language').optional().isIn(['en', 'es', 'fr', 'de', 'hi']).withMessage('Invalid language'),
  body('timezone').optional().isString().withMessage('Timezone must be a string'),
  body('currency').optional().isIn(['USD', 'EUR', 'GBP', 'INR']).withMessage('Invalid currency'),
  body('theme').optional().isIn(['light', 'dark', 'auto']).withMessage('Theme must be light, dark, or auto'),
  handleValidationErrors,
  profileController.updatePreferences
);

// Data management
router.get('/export', 
  strictRateLimit,
  profileController.exportProfileData
);

router.post('/import', 
  strictRateLimit,
  upload.single('dataFile'),
  profileController.importProfileData
);

// Profile verification
router.post('/verify', 
  strictRateLimit,
  upload.fields([
    { name: 'idDocument', maxCount: 1 },
    { name: 'proofOfAddress', maxCount: 1 }
  ]),
  profileController.submitVerification
);

router.get('/verification-status', 
  generalRateLimit,
  profileController.getVerificationStatus
);

// Profile statistics
router.get('/stats', 
  generalRateLimit,
  profileController.getProfileStats
);

// Delete profile data
router.delete('/data', 
  strictRateLimit,
  body('password').notEmpty().withMessage('Password is required'),
  body('confirmDelete').equals('DELETE').withMessage('Please type DELETE to confirm'),
  handleValidationErrors,
  profileController.deleteProfileData
);

// Admin routes
router.use(adminOnly);

// Admin profile management
router.get('/admin/users', 
  generalRateLimit,
  profileController.getAllProfiles
);

router.get('/admin/users/:userId', 
  generalRateLimit,
  profileController.getAdminProfile
);

router.put('/admin/users/:userId', 
  generalRateLimit,
  validateProfileUpdate,
  handleValidationErrors,
  profileController.updateAdminProfile
);

router.put('/admin/users/:userId/status', 
  generalRateLimit,
  body('status').isIn(['active', 'suspended', 'deleted']).withMessage('Invalid status'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
  handleValidationErrors,
  profileController.updateProfileStatus
);

router.put('/admin/users/:userId/verification', 
  generalRateLimit,
  body('verified').isBoolean().withMessage('Verified must be a boolean'),
  body('verificationNotes').optional().trim().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
  handleValidationErrors,
  profileController.updateVerificationStatus
);

router.get('/admin/verification-queue', 
  generalRateLimit,
  profileController.getVerificationQueue
);

router.get('/admin/stats', 
  generalRateLimit,
  profileController.getAdminStats
);

router.post('/admin/users/:userId/flag', 
  generalRateLimit,
  body('reason').notEmpty().withMessage('Reason is required'),
  handleValidationErrors,
  profileController.flagProfile
);

router.delete('/admin/users/:userId/flag', 
  generalRateLimit,
  profileController.unflagProfile
);

// Bulk operations
router.post('/admin/bulk-update', 
  strictRateLimit,
  body('userIds').isArray().withMessage('User IDs must be an array'),
  body('action').isIn(['verify', 'suspend', 'activate', 'delete']).withMessage('Invalid action'),
  handleValidationErrors,
  profileController.bulkUpdateProfiles
);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Profile service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
