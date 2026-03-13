"use client";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/components?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setShowUserMenu(false);
  };

  return (
    <header className="header">
      <div className="container">
        <nav className="header-nav">
          <Link to="/" className="logo">
            ComponentHub
          </Link>

          <form onSubmit={handleSearch} className="search-bar">
            <input
              type="text"
              className="form-control"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <div className="user-menu">
            <Link to="/about" className="btn btn-secondary btn-sm home-btn">
              About
            </Link>
            <Link to="/components" className="btn btn-secondary btn-sm">
              Browse
            </Link>

            {isAuthenticated ? (
              <div style={{ position: "relative" }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <div
                    className="avatar"
                    style={{
                      padding: 0,
                      margin: 0,
                      marginRight: "3px",
                      backgroundColor: "var(--color-border-default)",
                      color: "var(--color-fg-muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      width: "20px",
                      height: "20px",
                    }}
                  >
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>

                  {user?.name
                    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
                    : "U"}
                </button>

                {showUserMenu && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      marginTop: "8px",
                      backgroundColor: "var(--color-canvas-default)",
                      border: "1px solid var(--color-border-default)",
                      borderRadius: "6px",
                      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                      minWidth: "200px",
                      zIndex: 1000,
                    }}
                  >
                    <div style={{ padding: "8px 0" }}>
                      <Link
                        to="/profile"
                        className="nav-link"
                        style={{ padding: "8px 16px", display: "block" }}
                        onClick={() => setShowUserMenu(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        to="/dashboard"
                        className="nav-link"
                        style={{ padding: "8px 16px", display: "block" }}
                        onClick={() => setShowUserMenu(false)}
                      >
                        Dashboard
                      </Link>
                      {user?.role === "seller" && (
                        <>
                          <Link
                            to="/seller-dashboard"
                            className="nav-link"
                            style={{ padding: "8px 16px", display: "block" }}
                            onClick={() => setShowUserMenu(false)}
                          >
                            Seller Dashboard
                          </Link>
                          <Link
                            to="/upload"
                            className="nav-link"
                            style={{ padding: "8px 16px", display: "block" }}
                            onClick={() => setShowUserMenu(false)}
                          >
                            Upload Component
                          </Link>
                        </>
                      )}
                      {user?.role === "buyer" && (
                        <Link
                          to="/buyer-dashboard"
                          className="nav-link"
                          style={{ padding: "8px 16px", display: "block" }}
                          onClick={() => setShowUserMenu(false)}
                        >
                          My Purchases
                        </Link>
                      )}
                      <hr
                        style={{
                          margin: "8px 0",
                          border: "none",
                          borderTop: "1px solid var(--color-border-default)",
                        }}
                      />
                      <button
                        onClick={handleLogout}
                        className="nav-link"
                        style={{
                          padding: "8px 16px",
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--color-danger-fg)",
                        }}
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary btn-sm">
                  Sign in
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
