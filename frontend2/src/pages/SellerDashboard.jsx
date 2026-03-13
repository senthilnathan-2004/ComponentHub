/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { dashboardService, componentService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
// Chat imports removed - chat functionality disabled
// import { useChat } from "../contexts/ChatContext";
// import { MessageSquare } from "lucide-react";

const SellerDashboard = () => {
  const { user } = useAuth();
  // const { unreadCount } = useChat(); // Chat functionality disabled
  const [stats, setStats] = useState(null);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Wait for user to be available before loading dashboard data
  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    // if user not present, do nothing
    if (!user?.id) return;

    try {
      setLoading(true);
      // fetch seller stats for logged-in user and components for that seller only
      const [statsData, componentsData] = await Promise.all([
        dashboardService.getSellerStats(user.id),
        componentService.getComponents({ seller: user.id }),
      ]);

      setStats(statsData);
      setComponents(componentsData.items || []);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: "40px" }}>
      <div
        className="d-flex align-items-center justify-content-between mb-4"
        style={{ flexWrap: "wrap", gap: "12px" }}
      >
        <div>
          <h1>Seller Dashboard</h1>
          <p style={{ color: "var(--color-fg-muted)" }}>
            Manage your components and track your sales performance.
          </p>
        </div>
        <div className="d-flex gap-2">
          {/* Messages link removed */}
          <Link
            to="/upload"
            className="btn btn-primary"
            style={{ maxWidth: "10rem",marginLeft:"10px" }}
          >
            Upload Component
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid mb-5">
        <div className="stat-card">
          <div className="stat-value">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(stats?.totalRevenue || 0)}
          </div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.totalSales || 0}</div>
          <div className="stat-label">Total Sales</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.avgRating || 0}★</div>
          <div className="stat-label">Average Rating</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.totalComponents || 0}</div>
          <div className="stat-label">Components</div>
        </div>
        {/* Unread messages stat card removed - chat functionality disabled */}
        {/* <div className="stat-card">
          <div className="stat-value" style={{ color: unreadCount > 0 ? "var(--color-danger-fg)" : "inherit" }}>
            {unreadCount}
          </div>
          <div className="stat-label">Unread Messages</div>
        </div> */}
      </div>

      <div
        className="grid grid-cols-2"
        style={{ gap: "24px", alignItems: "start" }}
      >
        {/* Recent Sales */}
        <div className="card">
          <div className="card-header">
            <h3 className="mb-0">Recent Sales</h3>
          </div>
          {stats?.recentSales?.length > 0 ? (
            <div>
              {stats.recentSales.map((sale, index) => (
                <div
                  key={index}
                  className="d-flex justify-content-between align-items-center"
                  style={{
                    padding: "12px 0",
                    borderBottom:
                      index < stats.recentSales.length - 1
                        ? "1px solid var(--color-border-default)"
                        : "none",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "500" }}>
                      {sale.componentName}
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "var(--color-fg-muted)",
                      }}
                    >
                      by {sale.buyerName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      style={{
                        fontWeight: "600",
                        color: "var(--color-success-fg)",
                      }}
                    >
                      ${sale.amount}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--color-fg-muted)",
                      }}
                    >
                      {sale.date}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--color-fg-muted)" }}>No sales yet.</p>
          )}
        </div>

        {/* My Components */}
        <div className="card">
          <div
            className="card-header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 className="mb-0">My Components</h3>
            <Link
              to="/my-components"
              className="btn btn-primary "
              style={{ maxWidth: "10rem" }}
            >
              EditComponents
            </Link>
          </div>
          {components.length > 0 ? (
            <div>
              {components.slice(0, 5).map((component, index) => (
                <div
                  key={component.id}
                  className="d-flex justify-content-between align-items-center"
                  style={{
                    padding: "12px 0",
                    borderBottom:
                      index < Math.min(components.length, 5) - 1
                        ? "1px solid var(--color-border-default)"
                        : "none",
                  }}
                >
                  <div>
                    <Link
                      to={`/components/${component.id}`}
                      style={{
                        fontWeight: "500",
                        color: "var(--color-fg-default)",
                      }}
                    >
                      {component.title}
                    </Link>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "var(--color-fg-muted)",
                      }}
                    >
                      {component.downloads} downloads • {component.rating}★
                    </div>
                  </div>
                  <div className="text-right">
                    <div style={{ fontWeight: "600" }}>${component.price}</div>
                    <span
                      className={`badge ${
                        component.published ? "badge-success" : "badge-warning"
                      }`}
                    >
                      {component.published ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>
              ))}
              {components.length > 5 && (
                <div className="text-center mt-3">
                  <Link
                    to="/my-components"
                    className="btn btn-secondary btn-sm"
                  >
                    View All Components
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center" style={{ padding: "40px 20px" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📦</div>
              <h4 className="mb-2">No components yet</h4>
              <p
                style={{ color: "var(--color-fg-muted)", marginBottom: "16px" }}
              >
                Start selling by uploading your first component.
              </p>
              <Link to="/upload" className="btn btn-primary">
                Upload Component
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="card mt-5">
        <div className="card-header">
          <h3 className="mb-0">Sales Performance</h3>
        </div>
        <div className="text-center" style={{ padding: "60px 20px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📊</div>
          <h4 className="mb-2">Performance Analytics</h4>
          <p style={{ color: "var(--color-fg-muted)" }}>
            Detailed sales analytics and performance charts will be available
            here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
