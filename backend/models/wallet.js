// backend/models/wallet.js
const mongoose = require("mongoose");
const { Schema, model } = require("mongoose");

const walletSchema = new Schema(
  {
    balance: {
      type: Number,
      default: 0,
      min: [0, 'Balance cannot be negative'],
      max: [10000000, 'Balance cannot exceed 10,000,000'],
      get: function(value) {
        return Math.round(value * 100) / 100; // Round to 2 decimal places
      },
      set: function(value) {
        return Math.round(value * 100) / 100;
      }
    },
    
    userId: {
      type: Schema.Types.ObjectId,
      required: [true, 'User ID is required'],
      ref: "User",
      unique: true, // One wallet per user
      index: true
    },
    
    // Multi-currency support
    currency: {
      type: String,
      enum: {
        values: ['INR', 'USD', 'EUR', 'GBP'],
        message: 'Currency must be one of: INR, USD, EUR, GBP'
      },
      default: 'INR',
      uppercase: true
    },
    
    // Wallet limits and restrictions
    limits: {
      dailyWithdrawal: {
        type: Number,
        default: 50000,
        min: [0, 'Daily withdrawal limit cannot be negative']
      },
      monthlyWithdrawal: {
        type: Number,
        default: 200000,
        min: [0, 'Monthly withdrawal limit cannot be negative']
      },
      maxBalance: {
        type: Number,
        default: 1000000,
        min: [0, 'Maximum balance limit cannot be negative']
      },
      minWithdrawal: {
        type: Number,
        default: 10,
        min: [0, 'Minimum withdrawal amount cannot be negative']
      }
    },
    
    // Wallet status and security
    status: {
      type: String,
      enum: {
        values: ['active', 'frozen', 'suspended', 'closed'],
        message: 'Status must be one of: active, frozen, suspended, closed'
      },
      default: 'active',
      index: true
    },
    
    isVerified: {
      type: Boolean,
      default: false
    },
    
    // Security features
    pin: {
      type: String,
      select: false,
      validate: {
        validator: function(pin) {
          return !pin || /^\d{4,6}$/.test(pin);
        },
        message: 'PIN must be 4-6 digits'
      }
    },
    
    pinAttempts: {
      type: Number,
      default: 0,
      max: [5, 'Maximum PIN attempts exceeded']
    },
    
    pinLockedUntil: {
      type: Date,
      default: null
    },
    
    // Balance tracking for reconciliation
    lastReconciled: {
      type: Date,
      default: null
    },
    
    reconciledBalance: {
      type: Number,
      default: 0,
      min: [0, 'Reconciled balance cannot be negative']
    },
    
    // Pending transactions tracking
    pendingCredits: {
      type: Number,
      default: 0,
      min: [0, 'Pending credits cannot be negative']
    },
    
    pendingDebits: {
      type: Number,
      default: 0,
      min: [0, 'Pending debits cannot be negative']
    },
    
    // Available balance (balance - pending debits)
    availableBalance: {
      type: Number,
      default: 0,
      min: [0, 'Available balance cannot be negative']
    },
    
    // Lifetime statistics
    totalEarned: {
      type: Number,
      default: 0,
      min: [0, 'Total earned cannot be negative']
    },
    
    totalWithdrawn: {
      type: Number,
      default: 0,
      min: [0, 'Total withdrawn cannot be negative']
    },
    
    totalTransactions: {
      type: Number,
      default: 0,
      min: [0, 'Total transactions cannot be negative']
    },
    
    // Last activity tracking
    lastCreditDate: {
      type: Date,
      default: null
    },
    
    lastDebitDate: {
      type: Date,
      default: null
    },
    
    lastTransactionDate: {
      type: Date,
      default: null,
      index: true
    },
    
    // Wallet metadata
    metadata: {
      type: Map,
      of: String,
      default: new Map()
    },
    
    // Admin tracking
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    
    // Audit fields
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    
    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    
    deletedAt: {
      type: Date,
      default: null
    },
    
    // Wallet flags
    isFlagged: {
      type: Boolean,
      default: false,
      index: true
    },
    
    flagReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Flag reason cannot exceed 500 characters']
    },
    
    // Automatic reconciliation
    autoReconcile: {
      type: Boolean,
      default: true
    },
    
    // Notification preferences
    notifications: {
      lowBalance: {
        type: Boolean,
        default: true
      },
      transactions: {
        type: Boolean,
        default: true
      },
      threshold: {
        type: Number,
        default: 100,
        min: [0, 'Notification threshold cannot be negative']
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true }
  }
);

// Indexes for performance
walletSchema.index({ userId: 1 }, { unique: true }); // Unique wallet per user
walletSchema.index({ status: 1 }); // For status filtering
walletSchema.index({ balance: -1 }); // For balance-based queries
walletSchema.index({ lastTransactionDate: -1 }); // For activity tracking
walletSchema.index({ isFlagged: 1 }); // For flagged wallets
walletSchema.index({ createdAt: -1 }); // For chronological sorting

// Virtual fields
walletSchema.virtual('formattedBalance').get(function() {
  return `${this.currency} ${this.balance.toFixed(2)}`;
});

