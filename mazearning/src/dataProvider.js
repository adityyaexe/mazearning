// src/dataProvider.js

import simpleRestProvider from "ra-data-simple-rest";

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const httpClient = (url, options = {}) => {
  const headers = new Headers(
    options.headers || { Accept: "application/json" }
  );

  try {
    const raw = localStorage.getItem("admin_auth");
    const parsed = raw ? JSON.parse(raw) : null;

    if (parsed?.token) {
      headers.set("Authorization", `Bearer ${parsed.token}`);
    }
  } catch {
    console.warn("[dataProvider] Failed to parse admin_auth token."); // ✅ no unused 'e'
  }

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, {
    ...options,
    headers,
  }).then(async (response) => {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const message = error?.error || response.statusText || "API Error";
      throw new Error(message);
    }
    return response;
  });
};

const dataProvider = simpleRestProvider(`${API_BASE_URL}`, httpClient);

export default dataProvider;
