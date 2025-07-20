// src/pages/ResetPassword.jsx

import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { useNotification } from "../contexts/NotificationContext";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || password.length < 8) {
      showNotification("Password must be at least 8 characters.", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to reset password");
      }

      showNotification("✅ Password has been reset successfully!", "success");
      navigate("/login");
    } catch (err) {
      showNotification(err.message || "Failed to reset password.", "error");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () =>
    setShowPassword((prev) => !prev);

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
          Set New Password
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Please enter your new password (minimum 8 characters).
        </Typography>

        <form onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth
            margin="normal"
            label="New Password"
            type={showPassword ? "text" : "password"}
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            inputProps={{ minLength: 8 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={togglePasswordVisibility} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            size="large"
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
            {loading ? <CircularProgress size={24} color="inherit" /> : "Reset Password"}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
