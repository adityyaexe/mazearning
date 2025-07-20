// backend/models/wallet_transaction.js
const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
      max: [1000000, 'Amount cannot exceed 1,000,000'],
      get: function(value) {
        return Math.round(value * 100) / 100; // Round to 2 decimal places
      },
      set: function(value) {
        return Math.round(value * 100) / 100;
      }
    },
    
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, 'User ID is required'],
      index: true
    },
    
    isInflow: {
      type: Boolean,
      required: [true, 'Transaction direction (inflow/outflow) is required'],
      default: true
    },
    
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: [
          'internal',
          'razorpay',
          'paytm',
          'phonepe',
          'googlepay',
          'upi',
          'netbanking',
          'credit_card',
          'debit_card',
          'wallet',
          'bank_transfer',
          'cash',
          'admin_adjustment',
          'referral_bonus',
          'task_reward',
          'cashback',
          'refund',
          'withdrawal',
          'admin_bulk_adjustment',
          'admin_bulk_reset'
        ],
        message: 'Invalid payment method'
      },
      default: "internal",
      index: true
    },
    
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      enum: {
        values: ["INR", "USD", "EUR", "GBP"],
        message: 'Currency must be one of: INR, USD, EUR, GBP'
      },
      default: "INR",
      uppercase: true,
      index: true
    },
    
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ["successful", "pending", "failed", "cancelled", "refunded"],
        message: 'Status must be one of: successful, pending, failed, cancelled, refunded'
      },
      default: "pending",
      index: true
    },
    
    // Transaction details
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: ''
    },
    
    category: {
      type: String,
      enum: {
        values: [
          'earning',
          'withdrawal',
          'refund',
          'bonus',
          'penalty',
          'adjustment',
          'transfer',
          'purchase',
          'reward',
          'cashback',
          'referral'
        ],
        message: 'Invalid transaction category'
      },
      default: 'earning',
      index: true
    },
    
    // External reference tracking
    transactionId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Allows null values but ensures uniqueness when present
      maxlength: [100, 'Transaction ID cannot exceed 100 characters'],
      index: true
    },
    
    externalTransactionId: {
      type: String,
      trim: true,
      maxlength: [200, 'External transaction ID cannot exceed 200 characters'],
      default: null
    },
    
    // Gateway response and metadata
    gatewayResponse: {
      type: Object,
      default: null
    },
    
    metadata: {
      type: Map,
      of: String,
      default: new Map()
    },
    
    // Balance tracking
    balanceBefore: {
      type: Number,
      default: 0,
      min: [0, 'Balance before cannot be negative']
    },
    
    balanceAfter: {
      type: Number,
      default: 0,
      min: [0, 'Balance after cannot be negative']
    },
    
    // Processing timestamps
    processedAt: {
      type: Date,
      default: null,
      index: true
    },
    
    completedAt: {
      type: Date,
      default: null
    },
    
    failedAt: {
      type: Date,
      default: null
    },
    
    // Related transaction references
    parentTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WalletTransaction",
      default: null
    },
    
    relatedTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WalletTransaction",
      default: null
    },
    
    // Fee and tax information
    fee: {
      type: Number,
      default: 0,
      min: [0, 'Fee cannot be negative']
    },
    
    tax: {
      type: Number,
      default: 0,
      min: [0, 'Tax cannot be negative']
    },
    
    netAmount: {
      type: Number,
      default: 0,
      min: [0, 'Net amount cannot be negative']
    },
    
    // Admin tracking
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
    },
    
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
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
    
    // Flagging for suspicious transactions
    isFlagged: {
      type: Boolean,
      default: false,
      index: true
    },
    
    flagReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Flag reason cannot exceed 500 characters']
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true }
  }
);

