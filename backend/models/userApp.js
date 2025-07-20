// backend/modela/userApp.js
const mongoose = require('mongoose');

const userAppSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    
    app_id: {
      type: String,
      required: [true, 'App ID is required'],
      trim: true,
      maxlength: [100, 'App ID cannot exceed 100 characters'],
      index: true
    },
    
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive', 'pending', 'deleted', 'suspended', 'completed'],
        message: 'Status must be one of: active, inactive, pending, deleted, suspended, completed'
      },
      default: 'active',
      index: true
    },
    
    // App interaction tracking
    downloads: {
      type: Number,
      default: 0,
      min: [0, 'Downloads cannot be negative']
    },
    
    installs: {
      type: Number,
      default: 0,
      min: [0, 'Installs cannot be negative']
    },
    
    opens: {
      type: Number,
      default: 0,
      min: [0, 'Opens cannot be negative']
    },
    
    usageTime: {
      type: Number, // in minutes
      default: 0,
      min: [0, 'Usage time cannot be negative']
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
    
    // App details
    appDetails: {
      name: {
        type: String,
        trim: true,
        maxlength: [200, 'App name cannot exceed 200 characters']
      },
      category: {
        type: String,
        trim: true,
        maxlength: [100, 'Category cannot exceed 100 characters']
      },
      version: {
        type: String,
        trim: true,
        maxlength: [50, 'Version cannot exceed 50 characters']
      },
      packageName: {
        type: String,
        trim: true,
        maxlength: [200, 'Package name cannot exceed 200 characters']
      },
      rating: {
        type: Number,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5'],
        default: null
      },
      size: {
        type: Number, // in MB
        min: [0, 'Size cannot be negative'],
        default: null
      }
    },
    
    // Task and reward tracking
    tasks: [{
      taskId: {
        type: String,
        required: true
      },
      description: {
        type: String,
        maxlength: [500, 'Task description cannot exceed 500 characters']
      },
      reward: {
        type: Number,
        min: [0, 'Reward cannot be negative'],
        default: 0
      },
      completed: {
        type: Boolean,
        default: false
      },
      completedAt: {
        type: Date,
        default: null
      },
      dueDate: {
        type: Date,
        default: null
      }
    }],
    
    // Installation tracking
    installDate: {
      type: Date,
      default: null
    },
    
    lastOpenedAt: {
      type: Date,
      default: null
    },
    
    uninstallDate: {
      type: Date,
      default: null
    },
    
    // Requirements and constraints
    requirements: {
      minAndroidVersion: {
        type: String,
        default: null
      },
      minIOSVersion: {
        type: String,
        default: null
      },
      minRAM: {
        type: Number, // in MB
        default: null
      },
      internetRequired: {
        type: Boolean,
        default: true
      }
    },
    
    // Performance tracking
    crashCount: {
      type: Number,
      default: 0,
      min: [0, 'Crash count cannot be negative']
    },
    
    performanceScore: {
      type: Number,
      min: [0, 'Performance score cannot be negative'],
      max: [100, 'Performance score cannot exceed 100'],
      default: null
    },
    
    // Device information
    deviceInfo: {
      platform: {
        type: String,
        enum: ['android', 'ios', 'web'],
        default: 'android'
      },
      deviceModel: {
        type: String,
        default: null
      },
      osVersion: {
        type: String,
        default: null
      }
    },
    
    // Admin tracking
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters']
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
userAppSchema.index({ user_id: 1, createdAt: -1 }); // Compound index for user apps
userAppSchema.index({ status: 1, createdAt: -1 }); // For status-based queries
userAppSchema.index({ app_id: 1, status: 1 }); // For app-specific queries
userAppSchema.index({ 'appDetails.category': 1 }); // For category filtering
userAppSchema.index({ earnings: -1 }); // For earnings-based sorting
userAppSchema.index({ installDate: -1 }); // For install date queries
userAppSchema.index({ lastOpenedAt: -1 }); // For activity tracking

// Virtual fields
userAppSchema.virtual('isInstalled').get(function() {
  return this.installs > 0 && !this.uninstallDate;
});

userAppSchema.virtual('isActive').get(function() {
  return this.status === 'active' && this.isInstalled;
});

userAppSchema.virtual('daysSinceInstall').get(function() {
  if (!this.installDate) return null;
  const now = new Date();
  const diffTime = now - this.installDate;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

userAppSchema.virtual('daysSinceLastOpen').get(function() {
  if (!this.lastOpenedAt) return null;
  const now = new Date();
  const diffTime = now - this.lastOpenedAt;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

userAppSchema.virtual('totalInteractions').get(function() {
  return this.downloads + this.installs + this.opens;
});

userAppSchema.virtual('engagementRate').get(function() {
  if (this.installs === 0) return 0;
  return this.opens / this.installs;
});

userAppSchema.virtual('averageSessionTime').get(function() {
  if (this.opens === 0) return 0;
  return this.usageTime / this.opens;
});

userAppSchema.virtual('completedTasks').get(function() {
  return this.tasks.filter(task => task.completed);
});

userAppSchema.virtual('pendingTasks').get(function() {
  return this.tasks.filter(task => !task.completed);
});

userAppSchema.virtual('totalTaskRewards').get(function() {
  return this.tasks.reduce((total, task) => total + (task.completed ? task.reward : 0), 0);
});

userAppSchema.virtual('retentionRate').get(function() {
  if (!this.installDate || this.daysSinceInstall === 0) return 0;
  const expectedOpens = this.daysSinceInstall;
  return Math.min(this.opens / expectedOpens, 1);
});

// Instance methods
userAppSchema.methods.recordDownload = function() {
  this.downloads += 1;
  return this.save();
};

userAppSchema.methods.recordInstall = function() {
  this.installs += 1;
  this.installDate = new Date();
  if (this.status === 'pending') {
    this.status = 'active';
  }
  return this.save();
};

userAppSchema.methods.recordOpen = function(sessionTime = 0) {
  this.opens += 1;
  this.lastOpenedAt = new Date();
  if (sessionTime > 0) {
    this.usageTime += sessionTime;
  }
  return this.save();
};

userAppSchema.methods.recordUninstall = function() {
  this.uninstallDate = new Date();
  this.status = 'inactive';
  return this.save();
};

userAppSchema.methods.recordCrash = function() {
  this.crashCount += 1;
  return this.save();
};

userAppSchema.methods.addTask = function(taskData) {
  this.tasks.push({
    taskId: taskData.taskId,
    description: taskData.description,
    reward: taskData.reward || 0,
    dueDate: taskData.dueDate || null
  });
  return this.save();
};

userAppSchema.methods.completeTask = function(taskId) {
  const task = this.tasks.find(t => t.taskId === taskId);
  if (task && !task.completed) {
    task.completed = true;
    task.completedAt = new Date();
    this.earnings += task.reward;
    return this.save();
  }
  return Promise.resolve(this);
};

userAppSchema.methods.suspend = function(reason) {
  this.status = 'suspended';
  if (reason) {
    this.notes = this.notes ? `${this.notes}\nSuspended: ${reason}` : `Suspended: ${reason}`;
  }
  return this.save();
};

userAppSchema.methods.activate = function() {
  if (this.status === 'suspended' || this.status === 'inactive') {
    this.status = 'active';
  }
  return this.save();
};

userAppSchema.methods.complete = function(reason) {
  this.status = 'completed';
  if (reason) {
    this.notes = this.notes ? `${this.notes}\nCompleted: ${reason}` : `Completed: ${reason}`;
  }
  return this.save();
};

userAppSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.status = 'deleted';
  return this.save();
};

userAppSchema.methods.updateEarnings = function(amount) {
  this.earnings += amount;
  return this.save();
};

userAppSchema.methods.calculatePerformanceScore = function() {
  let score = 0;
  
  // Base score from engagement
  score += this.engagementRate * 30;
  
  // Bonus for retention
  score += this.retentionRate * 25;
  
  // Penalty for crashes
  const crashPenalty = Math.min(this.crashCount * 5, 20);
  score -= crashPenalty;
  
  // Bonus for task completion
  const taskCompletionRate = this.tasks.length > 0 ? 
    this.completedTasks.length / this.tasks.length : 0;
  score += taskCompletionRate * 20;
  
  // Bonus for recent activity
  if (this.daysSinceLastOpen <= 1) score += 5;
  
  this.performanceScore = Math.max(0, Math.min(100, score));
  return this.save();
};

// Static methods
userAppSchema.statics.findByUserId = function(userId, options = {}) {
  const query = { user_id: userId, isDeleted: false };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.category) {
    query['appDetails.category'] = options.category;
  }
  
  if (options.installed) {
    query.installs = { $gt: 0 };
    query.uninstallDate = { $exists: false };
  }
  
  return this.find(query)
    .populate('user_id', 'name email')
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

userAppSchema.statics.findActiveApps = function(userId = null) {
  const query = { 
    status: 'active',
    isDeleted: false,
    installs: { $gt: 0 }
  };
  
  if (userId) {
    query.user_id = userId;
  }
  
  return this.find(query).populate('user_id', 'name email');
};

userAppSchema.statics.getUserAppStats = function(userId, period = '30d') {
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
        totalApps: { $sum: 1 },
        totalDownloads: { $sum: '$downloads' },
        totalInstalls: { $sum: '$installs' },
        totalOpens: { $sum: '$opens' },
        totalUsageTime: { $sum: '$usageTime' },
        totalEarnings: { $sum: '$earnings' },
        avgPerformanceScore: { $avg: '$performanceScore' },
        activeApps: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        completedApps: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        totalCrashes: { $sum: '$crashCount' }
      }
    }
  ]);
};

