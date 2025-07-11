// backend/models/transaction.js
const mongoose = require("mongoose");
const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    transactionId: { type: String, trim: true },
    name: { type: String, trim: true },
    email: { type: String, trim: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, enum: ["INR", "USD"] },
    paymentStatus: { type: String, enum: ["successful", "pending", "failed"], default: "pending" },
    paymentGateway: { type: String, default: "internal" },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Transaction", transactionSchema);
