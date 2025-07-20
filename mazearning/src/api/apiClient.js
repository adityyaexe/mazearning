// src/api/apiClient.js

import axios from "axios";

// ✅ BACKEND BASE URL — change per environment (dev / prod)
const baseURL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

// ✅ Create Axios instance
const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // optional: handles backend timeout gracefully
  withCredentials: false, // set true if backend sets httpOnly cookies
});

// ✅ REQUEST INTERCEPTOR: Automatically attaches Bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ RESPONSE INTERCEPTOR: Global error handling (401, 500, etc.)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error("[Network Error] No response from server");
      alert("Network error: Backend may be down or unreachable.");
    } else if (error.response.status === 401) {
      console.warn("❗ Unauthorized. Token expired or invalid.");

      // ✅ Optional: Centralized logout handling
      localStorage.removeItem("token");
      window.location.href = "/login"; // or route change using navigate()

    } else if (error.response.status >= 500) {
      alert("Server error. Please try again later.");
    }

    return Promise.reject(error);
  }
);

export default apiClient;
