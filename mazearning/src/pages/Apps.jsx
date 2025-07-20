// src/pages/Apps.jsx

import React from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  useTheme,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ListingTable from "../components/ListingTable";
import Header from "../components/Header";
import ScrollToTop from "../components/ScrollToTop";

// ✅ Mock Data — Replace with real API later
const appData = [
  {
    id: 1,
    icon: "/icons/app1.png",
    name: "Super App",
    description: "Earn by installing Super App!",
    size: "50MB",
    points: 100,
    rating: "4.5",
    completed: 1200,
    install_url: "https://play.google.com/store/apps/details?id=super.app",
  },
  {
    id: 2,
    icon: "/icons/app2.png",
    name: "Mega App",
    description: "Earn by installing Mega App!",
    size: "30MB",
    points: 80,
    rating: "4.2",
    completed: 950,
    install_url: "https://play.google.com/store/apps/details?id=mega.app",
  },
];

// Map apps to data table format
const prepareData = (apps = []) =>
  apps.map((app) => ({
    ...app,
    reward: `${app.points.toLocaleString()} mz pts`,
  }));

export default function Apps() {
  const theme = useTheme();
  const navigate = useNavigate();

  const columns = [
    {
      id: "icon",
      header: "Icon",
      cell: ({ row }) => (
        <img
          src={row.original.icon}
          alt={row.original.name ?? "App icon"}
          style={{ width: 40, height: 40, borderRadius: 8 }}
        />
      ),
    },
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
    },
    {
      id: "reward",
      header: "Reward",
      accessorKey: "reward",
      cell: ({ row }) => (
        <Typography fontWeight={600} color="primary">
          {row.original.reward}
        </Typography>
      ),
    },
    { id: "size", header: "Size", accessorKey: "size" },
    { id: "rating", header: "Rating", accessorKey: "rating" },
    {
      id: "completed",
      header: "Completed",
      accessorKey: "completed",
      cell: ({ row }) => `${row.original.completed.toLocaleString()} users`,
    },
    {
      id: "action",
      header: "Action",
      cell: ({ row }) => (
        <Button
          variant="contained"
          size="small"
          onClick={() => navigate(`/apps/${row.original.id}`)}
          sx={{
            textTransform: "none",
            fontWeight: 500,
            bgcolor: "primary.main",
            "&:hover": {
              bgcolor: "primary.dark",
              transform: "scale(1.05)",
            },
            transition: "all 0.25s ease-in-out",
          }}
        >
          View Offer
        </Button>
      ),
    },
  ];

  const data = prepareData(appData);

  return (
    <>
      <ScrollToTop />

      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: theme.palette.background.default,
          color: theme.palette.text.primary,
          px: { xs: 2, md: 4 },
          py: 4,
        }}
      >
        <Header title="📱 Available App Offers" />

        <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto" }}>
          <Paper
            elevation={3}
            sx={{
              p: { xs: 2, sm: 4 },
              borderRadius: 3,
              bgcolor: theme.palette.background.paper,
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              mb={3}
              textAlign="center"
            >
              Download and install these apps to earn Maze Tokens. The more you
              install, the more rewards you earn!
            </Typography>

            <Divider sx={{ mb: 3 }} />

            <Box sx={{ overflowX: "auto" }}>
              <ListingTable columns={columns} data={data} tableName="Apps Table" />
            </Box>
          </Paper>
        </Box>
      </Box>
    </>
  );
}
