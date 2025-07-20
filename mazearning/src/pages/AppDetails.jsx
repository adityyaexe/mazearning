// src/pages/AppDetails.jsx

import React from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Avatar,
  Button,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import ScrollToTop from "../components/ScrollToTop"; // Optional

// 🔁 This mock data will be replaced with an API call in future
const appDetails = {
  1: {
    id: 1,
    icon: "/icons/app1.png",
    name: "Super App",
    description:
      "Install Super App and complete tasks to earn Maze Points. Explore the app for 2 minutes to qualify.",
    steps: [
      "Click 'Install' now.",
      "Open Super App & create an account.",
      "Stay active in app for at least 2 minutes.",
      "Return here and receive your reward.",
    ],
    points: 100,
    installUrl: "https://play.google.com/store/apps/details?id=super.app",
  },
  2: {
    id: 2,
    icon: "/icons/app2.png",
    name: "Mega App",
    description: "Try Mega App — get rewarded just for exploring!",
    steps: [
      "Install using the link below.",
      "Launch Mega App after install.",
      "Use for 2+ minutes.",
      "Come back and confirm to claim reward.",
    ],
    points: 80,
    installUrl: "https://play.google.com/store/apps/details?id=mega.app",
  },
};

export default function AppDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const app = appDetails[id];

  if (!app) {
    return (
      <Box sx={{ textAlign: "center", mt: 6, px: 3 }}>
        <Typography variant="h6" color="error" gutterBottom>
          🚫 App Not Found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          The app you're looking for doesn't exist or has been removed.
        </Typography>
        <Button variant="outlined" onClick={() => navigate("/apps")}>
          Back to Offers
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        px: { xs: 2, md: 4 },
        py: 4,
        boxSizing: "border-box",
      }}
    >
      <ScrollToTop />

      <Header title={`📲 ${app.name} Offer Details`} />

      <Box sx={{ maxWidth: 900, mx: "auto", transition: "all 0.3s ease" }}>
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, md: 4 },
            borderRadius: 3,
            bgcolor: theme.palette.background.paper,
          }}
        >
          {/* App Header Section */}
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Avatar src={app.icon} sx={{ width: 60, height: 60 }} />
            <Typography variant="h5" fontWeight={700}>
              {app.name}
            </Typography>
          </Box>

          {/* Description */}
          <Typography variant="body1" color="text.secondary" mb={2}>
            {app.description || "No description available for this app."}
          </Typography>

          <Divider sx={{ my: 3 }} />

          {/* Instructions Block */}
          <Paper
            sx={{
              bgcolor: theme.palette.mode === "dark" ? "#1e1e1e" : "#e3f2fd",
              p: 2,
              borderRadius: 2,
              border: "1px dashed",
              borderColor: theme.palette.primary.light,
              mb: 3,
            }}
          >
            <Typography variant="subtitle1">
              🎯 Earn{" "}
              <strong>{app.points?.toLocaleString() || 0}</strong> Maze Points by
              completing the following steps:
            </Typography>
          </Paper>

          {/* Step List */}
          <Box component="ol" sx={{ pl: 3, mb: 3 }}>
            {Array.isArray(app.steps) && app.steps.length > 0 ? (
              app.steps.map((step, index) => (
                <li key={index}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {step}
                  </Typography>
                </li>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No instructions provided.
              </Typography>
            )}
          </Box>

          {/* Action Buttons */}
          <Box
            display="flex"
            flexDirection={isMobile ? "column" : "row"}
            gap={2}
            mt={2}
          >
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth={isMobile}
              href={app.installUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              🚀 Install & Earn {app.points?.toLocaleString() || 0} pts
            </Button>

            <Button
              variant="outlined"
              onClick={() => navigate("/apps")}
              startIcon={<ArrowBackIcon />}
              fullWidth={isMobile}
            >
              Back to Offers
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
