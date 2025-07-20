// backend/routes/wallet.js
const express = require("express");
const router = express.Router();
const { authenticateToken, adminOnly } = require("../middleware/auth");
const walletController = require("../controllers/walletController");
const WalletTransaction = require("../models/wallet_transaction");

// GET /api/wallet
// Returns wallet and last 20 transactions for logged-in user
router.get("/", authenticateToken, async (req, res) => {
  try {
    let wallet = await walletController.getWalletByUserId(req.user._id);
    if (!wallet) {
      wallet = await walletController.createWalletForUser(req.user._id);
    }

    const transactions = await WalletTransaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      balance: wallet.balance,
      transactions: transactions.map((tx) => ({
        id: tx._id,
        date: tx.createdAt,
        type: tx.isInflow ? "credit" : "debit",
        description: tx.paymentMethod === "withdrawal" ? "Withdrawal" : "Earning",
        amount: tx.amount,
        status: tx.status,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch wallet data" });
  }
});

// POST /api/wallet/withdraw
router.post("/withdraw", authenticateToken, async (req, res) => {
  // TODO: implement withdrawal logic
  res.json({ message: "Withdrawal requested." });
});

module.exports = router;
