// my-admin-panel/src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import apiClient from "../api/apiClient.js";

const AuthContext = createContext({
  user: null,
  login: async () => {},
  logout: () => {},
  loading: true,
  error: null,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Manage Authorization header in apiClient
  const setAuthHeader = useCallback((token) => {
    if (token) {
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete apiClient.defaults.headers.common["Authorization"];
    }
  }, []);

  // Initialize auth state, fetch user if token exists
  useEffect(() => {
    const initializeAuth = async () => {
      if (!token) {
        setUser(null);
        setAuthHeader(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setAuthHeader(token);

      try {
        const res = await apiClient.get("/profile");
        setUser(res.data);
        setError(null);
      } catch (err) {
        // Handle expired/invalid token by resetting state
        setUser(null);
        setToken(null);
        localStorage.removeItem("token");
        setAuthHeader(null);
        setError("Session expired. Please login again.");
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [token, setAuthHeader]);

  // Login function to authenticate and fetch profile
  const login = async (credentials) => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.post("/auth/login", credentials);
      const newToken = res.data.token;

      if (!newToken) throw new Error("No token returned from login");

      setToken(newToken);
      localStorage.setItem("token", newToken);
      setAuthHeader(newToken);

      // Fetch and set user profile right after login
      const profileRes = await apiClient.get("/profile");
      setUser(profileRes.data);

      setError(null);
      return profileRes.data;
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Login failed");
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      setAuthHeader(null);
      throw err; // rethrow so callers can catch if needed
    } finally {
      setLoading(false);
    }
  };

  // Logout function clears all auth data
  const logout = () => {
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem("token");
    setAuthHeader(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { AuthContext };
