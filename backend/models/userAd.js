// backed/models/userAd.js
const mongoose = require('mongoose');

const userAdSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    
    ad_id: {
      type: String,
      required: [true, 'Ad ID is required'],
      trim: true,
      maxlength: [100, 'Ad ID cannot exceed 100 characters'],
      index: true
    },
    
    status: {
      type: String,
      enum: {
        values: ['active', 'paused', 'completed', 'deleted', 'expired'],
        message: 'Status must be one of: active, paused, completed, deleted, expired'
      },
      default: 'active',
      index: true
    },
    
    // Ad interaction tracking
    views: {
      type: Number,
      default: 0,
      min: [0, 'Views cannot be negative']
    },
    
    clicks: {
      type: Number,
      default: 0,
      min: [0, 'Clicks cannot be negative']
    },
    
    conversions: {
      type: Number,
      default: 0,
      min: [0, 'Conversions cannot be negative']
    },
    
    // Earnings tracking
    earnings: {
      type: Number,
      default: 0,
      min: [0, 'Earnings cannot be negative'],
      get: function(value) {
        return Math.round(value * 100) / 100; // Round to 2 decimal places
      },
      set: function(value) {
        return Math.round(value * 100) / 100;
      }
    },
    
    // Ad campaign details
    campaign: {
      name: {
        type: String,
        trim: true,
        maxlength: [200, 'Campaign name cannot exceed 200 characters']
      },
      category: {
        type: String,
        trim: true,
        maxlength: [100, 'Category cannot exceed 100 characters']
      },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      }
    },
    
    // Scheduling
    startDate: {
      type: Date,
      default: Date.now
    },
    
    endDate: {
      type: Date,
      validate: {
        validator: function(value) {
          return !value || value > this.startDate;
        },
        message: 'End date must be after start date'
      }
    },
    
    // Targeting and constraints
    targetingCriteria: {
      type: Map,
      of: String,
      default: new Map()
    },
    
    dailyLimit: {
      type: Number,
      min: [0, 'Daily limit cannot be negative'],
      default: null
    },
    
    totalLimit: {
      type: Number,
      min: [0, 'Total limit cannot be negative'],
      default: null
    },
    
    // Performance metrics
    ctr: {
      type: Number,
      default: 0,
      min: [0, 'CTR cannot be negative'],
      max: [1, 'CTR cannot exceed 100%']
    },
    
    conversionRate: {
      type: Number,
      default: 0,
      min: [0, 'Conversion rate cannot be negative'],
      max: [1, 'Conversion rate cannot exceed 100%']
    },
    
    // Admin tracking
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    
    // Audit fields
    lastViewedAt: {
      type: Date,
      default: null
    },
    
    lastClickedAt: {
      type: Date,
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
    
    // Metadata for extensibility
    metadata: {
      type: Map,
      of: String,
      default: new Map()
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true }
  }
);

// Indexes for performance
userAdSchema.index({ user_id: 1, createdAt: -1 }); // Compound index for user ads
userAdSchema.index({ status: 1, createdAt: -1 }); // For status-based queries
userAdSchema.index({ ad_id: 1, status: 1 }); // For ad-specific queries
userAdSchema.index({ startDate: 1, endDate: 1 }); // For date range queries
userAdSchema.index({ 'campaign.category': 1 }); // For category filtering
userAdSchema.index({ earnings: -1 }); // For earnings-based sorting

// Virtual fields
userAdSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && 
         (!this.endDate || this.endDate > now) && 
         (!this.startDate || this.startDate <= now);
});

userAdSchema.virtual('isExpired').get(function() {
  return this.endDate && this.endDate <= new Date();
});

