// src/contexts/AuthContext.jsx

import React, { createContext, useState, useEffect } from "react";
import apiClient from "../api/apiClient";

// Load backend URL from environment variables or fallback
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// Create auth context
const AuthContext = createContext();

// AuthProvider supplies auth state to the entire app
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user profile on initial mount
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      apiClient
        .get(`${BACKEND_URL}/api/profile`)
        .then((res) => {
          const userData = res.data?.user || res.data;
          if (userData) {
            setUser(userData);
          } else {
            logout();
          }
        })
        .catch((err) => {
          console.warn("[Auth] Invalid token:", err.message);
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Login method
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (!data.token || !data.user) {
        throw new Error("Invalid login response");
      }

      localStorage.setItem("token", data.token);
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
      setUser(data.user);

      return data.user;
    } catch (err) {
      logout();
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout method
  const logout = () => {
    localStorage.removeItem("token");
    delete apiClient.defaults.headers.common["Authorization"];
    setUser(null);
    // Optionally notify backend
    // apiClient.post("/api/auth/logout").catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Export only the provider from this file
export { AuthProvider, AuthContext };
