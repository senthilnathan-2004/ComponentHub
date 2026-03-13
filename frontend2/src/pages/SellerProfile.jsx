"use client";

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { dashboardService, componentService } from "../services/api";

const SellerProfile = () => {
  const { id } = useParams();
  const [seller, setSeller] = useState(null);
  const [components, setComponents] = useState([]);
  const [stats, setStats] = useState({ components: 0, sales: 0, reviews: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const sellerData = await dashboardService.getSellerById(id);
        setSeller(sellerData);

        setStats({
          components: sellerData.stats?.components || 0,
          sales: sellerData.stats?.sales || 0,
          reviews: sellerData.stats?.reviews || 0,
        });

        const compData = await componentService.getComponents({ seller: id });
        setComponents(compData.items || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load seller data");
      } finally {
        setLoading(false);
      }
    };

    if (id) loadData();
  }, [id]);

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <div className="spinner"></div>
        <p>Loading seller profile...</p>
      </div>
    );

  if (error)
    return <p style={{ color: "red", textAlign: "center" }}>{error}</p>;
  if (!seller) return <p style={{ textAlign: "center" }}>No seller found</p>;

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "40px 20px",
        color: "var(--color-fg-default)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      {/* Header Section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "24px",
          marginBottom: "40px",
          flexWrap: "wrap",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            marginTop: "8px",
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            backgroundColor: "var(--color-border-default)",
            color: "var(--color-fg-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "48px",
            fontWeight: "bold",
            flexShrink: 0,
            border:"2px solid green"
          }}
        >
          {seller.name ? seller.name.charAt(0).toUpperCase() : "S"}
        </div>

        {/* Seller Info */}
        <div>
          <h1 style={{ margin: 0, fontSize: "2rem" }}>
            {seller.name.charAt(0).toUpperCase() +
              seller.name.slice(1) +
              "'s" +
              " " +
              "  " +
              "Profile"}
          </h1>
          <p
            style={{
              margin: "4px 0",
              fontWeight: 600,
              color:
                seller.role.toLowerCase() === "seller"
                  ? "green"
                  : "var(--color-fg-muted)",
            }}
          >
            {seller.role.charAt(0).toUpperCase() + seller.role.slice(1)}
          </p>
          {seller.website && (
            <a
              href={seller.website}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "var(--color-accent-fg)",
                textDecoration: "node",
                fontWeight: "500",
              }}
            >
              {seller.website}
            </a>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "32px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            flex: 1,
            backgroundColor: "#E6F4EA",
            padding: "16px",
            borderRadius: "12px",
            textAlign: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            border:"1px solid #71f396",
          }}
        >
          <h4 style={{ margin: 0, fontSize: "1.5rem" }}>{stats.components}</h4>
          <p style={{ margin: 0 }}>Components</p>
        </div>
        <div
          style={{
            flex: 1,
            backgroundColor: "#FFF4E6",
            padding: "16px",
            borderRadius: "12px",
            textAlign: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
             border:"1px solid #f4c68a",
          }}
        >
          <h4 style={{ margin: 0, fontSize: "1.5rem" }}>{stats.sales}</h4>
          <p style={{ margin: 0 }}>Sales</p>
        </div>
        <div
          style={{
            flex: 1,
            backgroundColor: "#E6F0FF",
            padding: "16px",
            borderRadius: "12px",
            textAlign: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            border:"1px solid #8eb7f5",
          }}
        >
          <h4 style={{ margin: 0, fontSize: "1.5rem" }}>{stats.reviews}</h4>
          <p style={{ margin: 0 }}>Reviews</p>
        </div>
      </div>

      {/* About Seller */}
      {seller.bio && (
        <div
          style={{
            backgroundColor: "var(--color-canvas-subtle)",
            padding: "24px",
            borderRadius: "16px",
            marginBottom: "32px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          <h3 style={{ marginBottom: "12px" }}>About Seller</h3>
          <p style={{ margin: 0 }}>
            {seller.bio.charAt(0).toUpperCase() + seller.bio.slice(1)}
          </p>
        </div>
      )}

      {/* Components Section */}
      <div style={{ marginBottom: "40px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "1.75rem",
              fontWeight: "700",
              color: "#1e293b",
            }}
          >
            Components
          </h2>
        </div>

        {components.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            {components.map((comp) => (
              <Link
                key={comp.id}
                to={`/components/${comp.id}`}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "16px",
                  padding: "24px",
                  textDecoration: "none",
                  color: "#1f2937",
                  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)",
                  border: "1px solid #f1f5f9",
                  transition: "all 0.3s ease",
                  transform: "translateY(0)",
                  display: "block",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow =
                    "0 15px 35px rgba(0, 0, 0, 0.15)";
                  e.currentTarget.style.borderColor = "green";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 15px rgba(0, 0, 0, 0.08)";
                  e.currentTarget.style.borderColor = "#f1f5f9";
                }}
              >
                <h3
                  style={{
                    marginBottom: "12px",
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    color: "#1e293b",
                  }}
                >
                  {comp.title.charAt(0).toUpperCase() + comp.title.slice(1)}
                </h3>
                <p
                  style={{
                    margin: "0 0 16px 0",
                    color: "#64748b",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span>{comp.downloads} downloads</span>
                  <span style={{ color: "#d1d5db" }}>•</span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {comp.rating}
                    <span style={{ color: "#fbbf24" }}>★</span>
                  </span>
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "700",
                      color: "green",
                      fontSize: "1.25rem",
                    }}
                  >
                    ${comp.price}
                  </div>
                  <span
                    style={{
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "white",
                      backgroundColor: comp.published ? "green" : "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {comp.published ? "Published" : "Draft"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              backgroundColor: "#f8fafc",
              borderRadius: "16px",
              border: "2px dashed #cbd5e1",
            }}
          >
            <div
              style={{
                fontSize: "48px",
                marginBottom: "16px",
                opacity: "0.5",
              }}
            >
              📦
            </div>
            <p
              style={{
                margin: 0,
                color: "#64748b",
                fontSize: "16px",
                fontWeight: "500",
              }}
            >
              No components uploaded yet.
            </p>
          </div>
        )}
      </div>

      {/* Contact & Extra Info */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            backgroundColor: "var(--color-canvas-subtle)",
            padding: "24px",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          <h3>Contact & Location</h3>
          <p style={{color:"green"}}>
            <strong style={{color:"black"}}>Email:</strong> {seller.email}
          </p>
          {seller.location && (
            <p>
              <strong>Location:</strong> {seller.location}
            </p>
          )}
        </div>

        <div
          style={{
            backgroundColor: "var(--color-canvas-subtle)",
            padding: "24px",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          <h3>Extra Info</h3>
          <p style={{ color: "var(--color-fg-muted)" }}>
            Additional details or seller description goes here.
          </p>
        </div>
      </div>

      {/* Responsive */}
      <style>
        {`
          @media (max-width: 768px) {
            div[style*="grid-template-columns"] {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default SellerProfile;