// Indexes for performance
walletTransactionSchema.index({ userId: 1, createdAt: -1 }); // Compound index for user transactions
walletTransactionSchema.index({ status: 1, createdAt: -1 }); // For status-based queries
walletTransactionSchema.index({ paymentMethod: 1, status: 1 }); // For payment method filtering
walletTransactionSchema.index({ currency: 1, amount: -1 }); // For currency and amount queries
walletTransactionSchema.index({ category: 1, createdAt: -1 }); // For category filtering
walletTransactionSchema.index({ processedAt: -1 }); // For processing time queries
walletTransactionSchema.index({ isInflow: 1, status: 1 }); // For inflow/outflow filtering
walletTransactionSchema.index({ isFlagged: 1 }); // For flagged transactions

// Virtual fields
walletTransactionSchema.virtual('formattedAmount').get(function() {
  return `${this.currency} ${this.amount.toFixed(2)}`;
});

walletTransactionSchema.virtual('transactionType').get(function() {
  return this.isInflow ? 'Credit' : 'Debit';
});

walletTransactionSchema.virtual('isComplete').get(function() {
  return ['successful', 'failed', 'cancelled', 'refunded'].includes(this.status);
});

walletTransactionSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

walletTransactionSchema.virtual('isSuccessful').get(function() {
  return this.status === 'successful';
});

walletTransactionSchema.virtual('processingTime').get(function() {
  if (!this.processedAt) return null;
  return this.processedAt.getTime() - this.createdAt.getTime();
});

walletTransactionSchema.virtual('totalAmount').get(function() {
  return this.amount + this.fee + this.tax;
});

walletTransactionSchema.virtual('effectiveAmount').get(function() {
  return this.netAmount || (this.amount - this.fee - this.tax);
});

walletTransactionSchema.virtual('balanceImpact').get(function() {
  return this.isInflow ? this.effectiveAmount : -this.effectiveAmount;
});

walletTransactionSchema.virtual('daysSinceCreated').get(function() {
  const now = new Date();
  const diffTime = now - this.createdAt;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Instance methods
walletTransactionSchema.methods.markAsProcessed = function() {
  this.processedAt = new Date();
  if (this.status === 'pending') {
    this.status = 'successful';
  }
  return this.save();
};

walletTransactionSchema.methods.markAsSuccessful = function() {
  this.status = 'successful';
  this.completedAt = new Date();
  if (!this.processedAt) {
    this.processedAt = new Date();
  }
  return this.save();
};

walletTransactionSchema.methods.markAsFailed = function(reason) {
  this.status = 'failed';
  this.failedAt = new Date();
  this.completedAt = new Date();
  if (reason) {
    this.adminNotes = this.adminNotes ? 
      `${this.adminNotes}\nFailed: ${reason}` : 
      `Failed: ${reason}`;
  }
  return this.save();
};

walletTransactionSchema.methods.markAsCancelled = function(reason) {
  this.status = 'cancelled';
  this.completedAt = new Date();
  if (reason) {
    this.adminNotes = this.adminNotes ? 
      `${this.adminNotes}\nCancelled: ${reason}` : 
      `Cancelled: ${reason}`;
  }
  return this.save();
};

walletTransactionSchema.methods.flag = function(reason) {
  this.isFlagged = true;
  this.flagReason = reason;
  return this.save();
};

walletTransactionSchema.methods.unflag = function() {
  this.isFlagged = false;
  this.flagReason = null;
  return this.save();
};

walletTransactionSchema.methods.addNote = function(note) {
  this.adminNotes = this.adminNotes ? 
    `${this.adminNotes}\n${note}` : 
    note;
  return this.save();
};

walletTransactionSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

walletTransactionSchema.methods.createRefund = function(refundAmount, reason) {
  if (this.status !== 'successful') {
    throw new Error('Can only refund successful transactions');
  }
  
  const refundData = {
    amount: refundAmount || this.amount,
    userId: this.userId,
    isInflow: !this.isInflow, // Opposite direction
    paymentMethod: 'refund',
    currency: this.currency,
    status: 'successful',
    description: `Refund for transaction ${this.transactionId || this._id}`,
    category: 'refund',
    parentTransactionId: this._id,
    adminNotes: reason || 'Transaction refund'
  };
  
  return new this.constructor(refundData);
};

// Static methods
walletTransactionSchema.statics.findByUserId = function(userId, options = {}) {
  const query = { userId, isDeleted: false };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.category) {
    query.category = options.category;
  }
  
  if (options.paymentMethod) {
    query.paymentMethod = options.paymentMethod;
  }
  
  if (options.isInflow !== undefined) {
    query.isInflow = options.isInflow;
  }
  
  if (options.fromDate) {
    query.createdAt = { $gte: options.fromDate };
  }
  
  if (options.toDate) {
    query.createdAt = { ...query.createdAt, $lte: options.toDate };
  }
  
  return this.find(query)
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

walletTransactionSchema.statics.getTransactionStats = function(userId = null, period = '30d') {
  const match = { isDeleted: false };
  
  if (userId) {
    match.userId = new mongoose.Types.ObjectId(userId);
  }
  
  // Add date filter based on period
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
    case '1y':
      startDate = new Date(now - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
  }
  
  match.createdAt = { $gte: startDate };
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalInflow: {
          $sum: { $cond: ['$isInflow', '$amount', 0] }
        },
        totalOutflow: {
          $sum: { $cond: ['$isInflow', 0, '$amount'] }
        },
        avgAmount: { $avg: '$amount' },
        successfulTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'successful'] }, 1, 0] }
        },
        pendingTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        failedTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        totalFees: { $sum: '$fee' },
        totalTax: { $sum: '$tax' },
        flaggedTransactions: {
          $sum: { $cond: ['$isFlagged', 1, 0] }
        }
      }
    }
  ]);
};

