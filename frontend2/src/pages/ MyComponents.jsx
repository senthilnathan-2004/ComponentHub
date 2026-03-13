/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { componentService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const MyComponents = () => {
  const { user } = useAuth();
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [componentToDelete, setComponentToDelete] = useState(null);

  useEffect(() => {
    if (user) loadUserComponents();
  }, [user]);

  const loadUserComponents = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError("");
      const data = await componentService.getComponents({ seller: user.id });
      setComponents(data.items || []);
    } catch (err) {
      console.error("Failed to load components:", err);
      setError("Failed to load components. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (componentId) => {
    setComponentToDelete(componentId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!componentToDelete) return;

    const previousComponents = components;
    setComponents((prev) => prev.filter((c) => c.id !== componentToDelete));

    try {
      await componentService.deleteComponent(componentToDelete);
    } catch (err) {
      console.error("Failed to delete component:", err);
      setComponents(previousComponents); // rollback
      alert("Failed to delete component. Please try again.");
    }

    setShowDeleteModal(false);
    setComponentToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setComponentToDelete(null);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div
      className="container-lg"
      style={{ margin: "0 auto", padding: "20px", maxWidth: "1200px" }}
    >
      {showDeleteModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "var(--color-canvas-default)",
              border: "1px solid var(--color-border-default)",
              borderRadius: "8px",
              padding: "24px",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                marginBottom: "16px",
                color: "var(--color-fg-default)",
              }}
            >
              Delete Component
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "var(--color-fg-muted)",
                marginBottom: "24px",
                lineHeight: "1.5",
              }}
            >
              Are you sure you want to delete this component? This action cannot
              be undone.
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={cancelDelete}
                style={{
                  padding: "10px 20px",
                  fontSize: "14px",
                  borderRadius: "4px",
                  backgroundColor: "var(--color-canvas-subtle)",
                  color: "var(--color-fg-default)",
                  border: "1px solid var(--color-border-default)",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: "10px 20px",
                  fontSize: "14px",
                  borderRadius: "4px",
                  backgroundColor: "var(--color-danger-fg)",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="header-section"
        style={{
          paddingBottom: "24px",
          borderBottom: "1px solid var(--color-border-default)",
          marginBottom: "24px",
        }}
      >
        <div
          className="header-content"
          style={{ textAlign: "center", marginBottom: "20px" }}
        >
          <h1
            className="page-title"
            style={{
              fontSize: "clamp(24px, 5vw, 32px)",
              marginBottom: "8px",
              fontWeight: "600",
            }}
          >
            My Components
          </h1>
          <p
            className="page-subtitle"
            style={{
              fontSize: "clamp(14px, 3vw, 16px)",
              color: "var(--color-fg-muted)",
              marginBottom: "0",
              wordWrap: "break-word",
              lineHeight: "1.6",
            }}
          >
            {components.length} component{components.length !== 1 ? "s" : ""} •{" "}
            {components.filter((c) => c.published).length} published •{" "}
            {components.reduce((sum, c) => sum + (c.downloads || 0), 0)} total
            downloads
          </p>
        </div>

        <div
          className="header-actions"
          style={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <Link
            to="/upload"
            className="btn btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px 24px",
              fontSize: "16px",
              fontWeight: "500",
              textDecoration: "none",
              borderRadius: "6px",
              minWidth: "200px",
              width: "100%",
              maxWidth: "300px",
            }}
          >
            <span style={{ marginRight: "8px" }}>+</span>
            Upload Component
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: "24px" }}>
          {error}
        </div>
      )}

      {components.length > 0 && (
        <div
          className="stats-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            className="stat-card"
            style={{
              textAlign: "center",
              padding: "20px",
              backgroundColor: "var(--color-canvas-subtle)",
              borderRadius: "8px",
            }}
          >
            <div
              className="stat-value"
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "var(--color-fg-default)",
              }}
            >
              {components.reduce((sum, c) => sum + (c.downloads || 0), 0)}
            </div>
            <div
              className="stat-label"
              style={{
                fontSize: "14px",
                color: "var(--color-fg-muted)",
                marginTop: "4px",
              }}
            >
              Total Downloads
            </div>
          </div>
          <div
            className="stat-card"
            style={{
              textAlign: "center",
              padding: "20px",
              backgroundColor: "var(--color-canvas-subtle)",
              borderRadius: "8px",
            }}
          >
            <div
              className="stat-value"
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "var(--color-success-fg)",
              }}
            >
              $
              {components
                .reduce((sum, c) => sum + c.price * (c.downloads || 0), 0)
                .toFixed(2)}
            </div>
            <div
              className="stat-label"
              style={{
                fontSize: "14px",
                color: "var(--color-fg-muted)",
                marginTop: "4px",
              }}
            >
              Total Earnings
            </div>
          </div>
          <div
            className="stat-card"
            style={{
              textAlign: "center",
              padding: "20px",
              backgroundColor: "var(--color-canvas-subtle)",
              borderRadius: "8px",
            }}
          >
            <div
              className="stat-value"
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "var(--color-accent-fg)",
              }}
            >
              {(
                components.reduce((sum, c) => sum + (c.rating || 0), 0) /
                  components.length || 0
              ).toFixed(1)}
              ★
            </div>
            <div
              className="stat-label"
              style={{
                fontSize: "14px",
                color: "var(--color-fg-muted)",
                marginTop: "4px",
              }}
            >
              Average Rating
            </div>
          </div>
          <div
            className="stat-card"
            style={{
              textAlign: "center",
              padding: "20px",
              backgroundColor: "var(--color-canvas-subtle)",
              borderRadius: "8px",
            }}
          >
            <div
              className="stat-value"
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "var(--color-fg-default)",
              }}
            >
              {components.filter((c) => c.published).length}
            </div>
            <div
              className="stat-label"
              style={{
                fontSize: "14px",
                color: "var(--color-fg-muted)",
                marginTop: "4px",
              }}
            >
              Published
            </div>
          </div>
        </div>
      )}

      {components.length > 0 ? (
        <div
          className="components-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
          }}
        >
          {components.map((component) => (
            <div
              key={component.id}
              className="card component-card"
              style={{
                backgroundColor: "var(--color-canvas-default)",
                border: "1px solid var(--color-border-default)",
                borderRadius: "8px",
                padding: "20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ position: "relative", marginBottom: "16px" }}>
                <img
                  src={
                    component.screenshots ||
                    `/placeholder.svg?height=160&width=300&query=${
                      encodeURIComponent(
                        component.title + " component preview"
                      ) || "/placeholder.svg"
                    }`
                  }
                  alt={`${component.title} preview`}
                  className="component-preview"
                  style={{
                    width: "100%",
                    height: "160px",
                    objectFit: "cover",
                    borderRadius: "6px",
                    backgroundColor: "var(--color-canvas-subtle)",
                  }}
                />
                {component.published && (
                  <span
                    className="tag"
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      backgroundColor: "var(--color-success-fg)",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                  >
                    Published
                  </span>
                )}
              </div>

              <div className="card-body">
                <div
                  className="component-header"
                  style={{ marginBottom: "12px" }}
                >
                  <Link to={`/components/${component.id}`}>
                    <h4
                      style={{
                        color: "var(--color-fg-default)",
                        fontSize: "18px",
                        fontWeight: "600",
                        margin: "0",
                        lineHeight: "1.3",
                      }}
                    >
                      {component.title.charAt(0).toUpperCase() +
                        component.title.slice(1)}
                    </h4>
                  </Link>
                </div>

                <div
                  className="component-stats"
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "12px",
                    marginBottom: "16px",
                    fontSize: "14px",
                    color: "var(--color-fg-muted)",
                  }}
                >
                  <span>{component.downloads || 0} downloads</span>
                  <span>{component.rating || 0}/5 ★</span>
                  <span>{component.reviewCount || 0} reviews</span>
                </div>

                {component.tags && component.tags.length > 0 && (
                  <div
                    className="component-tags"
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                      marginBottom: "16px",
                    }}
                  >
                    {component.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="tag"
                        style={{
                          backgroundColor: "var(--color-canvas-subtle)",
                          color: "var(--color-fg-default)",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          border: "1px solid var(--color-border-default)",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="component-footer">
                  <div
                    className="component-price"
                    style={{
                      fontSize: "20px",
                      fontWeight: "700",
                      color: "var(--color-success-fg)",
                      textAlign: "center",
                      marginBottom: "16px",
                    }}
                  >
                    ${component.price}
                  </div>

                  <div
                    className="component-actions"
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      gap: "8px",
                      width: "100%",
                    }}
                  >
                    <Link
                      to={`/components/edit/${component.id}`}
                      className="btn btn-sm btn-secondary"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "10px 16px",
                        fontSize: "14px",
                        textDecoration: "none",
                        borderRadius: "4px",
                        backgroundColor: "var(--color-btn-bg)",
                        color: "var(--color-btn-text)",
                        border: "1px solid var(--color-border-default)",
                        width: "100%",
                      }}
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/components/${component.id}`}
                      className="btn btn-sm"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "10px 16px",
                        fontSize: "14px",
                        textDecoration: "none",
                        borderRadius: "4px",
                        backgroundColor: "var(--color-canvas-subtle)",
                        color: "var(--color-fg-default)",
                        border: "1px solid var(--color-border-default)",
                        width: "100%",
                      }}
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDelete(component.id)}
                      className="btn btn-sm btn-primary"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "10px 16px",
                        fontSize: "14px",
                        borderRadius: "4px",
                        // backgroundColor: "var(--color-danger-fg)",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                        width: "100%",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="empty-state"
          style={{
            textAlign: "center",
            padding: "60px 20px",
            maxWidth: "500px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              fontSize: "clamp(48px, 8vw, 64px)",
              marginBottom: "24px",
              background:
                "linear-gradient(135deg, var(--color-accent-emphasis), var(--color-success-fg))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            📦
          </div>
          <h3
            style={{
              fontSize: "clamp(20px, 4vw, 24px)",
              fontWeight: "600",
              marginBottom: "16px",
              color: "var(--color-fg-default)",
            }}
          >
            No components uploaded yet
          </h3>
          <p
            style={{
              fontSize: "clamp(14px, 3vw, 16px)",
              color: "var(--color-fg-muted)",
              marginBottom: "32px",
              lineHeight: "1.6",
            }}
          >
            Start building your component library and earn money by sharing your
            creations with the community.
          </p>
          <div
            className="empty-state-actions"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              alignItems: "center",
              maxWidth: "300px",
              margin: "0 auto",
            }}
          >
            <Link
              to="/upload"
              className="btn btn-primary btn-lg"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "14px 28px",
                fontSize: "16px",
                fontWeight: "500",
                textDecoration: "none",
                borderRadius: "6px",
                width: "100%",
              }}
            >
              Upload Your First Component
            </Link>
            <Link
              to="/components"
              className="btn btn-secondary btn-lg"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "14px 28px",
                fontSize: "16px",
                fontWeight: "500",
                textDecoration: "none",
                borderRadius: "6px",
                backgroundColor: "var(--color-canvas-subtle)",
                color: "var(--color-fg-default)",
                border: "1px solid var(--color-border-default)",
                width: "100%",
              }}
            >
              Browse Examples
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyComponents;
