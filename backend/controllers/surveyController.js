// backend/controllers/surveyController.js
const mongoose = require('mongoose');
const Survey = require('../models/survey');
const SurveyResponse = require('../models/survey_response');
const User = require('../models/user');
// const logger = require('../config/logger'); // Uncomment if you use a logger

// --- Helper: clean survey object for API responses ---
const sanitizeSurvey = (survey) => {
  if (!survey) return survey;
  if (typeof survey.toObject === 'function') survey = survey.toObject();
  delete survey.__v;
  delete survey.updatedAt;
  // Remove sensitive/private fields
  delete survey.targetAudience?.raw;
  return survey;
};

// --- Helper: clean response object (if needed) ---
const sanitizeResponse = (resp) => {
  if (typeof resp === 'object' && resp !== null) {
    delete resp.__v;
    delete resp.updatedAt;
  }
  return resp;
};

// --- Helper: centralized "not implemented" stub ---
const notImplemented = (name = '') => (...args) =>
  args[1].status(501).json({ success: false, error: `Not implemented${name?`: ${name}`:''}` });

// ------------------------------ CORE SURVEY CRUD ------------------------------

/**
 * Get public surveys (for logged-out or generalized views)
 */
exports.getPublicSurveys = async (req, res) => {
  try {
    const {
      category, status = 'active', minReward, maxReward,
      page = 1, limit = 20
    } = req.query;
    const query = { status: 'active', ...(category ? { category } : {}) };
    if (minReward) query.reward = { ...query.reward, $gte: parseInt(minReward, 10) };
    if (maxReward) query.reward = { ...(query.reward || {}), $lte: parseInt(maxReward, 10) };
    const [surveys, total] = await Promise.all([
      Survey.find(query).sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10))
        .lean(),
      Survey.countDocuments(query)
    ]);
    res.json({
      success: true,
      surveys: surveys.map(sanitizeSurvey),
      total,
      page,
      limit
    });
  } catch (err) {
    console.error('getPublicSurveys:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching surveys' });
  }
};

/**
 * Get a single public survey (no auth required)
 */
exports.getPublicSurvey = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id)
      .populate('creatorId', 'name profileImg')
      .lean();
    if (!survey) return res.status(404).json({ success: false, error: 'Survey not found' });
    // Remove private/internal fields before returning
    delete survey.__v;
    delete survey.updatedAt;
    res.json({ success: true, survey: sanitizeSurvey(survey) });
  } catch (err) {
    console.error('getPublicSurvey:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching survey' });
  }
};

/**
 * Get surveys (works with optionalAuth middleware)
 */
exports.getSurveys = async (req, res) => {
  try {
    const {
      category, status, minReward, maxReward,
      page = 1, limit = 20
    } = req.query;
    const query = { ...(category ? { category } : {}), ...(status ? { status } : {}) };
    if (minReward) query.reward = { ...(query.reward || {}), $gte: parseInt(minReward, 10) };
    if (maxReward) query.reward = { ...(query.reward || {}), $lte: parseInt(maxReward, 10) };
    // If user is logged in, maybe add more filters for them
    if (req.user && req.user._id) {
      // If you want to restrict results for logged-in users, adjust here
      // Example: filter out surveys they've already completed
    }
    const [surveys, total] = await Promise.all([
      Survey.find(query).sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10))
        .lean(),
      Survey.countDocuments(query)
    ]);
    res.json({
      success: true,
      surveys: surveys.map(sanitizeSurvey),
      total,
      page,
      limit
    });
  } catch (err) {
    console.error('getSurveys:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching surveys' });
  }
};

/**
 * Get a single survey (works with optionalAuth middleware)
 */
exports.getSurvey = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id)
      .populate('creatorId', 'name profileImg')
      .lean();
    if (!survey) return res.status(404).json({ success: false, error: 'Survey not found' });
    res.json({ success: true, survey: sanitizeSurvey(survey) });
  } catch (err) {
    console.error('getSurvey:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching survey' });
  }
};

/**
 * Create a new survey (admin only)
 */
