// src/pages/Login.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  CircularProgress,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
} from "@mui/material";

import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";

import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export default function Login() {
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isValid = email.trim().length >= 4 && password.trim().length >= 3;

  const toggleShowPassword = useCallback(
    () => setShowPassword((prev) => !prev),
    []
  );

  useEffect(() => {
    setError(null); // Clear error when user types
  }, [email, password]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!isValid) {
        setError("Please fill in all fields.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        await login(email, password, keepLoggedIn);
        showNotification("Login successful!", "success");
        navigate("/");
      } catch (err) {
        const fallback =
          err?.response?.data?.error?.details?.[0]?.msg ||
          err?.response?.data?.error ||
          err?.message ||
          "Login failed. Please check your credentials.";
        setError(fallback);
        showNotification(fallback, "error");
      } finally {
        setLoading(false);
      }
    },
    [email, password, keepLoggedIn, login, navigate, showNotification, isValid]
  );

  // ⚠️ Optional: Reset state on page transition
  useEffect(() => {
    return () => {
      setEmail("");
      setPassword("");
      setError(null);
    };
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa, #e1ecf4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: 4,
          maxWidth: 420,
          width: "100%",
          borderRadius: 3,
          textAlign: "center",
        }}
      >
        <AccountBalanceWalletIcon
          sx={{ fontSize: 48, color: "primary.main", mb: 1 }}
        />
        <Typography variant="h5" fontWeight={700} color="primary" mb={1}>
          Welcome Back
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Sign in to earn rewards, complete offers, and manage your wallet.
        </Typography>

        {error && (
          <Typography color="error" fontSize={14} mb={2}>
            {error}
          </Typography>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth
            label="Email"
            type="email"
            autoComplete="email"
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={toggleShowPassword}
                    aria-label="toggle password visibility"
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 1,
              mb: 2,
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={keepLoggedIn}
                  onChange={(e) => setKeepLoggedIn(e.target.checked)}
                  color="primary"
                />
              }
              label="Stay signed in"
            />
            <Link
              component={RouterLink}
              to="/forgot-password"
              sx={{ fontSize: "0.85rem", color: "text.secondary" }}
            >
              Forgot Password?
            </Link>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading || !isValid}
            sx={{
              mt: 2,
              py: 1.2,
              fontWeight: 700,
              fontSize: "1rem",
              textTransform: "none",
              bgcolor: "primary.main",
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Login"
            )}
          </Button>
        </form>

        <Box mt={3}>
          <Typography variant="body2">
            Don't have an account?{" "}
            <Link
              component={RouterLink}
              to="/register"
              sx={{ fontWeight: 600, color: "primary.main" }}
            >
              Register
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
