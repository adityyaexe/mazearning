// mazearning/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // On mount, check for existing token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Optionally decode token or fetch user profile
      setUser({ token }); // Replace with real user info if needed
    }
  }, []);

  const login = async (email, password) => {
    // Replace with real API call
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error("Login failed");
    const { token, user } = await response.json();
    localStorage.setItem("token", token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
