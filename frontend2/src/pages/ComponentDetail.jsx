/* eslint-disable no-constant-binary-expression */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { componentService, paymentService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import Modal from "../components/Modal";
import FavoriteButton from "../components/FavoriteButton";
// ChatWidget import removed - chat functionality disabled

const ComponentDetail = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [component, setComponent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [setPurchaseSuccess] = useState(false);

  useEffect(() => {
    loadComponent();
    loadReviews();
  }, [id]);

  const loadComponent = async () => {
    try {
      setLoading(true);
      const data = await componentService.getComponent(id);
      setComponent(data);
    } catch (error) {
      setError("Failed to load component");
      console.error("Error loading component:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      setReviewsLoading(true);
      const data = await componentService.getComponentReviews(id);
      setReviews(data.items);
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handlePurchase = async (paymentData) => {
    try {
      setPurchasing(true);

      const purchaseData = {
        componentId: id,
        userId: user.id,
        amount: component.price,
        paymentMethod: "card",
        cardDetails: paymentData,
      };

      const result = await paymentService.purchaseComponent(purchaseData);

      if (result.success) {
        setPurchaseSuccess(true);
        setShowPurchaseModal(false);
        // Show success message or redirect to download
        alert(`Purchase successful! Transaction ID: ${result.transactionId}`);
      }
    } catch (error) {
      alert("Purchase failed: " + error.message);
    } finally {
      setPurchasing(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={i} className="star">
          ★
        </span>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half" className="star">
          ☆
        </span>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
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

  if (error || !component) {
    return (
      <div className="container" style={{ paddingTop: "40px" }}>
        <div className="alert alert-danger">
          {error || "Component not found"}
        </div>
      </div>
    );
  }

  return (
    <div
      className="container"
      style={{ paddingTop: "24px", paddingBottom: "40px" }}
    >
      {/* Breadcrumb */}
      <div className="breadcrumb mb-4">
        <Link to="/" className="breadcrumb-item">
          Home
        </Link>
        <Link to="/components" className="breadcrumb-item">
          Components
        </Link>
        <span className="breadcrumb-item">{component.title}</span>
      </div>

      <div
        className="grid grid-cols-2"
        style={{ gap: "40px", alignItems: "start" }}
      >
        {/* Left Column - Images and Preview */}
        <div>
          <div style={{ position: "relative" }}>
            <img
              src={
                component.screenshots?.[0] ||
                "/placeholder.svg?height=400&width=600&query=component+preview" ||
                "/placeholder.svg"
              }
              alt={component.title}
              style={{
                width: "100%",
                height: "400px",
                objectFit: "cover",
                borderRadius: "8px",
                border: "1px solid var(--color-border-default)",
                marginBottom: "24px",
              }}
            />
            
            {/* Favorite Button - Top Right Corner */}
            <div
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                zIndex: 10,
              }}
            >
              <FavoriteButton 
                componentId={component.id} 
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                }}
              />
            </div>
          </div>

          {/* Code Preview */}
          {component.previewSnippet && (
            <div className="card">
              <div className="card-header">
                <h3 className="mb-0">Code Preview</h3>
              </div>
              <pre
                style={{
                  backgroundColor: "var(--color-canvas-inset)",
                  padding: "16px",
                  borderRadius: "6px",
                  overflow: "auto",
                  fontSize: "14px",
                  lineHeight: "1.4",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                <code>{component.previewSnippet}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Right Column - Details */}
        <div>
          <h1 className="mb-3">{component.title}</h1>

          <Link
            to={`/seller/${component.seller?.id}`}
            style={{ textDecoration: "none", color: "var(--color-fg-default)" }}
          >
            <div className="d-flex align-items-center mb-3">
              {component.seller?.avatar ? (
                <img
                  src={component.seller.avatar}
                  alt={component.seller?.name || "Seller"}
                  className="avatar"
                  style={{ marginRight: "12px" }}
                />
              ) : (
                <div
                  className="avatar"
                  style={{
                    marginRight: "12px",
                    backgroundColor: "var(--color-border-default)",
                    color: "var(--color-fg-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                  }}
                >
                  {component.seller?.name
                    ? component.seller.name.charAt(0).toUpperCase()
                    : "U"}
                </div>
              )}
              <div>
                <div style={{ fontWeight: "600" }}>
                  {component.seller?.name
                    ? component.seller.name.charAt(0).toUpperCase() +
                      component.seller.name.slice(1)
                    : "Unknown Seller"}
                </div>
                <div
                  style={{ fontSize: "14px", color: "var(--color-fg-muted)" }}
                >
                  {component.seller?.totalSales} sales •{" "}
                  {component.seller?.rating}★ rating
                </div>
              </div>
            </div>
          </Link>

          <div className="d-flex align-items-center mb-4">
            <div className="rating" style={{ marginRight: "16px" }}>
              {renderStars(component.rating)}
              <span style={{ marginLeft: "8px" }}>
                {component.rating} ({component.reviewCount} reviews)
              </span>
            </div>
            <div style={{ color: "var(--color-fg-muted)" }}>
              {component.downloads} downloads
            </div>
          </div>

          {component.demoEnabled && (
            <div style={{ marginTop: -5, marginBottom: 12 }}>
              <strong>Live Demo:</strong>{" "}
              <a
                href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'}/demo/${component.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline-primary"
                style={{ marginLeft: "8px", padding: "4px 12px", marginRight: "8px" }}
              >
                Open Demo
              </a>
              <Link
                to={`/components/${id}/editable-demo`}
                className="btn btn-sm btn-primary"
                style={{ padding: "4px 12px" }}
              >
                Editable Demo
              </Link>
            </div>
          )}

          <div className="price-tag mb-4" style={{ fontSize: "32px" }}>
            {formatPrice(component.price)}
          </div>

          <p className="mb-4" style={{ fontSize: "16px", lineHeight: "1.6" }}>
            {component.description}
          </p>

          {/* Tags */}
          <div className="mb-4">
            {component.tags?.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>

          {/* Purchase Button */}
          <div className="mb-4">
            {isAuthenticated || localStorage.getItem("adminToken") ? (
              <div>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => setShowPurchaseModal(true)}
                  style={{ width: "100%" }}
                >
                  Purchase Component
                </button>
                <Link
                  to={`/components/${id}/download`}
                  className="btn btn-secondary btn-lg"
                  style={{ width: "100%", marginTop: "12px" }}
                >
                  Download All Files
                </Link>
              </div>
            ) : (
              <div>
                <Link
                  to="/login"
                  className="btn btn-primary btn-lg"
                  style={{ width: "100%" }}
                >
                  Sign in to Purchase
                </Link>
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--color-fg-muted)",
                    textAlign: "center",
                    marginTop: "8px",
                  }}
                >
                  Need an account? <Link to="/register">Sign up</Link>
                </p>
              </div>
            )}
          </div>

          {/* Component Info */}
          <div className="card">
            <div className="card-header">
              <h3 className="mb-0">What's Included</h3>
            </div>

            {component.files && (
              <div className="mb-3">
                <h4 style={{ fontSize: "16px", marginBottom: "8px" }}>
                  Files:
                </h4>
                {component.files.map((file, index) => (
                  <div
                    key={index}
                    className="d-flex justify-content-between align-items-center"
                    style={{ padding: "4px 0" }}
                  >
                    <span>{file.name}</span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--color-fg-muted)",
                      }}
                    >
                      {file.size}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-3">
              <strong>License:</strong> {component.license || "MIT"}
            </div>

            {component.versions && (
              <div>
                <h4 style={{ fontSize: "16px", marginBottom: "8px" }}>
                  Version History:
                </h4>
                {component.versions.slice(0, 3).map((version, index) => (
                  <div
                    key={index}
                    style={{ marginBottom: "8px", fontSize: "14px" }}
                  >
                    <strong>v{version.version}</strong> - {version.date}
                    <div style={{ color: "var(--color-fg-muted)" }}>
                      {version.changes}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div style={{ marginTop: "60px" }}>
        <h2 className="mb-4">Reviews ({component.reviewCount})</h2>

        {reviewsLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : reviews.length === 0 ? (
          <p style={{ color: "var(--color-fg-muted)" }}>No reviews yet.</p>
        ) : (
          <>
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
                    <div className="rating">
                      {renderStars(reviews[0].rating)}
                    </div>
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

            {reviews.length > 0 && (
              <div style={{ marginTop: 12, textAlign: "center" }}>
                <Link
                  to={`/reviews/${component.id}`}
                  className="btn btn-secondary"
                >
                  {" "}
                  Show All Reviews ({reviews.length})
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      {/* Purchase Modal */}
      <Modal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        title="Purchase Component"
      >
        <PurchaseForm
          component={component}
          onPurchase={handlePurchase}
          loading={purchasing}
        />
      </Modal>

      {/* Chat Widget - Disabled */}
      {/* {isAuthenticated && component && user?.role !== 'seller' && (
        <ChatWidget
          componentId={component.id}
          componentTitle={component.title}
          sellerId={component.seller?.id}
        />
      )} */}
    </div>
  );
};

// Purchase Form Component
const PurchaseForm = ({ component, onPurchase, loading }) => {
  const [paymentData, setPaymentData] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onPurchase(paymentData);
  };

  const handleChange = (e) => {
    setPaymentData({
      ...paymentData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <h3>{component.title}</h3>
        <div className="price-tag" style={{ fontSize: "24px" }}>
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(component.price)}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Card Number</label>
        <input
          type="text"
          name="number"
          className="form-control"
          placeholder="1234 5678 9012 3456"
          value={paymentData.number}
          onChange={handleChange}
          required
        />
      </div>

      <div className="grid grid-cols-2" style={{ gap: "16px" }}>
        <div className="form-group">
          <label className="form-label">Expiry Date</label>
          <input
            type="text"
            name="expiry"
            className="form-control"
            placeholder="MM/YY"
            value={paymentData.expiry}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">CVC</label>
          <input
            type="text"
            name="cvc"
            className="form-control"
            placeholder="123"
            value={paymentData.cvc}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Cardholder Name</label>
        <input
          type="text"
          name="name"
          className="form-control"
          placeholder="John Doe"
          value={paymentData.name}
          onChange={handleChange}
          required
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={loading}
        style={{ width: "100%" }}
      >
        {loading
          ? "Processing..."
          : `Purchase for ${new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(component.price)}`}
      </button>

      <p
        style={{
          fontSize: "12px",
          color: "var(--color-fg-muted)",
          textAlign: "center",
          marginTop: "16px",
        }}
      >
        This is a demo. No real payment will be processed.
      </p>
    </form>
  );
};

export default ComponentDetail;
