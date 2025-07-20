// backend/models/survey.js
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// --- Typescript-inspired schemas for better DX ---

/** @type {mongoose.SchemaDefinition<import('./survey').ISurvey>} */
const SurveySchema = new mongoose.Schema(
  {
    // -- Core metadata --
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reward: {
      type: Number,
      required: true,
      min: 0,
      max: 10000, // max reward points
      default: 0,
    },
    category: {
      type: String,
      enum: ['lifestyle', 'technology', 'entertainment', 'health', 'education', 'business', 'other'],
      default: 'other',
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
      default: 'draft',
      index: true,
    },
    statusReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    startDate: {
      type: Date,
      index: true,
    },
    endDate: {
      type: Date,
      index: true,
      validate: {
        validator: function (value) {
          return !this.startDate || value > this.startDate;
        },
        message: 'End date must be after start date',
      },
    },
    estimatedTime: {
      type: Number, // in minutes
      min: 1,
      max: 60,
    },
    maxResponses: {
      type: Number,
      min: 1,
      max: 100000,
    },
    targetAudience: {
      type: { /* subdocument for targeting, can be extended */ },
      select: true,
    },
    // -- Survey structure --
    questions: [
      { /* subdocument for questions, see schema below */ }
    ],
    // -- Analytics --
    totalResponses: {
      type: Number,
      default: 0,
    },
    totalCompletions: {
      type: Number,
      default: 0,
    },
    // -- Audit & system fields --
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    isTemplate: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
  }
);

// --- Question subdocument schema ---

/** @typedef {import('./survey').IQuestion} IQuestion */
const QuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: ['multiple_choice', 'single_choice', 'text', 'rating', 'boolean', 'date'],
      required: true,
    },
    required: {
      type: Boolean,
      default: false,
    },
    helpText: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    minLength: { /* For text fields */ type: Number, min: 0 },
    maxLength: { /* For text fields */ type: Number, min: 1 },
    minValue: { /* For numeric/rating fields */ type: Number },
    maxValue: { /* For numeric/rating fields */ type: Number },
    options: [{ /* For single/multiple choice */ value: String, label: String }],
    pattern: { /* For validation */ type: String },
  },
  { _id: true }
);

SurveySchema.path('questions', [QuestionSchema]);

// --- Indexes for fast querying ---
SurveySchema.index({ status: 1, category: 1, reward: 1, startDate: 1, endDate: 1 });

// --- Static methods for analytics ---

/**
 * @typedef {mongoose.Document} SurveyDoc
 * @property {string} title
 * @property {string} status
 * @property {number} totalResponses
 */

/**
 * Get global survey statistics (admin dashboard)
 * @returns {Promise<{total: number, active: number, draft: number, paused: number, cancelled: number, completed: number}>}
 */
SurveySchema.statics.getGlobalStats = async function () {
  const result = await this.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const stats = { total: 0, active: 0, draft: 0, paused: 0, cancelled: 0, completed: 0 };
  result.forEach(({ _id, count }) => {
    stats[_id] = count;
    stats.total += count;
  });
  return stats;
};

// --- Virtuals (computed fields) ---

SurveySchema.virtual('isActive').get(function () {
  const now = new Date();
  return (
    this.status === 'active' &&
    (!this.startDate || this.startDate <= now) &&
    (!this.endDate || this.endDate >= now)
  );
});

// --- Export model ---
const Survey = mongoose.model('Survey', SurveySchema);
module.exports = Survey;
