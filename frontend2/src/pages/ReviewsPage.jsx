/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { componentService } from "../services/api";

const StyledReviewsPage = () => {
  const { id: componentId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [component, setComponent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    if (!componentId) return;
    loadComponentAndReviews();
  }, [componentId]);

  const loadComponentAndReviews = async () => {
    setLoading(true);
    try {
      // Load component info
      const comp = await componentService
        .getComponent(componentId)
        .catch(() => null);
      setComponent(comp || null);

      // Load reviews
      const response = await fetch(
        `http://localhost:8000/api/components/${componentId}/reviews`,
        {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("accessToken") || ""
            }`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const reviewsArray = Array.isArray(data)
          ? data
          : data.items || data.reviews || [];
        setReviews(reviewsArray);
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ rating, size = "medium" }) => {
    const starSize = size === "small" ? 16 : size === "large" ? 24 : 20;

    return (
      <div style={{ display: "flex", gap: 2 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            style={{
              color: star <= rating ? "#fbbf24" : "var(--color-border)",
              fontSize: starSize,
              transition: "color 0.2s ease",
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return (
          new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
        );
      case "oldest":
        return (
          new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date)
        );
      case "highest":
        return b.rating - a.rating;
      case "lowest":
        return a.rating - b.rating;
      default:
        return 0;
    }
  });

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
    percentage:
      reviews.length > 0
        ? (reviews.filter((r) => r.rating === rating).length / reviews.length) *
          100
        : 0,
  }));

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "var(--color-canvas-default)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 32,
              height: 32,
              border: "2px solid var(--color-accent-emphasis)",
              borderTop: "2px solid transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          ></div>
          <p style={{ color: "var(--color-fg-muted)" }}>Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-canvas-default)",
        color: "var(--color-fg-default)",
      }}
    >
      <div className="container" style={{ paddingTop: 40, maxWidth: 1200 }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: "var(--color-fg-muted)",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              marginBottom: 16,
              padding: "8px 0",
              fontSize: 14,
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) =>
              (e.target.style.color = "var(--color-fg-default)")
            }
            onMouseLeave={(e) =>
              (e.target.style.color = "var(--color-fg-muted)")
            }
          >
            <svg
              style={{ width: 16, height: 16 }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Download
          </button>

          <h1
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: "var(--color-fg-default)",
              marginBottom: 8,
              lineHeight: 1.2,
            }}
          >
            Reviews for {component?.title || "Component"}
          </h1>
          {component?.seller && (
            <p style={{ color: "var(--color-fg-muted)", fontSize: 16 }}>
              By{" "}
              {component.seller.name.charAt(0).toUpperCase() +
                component.seller.name.slice(1)}
            </p>
          )}
        </div>

        <div className="reviews-grid">
          {/* Left Column - Rating Overview */}
          <div className="rating-overview">
            <div
              className="card"
              style={{
                padding: 24,
                backgroundColor: "var(--color-canvas-subtle)",
                border: "1px solid var(--color-border-default)",
                borderRadius: 8,
                position: "sticky",
                top: 32,
              }}
            >
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 700,
                    color: "var(--color-fg-default)",
                    marginBottom: 8,
                  }}
                >
                  {component?.rating?.toFixed(1) || "0.0"}
                </div>
                <StarRating rating={component?.rating || 0} size="large" />
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--color-fg-muted)",
                    marginTop: 8,
                    margin: 0,
                  }}
                >
                  Based on {reviews.length} review
                  {reviews.length !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Rating Distribution */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {ratingDistribution.map(({ rating, count, percentage }) => (
                  <div
                    key={rating}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      fontSize: 14,
                    }}
                  >
                    <span
                      style={{
                        width: 32,
                        color: "var(--color-fg-muted)",
                        textAlign: "right",
                      }}
                    >
                      {rating}★
                    </span>
                    <div
                      style={{
                        flex: 1,
                        backgroundColor: "var(--color-canvas-default)",
                        borderRadius: 4,
                        height: 8,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: "#fbbf24",
                          height: "100%",
                          borderRadius: 4,
                          width: `${percentage}%`,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        width: 24,
                        color: "var(--color-fg-muted)",
                        textAlign: "right",
                        fontSize: 12,
                      }}
                    >
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Reviews List */}
          <div className="reviews-list">
            {/* Sort Controls */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 24,
              }}
            >
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  margin: 0,
                  color: "var(--color-fg-default)",
                }}
              >
                All Reviews ({reviews.length})
              </h2>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "var(--color-canvas-default)",
                  border: "1px solid var(--color-border-default)",
                  borderRadius: 6,
                  fontSize: 14,
                  color: "var(--color-fg-default)",
                  cursor: "pointer",
                }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
              </select>
            </div>

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <div
                className="card"
                style={{
                  padding: 48,
                  textAlign: "center",
                  backgroundColor: "var(--color-canvas-subtle)",
                  border: "1px solid var(--color-border-default)",
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    margin: "0 auto 16px",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-canvas-default)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    style={{
                      width: 32,
                      height: 32,
                      color: "var(--color-fg-muted)",
                    }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 500,
                    marginBottom: 8,
                    color: "var(--color-fg-default)",
                  }}
                >
                  No reviews yet
                </h3>
                <p style={{ color: "var(--color-fg-muted)", margin: 0 }}>
                  Be the first to share your experience with this component.
                </p>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 24 }}
              >
                {sortedReviews.map((review, index) => (
                  <div
                    key={review._id || review.id || index}
                    className="card"
                    style={{
                      padding: 20,
                      backgroundColor: "var(--color-canvas-subtle)",
                      border: "1px solid var(--color-border-default)",
                      borderRadius: 8,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 16,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          backgroundColor: "green",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: 16,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {review.user?.name
                          ? review.user.name.charAt(0).toUpperCase()
                          : "U"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 8,
                          }}
                        >
                          <div>
                            <h4
                              style={{
                                fontWeight: 500,
                                color: "var(--color-fg-default)",
                                margin: 0,
                                marginBottom: 4,
                              }}
                            >
                              {review.user?.name.charAt(0).toUpperCase() +
                                review.user.name.slice(1) || "Anonymous User"}
                            </h4>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                              }}
                            >
                              <StarRating rating={review.rating} size="small" />
                              <span
                                style={{
                                  fontSize: 12,
                                  color: "var(--color-fg-muted)",
                                }}
                              >
                                {new Date(
                                  review.createdAt || review.date
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p
                          style={{
                            color: "var(--color-fg-default)",
                            lineHeight: 1.6,
                            margin: 0,
                            fontSize: 14,
                          }}
                        >
                          {review.comment}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .reviews-grid {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 40px;
        }
        
        @media (max-width: 1024px) {
          .reviews-grid {
            grid-template-columns: 300px 1fr;
            gap: 32px;
          }
        }
        
        @media (max-width: 768px) {
          .container {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
          
          .reviews-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          
          .rating-overview {
            order: 2;
          }
          
          .reviews-list {
            order: 1;
          }
          
          .card {
            position: static !important;
          }
        }
        
        @media (max-width: 480px) {
          h1 {
            font-size: 24px !important;
          }
          
          h2 {
            font-size: 20px !important;
          }
          
          .reviews-grid {
            gap: 16px !important;
          }
          
          .card {
            padding: 16px !important;
          }
        }
        
        .card:hover {
          border-color: var(--color-border-muted);
          transition: border-color 0.2s ease;
        }
        
        select:focus {
          outline: 2px solid var(--color-accent-emphasis);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};

export default StyledReviewsPage;
