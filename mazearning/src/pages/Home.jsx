// src/pages/Home.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Skeleton,
  Alert,
  useTheme,
  Grow,
  Fade,
  Chip,
  Avatar,
} from "@mui/material";
import Header from "../components/Header";
import ScrollToTop from "../components/ScrollToTop";
import { useNotification } from "../contexts/NotificationContext";
import apiClient from "../api/apiClient";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import BoltIcon from "@mui/icons-material/Bolt";
import AppsIcon from "@mui/icons-material/Apps";
import AdUnitsIcon from "@mui/icons-material/AdUnits";

export default function Home() {
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const theme = useTheme();
  const mode = theme.palette.mode;

  const taskSuggestions = [
    { id: 1, label: "Watch 2 Ads for Bonus", action: "/ads" },
    { id: 2, label: "Try a New App Offer", action: "/apps" },
    { id: 3, label: "Complete a Quick Task", action: "/quick-earn" },
  ];

  const offerCategories = [
    { title: "Surveys", icon: BoltIcon, action: "/surveys" },
    { title: "Apps", icon: AppsIcon, action: "/apps" },
    { title: "Ads", icon: AdUnitsIcon, action: "/ads" },
  ];

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const [profileRes, walletRes, recentRes] = await Promise.all([
          apiClient.get("/profile"),
          apiClient.get("/wallet"),
          apiClient.get("/users/me/activity/recent"),
        ]);

        setProfile(profileRes.data || {});
        setWallet(walletRes.data || {});
        setRecent(recentRes.data || []);
        setError(false);
      } catch (err) {
        console.error("Error fetching home data:", err);
        showNotification("Failed to load dashboard data.", "error");
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [showNotification]);

  return (
    <>
      <ScrollToTop />

      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: mode === "dark" ? "#121212" : "#f9f9f9",
          color: mode === "dark" ? "#f5f5f5" : "#000",
          transition: "all 0.3s ease-in-out",
          px: { xs: 2, sm: 3, md: 5 },
          py: 4,
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <Header title={`Welcome${profile?.name ? `, ${profile.name}` : ""}!`} />

        <Box sx={{ width: "100%", maxWidth: "1200px", mx: "auto" }}>
          {/* 🎯 Wallet & Suggested Tasks */}
          <Grid container spacing={3} mb={5}>
            <Grid item xs={12} md={4}>
              <Grow in timeout={400}>
                <Card
                  sx={{
                    bgcolor: "primary.main",
                    color: "#fff",
                    borderRadius: 3,
                    "&:hover": { transform: "translateY(-4px)" },
                    transition: "0.3s",
                  }}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2}>
                      <MonetizationOnIcon fontSize="large" />
                      <Box>
                        <Typography fontSize={14}>Wallet Balance</Typography>
                        <Typography variant="h5" fontWeight={700}>
                          {loading ? <Skeleton width={80} /> : `${wallet?.balance ?? 0} MZ`}
                        </Typography>
                      </Box>
                    </Box>

                    <Button
                      variant="contained"
                      fullWidth
                      sx={{
                        mt: 2,
                        bgcolor: "rgba(255,255,255,0.2)",
                        color: "#fff",
                        fontWeight: 600,
                      }}
                      onClick={() => navigate("/wallet")}
                    >
                      View Wallet
                    </Button>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>

            <Grid item xs={12} md={8}>
              <Fade in timeout={600}>
                <Card sx={{ borderRadius: 3, p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    🔥 Suggested For You
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {taskSuggestions.map((task) => (
                      <Chip
                        key={task.id}
                        label={task.label}
                        clickable
                        variant="outlined"
                        onClick={() => navigate(task.action)}
                      />
                    ))}
                  </Box>
                </Card>
              </Fade>
            </Grid>
          </Grid>

          {/* 🧩 Offer Categories */}
          <Box mb={5}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              🧩 Offer Categories
            </Typography>
            <Grid container spacing={3}>
              {offerCategories.map((cat, i) => (
                <Grid key={i} item xs={12} sm={4}>
                  <Card
                    onClick={() => navigate(cat.action)}
                    sx={{
                      borderRadius: 3,
                      p: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      bgcolor: mode === "dark" ? "#1e1e1e" : "#fff",
                      "&:hover": {
                        transform: "scale(1.02)",
                        boxShadow: 4,
                      },
                    }}
                  >
                    <Avatar>
                      <cat.icon />
                    </Avatar>
                    <Typography fontWeight={600}>{cat.title}</Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* 🔁 Recent Activity */}
          <Box mb={5}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              🧵 Recent Activity
            </Typography>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                {loading ? (
                  <>
                    <Skeleton height={30} />
                    <Skeleton height={30} sx={{ mt: 1 }} />
                  </>
                ) : error ? (
                  <Alert severity="error">Failed to load activity.</Alert>
                ) : recent.length === 0 ? (
                  <Typography color="text.secondary">
                    No recent activity logged.
                  </Typography>
                ) : (
                  <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
                    {recent.map((item, i) => (
                      <Box
                        key={i}
                        display="flex"
                        alignItems="center"
                        gap={1.5}
                        px={1}
                        py={1}
                        borderBottom="1px dashed #ccc"
                      >
                        <Avatar
                          sx={{
                            bgcolor: item.points > 0 ? "success.main" : "error.main",
                            width: 32,
                            height: 32,
                            fontSize: 14,
                          }}
                        >
                          {item.points > 0 ? "+" : "-"}
                        </Avatar>
                        <Box>
                          <Typography fontSize={14}>{item.description}</Typography>
                          <Typography fontSize={12} color="text.secondary">
                            {new Date(item.date).toLocaleString()} ·{" "}
                            <b>{item.points > 0 ? `+${item.points}` : item.points} pt</b>
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    </>
  );
}
