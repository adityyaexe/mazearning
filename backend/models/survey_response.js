// backend/models/survey_response.js
const mongoose = require('mongoose');

// --- Typescript-inspired schema for responses ---

/** @type {mongoose.SchemaDefinition<import('./survey_response').ISurveyResponse>} */
const SurveyResponseSchema = new mongoose.Schema(
  {
    surveyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Survey',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
    },
    responses: [
      { /* subdocument per question answered */ }
    ],
    timeSpent: {
      type: Number, // in seconds
      min: 1,
    },
    status: {
      type: String,
      enum: ['started', 'in_progress', 'completed', 'abandoned', 'flagged', 'rejected', 'approved'],
      default: 'started',
      index: true,
    },
    deviceInfo: {
      type: { /* subdocument for user-agent, IP, etc. */ },
      select: false,
    },
    metadata: {
      type: { /* custom data */ },
      select: false,
    },
    // -- Survey quality control --
    isFlagged: {
      type: Boolean,
      default: false,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    // -- System fields --
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
  }
);

// --- Response subdocument schema ---

/** @typedef {import('./survey_response').IResponse} IResponse */
const ResponseSchema = new mongoose.Schema(
  {
    questionId: mongoose.Schema.Types.ObjectId,
    answer: mongoose.Schema.Types.Mixed, // can be String, Number, Array, Boolean, Date, etc.
    answeredAt: Date,
    skipped: Boolean,
    validationErrors: [String],
  },
  { _id: true }
);

SurveyResponseSchema.path('responses', [ResponseSchema]);

// --- Indexes for analytics ---
SurveyResponseSchema.index({ surveyId: 1, userId: 1 });
SurveyResponseSchema.index({ createdAt: -1 });

// --- Static methods ---

SurveyResponseSchema.statics.countCompletedBySurvey = function (surveyId) {
  return this.countDocuments({ surveyId, status: 'completed' });
};

// --- Pre-save hooks ---

SurveyResponseSchema.pre('save', function (next) {
  if (this.status === 'completed') {
    this.updatedAt = new Date();
  }
  next();
});

// --- Export model ---
const SurveyResponse = mongoose.model('SurveyResponse', SurveyResponseSchema);
module.exports = SurveyResponse;
