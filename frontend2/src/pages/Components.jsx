/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { componentService } from "../services/api";
import ComponentCard from "../components/ComponentCard";
import Pagination from "../components/Pagination";

const Components = () => {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState({});
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter states
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    sort: searchParams.get("sort") || "newest",
    page: Number.parseInt(searchParams.get("page")) || 1,
  });

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

  const sortOptions = [
    { value: "newest", label: "Newest" },
    { value: "rating", label: "Highest Rated" },
    { value: "downloads", label: "Most Downloaded" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
  ];

  useEffect(() => {
    loadComponents();
  }, [filters]);

  useEffect(() => {
    // Update URL params when filters change
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "All Categories") {
        params.set(key, value);
      }
    });
    setSearchParams(params);
  }, [filters, setSearchParams]);

  const loadComponents = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        ...filters,
        category: filters.category === "All Categories" ? "" : filters.category,
      };

      const response = await componentService.getComponents(params);
      console.log("API Response:", response);
      setComponents(response.items);
      setMeta(response.meta);
    } catch (error) {
      setError("Failed to load components");
      console.error("Error loading components:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== "page" ? 1 : value, // Reset page when other filters change
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    handleFilterChange("search", e.target.search.value);
  };

  return (
    <div className="d-flex" style={{ minHeight: "calc(100vh - 73px)" }}>
      {/* Sidebar */}
      <div
        className="sidebar"
        style={{ position: "sticky", top: "73px", alignSelf: "flex-start" }}
      >
        <div className="filter-section">
          <h3 className="filter-title">Categories</h3>
          <ul className="filter-list">
            {categories.map((category) => (
              <li key={category} className="filter-item">
                <button
                  className={`filter-link ${
                    filters.category === category ||
                    (category === "All Categories" && !filters.category)
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    handleFilterChange(
                      "category",
                      category === "All Categories" ? "" : category
                    )
                  }
                  style={{
                    textAlign: "start",
                    width: "100%",
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  {category}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="filter-section">
          <h3 className="filter-title">Sort By</h3>
          <select
            className="form-control"
            value={filters.sort}
            onChange={(e) => handleFilterChange("sort", e.target.value)}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Search and Header */}
        <div className="mb-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h1>Components</h1>
              <div className="breadcrumb">
                <span className="breadcrumb-item">Home</span>
                <span className="breadcrumb-item">Components</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSearch} className="mb-4">
            <div className="d-flex" style={{ gap: "12px" }}>
              <input
                type="text"
                name="search"
                className="form-control"
                placeholder="Search components..."
                defaultValue={filters.search}
              />
              <button type="submit" className="btn btn-primary">
                Search
              </button>
            </div>
          </form>

          {/* Results Info */}
          {meta.total !== undefined && (
            <div className="mb-3">
              <p style={{ color: "var(--color-fg-muted)" }}>
                Showing {meta.total} component{meta.total !== 1 ? "s" : ""}
                {filters.search && ` for "${filters.search}"`}
                {filters.category && ` in ${filters.category}`}
              </p>
            </div>
          )}
        </div>

        {/* Components Grid */}
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : components.length === 0 ? (
          <div className="text-center" style={{ padding: "60px 20px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
            <h3 className="mb-2">No components found</h3>
            <p style={{ color: "var(--color-fg-muted)" }}>
              Try adjusting your search criteria or browse different categories.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3">
              {components.map((component) => (
                <ComponentCard key={component.id} component={component} />
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={filters.page}
              totalPages={meta.totalPages || 1}
              onPageChange={(page) => handleFilterChange("page", page)}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Components;
