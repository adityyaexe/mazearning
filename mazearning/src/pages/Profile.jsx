// src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Box,
} from "@mui/material";
import apiClient from "../api/apiClient";
import { useAuth } from "../contexts/AuthContext";

export default function Profile() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function fetchProfile() {
      setLoading(true);
      try {
        const res = await apiClient.get("/api/auth/profile");
        if (isMounted) {
          setProfile(res.data);
          setForm({ name: res.data.name, email: res.data.email });
        }
      } catch (err) {
        setError("Failed to load profile.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchProfile();
    return () => { isMounted = false; };
  }, []);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await apiClient.put("/profile", form);
      setProfile(res.data);
      setEditMode(false);
      setSuccessMsg("Profile updated successfully!");
    } catch (err) {
      setError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <Alert severity="error">{error || "Profile not found."}</Alert>
      </Box>
    );
  }

  return (
    <Box maxWidth={480} mx="auto" mt={4}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Profile
          </Typography>
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSave();
            }}
          >
            <TextField
              label="Name"
              name="name"
              value={editMode ? form.name : profile.name}
              onChange={handleChange}
              fullWidth
              margin="normal"
              disabled={!editMode}
            />
            <TextField
              label="Email"
              name="email"
              value={editMode ? form.email : profile.email}
              onChange={handleChange}
              fullWidth
              margin="normal"
              disabled
            />
            {/* Add more fields as needed */}
            <Box mt={2} display="flex" gap={2}>
              {editMode ? (
                <>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={saving}
                  >
                    {saving ? <CircularProgress size={22} /> : "Save"}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setEditMode(false);
                      setForm({ name: profile.name, email: profile.email });
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="contained"
                    onClick={() => setEditMode(true)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={logout}
                  >
                    Logout
                  </Button>
                </>
              )}
            </Box>
          </form>
        </CardContent>
      </Card>
      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError("")}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!successMsg}
        autoHideDuration={3000}
        onClose={() => setSuccessMsg("")}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSuccessMsg("")}>
          {successMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
