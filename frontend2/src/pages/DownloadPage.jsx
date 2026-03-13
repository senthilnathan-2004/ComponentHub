/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { componentService } from "../services/api";

const DownloadPage = () => {
  const { id: componentId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [component, setComponent] = useState(null);
  const [files, setFiles] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [fileDownloadLoading, setFileDownloadLoading] = useState({});

  useEffect(() => {
    if (!componentId) return;
    loadDownloadInfo();
    loadReviews();
  }, [componentId]);

  const hadleDownload = async ()=>{
    try {
      await componentService.handleDownload(componentId);
    } catch (error) {
      setError(error?.message || "Failed to get handledownload links");
    }
  }

  const loadDownloadInfo = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await componentService.downloadComponent(componentId);
      const comp = await componentService
        .getComponent(componentId)
        .catch(() => null);
      setComponent(comp || null);
      setFiles(res.files || []);
    } catch (err) {
      console.error("Failed to load download info:", err);
      setError(err?.message || "Failed to get download links");
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      console.log("[v0] Loading reviews for component:", componentId);
      const data = await componentService.getComponentReviews(componentId, {});
      console.log("[v0] Reviews response:", data);
      const reviewsArray = Array.isArray(data)
        ? data
        : data.items || data.reviews || [];
      console.log("[v0] Processed reviews array:", reviewsArray);
      setReviews(reviewsArray);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    }
  };

  const handleSubmitReview = async () => {
    if (!userRating || !userReview.trim()) return;

    setIsSubmittingReview(true);
    setError("");
    setSuccessMessage("");

    try {
      console.log("[v0] Submitting review:", {
        rating: userRating,
        comment: userReview,
      });
      const response = await fetch(
        `http://localhost:8000/api/components/${componentId}/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${
              localStorage.getItem("accessToken") || ""
            }`,
          },
          body: JSON.stringify({
            rating: userRating,
            comment: userReview,
          }),
        }
      );

      console.log("[v0] Review submission response:", response.status);

      if (response.ok) {
        setUserRating(0);
        setUserReview("");
        setSuccessMessage(
          "Review submitted successfully! It may take a moment to appear."
        );
        setTimeout(() => {
          loadReviews();
          setSuccessMessage("");
        }, 1000);
      } else {
        const errorData = await response.json();
        console.log("[v0] Review submission error:", errorData);
        setError(
          errorData.error?.message ||
            errorData.message ||
            "Failed to submit review"
        );
      }
    } catch (err) {
      console.error("[v0] Review submission failed:", err);
      setError("Failed to submit review. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const StarRating = ({
    rating,
    onRatingChange,
    interactive = false,
    size = "medium",
  }) => {
    const starSize = size === "small" ? 16 : size === "large" ? 24 : 20;

    return (
      <div style={{ display: "flex", gap: 2 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onMouseEnter={() => interactive && setHoveredStar(star)}
            onMouseLeave={() => interactive && setHoveredStar(0)}
            onClick={() =>
              interactive && onRatingChange && onRatingChange(star)
            }
            style={{
              background: "none",
              border: "none",
              cursor: interactive ? "pointer" : "default",
              padding: 2,
              color:
                star <= (interactive ? hoveredStar || rating : rating)
                  ? "#fbbf24"
                  : "var(--color-border-default)",
              fontSize: starSize,
              transition: "color 0.2s ease",
            }}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  const handleDirectDownload = async (url, filename) => {
    setFileDownloadLoading((prev) => ({ ...prev, [url]: true }));
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch file");
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename || "download";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download failed:", error);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "";
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setFileDownloadLoading((prev) => ({ ...prev, [url]: false }));
    }
  };

  const handleDownloadAllAsZip = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(
        `http://localhost:8000/api/components/${componentId}/download-zip`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("accessToken") || ""
            }`,
          },
        }
      );

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to download zip");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${component?.title || "component"}-files.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Zip download failed:", err);
      setError(err?.message || "Failed to download zip");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading" style={{ padding: 40, textAlign: "center" }}>
        <div className="spinner" />
        <div style={{ marginTop: 12 }}>Loading download info...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 40, maxWidth: 1200 }}>
      <div className="mb-4">
        <h1>Download {component?.title || "Component"}</h1>
        {component?.seller && (
          <div style={{ color: "var(--color-fg-muted)", marginBottom: 8 }}>
            By{" "}
            {component.seller.name.charAt(0).toUpperCase() +
              component.seller.name.slice(1)}
          </div>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <StarRating rating={component?.rating || 0} />
          <span style={{ color: "var(--color-fg-muted)", fontSize: 14 }}>
            {component?.rating?.toFixed(1) || "0.0"} (
            {component?.reviewCount || 0} reviews)
          </span>
          <span style={{ color: "var(--color-fg-muted)", fontSize: 14 }}>
            • {component?.stars || 0} stars
          </span>
        </div>
        <p style={{ color: "var(--color-fg-muted)" }}>
          Download the files you purchased. If you need help, contact support.
        </p>
        <Link className="btn btn-danger " to={`/report/${componentId}`}>
          Report Component
        </Link>
      </div>

      <div className="download-grid">
        {/* Left Column - Downloads */}
        <div className="download-section">
          <div style={{ marginBottom: 20 }}>
            <strong>Files ({files.length})</strong>
          </div>

          {files.length === 0 ? (
            <div style={{ color: "var(--color-fg-muted)" }}>
              No downloadable files found.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {files.map((f, idx) => (
                <div
                  key={idx}
                  className="card d-flex justify-content-between align-items-center"
                  style={{
                    padding: 12,
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{f.name}</div>
                    <div
                      style={{ fontSize: 13, color: "var(--color-fg-muted)" }}
                    >
                      {f.type} •{" "}
                      {f.size
                        ? `${(f.size / 1024).toFixed(1)} KB`
                        : "Unknown size"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        handleDirectDownload(f.url, f.name);
                        hadleDownload()
                      }}
                      disabled={fileDownloadLoading[f.url] || loading}
                    >
                      {fileDownloadLoading[f.url]
                        ? "Downloading..."
                        : "Download"}
                    </button>
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm"
                      style={{
                        textDecoration: "none",
                        padding: "8px 12px",
                        border: "1px solid var(--color-border-default)",
                        backgroundColor: "var(--color-canvas-subtle)",
                      }}
                    >
                      Preview
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              marginTop: 24,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <button
              className="btn btn-primary"
              onClick={() => {
                handleDownloadAllAsZip();
                hadleDownload()
              }}
              disabled={loading || files.length === 0}
            >
              Download All as ZIP
            </button>
            <button className="btn btn-secondary" onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        </div>

        {/* Right Column - Reviews & Rating */}
        <div className="reviews-section">
          <div className="card" style={{ padding: 20, marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16, fontSize: 18 }}>
              Rate this Component
            </h3>

            {successMessage && (
              <div
                style={{
                  backgroundColor: "#d4edda",
                  color: "#155724",
                  padding: 12,
                  borderRadius: 6,
                  marginBottom: 16,
                  fontSize: 14,
                  border: "1px solid #c3e6cb",
                }}
              >
                {successMessage}
              </div>
            )}

            {error && (
              <div
                style={{
                  backgroundColor: "#f8d7da",
                  color: "#721c24",
                  padding: 12,
                  borderRadius: 6,
                  marginBottom: 16,
                  fontSize: 14,
                  border: "1px solid #f5c6cb",
                }}
              >
                {error}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                Your Rating
              </div>
              <StarRating
                rating={userRating}
                onRatingChange={setUserRating}
                interactive={true}
                size="large"
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Your Review
              </label>
              <textarea
                value={userReview}
                onChange={(e) => setUserReview(e.target.value)}
                placeholder="Share your experience with this component..."
                style={{
                  width: "100%",
                  minHeight: 80,
                  padding: 12,
                  border: "1px solid var(--color-border-default)",
                  borderRadius: 6,
                  backgroundColor: "var(--color-canvas-default)",
                  color: "var(--color-fg-default)",
                  fontSize: 14,
                  resize: "vertical",
                }}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={handleSubmitReview}
              disabled={!userRating || !userReview.trim() || isSubmittingReview}
              style={{ width: "100%" }}
            >
              {isSubmittingReview ? "Submitting..." : "Submit Review"}
            </button>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ marginBottom: 16, fontSize: 18 }}>
              Reviews ({reviews.length})
            </h3>

            {reviews.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "var(--color-fg-muted)",
                  padding: 20,
                  fontSize: 14,
                }}
              >
                No reviews yet. Be the first to review!
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {reviews.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      color: "var(--color-fg-muted)",
                      padding: 20,
                      fontSize: 14,
                    }}
                  >
                    No reviews yet. Be the first to review!
                  </div>
                ) : (
                  <>
                    {/* Show only first review */}
                    <div
                      key={reviews[0]._id || reviews[0].id}
                      style={{
                        borderBottom: "1px solid var(--color-border-muted)",
                        paddingBottom: 16,
                      }}
                      className="review-item"
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            backgroundColor: "green",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: 14,
                            fontWeight: 600,
                          }}
                        >
                          {reviews[0].user?.name
                            ? reviews[0].user.name.charAt(0).toUpperCase()
                            : "U"}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 14 }}>
                            {reviews[0].user?.name.charAt(0).toUpperCase() +
                              reviews[0].user.name.slice(1) || "Anonymous User"}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <StarRating
                              rating={reviews[0].rating}
                              size="small"
                            />
                            <span
                              style={{
                                fontSize: 12,
                                color: "var(--color-fg-muted)",
                              }}
                            >
                              {new Date(
                                reviews[0].createdAt || reviews[0].date
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14,
                          lineHeight: 1.5,
                          color: "var(--color-fg-default)",
                        }}
                      >
                        {reviews[0].comment}
                      </p>
                    </div>

                    {/* Show All button */}
                    {reviews.length > 0 && (
                      <div style={{ marginTop: 12, textAlign: "center" }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => navigate(`/reviews/${componentId}`)}
                        >
                          Show All Reviews ({reviews.length})
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .download-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 32px;
        }
        
        @media (max-width: 768px) {
          .container {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
          
          .download-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          
          .card {
            margin-bottom: 16px !important;
          }
          
          .reviews-section {
            order: 2;
          }
          
          .download-section {
            order: 1;
          }
        }
        
        @media (max-width: 480px) {
          .btn {
            font-size: 14px !important;
            padding: 8px 16px !important;
          }
          
          h1 {
            font-size: 24px !important;
          }
          
          h3 {
            font-size: 16px !important;
          }
          
          .download-grid {
            gap: 16px !important;
          }
        }
        
        .review-item:last-child {
          border-bottom: none !important;
          padding-bottom: 0 !important;
        }
      `}</style>
    </div>
  );
};

export default DownloadPage;
