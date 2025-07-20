// src/pages/Ads.jsx

import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  useTheme,
  Paper,
  Divider,
} from "@mui/material";

import AdCard from "../components/AdCard";
import Header from "../components/Header";
import ScrollToTop from "../components/ScrollToTop";

const initialAds = [
  {
    id: 1,
    partnerIcon: "/icons/partner1.png",
    partnerName: "BrandX",
    description: "Watch a 30s video and earn instantly!",
    points: 20,
    adType: "Video",
    completed: 560,
    isFavorite: false,
  },
  {
    id: 2,
    partnerIcon: "/icons/partner2.png",
    partnerName: "AppNow",
    description: "Watch and download to earn more points!",
    points: 35,
    adType: "App Install",
    completed: 320,
    isFavorite: true,
  },
  {
    id: 3,
    partnerIcon: "/icons/partner3.png",
    partnerName: "PromoCast",
    description: "30-second short ad sponsored by PromoCast.",
    points: 15,
    adType: "Shorts",
    completed: 780,
    isFavorite: false,
  },
];

export default function Ads() {
  const [ads, setAds] = useState(initialAds);
  const theme = useTheme();

  const toggleFavorite = (adId) => {
    setAds((prev) =>
      prev.map((ad) =>
        ad.id === adId ? { ...ad, isFavorite: !ad.isFavorite } : ad
      )
    );
  };

  const handleWatch = (partnerName) => {
    alert(`🎬 Opening ad from ${partnerName}...`);
  };

  return (
    <>
      <ScrollToTop />

      <Box
        sx={{
          width: "100%",
          minHeight: "100vh",
          bgcolor: theme.palette.background.default,
          color: theme.palette.text.primary,
          px: { xs: 2, sm: 3, md: 6 },
          py: { xs: 3, md: 5 },
          boxSizing: "border-box",
        }}
      >
        <Header title="📺 Watch Ads & Earn" />

        <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto" }}>
          <Paper
            elevation={3}
            sx={{
              borderRadius: 3,
              p: { xs: 2, md: 4 },
              bgcolor: theme.palette.background.paper,
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              mb={3}
              textAlign="center"
              sx={{ maxWidth: 600, mx: "auto" }}
              aria-label="Page introduction"
            >
              Watch short video ads from our trusted partners and get rewarded
              instantly with Maze Tokens.
            </Typography>

            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              {ads.map((ad) => (
                <Grid item xs={12} sm={6} md={4} key={ad.id}>
                  <AdCard
                    {...ad}
                    onWatch={() => handleWatch(ad.partnerName)}
                    onFavorite={() => toggleFavorite(ad.id)}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>
      </Box>
    </>
  );
}
