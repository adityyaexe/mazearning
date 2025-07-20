// backend/controllers/userAppController.js
const mongoose = require('mongoose');
const UserApp = require('../models/userApp');
const User = require('../models/user');
// const logger = require('../config/logger'); // Uncomment if you use a logger

// --- Helper: sanitize user app object for responses ---
const sanitizeUserApp = (app) => {
  if (!app) return app;
  if (typeof app.toObject === 'function') app = app.toObject();
  delete app.__v;
  delete app.updatedAt;
  return app;
};

// --- Helper: not implemented handler ---
const notImplemented = (name = '') => (...args) =>
  args[1].status(501).json({ success: false, error: `Not implemented${name?`: ${name}`:''}` });

// ------------------------------ CORE USER APP CRUD ------------------------------

exports.listUserApps = async (req, res) => {
  try {
    const {
      user_id, status, page = 1, limit = 20, search,
      startDate, endDate, sortBy, sortOrder
    } = req.query;
    // Input validation
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const query = {};
    // Access: users only see theirs, admins see all (or filtered)
    if (req.user.role !== 'admin') {
      query.user_id = req.user._id;
    } else if (user_id) {
      if (!mongoose.Types.ObjectId.isValid(user_id))
        return res.status(400).json({ success: false, error: 'Invalid user_id' });
      query.user_id = user_id;
    }
    // Status
    if (status) {
      if (!['active', 'inactive', 'pending', 'deleted', 'suspended', 'completed'].includes(status))
        return res.status(400).json({ success: false, error: 'Invalid status' });
      query.status = status;
    }
    // Date range
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
    // Search
    if (search) {
      query.app_id = new RegExp(search.trim(), 'i');
    }
    // Sorting
    const validSort = ['createdAt', 'updatedAt', 'status', 'app_id', 'performanceScore'];
    const sortField = validSort.includes(sortBy) ? sortBy : 'createdAt';
    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const skip = (pageNum - 1) * limitNum;
    // Execute query
    const [userApps, totalCount] = await Promise.all([
      UserApp.find(query)
        .populate('user_id', 'name email role')
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      UserApp.countDocuments(query)
    ]);
    // Admin stats
    let stats = null;
    if (req.user.role === 'admin') {
      const result = await UserApp.aggregate([
        { $match: user_id ? { user_id: new mongoose.Types.ObjectId(user_id) } : {} },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            inactive: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            deleted: { $sum: { $cond: [{ $eq: ['$status', 'deleted'] }, 1, 0] } },
            suspended: { $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          }
        }
      ]);
      stats = result[0] || {
        total: 0, active: 0, inactive: 0, pending: 0, deleted: 0, suspended: 0, completed: 0
      };
    }
    res.json({
      success: true,
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      userApps: userApps.map(sanitizeUserApp),
      ...(stats && { stats })
    });
  } catch (err) {
    console.error('listUserApps:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error listing user apps' });
  }
};

exports.getUserAppById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, error: 'Invalid user app ID' });
    const userApp = await UserApp.findById(id)
      .populate('user_id', 'name email role')
      .lean();
    if (!userApp) return res.status(404).json({ success: false, error: 'User app not found' });
    // Access control
    if (req.user.role !== 'admin' && userApp.user_id._id.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, error: 'Access denied' });
    res.json({ success: true, userApp: sanitizeUserApp(userApp) });
  } catch (err) {
    console.error('getUserAppById:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching user app' });
  }
};

