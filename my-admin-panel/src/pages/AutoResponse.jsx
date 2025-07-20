// my-admin-panel/src/pages/AutoResponse.jsx
import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  CircularProgress,
} from "@mui/material";
import Header from "../components/Header";

export default function AutoResponse() {
  const [autoReply, setAutoReply] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleSave = async () => {
    setLoading(true);
    setSuccessMessage(null);
    try {
      // Replace with your API call to save auto-response settings
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccessMessage("Settings saved successfully!");
    } catch (error) {
      setSuccessMessage("Failed to save settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Header title="Auto Response Settings" />

      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <Stack spacing={3}>
          <TextField
            label="Auto Response Message"
            multiline
            minRows={4}
            maxRows={10}
            value={autoReply}
            onChange={(e) => setAutoReply(e.target.value)}
            placeholder="Enter the message to auto-respond with"
            fullWidth
          />

          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="body1">Enable Auto Response</Typography>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              aria-label="Enable or disable auto response"
            />
          </Stack>

          {successMessage && (
            <Typography
              variant="subtitle2"
              color={successMessage.includes("Failed") ? "error" : "success.main"}
            >
              {successMessage}
            </Typography>
          )}

          <Box>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
            >
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
