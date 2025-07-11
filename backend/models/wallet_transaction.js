// backend/models/wallet_transaction.js
const mongoose = require("mongoose");
const walletTransactionSchema = new mongoose.Schema(
  {
    amount: { type: Number, default: 0 },
    userId: { type: String, ref: "User", required: true },
    isInflow: { type: Boolean },
    paymentMethod: { type: String, default: "internal" },
    currency: { type: String, required: true, enum: ["INR", "USD"] },
    status: { type: String, required: true, enum: ["successful", "pending", "failed"] },
  },
  { timestamps: true }
);
module.exports = mongoose.model("WalletTransaction", walletTransactionSchema);
