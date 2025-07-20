// backend/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
// const logger = require('../config/logger'); // Uncomment if you use a logger

// Config
const { port, env } = require('./config/config');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// ────────────────────────────────────────────────────────────────
// Router Validation Helper
// ────────────────────────────────────────────────────────────────
const assertRouter = (router, name) => {
  if (typeof router !== 'function' || typeof router.use !== 'function') {
    throw new Error(
      `[ROUTER ERROR] ${name} is not an Express router. Got: ${typeof router}`
    );
  }
};

// ────────────────────────────────────────────────────────────────
// Route Imports (with validation)
// ────────────────────────────────────────────────────────────────
const routeFiles = [
  { name: 'authRoutes', path: './routes/auth' },
  { name: 'profileRoutes', path: './routes/profile' },
  { name: 'walletRoutes', path: './routes/wallet' },
  { name: 'walletAdminRoutes', path: './routes/walletRoutes' },
  { name: 'walletTxRoutes', path: './routes/walletTransactionRoutes' },
  { name: 'userRoutes', path: './routes/userRoutes' },
  { name: 'transactionRoutes', path: './routes/transactions' },
  { name: 'surveysRoutes', path: './routes/surveys' },
  { name: 'userAdRoutes', path: './routes/userAdRoutes' },
  { name: 'userAppRoutes', path: './routes/userAppRoutes' },
];

const routers = {};

for (const route of routeFiles) {
  try {
    routers[route.name] = require(route.path);
    assertRouter(routers[route.name], route.name);
    console.log(`✅ Loaded router: ${route.name}`);
  } catch (err) {
    console.error(
      `❌ Failed to load router ${route.name} from ${route.path}:`,
      err.message
      // Uncomment for stack trace in dev:
      // , err.stack
    );
    process.exit(1); // Crash early, fix the file
  }
}

// ────────────────────────────────────────────────────────────────
// Express App Setup
// ────────────────────────────────────────────────────────────────
const app = express();

// ────────────────────────────────────────────────────────────────
// Global Middleware
// ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_WHITELIST?.split(',') || [
      'http://localhost:5173',
      'http://localhost:5174',
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(env === 'production' ? 'combined' : 'dev'));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ────────────────────────────────────────────────────────────────
// Health Check
// ────────────────────────────────────────────────────────────────
app.get('/', (req, res) =>
  res.json({
    status: 'ok',
    message: 'Mazearning API',
    version: 'v1',
    time: new Date().toISOString(),
  })
);

// ────────────────────────────────────────────────────────────────
// Route Mounting (with safe fallback if router is missing)
// ────────────────────────────────────────────────────────────────
const mountRoutes = [
  { path: '/api/auth', router: routers.authRoutes },
  { path: '/api/profile', router: routers.profileRoutes },
  { path: '/api/wallet', router: routers.walletRoutes },
  { path: '/api/wallets', router: routers.walletAdminRoutes },
  { path: '/api/wallet-transactions', router: routers.walletTxRoutes },
  { path: '/api/users', router: routers.userRoutes },
  { path: '/api/transactions', router: routers.transactionRoutes },
  { path: '/api/surveys', router: routers.surveysRoutes },
  { path: '/api/user-ads', router: routers.userAdRoutes },
  { path: '/api/user-apps', router: routers.userAppRoutes },
];

for (const { path, router } of mountRoutes) {
  app.use(path, router);
  console.log(`🔗 Mounted API: ${path}`);
}

// ────────────────────────────────────────────────────────────────
// Error Handling
// ────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});
app.use(errorHandler);

// ────────────────────────────────────────────────────────────────
// Server Start
// ────────────────────────────────────────────────────────────────
(async () => {
  try {
    await connectDB();
    const server = app.listen(port, () => {
      console.log(`🚀  API server running on http://localhost:${port}`);
      if (env !== 'production') {
        console.log('📚  API Docs: http://localhost:' + port + '/docs'); // Optional: Add Swagger/OpenAPI docs
      }
    });
    // Handle server errors (optional, for completeness)
    server.on('error', (err) => {
      console.error('❌  Server error:', err.message);
      process.exit(1);
    });
  } catch (err) {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  }
})();

// Export for testing
module.exports = app;
