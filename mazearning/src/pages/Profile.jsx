// src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Fade,
  useTheme,
  useMediaQuery,
  Container,
} from "@mui/material";

import apiClient from "../api/apiClient";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/Header";
import ScrollToTop from "../components/ScrollToTop";

export default function Profile() {
  const { logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", email: "" });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // 🚀 Fetch profile on mount
  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      setLoading(true);
      try {
        const res = await apiClient.get("/profile");
        if (isMounted && res?.data) {
          setProfile(res.data);
          setForm({ name: res.data.name, email: res.data.email });
        }
      } catch (err) {
        console.error("Failed to load profile:", err); // ✅ fixed usage
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const hasProfileChanged = () =>
    profile &&
    (form.name.trim() !== profile.name || form.email.trim() !== profile.email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasProfileChanged()) {
      setError("No changes made.");
      return;
    }

    setSaving(true);
    try {
      const res = await apiClient.put("/profile", { name: form.name });
      if (res?.data) {
        setProfile(res.data);
        setEditMode(false);
        setSuccessMsg("Profile updated successfully.");
      }
    } catch (err) {
      console.error("Failed to update profile:", err); // ✅ log for debugging
      setError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Alert severity="error">{error || "Profile not found."}</Alert>
      </Box>
    );
  }

  return (
    <>
      <ScrollToTop />
      <Box
        sx={{
          minHeight: "100vh",
          px: { xs: 2, md: 4 },
          pt: 4,
          pb: 10,
          bgcolor: theme.palette.background.default,
          color: theme.palette.text.primary,
          transition: "all 0.3s ease",
        }}
      >
        <Header title="👤 My Profile" />
        <Container maxWidth="sm">
          <Fade in>
            <Card
              elevation={3}
              sx={{
                borderRadius: 3,
                bgcolor: theme.palette.background.paper,
                px: { xs: 2, md: 3 },
                py: { xs: 3, md: 4 },
              }}
            >
              <CardContent>
                <Box component="form" onSubmit={handleSubmit} noValidate autoComplete="off">
                  <TextField
                    label="Name"
                    name="name"
                    fullWidth
                    margin="normal"
                    value={form.name}
                    onChange={handleChange}
                    disabled={!editMode}
                  />

                  <TextField
                    label="Email"
                    name="email"
                    fullWidth
                    margin="normal"
                    value={form.email}
                    disabled
                  />

                  <Box
                    display="flex"
                    flexDirection={isMobile ? "column" : "row"}
                    gap={2}
                    mt={4}
                  >
                    {editMode ? (
                      <>
                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          fullWidth={isMobile}
                          disabled={saving}
                        >
                          {saving
                            ? <CircularProgress size={20} color="inherit" />
                            : "Save"}
                        </Button>
                        <Button
                          variant="outlined"
                          fullWidth={isMobile}
                          disabled={saving}
                          onClick={() => {
                            setEditMode(false);
                            setForm({ name: profile.name, email: profile.email });
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="contained"
                          fullWidth={isMobile}
                          onClick={() => setEditMode(true)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          fullWidth={isMobile}
                          onClick={logout}
                        >
                          Logout
                        </Button>
                      </>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Container>

        {/* ✅ Success Snackbar */}
        <Snackbar
          open={!!successMsg}
          autoHideDuration={4000}
          onClose={() => setSuccessMsg("")}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert severity="success" variant="filled" onClose={() => setSuccessMsg("")}>
            {successMsg}
          </Alert>
        </Snackbar>

        {/* 🚨 Error Snackbar */}
        <Snackbar
          open={!!error}
          autoHideDuration={4000}
          onClose={() => setError("")}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert severity="error" variant="filled" onClose={() => setError("")}>
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
}
