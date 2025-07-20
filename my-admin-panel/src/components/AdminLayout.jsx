// my-admin-panel/src/components/AdminLayout.jsx
import React, { memo } from "react";
import { Outlet } from "react-router-dom";
import { Box, Toolbar, useMediaQuery, useTheme } from "@mui/material";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import AppBreadcrumbs from "./Breadcrumbs";

const drawerWidth = 240;

function AdminLayout() {
  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up("sm"));

  // For responsiveness, drawer width can be dynamic if needed:
  const currentDrawerWidth = isSmUp ? drawerWidth : 0;

  return (
    <Box sx={{ display: "flex" }}>
      <Navbar />
      <Sidebar />
      <Box
        component="main"
        role="main"
        aria-label="Admin main content"
        sx={{
          flexGrow: 1,
          p: 3,
          width: `calc(100% - ${currentDrawerWidth}px)`,
          mt: 8, // Offset for app bar height
          minHeight: "100vh",
          bgcolor: theme.palette.background.default,
          color: theme.palette.text.primary,
          transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {/* Toolbar spacer for fixed navbar offset */}
        <Toolbar />
        <AppBreadcrumbs />
        {/* Outlet renders matched child routes */}
        <Outlet />
      </Box>
    </Box>
  );
}

export default memo(AdminLayout);
