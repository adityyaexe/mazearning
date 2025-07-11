// src/api/apiClient.js
import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:5000/api/auth/login",
  headers: { "Content-Type": "application/json" },
});

// Add a request interceptor to attach the token automatically
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Or get from context
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
