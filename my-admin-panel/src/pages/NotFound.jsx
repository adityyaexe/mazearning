// my-admin-panel/src/pages/NotFound.jsx
import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        height: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        px: 2,
      }}
      role="main"
      aria-labelledby="notfound-heading"
    >
      <Typography id="notfound-heading" variant="h2" component="h1" gutterBottom>
        404
      </Typography>
      <Typography variant="h5" color="text.secondary" gutterBottom>
        Oops! The page you are looking for doesn&apos;t exist.
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        It might have been moved or deleted.
      </Typography>
      {/* Optional image or illustration */}
      <Box
        component="img"
        src="/images/404-illustration.svg"
        alt="Page not found illustration"
        sx={{ width: { xs: "60%", sm: "40%" }, mb: 4 }}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate("/admin/dashboard")}
        aria-label="Go back to dashboard"
      >
        Back to Dashboard
      </Button>
    </Box>
  );
}
