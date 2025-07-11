// src/components/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { Card, CardContent, Typography, Grid, Box } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import apiClient from "../api/apiClient"; // Your axios instance with auth

export default function Dashboard() {
  const [stats, setStats] = useState({
    users: 0,
    apps: 0,
    ads: 0,
    earnings: 0,
    installs: [],
    adRevenue: [],
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await apiClient.get("/api/auth/admin/dashboard-stats");
        setStats(res.data);
      } catch {
        // Optionally show notification
      }
    }
    fetchStats();
  }, []);

  return (
    <Box sx={{ px: { xs: 1, md: 3 } }}>
      <Grid container columns={12} spacing={2}>
        <Grid sx={{ gridColumn: { xs: "span 6", md: "span 3" } }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Users</Typography>
              <Typography variant="h4">{stats.users}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid sx={{ gridColumn: { xs: "span 6", md: "span 3" } }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Apps</Typography>
              <Typography variant="h4">{stats.apps}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid sx={{ gridColumn: { xs: "span 6", md: "span 3" } }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Ads</Typography>
              <Typography variant="h4">{stats.ads}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid sx={{ gridColumn: { xs: "span 6", md: "span 3" } }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Earnings</Typography>
              <Typography variant="h4">₹{stats.earnings}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container columns={12} spacing={2} sx={{ mt: 2 }}>
        <Grid sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
          <Card>
            <CardContent>
              <Typography variant="h6">App Installs (Last 7 Days)</Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.installs}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Ad Revenue (Last 7 Days)</Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.adRevenue}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#388e3c" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
