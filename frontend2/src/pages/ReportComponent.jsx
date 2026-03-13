"use client";

import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { componentService } from "../services/api.js";

const ReportForm = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    reason: "",
    description: "",
    email: "",
    name: "",
    componentId: id,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const reportReasons = [
    "Copyright Infringement",
    "Inappropriate Content",
    "Malicious Code",
    "Spam or Misleading",
    "Broken/Non-functional",
    "Duplicate Content",
    "Other",
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        component: formData.componentId,
        reason: formData.reason,
        description: formData.description,
        name: formData.name || undefined,
        email: formData.email || undefined,
        isAnonymous: !formData.email && !formData.name,
      };
      await componentService.reportComponent(payload);
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to submit report");
    }
  };

  if (isSubmitted) {
    return (
      <div style={{ padding: "40px 0", maxWidth: "768px", margin: "0 auto" }}>
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            background: "#F9FAFB",
            border: "1px solid #D1D5DB",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              background: "green",
              borderRadius: "9999px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              fontSize: "24px",
              color: "#FFFFFF",
            }}
          >
            ✓
          </div>
          <h1 style={{ marginBottom: "16px", color: "#1F2937" }}>
            Report Submitted Successfully
          </h1>
          <p
            style={{
              color: "#6B7280",
              marginBottom: "32px",
              lineHeight: "1.6",
            }}
          >
            Thank you for reporting this component. Our team will review your
            report and take appropriate action within 24-48 hours.
          </p>
          <a
            href={`/components/${formData.componentId}/download`}
            style={{
              background: "green",
              color: "#FFFFFF",
              padding: "12px 24px",
              borderRadius: "6px",
              display: "inline-block",
              fontWeight: "500",
              marginRight: "12px",
            }}
          >
            Back to DownloadPage
          </a>
          <a
            href="/components"
            style={{
              background: "#E5E7EB",
              color: "#1F2937",
              padding: "12px 24px",
              borderRadius: "6px",
              display: "inline-block",
              fontWeight: "500",
            }}
          >
            Browse Components
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        paddingTop: "24px",
        paddingBottom: "40px",
        maxWidth: "1024px",
        margin: "0 auto",
        paddingLeft: "16px",
        paddingRight: "16px",
      }}
    >
      <style jsx>{`
        .form-layout-main {
          display: flex;
          flex-direction: column;
          gap: 24px; /* Space between sections */
        }
        @media (min-width: 768px) {
          .form-layout-main {
            flex-direction: row;
            gap: 32px; /* Space between columns */
          }
          .form-column-left {
            flex: 1; /* Takes up available space */
          }
          .form-column-right {
            flex: 1; /* Takes up available space */
          }
        }
        .form-section {
          margin-bottom: 24px; /* Space between form elements within a section */
        }
        .form-layout-contact {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        @media (min-width: 768px) {
          .form-layout-contact {
            flex-direction: row;
            gap: 16px;
          }
          .form-layout-contact > div {
            flex: 1;
          }
        }
        .button-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
          justify-content: flex-end;
        }
        @media (min-width: 640px) {
          .button-group {
            flex-direction: row;
          }
        }
      `}</style>
      {/* Breadcrumb */}
      <div style={{ marginBottom: "16px", fontSize: "14px" }}>
        <a
          href="/"
          style={{
            color: "#3B82F6",
            textDecoration: "none",
            marginRight: "8px",
          }}
        >
          Home
        </a>
        <span style={{ color: "#6B7280", marginRight: "8px" }}>/</span>
        <a
          href="/components"
          style={{
            color: "#3B82F6",
            textDecoration: "none",
            marginRight: "8px",
          }}
        >
          Components
        </a>
        <span style={{ color: "#6B7280", marginRight: "8px" }}>/</span>
        <a
          href={`/components/${formData.componentId}`}
          style={{
            color: "#3B82F6",
            textDecoration: "none",
            marginRight: "8px",
          }}
        >
          Component Details
        </a>
        <span style={{ color: "#6B7280", marginRight: "8px" }}>/</span>
        <a
          href={`/components/${formData.componentId}/download`}
          style={{
            color: "#3B82F6",
            textDecoration: "none",
            marginRight: "8px",
          }}
        >
          Download Component
        </a>
        <span style={{ color: "#6B7280" }}>/ Report Issue</span>
      </div>

      <div
        style={{
          background: "#F9FAFB",
          borderRadius: "8px",
          border: "1px solid #D1D5DB",
        }}
      >
        <div
          style={{
            padding: "24px",
            borderBottom: "1px solid #D1D5DB",
            marginBottom: "24px",
          }}
        >
          <h1
            style={{
              marginBottom: "8px",
              color: "#1F2937",
              fontSize: "28px",
              fontWeight: "600",
            }}
          >
            Report Component Issue
          </h1>
          <p
            style={{
              color: "#6B7280",
              fontSize: "16px",
              lineHeight: "1.6",
              marginBottom: "24px",
            }}
          >
            Help us maintain quality by reporting issues with this component.
            All reports are reviewed by our moderation team.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "0 24px 24px" }}>
          <div className="form-layout-main">
            <div className="form-column-left">
              {/* Report Reason */}
              <div className="form-section">
                <label
                  htmlFor="reason"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                    color: "#1F2937",
                  }}
                >
                  Reason for Report *
                </label>
                <select
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #D1D5DB",
                    borderRadius: "6px",
                    background: "#FFFFFF",
                    color: "#1F2937",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                >
                  <option value="">Select a reason...</option>
                  {reportReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contact Information */}
              <div className="form-section">
                <h2
                  style={{
                    marginBottom: "16px",
                    fontSize: "20px",
                    fontWeight: "600",
                    color: "#1F2937",
                  }}
                >
                  Contact Information
                </h2>
                <div className="form-layout-contact">
                  <div>
                    <label
                      htmlFor="name"
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "500",
                        color: "#1F2937",
                      }}
                    >
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Optional"
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid #D1D5DB",
                        borderRadius: "6px",
                        background: "#FFFFFF",
                        color: "#1F2937",
                        fontSize: "14px",
                        outline: "none",
                        transition: "all 0.2s",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "500",
                        color: "#1F2937",
                      }}
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Optional - for follow-up"
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid #D1D5DB",
                        borderRadius: "6px",
                        background: "#FFFFFF",
                        color: "#1F2937",
                        fontSize: "14px",
                        outline: "none",
                        transition: "all 0.2s",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-column-right">
              {/* Description */}
              <div className="form-section">
                <label
                  htmlFor="description"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                    color: "#1F2937",
                  }}
                >
                  Detailed Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={10} // Increased rows for better visual balance in the right column
                  placeholder="Please provide specific details about the issue. Include any relevant information that would help our team understand and address the problem."
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #D1D5DB",
                    borderRadius: "6px",
                    background: "#FFFFFF",
                    color: "#1F2937",
                    fontSize: "14px",
                    outline: "none",
                    resize: "vertical",
                    minHeight: "120px",
                    lineHeight: "1.6",
                    transition: "all 0.2s",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div
            style={{
              background: "#F3F4F6",
              padding: "16px",
              borderRadius: "6px",
              marginBottom: "24px",
              border: "1px solid #D1D5DB",
            }}
          >
            <p
              style={{ fontSize: "14px", color: "#6B7280", lineHeight: "1.6" }}
            >
              <strong>Note:</strong> False reports may result in account
              restrictions. Please ensure your report is accurate and provide as
              much detail as possible to help our team investigate effectively.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="button-group">
            <a
              href={`/components/${formData.componentId}/download`}
              style={{
                background: "#E5E7EB",
                color: "#1F2937",
                padding: "12px 24px",
                borderRadius: "6px",
                textAlign: "center",
                fontWeight: "500",
                border: "1px solid #D1D5DB",
                transition: "all 0.2s",
              }}
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={
                isSubmitting || !formData.reason || !formData.description
              }
              style={{
                padding: "12px 24px",
                borderRadius: "6px",
                fontWeight: "500",
                transition: "all 0.2s",
                background:
                  formData.reason && formData.description
                    ? "#EF4444"
                    : "#F3F4F6",
                color:
                  formData.reason && formData.description
                    ? "#FFFFFF"
                    : "#6B7280",
                cursor:
                  formData.reason && formData.description
                    ? "pointer"
                    : "not-allowed",
                opacity: formData.reason && formData.description ? "1" : "0.7",
              }}
            >
              {isSubmitting ? "Submitting Report..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportForm;
