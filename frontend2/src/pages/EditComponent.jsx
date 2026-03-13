/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { componentService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const EditComponent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const categories = [
    "All Categories",
    "UI Components",
    "Layout Components",
    "Form Components",
    "Navigation",
    "Data Display",
    "Feedback",
    "Utilities",
    "Templates",
    "Other",
  ];

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    previewSnippet: "",
    price: "",
    category: "",
    tags: "",
    license: "MIT",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState({ show: false, message: "", type: "" });

  // Fetch component data when user exists
  useEffect(() => {
    if (user) {
      loadComponent();
    }
  }, [user]);

  const loadComponent = async () => {
    try {
      const data = await componentService.getComponent(id);
      setFormData({
        title: data.title || "",
        description: data.description || "",
        previewSnippet: data.previewSnippet || "",
        price: data.price || "",
        category: data.category || "",
        tags: Array.isArray(data.tags) ? data.tags.join(",") : data.tags || "",
        license: data.license || "MIT",
      });
    } catch (err) {
      console.error(err);
      setError("Failed to load component");
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const showModal = (message, type = "success") => {
    setModal({ show: true, message, type });
  };

  const closeModal = () => {
    setModal({ show: false, message: "", type: "" });
    if (modal.type === "success") {
      navigate("/my-components");
    }
  };

  // Handle submit (update component)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedData = {
        ...formData,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };
      await componentService.updateComponent(id, updatedData);
      showModal("Component updated successfully", "success");
    } catch (err) {
      console.error(err);
      showModal("Failed to update component", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", marginTop: "40px" }}>Loading...</div>
    );

  return (
    <>
      <div
        className="card"
        style={{
          maxWidth: "1200px",
          margin: "40px auto",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          borderRadius: "12px",
        }}
      >
        <div className="card-header" style={{ background: "#f8f9fa" }}>
          <h3 className="mb-0">Edit Component</h3>
        </div>

        <form onSubmit={handleSubmit} className="card-body">
          {/* Error */}
          {error && (
            <div style={{ color: "red", marginBottom: "12px" }}>{error}</div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px",
              marginBottom: "24px",
            }}
          >
            {/* Left Column */}
            <div>
              {/* Title */}
              <div className="form-group mb-3">
                <label className="form-label">Component Title *</label>
                <input
                  type="text"
                  name="title"
                  className="form-control"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Modern Button Component"
                />
              </div>

              {/* Description */}
              <div className="form-group mb-3">
                <label className="form-label">Description *</label>
                <textarea
                  name="description"
                  className="form-control"
                  rows="12"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  placeholder="Describe your component, its features, and use cases..."
                />
              </div>

              {/* Price & Category */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <div className="form-group">
                  <label className="form-label">Price (USD) *</label>
                  <input
                    type="number"
                    name="price"
                    className="form-control"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="1"
                    step="0.01"
                    placeholder="29.99"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    name="category"
                    className="form-control"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div className="form-group mb-3">
                <label className="form-label">Tags</label>
                <input
                  type="text"
                  name="tags"
                  className="form-control"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="react, button, ui, modern (comma separated)"
                />
                <small style={{ color: "var(--color-fg-muted)" }}>
                  Separate tags with commas. Tags help users find your
                  component.
                </small>
              </div>
            </div>

            {/* Right Column */}
            <div>
              {/* Preview Snippet */}
              <div className="form-group mb-3">
                <label className="form-label">Preview Snippet</label>
                <textarea
                  name="previewSnippet"
                  className="form-control"
                  rows="20"
                  value={formData.previewSnippet}
                  onChange={handleChange}
                  placeholder={`e.g., import { Button } from './Button'

export default function App() {
  return <Button />
}`}
                />
                <small style={{ color: "var(--color-fg-muted)" }}>
                  Add a small snippet of code to show a live preview of your
                  component.
                </small>
              </div>

              {/* License */}
              <div className="form-group mb-3">
                <label className="form-label">License</label>
                <select
                  name="license"
                  className="form-control"
                  value={formData.license}
                  onChange={handleChange}
                >
                  <option value="MIT">MIT</option>
                  <option value="Apache-2.0">Apache 2.0</option>
                  <option value="GPL-3.0">GPL 3.0</option>
                  <option value="BSD-3-Clause">BSD 3-Clause</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button - Full Width */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{
              width: "100%",
              padding: "12px",
              fontWeight: "600",
              fontSize: "16px",
            }}
          >
            {saving ? "Saving..." : "Update Component"}
          </button>
        </form>
      </div>

      {modal.show && (
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
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "32px",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
              maxWidth: "400px",
              width: "90%",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: "0 0 16px 0",
                color: modal.type === "success" ? "#28a745" : "#dc3545",
              }}
            >
              {modal.type === "success" ? "Success!" : "Error!"}
            </h3>
            <p style={{ margin: "0 0 24px 0", fontSize: "16px" }}>
              {modal.message}
            </p>
            <button
              onClick={closeModal}
              style={{
                backgroundColor:
                  modal.type === "success" ? "#28a745" : "#dc3545",
                color: "white",
                border: "none",
                padding: "14px 32px",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                minWidth: "120px",
                transition: "all 0.2s ease",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.15)";
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default EditComponent;
