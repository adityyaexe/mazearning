// backend/middleware/errorHandler.js
const isDev = process.env.NODE_ENV === 'development';

// Default logging (replace w/Winston or your logger in production)
let logger = {
  error: (...args) => console.error(...args),
  warn: (...args) => console.warn(...args),
};

// Custom error class for API responses
class ApiError extends Error {
  constructor(message, statusCode = 500, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack.length) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Convert non-Api errors into standardized ApiError
function convertToApiError(err, statusCode = 500) {
  if (err instanceof ApiError) return err;
  return new ApiError(
    err.message || 'Internal Server Error',
    statusCode,
    false,
    err.stack
  );
}

// Centralized error logging (dev = full stack, prod = essentials)
function logError(err) {
  if (isDev) {
    logger.error(`[${err.name}] ${err.message}\n${err.stack}`);
  } else {
    logger.warn(`[${err.statusCode || 500}] ${err.message}`);
  }
}

// Main Express error handler
function errorHandler(err, req, res, next) {
  const error = convertToApiError(err);
  logError(error);
  // Optional: Integrate error reporting (Sentry, etc.)
  // if (!isDev) Sentry.captureException(error);
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: error.message,
    ...(isDev && { stack: error.stack }),
    code: statusCode,
  });
}

// Optional: Set a custom logger (call once, at startup)
function setLogger(customLogger) {
  logger = customLogger;
}

// Export the handler itself (for app.use)
module.exports = errorHandler;
// Export utilities/classes for reuse
module.exports.ApiError = ApiError;
module.exports.setLogger = setLogger;
