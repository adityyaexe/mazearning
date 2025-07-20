// my-admin-panel/src/pages/Dashboard.jsx
import React from "react";
import { Box, Grid, Paper, Typography, Stack } from "@mui/material";
import Header from "../components/Header";

// Dummy KPI data for demo purposes
const kpis = [
  { label: "Total Users", value: 1245 },
  { label: "Active Subscriptions", value: 982 },
  { label: "New Customers", value: 58 },
  { label: "Support Tickets", value: 13 },
];

// Sample recent activities
const recentActivities = [
  { id: 1, user: "Alice", action: "Created a new subscription", time: "2 hours ago" },
  { id: 2, user: "Bob", action: "Updated user role", time: "4 hours ago" },
  { id: 3, user: "Charlie", action: "Canceled subscription", time: "1 day ago" },
];

export default function Dashboard() {
  return (
    <Box>
      <Header title="Dashboard" />

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* KPI Cards */}
        {kpis.map((kpi) => (
          <Grid item xs={12} sm={6} md={3} key={kpi.label}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: 120,
              }}
              role="region"
              aria-label={`KPI: ${kpi.label}`}
            >
              <Typography variant="h5" fontWeight="bold" color="primary">
                {kpi.value}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {kpi.label}
              </Typography>
            </Paper>
          </Grid>
        ))}

        {/* Charts and other dashboard widgets */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={3}
            sx={{ p: 3, height: 360 }}
            role="region"
            aria-label="Sales chart"
          >
            <Typography variant="h6" gutterBottom>
              Sales Over Time
            </Typography>
            {/* TODO: Insert your chart component here */}
            <Box
              sx={{
                mt: 2,
                height: "100%",
                bgcolor: "grey.100",
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "grey.500",
                fontStyle: "italic",
              }}
            >
              Chart placeholder
            </Box>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{ p: 3, height: 360, overflowY: "auto" }}
            role="region"
            aria-label="Recent activity"
          >
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Stack spacing={2}>
              {recentActivities.map(({ id, user, action, time }) => (
                <Box key={id} sx={{ borderBottom: 1, borderColor: "divider", pb: 1 }}>
                  <Typography variant="body1">
                    <strong>{user}</strong> {action}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {time}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
