/* eslint-disable no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Package,
  DollarSign,
  TrendingUp,
  Eye,
  Trash2,
  Check,
  LogOut,
  Settings,
  Shield,
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
  UserX,
  UserCheck,
  Ban,
  CheckCircle,
  Edit,
  Save,
  X,
  Flag,
} from "lucide-react";

import {
  fetchAdminData,
  handleUserAction,
  handleComponentAction,
  handleDeleteComponent,
  handleReviewAction,
  handleBulkAction,
  deleteUser,
  updateUserRole,
  adminService,
  reportService, // Added for reports
} from "../services/api.js";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [components, setComponents] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQueries, setSearchQueries] = useState({
    users: "",
    components: "",
    reports: "",
  });
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedItems, setSelectedItems] = useState([]);

  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "buyer",
  });
  const [platformSettings, setPlatformSettings] = useState({
    commissionRate: 10,
    maxFileSize: 50,
    emailNotifications: {
      newUsers: true,
      componentSubmissions: true,
      dailyReports: false,
    },
  });

  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Fetch admin data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      const data = await fetchAdminData();
      setStats(data.stats);
      setUsers(data.users);
      setComponents(data.components);
      setReviews(data.reviews);
      setPurchases(data.purchases);

      try {
        const reportsData = await reportService.getReports({
          page: 1,
          perPage: 50,
        });
        setReports(reportsData.reports || reportsData.items || []);
      } catch (error) {
        console.error("Error fetching reports:", error);
        setReports([]);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
      // Only set error if it's not a connection issue (which is handled by mock data)
      if (
        !error.message.includes("fetch") &&
        !error.message.includes("Failed to fetch")
      ) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await adminService.logout();
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminRefreshToken");
      window.location.reload();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:8000/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        showNotification("User added successfully!");
        setShowAddUserModal(false);
        setNewUser({ name: "", email: "", password: "", role: "buyer" });
        fetchData();
      } else {
        const error = await response.json();
        showNotification(`Failed to add user: ${error.message}`, "error");
      }
    } catch (error) {
      showNotification("Failed to add user. Please try again.", "error");
    }
  };

  const handleDeleteUser = async (userId) => {
    const user = users.find((u) => u._id === userId);
    setDeleteConfirmation({
      type: "user",
      id: userId,
      name: user?.name,
      message: `Are you sure you want to delete user "${user?.name}"? This action cannot be undone.`,
    });
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserDetailsModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser({ ...user });
  };

  const handleSaveUserEdit = async () => {
    try {
      await updateUserRole(editingUser._id, editingUser.role);
      showNotification("User updated successfully!");
      setEditingUser(null);
      fetchData();
    } catch (error) {
      if (
        error.message.includes("fetch") ||
        error.message.includes("Failed to fetch")
      ) {
        showNotification("User updated successfully (demo mode)!");
        setEditingUser(null);
      } else {
        showNotification("Failed to update user. Please try again.", "error");
      }
    }
  };

  const handleSaveSettings = async () => {
    try {
      // In a real app, this would save to the backend
      showNotification("Settings saved successfully!");
    } catch (error) {
      showNotification("Failed to save settings. Please try again.", "error");
    }
  };

  const getAnalyticsData = () => {
    const totalRevenue = stats.totalRevenue || 0;
    const totalUsers = stats.totalUsers || 0;
    const totalComponents = stats.totalComponents || 0;
    const activeUsers = stats.activeUsers || 0;

    return {
      revenueGrowth:
        totalRevenue > 0 ? ((totalRevenue / 1000) * 12).toFixed(1) : "0",
      userGrowth:
        totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : "0",
      componentApprovalRate:
        totalComponents > 0
          ? (
              ((stats.publishedComponents || 0) / totalComponents) *
              100
            ).toFixed(1)
          : "0",
      avgRating: "4.2",
    };
  };

  const handleUserActionClick = async (userId, action) => {
    try {
      const result = await handleUserAction(userId, action);
      showNotification(
        result.message || `User ${action}ed successfully (demo mode)`
      );
      fetchData(); // Refresh data
    } catch (error) {
      if (
        error.message.includes("fetch") ||
        error.message.includes("Failed to fetch")
      ) {
        showNotification(`User ${action}ed successfully (demo mode)`);
      } else {
        showNotification(
          `Failed to ${action} user. Please try again.`,
          "error"
        );
      }
    }
  };

  const handleComponentActionClick = async (componentId, action) => {
    try {
      const data =
        action === "reject"
          ? { rejectionReason: "Component does not meet platform standards" }
          : {};

      const result = await handleComponentAction(componentId, action, data);
      showNotification(
        result.message || `Component ${action}ed successfully (demo mode)`
      );
      fetchData(); // Refresh data
    } catch (error) {
      if (
        error.message.includes("fetch") ||
        error.message.includes("Failed to fetch")
      ) {
        showNotification(`Component ${action}ed successfully (demo mode)`);
      } else {
        showNotification(
          `Failed to ${action} component. Please try again.`,
          "error"
        );
      }
    }
  };

  const handleDeleteComponentClick = async (componentId) => {
    const component = components.find((c) => c._id === componentId);
    setDeleteConfirmation({
      type: "component",
      id: componentId,
      name: component?.title,
      message: `Are you sure you want to permanently delete "${component?.title}"? This action cannot be undone and will remove all associated data including purchases and reviews.`,
    });
  };

  const handleReviewActionClick = async (reviewId, action) => {
    try {
      const result = await handleReviewAction(reviewId, action);
      showNotification(
        result.message || `Review ${action}ed successfully (demo mode)`
      );
      fetchData(); // Refresh data
    } catch (error) {
      if (
        error.message.includes("fetch") ||
        error.message.includes("Failed to fetch")
      ) {
        showNotification(`Review ${action}ed successfully (demo mode)`);
      } else {
        showNotification(
          `Failed to ${action} review. Please try again.`,
          "error"
        );
      }
    }
  };

  const handleBulkActionClick = async (type, action, ids) => {
    if (ids.length === 0) {
      showNotification("Please select items to perform bulk action", "warning");
      return;
    }

    const confirmMessage = `Are you sure you want to ${action} ${ids.length} ${type}(s)?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      const result = await handleBulkAction(type, action, ids);
      showNotification(
        result.message || `Bulk ${action} completed successfully (demo mode)`
      );
      setSelectedItems([]);
      fetchData();
    } catch (error) {
      if (
        error.message.includes("fetch") ||
        error.message.includes("Failed to fetch")
      ) {
        showNotification(`Bulk ${action} completed successfully (demo mode)`);
        setSelectedItems([]);
      } else {
        showNotification(
          `Failed to perform bulk ${action}. Please try again.`,
          "error"
        );
      }
    }
  };

  const handleReportAction = async (reportId, status, resolution = "") => {
    try {
      const result = await reportService.updateReportStatus(
        reportId,
        status,
        resolution
      );
      showNotification(result.message || `Report ${status} successfully!`);
      fetchData(); // Refresh data
    } catch (error) {
      showNotification(
        `Failed to ${status} report. Please try again.`,
        "error"
      );
    }
  };

  const handleDeleteReport = async (reportId) => {
    const report = reports.find((r) => r._id === reportId);
    setDeleteConfirmation({
      type: "report",
      id: reportId,
      name: "this report",
      message:
        "Are you sure you want to delete this report? This action cannot be undone.",
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;

    try {
      if (deleteConfirmation.type === "user") {
        await deleteUser(deleteConfirmation.id);
        showNotification("User deleted successfully!");
      } else if (deleteConfirmation.type === "component") {
        const result = await handleDeleteComponent(deleteConfirmation.id);
        showNotification(result.message || "Component deleted successfully!");
      } else if (deleteConfirmation.type === "report") {
        const result = await reportService.deleteReport(deleteConfirmation.id);
        showNotification(result.message || "Report deleted successfully!");
      }
      fetchData();
    } catch (error) {
      if (
        error.message.includes("fetch") ||
        error.message.includes("Failed to fetch")
      ) {
        showNotification(
          `${
            deleteConfirmation.type.charAt(0).toUpperCase() +
            deleteConfirmation.type.slice(1)
          } deleted successfully (demo mode)!`
        );
        fetchData();
      } else {
        showNotification(
          `Failed to delete ${deleteConfirmation.type}. Please try again.`,
          "error"
        );
      }
    } finally {
      setDeleteConfirmation(null);
    }
  };

  const NotificationCard = () => {
    if (!notification) return null;

    const getNotificationStyles = (type) => {
      const baseStyles = {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 9999,
        padding: "20px 24px",
        borderRadius: "12px",
        boxShadow:
          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        minWidth: "300px",
        maxWidth: "500px",
        textAlign: "center",
        fontSize: "16px",
        fontWeight: "500",
        animation: "slideIn 0.3s ease-out",
      };

      switch (type) {
        case "success":
          return {
            ...baseStyles,
            backgroundColor: "#10b981",
            color: "white",
            border: "2px solid #059669",
          };
        case "error":
          return {
            ...baseStyles,
            backgroundColor: "#ef4444",
            color: "white",
            border: "2px solid #dc2626",
          };
        case "warning":
          return {
            ...baseStyles,
            backgroundColor: "#f59e0b",
            color: "white",
            border: "2px solid #d97706",
          };
        default:
          return {
            ...baseStyles,
            backgroundColor: "#1a7f37",
            color: "white",
            border: "2px solid #1f883d",
          };
      }
    };

    return (
      <>
        <style>
          {`
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translate(-50%, -60%);
              }
              to {
                opacity: 1;
                transform: translate(-50%, -50%);
              }
            }
          `}
        </style>
        <div style={getNotificationStyles(notification.type)}>
          {notification.message}
        </div>
      </>
    );
  };

  const AddUserModal = () =>
    showAddUserModal && (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "24px",
            width: "400px",
            maxWidth: "90vw",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h3
              style={{ fontSize: "18px", fontWeight: "600", color: "#111827" }}
            >
              Add New User
            </h3>
            <button
              onClick={() => setShowAddUserModal(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#6b7280",
              }}
            >
              <X style={{ height: "20px", width: "20px" }} />
            </button>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "8px",
                }}
              >
                Name
              </label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "8px",
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "8px",
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "8px",
                }}
              >
                Role
              </label>
              <select
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                  backgroundColor: "#ffffff",
                }}
              >
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "24px",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={() => setShowAddUserModal(false)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#f3f4f6",
                color: "#374151",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAddUser}
              style={{
                padding: "8px 16px",
                background: "#1f883d",
                color: "#111827",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Add User
            </button>
          </div>
        </div>
      </div>
    );

  const UserDetailsModal = () =>
    showUserDetailsModal &&
    selectedUser && (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "24px",
            width: "500px",
            maxWidth: "90vw",
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h3
              style={{ fontSize: "18px", fontWeight: "600", color: "#111827" }}
            >
              User Details
            </h3>
            <button
              onClick={() => setShowUserDetailsModal(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#6b7280",
              }}
            >
              <X style={{ height: "20px", width: "20px" }} />
            </button>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  height: "60px",
                  width: "60px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #1f883d, #1a7f37)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "24px",
                    fontWeight: "500",
                    color: "#ffffff",
                  }}
                >
                  {selectedUser.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h4
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#111827",
                    margin: 0,
                  }}
                >
                  {selectedUser.name}
                </h4>
                <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
                  {selectedUser.email}
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Role
                </label>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#111827",
                    margin: "4px 0 0 0",
                  }}
                >
                  {selectedUser.role}
                </p>
              </div>
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Status
                </label>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#111827",
                    margin: "4px 0 0 0",
                  }}
                >
                  {selectedUser.isActive ? "Active" : "Suspended"}
                </p>
              </div>
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Components
                </label>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#111827",
                    margin: "4px 0 0 0",
                  }}
                >
                  {selectedUser.stats?.componentCount || 0}
                </p>
              </div>
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Total Earned
                </label>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#111827",
                    margin: "4px 0 0 0",
                  }}
                >
                  ${selectedUser.stats?.totalEarned || 0}
                </p>
              </div>
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Joined
                </label>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#111827",
                    margin: "4px 0 0 0",
                  }}
                >
                  {new Date(selectedUser.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Last Active
                </label>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#111827",
                    margin: "4px 0 0 0",
                  }}
                >
                  {selectedUser.lastActive
                    ? new Date(selectedUser.lastActive).toLocaleDateString()
                    : "Never"}
                </p>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "24px",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={() => handleDeleteUser(selectedUser._id)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#dc2626",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Delete User
            </button>
            <button
              onClick={() => setShowUserDetailsModal(false)}
              style={{
                padding: "8px 16px",
                background: "#1f883d",
                color: "#111827",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );

  const DashboardStats = () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "24px",
        marginBottom: "32px",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
          borderRadius: "20px",
          border: "2px solid #f0f0f0",
          padding: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: "#666",
                marginBottom: "8px",
              }}
            >
              Total Users
            </p>
            <p
              style={{ fontSize: "30px", fontWeight: "700", color: "#111827" }}
            >
              {stats.totalUsers || 0}
            </p>
          </div>
          <Users style={{ height: "48px", width: "48px", color: "#1f883d" }} />
        </div>
        <p style={{ fontSize: "14px", color: "#059669", marginTop: "8px" }}>
          +{stats.newUsersThisMonth || 0} this month | {stats.activeUsers || 0}{" "}
          active
        </p>
      </div>

      <div
        style={{
          background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
          borderRadius: "20px",
          border: "2px solid #f0f0f0",
          padding: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: "#666",
                marginBottom: "8px",
              }}
            >
              Components
            </p>
            <p
              style={{ fontSize: "30px", fontWeight: "700", color: "#111827" }}
            >
              {stats.totalComponents || 0}
            </p>
          </div>
          <Package
            style={{ height: "48px", width: "48px", color: "#1a7f37" }}
          />
        </div>
        <p style={{ fontSize: "14px", color: "#d97706", marginTop: "8px" }}>
          {stats.pendingComponents || 0} pending |{" "}
          {stats.publishedComponents || 0} published
        </p>
      </div>

      <div
        style={{
          background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
          borderRadius: "20px",
          border: "2px solid #f0f0f0",
          padding: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: "#666",
                marginBottom: "8px",
              }}
            >
              Revenue
            </p>
            <p
              style={{ fontSize: "30px", fontWeight: "700", color: "#111827" }}
            >
              ${stats.totalRevenue || 0}
            </p>
          </div>
          <DollarSign
            style={{ height: "48px", width: "48px", color: "#1a7f37" }}
          />
        </div>
        <p style={{ fontSize: "14px", color: "#059669", marginTop: "8px" }}>
          ${stats.avgOrderValue || 0} avg order | {stats.totalPurchases || 0}{" "}
          sales
        </p>
      </div>

      <div
        style={{
          background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
          borderRadius: "20px",
          border: "2px solid #f0f0f0",
          padding: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: "#666",
                marginBottom: "8px",
              }}
            >
              Reviews
            </p>
            <p
              style={{ fontSize: "30px", fontWeight: "700", color: "#111827" }}
            >
              {stats.totalReviews || 0}
            </p>
          </div>
          <TrendingUp
            style={{ height: "48px", width: "48px", color: "#1a7f37" }}
          />
        </div>
        <p style={{ fontSize: "14px", color: "#1a7f37", marginTop: "8px" }}>
          Platform engagement metrics
        </p>
      </div>
    </div>
  );

  const UsersManagement = () => {
    const filteredUsers = users.filter((user) => {
      const matchesFilter =
        filterStatus === "all" ||
        (filterStatus === "active" && user.isActive) ||
        (filterStatus === "suspended" && !user.isActive) ||
        user.role === filterStatus;

      if (!searchQueries.users) return matchesFilter;

      const matchesSearch =
        user.name?.toLowerCase().includes(searchQueries.users.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQueries.users.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchQueries.users.toLowerCase());

      return matchesSearch && matchesFilter;
    });

    return (
      <div
        style={{
          background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
          borderRadius: "20px",
          border: "2px solid #f0f0f0",
        }}
      >
        <div style={{ padding: "24px", borderBottom: "1px solid #f0f0f0" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <h2
              style={{ fontSize: "20px", fontWeight: "600", color: "#111827" }}
            >
              User Management
            </h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "16px",
                flexWrap: "wrap",
                width: "100%",
                maxWidth: "500px",
              }}
            >
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  flex: "1",
                  minWidth: "250px",
                }}
              >
                <input
                  type="text"
                  placeholder="Search users by name, email, or role..."
                  style={{
                    width: "100%",
                    minWidth: "0",
                    padding: "7px 16px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px 0 0 8px",
                    outline: "none",
                    fontSize: "14px",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#1f883d";
                    e.target.style.boxShadow =
                      "0 0 0 2px rgba(31, 136, 61, 0.2)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#d1d5db";
                    e.target.style.boxShadow = "none";
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSearch("users", e.target.value);
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = e.target.previousElementSibling;
                    handleSearch("users", input.value);
                  }}
                  style={{
                    padding: "8px 16px",
                    background: "#1f883d",
                    color: "#111827",
                    border: "none",
                    borderRadius: "0 8px 8px 0",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    transition: "background-color 0.2s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.background = "#1a7f37")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.background = "#1f883d")
                  }
                >
                  Search
                </button>
              </div>
              {searchQueries.users && (
                <button
                  onClick={() => clearSearch("users")}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    transition: "background-color 0.2s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.backgroundColor = "#4b5563")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.backgroundColor = "#6b7280")
                  }
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <select
              style={{
                padding: "8px 16px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                backgroundColor: "#ffffff",
                cursor: "pointer",
              }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Users</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="seller">Sellers</option>
              <option value="buyer">Buyers</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          {selectedItems.length > 0 && (
            <div
              style={{
                marginTop: "16px",
                padding: "16px",
                backgroundColor: "#dbeafe",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: "14px", color: "#1e40af" }}>
                  {selectedItems.length} users selected
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() =>
                      handleBulkActionClick("users", "suspend", selectedItems)
                    }
                    style={{
                      padding: "4px 12px",
                      backgroundColor: "#dc2626",
                      color: "#ffffff",
                      fontSize: "14px",
                      borderRadius: "6px",
                      border: "none",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.target.style.backgroundColor = "#b91c1c")
                    }
                    onMouseOut={(e) =>
                      (e.target.style.backgroundColor = "#dc2626")
                    }
                  >
                    Bulk Suspend
                  </button>
                  <button
                    onClick={() => setSelectedItems([])}
                    style={{
                      padding: "4px 12px",
                      backgroundColor: "#4b5563",
                      color: "#ffffff",
                      fontSize: "14px",
                      borderRadius: "6px",
                      border: "none",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.target.style.backgroundColor = "#374151")
                    }
                    onMouseOut={(e) =>
                      (e.target.style.backgroundColor = "#4b5563")
                    }
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ backgroundColor: "#f9fafb" }}>
              <tr>
                <th style={{ padding: "12px 24px", textAlign: "left" }}>
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(filteredUsers.map((u) => u._id));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                    checked={
                      selectedItems.length === filteredUsers.length &&
                      filteredUsers.length > 0
                    }
                  />
                </th>
                <th
                  style={{
                    padding: "12px 24px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#666",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  User
                </th>
                <th
                  style={{
                    padding: "12px 24px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#666",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Role
                </th>
                <th
                  style={{
                    padding: "12px 24px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#666",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: "12px 24px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#666",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Stats
                </th>
                <th
                  style={{
                    padding: "12px 24px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#666",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Joined
                </th>
                <th
                  style={{
                    padding: "12px 24px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#666",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody style={{ background: "#ffffff" }}>
              {filteredUsers.map((user) => (
                <tr
                  key={user._id}
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    transition: "background-color 0.2s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f9fafb")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "#ffffff")
                  }
                >
                  <td style={{ padding: "16px 24px" }}>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(user._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems([...selectedItems, user._id]);
                        } else {
                          setSelectedItems(
                            selectedItems.filter((id) => id !== user._id)
                          );
                        }
                      }}
                    />
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div
                        style={{
                          height: "40px",
                          width: "40px",
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, #1f883d, #1a7f37)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#ffffff",
                          }}
                        >
                          {user.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div style={{ marginLeft: "16px" }}>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#111827",
                          }}
                        >
                          {user.name}
                        </div>
                        <div style={{ fontSize: "14px", color: "#6b7280" }}>
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    {editingUser && editingUser._id === user._id ? (
                      <select
                        value={editingUser.role}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            role: e.target.value,
                          })
                        }
                        style={{
                          padding: "4px 8px",
                          fontSize: "12px",
                          border: "1px solid #d1d5db",
                          borderRadius: "4px",
                          outline: "none",
                        }}
                      >
                        <option value="buyer">Buyer</option>
                        <option value="seller">Seller</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span
                        style={{
                          display: "inline-flex",
                          padding: "4px 8px",
                          fontSize: "12px",
                          fontWeight: "600",
                          borderRadius: "9999px",
                          backgroundColor:
                            user.role === "admin"
                              ? "#fee2e2"
                              : user.role === "seller"
                              ? "#dbeafe"
                              : "#dcfce7",
                          color:
                            user.role === "admin"
                              ? "#991b1b"
                              : user.role === "seller"
                              ? "#1e40af"
                              : "#166534",
                        }}
                      >
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        padding: "4px 8px",
                        fontSize: "12px",
                        fontWeight: "600",
                        borderRadius: "9999px",
                        backgroundColor: user.isActive ? "#dcfce7" : "#fee2e2",
                        color: user.isActive ? "#166534" : "#991b1b",
                      }}
                    >
                      {user.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "16px 24px",
                      fontSize: "14px",
                      color: "#6b7280",
                    }}
                  >
                    <div>{user.stats?.componentCount || 0} components</div>
                    <div>${user.stats?.totalEarned || 0} earned</div>
                  </td>
                  <td
                    style={{
                      padding: "16px 24px",
                      fontSize: "14px",
                      color: "#6b7280",
                    }}
                  >
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {editingUser && editingUser._id === user._id ? (
                        <>
                          <button
                            onClick={handleSaveUserEdit}
                            style={{
                              padding: "8px",
                              borderRadius: "8px",
                              border: "none",
                              cursor: "pointer",
                              color: "#059669",
                              backgroundColor: "transparent",
                              transition: "background-color 0.2s",
                            }}
                            onMouseOver={(e) =>
                              (e.target.style.backgroundColor = "#f0fdf4")
                            }
                            onMouseOut={(e) =>
                              (e.target.style.backgroundColor = "transparent")
                            }
                            title="Save Changes"
                          >
                            <Save style={{ height: "16px", width: "16px" }} />
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            style={{
                              padding: "8px",
                              borderRadius: "8px",
                              border: "none",
                              cursor: "pointer",
                              color: "#6b7280",
                              backgroundColor: "transparent",
                              transition: "background-color 0.2s",
                            }}
                            onMouseOver={(e) =>
                              (e.target.style.backgroundColor = "#f3f4f6")
                            }
                            onMouseOut={(e) =>
                              (e.target.style.backgroundColor = "transparent")
                            }
                            title="Cancel Edit"
                          >
                            <X style={{ height: "16px", width: "16px" }} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditUser(user)}
                            style={{
                              padding: "8px",
                              borderRadius: "8px",
                              border: "none",
                              cursor: "pointer",
                              color: "#f59e0b",
                              backgroundColor: "transparent",
                              transition: "background-color 0.2s",
                            }}
                            onMouseOver={(e) =>
                              (e.target.style.backgroundColor = "#fffbeb")
                            }
                            onMouseOut={(e) =>
                              (e.target.style.backgroundColor = "transparent")
                            }
                            title="Edit User"
                          >
                            <Edit style={{ height: "16px", width: "16px" }} />
                          </button>
                          <button
                            onClick={() =>
                              handleUserActionClick(
                                user._id,
                                user.isActive ? "suspend" : "activate"
                              )
                            }
                            style={{
                              padding: "8px",
                              borderRadius: "8px",
                              border: "none",
                              cursor: "pointer",
                              color: user.isActive ? "#dc2626" : "#059669",
                              backgroundColor: "transparent",
                              transition: "background-color 0.2s",
                            }}
                            onMouseOver={(e) =>
                              (e.target.style.backgroundColor = user.isActive
                                ? "#fef2f2"
                                : "#f0fdf4")
                            }
                            onMouseOut={(e) =>
                              (e.target.style.backgroundColor = "transparent")
                            }
                            title={
                              user.isActive ? "Suspend User" : "Activate User"
                            }
                          >
                            {user.isActive ? (
                              <UserX
                                style={{ height: "16px", width: "16px" }}
                              />
                            ) : (
                              <UserCheck
                                style={{ height: "16px", width: "16px" }}
                              />
                            )}
                          </button>
                          <button
                            onClick={() => handleViewUser(user)}
                            style={{
                              padding: "8px",
                              borderRadius: "8px",
                              border: "none",
                              cursor: "pointer",
                              color: "#1f883d",
                              backgroundColor: "transparent",
                              transition: "background-color 0.2s",
                            }}
                            onMouseOver={(e) =>
                              (e.target.style.backgroundColor = "#dafbe1")
                            }
                            onMouseOut={(e) =>
                              (e.target.style.backgroundColor = "transparent")
                            }
                            title="View Details"
                          >
                            <Eye style={{ height: "16px", width: "16px" }} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            style={{
                              padding: "8px",
                              borderRadius: "8px",
                              border: "none",
                              cursor: "pointer",
                              color: "#dc2626",
                              backgroundColor: "transparent",
                              transition: "background-color 0.2s",
                            }}
                            onMouseOver={(e) =>
                              (e.target.style.backgroundColor = "#fef2f2")
                            }
                            onMouseOut={(e) =>
                              (e.target.style.backgroundColor = "transparent")
                            }
                            title="Delete User"
                          >
                            <Trash2 style={{ height: "16px", width: "16px" }} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const ComponentsManagement = () => {
    const filteredComponents = components.filter((component) => {
      const matchesFilter =
        filterStatus === "all" || component.status === filterStatus;

      if (!searchQueries.components) return matchesFilter;

      const matchesSearch =
        component.title
          ?.toLowerCase()
          .includes(searchQueries.components.toLowerCase()) ||
        component.description
          ?.toLowerCase()
          .includes(searchQueries.components.toLowerCase()) ||
        component.category
          ?.toLowerCase()
          .includes(searchQueries.components.toLowerCase()) ||
        component.seller?.name
          ?.toLowerCase()
          .includes(searchQueries.components.toLowerCase());

      return matchesSearch && matchesFilter;
    });

    return (
      <div
        style={{
          background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
          borderRadius: "20px",
          border: "2px solid #f0f0f0",
        }}
      >
        <div style={{ padding: "24px", borderBottom: "1px solid #f0f0f0" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <h2
              style={{ fontSize: "20px", fontWeight: "600", color: "#111827" }}
            >
              Component Management
            </h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "16px",
                flexWrap: "wrap",
                width: "100%",
                maxWidth: "500px",
              }}
            >
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  flex: "1",
                  minWidth: "250px",
                }}
              >
                <input
                  type="text"
                  placeholder="Search components by title, description, category, or seller..."
                  style={{
                    width: "100%",
                    minWidth: "0",
                    padding: "7px 16px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px 0 0 8px",
                    outline: "none",
                    fontSize: "14px",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#1f883d";
                    e.target.style.boxShadow =
                      "0 0 0 2px rgba(31, 136, 61, 0.2)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#d1d5db";
                    e.target.style.boxShadow = "none";
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSearch("components", e.target.value);
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = e.target.previousElementSibling;
                    handleSearch("components", input.value);
                  }}
                  style={{
                    padding: "8px 16px",
                    background: "#1f883d",
                    color: "#111827",
                    border: "none",
                    borderRadius: "0 8px 8px 0",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    transition: "background-color 0.2s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.background = "#1a7f37")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.background = "#1f883d")
                  }
                >
                  Search
                </button>
              </div>
              {searchQueries.components && (
                <button
                  onClick={() => clearSearch("components")}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    transition: "background-color 0.2s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.backgroundColor = "#4b5563")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.backgroundColor = "#6b7280")
                  }
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <select
              style={{
                padding: "8px 16px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                backgroundColor: "#ffffff",
              }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Components</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {selectedItems.length > 0 && (
            <div
              style={{
                marginTop: "16px",
                padding: "16px",
                backgroundColor: "#f0fdf4",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: "14px", color: "#166534" }}>
                  {selectedItems.length} components selected
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() =>
                      handleBulkActionClick(
                        "components",
                        "approve",
                        selectedItems
                      )
                    }
                    style={{
                      padding: "4px 12px",
                      backgroundColor: "#059669",
                      color: "#ffffff",
                      fontSize: "14px",
                      borderRadius: "6px",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Bulk Approve
                  </button>
                  <button
                    onClick={() => setSelectedItems([])}
                    style={{
                      padding: "4px 12px",
                      backgroundColor: "#4b5563",
                      color: "#ffffff",
                      fontSize: "14px",
                      borderRadius: "6px",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ backgroundColor: "#f9fafb" }}>
              <tr>
                <th style={{ padding: "12px 24px", textAlign: "left" }}>
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(filteredComponents.map((c) => c._id));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                    checked={
                      selectedItems.length === filteredComponents.length &&
                      filteredComponents.length > 0
                    }
                  />
                </th>
                <th
                  style={{
                    padding: "12px 24px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Component
                </th>
                <th
                  style={{
                    padding: "12px 24px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Seller
                </th>
                <th
                  style={{
                    padding: "12px 24px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Price
                </th>
                <th
                  style={{
                    padding: "12px 24px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: "12px 24px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Sales
                </th>
                <th
                  style={{
                    padding: "12px 24px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: "#ffffff" }}>
              {filteredComponents.map((component) => (
                <tr
                  key={component._id}
                  style={{ borderBottom: "1px solid #e5e7eb" }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f9fafb")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "#ffffff")
                  }
                >
                  <td style={{ padding: "16px 24px" }}>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(component._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems([...selectedItems, component._id]);
                        } else {
                          setSelectedItems(
                            selectedItems.filter((id) => id !== component._id)
                          );
                        }
                      }}
                    />
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div
                        style={{
                          height: "48px",
                          width: "48px",
                          borderRadius: "8px",
                          background:
                            "linear-gradient(135deg, #1f883d, #1a7f37)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Package
                          style={{
                            height: "24px",
                            width: "24px",
                            color: "#ffffff",
                          }}
                        />
                      </div>
                      <div style={{ marginLeft: "16px" }}>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#111827",
                          }}
                        >
                          {component.title || component.name}
                        </div>
                        <div style={{ fontSize: "14px", color: "#6b7280" }}>
                          {component.category}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <div style={{ fontSize: "14px", color: "#111827" }}>
                      {component.seller?.name}
                    </div>
                    <div style={{ fontSize: "14px", color: "#6b7280" }}>
                      {component.seller?.email}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "16px 24px",
                      fontSize: "14px",
                      color: "#111827",
                    }}
                  >
                    ${component.price}
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        padding: "4px 8px",
                        fontSize: "12px",
                        fontWeight: "600",
                        borderRadius: "9999px",
                        backgroundColor:
                          component.status === "approved"
                            ? "#dcfce7"
                            : component.status === "pending"
                            ? "#fef3c7"
                            : "#fee2e2",
                        color:
                          component.status === "approved"
                            ? "#166534"
                            : component.status === "pending"
                            ? "#92400e"
                            : "#991b1b",
                      }}
                    >
                      {component.status}
                    </span>
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <div style={{ fontSize: "14px", color: "#111827" }}>
                      {component.stats?.salesCount || component.salesCount || 0}{" "}
                      sales
                    </div>
                    <div style={{ fontSize: "14px", color: "#6b7280" }}>
                      ${component.stats?.totalRevenue || 0} revenue
                    </div>
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {component.status === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              handleComponentActionClick(
                                component._id,
                                "approve"
                              )
                            }
                            style={{
                              padding: "8px",
                              borderRadius: "8px",
                              border: "none",
                              cursor: "pointer",
                              color: "#059669",
                              backgroundColor: "transparent",
                            }}
                            title="Approve Component"
                          >
                            <CheckCircle
                              style={{ height: "16px", width: "16px" }}
                            />
                          </button>
                          <button
                            onClick={() =>
                              handleComponentActionClick(
                                component._id,
                                "reject"
                              )
                            }
                            style={{
                              padding: "8px",
                              borderRadius: "8px",
                              border: "none",
                              cursor: "pointer",
                              color: "#dc2626",
                              backgroundColor: "transparent",
                            }}
                            title="Reject Component"
                          >
                            <Ban style={{ height: "16px", width: "16px" }} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() =>
                          window.open(`/components/${component._id}`, "_blank")
                        }
                        style={{
                          padding: "8px",
                          borderRadius: "8px",
                          border: "none",
                          cursor: "pointer",
                          color: "#1f883d",
                          backgroundColor: "transparent",
                        }}
                        title="View Component"
                      >
                        <Eye style={{ height: "16px", width: "16px" }} />
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteComponentClick(component._id)
                        }
                        style={{
                          padding: "8px",
                          borderRadius: "8px",
                          border: "none",
                          cursor: "pointer",
                          color: "#dc2626",
                          backgroundColor: "transparent",
                        }}
                        title="Delete Component"
                      >
                        <Trash2 style={{ height: "16px", width: "16px" }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const ReviewsManagement = () => (
    <div
      style={{
        background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
        borderRadius: "20px",
        border: "2px solid #f0f0f0",
      }}
    >
      <div style={{ padding: "24px", borderBottom: "1px solid #f0f0f0" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#111827" }}>
          Review Management
        </h2>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f9fafb" }}>
            <tr>
              <th
                style={{
                  padding: "12px 24px",
                  textAlign: "left",
                  fontSize: "12px",
                  fontWeight: "500",
                  color: "#666",
                  textTransform: "uppercase",
                }}
              >
                Review
              </th>
              <th
                style={{
                  padding: "12px 24px",
                  textAlign: "left",
                  fontSize: "12px",
                  fontWeight: "500",
                  color: "#666",
                  textTransform: "uppercase",
                }}
              >
                Component
              </th>
              <th
                style={{
                  padding: "12px 24px",
                  textAlign: "left",
                  fontSize: "12px",
                  fontWeight: "500",
                  color: "#666",
                  textTransform: "uppercase",
                }}
              >
                Rating
              </th>
              <th
                style={{
                  padding: "12px 24px",
                  textAlign: "left",
                  fontSize: "12px",
                  fontWeight: "500",
                  color: "#666",
                  textTransform: "uppercase",
                }}
              >
                Status
              </th>
              <th
                style={{
                  padding: "12px 24px",
                  textAlign: "left",
                  fontSize: "12px",
                  fontWeight: "500",
                  color: "#666",
                  textTransform: "uppercase",
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody style={{ background: "#ffffff" }}>
            {reviews.map((review) => (
              <tr
                key={review._id}
                style={{ borderBottom: "1px solid #f0f0f0" }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f9fafb")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "#ffffff")
                }
              >
                <td style={{ padding: "16px 24px" }}>
                  <div style={{ fontSize: "14px", color: "#111827" }}>
                    {review.comment}
                  </div>
                  <div style={{ fontSize: "14px", color: "#6b7280" }}>
                    by {review.user?.name}
                  </div>
                </td>
                <td
                  style={{
                    padding: "16px 24px",
                    fontSize: "14px",
                    color: "#111827",
                  }}
                >
                  {review.component?.name}
                </td>
                <td style={{ padding: "16px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: "14px",
                          color: i < review.rating ? "#fbbf24" : "#d1d5db",
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: "16px 24px" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      padding: "4px 8px",
                      fontSize: "12px",
                      fontWeight: "600",
                      borderRadius: "9999px",
                      backgroundColor:
                        review.status === "approved"
                          ? "#dcfce7"
                          : review.status === "flagged"
                          ? "#fee2e2"
                          : "#fef3c7",
                      color:
                        review.status === "approved"
                          ? "#166534"
                          : review.status === "flagged"
                          ? "#991b1b"
                          : "#92400e",
                    }}
                  >
                    {review.status}
                  </span>
                </td>
                <td style={{ padding: "16px 24px" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() =>
                        handleReviewActionClick(review._id, "approve")
                      }
                      style={{
                        padding: "8px",
                        borderRadius: "8px",
                        border: "none",
                        cursor: "pointer",
                        color: "#059669",
                        backgroundColor: "transparent",
                      }}
                      title="Approve Review"
                    >
                      <Check style={{ height: "16px", width: "16px" }} />
                    </button>
                    <button
                      onClick={() =>
                        handleReviewActionClick(review._id, "flag")
                      }
                      style={{
                        padding: "8px",
                        borderRadius: "8px",
                        border: "none",
                        cursor: "pointer",
                        color: "#dc2626",
                        backgroundColor: "transparent",
                      }}
                      title="Flag Review"
                    >
                      <AlertTriangle
                        style={{ height: "16px", width: "16px" }}
                      />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const ReportsManagement = () => {
    const filteredReports = reports.filter((report) => {
      const matchesFilter =
        filterStatus === "all" || report.status === filterStatus;

      if (!searchQueries.reports) return matchesFilter;

      const matchesSearch =
        report.reason
          ?.toLowerCase()
          .includes(searchQueries.reports.toLowerCase()) ||
        report.description
          ?.toLowerCase()
          .includes(searchQueries.reports.toLowerCase()) ||
        report.reporter?.name
          ?.toLowerCase()
          .includes(searchQueries.reports.toLowerCase()) ||
        report.component?.title
          ?.toLowerCase()
          .includes(searchQueries.reports.toLowerCase()) ||
        report.component?.seller?.name
          ?.toLowerCase()
          .includes(searchQueries.reports.toLowerCase());

      return matchesSearch && matchesFilter;
    });

    return (
      <div
        style={{
          background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
          borderRadius: "20px",
          border: "2px solid #f0f0f0",
        }}
      >
        <div style={{ padding: "24px", borderBottom: "1px solid #f0f0f0" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <h2
              style={{ fontSize: "20px", fontWeight: "600", color: "#111827" }}
            >
              Report Management
            </h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "16px",
                flexWrap: "wrap",
                width: "100%",
                maxWidth: "500px",
              }}
            >
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  flex: "1",
                  minWidth: "250px",
                }}
              >
                <input
                  type="text"
                  placeholder="Search reports by reason, description, reporter, or component..."
                  style={{
                    width: "100%",
                    minWidth: "0",
                    padding: "7px 16px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px 0 0 8px",
                    outline: "none",
                    fontSize: "14px",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#1f883d";
                    e.target.style.boxShadow =
                      "0 0 0 2px rgba(31, 136, 61, 0.2)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#d1d5db";
                    e.target.style.boxShadow = "none";
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSearch("reports", e.target.value);
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = e.target.previousElementSibling;
                    handleSearch("reports", input.value);
                  }}
                  style={{
                    padding: "8px 16px",
                    background: "#1f883d",
                    color: "#111827",
                    border: "none",
                    borderRadius: "0 8px 8px 0",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    transition: "background-color 0.2s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.background = "#1a7f37")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.background = "#1f883d")
                  }
                >
                  Search
                </button>
              </div>
              {searchQueries.reports && (
                <button
                  onClick={() => clearSearch("reports")}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    transition: "background-color 0.2s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.backgroundColor = "#4b5563")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.backgroundColor = "#6b7280")
                  }
                >
                  Clear
                </button>
              )}
            </div>

            <select
              style={{
                padding: "8px 16px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                backgroundColor: "#ffffff",
              }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Reports</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ backgroundColor: "#f9fafb" }}>
              <tr>
                <th
                  style={{
                    padding: "12px 24px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Issue Details
                </th>
                <th
                  style={{
                    padding: "12px 24px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Reported By
                </th>
                <th
                  style={{
                    padding: "12px 24px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Seller Information
                </th>
                <th
                  style={{
                    padding: "12px 24px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: "12px 24px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Date
                </th>
                <th
                  style={{
                    padding: "12px 24px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: "#ffffff" }}>
              {filteredReports.map((report) => (
                <tr
                  key={report._id}
                  style={{ borderBottom: "1px solid #e5e7eb" }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f9fafb")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "#ffffff")
                  }
                >
                  <td style={{ padding: "16px 24px" }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#111827",
                        marginBottom: "4px",
                      }}
                    >
                      {report.reason || "General Issue"}
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#6b7280",
                        marginBottom: "8px",
                      }}
                    >
                      {report.description || report.details}
                    </div>
                    <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                      Regarding:{" "}
                      {report.component?.title ||
                        report.user?.name ||
                        "Unknown"}
                    </div>
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#111827",
                      }}
                    >
                      {report.reporter?.name || "Anonymous"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                      {report.reporter?.email || "No email provided"}
                    </div>
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    {report.component?.seller ? (
                      <>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#111827",
                          }}
                        >
                          {report.component.seller.name}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>
                          {report.component.seller.email}
                        </div>
                        <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                          Component: {report.component.title}
                        </div>
                      </>
                    ) : report.user ? (
                      <>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#111827",
                          }}
                        >
                          {report.user.name}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>
                          {report.user.email}
                        </div>
                        <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                          User Report
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: "14px", color: "#6b7280" }}>
                        No seller information
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        padding: "4px 12px",
                        fontSize: "12px",
                        fontWeight: "600",
                        borderRadius: "9999px",
                        backgroundColor:
                          report.status === "resolved"
                            ? "#dcfce7"
                            : report.status === "investigating"
                            ? "#dbeafe"
                            : report.status === "pending"
                            ? "#fef3c7"
                            : "#fee2e2",
                        color:
                          report.status === "resolved"
                            ? "#166534"
                            : report.status === "investigating"
                            ? "#1e40af"
                            : report.status === "pending"
                            ? "#92400e"
                            : "#991b1b",
                      }}
                    >
                      {report.status?.charAt(0).toUpperCase() +
                        report.status?.slice(1) || "Pending"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "16px 24px",
                      fontSize: "14px",
                      color: "#6b7280",
                    }}
                  >
                    {new Date(report.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {report.status === "pending" && (
                        <>
                          <Link
                            style={{
                              padding: "8px",
                              borderRadius: "8px",
                              border: "none",
                              cursor: "pointer",
                              color: "#2563eb",
                              backgroundColor: "transparent",
                            }}
                            to={`/components/${report.component._id}`}
                          >
                            <Eye style={{ height: "16px", width: "16px" }} />
                          </Link>

                          <button
                            onClick={() =>
                              handleReportAction(
                                report._id,
                                "resolve",
                                "Issue addressed and resolved."
                              )
                            }
                            style={{
                              padding: "8px",
                              borderRadius: "8px",
                              border: "none",
                              cursor: "pointer",
                              color: "#059669",
                              backgroundColor: "transparent",
                            }}
                            title="Resolve Report"
                          >
                            <Check style={{ height: "16px", width: "16px" }} />
                          </button>
                          <button
                            onClick={() =>
                              handleReportAction(
                                report._id,
                                "dismiss",
                                "Report dismissed as invalid."
                              )
                            }
                            style={{
                              padding: "8px",
                              borderRadius: "8px",
                              border: "none",
                              cursor: "pointer",
                              color: "#6b7280",
                              backgroundColor: "transparent",
                            }}
                            title="Dismiss Report"
                          >
                            <X style={{ height: "16px", width: "16px" }} />
                          </button>
                        </>
                      )}
                      {report.status === "investigating" && (
                        <button
                          onClick={() =>
                            handleReportAction(
                              report._id,
                              "resolve",
                              "Investigation completed and resolved."
                            )
                          }
                          style={{
                            padding: "8px",
                            borderRadius: "8px",
                            border: "none",
                            cursor: "pointer",
                            color: "#059669",
                            backgroundColor: "transparent",
                          }}
                          title="Mark as Resolved"
                        >
                          <Check style={{ height: "16px", width: "16px" }} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteReport(report._id)}
                        style={{
                          padding: "8px",
                          borderRadius: "8px",
                          border: "none",
                          cursor: "pointer",
                          color: "#dc2626",
                          backgroundColor: "transparent",
                        }}
                        title="Delete Report"
                      >
                        <Trash2 style={{ height: "16px", width: "16px" }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const Analytics = () => {
    const analyticsData = getAnalyticsData();

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Analytics Stats Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "24px",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
              borderRadius: "20px",
              border: "2px solid #f0f0f0",
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#666",
                    marginBottom: "8px",
                  }}
                >
                  Revenue Growth
                </p>
                <p
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#111827",
                  }}
                >
                  +{analyticsData.revenueGrowth}%
                </p>
              </div>
              <TrendingUp
                style={{ height: "32px", width: "32px", color: "#1f883d" }}
              />
            </div>
            <p style={{ fontSize: "12px", color: "#059669", marginTop: "8px" }}>
              vs last month
            </p>
          </div>

          <div
            style={{
              background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
              borderRadius: "20px",
              border: "2px solid #f0f0f0",
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#666",
                    marginBottom: "8px",
                  }}
                >
                  User Engagement
                </p>
                <p
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#111827",
                  }}
                >
                  {analyticsData.userGrowth}%
                </p>
              </div>
              <Users
                style={{ height: "32px", width: "32px", color: "#1a7f37" }}
              />
            </div>
            <p style={{ fontSize: "12px", color: "#1a7f37", marginTop: "8px" }}>
              active users
            </p>
          </div>

          <div
            style={{
              background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
              borderRadius: "20px",
              border: "2px solid #f0f0f0",
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#666",
                    marginBottom: "8px",
                  }}
                >
                  Approval Rate
                </p>
                <p
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#111827",
                  }}
                >
                  {analyticsData.componentApprovalRate}%
                </p>
              </div>
              <CheckCircle
                style={{ height: "32px", width: "32px", color: "#1a7f37" }}
              />
            </div>
            <p style={{ fontSize: "12px", color: "#1a7f37", marginTop: "8px" }}>
              components approved
            </p>
          </div>

          <div
            style={{
              background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
              borderRadius: "20px",
              border: "2px solid #f0f0f0",
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#666",
                    marginBottom: "8px",
                  }}
                >
                  Avg Rating
                </p>
                <p
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#111827",
                  }}
                >
                  {analyticsData.avgRating}
                </p>
              </div>
              <Activity
                style={{ height: "32px", width: "32px", color: "#1a7f37" }}
              />
            </div>
            <p style={{ fontSize: "12px", color: "#1a7f37", marginTop: "8px" }}>
              platform rating
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "24px",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
              borderRadius: "20px",
              border: "2px solid #f0f0f0",
              padding: "24px",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#111827",
                marginBottom: "16px",
              }}
            >
              Revenue Trends
            </h3>
            <div
              style={{
                height: "256px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f9fafb",
                borderRadius: "12px",
                border: "1px solid #f0f0f0",
              }}
            >
              <BarChart3
                style={{ height: "64px", width: "64px", color: "#1f883d" }}
              />
              <span style={{ marginLeft: "16px", color: "#666" }}>
                Revenue Chart Placeholder
              </span>
            </div>
          </div>

          <div
            style={{
              background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
              borderRadius: "20px",
              border: "2px solid #f0f0f0",
              padding: "24px",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#111827",
                marginBottom: "16px",
              }}
            >
              User Growth
            </h3>
            <div
              style={{
                height: "256px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f9fafb",
                borderRadius: "12px",
                border: "1px solid #f0f0f0",
              }}
            >
              <PieChart
                style={{ height: "64px", width: "64px", color: "#1a7f37" }}
              />
              <span style={{ marginLeft: "16px", color: "#666" }}>
                User Growth Chart Placeholder
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
            borderRadius: "20px",
            border: "2px solid #f0f0f0",
            padding: "24px",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#111827",
              marginBottom: "16px",
            }}
          >
            Platform Activity
          </h3>
          <div
            style={{
              height: "256px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
            }}
          >
            <Activity
              style={{ height: "64px", width: "64px", color: "#9ca3af" }}
            />
            <span style={{ marginLeft: "16px", color: "#6b7280" }}>
              Activity Chart Placeholder
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Navigation tabs
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "components", label: "Components", icon: Package },
    { id: "reviews", label: "Reviews", icon: Shield },
    { id: "reports", label: "Reports", icon: Flag },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f9fafb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              animation: "spin 1s linear infinite",
              borderRadius: "50%",
              height: "48px",
              width: "48px",
              borderBottom: "2px solid #2563eb",
              margin: "0 auto",
            }}
          ></div>
          <p style={{ marginTop: "16px", color: "#6b7280" }}>
            Loading admin dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f9fafb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{ textAlign: "center", maxWidth: "500px", padding: "24px" }}
        >
          <div
            style={{
              backgroundColor: "#fee2e2",
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#dc2626",
                marginBottom: "16px",
              }}
            >
              Connection Error
            </h2>
            <p style={{ color: "#991b1b", marginBottom: "16px" }}>{error}</p>
            <div
              style={{ fontSize: "14px", color: "#7f1d1d", textAlign: "left" }}
            >
              <p style={{ marginBottom: "8px" }}>
                <strong>To connect to your backend:</strong>
              </p>
              <ul style={{ paddingLeft: "20px", margin: 0 }}>
                <li>Download your code using the "Download ZIP" button</li>
                <li>Start your backend server on port 8000</li>
                <li>
                  Or deploy your backend and set{" "}
                  <code>NEXT_PUBLIC_API_URL</code> in Project Settings
                </li>
              </ul>
            </div>
          </div>
          <button
            onClick={fetchData}
            style={{
              padding: "12px 24px",
              background: "#1f883d",
              color: "#111827",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const handleSearch = (section, query) => {
    setSearchQueries((prev) => ({
      ...prev,
      [section]: query,
    }));
  };

  const clearSearch = (section) => {
    setSearchQueries((prev) => ({
      ...prev,
      [section]: "",
    }));
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      <NotificationCard />

      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: "0",
          background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          borderBottom: "1px solid #374151",
        }}
      >
        <div
          style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 16px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              height: "64px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <Shield
                style={{ height: "32px", width: "32px", color: "#1f883d" }}
              />
              <h1
                style={{
                  marginLeft: "12px",
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#f9fafb",
                }}
              >
                Admin Dashboard
              </h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <button
                onClick={logout}
                style={{
                  padding: "8px",
                  color: "#9ca3af",
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: "6px",
                  transition: "color 0.2s",
                }}
                onMouseOver={(e) => (e.target.style.color = "#1f883d")}
                onMouseOut={(e) => (e.target.style.color = "#9ca3af")}
                title="Refresh Data"
              >
                <LogOut style={{ height: "20px", width: "20px" }} />
              </button>
              <div
                style={{
                  height: "32px",
                  width: "32px",
                  borderRadius: "50%",
                  backgroundColor: "#1f883d",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#ffffff",
                  }}
                >
                  A
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div
        style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 16px" }}
      >
        {/* Navigation Tabs */}
        <div style={{ marginBottom: "32px" }}>
          <nav style={{ display: "flex", gap: "32px", overflowX: "auto" }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 12px",
                    fontSize: "14px",
                    fontWeight: "500",
                    borderRadius: "20px",
                    whiteSpace: "nowrap",
                    border: "2px solid",
                    cursor: "pointer",
                    backgroundColor:
                      activeTab === tab.id ? "#1f883d" : "transparent",
                    borderColor:
                      activeTab === tab.id ? "#1f883d" : "#f0f0f0",
                    color: activeTab === tab.id ? "#111827" : "#666",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    if (activeTab !== tab.id) {
                      e.target.style.color = "#111827";
                      e.target.style.borderColor = "#d0d0d0";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (activeTab !== tab.id) {
                      e.target.style.color = "#666";
                      e.target.style.borderColor = "#f0f0f0";
                    }
                  }}
                >
                  <Icon
                    style={{
                      height: "16px",
                      width: "16px",
                      marginRight: "8px",
                      color: activeTab === tab.id ? "#111827" : "inherit",
                    }}
                  />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {activeTab === "dashboard" && (
            <>
              <DashboardStats />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
                  gap: "24px",
                }}
              >
                <div
                  style={{
                    background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
                    borderRadius: "20px",
                    border: "2px solid #f0f0f0",
                    padding: "24px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#111827",
                      marginBottom: "16px",
                    }}
                  >
                    Recent Activity
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px",
                        backgroundColor: "#f9fafb",
                        borderRadius: "8px",
                      }}
                    >
                      <span style={{ fontSize: "14px", color: "#666" }}>
                        New user registered
                      </span>
                      <span style={{ fontSize: "12px", color: "#999" }}>
                        2 min ago
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px",
                        backgroundColor: "#f9fafb",
                        borderRadius: "8px",
                      }}
                    >
                      <span style={{ fontSize: "14px", color: "#666" }}>
                        Component approved
                      </span>
                      <span style={{ fontSize: "12px", color: "#999" }}>
                        5 min ago
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px",
                        backgroundColor: "#f9fafb",
                        borderRadius: "8px",
                      }}
                    >
                      <span style={{ fontSize: "14px", color: "#666" }}>
                        Purchase completed
                      </span>
                      <span style={{ fontSize: "12px", color: "#999" }}>
                        10 min ago
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
                    borderRadius: "20px",
                    border: "2px solid #f0f0f0",
                    padding: "24px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#111827",
                      marginBottom: "16px",
                    }}
                  >
                    Quick Actions
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: "16px",
                    }}
                  >
                    <button
                      onClick={() => setActiveTab("users")}
                      style={{
                        padding: "16px",
                        background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
                        color: "#111827",
                        borderRadius: "12px",
                        border: "2px solid #f0f0f0",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        textAlign: "center",
                      }}
                      onMouseOver={(e) => {
                        e.target.style.borderColor = "#1f883d";
                        e.target.style.background = "#f0fdf4";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.borderColor = "#f0f0f0";
                        e.target.style.background = "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)";
                      }}
                    >
                      <Users
                        style={{
                          height: "24px",
                          width: "24px",
                          margin: "0 auto 8px",
                          color: "#1f883d",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: "500",
                          display: "block",
                        }}
                      >
                        Manage Users
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveTab("components")}
                      style={{
                        padding: "16px",
                        background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
                        color: "#111827",
                        borderRadius: "12px",
                        border: "2px solid #f0f0f0",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        textAlign: "center",
                      }}
                      onMouseOver={(e) => {
                        e.target.style.borderColor = "#1f883d";
                        e.target.style.background = "#f0fdf4";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.borderColor = "#f0f0f0";
                        e.target.style.background = "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)";
                      }}
                    >
                      <Package
                        style={{
                          height: "24px",
                          width: "24px",
                          margin: "0 auto 8px",
                          color: "#1a7f37",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: "500",
                          display: "block",
                        }}
                      >
                        Review Components
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveTab("reviews")}
                      style={{
                        padding: "16px",
                        background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
                        color: "#111827",
                        borderRadius: "12px",
                        border: "2px solid #f0f0f0",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        textAlign: "center",
                      }}
                      onMouseOver={(e) => {
                        e.target.style.borderColor = "#1f883d";
                        e.target.style.background = "#f0fdf4";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.borderColor = "#f0f0f0";
                        e.target.style.background = "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)";
                      }}
                    >
                      <Shield
                        style={{
                          height: "24px",
                          width: "24px",
                          margin: "0 auto 8px",
                          color: "#1a7f37",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: "500",
                          display: "block",
                        }}
                      >
                        Moderate Reviews
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveTab("reports")}
                      style={{
                        padding: "16px",
                        background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
                        color: "#111827",
                        borderRadius: "12px",
                        border: "2px solid #f0f0f0",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        textAlign: "center",
                      }}
                      onMouseOver={(e) => {
                        e.target.style.borderColor = "#1f883d";
                        e.target.style.background = "#f0fdf4";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.borderColor = "#f0f0f0";
                        e.target.style.background = "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)";
                      }}
                    >
                      <Flag
                        style={{
                          height: "24px",
                          width: "24px",
                          margin: "0 auto 8px",
                          color: "#1a7f37",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: "500",
                          display: "block",
                        }}
                      >
                        Handle Reports
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "users" && <UsersManagement />}
          {activeTab === "components" && <ComponentsManagement />}
          {activeTab === "reviews" && <ReviewsManagement />}
          {activeTab === "reports" && <ReportsManagement />}
          {activeTab === "analytics" && <Analytics />}

          {activeTab === "settings" && (
            <div
              style={{
                background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
                borderRadius: "20px",
                border: "2px solid #f0f0f0",
                padding: "24px",
              }}
            >
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#111827",
                  marginBottom: "24px",
                }}
              >
                System Settings
              </h2>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "500",
                      color: "#111827",
                      marginBottom: "16px",
                    }}
                  >
                    Platform Configuration
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "#666",
                          marginBottom: "8px",
                        }}
                      >
                        Commission Rate (%)
                      </label>
                      <input
                        type="number"
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          border: "2px solid #f0f0f0",
                          borderRadius: "12px",
                          fontSize: "14px",
                          outline: "none",
                        }}
                        value={platformSettings.commissionRate}
                        onChange={(e) =>
                          setPlatformSettings({
                            ...platformSettings,
                            commissionRate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "#666",
                          marginBottom: "8px",
                        }}
                      >
                        Max File Size (MB)
                      </label>
                      <input
                        type="number"
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          border: "2px solid #f0f0f0",
                          borderRadius: "12px",
                          fontSize: "14px",
                          outline: "none",
                        }}
                        value={platformSettings.maxFileSize}
                        onChange={(e) =>
                          setPlatformSettings({
                            ...platformSettings,
                            maxFileSize: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "500",
                      color: "#111827",
                      marginBottom: "16px",
                    }}
                  >
                    Email Notifications
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <label style={{ display: "flex", alignItems: "center" }}>
                      <input
                        type="checkbox"
                        style={{ marginRight: "8px", accentColor: "#1f883d" }}
                        checked={platformSettings.emailNotifications.newUsers}
                        onChange={(e) =>
                          setPlatformSettings({
                            ...platformSettings,
                            emailNotifications: {
                              ...platformSettings.emailNotifications,
                              newUsers: e.target.checked,
                            },
                          })
                        }
                      />
                      <span style={{ fontSize: "14px", color: "#666" }}>
                        New user registrations
                      </span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center" }}>
                      <input
                        type="checkbox"
                        style={{ marginRight: "8px", accentColor: "#1f883d" }}
                        checked={
                          platformSettings.emailNotifications
                            .componentSubmissions
                        }
                        onChange={(e) =>
                          setPlatformSettings({
                            ...platformSettings,
                            emailNotifications: {
                              ...platformSettings.emailNotifications,
                              componentSubmissions: e.target.checked,
                            },
                          })
                        }
                      />
                      <span style={{ fontSize: "14px", color: "#666" }}>
                        Component submissions
                      </span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center" }}>
                      <input
                        type="checkbox"
                        style={{ marginRight: "8px", accentColor: "#1f883d" }}
                        checked={
                          platformSettings.emailNotifications.dailyReports
                        }
                        onChange={(e) =>
                          setPlatformSettings({
                            ...platformSettings,
                            emailNotifications: {
                              ...platformSettings.emailNotifications,
                              dailyReports: e.target.checked,
                            },
                          })
                        }
                      />
                      <span style={{ fontSize: "14px", color: "#666" }}>
                        Daily reports
                      </span>
                    </label>
                  </div>
                </div>

                <div style={{ paddingTop: "16px" }}>
                  <button
                    onClick={handleSaveSettings}
                    style={{
                      padding: "10px 28px",
                      background: "#1f883d",
                      color: "#111827",
                      borderRadius: "12px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = "#1a7f37";
                      e.target.style.transform = "translateY(-1px)";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = "#1f883d";
                      e.target.style.transform = "translateY(0)";
                    }}
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddUserModal />
      <UserDetailsModal />

      {deleteConfirmation && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "400px",
              width: "90%",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <AlertTriangle
                style={{
                  height: "24px",
                  width: "24px",
                  color: "#f59e0b",
                  marginRight: "12px",
                }}
              />
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#111827",
                  margin: 0,
                }}
              >
                Confirm Deletion
              </h3>
            </div>
            <p
              style={{
                fontSize: "14px",
                color: "#6b7280",
                marginBottom: "24px",
                lineHeight: "1.5",
              }}
            >
              {deleteConfirmation.message}
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setDeleteConfirmation(null)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
