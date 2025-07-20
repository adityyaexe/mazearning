// backend/controllers/userAdController.js
const mongoose = require('mongoose');
const UserAd = require('../models/userAd');
const User = require('../models/user');
// const logger = require('../config/logger'); // Uncomment if you use a logger

// --- Helper: sanitize user ad object for responses ---
const sanitizeUserAd = (ad) => {
  if (!ad) return ad;
  if (typeof ad.toObject === 'function') ad = ad.toObject();
  delete ad.__v;
  delete ad.updatedAt;
  return ad;
};

// --- Helper: not implemented yet handler ---
const notImplemented = (name = '') => (...args) =>
  args[1].status(501).json({ success: false, error: `Not implemented${name?`: ${name}`:''}` });

// ------------------------------
// CORE USER AD CRUD
// ------------------------------

exports.listUserAds = async (req, res) => {
  try {
    const {
      user_id, status, page = 1, limit = 20, search,
      startDate, endDate, sortBy, sortOrder
    } = req.query;
    // Input validation
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const query = {};
    // Access: users only see their own, admins see all (or filtered)
    if (req.user.role !== 'admin') {
      query.user_id = req.user._id;
    } else if (user_id) {
      if (!mongoose.Types.ObjectId.isValid(user_id))
        return res.status(400).json({ success: false, error: 'Invalid user_id' });
      query.user_id = user_id;
    }
    // Status
    if (status) {
      if (!['active', 'paused', 'completed', 'deleted', 'expired'].includes(status))
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
    if (search) query.ad_id = new RegExp(search.trim(), 'i');
    // Sorting
    const validSort = ['createdAt', 'updatedAt', 'status', 'ad_id'];
    const sortField = validSort.includes(sortBy) ? sortBy : 'createdAt';
    const sortDir = sortOrder === 'asc' ? 1 : -1;
    // Execute query
    const [userAds, totalCount] = await Promise.all([
      UserAd.find(query)
        .populate('user_id', 'name email role')
        .sort({ [sortField]: sortDir })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      UserAd.countDocuments(query)
    ]);
    // Admin stats
    let stats = null;
    if (req.user.role === 'admin') {
      const statsQuery = user_id ? { user_id: new mongoose.Types.ObjectId(user_id) } : {};
      const result = await UserAd.aggregate([
        { $match: statsQuery },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            paused: { $sum: { $cond: [{ $eq: ['$status', 'paused'] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            deleted: { $sum: { $cond: [{ $eq: ['$status', 'deleted'] }, 1, 0] } },
            expired: { $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] } }
          }
        }
      ]);
      stats = result[0] || {
        total: 0, active: 0, paused: 0, completed: 0, deleted: 0, expired: 0
      };
    }
    res.json({
      success: true,
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      userAds: userAds.map(sanitizeUserAd),
      ...(stats && { stats })
    });
  } catch (err) {
    console.error('listUserAds:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error listing user ads' });
  }
};

exports.getUserAdById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, error: 'Invalid user ad ID' });
    const userAd = await UserAd.findById(id)
      .populate('user_id', 'name email role')
      .lean();
    if (!userAd) return res.status(404).json({ success: false, error: 'User ad not found' });
    // Access control
    if (req.user.role !== 'admin' && userAd.user_id._id.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, error: 'Access denied' });
    res.json({ success: true, userAd: sanitizeUserAd(userAd) });
  } catch (err) {
    console.error('getUserAdById:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching user ad' });
  }
};

exports.createUserAd = async (req, res) => {
  try {
    const { user_id, ad_id, status, campaign, ...rest } = req.body;
    // Basic validation
    if (!user_id || !ad_id)
      return res.status(400).json({ success: false, error: 'user_id and ad_id are required' });
    if (!mongoose.Types.ObjectId.isValid(user_id))
      return res.status(400).json({ success: false, error: 'Invalid user_id' });
    if (typeof ad_id !== 'string' || ad_id.trim().length === 0)
      return res.status(400).json({ success: false, error: 'Invalid ad_id' });
    if (status && !['active', 'paused', 'completed', 'deleted', 'expired'].includes(status))
      return res.status(400).json({ success: false, error: 'Invalid status' });
    // Access: users can only create for themselves
    if (req.user.role !== 'admin' && user_id !== req.user._id.toString())
      return res.status(403).json({ success: false, error: 'Access denied' });
    // Prevent duplicates
    const exists = await UserAd.findOne({ user_id, ad_id });
    if (exists) return res.status(400).json({ success: false, error: 'User ad already exists' });
    // Create ad
    const userAd = new UserAd({
      user_id,
      ad_id: ad_id.trim(),
      status: status || 'active',
      ...(campaign ? { campaign } : {}),
      ...rest
    });
    await userAd.save();
    await userAd.populate('user_id', 'name email role');
    res.status(201).json({
      success: true,
      message: 'User ad created',
      userAd: sanitizeUserAd(userAd)
    });
  } catch (err) {
    console.error('createUserAd:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error creating user ad' });
  }
};

