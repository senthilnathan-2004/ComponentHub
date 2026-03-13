"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { dashboardService } from "../services/api";
import { Link } from "react-router-dom";

const ProfileView = () => {
  const { user: authUser } = useAuth();
  const [user] = useState(authUser);
  const [stats, setStats] = useState({
    components: 0,
    purchases: 0,
    favorites: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);

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

    if (user?.id) loadStats();

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [user]);

  if (!user)
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        Loading user data...
      </div>
    );

  const sidebarStyle = {
    width: isMobile ? "100%" : "300px",
    backgroundColor: "#ffffff",
    border: "1px solid #e5e5e5",
    borderRadius: "12px",
    padding: "24px",
    height: "fit-content",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    order: isMobile ? 2 : 1,
  };

  const mainContentStyle = {
    flex: 1,
    backgroundColor: "#ffffff",
    border: "1px solid #e5e5e5",
    borderRadius: "12px",
    padding: "32px",
    marginLeft: isMobile ? "0" : "24px",
    marginBottom: isMobile ? "24px" : "0",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    order: isMobile ? 1 : 2,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        padding: "20px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: "0",
          alignItems: "flex-start",
        }}
      >
        {/* Sidebar */}
        <div style={sidebarStyle}>
          {/* Profile Avatar & Basic Info */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "32px",
              paddingBottom: "24px",
              borderBottom: "1px solid #e5e5e5",
            }}
          >
            {/* <div
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                backgroundColor: "#22c55e",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "36px",
                fontWeight: "bold",
                margin: "0 auto 16px",
                boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
              }}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div> */}
            <h2
              style={{
                margin: "0 0 8px",
                fontSize: "24px",
                fontWeight: "600",
                color: "#000000",
                textTransform: "capitalize",
              }}
            >
              {user.name}
            </h2>
            <div
              style={{
                display: "inline-block",
                backgroundColor: "green",
                color: "white",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "500",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {user.role}
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{ marginBottom: "32px" }}>
            <h3
              style={{
                margin: "0 0 16px",
                fontSize: "18px",
                fontWeight: "600",
                color: "#000000",
              }}
            >
              Quick Stats
            </h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 16px",
                  backgroundColor: "#f0fdf4",
                  borderRadius: "8px",
                  border: "1px solid green",
                }}
              >
                <span style={{ color: "#374151", fontWeight: "500" }}>
                  Components
                </span>
                <span
                  style={{
                    backgroundColor: "green",
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  {loading ? "..." : stats.components}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 16px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                }}
              >
                <span style={{ color: "#374151", fontWeight: "500" }}>
                  Purchases
                </span>
                <span
                  style={{
                    backgroundColor: "#6b7280",
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  {loading ? "..." : stats.purchases}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 16px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                }}
              >
                <span style={{ color: "#374151", fontWeight: "500" }}>
                  Favorites
                </span>
                <span
                  style={{
                    backgroundColor: "#6b7280",
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  {loading ? "..." : stats.favorites}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div style={{ marginBottom: "32px" }}>
            <h3
              style={{
                margin: "0 0 16px",
                fontSize: "18px",
                fontWeight: "600",
                color: "#000000",
              }}
            >
              Contact
            </h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid #f3f4f6",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginBottom: "4px",
                  }}
                >
                  EMAIL
                </div>
                <div style={{ color: "#000000", fontWeight: "500" }}>
                  {user.email}
                </div>
              </div>
              {user.location && (
                <div
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid #f3f4f6",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      marginBottom: "4px",
                    }}
                  >
                    LOCATION
                  </div>
                  <div style={{ color: "#000000", fontWeight: "500" }}>
                    {user.location}
                  </div>
                </div>
              )}
              {user.website && (
                <div
                  style={{
                    padding: "12px 0",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      marginBottom: "4px",
                    }}
                  >
                    WEBSITE
                  </div>
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "green",
                      textDecoration: "none",
                      fontWeight: "500",
                    }}
                  >
                    {user.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <Link to={"/profile/edit"}>
              <button
                style={{
                  width: "100%",
                  padding: "12px 24px",
                  backgroundColor: "green",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 4px rgba(34, 197, 94, 0.2)",
                }}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = "#16a34a")
                }
                onMouseOut={(e) => (e.target.style.backgroundColor = "green")}
              >
                Edit Profile
              </button>
            </Link>
            <Link to={"/dashboard"}>
              <button
                style={{
                  width: "100%",
                  padding: "12px 24px",
                  backgroundColor: "transparent",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "#f9fafb";
                  e.target.style.borderColor = "#9ca3af";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.borderColor = "#d1d5db";
                }}
              >
                Dashboard
              </button>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div style={mainContentStyle}>
          {/* Header */}
          <div
            style={{
              marginBottom: "32px",
              paddingBottom: "24px",
              borderBottom: "1px solid #e5e5e5",
            }}
          >
            <h1
              style={{
                margin: "0 0 8px",
                fontSize: "32px",
                fontWeight: "700",
                color: "#000000",
                textTransform: "capitalize",
              }}
            >
              {user.name}'s Profile
            </h1>
            <p
              style={{
                margin: "0",
                color: "#6b7280",
                fontSize: "16px",
              }}
            >
              Manage your profile information and account settings
            </p>
          </div>

          {/* About Section */}
          {user.bio && (
            <div
              style={{
                marginBottom: "32px",
                padding: "24px",
                backgroundColor: "#f8f9fa",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
              }}
            >
              <h2
                style={{
                  margin: "0 0 16px",
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#000000",
                }}
              >
                About Me
              </h2>
              <p
                style={{
                  margin: "0",
                  color: "#374151",
                  lineHeight: "1.6",
                  fontSize: "16px",
                  textTransform: "capitalize",
                }}
              >
                {user.bio}
              </p>
            </div>
          )}

          {/* Detailed Stats */}
          <div
            style={{
              marginBottom: "32px",
            }}
          >
            <h2
              style={{
                margin: "0 0 20px",
                fontSize: "20px",
                fontWeight: "600",
                color: "#000000",
              }}
            >
              Account Overview
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                gap: "16px",
              }}
            >
              <div
                style={{
                  padding: "24px",
                  backgroundColor: "#f0fdf4",
                  borderRadius: "12px",
                  border: "2px solid green",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "32px",
                    fontWeight: "700",
                    color: "green",
                    marginBottom: "8px",
                  }}
                >
                  {loading ? "..." : stats.components}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "green",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Components Created
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginTop: "4px",
                  }}
                >
                  Total published
                </div>
              </div>

              <div
                style={{
                  padding: "24px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "12px",
                  border: "2px solid #e5e7eb",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "32px",
                    fontWeight: "700",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  {loading ? "..." : stats.purchases}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Purchases Made
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginTop: "4px",
                  }}
                >
                  Components bought
                </div>
              </div>

              <div
                style={{
                  padding: "24px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "12px",
                  border: "2px solid #e5e7eb",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "32px",
                    fontWeight: "700",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  {loading ? "..." : stats.favorites}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Favorites
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginTop: "4px",
                  }}
                >
                  Saved items
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div
            style={{
              padding: "24px",
              backgroundColor: "#f8f9fa",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
            }}
          >
            <h2
              style={{
                margin: "0 0 16px",
                fontSize: "20px",
                fontWeight: "600",
                color: "#000000",
              }}
            >
              Recent Activity
            </h2>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#22c55e",
                    borderRadius: "50%",
                  }}
                ></div>
                <span style={{ color: "#374151", fontSize: "14px" }}>
                  Published new component "Modern Button Set"
                </span>
                <span
                  style={{
                    color: "#6b7280",
                    fontSize: "12px",
                    marginLeft: "auto",
                  }}
                >
                  2 days ago
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#6b7280",
                    borderRadius: "50%",
                  }}
                ></div>
                <span style={{ color: "#374151", fontSize: "14px" }}>
                  Updated profile information
                </span>
                <span
                  style={{
                    color: "#6b7280",
                    fontSize: "12px",
                    marginLeft: "auto",
                  }}
                >
                  1 week ago
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#6b7280",
                    borderRadius: "50%",
                  }}
                ></div>
                <span style={{ color: "#374151", fontSize: "14px" }}>
                  Purchased "Dashboard Template Pro"
                </span>
                <span
                  style={{
                    color: "#6b7280",
                    fontSize: "12px",
                    marginLeft: "auto",
                  }}
                >
                  2 weeks ago
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div
              style={{
                marginTop: "24px",
                padding: "16px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                color: "#dc2626",
              }}
            >
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
