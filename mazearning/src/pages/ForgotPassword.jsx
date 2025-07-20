// mazearning/src/pages/ForgotPassword.jsx

import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  useTheme,
} from "@mui/material";
import { useNotification } from "../contexts/NotificationContext";
import ScrollToTop from "../components/ScrollToTop"; // Optional if routing triggers

export default function ForgotPassword() {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to send email.");

      showNotification("📨 Password reset link sent. Check your inbox.", "success");
      setEmail(""); // Optionally reset field
    } catch (err) {
      showNotification(err.message || "Something went wrong.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <ScrollToTop />

      <Paper elevation={3} sx={{ p: 4, borderRadius: 3, width: "100%", maxWidth: 400 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom textAlign="center">
          Forgot Password
        </Typography>

        <Typography variant="body2" color="text.secondary" mb={3} textAlign="center">
          Enter your registered email and we'll send you a reset link.
        </Typography>

        <form onSubmit={handleSubmit} noValidate>
          <TextField
            label="Email address"
            type="email"
            fullWidth
            required
            sx={{ mb: 2 }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button
            type="submit"
            color="primary"
            variant="contained"
            fullWidth
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