userAdSchema.virtual('daysRemaining').get(function() {
  if (!this.endDate) return null;
  const now = new Date();
  const diffTime = this.endDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

userAdSchema.virtual('totalInteractions').get(function() {
  return this.views + this.clicks + this.conversions;
});

userAdSchema.virtual('engagementRate').get(function() {
  if (this.views === 0) return 0;
  return (this.clicks + this.conversions) / this.views;
});

userAdSchema.virtual('averageEarningsPerClick').get(function() {
  if (this.clicks === 0) return 0;
  return this.earnings / this.clicks;
});

userAdSchema.virtual('performanceScore').get(function() {
  // Simple performance score based on CTR and conversion rate
  return (this.ctr * 0.6) + (this.conversionRate * 0.4);
});

// Instance methods
userAdSchema.methods.recordView = function() {
  this.views += 1;
  this.lastViewedAt = new Date();
  this.ctr = this.views > 0 ? this.clicks / this.views : 0;
  return this.save();
};

userAdSchema.methods.recordClick = function() {
  this.clicks += 1;
  this.lastClickedAt = new Date();
  this.ctr = this.views > 0 ? this.clicks / this.views : 0;
  return this.save();
};

userAdSchema.methods.recordConversion = function(earningAmount = 0) {
  this.conversions += 1;
  this.earnings += earningAmount;
  this.conversionRate = this.clicks > 0 ? this.conversions / this.clicks : 0;
  return this.save();
};

userAdSchema.methods.pause = function(reason) {
  this.status = 'paused';
  if (reason) {
    this.notes = this.notes ? `${this.notes}\nPaused: ${reason}` : `Paused: ${reason}`;
  }
  return this.save();
};

userAdSchema.methods.resume = function() {
  if (this.status === 'paused') {
    this.status = 'active';
  }
  return this.save();
};

userAdSchema.methods.complete = function(reason) {
  this.status = 'completed';
  if (reason) {
    this.notes = this.notes ? `${this.notes}\nCompleted: ${reason}` : `Completed: ${reason}`;
  }
  return this.save();
};

userAdSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.status = 'deleted';
  return this.save();
};

userAdSchema.methods.updateEarnings = function(amount) {
  this.earnings += amount;
  return this.save();
};

userAdSchema.methods.checkLimits = function() {
  const results = {
    dailyLimitReached: false,
    totalLimitReached: false
  };
  
  if (this.dailyLimit) {
    // Check daily interactions (would need additional logic for daily counting)
    results.dailyLimitReached = this.totalInteractions >= this.dailyLimit;
  }
  
  if (this.totalLimit) {
    results.totalLimitReached = this.totalInteractions >= this.totalLimit;
  }
  
  return results;
};

// Static methods
userAdSchema.statics.findByUserId = function(userId, options = {}) {
  const query = { user_id: userId, isDeleted: false };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.category) {
    query['campaign.category'] = options.category;
  }
  
  if (options.active) {
    query.status = 'active';
    const now = new Date();
    query.$or = [
      { endDate: { $exists: false } },
      { endDate: { $gt: now } }
    ];
  }
  
  return this.find(query)
    .populate('user_id', 'name email')
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

userAdSchema.statics.findActiveAds = function(userId = null) {
  const query = { 
    status: 'active',
    isDeleted: false
  };
  
  if (userId) {
    query.user_id = userId;
  }
  
  const now = new Date();
  query.$or = [
    { endDate: { $exists: false } },
    { endDate: { $gt: now } }
  ];
  
  return this.find(query).populate('user_id', 'name email');
};

userAdSchema.statics.getUserAdStats = function(userId, period = '30d') {
  const match = { user_id: new mongoose.Types.ObjectId(userId), isDeleted: false };
  
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
    default:
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
  }
  
  match.createdAt = { $gte: startDate };
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalAds: { $sum: 1 },
        totalViews: { $sum: '$views' },
        totalClicks: { $sum: '$clicks' },
        totalConversions: { $sum: '$conversions' },
        totalEarnings: { $sum: '$earnings' },
        avgCTR: { $avg: '$ctr' },
        avgConversionRate: { $avg: '$conversionRate' },
        activeAds: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        completedAds: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    }
  ]);
};

userAdSchema.statics.findExpiredAds = function() {
  const now = new Date();
  
  return this.find({
    status: { $ne: 'expired' },
    endDate: { $lt: now },
    isDeleted: false
  });
};

userAdSchema.statics.getTopPerformingAds = function(limit = 10) {
  return this.find({ 
    status: 'active', 
    isDeleted: false,
    earnings: { $gt: 0 }
  })
  .populate('user_id', 'name email')
  .sort({ earnings: -1, ctr: -1 })
  .limit(limit);
};

// Middleware
userAdSchema.pre('save', function(next) {
  // Auto-expire ads that have passed their end date
  if (this.endDate && this.endDate <= new Date() && this.status === 'active') {
    this.status = 'expired';
  }
  
  // Update performance metrics
  if (this.isModified('views') || this.isModified('clicks')) {
    this.ctr = this.views > 0 ? this.clicks / this.views : 0;
  }
  
  if (this.isModified('clicks') || this.isModified('conversions')) {
    this.conversionRate = this.clicks > 0 ? this.conversions / this.clicks : 0;
  }
  
  next();
});

// Pre-find middleware to exclude soft-deleted documents by default
userAdSchema.pre(/^find/, function(next) {
  if (!this.getQuery().isDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

// Error handling middleware
userAdSchema.post('save', function(error, doc, next) {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    next(new Error(errors.join(', ')));
  } else {
    next(error);
  }
});

module.exports = mongoose.model('UserAd', userAdSchema);
