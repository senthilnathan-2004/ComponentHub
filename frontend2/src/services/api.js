/* eslint-disable no-unused-vars */
// API Configuration
const API_BASE_URL = "http://localhost:8000/api";

// HTTP Client with token handling
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem("accessToken");

    const headers = {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    // Only set JSON if body is not FormData
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      console.log(" Request:", endpoint);
      console.log(" Method:", config.method || "GET");
      console.log(" Headers being sent:", config.headers);
      console.log(
        " Body type:",
        config.body ? config.body.constructor.name : "none"
      );

      if (config.body instanceof FormData) {
        console.log(" FormData entries:");
        for (const [key, value] of config.body.entries()) {
          if (value instanceof File) {
            console.log(
              `  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`
            );
          } else {
            console.log(`  ${key}: ${value}`);
          }
        }
      }

      if (response.status === 401) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          const newToken = localStorage.getItem("accessToken");
          config.headers.Authorization = `Bearer ${newToken}`;
          const retryResponse = await fetch(url, config);
          return this.handleResponse(retryResponse);
        } else {
          // Refresh failed, redirect to login
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login";
          throw new Error("Authentication failed");
        }
      }

      return this.handleResponse(response);
    } catch (error) {
      console.error(" API request failed:", error);
      throw error;
    }
  }

  async handleResponse(response) {
    let contentType;
    try {
      contentType = response?.headers?.get?.("content-type") || "";
    } catch (err) {
      contentType = "";
      console.log("No content-type header", err);
    }

    const isJson =
      contentType &&
      typeof contentType === "string" &&
      contentType.includes("application/json");

    let data;
    try {
      if (isJson) {
        data = await response.json();
      } else {
        const text = await response.text();
        // Check if it's HTML (likely an error page)
        if (text.includes("<!doctype") || text.includes("<html")) {
          throw new Error(
            "Server returned HTML instead of JSON - likely a server error or wrong endpoint"
          );
        }
        data = text;
      }
    } catch (parseError) {
      console.error("Error parsing response:", parseError);
      throw new Error("Invalid response format from server");
    }

    if (!response.ok) {
      const error = new Error(
        data?.error?.message ||
          data?.message ||
          `HTTP ${response.status}: ${response.statusText}`
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        return true;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
    }
    return false;
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { method: "GET", ...options });
  }

  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
      ...options,
    });
  }

  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
      ...options,
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { method: "DELETE", ...options });
  }

  upload(endpoint, formData, options = {}) {
    console.log(" [DEBUG] Upload method called");
    console.log(" [DEBUG] Endpoint:", endpoint);
    console.log(" [DEBUG] FormData:", formData);
    console.log(
      " [DEBUG] FormData entries count:",
      Array.from(formData.entries()).length
    );

    return this.request(endpoint, {
      method: "POST",
      body: formData,
      headers: {
        ...options.headers,
      },
    });
  }
}

const apiClient = new ApiClient(API_BASE_URL);

// Service layer
export const authService = {
  async login(email, password) {
    return apiClient.post("/auth/login", { email, password });
  },

  async register(userData) {
    return apiClient.post("/auth/register", userData);
  },

  async googleLogin(idToken) {
    return apiClient.post("/auth/google", { idToken });
  },

  async getProfile() {
    return apiClient.get("/auth/me");
  },

  async logout() {
    return apiClient.post("/auth/logout");
  },

  async updateProfile(profileData) {
    return apiClient.put("/auth/profile", profileData);
  },
};

export const componentService = {
  async getComponents(params) {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/components?${queryString}`);
  },

  async getComponent(id) {
    return apiClient.get(`/components/${id}`);
  },

  async getComponentReviews(id, params) {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/components/${id}/reviews?${queryString}`);
  },

  async createComponent(componentData) {
    return apiClient.post("/components", componentData);
  },

  async downloadComponent(componentId) {
    return apiClient.get(`/components/${componentId}/download`);
  },

  async uploadFiles(componentId, files) {
    console.log(" [DEBUG] componentService.uploadFiles called");
    console.log(" [DEBUG] Component ID:", componentId);
    console.log(" [DEBUG] Files:", files);
    console.log(" [DEBUG] Files length:", files.length);

    const formData = new FormData();

    Array.from(files).forEach((file, index) => {
      console.log(
        ` [DEBUG] Adding file ${index + 1}:`,
        file.name,
        file.size,
        file.type
      );
      formData.append("files", file);
    });

    console.log(" [DEBUG] FormData created with entries:");
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(
          `  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`
        );
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }

    return apiClient.upload(`/components/${componentId}/files`, formData);
  },

  async uploadScreenshots(componentId, files) {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("screenshots", file));
    return apiClient.upload(`/components/${componentId}/screenshots`, formData);
  },

  async deleteComponent(id) {
    return apiClient.delete(`/components/${id}`);
  },

  async updateComponent(componentId, componentData) {
    return apiClient.put(`/components/${componentId}`, componentData);
  },

  async publishComponent(componentId) {
    return apiClient.put(`/components/${componentId}/publish`);
  },

  async starComponent(componentId) {
    return apiClient.post(`/components/${componentId}/star`);
  },

  async submitComponentReview(id, reviewData) {
    return apiClient.post(`/components/${id}/reviews`, reviewData);
  },

  async downloadComponentZip(id) {
    const response = await apiClient.request(`/components/${id}/download-zip`, {
      method: "GET",
    });
    return response;
  },

  async reportComponent(payload) {
    return apiClient.post("/reports", payload);
  },

  async handleDownload(id) {
    return apiClient.post(`/components/${id}/download`);
  },

  async getDashboardTopRated() {
    return apiClient.get("/components/dashboard-top-rated");
  },
};

