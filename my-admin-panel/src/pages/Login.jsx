// my-admin-panel/src/pages/Login.jsx
import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login, loading: authLoading, error: authError } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const validateForm = () => {
    if (!form.email.trim()) {
      setFormError("Email is required.");
      return false;
    }
    // Basic email format check
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setFormError("Please enter a valid email address.");
      return false;
    }
    if (!form.password.trim()) {
      setFormError("Password is required.");
      return false;
    }
    setFormError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setFormError("");

    try {
      await login(form);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setFormError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mt: 10,
        }}
        role="alert"
        aria-busy="true"
        aria-live="assertive"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      maxWidth={400}
      p={4}
      mx="auto"
      mt={10}
      boxShadow={3}
      borderRadius={2}
      component="main"
      aria-label="Admin login form"
    >
      <Typography variant="h5" mb={3} component="h1" tabIndex={-1}>
        Admin Login
      </Typography>

      {(formError || authError) && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert">
          {formError || authError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <TextField
          label="Email"
          name="email"
          value={form.email}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          autoComplete="email"
          type="email"
          inputProps={{ "aria-required": "true" }}
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          autoComplete="current-password"
          inputProps={{ "aria-required": "true" }}
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          sx={{ mt: 3 }}
          disabled={loading}
          aria-disabled={loading}
        >
          {loading ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </Button>
      </form>
    </Box>
  );
}
