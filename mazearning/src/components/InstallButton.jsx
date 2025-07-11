// src/components/InstallButton.jsx
import React, { useState } from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { useNotification } from "../contexts/NotificationContext";
import apiClient from "../api/apiClient"; // Your axios instance

/**
 * InstallButton Component
 * @param {string|number} appId - The app's unique ID
 * @param {function} [onInstalled] - Optional callback after successful install
 * @param {string} [label] - Button label (default: "Install")
 * @param {object} [buttonProps] - Additional props for the MUI Button
 */
export default function InstallButton({ appId, onInstalled, label = "Install", buttonProps = {} }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const { showNotification } = useNotification();

  const handleInstall = async () => {
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      // Replace with your real endpoint
      await apiClient.post(`/apps/${appId}/install`);
      setSuccess(true);
      showNotification("App installed! Points credited.", "success");
      if (onInstalled) onInstalled();
    } catch (err) {
      setError("Install failed. Please try again.");
      showNotification("Failed to install app.", "error");
    } finally {
      setLoading(false);
      // Reset success state after a short delay for UX
      setTimeout(() => setSuccess(false), 2000);
    }
  };

  return (
    <Button
      variant="contained"
      color={success ? "success" : error ? "error" : "primary"}
      onClick={handleInstall}
      disabled={loading || success}
      startIcon={
        loading ? <CircularProgress size={18} color="inherit" /> :
        success ? <CheckCircleIcon /> :
        error ? <ErrorIcon /> : null
      }
      aria-label={label}
      {...buttonProps}
    >
      {loading
        ? "Installing..."
        : success
        ? "Installed"
        : error
        ? "Retry"
        : label}
    </Button>
  );
}
