// mazearining/src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { Box, Grid, Card, CardContent, Typography, Button, Skeleton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import { useNotification } from "../contexts/NotificationContext";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import BoltIcon from "@mui/icons-material/Bolt";
import AppsIcon from "@mui/icons-material/Apps";
import AdUnitsIcon from "@mui/icons-material/AdUnits";

export default function Home() {
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [profileRes, walletRes, recentRes] = await Promise.all([
          apiClient.get("/api/auth/profile"),
          apiClient.get("/api/auth/wallet"),
          apiClient.get("/api/auth/activity/recent"),
        ]);
        setProfile(profileRes.data);
        setWallet(walletRes.data);
        setRecent(recentRes.data);
      } catch {
        showNotification("Failed to load dashboard data.", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [showNotification]);

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant="h4" fontWeight={700} mb={2}>
        Welcome{profile ? `, ${profile.name}` : ""}!
      </Typography>

      <Grid container columns={12} spacing={2} mb={2}>
        <Grid sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
          <Card sx={{ bgcolor: "#1976d2", color: "#fff" }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <MonetizationOnIcon fontSize="large" />
                <Box>
                  <Typography variant="subtitle2">Wallet Balance</Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {loading ? <Skeleton width={80} /> : `${wallet?.balance ?? 0} mz pts`}
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                color="secondary"
                size="small"
                sx={{ mt: 2 }}
                onClick={() => navigate("/wallet")}
              >
                View Wallet
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid sx={{ gridColumn: { xs: "span 12", md: "span 8" } }}>
          <Grid container columns={12} spacing={2}>
            <Grid sx={{ gridColumn: { xs: "span 6", md: "span 4" } }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1}>
                    <BoltIcon color="primary" />
                    <Typography fontWeight={600}>Quick Earn</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Complete a quick task for instant rewards.
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ mt: 1 }}
                    onClick={() => navigate("/quick-earn")}
                  >
                    Try Now
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid sx={{ gridColumn: { xs: "span 6", md: "span 4" } }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1}>
                    <AppsIcon color="primary" />
                    <Typography fontWeight={600}>Install Apps</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Earn by trying new apps.
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ mt: 1 }}
                    onClick={() => navigate("/apps")}
                  >
                    See Apps
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1}>
                    <AdUnitsIcon color="primary" />
                    <Typography fontWeight={600}>Watch Ads</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Watch videos or ads for rewards.
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ mt: 1 }}
                    onClick={() => navigate("/ads")}
                  >
                    Watch Now
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Box mt={3}>
        <Typography variant="h6" fontWeight={600} mb={1}>
          Recent Activity
        </Typography>
        <Card>
          <CardContent>
            {loading ? (
              <Skeleton height={40} />
            ) : recent.length === 0 ? (
              <Typography color="text.secondary">No recent activity yet.</Typography>
            ) : (
              <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                {recent.map((item, idx) => (
                  <li key={idx}>
                    <Typography variant="body2">
                      {item.description}{" "}
                      <span style={{ color: "#1976d2" }}>
                        {item.points > 0 ? `+${item.points}` : item.points} mz pts
                      </span>{" "}
                      <span style={{ color: "#888", fontSize: 12 }}>
                        ({new Date(item.date).toLocaleString()})
                      </span>
                    </Typography>
                  </li>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
