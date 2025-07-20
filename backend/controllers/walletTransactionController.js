// backend/controllers/walletTransactionController.js
const mongoose = require('mongoose');
const WalletTransaction = require('../models/wallet_transaction');
const Wallet = require('../models/wallet');
const User = require('../models/user');
// const logger = require('../config/logger'); // Uncomment if you use a logger

// --- Utility: clean transactions ---
const sanitizeTx = (tx) => {
  if (!tx) return tx;
  if (typeof tx.toObject === 'function') tx = tx.toObject();
  delete tx.__v;
  delete tx.updatedAt;
  return tx;
};
// --- Utility: Not Implemented stub ---
const notImplemented = (name = '') => (...args) =>
  args[1].status(501).json({ success: false, error: `Not implemented${name?`: ${name}`:""}`});

// ------ CORE TRANSACTION CRUD ------
exports.listTransactions = async (req, res) => {
  try {
    const {
      page = 1, limit = 20, userId, status, fromDate, toDate,
      minAmount, maxAmount, paymentMethod, isInflow, search, sortBy, sortOrder
    } = req.query;
    const query = {};
    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    } else if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId))
        return res.status(400).json({ success: false, error: 'Invalid user ID' });
      query.userId = userId;
    }
    if (status) query.status = status;
    if (fromDate) query.createdAt = { ...query.createdAt, $gte: new Date(fromDate) };
    if (toDate) query.createdAt = { ...query.createdAt, $lte: new Date(toDate) };
    if (minAmount) query.amount = { ...query.amount, $gte: parseFloat(minAmount) };
    if (maxAmount) query.amount = { ...query.amount, $lte: parseFloat(maxAmount) };
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (isInflow !== undefined) query.isInflow = isInflow === 'true';
    if (search) {
      const rx = new RegExp(search.trim(), 'i');
      query.$or = [{ paymentMethod: rx }, { description: rx }];
    }
    const [transactions, totalCount] = await Promise.all([
      WalletTransaction.find(query)
        .sort({ [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1 })
        .skip((parseInt(page)-1) * parseInt(limit)).limit(parseInt(limit)).lean(),
      WalletTransaction.countDocuments(query)
    ]);
    res.json({ success: true, transactions: transactions.map(sanitizeTx), total: totalCount, page, limit });
  } catch (err) {
    console.error('listTransactions:', err);
    res.status(500).json({ success: false, error: 'Server error fetching transactions' });
  }
};

exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, error: 'Invalid transaction ID' });
    const tx = await WalletTransaction.findById(id)
      .populate('userId', 'name email').lean();
    if (!tx)
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    if (req.user.role !== 'admin' && tx.userId._id.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, error: 'Access denied' });
    res.json({ success: true, transaction: sanitizeTx(tx) });
  } catch (err) {
    console.error('getTransactionById:', err);
    res.status(500).json({ success: false, error: 'Server error fetching transaction' });
  }
};

exports.createTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      amount, userId = req.user._id, isInflow,
      paymentMethod, currency, description, status = 'successful'
    } = req.body;
    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    if (typeof amount !== 'number' || amount <= 0)
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    if (req.user.role !== 'admin' && userId !== req.user._id.toString())
      return res.status(403).json({ success: false, error: 'Access denied' });
    const tx = new WalletTransaction({
      amount, userId, isInflow, paymentMethod, currency, description, status
    });
    await tx.save({ session });
    let wallet = await Wallet.findOne({ userId }).session(session);
    if (!wallet) {
      wallet = new Wallet({ userId, balance: 0 });
      await wallet.save({ session });
    }
    wallet.balance = isInflow ? wallet.balance+amount : Math.max(0, wallet.balance-amount);
    await wallet.save({ session });
    await session.commitTransaction();
    const result = await tx.populate('userId', 'name email');
    res.status(201).json({ success: true, transaction: sanitizeTx(result), newBalance: wallet.balance });
  } catch (err) {
    await session.abortTransaction();
    console.error('createTransaction:', err);
    res.status(500).json({ success: false, error: 'Server error creating transaction' });
  } finally { session.endSession(); }
};

exports.updateTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { amount, status, description, paymentMethod } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, error: 'Invalid transaction ID' });
    const tx = await WalletTransaction.findById(id).session(session);
    if (!tx)
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    if (req.user.role !== 'admin' && tx.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, error: 'Access denied' });
    let walletAdj = 0;
    if (amount && amount !== tx.amount)
      walletAdj = tx.isInflow ? (amount - tx.amount) : (tx.amount - amount);
    const updates = {};
    if (amount !== undefined) updates.amount = amount;
    if (status !== undefined) updates.status = status;
    if (description !== undefined) updates.description = description;
    if (paymentMethod !== undefined) updates.paymentMethod = paymentMethod;
    const updatedTx = await WalletTransaction.findByIdAndUpdate(id, updates, { new: true, session })
      .populate('userId', 'name email');
    if (walletAdj !== 0) {
      const wallet = await Wallet.findOne({ userId: tx.userId }).session(session);
      if (wallet) {
        wallet.balance = Math.max(0, wallet.balance + walletAdj);
        await wallet.save({ session });
      }
    }
    await session.commitTransaction();
    res.json({ success: true, transaction: sanitizeTx(updatedTx) });
  } catch (err) {
    await session.abortTransaction();
    console.error('updateTransaction:', err);
    res.status(500).json({ success: false, error: 'Server error updating transaction' });
  } finally { session.endSession(); }
};

