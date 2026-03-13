import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { favoriteService } from "../services/api";
import "../styles/favoriteButtonStyles.css";

const FavoriteButton = ({ componentId, className = "", style = {} }) => {
  const { user, isAuthenticated } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if component is favorited on mount
  useEffect(() => {
    if (isAuthenticated && user?.role === "buyer" && componentId) {
      checkFavoriteStatus();
    }
  }, [componentId, isAuthenticated, user]);

  const checkFavoriteStatus = async () => {
    try {
      const response = await favoriteService.checkFavorite(componentId);
      setIsFavorited(response.isFavorited);
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  };

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Only allow buyers to use favorites
    if (!isAuthenticated || user?.role !== "buyer") {
      return;
    }

    if (loading) return;

    setLoading(true);
    try {
      if (isFavorited) {
        await favoriteService.removeFromFavorites(componentId);
        setIsFavorited(false);
      } else {
        await favoriteService.addToFavorites(componentId);
        setIsFavorited(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      // Optionally show error message to user
    } finally {
      setLoading(false);
    }
  };

  // Don't render if not authenticated or not a buyer
  if (!isAuthenticated || user?.role !== "buyer") {
    return null;
  }

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={loading}
      className={`favorite-button ${isFavorited ? 'favorited' : ''} ${className}`}
      style={{
        background: "none",
        border: "none",
        cursor: loading ? "not-allowed" : "pointer",
        padding: "4px",
        borderRadius: "4px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
        ...style,
      }}
      title={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={isFavorited ? "var(--color-success-fg)" : "none"}
        stroke={isFavorited ? "var(--color-success-fg)" : "#656d76"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          transition: "all 0.2s ease",
          transform: isFavorited ? "scale(1.1)" : "scale(1)",
        }}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
      {loading && (
        <div
          style={{
            position: "absolute",
            width: "16px",
            height: "16px",
            border: "2px solid #f3f3f3",
            borderTop: "2px solid var(--color-success-fg)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
      )}
    </button>
  );
};

export default FavoriteButton;