exports.updateUserAd = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, error: 'Invalid user ad ID' });
    // Remove non-updatable fields
    delete updates._id;
    delete updates.__v;
    delete updates.createdAt;
    // Status validation
    if (updates.status && !['active', 'paused', 'completed', 'deleted', 'expired'].includes(updates.status))
      return res.status(400).json({ success: false, error: 'Invalid status' });
    // Access: users can only update their own
    const userAd = await UserAd.findById(id);
    if (!userAd) return res.status(404).json({ success: false, error: 'User ad not found' });
    if (req.user.role !== 'admin' && userAd.user_id.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, error: 'Access denied' });
    // Apply updates
    const updated = await UserAd.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('user_id', 'name email role');
    res.json({
      success: true,
      message: 'User ad updated',
      userAd: sanitizeUserAd(updated)
    });
  } catch (err) {
    console.error('updateUserAd:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error updating user ad' });
  }
};

exports.deleteUserAd = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, error: 'Invalid user ad ID' });
    const userAd = await UserAd.findById(id);
    if (!userAd) return res.status(404).json({ success: false, error: 'User ad not found' });
    // Access: users can only delete their own
    if (req.user.role !== 'admin' && userAd.user_id.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, error: 'Access denied' });
    await UserAd.findByIdAndDelete(id);
    res.json({ success: true, message: 'User ad deleted' });
  } catch (err) {
    console.error('deleteUserAd:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error deleting user ad' });
  }
};

exports.updateUserAdStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, error: 'Invalid user ad ID' });
    if (!['active', 'paused', 'completed', 'deleted', 'expired'].includes(status))
      return res.status(400).json({ success: false, error: 'Invalid status' });
    const userAd = await UserAd.findById(id);
    if (!userAd) return res.status(404).json({ success: false, error: 'User ad not found' });
    // Access: users can only update their own
    if (req.user.role !== 'admin' && userAd.user_id.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, error: 'Access denied' });
    userAd.status = status;
    if (reason) userAd.statusReason = reason;
    await userAd.save();
    res.json({
      success: true,
      message: 'Status updated',
      userAd: sanitizeUserAd(userAd)
    });
  } catch (err) {
    console.error('updateUserAdStatus:', err);
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
      result = await UserAd.deleteMany({ _id: { $in: ids } });
      // Optional: Delete related analytics, events, earnings, etc.
    } else if (action === 'updateStatus') {
      if (!newStatus || !['active', 'paused', 'completed', 'deleted', 'expired'].includes(newStatus))
        return res.status(400).json({ success: false, error: 'Invalid newStatus' });
      result = await UserAd.updateMany(
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

// ------------------------------
// USER-SPECIFIC ROUTES
// ------------------------------

exports.getMyUserAds = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search, sortBy, sortOrder } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const query = { user_id: req.user._id };
    if (status) query.status = status;
    if (search) query.ad_id = new RegExp(search.trim(), 'i');
    const validSort = ['createdAt', 'updatedAt', 'status', 'ad_id'];
    const sortField = validSort.includes(sortBy) ? sortBy : 'createdAt';
    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const [userAds, totalCount] = await Promise.all([
      UserAd.find(query)
        .sort({ [sortField]: sortDir })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      UserAd.countDocuments(query)
    ]);
    res.json({
      success: true,
      userAds: userAds.map(sanitizeUserAd),
      total: totalCount,
      page: pageNum,
      limit: limitNum
    });
  } catch (err) {
    console.error('getMyUserAds:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching user ads' });
  }
};

exports.createMyUserAd = async (req, res) => {
  try {
    const { ad_id, status, campaign, ...rest } = req.body;
    if (!ad_id) return res.status(400).json({ success: false, error: 'ad_id required' });
    if (status && !['active', 'paused', 'completed', 'deleted', 'expired'].includes(status))
      return res.status(400).json({ success: false, error: 'Invalid status' });
    // Prevent duplicates
    const exists = await UserAd.findOne({ user_id: req.user._id, ad_id });
    if (exists) return res.status(400).json({ success: false, error: 'User ad already exists' });
    const userAd = new UserAd({
      user_id: req.user._id,
      ad_id: ad_id.trim(),
      status: status || 'active',
      ...(campaign ? { campaign } : {}),
      ...rest
    });
    await userAd.save();
    res.status(201).json({
      success: true,
      message: 'User ad created',
      userAd: sanitizeUserAd(userAd)
    });
  } catch (err) {
    console.error('createMyUserAd:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error creating user ad' });
  }
};

