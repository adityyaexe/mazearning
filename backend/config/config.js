// backend/config/config.js
const path = require('path');
require('dotenv').config({
  path: process.env.ENV_FILE || path.resolve(process.cwd(), '.env')
});

const Joi = require('joi');

// ────────────────────────────── Schema ──────────────────────────────

const schema = Joi.object({
  // Core
  PORT: Joi.number().default(5000),
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  APP_NAME: Joi.string().default('Mazearning Backend'),
  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  // CORS
  CORS_WHITELIST: Joi.string().default('http://localhost:5173,http://localhost:5174'),
  // Redis
  REDIS_HOST: Joi.string().hostname().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  // MongoDB
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASS: Joi.string().required(),
  MONGO_URI: Joi.string().uri().required(),
  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug', 'verbose').default('info'),
  // Session
  SESSION_SECRET: Joi.string().min(32).required(),
  // Email
  SMTP_HOST: Joi.string().hostname(),
  SMTP_PORT: Joi.number().port(),
  SMTP_USER: Joi.string(),
  SMTP_PASS: Joi.string(),
  // Security
  RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000), // 15 mins
  RATE_LIMIT_MAX: Joi.number().default(1000),
  // Notifications
  TWILIO_SID: Joi.string(),
  TWILIO_AUTH_TOKEN: Joi.string(),
  TWILIO_PHONE: Joi.string(),
  // Misc
  ADMIN_EMAIL: Joi.string().email(),
  SUPPORT_EMAIL: Joi.string().email(),
  CONTACT_PHONE: Joi.string(),
  // Dev/Test Overrides
  __TEST__: Joi.boolean().default(false),
  __DEV__: Joi.boolean().default(false)
}).unknown(); // Allow unknown env vars (but validate only whitelisted)

// ────────────────────────────── Validation ──────────────────────────────

const { value: env, error } = schema.validate(process.env, { abortEarly: false });

if (error) {
  console.error('❌  Invalid environment variables:');
  error.details.forEach((err) => console.error(`  - ${err.message}`));
  if (process.env.NODE_ENV !== 'test') process.exit(1);
}

// ────────────────────────────── Canonical Config ──────────────────────────────

const config = {
  // Server
  port: env.PORT,
  env: env.NODE_ENV,
  appName: env.APP_NAME,
  isDev: env.NODE_ENV === 'development',
  isProd: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  // Auth
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN
  },
  // CORS
  cors: {
    whitelist: env.CORS_WHITELIST.split(',').map(s => s.trim())
  },
  // Database
  mongodb: {
    uri: env.MONGO_URI,
    user: env.DB_USER,
    pass: env.DB_PASS,
    name: env.DB_NAME
  },
  // Redis
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT
  },
  // Logging
  logLevel: env.LOG_LEVEL,
  // Session
  sessionSecret: env.SESSION_SECRET,
  // Email
  email: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  },
  // Rate Limiting
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX
  },
  // Notifications
  twilio: {
    sid: env.TWILIO_SID,
    authToken: env.TWILIO_AUTH_TOKEN,
    phone: env.TWILIO_PHONE
  },
  // Support
  adminEmail: env.ADMIN_EMAIL,
  supportEmail: env.SUPPORT_EMAIL,
  contactPhone: env.CONTACT_PHONE,
  // Flags
  __test__: env.__TEST__,
  __dev__: env.__DEV__
};

module.exports = config;
