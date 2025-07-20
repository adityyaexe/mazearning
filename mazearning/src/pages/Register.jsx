// src/pages/Register.jsx

import React, { useState } from "react";
import { useNotification } from "../contexts/NotificationContext";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Link,
  CircularProgress,
  IconButton,
  InputAdornment,
} from "@mui/material";

import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export default function Register() {
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Toggle password visibility
  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      return showNotification("Please fill in all fields correctly", "error");
    }

    if (password.length < 8) {
      return showNotification("Password must be at least 8 characters", "error");
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
        credentials: "include", // for token cookie if using
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      showNotification("Registration successful! Please log in.", "success");
      navigate("/login");
    } catch (err) {
      showNotification(err.message || "Registration failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa, #e1ecf4)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        px: 2,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 440,
          borderRadius: 3,
          textAlign: "center",
        }}
      >
        <AccountBalanceWalletIcon sx={{ color: "#1976d2", fontSize: 48, mb: 1 }} />
        <Typography variant="h5" fontWeight={700} color="primary" mb={1}>
          Create Account
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Join Mazearning to earn, save, and explore the best reward system.
        </Typography>

        <form onSubmit={handleSubmit} autoComplete="off">
          {/* Name Field */}
          <TextField
            fullWidth
            margin="normal"
            label="Name"
            type="text"
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            inputProps={{ maxLength: 50 }}
          />

          {/* Email Field */}
          <TextField
            fullWidth
            margin="normal"
            label="Email"
            type="email"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            inputProps={{ maxLength: 100 }}
          />

          {/* Password Field */}
          <TextField
            fullWidth
            margin="normal"
            label="Password"
            type={showPassword ? "text" : "password"}
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            inputProps={{ minLength: 8, maxLength: 64 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={togglePasswordVisibility}
                    edge="end"
                    aria-label="toggle password visibility"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            sx={{
              mt: 2,
              py: 1.2,
              fontWeight: 700,
              fontSize: "1rem",
              textTransform: "none",
              bgcolor: "#1976d2",
              ":hover": { bgcolor: "#1565c0" },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Register"}
          </Button>
        </form>

        {/* Footer Link */}
        <Box mt={3}>
          <Typography variant="body2">
            Already have an account?{" "}
            <Link
              component={RouterLink}
              to="/login"
              sx={{ fontWeight: 600, color: "#1976d2" }}
            >
              Login
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