userAppSchema.statics.findStaleApps = function(daysSinceLastOpen = 30) {
  const cutoffDate = new Date(Date.now() - daysSinceLastOpen * 24 * 60 * 60 * 1000);
  
  return this.find({
    status: 'active',
    lastOpenedAt: { $lt: cutoffDate },
    isDeleted: false
  }).populate('user_id', 'name email');
};

userAppSchema.statics.getTopPerformingApps = function(limit = 10) {
  return this.find({ 
    status: 'active', 
    isDeleted: false,
    performanceScore: { $gt: 0 }
  })
  .populate('user_id', 'name email')
  .sort({ performanceScore: -1, earnings: -1 })
  .limit(limit);
};

userAppSchema.statics.findAppsWithPendingTasks = function(userId = null) {
  const query = { 
    'tasks.completed': false,
    status: 'active',
    isDeleted: false
  };
  
  if (userId) {
    query.user_id = userId;
  }
  
  return this.find(query).populate('user_id', 'name email');
};

// Middleware
userAppSchema.pre('save', function(next) {
  // Update performance score if interaction metrics changed
  if (this.isModified('opens') || this.isModified('installs') || this.isModified('usageTime')) {
    this.calculatePerformanceScore();
  }
  
  // Auto-complete tasks that are past due
  if (this.tasks && this.tasks.length > 0) {
    this.tasks.forEach(task => {
      if (!task.completed && task.dueDate && task.dueDate <= new Date()) {
        task.completed = true;
        task.completedAt = new Date();
        this.earnings += task.reward;
      }
    });
  }
  
  next();
});

// Pre-find middleware to exclude soft-deleted documents by default
userAppSchema.pre(/^find/, function(next) {
  if (!this.getQuery().isDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

// Error handling middleware
userAppSchema.post('save', function(error, doc, next) {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    next(new Error(errors.join(', ')));
  } else {
    next(error);
  }
});

module.exports = mongoose.model('UserApp', userAppSchema);
