import apiClient from "../../api/apiClient";

export async function fetchApps({ page = 1, pageSize = 10, filter = "", sortKey = "name", sortOrder = "asc" }) {
  try {
    const response = await apiClient.get("/api/auth/apps", {
      params: {
        page,
        pageSize,
        filter,
        sortKey,
        sortOrder,
      },
    });
    return response.data; // Expect { data: [...], total: number }
  } catch (error) {
    console.error("Failed to fetch apps:", error);
    throw error;
  }
}
