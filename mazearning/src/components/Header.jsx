// src/components/Header.jsx

import React, { useState, useRef } from "react";
import {
  Box,
  Typography,
  IconButton,
  ClickAwayListener,
  Popper,
  Fade,
  Paper,
  MenuList,
  MenuItem,
  Divider,
  ListItemIcon,
  useTheme,
  useMediaQuery,
} from "@mui/material";

import SettingsIcon from "@mui/icons-material/Settings";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

import { useColorMode } from "../contexts/ColorModeContext";
import { useNavigate } from "react-router-dom";

export default function Header({ title = "Dashboard", showSettings = true }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const anchorRef = useRef(null);
  const { toggleColorMode, mode } = useColorMode();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const handleSettingsToggle = () => setSettingsOpen((prev) => !prev);
  const handleClickAway = () => setSettingsOpen(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      mb={3}
      flexDirection={isMobile ? "column" : "row"}
      gap={isMobile ? 2 : 0}
    >
      {/* Title */}
      <Typography
        variant={isMobile ? "h6" : "h5"}
        fontWeight={700}
        color={mode === "dark" ? "#90caf9" : "primary.main"}
      >
        {title}
      </Typography>

      {/* Controls: Dark Mode + Settings */}
      <Box display="flex" gap={1}>
        {/* Theme Toggle */}
        <IconButton
          onClick={toggleColorMode}
          aria-label="Toggle dark mode"
          sx={{
            color: mode === "dark" ? "#fff" : "#222",
            bgcolor: mode === "dark" ? "#2c2c2c" : "#e3e6ee",
            borderRadius: 2,
            "&:hover": {
              bgcolor: mode === "dark" ? "#333" : "#dee2f9",
            },
          }}
        >
          {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>

        {/* Settings / Profile */}
        {showSettings && (
          <ClickAwayListener onClickAway={handleClickAway}>
            <Box position="relative">
              <IconButton
                onClick={handleSettingsToggle}
                ref={anchorRef}
                aria-label="Open settings"
                sx={{
                  color: mode === "dark" ? "#fff" : "#222",
                  bgcolor: mode === "dark" ? "#2c2c2c" : "#e3e6ee",
                  borderRadius: 2,
                  "&:hover": {
                    bgcolor: mode === "dark" ? "#333" : "#dee2f9",
                  },
                }}
              >
                <SettingsIcon />
              </IconButton>

              <Popper
                open={settingsOpen}
                anchorEl={anchorRef.current}
                placement="bottom-end"
                transition
                disablePortal
              >
                {({ TransitionProps }) => (
                  <Fade {...TransitionProps} timeout={200}>
                    <Paper
                      sx={{
                        mt: 1,
                        px: 1,
                        minWidth: 180,
                        boxShadow: 4,
                        borderRadius: 2,
                      }}
                      elevation={3}
                    >
                      <MenuList>
                        <MenuItem onClick={() => navigate("/profile")}>
                          <ListItemIcon>
                            <PersonIcon fontSize="small" />
                          </ListItemIcon>
                          Profile
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={handleLogout}>
                          <ListItemIcon>
                            <LogoutIcon fontSize="small" />
                          </ListItemIcon>
                          Logout
                        </MenuItem>
                      </MenuList>
                    </Paper>
                  </Fade>
                )}
              </Popper>
            </Box>
          </ClickAwayListener>
        )}
      </Box>
    </Box>
  );
}
