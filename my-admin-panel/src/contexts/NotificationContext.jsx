// my-admin-panel/src/contexts/NotificationContext.jsx
import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { Snackbar, Alert, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const NotificationContext = createContext({
  showNotification: () => {},
});

export const NotificationProvider = ({ children }) => {
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);

  // Show notification by adding to queue
  const showNotification = useCallback(({ message, severity = "info", duration = 4000, action = null }) => {
    setQueue((q) => [...q, { message, severity, duration, action, key: new Date().getTime() }]);
  }, []);

  // When current is empty and queue has items, set current to first in queue
  React.useEffect(() => {
    if (current === null && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue((q) => q.slice(1));
    }
  }, [queue, current]);

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      // Ignore clickaway to prevent accidental closing
      return;
    }
    setCurrent(null);
  };

  // Memoize context value for perf
  const contextValue = useMemo(() => ({ showNotification }), [showNotification]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {current && (
        <Snackbar
          key={current.key}
          open={true}
          autoHideDuration={current.duration}
          onClose={handleClose}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          aria-live="assertive"
        >
          <Alert
            onClose={handleClose}
            severity={current.severity}
            sx={{ width: "100%" }}
            action={
              <>
                {current.action}
                <IconButton aria-label="close" color="inherit" size="small" onClick={handleClose}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </>
            }
            elevation={6}
            variant="filled"
          >
            {current.message}
          </Alert>
        </Snackbar>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider.");
  }
  return context;
};
