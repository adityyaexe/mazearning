// mazearning/src/pages/Login.jsx
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

export default function Login() {
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      showNotification("Login successful!", "success");
      navigate("/");
    } catch (err) {
      showNotification("Login failed. Please check your credentials.", "error");
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
        px: 2, // horizontal padding for mobile
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
          Mazearning Login
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
          Sign in to earn rewards, complete offers, and manage your wallet!
        </Typography>
        <form onSubmit={handleSubmit} autoComplete="off">
          <TextField
            label="Email"
            type="email"
            variant="outlined"
            fullWidth
            margin="dense"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
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
            {loading ? <CircularProgress size={24} color="inherit" /> : "Login"}
          </Button>
        </form>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">
            Don&apos;t have an account?{" "}
            <Link
              component={RouterLink}
              to="/register"
              sx={{ color: "#1976d2", fontWeight: 600 }}
            >
              Register
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
