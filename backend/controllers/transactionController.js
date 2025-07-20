// backend/controllers/transactionController.js
const mongoose = require('mongoose');
const Transaction = require('../models/transaction');
// const logger = require('../config/logger'); // Uncomment if you use a logger

// --- Helper: return a clean transaction object for API responses ---
const sanitizeTx = (tx) => {
  if (!tx) return tx;
  if (typeof tx.toObject === 'function') tx = tx.toObject();
  delete tx.__v;
  delete tx.updatedAt;
  // Remove other sensitive fields if needed
  return tx;
};

// --- Helper: centralized not-implemented response ---
const notImplemented = (name = '') => (...args) =>
  args[1].status(501).json({ success: false, error: `Not implemented${name?`: ${name}`:''}` });

// ---------------------------- CORE TRANSACTION LOGIC ----------------------------

exports.listTransactions = async (req, res) => {
  try {
    const {
      userId, status, page = 1, limit = 20, search,
      startDate, endDate, minAmount, maxAmount, currency,
      sortBy = 'createdAt', sortOrder = 'desc'
    } = req.query;
    // Input validation
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    if (isNaN(pageNum) || isNaN(limitNum))
      return res.status(400).json({ success: false, error: 'Invalid pagination' });
    // Build query
    const query = {};
    // Access control: users only see theirs, admins see all
    if (req.user.role !== 'admin' && userId && userId !== req.user._id.toString())
      return res.status(403).json({ success: false, error: 'Access denied' });
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId))
        return res.status(400).json({ success: false, error: 'Invalid user ID' });
      query.userId = userId;
    }
    // Status
    if (status) {
      if (!['successful', 'pending', 'failed'].includes(status))
        return res.status(400).json({ success: false, error: 'Invalid status' });
      query.paymentStatus = status;
    }
    // Currency
    if (currency) {
      if (!['INR', 'USD', 'EUR', 'GBP'].includes(currency))
        return res.status(400).json({ success: false, error: 'Invalid currency' });
      query.currency = currency;
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
    // Amount range
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) {
        const min = parseFloat(minAmount);
        if (isNaN(min) || min < 0)
          return res.status(400).json({ success: false, error: 'Invalid minAmount' });
        query.amount.$gte = min;
      }
      if (maxAmount) {
        const max = parseFloat(maxAmount);
        if (isNaN(max) || max < 0)
          return res.status(400).json({ success: false, error: 'Invalid maxAmount' });
        query.amount.$lte = max;
      }
    }
    // Search
    if (search) {
      const rx = new RegExp(search.trim(), 'i');
      query.$or = [
        { transactionId: rx },
        { name: rx },
        { email: rx }
      ];
    }
    // Sorting
    const validSort = ['createdAt', 'amount', 'paymentStatus', 'currency'];
    const sortField = validSort.includes(sortBy) ? sortBy : 'createdAt';
    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const skip = (pageNum - 1) * limitNum;
    // Query
    const [txs, total] = await Promise.all([
      Transaction.find(query)
        .populate('userId', 'name email role')
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Transaction.countDocuments(query)
    ]);
    // Admin analytics (optional)
    let stats = null;
    if (req.user.role === 'admin') {
      const statsQuery = query.userId ? { userId: new mongoose.Types.ObjectId(query.userId) } : {};
      const result = await Transaction.aggregate([
        { $match: statsQuery },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            avgAmount: { $avg: '$amount' },
            successful: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'successful'] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'failed'] }, 1, 0] } }
          }
        }
      ]);
      stats = result[0] || {
        totalAmount: 0, avgAmount: 0, successful: 0, pending: 0, failed: 0
      };
    }
    res.json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      transactions: txs.map(sanitizeTx),
      ...(stats ? { stats } : {})
    });
  } catch (err) {
    console.error('listTransactions:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching transactions' });
  }
};

