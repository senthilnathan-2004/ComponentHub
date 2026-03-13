"use client";

import { useState, useRef } from "react";

const FileUpload = ({
  onFilesSelected,
  accept,
  multiple = true,
  maxSize = 5 * 1024 * 1024,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    console.log("🔍 [DEBUG] Files dropped:", droppedFiles);
    handleFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    console.log("🔍 [DEBUG] Files selected via input:", selectedFiles);
    handleFiles(selectedFiles);
  };

  const handleFiles = (newFiles) => {
    console.log("🔍 [DEBUG] handleFiles called with:", newFiles);

    // Validate file size and type
    const validFiles = newFiles.filter((file) => {
      if (file.size > maxSize) {
        alert(
          `File ${file.name} is too large. Maximum size is ${
            maxSize / (1024 * 1024)
          }MB`
        );
        return false;
      }

      // Check file type if accept prop is provided
      if (accept && accept.trim() !== "") {
        const fileName = file.name || "";
        const fileExtension = fileName
          .toLowerCase()
          .substring(fileName.lastIndexOf("."));
        const acceptedTypes = accept
          .split(",")
          .map((type) => type.trim().toLowerCase());

        if (!acceptedTypes.some((type) => fileExtension === type)) {
          alert(
            `File ${file.name} is not an accepted file type. Accepted types: ${accept}`
          );
          return false;
        }
      }

      return true;
    });

    console.log(
      "🔍 [DEBUG] Valid files after size and type check:",
      validFiles
    );

    let updatedFiles;
    if (multiple) {
      updatedFiles = [...files, ...validFiles];
    } else {
      updatedFiles = validFiles.slice(0, 1);
    }

    console.log("🔍 [DEBUG] Updated files array:", updatedFiles);
    setFiles(updatedFiles);

    console.log("🔍 [DEBUG] Calling onFilesSelected with:", updatedFiles);
    onFilesSelected(updatedFiles);
  };

  const removeFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    console.log("🔍 [DEBUG] File removed, updated files:", updatedFiles);
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  return (
    <div>
      <div
        className={`file-upload ${dragOver ? "dragover" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          console.log("🔍 [DEBUG] File upload area clicked");
          fileInputRef.current?.click();
        }}
        style={{
          border: "2px dashed var(--color-border-default)",
          borderRadius: "8px",
          padding: "40px 20px",
          textAlign: "center",
          cursor: "pointer",
          backgroundColor: dragOver ? "var(--color-muted)" : "transparent",
          transition: "all 0.2s ease",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "48px",
              marginBottom: "16px",
              color: "var(--color-fg-muted)",
            }}
          >
            📁
          </div>
          <p style={{ marginBottom: "8px", fontWeight: "600" }}>
            Drop files here or click to browse
          </p>
          <p style={{ fontSize: "14px", color: "var(--color-fg-muted)" }}>
            {accept ? `Accepted formats: ${accept}` : "All file types accepted"}
          </p>
          <p style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
            Maximum file size: {maxSize / (1024 * 1024)}MB
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />

      {files.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <h4>Selected Files:</h4>
          <div style={{ marginTop: "8px" }}>
            {files.map((file, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  border: "1px solid var(--color-border-default)",
                  borderRadius: "6px",
                  marginBottom: "8px",
                }}
              >
                <div>
                  <div style={{ fontWeight: "500" }}>{file.name}</div>
                  <div
                    style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}
                  >
                    {formatFileSize(file.size)}
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