exports.createSurvey = async (req, res) => {
  try {
    const {
      title, description, reward, category, targetAudience,
      questions, estimatedTime, maxResponses, startDate, endDate
    } = req.body;
    // NOTE: Title/description/questions are validated by express-validator middleware
    const survey = new Survey({
      title,
      description,
      reward: parseInt(reward, 10) || 0,
      category,
      creatorId: req.user._id,
      targetAudience,
      questions,
      estimatedTime: parseInt(estimatedTime, 10) || null,
      maxResponses: parseInt(maxResponses, 10) || null,
      status: 'draft',
      ...(startDate ? { startDate: new Date(startDate) } : {}),
      ...(endDate ? { endDate: new Date(endDate) } : {})
    });
    await survey.save();
    res.status(201).json({
      success: true,
      message: 'Survey created',
      survey: sanitizeSurvey(survey)
    });
  } catch (err) {
    console.error('createSurvey:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error creating survey' });
  }
};

/**
 * Update a survey (admin only)
 */
exports.updateSurvey = async (req, res) => {
  try {
    const updates = { ...req.body };
    // Remove fields that should not be directly updated
    delete updates._id;
    delete updates.creatorId;
    delete updates.createdAt;
    delete updates.__v;
    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);
    if (updates.reward) updates.reward = parseInt(updates.reward, 10);
    if (updates.estimatedTime) updates.estimatedTime = parseInt(updates.estimatedTime, 10);
    if (updates.maxResponses) updates.maxResponses = parseInt(updates.maxResponses, 10);
    const survey = await Survey.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!survey) return res.status(404).json({ success: false, error: 'Survey not found' });
    res.json({
      success: true,
      message: 'Survey updated',
      survey: sanitizeSurvey(survey)
    });
  } catch (err) {
    console.error('updateSurvey:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error updating survey' });
  }
};

/**
 * Delete a survey (admin only)
 */
exports.deleteSurvey = async (req, res) => {
  try {
    const survey = await Survey.findByIdAndDelete(req.params.id);
    if (!survey) return res.status(404).json({ success: false, error: 'Survey not found' });
    // Optionally: Delete all related responses, analytics, etc.
    await SurveyResponse.deleteMany({ surveyId: req.params.id });
    res.json({ success: true, message: 'Survey deleted' });
  } catch (err) {
    console.error('deleteSurvey:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error deleting survey' });
  }
};

/**
 * Update survey status (admin only)
 */
exports.updateSurveyStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    if (!['draft', 'active', 'paused', 'completed', 'cancelled'].includes(status))
      return res.status(400).json({ success: false, error: 'Invalid status' });
    const survey = await Survey.findByIdAndUpdate(
      req.params.id,
      { status, ...(reason ? { statusReason: reason } : {}) },
      { new: true }
    );
    if (!survey) return res.status(404).json({ success: false, error: 'Survey not found' });
    res.json({
      success: true,
      message: 'Status updated',
      survey: sanitizeSurvey(survey)
    });
  } catch (err) {
    console.error('updateSurveyStatus:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error updating status' });
  }
};

/**
 * Duplicate survey (admin only)
 */
exports.duplicateSurvey = async (req, res) => {
  try {
    const original = await Survey.findById(req.params.id);
    if (!original) return res.status(404).json({ success: false, error: 'Survey not found' });
    const duplicate = new Survey({
      ...original.toObject(),
      _id: undefined,
      title: `${original.title} (Copy)`,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await duplicate.save();
    res.json({
      success: true,
      message: 'Survey duplicated',
      survey: sanitizeSurvey(duplicate)
    });
  } catch (err) {
    console.error('duplicateSurvey:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error duplicating survey' });
  }
};

/**
 * Bulk update surveys (admin only)
 */
exports.bulkUpdateSurveys = async (req, res) => {
  try {
    const { surveyIds, action, reason } = req.body;
    if (!Array.isArray(surveyIds) || surveyIds.length === 0)
      return res.status(400).json({ success: false, error: 'No surveys selected' });
    if (!['activate', 'pause', 'complete', 'cancel', 'delete'].includes(action))
      return res.status(400).json({ success: false, error: 'Invalid action' });
    let result;
    if (action === 'delete') {
      result = await Survey.deleteMany({ _id: { $in: surveyIds } });
      await SurveyResponse.deleteMany({ surveyId: { $in: surveyIds } });
    } else {
      const statusMap = {
        activate: 'active',
        pause: 'paused',
        complete: 'completed',
        cancel: 'cancelled'
      };
      const updates = { status: statusMap[action], ...(reason ? { statusReason: reason } : {}) };
      result = await Survey.updateMany({ _id: { $in: surveyIds } }, updates);
    }
    res.json({
      success: true,
      message: 'Bulk action complete',
      affectedCount: result.modifiedCount || result.deletedCount
    });
  } catch (err) {
    console.error('bulkUpdateSurveys:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error performing bulk action' });
  }
};

