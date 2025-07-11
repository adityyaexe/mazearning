// backend/routes/wallet.js
const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const Wallet = require("../models/wallet");
const WalletTransaction = require("../models/wallet_transaction");

// Get wallet balance and transactions
router.get("/", authenticateToken, async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user.id });
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user.id });
    }
    const transactions = await WalletTransaction.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(20);
    res.json({
      balance: wallet.balance,
      transactions: transactions.map(tx => ({
        id: tx._id,
        date: tx.createdAt,
        type: tx.isInflow ? "credit" : "debit",
        description: tx.paymentMethod === "withdrawal" ? "Withdrawal" : "Earning",
        amount: tx.amount,
        status: tx.status
      }))
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch wallet data" });
  }
});

// Withdraw endpoint (example)
router.post("/withdraw", authenticateToken, async (req, res) => {
  // Implement withdrawal logic (validate, update wallet, create transaction, etc.)
  res.json({ message: "Withdrawal requested." });
});

module.exports = router;

