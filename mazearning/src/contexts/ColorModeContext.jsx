// src/contexts/ColorModeContext.jsx

import React, {
  createContext,
  useState,
  useEffect,
  useMemo
} from "react";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline, GlobalStyles } from "@mui/material";

// Create context
const ColorModeContext = createContext();

// Theme provider component
const ColorModeProvider = ({ children }) => {
  const [mode, setMode] = useState("light");
  const [mounted, setMounted] = useState(false);

  // On mount: detect system theme or localStorage value
  useEffect(() => {
    const storedMode = localStorage.getItem("colorMode");

    if (storedMode === "light" || storedMode === "dark") {
      setMode(storedMode);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setMode(prefersDark ? "dark" : "light");
    }

    setMounted(true);
  }, []);

  // Create theme dynamically
  const theme = useMemo(() => {
    return createTheme({
      palette: {
        mode,
        ...(mode === "dark"
          ? {
            background: {
              default: "#121212",
              paper: "#23272e",
            },
            text: {
              primary: "#ffffff",
              secondary: "#b0bec5",
            },
          }
          : {
            background: {
              default: "#ffffff",
              paper: "#f9fafe",
            },
            text: {
              primary: "#222222",
              secondary: "#616161",
            },
          }),
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              transition: "all 0.35s ease-in-out",
              backgroundColor: mode === "dark" ? "#121212" : "#ffffff",
              color: mode === "dark" ? "#f5f5f5" : "#000000",
            },
          },
        },
      },
    });
  }, [mode]);

  // Toggle color mode + persist in localStorage
  const toggleColorMode = () => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("colorMode", next);
      return next;
    });
  };

  // Prevent flicker before mount
  if (!mounted) return null;

  return (
    <ColorModeContext.Provider value={{ mode, toggleColorMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles
          styles={{
            "*": {
              transition: "background-color 0.35s ease, color 0.35s ease",
            },
          }}
        />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export { ColorModeProvider, ColorModeContext };
