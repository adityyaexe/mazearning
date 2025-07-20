// backend/models/user.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false
    },
    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid phone number']
    },
    total_points: { type: Number, default: 0, min: [0, 'Total points cannot be negative'] },
    status: { type: String, enum: ['active', 'suspended', 'deleted'], default: 'active', index: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    kyc_verified: { type: Boolean, default: false }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true }
  }
);

// Instance method to set password (use in password reset flow)
userSchema.methods.setPassword = async function (plainPassword) {
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(plainPassword, salt);
  await this.save();
};

// Instance method to compare password (use in login controller)
userSchema.methods.comparePassword = async function (plainPassword) {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// Never expose passwordHash in API responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

// Optional: Virtual for display name (use in frontend)
userSchema.virtual('displayName').get(function () {
  return this.name;
});

// Indexes for fast queries
userSchema.index({ email: 1 });
userSchema.index({ status: 1, role: 1 });

module.exports = mongoose.model('User', userSchema);