walletTransactionSchema.statics.findPendingTransactions = function(olderThanMinutes = 30) {
  const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);
  
  return this.find({
    status: 'pending',
    createdAt: { $lt: cutoffTime },
    isDeleted: false
  }).populate('userId', 'name email');
};

walletTransactionSchema.statics.findFlaggedTransactions = function() {
  return this.find({
    isFlagged: true,
    isDeleted: false
  }).populate('userId', 'name email');
};

walletTransactionSchema.statics.findLargeTransactions = function(threshold = 10000) {
  return this.find({
    amount: { $gte: threshold },
    isDeleted: false
  }).populate('userId', 'name email');
};

walletTransactionSchema.statics.getDailyTransactionSummary = function(date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        isDeleted: false
      }
    },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalInflow: {
          $sum: { $cond: ['$isInflow', '$amount', 0] }
        },
        totalOutflow: {
          $sum: { $cond: ['$isInflow', 0, '$amount'] }
        },
        successfulCount: {
          $sum: { $cond: [{ $eq: ['$status', 'successful'] }, 1, 0] }
        },
        pendingCount: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        failedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        }
      }
    }
  ]);
};

// Middleware
walletTransactionSchema.pre('save', function(next) {
  // Generate transaction ID if not provided
  if (!this.transactionId && this.isNew) {
    this.transactionId = `WTX-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  
  // Calculate net amount if not provided
  if (!this.netAmount) {
    this.netAmount = this.amount - this.fee - this.tax;
  }
  
  // Set processedAt when status changes from pending
  if (this.isModified('status') && this.status !== 'pending' && !this.processedAt) {
    this.processedAt = new Date();
  }
  
  // Set completedAt when transaction is complete
  if (this.isModified('status') && this.isComplete && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  // Set failedAt when transaction fails
  if (this.isModified('status') && this.status === 'failed' && !this.failedAt) {
    this.failedAt = new Date();
  }
  
  next();
});

// Pre-find middleware to exclude soft-deleted documents by default
walletTransactionSchema.pre(/^find/, function(next) {
  if (!this.getQuery().isDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

// Error handling middleware
walletTransactionSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('Transaction ID already exists'));
  } else if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    next(new Error(errors.join(', ')));
  } else {
    next(error);
  }
});

module.exports = mongoose.model("WalletTransaction", walletTransactionSchema);
