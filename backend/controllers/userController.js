// backend/controllers/userController.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const UserApp = require('../models/userApp');
const UserAd = require('../models/userAd');
// const logger = require('../config/logger'); // Uncomment if you have a logger

// --- Utility: not implemented stub ---
const notImplemented = (name = '') => (...args) =>
  args[1].status(501).json({ success: false, error: `Not implemented${name ? ': ' + name : ''}` });

// --- Utility: clean user object ---
const sanitizeUser = (user) => {
  if (!user) return user;
  if (typeof user.toObject === 'function') user = user.toObject();
  delete user.passwordHash;
  delete user.__v;
  return user;
};

// --- CORE USER MANAGEMENT ---

exports.listUsers = async (req, res) => {
  try {
    const {
      page = 1, limit = 20, search, role, status, sortBy = 'createdAt', sortOrder = 'desc', startDate, endDate
    } = req.query;
    // Input validation
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    if (isNaN(pageNum) || isNaN(limitNum) || limitNum > 100)
      return res.status(400).json({ success: false, error: 'Invalid pagination' });
    // Build query
    const query = {};
    if (role) {
      if (!['user', 'admin'].includes(role))
        return res.status(400).json({ success: false, error: 'Invalid role' });
      query.role = role;
    }
    if (status) {
      if (!['active', 'suspended', 'deleted'].includes(status))
        return res.status(400).json({ success: false, error: 'Invalid status' });
      query.status = status;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime()))
          return res.status(400).json({ success: false, error: 'Invalid startDate' });
        query.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime()))
          return res.status(400).json({ success: false, error: 'Invalid endDate' });
        query.createdAt.$lte = end;
      }
    }
    if (search) {
      const rx = new RegExp(search.trim(), 'i');
      query.$or = [{ name: rx }, { email: rx }];
    }
    // Sorting
    const validSort = ['createdAt', 'name', 'email', 'total_points', 'status'];
    const sortField = validSort.includes(sortBy) ? sortBy : 'createdAt';
    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const skip = (pageNum - 1) * limitNum;
    // Query and stats
    const [users, totalCount] = await Promise.all([
      User.find(query).select('-passwordHash')
        .sort({ [sortField]: sortDir }).skip(skip).limit(limitNum).lean(),
      User.countDocuments(query)
    ]);
    const stats = await User.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          suspended: { $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] } },
          deleted: { $sum: { $cond: [{ $eq: ['$status', 'deleted'] }, 1, 0] } },
          admins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
          totalPoints: { $sum: '$total_points' },
          avgPoints: { $avg: '$total_points' }
        }
      }
    ]);
    res.json({
      success: true,
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      users: users.map(sanitizeUser),
      stats: stats[0] || {
        total: 0, active: 0, suspended: 0, deleted: 0, admins: 0, totalPoints: 0, avgPoints: 0
      }
    });
  } catch (err) {
    console.error('listUsers:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching users' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    // Access: users can only view themselves
    if (req.user.role !== 'admin' && id !== req.user._id.toString())
      return res.status(403).json({ success: false, error: 'Access denied' });
    const user = await User.findById(id).select('-passwordHash').lean();
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    // Stats for admin
    if (req.user.role === 'admin') {
      const [apps, ads] = await Promise.all([
        UserApp.countDocuments({ user_id: id }),
        UserAd.countDocuments({ user_id: id })
      ]);
      user.statistics = { totalApps: apps, totalAds: ads };
    }
    res.json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    console.error('getUserById:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching user' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role = 'user', status = 'active' } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, error: 'Name, email, and password required' });
    if (!/^\S+@\S+\.\S+$/.test(email))
      return res.status(400).json({ success: false, error: 'Invalid email' });
    if (password.length < 6)
      return res.status(400).json({ success: false, error: 'Password too short' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, error: 'Email already used' });
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const user = new User({
      name, email, passwordHash, role, status, total_points: 0
    });
    await user.save();
    res.status(201).json({
      success: true,
      message: 'User created',
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error('createUser:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error creating user' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status, total_points } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    // Access: users can only update themselves (basic fields)
    if (req.user.role !== 'admin' && id !== req.user._id.toString())
      return res.status(403).json({ success: false, error: 'Access denied' });
    // Validate email if changing
    if (email && email !== user.email) {
      if (!/^\S+@\S+\.\S+$/.test(email))
        return res.status(400).json({ success: false, error: 'Invalid email' });
      const exists = await User.findOne({ email, _id: { $ne: id } });
      if (exists) return res.status(400).json({ success: false, error: 'Email in use' });
    }
    // Only admin can update these
    if (req.user.role === 'admin') {
      if (role && !['user', 'admin'].includes(role))
        return res.status(400).json({ success: false, error: 'Invalid role' });
      if (status && !['active', 'suspended', 'deleted'].includes(status))
        return res.status(400).json({ success: false, error: 'Invalid status' });
      if (total_points !== undefined && (typeof total_points !== 'number' || total_points < 0))
        return res.status(400).json({ success: false, error: 'Invalid total_points' });
    }
    // Apply updates
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (req.user.role === 'admin') {
      if (role !== undefined) user.role = role;
      if (status !== undefined) user.status = status;
      if (total_points !== undefined) user.total_points = total_points;
    }
    await user.save();
    res.json({
      success: true,
      message: 'User updated',
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error('updateUser:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error updating user' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    if (id === req.user._id.toString())
      return res.status(400).json({ success: false, error: 'Cannot delete self' });
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    // Clean up
    await Promise.all([
      UserApp.deleteMany({ user_id: id }),
      UserAd.deleteMany({ user_id: id })
    ]);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    console.error('deleteUser:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error deleting user' });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    if (!['active', 'suspended', 'deleted'].includes(status))
      return res.status(400).json({ success: false, error: 'Invalid status' });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    if (id === req.user._id.toString())
      return res.status(400).json({ success: false, error: 'Cannot modify your own status' });
    user.status = status;
    // Optional: log reason...
    await user.save();
    res.json({ success: true, message: 'Status updated', user: sanitizeUser(user) });
  } catch (err) {
    console.error('updateUserStatus:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error updating status' });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, reason } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    if (!['user', 'admin'].includes(role))
      return res.status(400).json({ success: false, error: 'Invalid role' });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    if (id === req.user._id.toString())
      return res.status(400).json({ success: false, error: 'Cannot modify your own role' });
    user.role = role;
    // Optional: log reason...
    await user.save();
    res.json({ success: true, message: 'Role updated', user: sanitizeUser(user) });
  } catch (err) {
    console.error('updateUserRole:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error updating role' });
  }
};

