// backend/routes/profile.js
const express = require("express");
const authenticateToken = require("../middleware/auth");
const User = require("../models/user");
const router = express.Router();

router.get("/", authenticateToken, async (req, res) => {
  const user = await User.findById(req.user.id).select("-passwordHash");
  res.json(user);
});

module.exports = router;
