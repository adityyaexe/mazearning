// my-admin-panel/src/pages/Settings.jsx
import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  FormControlLabel,
  Switch,
} from "@mui/material";
import Header from "../components/Header";

export default function Settings() {
  const [settings, setSettings] = useState({
    enableNotifications: true,
    defaultLanguage: "en",
    supportEmail: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    // TODO: implement save logic, e.g. API call
    alert("Settings saved successfully!");
  };

  return (
    <Box>
      <Header title="Settings" />
      <Paper
        component="form"
        onSubmit={handleSave}
        sx={{ p: 3, maxWidth: 600, marginTop: 2 }}
        aria-label="Settings form"
      >
        <Typography variant="h6" gutterBottom>
          General Settings
        </Typography>

        <Stack spacing={3}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.enableNotifications}
                onChange={handleChange}
                name="enableNotifications"
                color="primary"
                inputProps={{ "aria-label": "Enable notifications" }}
              />
            }
            label="Enable Notifications"
          />

          <TextField
            label="Support Email"
            type="email"
            name="supportEmail"
            value={settings.supportEmail}
            onChange={handleChange}
            placeholder="support@example.com"
            fullWidth
            autoComplete="email"
            required
          />

          <TextField
            select
            label="Default Language"
            name="defaultLanguage"
            value={settings.defaultLanguage}
            onChange={handleChange}
            fullWidth
            SelectProps={{ native: true }}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="de">German</option>
            <option value="fr">French</option>
          </TextField>

          <Box>
            <Button type="submit" variant="contained" color="primary">
              Save Settings
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