exports.createUserApp = async (req, res) => {
  try {
    const { user_id, app_id, status, appDetails, ...rest } = req.body;
    // Basic validation
    if (!user_id || !app_id)
      return res.status(400).json({ success: false, error: 'user_id and app_id are required' });
    if (!mongoose.Types.ObjectId.isValid(user_id))
      return res.status(400).json({ success: false, error: 'Invalid user_id' });
    if (typeof app_id !== 'string' || app_id.trim().length === 0)
      return res.status(400).json({ success: false, error: 'Invalid app_id' });
    if (status && !['active', 'inactive', 'pending', 'deleted', 'suspended', 'completed'].includes(status))
      return res.status(400).json({ success: false, error: 'Invalid status' });
    // Access: users can only create for themselves
    if (req.user.role !== 'admin' && user_id !== req.user._id.toString())
      return res.status(403).json({ success: false, error: 'Access denied' });
    // Prevent duplicates
    const exists = await UserApp.findOne({ user_id, app_id });
    if (exists) return res.status(400).json({ success: false, error: 'User app already exists' });
    // Create app
    const userApp = new UserApp({
      user_id,
      app_id: app_id.trim(),
      status: status || 'active',
      ...(appDetails ? { appDetails } : {}),
      ...rest
    });
    await userApp.save();
    await userApp.populate('user_id', 'name email role');
    res.status(201).json({
      success: true,
      message: 'User app created',
      userApp: sanitizeUserApp(userApp)
    });
  } catch (err) {
    console.error('createUserApp:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error creating user app' });
  }
};

exports.updateUserApp = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, error: 'Invalid user app ID' });
    // Remove non-updatable fields
    delete updates._id;
    delete updates.__v;
    delete updates.createdAt;
    // Status validation
    if (updates.status && !['active', 'inactive', 'pending', 'deleted', 'suspended', 'completed'].includes(updates.status))
      return res.status(400).json({ success: false, error: 'Invalid status' });
    // Access: users can only update their own
    const userApp = await UserApp.findById(id);
    if (!userApp) return res.status(404).json({ success: false, error: 'User app not found' });
    if (req.user.role !== 'admin' && userApp.user_id.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, error: 'Access denied' });
    // Apply updates
    const updated = await UserApp.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('user_id', 'name email role');
    res.json({
      success: true,
      message: 'User app updated',
      userApp: sanitizeUserApp(updated)
    });
  } catch (err) {
    console.error('updateUserApp:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error updating user app' });
  }
};

exports.deleteUserApp = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, error: 'Invalid user app ID' });
    const userApp = await UserApp.findById(id);
    if (!userApp) return res.status(404).json({ success: false, error: 'User app not found' });
    // Access: users can only delete their own
    if (req.user.role !== 'admin' && userApp.user_id.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, error: 'Access denied' });
    await UserApp.findByIdAndDelete(id);
    res.json({ success: true, message: 'User app deleted' });
  } catch (err) {
    console.error('deleteUserApp:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error deleting user app' });
  }
};

exports.updateUserAppStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, error: 'Invalid user app ID' });
    if (!['active', 'inactive', 'pending', 'deleted', 'suspended', 'completed'].includes(status))
      return res.status(400).json({ success: false, error: 'Invalid status' });
    const userApp = await UserApp.findById(id);
    if (!userApp) return res.status(404).json({ success: false, error: 'User app not found' });
    // Access: users can only update their own
    if (req.user.role !== 'admin' && userApp.user_id.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, error: 'Access denied' });
    userApp.status = status;
    if (reason) userApp.statusReason = reason;
    await userApp.save();
    res.json({
      success: true,
      message: 'Status updated',
      userApp: sanitizeUserApp(userApp)
    });
  } catch (err) {
    console.error('updateUserAppStatus:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error updating status' });
  }
};

exports.bulkActions = async (req, res) => {
  try {
    const { action, ids, newStatus, reason } = req.body;
    if (!action || !Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ success: false, error: 'Action and IDs required' });
    if (ids.some(id => !mongoose.Types.ObjectId.isValid(id)))
      return res.status(400).json({ success: false, error: 'Invalid ID(s)' });
    let result;
    if (action === 'delete') {
      result = await UserApp.deleteMany({ _id: { $in: ids } });
    } else if (action === 'updateStatus') {
      if (!newStatus || !['active', 'inactive', 'pending', 'deleted', 'suspended', 'completed'].includes(newStatus))
        return res.status(400).json({ success: false, error: 'Invalid newStatus' });
      result = await UserApp.updateMany(
        { _id: { $in: ids } },
        { status: newStatus, ...(reason ? { statusReason: reason } : {}) }
      );
    } else {
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

exports.getUserAppSummary = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    // Access: users can only view their own summary
    if (req.user.role !== 'admin' && userId !== req.user._id.toString())
      return res.status(403).json({ success: false, error: 'Access denied' });
    const result = await UserApp.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    const stats = result.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});
    res.json({
      success: true,
      summary: { total: Object.values(stats).reduce((sum, n) => sum + n, 0), stats }
    });
  } catch (err) {
    console.error('getUserAppSummary:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching summary' });
  }
};

