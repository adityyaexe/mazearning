require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require("./config/database");

const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const transactionRoutes = require('./routes/transactions');
const profileRoutes = require('./routes/profile');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/profile', profileRoutes);

app.get('/', (req, res) => {
  res.send('Mazearning API is running!');
});

// ✅ Connect to DB before starting the server
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
  });
}).catch(err => {
  console.error("❌ Failed to connect to MongoDB:", err.message);
  process.exit(1);
});
