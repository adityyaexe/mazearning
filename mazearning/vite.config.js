// vite.config.js

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// You can add process.env.VITE_BACKEND_URL logic for dynamic proxying in the future if relevant
const DEV_API_PROXY = "http://localhost:5000";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy API requests in dev (frontend http://localhost:5173 → backend http://localhost:5000)
      "/api": {
        target: DEV_API_PROXY,
        changeOrigin: true,      // Handles CORS during local dev
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, "/api"), // Preserves base /api
      },
    },
    host: "0.0.0.0",             // Allows LAN/devices access if needed
    port: 5173,                  // Default Vite port, override as needed
    open: true,                  // Auto-opens in browser on dev start
  },
  preview: {
    port: 5174,
    open: true,
  },
});
