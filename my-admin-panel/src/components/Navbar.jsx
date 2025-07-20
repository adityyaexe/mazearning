// my-admin-panel/src/components/Navbar.jsx
import React from "react";
import { AppBar, Toolbar, Typography, Box, IconButton, useTheme } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

const drawerWidth = 240;

export default function Navbar({ title = "Admin Panel", onMenuClick, actions = null }) {
  const theme = useTheme();

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
        zIndex: theme.zIndex.drawer + 1,
        boxShadow: theme.shadows[4],
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }}
      aria-label="Primary navigation"
    >
      <Toolbar>
        {/* Menu button — shown on smaller screens to toggle sidebar */}
        {onMenuClick && (
          <IconButton
            color="inherit"
            edge="start"
            aria-label="open drawer"
            onClick={onMenuClick}
            sx={{ mr: 2, display: { sm: "none" } }}
            size="large"
          >
            <MenuIcon />
          </IconButton>
        )}

        <Typography
          variant="h6"
          noWrap
          component="h1"
          sx={{ flexGrow: 1, userSelect: "none" }}
          tabIndex={0}
        >
          {title}
        </Typography>

        {/* Right side actions, e.g. user avatar, notifications */}
        {actions && <Box sx={{ display: "flex", alignItems: "center" }}>{actions}</Box>}
      </Toolbar>
    </AppBar>
  );
}