export const paymentService = {
  async purchaseComponent(purchaseData) {
    return apiClient.post("/payments/purchase", purchaseData);
  },

  async getPaymentMethods() {
    return apiClient.get("/payments/methods");
  },

  async createPaymentIntent(amount, currency = "usd") {
    return apiClient.post("/payments/intent", { amount, currency });
  },

  async getPaymentHistory() {
    return apiClient.get("/payments/history");
  },
};

export const dashboardService = {
  async getSellerStats(sellerId) {
    return apiClient.get(`/dashboard/seller/${sellerId}/stats`);
  },

  async getSellerById(sellerId) {
    return apiClient.get(`/dashboard/seller/${sellerId}`);
  },

  async getUserPurchases(userId) {
    return apiClient.get(`/dashboard/user/${userId}/purchases`);
  },

  async getUserFavorites(userId) {
    return apiClient.get(`/dashboard/user/${userId}/favorites`);
  },
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("adminToken");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

// Mock data imports
import { mockAdminData, mockReports } from "./mockData.js";

// Admin Data Fetching Functions
export const fetchAdminData = async () => {
  console.log("[v0] Attempting to fetch admin data...");

  // Check if we can reach the backend at all
  try {
    const testResponse = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(2000), // 2 second timeout
    });

    if (!testResponse.ok) {
      throw new Error("Backend not available");
    }
  } catch (error) {
    console.warn("[v0] Backend unavailable, using mock data for demonstration");
    return {
      stats: mockAdminData.stats,
      users: mockAdminData.users,
      components: mockAdminData.components,
      reviews: mockAdminData.reviews,
      purchases: mockAdminData.purchases,
    };
  }

  // If backend is available, try to fetch real data
  try {
    const headers = getAuthHeaders();

    const fetchWithFallback = async (url, fallbackData) => {
      try {
        const response = await fetch(url, {
          headers,
          signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
          return fallbackData;
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.warn(`Failed to fetch ${url}, using fallback data`);
        return fallbackData;
      }
    };

    const [stats, users, components, reviews, purchases] = await Promise.all([
      fetchWithFallback(`${API_BASE_URL}/admin/dashboard`, mockAdminData.stats),
      fetchWithFallback(`${API_BASE_URL}/admin/users?page=1&perPage=50`, {
        items: mockAdminData.users,
      }),
      fetchWithFallback(`${API_BASE_URL}/admin/components?page=1&perPage=50`, {
        items: mockAdminData.components,
      }),
      fetchWithFallback(`${API_BASE_URL}/admin/reviews?page=1&perPage=50`, {
        items: mockAdminData.reviews,
      }),
      fetchWithFallback(`${API_BASE_URL}/admin/purchases?page=1&perPage=50`, {
        items: mockAdminData.purchases,
      }),
    ]);

    return {
      stats: stats.overview || stats,
      users: users.items || users.users || mockAdminData.users,
      components:
        components.items || components.components || mockAdminData.components,
      reviews: reviews.items || reviews.reviews || mockAdminData.reviews,
      purchases:
        purchases.items || purchases.purchases || mockAdminData.purchases,
    };
  } catch (error) {
    console.error("Error fetching admin data:", error);
    console.warn("Falling back to mock data");

    return {
      stats: mockAdminData.stats,
      users: mockAdminData.users,
      components: mockAdminData.components,
      reviews: mockAdminData.reviews,
      purchases: mockAdminData.purchases,
    };
  }
};

// User Management Functions
export const handleUserAction = async (userId, action) => {
  try {
    const headers = getAuthHeaders();
    const endpoint =
      action === "suspend"
        ? "suspend"
        : action === "activate"
        ? "activate"
        : action;

    const response = await fetch(
      `${API_BASE_URL}/admin/users/${userId}/${endpoint}`,
      {
        method: "PUT",
        headers,
      }
    );

    return apiClient.handleResponse(response);
  } catch (error) {
    console.error(`Error ${action} user:`, error);
    throw error;
  }
};

export const updateUserRole = async (userId, role) => {
  try {
    const headers = getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ role }),
    });

    return apiClient.handleResponse(response);
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const headers = getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: "DELETE",
      headers,
    });

    return apiClient.handleResponse(response);
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