walletSchema.virtual('isActive').get(function() {
  return this.status === 'active' && !this.isDeleted;
});

walletSchema.virtual('isFrozen').get(function() {
  return this.status === 'frozen' || this.status === 'suspended';
});

walletSchema.virtual('isPinLocked').get(function() {
  return this.pinLockedUntil && this.pinLockedUntil > new Date();
});

walletSchema.virtual('canWithdraw').get(function() {
  return this.isActive && !this.isPinLocked && this.availableBalance > 0;
});

walletSchema.virtual('netWorth').get(function() {
  return this.balance + this.pendingCredits - this.pendingDebits;
});

walletSchema.virtual('transactionVolume').get(function() {
  return this.totalEarned + this.totalWithdrawn;
});

walletSchema.virtual('balanceUtilization').get(function() {
  if (this.limits.maxBalance === 0) return 0;
  return (this.balance / this.limits.maxBalance) * 100;
});

walletSchema.virtual('daysSinceLastTransaction').get(function() {
  if (!this.lastTransactionDate) return null;
  const now = new Date();
  const diffTime = now - this.lastTransactionDate;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

walletSchema.virtual('isLowBalance').get(function() {
  return this.balance < this.notifications.threshold;
});

walletSchema.virtual('withdrawalCapacity').get(function() {
  return Math.min(this.availableBalance, this.limits.dailyWithdrawal);
});

// Instance methods
walletSchema.methods.credit = async function(amount, description = 'Credit') {
  if (amount <= 0) throw new Error('Credit amount must be positive');
  
  const newBalance = this.balance + amount;
  if (newBalance > this.limits.maxBalance) {
    throw new Error('Transaction would exceed maximum balance limit');
  }
  
  this.balance = newBalance;
  this.totalEarned += amount;
  this.totalTransactions += 1;
  this.lastCreditDate = new Date();
  this.lastTransactionDate = new Date();
  this.availableBalance = this.balance - this.pendingDebits;
  
  return this.save();
};

walletSchema.methods.debit = async function(amount, description = 'Debit') {
  if (amount <= 0) throw new Error('Debit amount must be positive');
  if (amount > this.availableBalance) throw new Error('Insufficient balance');
  
  this.balance -= amount;
  this.totalWithdrawn += amount;
  this.totalTransactions += 1;
  this.lastDebitDate = new Date();
  this.lastTransactionDate = new Date();
  this.availableBalance = this.balance - this.pendingDebits;
  
  return this.save();
};

walletSchema.methods.addPendingCredit = async function(amount) {
  if (amount <= 0) throw new Error('Pending credit amount must be positive');
  
  this.pendingCredits += amount;
  return this.save();
};

walletSchema.methods.addPendingDebit = async function(amount) {
  if (amount <= 0) throw new Error('Pending debit amount must be positive');
  if (amount > this.availableBalance) throw new Error('Insufficient available balance');
  
  this.pendingDebits += amount;
  this.availableBalance = this.balance - this.pendingDebits;
  return this.save();
};

walletSchema.methods.confirmPendingCredit = async function(amount) {
  if (amount > this.pendingCredits) throw new Error('Amount exceeds pending credits');
  
  this.pendingCredits -= amount;
  await this.credit(amount, 'Confirmed pending credit');
  return this.save();
};

walletSchema.methods.confirmPendingDebit = async function(amount) {
  if (amount > this.pendingDebits) throw new Error('Amount exceeds pending debits');
  
  this.pendingDebits -= amount;
  this.availableBalance = this.balance - this.pendingDebits;
  return this.save();
};

walletSchema.methods.freeze = async function(reason) {
  this.status = 'frozen';
  if (reason) {
    this.notes = this.notes ? `${this.notes}\nFrozen: ${reason}` : `Frozen: ${reason}`;
  }
  return this.save();
};

walletSchema.methods.unfreeze = async function() {
  this.status = 'active';
  return this.save();
};

walletSchema.methods.suspend = async function(reason) {
  this.status = 'suspended';
  if (reason) {
    this.notes = this.notes ? `${this.notes}\nSuspended: ${reason}` : `Suspended: ${reason}`;
  }
  return this.save();
};

walletSchema.methods.activate = async function() {
  this.status = 'active';
  return this.save();
};

walletSchema.methods.setPin = async function(pin) {
  if (!/^\d{4,6}$/.test(pin)) throw new Error('PIN must be 4-6 digits');
  
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  this.pin = await bcrypt.hash(pin, salt);
  this.pinAttempts = 0;
  this.pinLockedUntil = null;
  return this.save();
};

walletSchema.methods.verifyPin = async function(pin) {
  if (this.isPinLocked) throw new Error('PIN is locked due to multiple failed attempts');
  
  const bcrypt = require('bcryptjs');
  const isValid = await bcrypt.compare(pin, this.pin);
  
  if (!isValid) {
    this.pinAttempts += 1;
    if (this.pinAttempts >= 5) {
      this.pinLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }
    await this.save();
    throw new Error('Invalid PIN');
  }
  
  this.pinAttempts = 0;
  this.pinLockedUntil = null;
  await this.save();
  return true;
};

walletSchema.methods.flag = async function(reason) {
  this.isFlagged = true;
  this.flagReason = reason;
  return this.save();
};

walletSchema.methods.unflag = async function() {
  this.isFlagged = false;
  this.flagReason = null;
  return this.save();
};

walletSchema.methods.reconcile = async function() {
  // This would typically involve comparing with transaction records
  const WalletTransaction = require('./walletTransaction');
  
  const stats = await WalletTransaction.aggregate([
    { $match: { userId: this.userId, status: 'successful' } },
    {
      $group: {
        _id: null,
        totalInflow: { $sum: { $cond: ['$isInflow', '$amount', 0] } },
        totalOutflow: { $sum: { $cond: ['$isInflow', 0, '$amount'] } }
      }
    }
  ]);
  
  const calculatedBalance = stats[0] ? stats[0].totalInflow - stats[0].totalOutflow : 0;
  
  this.reconciledBalance = calculatedBalance;
  this.lastReconciled = new Date();
  
  // Flag if there's a discrepancy
  if (Math.abs(this.balance - calculatedBalance) > 0.01) {
    await this.flag(`Balance discrepancy: Expected ${calculatedBalance}, Actual ${this.balance}`);
  }
  
  return this.save();
};

walletSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.status = 'closed';
  return this.save();
};

walletSchema.methods.canWithdrawAmount = function(amount) {
  return {
    canWithdraw: this.canWithdraw && amount <= this.withdrawalCapacity,
    availableAmount: this.withdrawalCapacity,
    reason: !this.canWithdraw ? 'Wallet not available for withdrawal' : 
            amount > this.withdrawalCapacity ? 'Amount exceeds withdrawal capacity' : null
  };
};

// Static methods
walletSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId, isDeleted: false });
};

