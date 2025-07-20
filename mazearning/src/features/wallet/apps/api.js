// mazearning/src/features/wallet/apps/api.js

import apiClient from "../../api/apiClient";

/**
 * Fetch paginated list of apps with optional filtering and sorting.
 *
 * @param {object} options
 * @param {number} options.page - Page number (starts at 1)
 * @param {number} options.pageSize - Page size (default 10)
 * @param {string} [options.filter] - Filter keyword
 * @param {string} [options.sortKey] - Column to sort by
 * @param {string} [options.sortOrder] - Sort direction ("asc" | "desc")
 * @returns {Promise<{ data: Array, total: number }>}
 */
export async function fetchApps({
  page = 1,
  pageSize = 10,
  filter = "",
  sortKey = "name",
  sortOrder = "asc",
} = {}) {
  try {
    const response = await apiClient.get("/api/auth/apps", {
      params: {
        page,
        pageSize,
        ...(filter ? { filter } : {}),
        ...(sortKey ? { sortKey } : {}),
        ...(sortOrder ? { sortOrder } : {}),
      },
    });

    const { data, total } = response.data;

    if (!Array.isArray(data) || typeof total !== "number") {
      throw new Error("Invalid response structure from /apps API");
    }

    return { data, total };
  } catch (error) {
    const message =
      error?.response?.data?.error || "Failed to load apps";
    console.error("[wallet/apps/api] fetchApps error:", message);
    throw new Error(message);
  }
}