export const createUser = async (userData) => {
  try {
    const headers = getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: "POST",
      headers,
      body: JSON.stringify(userData),
    });

    return apiClient.handleResponse(response);
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const getUserDetails = async (userId) => {
  try {
    const headers = getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: "GET",
      headers,
    });

    return apiClient.handleResponse(response);
  } catch (error) {
    console.error("Error fetching user details:", error);
    throw error;
  }
};

// Component Management Functions
export const handleComponentAction = async (componentId, action, data = {}) => {
  try {
    const headers = getAuthHeaders();
    const endpoint =
      action === "approve"
        ? "approve"
        : action === "reject"
        ? "reject"
        : action;

    const response = await fetch(
      `${API_BASE_URL}/admin/components/${componentId}/${endpoint}`,
      {
        method: "PUT",
        headers,
        body: Object.keys(data).length > 0 ? JSON.stringify(data) : undefined,
      }
    );

    return apiClient.handleResponse(response);
  } catch (error) {
    console.error(`Error ${action} component:`, error);
    throw error;
  }
};

export const handleDeleteComponent = async (componentId) => {
  try {
    const headers = getAuthHeaders();

    const response = await fetch(
      `${API_BASE_URL}/admin/components/${componentId}`,
      {
        method: "DELETE",
        headers,
      }
    );

    return apiClient.handleResponse(response);
  } catch (error) {
    console.error("Error deleting component:", error);
    throw error;
  }
};

export const toggleComponentFeatured = async (componentId) => {
  try {
    const headers = getAuthHeaders();

    const response = await fetch(
      `${API_BASE_URL}/admin/components/${componentId}/featured`,
      {
        method: "PUT",
        headers,
      }
    );

    return apiClient.handleResponse(response);
  } catch (error) {
    console.error("Error toggling component featured status:", error);
    throw error;
  }
};

// Review Management Functions
export const handleReviewAction = async (reviewId, action) => {
  try {
    const headers = getAuthHeaders();
    const endpoint = action === "approve" ? "approve" : "flag";

    const response = await fetch(
      `${API_BASE_URL}/admin/reviews/${reviewId}/${endpoint}`,
      {
        method: "PUT",
        headers,
      }
    );

    return apiClient.handleResponse(response);
  } catch (error) {
    console.error(`Error ${action} review:`, error);
    throw error;
  }
};

export const deleteReview = async (reviewId) => {
  try {
    const headers = getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/admin/reviews/${reviewId}`, {
      method: "DELETE",
      headers,
    });

    return apiClient.handleResponse(response);
  } catch (error) {
    console.error("Error deleting review:", error);
    throw error;
  }
};

// Bulk Operations
export const handleBulkAction = async (type, action, ids) => {
  try {
    const headers = getAuthHeaders();
    const endpoint =
      type === "users"
        ? `/admin/users/bulk/${action}`
        : `/admin/components/bulk/${action}`;
    const body = type === "users" ? { userIds: ids } : { componentIds: ids };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });

    return apiClient.handleResponse(response);
  } catch (error) {
    console.error(`Error performing bulk ${action}:`, error);
    throw error;
  }
};

// Analytics and Statistics
export const fetchPlatformStatistics = async () => {
  try {
    const headers = getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/admin/statistics`, {
      headers,
    });
    return apiClient.handleResponse(response);
  } catch (error) {
    console.error("Error fetching platform statistics:", error);
    throw error;
  }
};

export const fetchRecentActivity = async (limit = 50) => {
  try {
    const headers = getAuthHeaders();

    const response = await fetch(
      `${API_BASE_URL}/admin/activity?limit=${limit}`,
      { headers }
    );
    return apiClient.handleResponse(response);
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    throw error;
  }
};

export const searchUsers = async (query, filters = {}) => {
  try {
    const headers = getAuthHeaders();
    const params = new URLSearchParams({
      search: query,
      ...filters,
      page: filters.page || 1,
      perPage: filters.perPage || 20,
    });

    const response = await fetch(`${API_BASE_URL}/admin/users?${params}`, {
      headers,
    });
    return apiClient.handleResponse(response);
  } catch (error) {
    console.error("Error searching users:", error);
    throw error;
  }
};

