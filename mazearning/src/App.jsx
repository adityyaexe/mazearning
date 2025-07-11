// mazearning/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import ProtectedRoute from "./components/ProtectedRoute";
import BottomNav from "./components/Navbar";

// Public Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Protected Pages
import Home from "./pages/Home";
import Apps from "./pages/Apps";
import Ads from "./pages/Ads";
import Wallet from "./pages/Wallet";
import Profile from "./pages/Profile";

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <Router>
          <div style={{ paddingBottom: 56 /* space for BottomNav */ }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              {/* Protected Routes */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/apps" element={<Apps />} />
                      <Route path="/ads" element={<Ads />} />
                      <Route path="/wallet" element={<Wallet />} />
                      <Route path="/profile" element={<Profile />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
          <BottomNav />
        </Router>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;