exports.getTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, error: 'Invalid transaction ID' });
    const tx = await Transaction.findById(id)
      .populate('userId', 'name email role')
      .lean();
    if (!tx)
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    // Access control
    if (req.user.role !== 'admin' && tx.userId._id.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, error: 'Access denied' });
    res.json({ success: true, transaction: sanitizeTx(tx) });
  } catch (err) {
    console.error('getTransaction:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching transaction' });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const {
      userId, transactionId, name, email, amount, currency,
      paymentStatus = 'pending', paymentGateway = 'internal'
    } = req.body;
    // Input validation
    if (!userId || !amount || !currency)
      return res.status(400).json({ success: false, error: 'userId, amount, and currency required' });
    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    if (isNaN(amount) || amount <= 0)
      return res.status(400).json({ success: false, error: 'Amount must be positive' });
    if (!['INR', 'USD', 'EUR', 'GBP'].includes(currency))
      return res.status(400).json({ success: false, error: 'Invalid currency' });
    if (!['successful', 'pending', 'failed'].includes(paymentStatus))
      return res.status(400).json({ success: false, error: 'Invalid payment status' });
    // Create tx
    const tx = new Transaction({
      userId, transactionId, name, email, amount, currency,
      paymentStatus, paymentGateway
    });
    await tx.save();
    await tx.populate('userId', 'name email role');
    res.status(201).json({
      success: true,
      message: 'Transaction created',
      transaction: sanitizeTx(tx)
    });
  } catch (err) {
    console.error('createTransaction:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error creating transaction' });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, error: 'Invalid transaction ID' });
    // Validate updates
    if (updates.amount && (isNaN(updates.amount) || updates.amount <= 0))
      return res.status(400).json({ success: false, error: 'Amount must be positive' });
    if (updates.currency && !['INR', 'USD', 'EUR', 'GBP'].includes(updates.currency))
      return res.status(400).json({ success: false, error: 'Invalid currency' });
    if (updates.paymentStatus && !['successful', 'pending', 'failed', 'cancelled', 'refunded'].includes(updates.paymentStatus))
      return res.status(400).json({ success: false, error: 'Invalid payment status' });
    // Apply updates
    const tx = await Transaction.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('userId', 'name email role');
    if (!tx)
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    res.json({
      success: true,
      message: 'Transaction updated',
      transaction: sanitizeTx(tx)
    });
  } catch (err) {
    console.error('updateTransaction:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error updating transaction' });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, error: 'Invalid transaction ID' });
    const tx = await Transaction.findByIdAndDelete(id);
    if (!tx)
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) {
    console.error('deleteTransaction:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error deleting transaction' });
  }
};

exports.updateTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, error: 'Invalid transaction ID' });
    if (!['successful', 'pending', 'failed', 'cancelled', 'refunded'].includes(status))
      return res.status(400).json({ success: false, error: 'Invalid status' });
    const tx = await Transaction.findByIdAndUpdate(
      id,
      { paymentStatus: status },
      { new: true }
    ).populate('userId', 'name email role');
    if (!tx)
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    // Optional: log reason
    res.json({
      success: true,
      message: 'Status updated',
      transaction: sanitizeTx(tx)
    });
  } catch (err) {
    console.error('updateTransactionStatus:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error updating status' });
  }
};

exports.bulkTransactionAction = async (req, res) => {
  try {
    const { action, ids, newStatus } = req.body;
    if (!action || !Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ success: false, error: 'Action and IDs required' });
    if (ids.some(id => !mongoose.Types.ObjectId.isValid(id)))
      return res.status(400).json({ success: false, error: 'Invalid ID(s)' });
    let result;
    switch (action) {
      case 'delete':
        result = await Transaction.deleteMany({ _id: { $in: ids } });
        break;
      case 'updateStatus':
        if (!newStatus || !['successful', 'pending', 'failed', 'cancelled', 'refunded'].includes(newStatus))
          return res.status(400).json({ success: false, error: 'Invalid newStatus' });
        result = await Transaction.updateMany(
          { _id: { $in: ids } },
          { paymentStatus: newStatus }
        );
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
    console.error('bulkTransactionAction:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error performing bulk action' });
  }
};

// --- STUB ALL OTHER ROUTES REFERENCED IN YOUR ROUTES FILE ---
// (To prevent "callback undefined" errors, safe for any backend/frontend)
[
  'getMyTransactionHistory', 'getMyTransactionSummary', 'getMyTransactionAnalytics', 'getTransactionStatusHistory',
  'getTransactionReceipt', 'generateTransactionInvoice', 'createTransactionDispute', 'getTransactionDispute',
  'approveTransaction', 'rejectTransaction', 'processRefund', 'getTransactionRefunds', 'bulkExportTransactions',
  'getAdminTransactionAnalytics', 'getTransactionStatistics', 'getTransactionPerformanceMetrics',
  'getRevenueReport', 'getSuspiciousTransactions', 'flagTransaction', 'unflagTransaction',
  'getUserTransactions', 'getUserTransactionSummary', 'getTransactionDisputes', 'updateDisputeStatus',
  'getReconciliationReport', 'runReconciliation', 'getGatewayStatus', 'getGatewayPerformance',
  'getAuditTrail', 'getTransactionSettings', 'updateTransactionSettings'
].forEach(fn => {
  if (!exports[fn]) exports[fn] = notImplemented(fn);
});