/**
 * Bulk delete surveys (admin only)
 */
exports.bulkDeleteSurveys = async (req, res) => {
  try {
    const { surveyIds } = req.body;
    if (!Array.isArray(surveyIds) || surveyIds.length === 0)
      return res.status(400).json({ success: false, error: 'No surveys selected' });
    const result = await Survey.deleteMany({ _id: { $in: surveyIds } });
    await SurveyResponse.deleteMany({ surveyId: { $in: surveyIds } });
    res.json({
      success: true,
      message: 'Surveys deleted',
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error('bulkDeleteSurveys:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error deleting surveys' });
  }
};

// ------------------------------ USER SURVEY INTERACTION ------------------------------

/**
 * Submit survey responses (authenticated)
 */
exports.submitSurvey = async (req, res) => {
  try {
    const { surveyId, responses, timeSpent } = req.body;
    // Check survey exists and is active
    const survey = await Survey.findById(surveyId);
    if (!survey || survey.status !== 'active')
      return res.status(404).json({ success: false, error: 'Survey not available' });
    // Check user hasn't already submitted
    const existing = await SurveyResponse.findOne({
      surveyId,
      userId: req.user._id
    });
    if (existing)
      return res.status(400).json({ success: false, error: 'Already submitted' });
    // Save response
    const response = new SurveyResponse({
      surveyId,
      userId: req.user._id,
      responses,
      ...(timeSpent ? { timeSpent: parseInt(timeSpent, 10) } : {})
    });
    await response.save();
    // In a real app, maybe update user's reward balance, send notifications, etc.
    res.json({
      success: true,
      message: 'Survey submitted',
      response: sanitizeResponse(response)
    });
  } catch (err) {
    console.error('submitSurvey:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error submitting survey' });
  }
};

/**
 * Get user's completed surveys (authenticated)
 */
exports.getMyCompletedSurveys = async (req, res) => {
  try {
    const [responses, surveys] = await Promise.all([
      SurveyResponse.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .lean(),
      Survey.find({ status: 'active' }).lean()
    ]);
    const completed = responses.map(resp => ({
      response: sanitizeResponse(resp),
      survey: sanitizeSurvey(surveys.find(s => s._id.toString() === resp.surveyId.toString()))
    }));
    res.json({ success: true, completed });
  } catch (err) {
    console.error('getMyCompletedSurveys:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching completed surveys' });
  }
};

/**
 * Get available surveys for the user (authenticated)
 */
exports.getMyAvailableSurveys = async (req, res) => {
  try {
    // Fetch all active surveys
    const surveys = await Survey.find({ status: 'active' }).lean();
    // Fetch user's completed survey IDs
    const completed = await SurveyResponse.distinct('surveyId', {
      userId: req.user._id
    });
    // Exclude completed surveys
    const available = surveys
      .filter(s => !completed.includes(s._id.toString()))
      .map(sanitizeSurvey);
    res.json({ success: true, available });
  } catch (err) {
    console.error('getMyAvailableSurveys:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching available surveys' });
  }
};

/**
 * Get user's survey progress/status (authenticated)
 */
exports.getMySurveyProgress = async (req, res) => {
  try {
    const completed = await SurveyResponse.countDocuments({ userId: req.user._id });
    const started = 0; // If you track progress, update this
    res.json({
      success: true,
      progress: {
        completed,
        started,
        available: await Survey.countDocuments({ status: 'active' }) - completed
      }
    });
  } catch (err) {
    console.error('getMySurveyProgress:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching progress' });
  }
};

/**
 * Get user's survey earnings (authenticated)
 */