exports.updateMyUserAd = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, error: 'Invalid user ad ID' });
    delete updates._id;
    delete updates.user_id;
    delete updates.__v;
    delete updates.createdAt;
    const userAd = await UserAd.findOne({ _id: id, user_id: req.user._id });
    if (!userAd) return res.status(404).json({ success: false, error: 'User ad not found' });
    // Status validation
    if (updates.status && !['active', 'paused', 'completed', 'deleted', 'expired'].includes(updates.status))
      return res.status(400).json({ success: false, error: 'Invalid status' });
    Object.assign(userAd, updates);
    await userAd.save();
    res.json({
      success: true,
      message: 'User ad updated',
      userAd: sanitizeUserAd(userAd)
    });
  } catch (err) {
    console.error('updateMyUserAd:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error updating user ad' });
  }
};

exports.deleteMyUserAd = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, error: 'Invalid user ad ID' });
    const deleted = await UserAd.findOneAndDelete({ _id: id, user_id: req.user._id });
    if (!deleted) return res.status(404).json({ success: false, error: 'User ad not found' });
    res.json({ success: true, message: 'User ad deleted' });
  } catch (err) {
    console.error('deleteMyUserAd:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error deleting user ad' });
  }
};

exports.pauseMyUserAd = exports.resumeMyUserAd = exports.completeMyUserAd =
  async (req, res) => notImplemented()(req, res);

// --- User ad analytics ---

exports.getMyUserAdStats = async (req, res) => {
  try {
    res.json({
      success: true,
      stats: {}
    });
  } catch (err) {
    console.error('getMyUserAdStats:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching stats' });
  }
};

exports.getMyUserAdAnalytics = async (req, res) => {
  try {
    res.json({
      success: true,
      analytics: {}
    });
  } catch (err) {
    console.error('getMyUserAdAnalytics:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching analytics' });
  }
};

exports.getMyUserAdEarnings = async (req, res) => {
  try {
    res.json({
      success: true,
      earnings: {}
    });
  } catch (err) {
    console.error('getMyUserAdEarnings:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching earnings' });
  }
};

exports.getMyUserAdPerformance = async (req, res) => {
  try {
    res.json({
      success: true,
      performance: {}
    });
  } catch (err) {
    console.error('getMyUserAdPerformance:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching performance' });
  }
};

exports.getMyUserAdSummary = async (req, res) => {
  try {
    res.json({
      success: true,
      summary: {}
    });
  } catch (err) {
    console.error('getMyUserAdSummary:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching summary' });
  }
};

exports.getMyUserAdHistory = async (req, res) => {
  try {
    res.json({
      success: true,
      history: []
    });
  } catch (err) {
    console.error('getMyUserAdHistory:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching history' });
  }
};

// --- Ad interaction tracking ---

exports.recordAdView = exports.recordAdClick = exports.recordAdConversion =
  async (req, res) => notImplemented()(req, res);

// --- Public/discovery ---

exports.getActiveUserAds = async (req, res) => {
  try {
    res.json({
      success: true,
      userAds: []
    });
  } catch (err) {
    console.error('getActiveUserAds:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching active ads' });
  }
};

exports.getUserAdCategories = async (req, res) => {
  try {
    res.json({
      success: true,
      categories: []
    });
  } catch (err) {
    console.error('getUserAdCategories:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching categories' });
  }
};

exports.getTrendingUserAds = async (req, res) => {
  try {
    res.json({
      success: true,
      trending: []
    });
  } catch (err) {
    console.error('getTrendingUserAds:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching trending ads' });
  }
};

// --- ADMIN/ADVANCED ROUTES - STUB FORWARDS FOR YOUR ROUTES FILE ---
// (Implement as you build features)

[
  'getUserAdsByUserId', 'getUserAdSummaryByUserId', 'getUserAdPerformanceByUserId',
  'getAdminUserAdAnalytics', 'getUserAdStatistics', 'getUserAdPerformanceMetrics',
  'getUserAdRevenueReport', 'bulkExportUserAds', 'approveUserAd', 'rejectUserAd',
  'flagUserAd', 'unflagUserAd', 'getFlaggedUserAds', 'getAdCampaigns',
  'getAdsByCampaign', 'getCampaignPerformance', 'getOptimizationRecommendations',
  'getUnderperformingAds', 'getTopPerformingAds', 'getUserAdAuditTrail',
  'getUserAdSettings', 'updateUserAdSettings'
].forEach(fn => {
  if (!exports[fn]) exports[fn] = notImplemented(fn);
});
