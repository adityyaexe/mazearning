// my-admin-panel/src/components/ProtectedRoute.jsx
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { AuthContext, useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children, fallback = null }) {
  // Defensive: allow useAuth hook or context usage here
  let auth;
  try {
    auth = useAuth();
  } catch (error) {
    // If useAuth throws because outside provider, you can handle it or rethrow
    console.error("[ProtectedRoute] useAuth hook error:", error);
    return <Navigate to="/login" replace />;
  }

  const { user, loading } = auth;

  if (loading) {
    return fallback || (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
        }}
        aria-label="Loading authentication state"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
