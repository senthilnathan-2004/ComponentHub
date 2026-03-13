/* eslint-disable no-unused-vars */
"use client";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { dashboardService, componentService } from "../services/api";
import TopRatedSection from "../components/TopRatedSection";

const Dashboard = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    components: 0,
    purchases: 0,
    favorites: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [topRated, setTopRated] = useState([]);
  const [topRatedLoading, setTopRatedLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const [componentsRes, purchasesRes, favoritesRes] = await Promise.all([
          dashboardService.getSellerStats(user.id),
          dashboardService.getUserPurchases(user.id),
          dashboardService.getUserFavorites(user.id),
        ]);

        setStats({
          components: componentsRes.totalComponents || 0,
          purchases: purchasesRes.length || 0,
          favorites: favoritesRes.length || 0,
        });
      } catch (err) {
        console.error(err);
        setError("Failed to load user stats");
      } finally {
        setLoading(false);
      }
    };

    const loadTopRated = async () => {
      try {
        setTopRatedLoading(true);
        const topRatedRes = await componentService.getDashboardTopRated();
        setTopRated(topRatedRes.components || []);
      } catch (err) {
        console.error("Failed to load top rated components:", err);
      } finally {
        setTopRatedLoading(false);
      }
    };

    if (user?.id) {
      loadStats();
      loadTopRated();
    }
  }, [user]);

  return (
    <div className="container" style={{ paddingTop: "40px" }}>
      <div className="mb-4">
        <h1>Welcome back, {user?.name}!</h1>
        <p style={{ color: "var(--color-fg-muted)" }}>
          Manage your account and access your personalized dashboard.
        </p>
      </div>

      <div className="grid grid-cols-2" style={{ gap: "24px" }}>
        {/* Profile Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="mb-0">Profile</h3>
          </div>

          <div className="d-flex align-items-center mb-3">
            <div
              className="avatar"
              style={{
                borderRadius: "50%",
                marginRight: "16px",
                backgroundColor: "var(--color-border-default)",
                color: "var(--color-fg-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "25px",
                width: "64px",
                height: "64px",
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            {/* <img
              src={user?.avatar || "/placeholder.svg?height=64&width=64&query=user+avatar"}
              alt={user?.name}
              style={{ width: "64px", height: "64px", borderRadius: "50%", marginRight: "16px" }}
            /> */}
            <div>
              <Link to={"/profile"} style={{ color: "inherit" }}>
                <h4 className="mb-1">
                  {user?.name.charAt(0).toUpperCase() + user.name.slice(1)}
                </h4>
              </Link>
              <p className="mb-1" style={{ color: "var(--color-fg-muted)" }}>
                {user?.email}
              </p>
              <span className="badge badge-success">{user?.role}</span>
            </div>
          </div>
          <Link to="/profile/edit" className="btn btn-secondary">
            Edit Profile
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="mb-0">Quick Actions</h3>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <Link to="/components" className="btn btn-secondary">
              Browse Components
            </Link>

            {user?.role === "seller" && (
              <>
                <Link to="/seller-dashboard" className="btn btn-primary">
                  Seller Dashboard
                </Link>
                <Link to="/upload" className="btn btn-secondary">
                  Upload Component
                </Link>
              </>
            )}

            {user?.role === "buyer" && (
              <Link to="/buyer-dashboard" className="btn btn-primary">
                My Purchases
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Role-specific sections */}
      {user?.role === "seller" && (
        <div className="mt-5">
          <h2 className="mb-3">Seller Overview</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">
                {stats.components ? stats.components : 0}
              </div>
              <div className="stat-label">Components</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">$0</div>
              <div className="stat-label">Total Revenue</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">0</div>
              <div className="stat-label">Total Sales</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">0</div>
              <div className="stat-label">Downloads</div>
            </div>
          </div>
          <div className="text-center mt-4">
            <Link to="/upload" className="btn btn-primary">
              Upload Your First Component
            </Link>
          </div>
        </div>
      )}

      {user?.role === "buyer" && (
        <div className="mt-5">
          <h2 className="mb-3">Buyer Overview</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.purchases ? stats : 0}</div>
              <div className="stat-label">Purchases</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">$0</div>
              <div className="stat-label">Total Spent</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {stats.favorites ? stats.favorites : 0}
              </div>
              <div className="stat-label">Favorites</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">0</div>
              <div className="stat-label">Downloads</div>
            </div>
          </div>
          <div className="text-center mt-4">
            <Link to="/components" className="btn btn-primary">
              Browse Components
            </Link>
          </div>
        </div>
      )}
      
      {/* Top Rated Components Section */}
      <TopRatedSection 
        components={topRated}
        loading={topRatedLoading}
      />
    </div>
  );
};

export default Dashboard;
