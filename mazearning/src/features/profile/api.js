// src/features/profile/api.js

import apiClient from "../../api/apiClient";

/**
 * Fetch current authenticated user's profile data
 * @returns {Object} user - user profile object
 * @throws {Error} if request fails or response is invalid
 */
export async function fetchUserProfile() {
  try {
    const response = await apiClient.get("/profile");

    // You might get { user: { name, email }} or direct profile object
    const data = response?.data;

    if (!data || (typeof data !== "object")) {
      throw new Error("Invalid user profile response.");
    }

    return data.user || data;
  } catch (error) {
    console.error("[fetchUserProfile] Failed to fetch profile:", error);
    throw new Error(
      error?.response?.data?.error || "Failed to load user profile"
    );
  }
}
