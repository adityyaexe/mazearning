// backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1d" });
  res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
});

// Registration endpoint (optional)
router.post("/register", async (req, res) => {
  const { email, password, name } = req.body;
  if (await User.findOne({ email })) {
    return res.status(400).json({ error: "Email already exists" });
  }
  const passwordHash = bcrypt.hashSync(password, 10);
  const user = await User.create({ email, passwordHash, name });
  const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1d" });
  res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
});

module.exports = router;