// ------------------------------ USER-SPECIFIC ROUTES ------------------------------

exports.getMyUserApps = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search, sortBy, sortOrder } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const query = { user_id: req.user._id };
    if (status) query.status = status;
    if (search) query.app_id = new RegExp(search.trim(), 'i');
    const validSort = ['createdAt', 'updatedAt', 'status', 'app_id', 'performanceScore'];
    const sortField = validSort.includes(sortBy) ? sortBy : 'createdAt';
    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const [userApps, totalCount] = await Promise.all([
      UserApp.find(query)
        .sort({ [sortField]: sortDir })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      UserApp.countDocuments(query)
    ]);
    res.json({
      success: true,
      userApps: userApps.map(sanitizeUserApp),
      total: totalCount,
      page: pageNum,
      limit: limitNum
    });
  } catch (err) {
    console.error('getMyUserApps:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching user apps' });
  }
};

exports.createMyUserApp = async (req, res) => {
  try {
    const { app_id, status, appDetails, ...rest } = req.body;
    if (!app_id) return res.status(400).json({ success: false, error: 'app_id required' });
    if (status && !['active', 'inactive', 'pending', 'deleted', 'suspended', 'completed'].includes(status))
      return res.status(400).json({ success: false, error: 'Invalid status' });
    // Prevent duplicates
    const exists = await UserApp.findOne({ user_id: req.user._id, app_id });
    if (exists) return res.status(400).json({ success: false, error: 'User app already exists' });
    const userApp = new UserApp({
      user_id: req.user._id,
      app_id: app_id.trim(),
      status: status || 'active',
      ...(appDetails ? { appDetails } : {}),
      ...rest
    });
    await userApp.save();
    res.status(201).json({
      success: true,
      message: 'User app created',
      userApp: sanitizeUserApp(userApp)
    });
  } catch (err) {
    console.error('createMyUserApp:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error creating user app' });
  }
};

exports.updateMyUserApp = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, error: 'Invalid user app ID' });
    delete updates._id;
    delete updates.user_id;
    delete updates.__v;
    delete updates.createdAt;
    const userApp = await UserApp.findOne({ _id: id, user_id: req.user._id });
    if (!userApp) return res.status(404).json({ success: false, error: 'User app not found' });
    // Status validation
    if (updates.status && !['active', 'inactive', 'pending', 'deleted', 'suspended', 'completed'].includes(updates.status))
      return res.status(400).json({ success: false, error: 'Invalid status' });
    Object.assign(userApp, updates);
    await userApp.save();
    res.json({
      success: true,
      message: 'User app updated',
      userApp: sanitizeUserApp(userApp)
    });
  } catch (err) {
    console.error('updateMyUserApp:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error updating user app' });
  }
};

exports.deleteMyUserApp = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, error: 'Invalid user app ID' });
    const deleted = await UserApp.findOneAndDelete({ _id: id, user_id: req.user._id });
    if (!deleted) return res.status(404).json({ success: false, error: 'User app not found' });
    res.json({ success: true, message: 'User app deleted' });
  } catch (err) {
    console.error('deleteMyUserApp:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error deleting user app' });
  }
};

exports.suspendMyUserApp = exports.activateMyUserApp = exports.completeMyUserApp =
  async (req, res) => notImplemented()(req, res);

// --- User app analytics ---

exports.getMyUserAppStats = async (req, res) => {
  try {
    res.json({
      success: true,
      stats: {}
    });
  } catch (err) {
    console.error('getMyUserAppStats:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching stats' });
  }
};

exports.getMyUserAppAnalytics = async (req, res) => {
  try {
    res.json({
      success: true,
      analytics: {}
    });
  } catch (err) {
    console.error('getMyUserAppAnalytics:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching analytics' });
  }
};

