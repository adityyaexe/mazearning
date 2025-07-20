// backend/controllers/profileController.js
const User = require('../models/user');
const fs = require('fs').promises;
const path = require('path');
const uuid = require('uuid').v4;
// const logger = require('../config/logger'); // Uncomment if you have a global logger

// --- Helper: Get full user object without sensitive fields ---
const sanitizeUser = (user) => {
  if (!user) return null;
  const result = user.toObject ? user.toObject() : user;
  delete result.passwordHash;
  delete result.refreshTokens;
  delete result.__v;
  return result;
};

// --- Helper: Validate email format and uniqueness ---
const validateEmail = async (email, currentUserId) => {
  if (!email) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Please provide a valid email address');
  }
  const existing = await User.findOne({ email, _id: { $ne: currentUserId } });
  if (existing) {
    throw new Error('Email already in use');
  }
  return true;
};

// --- Helper: Validate phone format ---
const validatePhone = (phone) => {
  if (!phone) return null;
  if (!/^\+?[1-9]\d{1,14}$/.test(phone)) {
    throw new Error('Please provide a valid phone number');
  }
  return true;
};

// --- Helper: Update user fields if provided ---
const updateUserFields = (user, updates) => {
  const fields = ['name', 'email', 'phone', 'bio', 'location', 'website', 'dateOfBirth'];
  fields.forEach((field) => {
    if (updates[field] !== undefined) user[field] = updates[field];
  });
};

// --- Helper: Update nested profile fields if provided ---
const updateProfileFields = (user, updates) => {
  const profile = user.profile || {};
  const fields = ['interests', 'skills', 'experience', 'education'];
  fields.forEach((field) => {
    if (updates[field] !== undefined) profile[field] = updates[field];
  });
  user.profile = profile;
};

// --- Helper: Update privacy settings if provided ---
const updatePrivacySettings = (user, updates) => {
  const privacy = user.privacy || {};
  const fields = [
    'profileVisibility', 'showEmail', 'showPhone', 'showLocation',
    'allowMessages', 'emailNotifications', 'smsNotifications', 'pushNotifications',
    'marketingEmails', 'transactionAlerts', 'twoFactorEnabled', 'loginAlerts',
    'sessionTimeout', 'language', 'timezone', 'currency', 'theme'
  ];
  fields.forEach((field) => {
    if (updates[field] !== undefined) privacy[field] = updates[field];
  });
  user.privacy = privacy;
};

// --- Helper: Save avatar, delete old one ---
async function saveAvatar(user, avatarFile) {
  if (!avatarFile) return null;
  // If user already has an avatar, delete old one
  if (user.avatar) {
    try {
      await fs.unlink(path.join('uploads/avatars/', user.avatar));
    } catch (err) {
      // Ignore if file was already deleted
      if (err.code !== 'ENOENT') {
        console.error('Failed to delete old avatar:', err);
      }
    }
  }
  // Save new avatar filename
  user.avatar = avatarFile.filename;
  await user.save();
  return user.avatar;
}

// ------------------------------ Profile CRUD ------------------------------

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    console.error('profileController.getProfile error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    await validateEmail(req.body.email, req.user._id);
    if (req.body.phone) await validatePhone(req.body.phone);

    updateUserFields(user, req.body);
    await user.save();

    res.json({
      success: true,
      message: 'Profile updated',
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error('profileController.updateProfile error:', err);
    res.status(400).json({ success: false, error: err.message || 'Update failed' });
  }
};

exports.deleteProfile = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });

exports.getExtendedProfile = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });
exports.updateExtendedProfile = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });

// ------------------------------ Avatar Management ------------------------------

exports.uploadAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    const avatar = await saveAvatar(user, req.file);
    res.json({ success: true, avatar });
  } catch (err) {
    console.error('profileController.uploadAvatar error:', err);
    res.status(400).json({ success: false, error: err.message || 'Avatar upload failed' });
  }
};

exports.deleteAvatar = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });
exports.getAvatar = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });

// ------------------------------ Privacy & Settings ------------------------------

exports.getPrivacySettings = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });
exports.updatePrivacySettings = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });

exports.getNotificationSettings = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });
exports.updateNotificationSettings = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });

exports.getSecuritySettings = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });
exports.updateSecuritySettings = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });

// ------------------------------ Activity & Connections ------------------------------

exports.getActivityHistory = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });
exports.getProfileAnalytics = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });

exports.getConnections = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });
exports.sendConnectionRequest = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });
exports.handleConnectionRequest = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });
exports.removeConnection = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });

// ------------------------------ Preferences ------------------------------

exports.getPreferences = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });
exports.updatePreferences = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });

// ------------------------------ Data & Verification ------------------------------

exports.exportProfileData = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });
exports.importProfileData = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });
exports.submitVerification = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });
exports.getVerificationStatus = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });

// ------------------------------ Profile Stats ------------------------------

exports.getProfileStats = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });
exports.deleteProfileData = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });

// ------------------------------ Admin ------------------------------

exports.getAllProfiles = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });
exports.getAdminProfile = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });
exports.updateAdminProfile = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });
exports.updateProfileStatus = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });
exports.updateVerificationStatus = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });
exports.getVerificationQueue = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });
exports.getAdminStats = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });
exports.flagProfile = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });
exports.unflagProfile = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });
exports.bulkUpdateProfiles = async (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });
