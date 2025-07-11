// mazearning/src/contexts/NotificationContext.jsx
import React, { createContext, useContext, useState, useCallback } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("info"); // "success", "error", "warning", "info"

  const showNotification = useCallback((msg, sev = "info") => {
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
      <Snackbar open={open} autoHideDuration={4000} onClose={handleClose} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert onClose={handleClose} severity={severity} sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}
