// my-admin-panel/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AdminLayout from "./components/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoutes from "./components/AdminRoutes";
import NotFound from "./pages/NotFound"; // Optional 404 page

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect "/" to "/login" or "/admin/dashboard" as your choice */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminRoutes />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all 404 page for unmatched routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