exports.updateUserPoints = async (req, res) => {
  try {
    const { id } = req.params;
    const { points, operation, reason } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    if (typeof points !== 'number' || points < 0)
      return res.status(400).json({ success: false, error: 'Points must be non-negative' });
    if (!['add', 'subtract', 'set'].includes(operation))
      return res.status(400).json({ success: false, error: 'Invalid operation' });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    let newPoints;
    if (operation === 'add') newPoints = user.total_points + points;
    else if (operation === 'subtract') newPoints = Math.max(0, user.total_points - points);
    else newPoints = points;
    user.total_points = newPoints;
    // Optional: log reason...
    await user.save();
    res.json({ success: true, message: 'Points updated', user: sanitizeUser(user) });
  } catch (err) {
    console.error('updateUserPoints:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error updating points' });
  }
};

exports.bulkActions = async (req, res) => {
  try {
    const { action, ids, newStatus, newRole } = req.body;
    if (!action || !Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ success: false, error: 'Action and IDs required' });
    if (ids.some(id => !mongoose.Types.ObjectId.isValid(id)))
      return res.status(400).json({ success: false, error: 'Invalid ID(s)' });
    if (ids.includes(req.user._id.toString()))
      return res.status(400).json({ success: false, error: 'Cannot modify self' });
    let result;
    switch (action) {
      case 'delete':
        result = await User.deleteMany({ _id: { $in: ids } });
        await Promise.all([
          UserApp.deleteMany({ user_id: { $in: ids } }),
          UserAd.deleteMany({ user_id: { $in: ids } })
        ]);
        break;
      case 'updateStatus':
        if (!newStatus || !['active', 'suspended', 'deleted'].includes(newStatus))
          return res.status(400).json({ success: false, error: 'Invalid newStatus' });
        result = await User.updateMany({ _id: { $in: ids } }, { status: newStatus });
        break;
      case 'updateRole':
        if (!newRole || !['user', 'admin'].includes(newRole))
          return res.status(400).json({ success: false, error: 'Invalid newRole' });
        result = await User.updateMany({ _id: { $in: ids } }, { role: newRole });
        break;
      default:
        return res.status(400).json({ success: false, error: 'Invalid action' });
    }
    res.json({
      success: true,
      message: 'Bulk action complete',
      affectedCount: result.modifiedCount || result.deletedCount
    });
  } catch (err) {
    console.error('bulkActions:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error performing bulk action' });
  }
};

