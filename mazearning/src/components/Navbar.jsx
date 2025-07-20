// src/components/NavBar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import {
  AppBar,
  useTheme,
  useMediaQuery,
  Box,
  Tooltip,
} from "@mui/material";

import HomeIcon from "@mui/icons-material/Home";
import AppsIcon from "@mui/icons-material/Apps";
import AdUnitsIcon from "@mui/icons-material/AdUnits";
import WalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ProfileIcon from "@mui/icons-material/AccountCircle";

const navItems = [
  { label: "Home", path: "/", icon: <HomeIcon fontSize="medium" /> },
  { label: "Apps", path: "/apps", icon: <AppsIcon fontSize="medium" /> },
  { label: "Ads", path: "/ads", icon: <AdUnitsIcon fontSize="medium" /> },
  { label: "Wallet", path: "/wallet", icon: <WalletIcon fontSize="medium" /> },
  { label: "Profile", path: "/profile", icon: <ProfileIcon fontSize="medium" /> },
];

export default function NavBar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <AppBar
      position="fixed"
      color="default"
      elevation={2}
      sx={{
        top: "auto",
        bottom: 0,
        borderTop: `1px solid ${theme.palette.divider}`,
        zIndex: theme.zIndex.drawer + 1,
      }}
    >
      <Box
        display="flex"
        justifyContent="center"
        px={2}
        py={1}
        sx={{ maxWidth: 600, mx: "auto" }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: isMobile ? 2 : 4,
            width: "100%",
          }}
        >
          {navItems.map(({ label, path, icon }) => (
            <Tooltip key={label} title={label} arrow disableFocusListener>
              <NavLink
                to={path}
                end={path === "/"}
                aria-label={label}
                style={({ isActive }) => ({
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  color: isActive
                    ? theme.palette.primary.main
                    : theme.palette.text.secondary,
                  textDecoration: "none",
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  transition: "all 0.3s ease",
                })}
              >
                {icon}
                <span style={{ marginTop: 2 }}>{label}</span>
              </NavLink>
            </Tooltip>
          ))}
        </Box>
      </Box>
    </AppBar>
  );
}
