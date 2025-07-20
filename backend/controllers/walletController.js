// backend/controllers/walletController.js
const Wallet = require("../models/wallet");
const User = require("../models/user");
const WalletTransaction = require("../models/wallet_transaction");
const mongoose = require('mongoose');

// --- Utility for 501 Not Implemented ---
function notImplemented(endpoint = '') {
  return (req, res) => res.status(501).json({
    success: false,
    error: `Not implemented: ${endpoint || req.originalUrl}`
  });
}

/** --- [Already implemented: List Wallets] --- */
exports.listWallets = async (req, res) => {
  // ...keep your long implementation from the snippet...
};

/** --- [Already implemented: Get Wallet By ID] --- */
exports.getWalletById = async (req, res) => {
  // ...keep your long implementation from the snippet...
};

/** --- [Already implemented: Get Wallet By User ID] --- */
exports.getWalletByUserId = async (req, res) => {
  // ...keep your long implementation from the snippet...
};

/** --- [Already implemented: Create Wallet] --- */
exports.createWallet = async (req, res) => {
  // ...keep your long implementation from the snippet...
};

/** --- [Already implemented: Update Wallet] --- */
exports.updateWallet = async (req, res) => {
  // ...keep your long implementation from the snippet...
};

/** --- [Already implemented: Delete Wallet] --- */
exports.deleteWallet = async (req, res) => {
  // ...keep your long implementation from the snippet...
};

/** --- [Already implemented: Bulk Actions] --- */
exports.bulkActions = async (req, res) => {
  // ...keep your long implementation from the snippet...
};

/** --- [Already implemented: Wallet Analytics] --- */
exports.getWalletAnalytics = async (req, res) => {
  // ...keep your long implementation from the snippet...
};

/** --- [Already implemented: Internal helpers] --- */
exports.getWalletByUserIdInternal = async (userId) => {
  // ...keep your long implementation from the snippet...
};
exports.createWalletForUserInternal = async (userId) => {
  // ...keep your long implementation from the snippet...
};

// --- NEW: Defensive stubs for all advanced/admin/analytics routes ---
[
  // direct wallet operations not covered above
  'creditWallet',
  'debitWallet',
  'freezeWallet',
  'unfreezeWallet',
  'suspendWallet',
  'activateWallet',
  'verifyWallet',
  'unverifyWallet',
  'flagWallet',
  'unflagWallet',
  'reconcileWallet',
  'getWalletAuditTrail',
  'getWalletBalanceHistory',
  'getWalletTransactionSummary',
  'updateWalletLimits',
  'getWalletLimits',
  'resetWalletLimits',
  'bulkExportWallets',
  'bulkImportWallets',
  'getWalletStatistics',
  'getBalanceDistribution',
  'getTransactionVolume',
  'getWalletGrowthMetrics',
  'getFlaggedWallets',
  'getSuspiciousActivity',
  'getLargeTransactions',
  'getComplianceReport',
  'performWalletHealthCheck',
  'performSystemReconciliation',
  'setMaintenanceMode',
  'getWalletSystemSettings',
  'updateWalletSystemSettings',
  'getUserWallet',
  'createUserWallet',
  'getUserWalletHistory',
  'getUserWalletSummary',
  'emergencyFreezeWallet',
  'emergencyBulkFreeze',
  'getWalletAuditLog',
  'getWalletActivityLog'
].forEach((fn) => {
  if (!exports[fn]) exports[fn] = notImplemented(fn);
});
