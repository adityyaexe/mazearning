// my-admin-panel/src/components/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Drawer,
  Toolbar,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import GroupIcon from "@mui/icons-material/Group";
import SettingsIcon from "@mui/icons-material/Settings";

const defaultDrawerWidth = 240;

const menuItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/admin/dashboard" },
  { text: "User Roles", icon: <PeopleIcon />, path: "/admin/user-roles" },
  { text: "User Management", icon: <GroupIcon />, path: "/admin/user-management" },
  { text: "Settings", icon: <SettingsIcon />, path: "/admin/settings" },
];

export default function Sidebar({
  drawerWidth = defaultDrawerWidth,
  mobileOpen = false,
  onMobileClose = () => {},
}) {
  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up("sm"));

  // Drawer content component
  const drawerContent = (
    <>
      <Toolbar />
      <Box sx={{ overflowY: "auto", flexGrow: 1 }}>
        <List component="nav" aria-label="Main sidebar navigation">
          {menuItems.map(({ text, icon, path }) => (
            <ListItemButton
              key={text}
              component={NavLink}
              to={path}
              onClick={!isSmUp ? onMobileClose : undefined}
              sx={{
                "&.active": {
                  backgroundColor: "primary.main",
                  color: "primary.contrastText",
                  "& .MuiListItemIcon-root": {
                    color: "inherit",
                  },
                },
                "&:hover": {
                  backgroundColor: "action.hover",
                },
                textTransform: "capitalize",
              }}
            >
              <ListItemIcon sx={{ color: "inherit" }}>{icon}</ListItemIcon>
              <ListItemText primary={text} />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </>
  );

  return (
    // Responsive Drawer
    <>
      {/* Temporary drawer for mobile */}
      {!isSmUp && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onMobileClose}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
          aria-label="Sidebar navigation"
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Permanent drawer for desktop */}
      {isSmUp && (
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
          aria-label="Sidebar navigation"
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
}
