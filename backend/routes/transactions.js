// backend/routes/transactions.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');

// Mock data
router.get('/', authenticateToken, (req, res) => {
  // Fetch user's transactions from DB
  res.json([
    { id: "tx1", date: "2025-07-11T10:22:00Z", type: "credit", description: "Completed offer: Super App", amount: 100, status: "completed" },
    { id: "tx2", date: "2025-07-10T15:40:00Z", type: "debit", description: "Withdrawal", amount: -50, status: "pending" }
  ]);
});

module.exports = router;
