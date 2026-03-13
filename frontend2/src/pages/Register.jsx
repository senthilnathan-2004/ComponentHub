"use client";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "buyer",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const { ...userData } = formData;
      await register(userData);
      navigate("/dashboard");
    } catch (error) {
      setError(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
              Join ComponentHub
            </h2>
            <p
              style={{
                textAlign: "center",
                color: "#6b7280",
                fontSize: "0.875rem",
                margin: "0",
              }}
            >
              Create your account to get started.
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
                  {error}
                </div>
              )}

              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "0.5rem",
                  }}
                >
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
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
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label
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
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
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
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label
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
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Create a password"
                    minLength="6"
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

              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "0.5rem",
                  }}
                >
                  Confirm Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Confirm your password"
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
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
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

              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "0.5rem",
                  }}
                >
                  Account Type
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
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
                >
                  <option value="buyer">Buyer - Purchase components</option>
                  <option value="seller">Seller - Sell your components</option>
                </select>
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
                    e.target.style.backgroundColor = "#059669";
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
                {loading ? "Creating account..." : "Create account"}
              </button>

              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "0.875rem",
                    margin: "0",
                  }}
                >
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    style={{
                      color: "green",
                      textDecoration: "none",
                      fontWeight: "500",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.textDecoration = "underline";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.textDecoration = "none";
                    }}
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </form>

            <div
              style={{
                margin: "1.5rem 0",
                height: "1px",
                backgroundColor: "#e5e7eb",
              }}
            ></div>

            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#9ca3af",
                  marginBottom: "1rem",
                  lineHeight: "1.4",
                }}
              >
                By creating an account, you agree to our{" "}
                <strong style={{ color: "#374151" }}>Terms of Service</strong>{" "}
                and <strong style={{ color: "#374151" }}>Privacy Policy</strong>
              </p>
            </div>
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
                color: "#10b981",
              }}
            >
              C
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
            ComponentHub
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
            IMPROVE
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
            Join thousands of developers building amazing components. Start your
            journey with ComponentHub today.
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
            {["Premium Components", "Fast Development", "Modern Design"].map(
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
        @media (max-width: 768px) {
          .hidden-mobile {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Register;