walletSchema.statics.createForUser = async function(userId, options = {}) {
  const existingWallet = await this.findByUserId(userId);
  if (existingWallet) throw new Error('Wallet already exists for this user');
  
  const wallet = new this({
    userId,
    currency: options.currency || 'INR',
    createdBy: options.createdBy || null,
    ...options
  });
  
  return wallet.save();
};

walletSchema.statics.findActiveWallets = function() {
  return this.find({ status: 'active', isDeleted: false });
};

walletSchema.statics.findFlaggedWallets = function() {
  return this.find({ isFlagged: true, isDeleted: false }).populate('userId', 'name email');
};

walletSchema.statics.findWalletsNeedingReconciliation = function() {
  const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
  
  return this.find({
    $or: [
      { lastReconciled: { $lt: cutoffDate } },
      { lastReconciled: null }
    ],
    autoReconcile: true,
    isDeleted: false
  });
};

walletSchema.statics.getWalletStats = function(period = '30d') {
  const now = new Date();
  let startDate;
  
  switch (period) {
    case '7d':
      startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
  }
  
  return this.aggregate([
    { $match: { createdAt: { $gte: startDate }, isDeleted: false } },
    {
      $group: {
        _id: null,
        totalWallets: { $sum: 1 },
        totalBalance: { $sum: '$balance' },
        avgBalance: { $avg: '$balance' },
        activeWallets: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        frozenWallets: { $sum: { $cond: [{ $eq: ['$status', 'frozen'] }, 1, 0] } },
        flaggedWallets: { $sum: { $cond: ['$isFlagged', 1, 0] } },
        totalEarned: { $sum: '$totalEarned' },
        totalWithdrawn: { $sum: '$totalWithdrawn' },
        totalTransactions: { $sum: '$totalTransactions' }
      }
    }
  ]);
};

walletSchema.statics.findLowBalanceWallets = function(threshold = 100) {
  return this.find({
    balance: { $lt: threshold },
    status: 'active',
    isDeleted: false
  }).populate('userId', 'name email');
};

walletSchema.statics.findInactiveWallets = function(daysSinceLastTransaction = 30) {
  const cutoffDate = new Date(Date.now() - daysSinceLastTransaction * 24 * 60 * 60 * 1000);
  
  return this.find({
    $or: [
      { lastTransactionDate: { $lt: cutoffDate } },
      { lastTransactionDate: null }
    ],
    status: 'active',
    isDeleted: false
  }).populate('userId', 'name email');
};

// Middleware
walletSchema.pre('save', function(next) {
  // Update available balance
  this.availableBalance = this.balance - this.pendingDebits;
  
  // Ensure balance constraints
  if (this.balance < 0) {
    return next(new Error('Balance cannot be negative'));
  }
  
  if (this.balance > this.limits.maxBalance) {
    return next(new Error('Balance exceeds maximum limit'));
  }
  
  next();
});

// Pre-find middleware to exclude soft-deleted documents by default
walletSchema.pre(/^find/, function(next) {
  if (!this.getQuery().isDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

// Error handling middleware
walletSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('Wallet already exists for this user'));
  } else if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    next(new Error(errors.join(', ')));
  } else {
    next(error);
  }
});

module.exports = model("Wallet", walletSchema);
