// my-admin-panel/src/components/Breadcrumbs.jsx
import React from "react";
import { Breadcrumbs, Link, Typography } from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";

const breadcrumbNameMap = {
  dashboard: "Dashboard",
  "user-roles": "User Roles",
  "user-management": "User Management",
  customers: "Customers",
  "auto-response": "Auto Response",
  subscriptions: "Subscriptions",
  settings: "Settings",
};

export default function AppBreadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname
    .toLowerCase()
    .replace(/^\/admin\/?/, "") // remove leading /admin or /admin/
    .split("/")
    .filter((x) => x);

  // Compose breadcrumbs starting path /admin
  // e.g. for /admin/user-management/details, crumbs are:
  // ["user-management", "details"] with base "/admin"

  return (
    <Breadcrumbs
      aria-label="breadcrumb"
      sx={{ mb: 2, px: 3 }}
      maxItems={6}
      itemsAfterCollapse={2}
      itemsBeforeCollapse={2}
      separator="›"
    >
      {/* Always show Home pointing to /admin/dashboard unless already there */}
      {(pathnames.length === 0 || pathnames[0] !== "dashboard") && (
        <Link
          underline="hover"
          color="inherit"
          component={RouterLink}
          to="/admin/dashboard"
          sx={{ textTransform: "capitalize" }}
        >
          Home
        </Link>
      )}

      {pathnames.map((segment, index) => {
        // Build path link with /admin prefixed
        const to = `/admin/${pathnames.slice(0, index + 1).join("/")}`;

        // Check if last element in crumbs
        const isLast = index === pathnames.length - 1;

        // Get friendly display name or fallback
        const name = breadcrumbNameMap[segment] || segment.replace(/-/g, " ");

        return isLast ? (
          <Typography
            key={to}
            color="text.primary"
            aria-current="page"
            sx={{ textTransform: "capitalize", fontWeight: "bold" }}
          >
            {name}
          </Typography>
        ) : (
          <Link
            key={to}
            underline="hover"
            color="inherit"
            component={RouterLink}
            to={to}
            sx={{ textTransform: "capitalize" }}
          >
            {name}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}
