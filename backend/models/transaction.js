// backend/models/transaction.js
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true // Index for performance
    },
    
    transactionId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Allows null values but ensures uniqueness when present
      maxlength: [100, "Transaction ID cannot exceed 100 characters"]
    },
    
    name: {
      type: String,
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"]
    },
    
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
      maxlength: [100, "Email cannot exceed 100 characters"]
    },
    
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
      max: [1000000, "Amount cannot exceed 1,000,000"],
      get: function(value) {
        return Math.round(value * 100) / 100; // Round to 2 decimal places
      },
      set: function(value) {
        return Math.round(value * 100) / 100; // Round to 2 decimal places
      }
    },
    
    currency: {
      type: String,
      required: [true, "Currency is required"],
      enum: {
        values: ["INR", "USD"],
        message: "Currency must be either INR or USD"
      },
      default: "INR",
      uppercase: true
    },
    
    paymentStatus: {
      type: String,
      enum: {
        values: ["successful", "pending", "failed", "cancelled", "refunded"],
        message: "Payment status must be one of: successful, pending, failed, cancelled, refunded"
      },
      default: "pending",
      index: true // Index for performance
    },
    
    paymentGateway: {
      type: String,
      default: "internal",
      trim: true,
      maxlength: [50, "Payment gateway name cannot exceed 50 characters"]
    },
    
    // Additional useful fields
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"]
    },
    
    metadata: {
      type: Map,
      of: String,
      default: new Map()
    },
    
    // For tracking refunds
    refundAmount: {
      type: Number,
      default: 0,
      min: [0, "Refund amount cannot be negative"],
      validate: {
        validator: function(value) {
          return value <= this.amount;
        },
        message: "Refund amount cannot exceed transaction amount"
      }
    },
    
    // For tracking the original transaction in case of refund
    originalTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      default: null
    },
    
    // Payment processing details
    gatewayTransactionId: {
      type: String,
      trim: true,
      maxlength: [200, "Gateway transaction ID cannot exceed 200 characters"]
    },
    
    gatewayResponse: {
      type: Object,
      default: null
    },
    
    // Timestamps for different stages
    processedAt: {
      type: Date,
      default: null
    },
    
    completedAt: {
      type: Date,
      default: null
    },
    
    // For admin tracking
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"]
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
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true }
  }
);

// Indexes for performance
transactionSchema.index({ userId: 1, createdAt: -1 }); // Compound index for user transactions
transactionSchema.index({ paymentStatus: 1, createdAt: -1 }); // For status-based queries
transactionSchema.index({ amount: 1 }); // For amount-based queries
transactionSchema.index({ currency: 1, paymentStatus: 1 }); // For currency and status filtering
transactionSchema.index({ createdAt: -1 }); // For date-based sorting
transactionSchema.index({ transactionId: 1 }, { sparse: true }); // For external transaction ID lookup

// Virtual fields
transactionSchema.virtual('isRefundable').get(function() {
  return this.paymentStatus === 'successful' && this.refundAmount < this.amount;
});

transactionSchema.virtual('remainingRefundAmount').get(function() {
  return this.amount - this.refundAmount;
});

transactionSchema.virtual('isComplete').get(function() {
  return ['successful', 'failed', 'cancelled', 'refunded'].includes(this.paymentStatus);
});

transactionSchema.virtual('formattedAmount').get(function() {
  return `${this.currency} ${this.amount.toFixed(2)}`;
});

transactionSchema.virtual('processingTime').get(function() {
  if (!this.processedAt) return null;
  return this.processedAt.getTime() - this.createdAt.getTime();
});

// Instance methods
transactionSchema.methods.markAsProcessed = function() {
  this.processedAt = new Date();
  return this.save();
};

transactionSchema.methods.markAsCompleted = function() {
  this.completedAt = new Date();
  if (this.paymentStatus === 'pending') {
    this.paymentStatus = 'successful';
  }
  return this.save();
};

transactionSchema.methods.markAsFailed = function(reason) {
  this.paymentStatus = 'failed';
  this.completedAt = new Date();
  if (reason) {
    this.notes = reason;
  }
  return this.save();
};

transactionSchema.methods.markAsCancelled = function(reason) {
  this.paymentStatus = 'cancelled';
  this.completedAt = new Date();
  if (reason) {
    this.notes = reason;
  }
  return this.save();
};

transactionSchema.methods.processRefund = function(refundAmount, reason) {
  if (this.paymentStatus !== 'successful') {
    throw new Error('Can only refund successful transactions');
  }
  
  if (refundAmount > this.remainingRefundAmount) {
    throw new Error('Refund amount exceeds remaining refundable amount');
  }
  
  this.refundAmount += refundAmount;
  
  if (this.refundAmount >= this.amount) {
    this.paymentStatus = 'refunded';
  }
  
  if (reason) {
    this.notes = this.notes ? `${this.notes}\nRefund: ${reason}` : `Refund: ${reason}`;
  }
  
  return this.save();
};

transactionSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Static methods
transactionSchema.statics.findByUserId = function(userId, options = {}) {
  const query = { userId, isDeleted: false };
  
  if (options.status) {
    query.paymentStatus = options.status;
  }
  
  if (options.currency) {
    query.currency = options.currency;
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

transactionSchema.statics.getTransactionStats = function(userId = null, period = '30d') {
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
        avgAmount: { $avg: '$amount' },
        successfulTransactions: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'successful'] }, 1, 0] }
        },
        pendingTransactions: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0] }
        },
        failedTransactions: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'failed'] }, 1, 0] }
        },
        refundedTransactions: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'refunded'] }, 1, 0] }
        },
        totalRefunds: { $sum: '$refundAmount' }
      }
    }
  ]);
};

transactionSchema.statics.findPendingTransactions = function(olderThanMinutes = 30) {
  const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);
  
  return this.find({
    paymentStatus: 'pending',
    createdAt: { $lt: cutoffTime },
    isDeleted: false
  }).populate('userId', 'name email');
};

// Middleware
transactionSchema.pre('save', function(next) {
  // Generate transaction ID if not provided
  if (!this.transactionId && this.isNew) {
    this.transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  
  // Set processedAt when status changes from pending
  if (this.isModified('paymentStatus') && this.paymentStatus !== 'pending' && !this.processedAt) {
    this.processedAt = new Date();
  }
  
  // Set completedAt when transaction is complete
  if (this.isModified('paymentStatus') && this.isComplete && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

// Pre-find middleware to exclude soft-deleted documents by default
transactionSchema.pre(/^find/, function(next) {
  if (!this.getQuery().isDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

// Error handling middleware
transactionSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('Transaction ID already exists'));
  } else {
    next(error);
  }
});

module.exports = mongoose.model("Transaction", transactionSchema);
