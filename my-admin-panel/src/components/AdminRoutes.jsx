// my-admin-panel/src/components/AdminRoutes.jsx
import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

// Lazy load route components for code splitting
const Dashboard = lazy(() => import("../pages/Dashboard"));
const UserRoles = lazy(() => import("../pages/UserRoles"));
const UserManagement = lazy(() => import("../pages/UserManagement"));
const Customers = lazy(() => import("../pages/Customers"));
const AutoResponse = lazy(() => import("../pages/AutoResponse"));
const Subscriptions = lazy(() => import("../pages/Subscriptions"));
// NotFound page for unmatched routes
const NotFound = lazy(() => import("../pages/NotFound"));

export default function AdminRoutes() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mt: 4,
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <Routes>
        {/* Redirect /admin or /admin/* to /admin/dashboard */}
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="user-roles" element={<UserRoles />} />
        <Route path="user-management" element={<UserManagement />} />
        <Route path="customers" element={<Customers />} />
        <Route path="auto-response" element={<AutoResponse />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        {/* Catch all unmatched routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