exports.deleteTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, error: 'Invalid transaction ID' });
    const tx = await WalletTransaction.findById(id).session(session);
    if (!tx)
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    if (req.user.role !== 'admin' && tx.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, error: 'Access denied' });
    const walletAdj = tx.isInflow ? -tx.amount : tx.amount;
    await tx.deleteOne({ session });
    const wallet = await Wallet.findOne({ userId: tx.userId }).session(session);
    if (wallet) {
      wallet.balance = Math.max(0, wallet.balance + walletAdj);
      await wallet.save({ session });
    }
    await session.commitTransaction();
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) {
    await session.abortTransaction();
    console.error('deleteTransaction:', err);
    res.status(500).json({ success: false, error: 'Server error deleting transaction' });
  } finally { session.endSession(); }
};

exports.bulkActions = async (req, res) => {
  try {
    const { action, ids, newStatus } = req.body;
    if (!action || !Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ success: false, error: 'Action and IDs array are required' });
    const invalidIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0)
      return res.status(400).json({ success: false, error: 'Invalid ID(s) in array' });
    let result;
    switch (action) {
      case 'delete':
        result = await WalletTransaction.deleteMany({ _id: { $in: ids } });
        break;
      case 'updateStatus':
        if (!newStatus)
          return res.status(400).json({ success: false, error: 'New status is required' });
        result = await WalletTransaction.updateMany({ _id: { $in: ids } }, { status: newStatus });
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
    res.status(500).json({ success: false, error: 'Server error performing bulk action' });
  }
};

exports.getTransactionAnalytics = async (req, res) => {
  try {
    const { period = '30d', userId } = req.query;
    let dateFilter = {};
    const now = new Date();
    switch (period) {
      case '7d': dateFilter = { createdAt: { $gte: new Date(now - 7*24*60*60*1000) } }; break;
      case '30d': dateFilter = { createdAt: { $gte: new Date(now - 30*24*60*60*1000) } }; break;
      case '90d': dateFilter = { createdAt: { $gte: new Date(now - 90*24*60*60*1000) } }; break;
      case '1y': dateFilter = { createdAt: { $gte: new Date(now - 365*24*60*60*1000) } }; break;
    }
    const baseQuery = userId
      ? { userId: new mongoose.Types.ObjectId(userId), ...dateFilter }
      : dateFilter;
    const [overview, dailyActivity, paymentMethodStats] = await Promise.all([
      WalletTransaction.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            avgAmount: { $avg: '$amount' },
            totalInflow: { $sum: { $cond: ['$isInflow', '$amount', 0] } },
            totalOutflow: { $sum: { $cond: ['$isInflow', 0, '$amount'] } },
            successfulCount: { $sum: { $cond: [{ $eq: ['$status', 'successful'] }, 1, 0] } },
            pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            failedCount: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
          }
        }
      ]),
      WalletTransaction.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            transactionCount: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            inflowAmount: { $sum: { $cond: ['$isInflow', '$amount', 0] } },
            outflowAmount: { $sum: { $cond: ['$isInflow', 0, '$amount'] } }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: 30 }
      ]),
      WalletTransaction.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        },
        { $sort: { count: -1 } }
      ])
    ]);
    res.json({
      success: true,
      analytics: {
        overview: overview[0] || {},
        dailyActivity,
        paymentMethodStats
      }
    });
  } catch (err) {
    console.error('getTransactionAnalytics:', err);
    res.status(500).json({ success: false, error: 'Server error fetching analytics' });
  }
};

exports.getUserTransactionSummary = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    if (req.user.role !== 'admin' && userId !== req.user._id.toString())
      return res.status(403).json({ success: false, error: 'Access denied' });
    const summary = await WalletTransaction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalInflow: { $sum: { $cond: ['$isInflow', '$amount', 0] } },
          totalOutflow: { $sum: { $cond: ['$isInflow', 0, '$amount'] } },
          successfulCount: { $sum: { $cond: [{ $eq: ['$status', 'successful'] }, 1, 0] } },
          pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          failedCount: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
        }
      }
    ]);
    res.json({ success: true, summary: summary[0] || {} });
  } catch (err) {
    console.error('getUserTransactionSummary:', err);
    res.status(500).json({ success: false, error: 'Server error fetching summary' });
  }
};

// ------------------- AUTO-EXPORT "NOT IMPLEMENTED" STUBS FOR ALL ADVANCED ROUTES --------------------
[
  'getMyTransactions','getMyTransactionSummary','getMyTransactionAnalytics','getMyBalanceHistory','getMyRecentTransactions','generateMyStatement','getMyMonthlyStatement',
  'createTransactionDispute','getTransactionDispute','verifyTransactionOTP','resendTransactionOTP',
  'updateTransactionStatus','approveTransaction','rejectTransaction','processTransaction','verifyTransaction','flagTransaction','unflagTransaction',
  'bulkExportTransactions','bulkImportTransactions','bulkProcessTransactions','getTransactionStatistics','getDailyTransactionSummary','getHourlyTransactionVolume','getPaymentMethodBreakdown','getTransactionSuccessRate','getFlaggedTransactions','getSuspiciousTransactions','getPendingTransactions','getFailedTransactionAnalysis','getUserTransactions','getUserTransactionPatterns','getTransactionDisputes','updateDisputeStatus','getReconciliationReport','runReconciliation','getTransactionAuditTrail','getGatewayStatus','getGatewayPerformance','testGatewayConnection','getTransactionHealthMetrics','getProcessingQueue','clearProcessingQueue','getTransactionSettings','updateTransactionSettings','reprocessFailedTransactions','cleanupOldTransactions','emergencyHaltProcessing','resumeProcessing'
].forEach(fn => {
  if (!exports[fn]) exports[fn] = notImplemented(fn);
});
