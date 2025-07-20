// src/routes/MainAppLayout.jsx

import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import BottomNav from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";

// Public Pages
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";

// Protected Pages
import Home from "../pages/Home";
import Apps from "../pages/Apps";
import AppDetails from "../pages/AppDetails";
import Ads from "../pages/Ads";
import Surveys from "../pages/Surveys";
import Wallet from "../pages/Wallet";
import Profile from "../pages/Profile";
import QuickEarn from "../pages/QuickEarn";

// Optional fallback / 404
// import NotFound from "../pages/NotFound";

export default function MainAppLayout() {
  const location = useLocation();

  const authHiddenRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];

  const isNavHidden = authHiddenRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  return (
    <>
      {/* Main outlet with push-up spacing for BottomNav (except on login routes) */}
      <div style={{ paddingBottom: isNavHidden ? 0 : 56 }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quick-earn"
            element={
              <ProtectedRoute>
                <QuickEarn />
              </ProtectedRoute>
            }
          />
          <Route
            path="/apps"
            element={
              <ProtectedRoute>
                <Apps />
              </ProtectedRoute>
            }
          />
          <Route
            path="/apps/:id"
            element={
              <ProtectedRoute>
                <AppDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ads"
            element={
              <ProtectedRoute>
                <Ads />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/surveys"
            element={
              <ProtectedRoute>
                <Surveys />
              </ProtectedRoute>
            }
          />

          {/* Optionally handle 404 */}
          {/* <Route path="*" element={<NotFound />} /> */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>

      {/* ✅ BottomNav (shown only on protected routes) */}
      {!isNavHidden && <BottomNav />}
    </>
  );
}