exports.getMySurveyEarnings = async (req, res) => {
  try {
    // Sum rewards from completed surveys
    const responses = await SurveyResponse.find({ userId: req.user._id })
      .populate('surveyId', 'reward')
      .lean();
    const total = responses.reduce((sum, r) => sum + (r.surveyId?.reward || 0), 0);
    res.json({
      success: true,
      earnings: {
        total,
        recent: responses
          .filter(r => new Date(r.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
          .reduce((sum, r) => sum + (r.surveyId?.reward || 0), 0)
      }
    });
  } catch (err) {
    console.error('getMySurveyEarnings:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching earnings' });
  }
};

/**
 * Get user's survey history (authenticated)
 */
exports.getMySurveyHistory = async (req, res) => {
  try {
    const responses = await SurveyResponse.find({ userId: req.user._id })
      .populate('surveyId', 'title reward')
      .sort({ createdAt: -1 })
      .lean();
    res.json({
      success: true,
      history: responses.map(resp => ({
        ...sanitizeResponse(resp),
        survey: sanitizeSurvey(resp.surveyId)
      }))
    });
  } catch (err) {
    console.error('getMySurveyHistory:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching history' });
  }
};

// --- Survey interaction tracking ---

exports.startSurvey = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey || survey.status !== 'active')
      return res.status(404).json({ success: false, error: 'Survey not available' });
    // Track "start" event (in a real app, you might want to log this)
    res.json({ success: true, message: 'Survey started' });
  } catch (err) {
    console.error('startSurvey:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error starting survey' });
  }
};

exports.pauseSurvey = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey || survey.status !== 'active')
      return res.status(404).json({ success: false, error: 'Survey not available' });
    // Track "pause" event
    res.json({ success: true, message: 'Survey paused' });
  } catch (err) {
    console.error('pauseSurvey:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error pausing survey' });
  }
};

exports.resumeSurvey = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey || survey.status !== 'active')
      return res.status(404).json({ success: false, error: 'Survey not available' });
    // Track "resume" event
    res.json({ success: true, message: 'Survey resumed' });
  } catch (err) {
    console.error('resumeSurvey:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error resuming survey' });
  }
};

exports.abandonSurvey = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey || survey.status !== 'active')
      return res.status(404).json({ success: false, error: 'Survey not available' });
    // Track "abandon" event (in a real app, you might want to log this)
    res.json({ success: true, message: 'Survey abandoned' });
  } catch (err) {
    console.error('abandonSurvey:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error abandoning survey' });
  }
};

// --- Survey feedback and rating ---

exports.submitSurveyFeedback = async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const survey = await Survey.findById(req.params.id);
    if (!survey)
      return res.status(404).json({ success: false, error: 'Survey not found' });
    // Save feedback (in a real app, you might want to create a Feedback model)
    res.json({
      success: true,
      message: 'Feedback submitted',
      feedback: { rating, feedback, surveyId: req.params.id }
    });
  } catch (err) {
    console.error('submitSurveyFeedback:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error submitting feedback' });
  }
};

// --- Survey discovery and recommendations ---

exports.getSurveyRecommendations = async (req, res) => {
  try {
    // In a real app, implement personalized recommendations here
    // For now, just return trending/latest active surveys
    res.json({
      success: true,
      recommendations: []
    });
  } catch (err) {
    console.error('getSurveyRecommendations:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching recommendations' });
  }
};

exports.getSurveyCategories = async (req, res) => {
  try {
    res.json({
      success: true,
      categories: await Survey.distinct('category')
    });
  } catch (err) {
    console.error('getSurveyCategories:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching categories' });
  }
};

exports.getTrendingSurveys = async (req, res) => {
  try {
    // In a real app, implement trending logic (based on recent completions, engagement, etc.)
    res.json({
      success: true,
      trending: []
    });
  } catch (err) {
    console.error('getTrendingSurveys:', err);
    // logger.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching trending surveys' });
  }
};

// --- ADMIN ANALYTICS & REPORTING (STUB FORWARD COMPATIBILITY) ---
// (Implement as needed)

// --- STUB ALL OTHER ROUTES REFERENCED IN YOUR ROUTES FILE ---
// (This prevents "undefined route handler" crashes forever)

[
  'getSurveyAnalytics', 'getSurveyResponses', 'getSurveyStatistics',
  'getGlobalSurveyAnalytics', 'getAdminSurveyStats', 'getSurveyPerformanceMetrics',
  'getUserSurveys', 'getUserSurveyResponses', 'getSurveyTemplates',
  'createSurveyTemplate', 'createSurveyFromTemplate', 'getSurveyCompletionReport',
  'getSurveyEngagementReport', 'getSurveyRevenueReport', 'flagSurvey',
  'unflagSurvey', 'getFlaggedResponses', 'verifyResponse', 'deleteResponse'
].forEach(fn => {
  if (!exports[fn]) exports[fn] = notImplemented(fn);
});
