// src/components/InstallButton.jsx

import React, { useState } from "react";
import PropTypes from "prop-types";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { useNotification } from "../contexts/NotificationContext";
import apiClient from "../api/apiClient";

/**
 * InstallButton Component
 *
 * Props:
 * - appId (string|number): ID of the app to install
 * - onInstalled (func): Callback function after successful install
 * - label (string): Button label (default: "Install")
 * - buttonProps (object): Additional props to pass to the button
 */

export default function InstallButton({
  appId,
  onInstalled,
  label = "Install",
  buttonProps = {},
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const { showNotification } = useNotification();

  const handleInstall = async () => {
    if (!appId) {
      showNotification("Missing app ID", "error");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Send install request
      await apiClient.post(`/apps/${appId}/install`);
      setSuccess(true);
      showNotification("App installed successfully! 🎉", "success");

      if (onInstalled) {
        onInstalled();
      }

      // Reset success after a delay
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error("Install Error:", err);
      setError("Failed to install.");
      showNotification("Failed to install app. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="contained"
      color={success ? "success" : error ? "error" : "primary"}
      onClick={handleInstall}
      disabled={loading || success}
      startIcon={
        loading ? (
          <CircularProgress size={18} color="inherit" />
        ) : success ? (
          <CheckCircleIcon />
        ) : error ? (
          <ErrorIcon />
        ) : null
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

// ✅ Type Checking
InstallButton.propTypes = {
  appId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onInstalled: PropTypes.func,
  label: PropTypes.string,
  buttonProps: PropTypes.object,
};

// ✅ Defaults
InstallButton.defaultProps = {
  onInstalled: null,
  label: "Install",
  buttonProps: {},
};
