// src/hooks/useNotification.js

import { useContext } from "react";
import { NotificationContext } from "../contexts/NotificationContext";

/**
 * Custom hook to access and use the global notification system.
 * Must be used inside a <NotificationProvider> tree.
 */
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
