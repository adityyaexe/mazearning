// my-admin-panel/src/contexts/ColorModeContext.jsx
import React, { createContext, useState, useMemo, useEffect, useContext } from "react";

const ColorModeContext = createContext({
  mode: "light",
  toggleColorMode: () => {},
});

export const ColorModeProvider = ({ children }) => {
  // Determine initial mode from localStorage or system preference
  const getInitialMode = () => {
    if (typeof window === "undefined") return "light"; // SSR safe
    const storedMode = localStorage.getItem("color-mode");
    if (storedMode === "light" || storedMode === "dark") {
      return storedMode;
    }
    // System preference fallback
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  };

  const [mode, setMode] = useState(getInitialMode);

  // Persist mode to localStorage on change
  useEffect(() => {
    localStorage.setItem("color-mode", mode);
  }, [mode]);

  // Toggle function
  const toggleColorMode = useMemo(
    () => () => {
      setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
    },
    []
  );

  // Memoized context value for better performance
  const contextValue = useMemo(() => ({ mode, toggleColorMode }), [mode, toggleColorMode]);

  return <ColorModeContext.Provider value={contextValue}>{children}</ColorModeContext.Provider>;
};

// Custom hook for easy consumption
export const useColorMode = () => {
  const context = useContext(ColorModeContext);
  if (!context) {
    throw new Error("useColorMode must be used within a ColorModeProvider");
  }
  return context;
};
