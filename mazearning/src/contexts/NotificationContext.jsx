// src/contexts/NotificationContext.jsx

import React, {
  createContext,
  useCallback,
  useState,
  useRef,
} from "react";

import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

// Create Notification Context
const NotificationContext = createContext();

/**
 * NotificationProvider provides a global context for toast-like alerts.
 */
const NotificationProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("info"); // success, error, warning, info
  const timerRef = useRef(null);

  /**
   * Triggers the notification banner globally.
   * @param {string} msg - The message to be displayed.
   * @param {string} sev - Optional severity: success | error | info | warning
   */
  const showNotification = useCallback((msg, sev = "info") => {
    if (!msg) return;

    // Clear any previous snackbar queue
    clearTimeout(timerRef.current);

    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  }, []);

  const handleClose = (_, reason) => {
    if (reason === "clickaway") return;
    setOpen(false);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}

      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={severity}
          onClose={handleClose}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export { NotificationProvider, NotificationContext };