export const searchComponents = async (query, filters = {}) => {
  try {
    const headers = getAuthHeaders();
    const params = new URLSearchParams({
      search: query,
      ...filters,
      page: filters.page || 1,
      perPage: filters.perPage || 20,
    });

    const response = await fetch(`${API_BASE_URL}/admin/components?${params}`, {
      headers,
    });
    return apiClient.handleResponse(response);
  } catch (error) {
    console.error("Error searching components:", error);
    throw error;
  }
};

// Platform Settings Management Functions
export const updatePlatformSettings = async (settings) => {
  try {
    const headers = getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/admin/settings`, {
      method: "PUT",
      headers,
      body: JSON.stringify(settings),
    });

    return apiClient.handleResponse(response);
  } catch (error) {
    console.error("Error updating platform settings:", error);
    throw error;
  }
};

// Admin Service for centralized admin API calls
export const adminService = {
  async login(email, password) {
    console.log("[v0] Admin login attempt:", { email });
    try {
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      console.log("[v0] Admin login response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log("[v0] Admin login error response:", errorText);
        throw new Error(
          `Login failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("[v0] Admin login success:", {
        hasToken: !!data.token,
        hasAdmin: !!data.admin,
      });
      return data;
    } catch (error) {
      console.error("[v0] Admin login error:", error);
      if (error.message.includes("ERR_CONNECTION_REFUSED")) {
        throw new Error(
          "Cannot connect to server. Please ensure the server is running on port 8000."
        );
      }
      throw error;
    }
  },

  async getProfile() {
    return apiClient.get("/admin/profile");
  },

  async logout() {
    return apiClient.post("/admin/logout");
  },
};

// Report Service with fallbacks
export const reportService = {
  async getReports(params = {}) {
    try {
      const headers = getAuthHeaders();
      const queryString = new URLSearchParams(params).toString();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `${API_BASE_URL}/admin/reports?${queryString}`,
        {
          headers,
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      return apiClient.handleResponse(response);
    } catch (error) {
      console.warn("Backend unavailable for reports, using mock data");
      return {
        reports: mockReports,
        items: mockReports,
        total: mockReports.length,
        page: 1,
        perPage: 50,
      };
    }
  },

  async getReportById(reportId) {
    try {
      const headers = getAuthHeaders();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `${API_BASE_URL}/admin/reports/${reportId}`,
        {
          headers,
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      return apiClient.handleResponse(response);
    } catch (error) {
      const report = mockReports.find((r) => r._id === reportId);
      if (report) {
        return { report };
      }
      throw new Error("Report not found");
    }
  },

  async updateReportStatus(reportId, status, resolution = "") {
    try {
      const headers = getAuthHeaders();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `${API_BASE_URL}/admin/reports/${reportId}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ status, resolution }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      return apiClient.handleResponse(response);
    } catch (error) {
      console.warn("Backend unavailable, simulating report status update");
      return {
        message: `Report ${status} successfully (demo mode)`,
        success: true,
      };
    }
  },

  async deleteReport(reportId) {
    try {
      const headers = getAuthHeaders();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `${API_BASE_URL}/admin/reports/${reportId}`,
        {
          method: "DELETE",
          headers,
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      return apiClient.handleResponse(response);
    } catch (error) {
      console.warn("Backend unavailable, simulating report deletion");
      return {
        message: "Report deleted successfully (demo mode)",
        success: true,
      };
    }
  },

  async getReportStats() {
    try {
      const headers = getAuthHeaders();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_BASE_URL}/admin/reports/stats`, {
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return apiClient.handleResponse(response);
    } catch (error) {
      return {
        total: mockReports.length,
        pending: mockReports.filter((r) => r.status === "pending").length,
        investigating: mockReports.filter((r) => r.status === "investigating")
          .length,
        resolved: mockReports.filter((r) => r.status === "resolved").length,
      };
    }
  },
};

// Favorite Service
export const favoriteService = {
  async addToFavorites(componentId) {
    return apiClient.request("/favorites", {
      method: "POST",
      body: JSON.stringify({ componentId }),
    });
  },

  async removeFromFavorites(componentId) {
    return apiClient.request(`/favorites/${componentId}`, {
      method: "DELETE",
    });
  },

  async getUserFavorites(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.request(`/favorites${queryString ? `?${queryString}` : ""}`);
  },

  async checkFavorite(componentId) {
    return apiClient.request(`/favorites/check/${componentId}`);
  },
};

// Default export with all services
export default {
  fetchAdminData,
  handleUserAction,
  updateUserRole,
  deleteUser,
  createUser,
  getUserDetails,
  updatePlatformSettings,
  handleComponentAction,
  handleDeleteComponent,
  toggleComponentFeatured,
  handleReviewAction,
  deleteReview,
  handleBulkAction,
  fetchPlatformStatistics,
  fetchRecentActivity,
  searchUsers,
  searchComponents,
  adminService,
  reportService,
};
