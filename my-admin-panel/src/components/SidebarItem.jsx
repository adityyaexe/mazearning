// my-admin-panel/src/components/Sidebaritem.jsx
import React from "react";
import PropTypes from "prop-types";
import { NavLink } from "react-router-dom";
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material";

export default function SidebarItem({ to, icon, label, onClick }) {
  return (
    <ListItemButton
      component={NavLink}
      to={to}
      onClick={onClick}
      sx={{
        textTransform: "capitalize",
        "&.active": {
          backgroundColor: (theme) => theme.palette.primary.main,
          color: (theme) => theme.palette.primary.contrastText,
          "& .MuiListItemIcon-root": {
            color: "inherit",
          },
          fontWeight: "bold",
        },
        "&:hover": {
          backgroundColor: (theme) => theme.palette.action.hover,
        },
      }}
      aria-label={`Go to ${label}`}
    >
      {icon && <ListItemIcon sx={{ color: "inherit" }}>{icon}</ListItemIcon>}
      <ListItemText primary={label} />
    </ListItemButton>
  );
}

SidebarItem.propTypes = {
  to: PropTypes.string.isRequired,
  icon: PropTypes.node,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

SidebarItem.defaultProps = {
  icon: null,
  onClick: () => {},
};