// --- USER SELF-SERVICE ---

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash').lean();
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    // Stats
    const [apps, ads] = await Promise.all([
      UserApp.countDocuments({ user_id: req.user._id }),
      UserAd.countDocuments({ user_id: req.user._id })
    ]);
    user.statistics = { totalApps: apps, totalAds: ads };
    res.json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    console.error('getProfile:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    // Validate email if changing
    if (email && email !== user.email) {
      if (!/^\S+@\S+\.\S+$/.test(email))
        return res.status(400).json({ success: false, error: 'Invalid email' });
      const exists = await User.findOne({ email, _id: { $ne: user._id } });
      if (exists) return res.status(400).json({ success: false, error: 'Email in use' });
    }
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    await user.save();
    res.json({ success: true, message: 'Profile updated', user: sanitizeUser(user) });
  } catch (err) {
    console.error('updateProfile:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error updating profile' });
  }
};

exports.recentActivity = async (req, res) => {
  try {
    const [apps, ads] = await Promise.all([
      UserApp.find({ user_id: req.user._id }).sort({ createdAt: -1 }).limit(5).lean(),
      UserAd.find({ user_id: req.user._id }).sort({ createdAt: -1 }).limit(5).lean()
    ]);
    const combined = [...apps, ...ads].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);
    res.json({ success: true, activities: combined });
  } catch (err) {
    console.error('recentActivity:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching activity' });
  }
};

// --- STUB ALL OTHER ROUTES REFERENCED IN YOUR ROUTES FILE ---
// (To prevent "callback undefined" errors, safe for any backend/frontend)
[
  'getMyStatistics', 'getMyAnalytics', 'getMyTransactions', 'getMyEarnings', 'getMyAchievements',
  'changePassword', 'deactivateAccount', 'exportMyData', 'getPublicLeaderboard', 'getPublicProfile',
  'getUserActivity', 'getUserStatistics', 'getUserAnalytics', 'getUserTransactions', 'getUserEarnings',
  'bulkExportUsers', 'bulkImportUsers', 'getAdminUserAnalytics', 'getUserGrowthMetrics', 'getUserEngagementReport',
  'getUserRetentionReport', 'getTopUsers', 'getInactiveUsers', 'getNewUsers', 'getSuspendedUsers',
  'getUnverifiedUsers', 'sendUserNotification', 'sendBulkNotification', 'getUserAuditTrail', 'getUserLoginHistory',
  'flagUser', 'unflagUser', 'getFlaggedUsers', 'getUserSettings', 'updateUserSettings', 'impersonateUser',
  'stopImpersonation', 'updateUserVerification'
].forEach(fn => {
  if (!exports[fn]) exports[fn] = notImplemented(fn);
});
