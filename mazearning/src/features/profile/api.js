// src/features/profile/api.js
import apiClient from "../../api/apiClient";

export async function fetchUserProfile() {
  const response = await apiClient.get("/api/auth/profile");
  return response.data;
}
