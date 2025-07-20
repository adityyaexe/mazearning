// src/authProvider.js

/**
 * Custom React-Admin authProvider for Mazearning Admin
 */

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const AUTH_KEY = "admin_auth";

const authProvider = {
  /**
   * Called when the user attempts to log in
   * @param {Object} params - { username, password }
   */
  async login({ username, password }) {
    try {
      const response = await fetch(`${API_URL}/api/auth/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: username, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.token) {
        throw new Error(data.error || "Invalid credentials");
      }

      // ✅ Store user details + token
      localStorage.setItem(AUTH_KEY, JSON.stringify(data));
      return Promise.resolve();
    } catch (error) {
      console.error("[Admin Login Error]:", error);
      throw new Error(error.message || "Login failed");
    }
  },

  /**
   * Called when the user clicks logout
   */
  logout() {
    localStorage.removeItem(AUTH_KEY);
    return Promise.resolve();
  },

  /**
   * Called when the API returns an error
   * @param {{status: number}} error
   */
  checkError({ status }) {
    if (status === 401 || status === 403) {
      localStorage.removeItem(AUTH_KEY);
      return Promise.reject();
    }
    return Promise.resolve();
  },

  /**
   * Called on each route navigation
   */
  checkAuth() {
    const isLoggedIn = !!localStorage.getItem(AUTH_KEY);
    return isLoggedIn ? Promise.resolve() : Promise.reject({ redirectTo: "/login" });
  },

  /**
   * Returns current user identity for audit/sidebar/meta
   */
  getIdentity() {
    try {
      const stored = JSON.parse(localStorage.getItem(AUTH_KEY));
      if (!stored?.email) throw new Error("No identity");

      const { name = "Admin", email, role = "admin", avatar } = stored;
      return Promise.resolve({ id: email, fullName: name, email, role, avatar });
    } catch (err) {
      console.error("[Admin Get Identity Error]:", err); // ✅ log the unused error
      return Promise.reject("Identity error");
    }
  },

  /**
   * Role-based access check (optional)
   */
  canAccess() {
    return Promise.resolve(true); // ✅ removed unused 'params'
  },
};

export default authProvider;
