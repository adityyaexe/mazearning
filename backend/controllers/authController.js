// backend/controller/authController.js
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// JWT token generator
const generateToken = (user) => jwt.sign(
  { id: user._id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

// Registration: never allow incomplete or invalid data
exports.register = async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
  }

  try {
    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const newUser = new User({
      name,
      email,
      passwordHash,
      phone,
      role: role || 'user',
      status: 'active',
      kyc_verified: false
    });
    await newUser.save();

    const token = generateToken(newUser);
    return res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        total_points: newUser.total_points,
        status: newUser.status
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, error: 'Server error during registration' });
  }
};

// Login: robust validation, clear error messages
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      return res.status(400).json({ success: false, error: 'User not found' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ success: false, error: 'Account not properly set up' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Invalid password' });
    }

    const token = generateToken(user);
    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        total_points: user.total_points,
        status: user.status
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: 'Server error during login' });
  }
};

// ────────────────────────────────────────────────────────────────
// Placeholder for not implemented methods
// ────────────────────────────────────────────────────────────────

const notImplemented = (req, res) => res.status(501).json({
  success: false,
  error: 'Not implemented yet'
});

// Session management
exports.logout = notImplemented;
exports.refreshToken = notImplemented;

// Password reset
exports.forgotPassword = notImplemented;
exports.resetPassword = notImplemented;

// Email verification
exports.sendVerificationEmail = notImplemented;
exports.verifyEmail = notImplemented;

// Account management
exports.changePassword = notImplemented;
exports.deleteAccount = notImplemented;
exports.deactivateAccount = notImplemented;
exports.reactivateAccount = notImplemented;

// Two-factor authentication
exports.enableTwoFactorAuth = notImplemented;
exports.disableTwoFactorAuth = notImplemented;
exports.verifyTwoFactorAuth = notImplemented;

// Session management
exports.getUserSessions = notImplemented;
exports.revokeSession = notImplemented;
exports.revokeAllSessions = notImplemented;

// Admin routes
exports.adminCreateUser = notImplemented;
exports.adminUpdateUserRole = notImplemented;
exports.adminUpdateUserStatus = notImplemented;
exports.adminResetUserPassword = notImplemented;
exports.adminUnlockUser = notImplemented;
exports.adminGetUserSessions = notImplemented;
exports.adminRevokeUserSessions = notImplemented;

// Analytics
exports.getAuthStats = notImplemented;
exports.getFailedAttempts = notImplemented;
exports.getActiveSessions = notImplemented;
