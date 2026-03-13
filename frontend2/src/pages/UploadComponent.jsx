"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { componentService } from "../services/api";
import FileUpload from "../components/FileUpload";

const UploadComponent = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [componentId, setComponentId] = useState(null);
  const [screenshots, setScreenshots] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    tags: "",
    license: "MIT",
    previewSnippet: "",
  });

  const [files, setFiles] = useState([]);

  const categories = [
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const componentData = {
        ...formData,
        price: Number.parseFloat(formData.price),
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        previewSnippet: formData.previewSnippet,
      };

      const response = await componentService.createComponent(componentData);
      setComponentId(response.componentId);
      setStep(2);
    } catch (error) {
      setError(error.message || "Failed to create component");
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();

    if (files.length === 0) {
      setError("Please select at least one component file");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Upload component files
      await componentService.uploadFiles(componentId, files);

      // Upload screenshots if any
      if (screenshots.length > 0) {
        await componentService.uploadScreenshots(componentId, screenshots);
      }

      setStep(3); // move to review
    } catch (error) {
      setError(error.message || "Failed to upload files");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    try {
      await componentService.publishComponent(componentId);
      navigate("/seller-dashboard");
    } catch (error) {
      setError(error.message || "Failed to publish component");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="card"
      style={{
        maxWidth: "1200px",
        margin: "40px auto",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        borderRadius: "12px",
      }}
    >
      <div className="card-header" style={{ background: "#f8f9fa", padding: "20px 24px" }}>
        <h3 className="mb-0">Upload New Component</h3>
        <p className="mb-0" style={{ color: "var(--color-fg-muted)", marginTop: "4px" }}>
          Share your amazing component with the community
        </p>
      </div>

      <div className="card-body" style={{ padding: "24px" }}>
        {/* Progress Steps */}
        <div className="d-flex align-items-center justify-content-center mb-5">
          <div
            className={`d-flex align-items-center ${
              step >= 1 ? "text-primary" : "text-muted"
            }`}
          >
            <div
              className={`badge ${step >= 1 ? "badge-success" : ""}`}
              style={{ marginRight: "8px" ,color:"white"}}
            >
              1
            </div>
            Component Details
          </div>
          <div
            style={{
              width: "40px",
              height: "2px",
              backgroundColor:
                step >= 2
                  ? "var(--color-success-fg)"
                  : "var(--color-border-default)",
              margin: "0 16px",
            }}
          ></div>
          <div
            className={`d-flex align-items-center ${
              step >= 2 ? "text-primary" : "text-muted"
            }`}
          >
            <div
              className={`badge ${step >= 2 ? "badge-success" : ""}`}
              style={{ marginRight: "8px" ,color:"white" }}
            >
              2
            </div>
            Upload Files
          </div>
          <div
            style={{
              width: "40px",
              height: "2px",
              backgroundColor:
                step >= 3
                  ? "var(--color-success-fg)"
                  : "var(--color-border-default)",
              margin: "0 16px",
            }}
          ></div>
          <div
            className={`d-flex align-items-center ${
              step >= 3 ? "text-primary" : "text-muted"
            }`}
          >
            <div
              className={`badge ${step >= 3 ? "badge-success" : ""}`}
              style={{ marginRight: "8px" ,color:"white" }}
            >
              3
            </div>
            Review & Publish
          </div>
        </div>

        {error && (
          <div className="alert alert-danger mb-4">
            {error}
            <details style={{ marginTop: "10px", fontSize: "12px" }}>
              <summary>Debug Info</summary>
              <pre style={{ fontSize: "10px", marginTop: "5px" }}>
                Component ID: {componentId || "Not set"}
                Files Count: {files.length}
                Current Step: {step}
              </pre>
            </details>
          </div>
        )}

        {/* Step 1: Component Details */}
        {step === 1 && (
          <div>
            <h4 className="mb-4" style={{ color: "var(--color-fg-default)", fontWeight: "600" }}>
              1. Component Details
            </h4>
            
            {error && (
              <div className="alert alert-danger" style={{ marginBottom: "20px" }}>
                {error}
              </div>
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

                <div className="form-group mb-3">
                  <label className="form-label">Description *</label>
                  <textarea
                    name="description"
                    className="form-control"
                    rows="8"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    placeholder="Describe your component, its features, and use cases..."
                  />
                </div>

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
                    Separate tags with commas. Tags help users find your component.
                  </small>
                </div>
              </div>

              {/* Right Column */}
              <div>
                <div className="form-group mb-3">
                  <label className="form-label">Preview Snippet</label>
                  <textarea
                    name="previewSnippet"
                    className="form-control"
                    rows="12"
                    value={formData.previewSnippet}
                    onChange={handleChange}
                    placeholder={`e.g., import { Button } from './Button'\n\nexport default function App() {\n  return <Button />\n}`}
                  />
                  <small style={{ color: "var(--color-fg-muted)" }}>
                    Add a small snippet of code to show a live preview of your component.
                  </small>
                </div>

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

            <div className="d-flex justify-content-end">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{
                  padding: "10px 20px",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
                onClick={handleStep1Submit}
              >
                {loading ? "Saving..." : "Continue to Upload Files"}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: File Upload */}
        {step === 2 && (
          <div>
            <h4 className="mb-4" style={{ color: "var(--color-fg-default)", fontWeight: "600" }}>
              2. Upload Files
            </h4>

            <div className="mb-4">
              <p style={{ color: "var(--color-fg-muted)", marginBottom: "16px" }}>
                Upload your component files. Include React components,
                stylesheets, documentation, and any other necessary files.
              </p>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--color-fg-muted)",
                  marginBottom: "20px",
                }}
              >
                <strong>Supported formats:</strong> .html, .js, .jsx, .ts, .tsx,
                .css, .scss, .json, .md, .txt (Max 5MB per file)
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "24px",
                marginBottom: "20px",
              }}
            >
              {/* Left Column - Code Files */}
              <div>
                <h5 className="mb-3" style={{ fontWeight: "500" }}>Component Files</h5>
                <FileUpload
                  onFilesSelected={(selectedFiles) => {
                    console.log("📁 [DEBUG] Files selected:", selectedFiles);
                    if (selectedFiles && Array.isArray(selectedFiles)) {
                      setFiles(selectedFiles);
                    } else {
                      console.log(
                        "❌ [DEBUG] Invalid selectedFiles:",
                        selectedFiles
                      );
                      setFiles([]);
                    }
                  }}
                  accept=".html,.jsx,.tsx,.js,.ts,.css,.scss,.json,.md"
                  multiple={true}
                  maxSize={5 * 1024 * 1024} // 5MB
                />
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--color-fg-muted)",
                    marginTop: "12px",
                  }}
                >
                  <strong>Supported formats:</strong> .html, .js, .jsx, .ts, .tsx,
                  .css, .scss, .json, .md, .txt (Max 5MB per file)
                </div>
              </div>

              {/* Right Column - Screenshots */}
              <div>
                <h5 className="mb-3" style={{ fontWeight: "500" }}>Screenshots</h5>
                <FileUpload
                  onFilesSelected={(selectedFiles) =>
                    setScreenshots(selectedFiles)
                  }
                  accept=".png,.jpg,.jpeg,.webp"
                  multiple={true}
                  maxSize={2 * 1024 * 1024} // 2MB
                />
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--color-fg-muted)",
                    marginTop: "12px",
                  }}
                >
                  <strong>Supported formats:</strong> .png, .jpg, .jpeg, .webp (Max 2MB per file)
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(1)}
                style={{
                  padding: "10px 20px",
                  fontWeight: "500",
                }}
              >
                Back
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={loading || files.length === 0}
                onClick={handleStep2Submit}
                style={{
                  padding: "10px 20px",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                {loading ? "Uploading..." : "Continue to Review"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Publish */}
        {step === 3 && (
          <div>
            <h4 className="mb-4" style={{ color: "var(--color-fg-default)", fontWeight: "600" }}>
              3. Review & Publish
            </h4>

            <div className="mb-4">
              <div className="alert alert-success">
                <strong>Success!</strong> Your component has been created and
                files uploaded successfully.
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "24px",
                marginBottom: "24px",
              }}
            >
              {/* Left Column - Component Summary */}
              <div>
                <h5 className="mb-3" style={{ fontWeight: "500" }}>Component Summary</h5>
                <div
                  style={{
                    padding: "16px",
                    border: "1px solid var(--color-border-default)",
                    borderRadius: "8px",
                    backgroundColor: "var(--color-canvas-subtle)",
                  }}
                >
                  <div className="grid grid-cols-2" style={{ gap: "12px", marginBottom: "16px" }}>
                    <div>
                      <strong>Title:</strong> {formData.title}
                    </div>
                    <div>
                      <strong>Price:</strong> ${formData.price}
                    </div>
                    <div>
                      <strong>Category:</strong> {formData.category}
                    </div>
                    <div>
                      <strong>License:</strong> {formData.license}
                    </div>
                  </div>
                  <div style={{ marginBottom: "16px" }}>
                    <strong>Description:</strong>
                    <p style={{ marginTop: "8px", fontSize: "14px", lineHeight: "1.5" }}>
                      {formData.description}
                    </p>
                  </div>
                  {formData.tags && (
                    <div>
                      <strong>Tags:</strong>
                      <div style={{ marginTop: "8px" }}>
                        {formData.tags.split(",").map((tag) => (
                          <span key={tag.trim()} className="tag" style={{ marginRight: "6px", marginBottom: "6px" }}>
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Uploaded Files */}
              <div>
                <h5 className="mb-3" style={{ fontWeight: "500" }}>Uploaded Files ({files.length})</h5>
                <div
                  style={{
                    padding: "16px",
                    border: "1px solid var(--color-border-default)",
                    borderRadius: "8px",
                    backgroundColor: "var(--color-canvas-subtle)",
                    maxHeight: "250px",
                    overflowY: "auto",
                  }}
                >
                  {files.length > 0 ? (
                    files.map((file, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "10px 12px",
                          border: "1px solid var(--color-border-muted)",
                          borderRadius: "6px",
                          marginBottom: "8px",
                          backgroundColor: "var(--color-canvas-default)",
                        }}
                      >
                        <div style={{ fontWeight: "500", fontSize: "14px" }}>{file.name}</div>
                        <div style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
                          {(file.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: "var(--color-fg-muted)", textAlign: "center", padding: "20px" }}>
                      No files uploaded
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(2)}
                style={{
                  padding: "10px 20px",
                  fontWeight: "500",
                }}
              >
                Back
              </button>
              <button
                type="button"
                className="btn btn-success"
                disabled={loading}
                onClick={handlePublish}
                style={{
                  padding: "12px 24px",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                {loading ? "Publishing..." : "Publish Component"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadComponent;
