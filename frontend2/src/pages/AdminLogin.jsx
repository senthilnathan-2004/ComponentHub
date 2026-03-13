"use client";

import { useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { adminService } from "../services/api.js";

const AdminLogin = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await adminService.login(formData.email, formData.password);

      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminRefreshToken", data.refreshToken);
      onLogin(data.admin);
    } catch (error) {
      console.error("[v0] Login error:", error);
      setError(error.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        fontFamily:
          '-apple-system, BlinkMacMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          flex: "1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          backgroundColor: "#ffffff",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "400px",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e5e7eb",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "2rem 2rem 1rem 2rem",
              borderBottom: "1px solid #f3f4f6",
            }}
          >
            <h2
              style={{
                textAlign: "center",
                margin: "0",
                fontSize: "1.75rem",
                fontWeight: "700",
                color: "#111827",
                marginBottom: "0.5rem",
              }}
            >
              Admin Access
            </h2>
            <p
              style={{
                textAlign: "center",
                color: "#6b7280",
                fontSize: "0.875rem",
                margin: "0",
              }}
            >
              Sign in to your admin dashboard
            </p>
          </div>

          <div style={{ padding: "2rem" }}>
            <form onSubmit={handleSubmit}>
              {error && (
                <div
                  style={{
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#dc2626",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    marginBottom: "1rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <AlertCircle
                    style={{
                      height: "1.25rem",
                      width: "1.25rem",
                      color: "#ef4444",
                      marginRight: "0.75rem",
                    }}
                  />
                  <span style={{ fontSize: "0.875rem", color: "#b91c1c" }}>
                    {error}
                  </span>
                </div>
              )}

              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  htmlFor="email"
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "0.5rem",
                  }}
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    transition: "all 0.2s ease",
                    outline: "none",
                    backgroundColor: "#ffffff",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#10b981";
                    e.target.style.boxShadow =
                      "0 0 0 3px rgba(16, 185, 129, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#d1d5db";
                    e.target.style.boxShadow = "none";
                  }}
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  htmlFor="password"
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "0.5rem",
                  }}
                >
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      paddingRight: "2.5rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      transition: "all 0.2s ease",
                      outline: "none",
                      backgroundColor: "#ffffff",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#10b981";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(16, 185, 129, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#d1d5db";
                      e.target.style.boxShadow = "none";
                    }}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "0.25rem",
                      borderRadius: "0.25rem",
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "#f3f4f6")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "transparent")
                    }
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff
                        style={{
                          height: "1.25rem",
                          width: "1.25rem",
                          color: "#9ca3af",
                        }}
                      />
                    ) : (
                      <Eye
                        style={{
                          height: "1.25rem",
                          width: "1.25rem",
                          color: "#9ca3af",
                        }}
                      />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  backgroundColor: loading ? "#9ca3af" : "green",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  marginBottom: "1rem",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.backgroundColor = "green";
                    e.target.style.transform = "translateY(0)";
                  }
                }}
              >
                {loading ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "1rem",
                        height: "1rem",
                        border: "2px solid transparent",
                        borderTop: "2px solid white",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                        marginRight: "0.5rem",
                      }}
                    ></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>

              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "0.875rem",
                    margin: "0",
                  }}
                >
                  Authorized personnel only. All access is logged and monitored.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div
        style={{
          flex: "1",
          background: "green",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "3rem",
          position: "relative",
          overflow: "hidden",
        }}
        className="hidden-mobile"
      >
        {/* Background Pattern */}
        <div
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)
          `,
            pointerEvents: "none",
          }}
        ></div>

        <div
          style={{
            textAlign: "center",
            zIndex: "1",
            maxWidth: "400px",
          }}
        >
          {/* Logo/Icon */}
          <div
            style={{
              width: "80px",
              height: "80px",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 2rem auto",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "green",
              }}
            >
              A
            </div>
          </div>

          {/* Main Heading */}
          <h1
            style={{
              fontSize: "3rem",
              fontWeight: "800",
              color: "#ffffff",
              margin: "0 0 1rem 0",
              textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              letterSpacing: "-0.02em",
            }}
          >
            Admin Panel
          </h1>

          {/* Improve Text */}
          <div
            style={{
              fontSize: "1.25rem",
              color: "rgba(255, 255, 255, 0.9)",
              marginBottom: "2rem",
              fontWeight: "500",
              letterSpacing: "0.05em",
            }}
          >
            SECURE ACCESS
          </div>

          {/* Description */}
          <p
            style={{
              fontSize: "1.125rem",
              color: "rgba(255, 255, 255, 0.8)",
              lineHeight: "1.6",
              margin: "0 0 2rem 0",
            }}
          >
            Manage your application with full administrative control. Access
            logs, user data, and system settings.
          </p>

          {/* Feature Pills */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              justifyContent: "center",
            }}
          >
            {["User Management", "System Logs", "Settings"].map(
              (feature, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    color: "#ffffff",
                    padding: "0.5rem 1rem",
                    borderRadius: "20px",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                  }}
                >
                  {feature}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @media (max-width: 768px) {
          .hidden-mobile {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;
