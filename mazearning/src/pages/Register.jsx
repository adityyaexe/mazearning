// mazearning/src/pages/Register.jsx
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
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
  useTheme,
  useMediaQuery,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

export default function Register() {
  const { login } = useAuth(); // auto-login after registration
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      showNotification("Registration successful!", "success");

      // Optionally auto-login after registration
      await login(email, password);
      navigate("/");
    } catch (err) {
      showNotification(err.message || "Registration failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f5f7fa",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: { xs: 2, sm: 4 },
          width: "100%",
          maxWidth: { xs: 360, sm: 400, md: 420, lg: 480 },
          borderRadius: 3,
          textAlign: "center",
          boxSizing: "border-box",
        }}
      >
        <AccountBalanceWalletIcon
          sx={{ color: "#1976d2", fontSize: 48, mb: 1 }}
        />
        <Typography variant={isXs ? "h6" : "h5"} fontWeight={700} sx={{ mb: 1, color: "#1976d2" }}>
          Create Your Mazearning Account
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
          Join Mazearning to earn rewards, complete offers, and manage your wallet!
        </Typography>
        <form onSubmit={handleSubmit} autoComplete="off">
          <TextField
            label="Name"
            type="text"
            variant="outlined"
            fullWidth
            margin="dense"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            size={isXs ? "small" : "medium"}
          />
          <TextField
            label="Email"
            type="email"
            variant="outlined"
            fullWidth
            margin="dense"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            size={isXs ? "small" : "medium"}
          />
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            margin="dense"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            size={isXs ? "small" : "medium"}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{
              mt: 2,
              fontWeight: 700,
              bgcolor: "#1976d2",
              ":hover": { bgcolor: "#1565c0" },
              py: 1.2,
              fontSize: isXs ? "1rem" : "1.1rem",
            }}
            disabled={loading}
            size="large"
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Register"}
          </Button>
        </form>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">
            Already have an account?{" "}
            <Link
              component={RouterLink}
              to="/login"
              sx={{ color: "#1976d2", fontWeight: 600 }}
            >
              Login
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