exports.getMyUserAppEarnings = async (req, res) => {
  try {
    res.json({
      success: true,
      earnings: {}
    });
  } catch (err) {
    console.error('getMyUserAppEarnings:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching earnings' });
  }
};

exports.getMyUserAppPerformance = async (req, res) => {
  try {
    res.json({
      success: true,
      performance: {}
    });
  } catch (err) {
    console.error('getMyUserAppPerformance:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching performance' });
  }
};

exports.getMyUserAppSummary = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, error: 'Invalid user app ID' });
    res.json({
      success: true,
      summary: {}
    });
  } catch (err) {
    console.error('getMyUserAppSummary:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching summary' });
  }
};

exports.getMyUserAppHistory = async (req, res) => {
  try {
    res.json({
      success: true,
      history: []
    });
  } catch (err) {
    console.error('getMyUserAppHistory:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching history' });
  }
};

// --- App interaction tracking ---

exports.recordAppDownload = exports.recordAppInstall = exports.recordAppOpen =
exports.recordAppUninstall = exports.recordAppCrash = async (req, res) => notImplemented()(req, res);

// --- Task management ---

exports.getMyUserAppTasks = async (req, res) => {
  try {
    res.json({
      success: true,
      tasks: []
    });
  } catch (err) {
    console.error('getMyUserAppTasks:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching tasks' });
  }
};

exports.addTaskToMyUserApp = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Task added'
    });
  } catch (err) {
    console.error('addTaskToMyUserApp:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error adding task' });
  }
};

exports.completeMyUserAppTask = async (req, res) => notImplemented()(req, res);

// --- Public/discovery ---

exports.getActiveUserApps = async (req, res) => {
  try {
    res.json({
      success: true,
      userApps: []
    });
  } catch (err) {
    console.error('getActiveUserApps:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching active apps' });
  }
};

exports.getUserAppCategories = async (req, res) => {
  try {
    res.json({
      success: true,
      categories: []
    });
  } catch (err) {
    console.error('getUserAppCategories:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching categories' });
  }
};

exports.getTrendingUserApps = async (req, res) => {
  try {
    res.json({
      success: true,
      trending: []
    });
  } catch (err) {
    console.error('getTrendingUserApps:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching trending apps' });
  }
};

exports.getTopRatedUserApps = async (req, res) => {
  try {
    res.json({
      success: true,
      topRated: []
    });
  } catch (err) {
    console.error('getTopRatedUserApps:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching top rated apps' });
  }
};

exports.getNewReleaseUserApps = async (req, res) => {
  try {
    res.json({
      success: true,
      newReleases: []
    });
  } catch (err) {
    console.error('getNewReleaseUserApps:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching new releases' });
  }
};

exports.getUserAppRecommendations = async (req, res) => {
  try {
    res.json({
      success: true,
      recommendations: []
    });
  } catch (err) {
    console.error('getUserAppRecommendations:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching recommendations' });
  }
};

// --- ADMIN/ADVANCED ROUTES - STUB FORWARDS FOR YOUR ROUTES FILE ---
// (Implement as you build features)

[
  'getUserAppsByUserId', 'getUserAppSummaryByUserId', 'getUserAppPerformanceByUserId',
  'getAdminUserAppAnalytics', 'getUserAppStatistics', 'getUserAppPerformanceMetrics',
  'getUserAppEngagementReport', 'getUserAppRetentionReport', 'bulkExportUserApps',
  'approveUserApp', 'rejectUserApp', 'getUserAppTasks', 'addTaskToUserApp',
  'updateUserAppTask', 'deleteUserAppTask', 'flagUserApp', 'unflagUserApp',
  'getFlaggedUserApps', 'getStaleUserApps', 'getTopPerformingUserApps',
  'getUserAppsWithPendingTasks', 'getPlatformAnalytics', 'getCategoryPerformance',
  'getOptimizationRecommendations', 'getUnderperformingApps', 'getUserAppAuditTrail',
  'getUserAppSettings', 'updateUserAppSettings'
].forEach(fn => {
  if (!exports[fn]) exports[fn] = notImplemented(fn);
});
