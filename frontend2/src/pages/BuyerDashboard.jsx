/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { dashboardService, favoriteService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import FavoriteButton from "../components/FavoriteButton";

const BuyerDashboard = () => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [purchasesData, favoritesData] = await Promise.all([
        dashboardService.getUserPurchases(user.id),
        favoriteService.getUserFavorites(),
      ]);

      // Ensure we're using the 'items' array from API response
      setPurchases(purchasesData?.items || []);
      setFavorites(favoritesData?.items || []);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalSpent = Array.isArray(purchases)
    ? purchases.reduce((sum, purchase) => sum + (purchase.amount || 0), 0)
    : 0;

  const formatPrice = (price = 0) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(price || 0));

  const renderStars = (rating = 0) => {
    const stars = [];
    const r = Math.max(0, Math.min(5, Number(rating) || 0));
    const fullStars = Math.floor(r);

    for (let i = 0; i < fullStars; i++)
      stars.push(
        <span key={`full-${i}`} style={{ color: "var(--color-warning-fg)" }}>
          ★
        </span>
      );

    const emptyStars = 5 - fullStars;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} style={{ color: "var(--color-fg-muted)" }}>
          ☆
        </span>
      );
    }
    return stars;
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
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1>My Purchases</h1>
          <p style={{ color: "var(--color-fg-muted)" }}>
            Manage your purchased components and favorites.
          </p>
        </div>
        <Link to="/components" className="btn btn-primary">
          Browse Components
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid mb-5">
        <div className="stat-card">
          <div className="stat-value">{purchases.length}</div>
          <div className="stat-label">Total Purchases</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(totalSpent)}
          </div>
          <div className="stat-label">Total Spent</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{favorites.length}</div>
          <div className="stat-label">Favorites</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{purchases.length}</div>
          <div className="stat-label">Downloads</div>
        </div>
      </div>

      {/* Purchases Section */}
      <div className="card mb-5">
        <div className="card-header">
          <h3 className="mb-0">Recent Purchases</h3>
        </div>

        {purchases.length > 0 ? (
          <div>
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="d-flex align-items-center justify-content-between"
                style={{
                  padding: "16px 0",
                  borderBottom: "1px solid var(--color-border-default)",
                }}
              >
                <div className="d-flex align-items-center">
                  <img
                    src={
                      purchase.component?.screenshot ||
                      purchase.component?.screenshots?.[0] ||
                      "/placeholder.svg?height=60&width=80&query=component+preview"
                    }
                    alt={purchase.component?.title || "Component"}
                    style={{
                      width: "80px",
                      height: "60px",
                      objectFit: "cover",
                      borderRadius: "6px",
                      marginRight: "16px",
                    }}
                  />
                  <div>
                    <h4 className="mb-1">
                      <Link
                        to={`/components/${purchase.component?.id}`}
                        style={{ color: "var(--color-fg-default)" }}
                      >
                        {purchase.component?.title || "Untitled Component"}
                      </Link>
                    </h4>
                    <p
                      style={{
                        color: "var(--color-fg-muted)",
                        margin: 0,
                        fontSize: "14px",
                      }}
                    >
                      Purchased on{" "}
                      {purchase.purchaseDate
                        ? new Date(purchase.purchaseDate).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                </div>
                <div
                  className="d-flex align-items-center"
                  style={{ gap: "12px" }}
                >
                  <div className="text-right">
                    <div
                      style={{
                        fontWeight: "600",
                        color: "var(--color-success-fg)",
                      }}
                    >
                      ${purchase.amount || 0}
                    </div>
                  </div>
                  {purchase.downloadUrl && (
                    <a
                      href={purchase.downloadUrl}
                      className="btn btn-secondary btn-sm"
                      download
                    >
                      Download
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center" style={{ padding: "60px 20px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🛒</div>
            <h4 className="mb-2">No purchases yet</h4>
            <p style={{ color: "var(--color-fg-muted)", marginBottom: "16px" }}>
              Start building amazing projects with premium components.
            </p>
            <Link to="/components" className="btn btn-primary">
              Browse Components
            </Link>
          </div>
        )}
      </div>

      {/* Favorites Section */}
      <div className="card">
        <div className="card-header">
          <h3 className="mb-0">Favorite Components</h3>
        </div>

        {favorites.length > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            {favorites.map((component) => (
              <div key={component.id} className="component-card" style={{ backgroundColor: "var(--color-canvas-subtle)", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--color-border-default)" }}>
                <div style={{ position: "relative" }}>
                  <Link to={`/components/${component.id}`}>
                    <img
                      src={
                        component.screenshots?.[0] ||
                        "/placeholder.svg?height=150&width=200&query=component+preview"
                      }
                      alt={component.title || "Component"}
                      style={{
                        height: "150px",
                        width: "100%",
                        objectFit: "cover",
                        borderRadius: "0",
                      }}
                    />
                  </Link>
                  
                  {/* Favorite Button - Top Right Corner */}
                  <div
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      zIndex: 10,
                    }}
                  >
                    <FavoriteButton componentId={component.id} />
                  </div>
                </div>
                
                <div style={{ padding: "16px" }}>
                  <h4 className="mb-2" style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px" }}>
                    <Link
                      to={`/components/${component.id}`}
                      style={{ color: "var(--color-fg-default)", textDecoration: "none" }}
                    >
                      {component.title || "Untitled Component"}
                    </Link>
                  </h4>
                  
                  <p
                    style={{
                      color: "var(--color-fg-muted)",
                      fontSize: "12px",
                      marginBottom: "12px",
                      lineHeight: "1.4"
                    }}
                  >
                    {component.description && component.description.length > 80
                      ? `${component.description.substring(0, 80)}...`
                      : component.description || "No description available"}
                  </p>
                  
                  <div className="d-flex align-items-center mb-2">
                    <div className="rating" style={{ marginRight: "8px" }}>
                      {renderStars(component.rating)}
                      <span
                        style={{
                          marginLeft: "4px",
                          fontSize: "11px",
                          color: "var(--color-fg-muted)",
                        }}
                      >
                        ({Number(component.reviewCount || 0)})
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--color-fg-muted)" }}>
                      {Number(component.downloads || 0)} downloads
                    </div>
                  </div>
                  
                  <div className="d-flex align-items-center justify-content-between">
                    <div style={{ fontSize: "16px", fontWeight: "600", color: "var(--color-success-fg)" }}>
                      {formatPrice(component.price)}
                    </div>
                    <div>
                      {Array.isArray(component.tags) &&
                        component.tags.slice(0, 1).map((tag) => (
                          <span key={tag} className="tag" style={{ fontSize: "10px" }}>
                            {tag}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center" style={{ padding: "60px 20px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>❤️</div>
            <h4 className="mb-2">No favorites yet</h4>
            <p style={{ color: "var(--color-fg-muted)", marginBottom: "16px" }}>
              Save components you like for easy access later.
            </p>
            <Link to="/components" className="btn btn-primary">
              Discover Components
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerDashboard;
