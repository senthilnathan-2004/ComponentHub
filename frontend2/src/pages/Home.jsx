"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { componentService } from "../services/api";
import ComponentCard from "../components/ComponentCard";
import { useAuth } from "../contexts/AuthContext";

const Home = () => {
  const { user } = useAuth();

  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingLatest, setLoadingLatest] = useState(true);

  const [featuredComponents, setFeaturedComponents] = useState([]);
  const [latestComponents, setLatestComponents] = useState([]);

  useEffect(() => {
    loadFeaturedComponents();
    loadLatestComponents();
  }, []);

  // Load Featured Components (limit 3)
  const loadFeaturedComponents = async () => {
    try {
      const response = await componentService.getComponents({
        sort: "rating",
        perPage: 3,
      });
      setFeaturedComponents(response.items || []);
    } catch (error) {
      console.error("Failed to load featured components:", error);
    } finally {
      setLoadingFeatured(false);
    }
  };

  // Load Latest Components (limit 3)
  const loadLatestComponents = async () => {
    try {
      const response = await componentService.getComponents({
        sort: "createdAt",
        perPage: 3,
      });
      setLatestComponents(response.items || []);
    } catch (error) {
      console.error("Failed to load latest components:", error);
    } finally {
      setLoadingLatest(false);
    }
  };

  return (
    <div style={{ background: "#f9fafb" }}>
      <div
        className="container"
        style={{ paddingTop: "40px", paddingBottom: "40px" }}
      >
        {/* Hero Section */}
        <div className="text-center mb-5">
          <h1
            style={{
              fontSize: "69px",
              marginBottom: "24px",
              fontWeight: "bold",
            }}
          >
            Build Faster with Premium Components
          </h1>
          <p
            style={{
              fontSize: "20px",
              color: "#555",
              marginBottom: "32px",
              maxWidth: "650px",
              margin: "0 auto 32px",
            }}
          >
            Discover, purchase, and integrate high-quality components from
            talented developers worldwide.
          </p>
          <div
            className="d-flex justify-content-center"
            style={{ gap: "16px" }}
          >
            <Link to="/components" className="btn btn-primary btn-lg">
              Browse Components
            </Link>
            {!user && (
              <Link to="/register" className="btn btn-secondary btn-lg">
                Start Selling
              </Link>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-3 mb-5" style={{ marginTop: "80px" }}>
          <div
            className="text-center p-4"
            style={{
              padding: "30px",
              border: "2px solid #f0f0f0",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
            }}
          >
            <h3 className="mb-2">Premium Quality</h3>
            <p style={{ color: "#666" }}>
              Hand-picked components built by experienced developers with
              attention to detail and best practices.
            </p>
          </div>
          <div
            className="text-center p-4"
            style={{
              padding: "30px",
              border: "2px solid #f0f0f0",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
            }}
          >
            <h3 className="mb-2">Ready to Use</h3>
            <p style={{ color: "#666" }}>
              Copy, paste, and customize. All components come with documentation
              and examples.
            </p>
          </div>
          <div
            className="text-center p-4"
            style={{
              padding: "30px",
              border: "2px solid #f0f0f0",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
            }}
          >
            <h3 className="mb-2">Fair Pricing</h3>
            <p style={{ color: "#666" }}>
              Affordable components that save you hours of development time.
              Support indie developers.
            </p>
          </div>
        </div>

        {/* Featured Components */}
        <div style={{ marginTop: "80px" }}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Featured Components</h2>
            <Link
              to="/components"
              className="btn btn-primary"
              style={{ maxWidth: "6rem" }}
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-3" style={{ gap: "24px" }}>
            {loadingFeatured ? (
              <p style={{ textAlign: "center" }}>Loading...</p>
            ) : (
              featuredComponents.map((component) => (
                <ComponentCard key={component.id} component={component} />
              ))
            )}
          </div>
        </div>

        {/* Why Choose Us Section */}
        <div
          className="text-center"
          style={{
            marginTop: "80px",
            padding: "60px 20px",
            backgroundColor: "#eef2f7",
            borderRadius: "12px",
          }}
        >
          <h2 className="mb-4">Why Choose Us?</h2>
          <div className="grid grid-cols-3" style={{ gap: "24px" }}>
            <div>
              <h3>Quality Components</h3>
              <p style={{ color: "#666" }}>
                Every component is carefully reviewed for quality and
                functionality.
              </p>
            </div>
            <div>
              <h3>Time Saver</h3>
              <p style={{ color: "#666" }}>
                Save hours of development time by using ready-to-use components.
              </p>
            </div>
            <div>
              <h3>Support Developers</h3>
              <p style={{ color: "#666" }}>
                Support independent developers by purchasing premium components
                that help them grow.
              </p>
            </div>
          </div>
        </div>

        {/* Latest Components */}
        <div style={{ marginTop: "80px" }}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Latest Components</h2>
            <Link
              to="/components?sort=latest"
              className="btn btn-primary"
              style={{ maxWidth: "6rem" }}
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-3" style={{ gap: "24px" }}>
            {loadingLatest ? (
              <p style={{ textAlign: "center" }}>Loading...</p>
            ) : (
              latestComponents.map((component) => (
                <ComponentCard key={component.id} component={component} />
              ))
            )}
          </div>
        </div>

        {/* Customer Testimonials Section */}
        <div
          className="text-center"
          style={{
            marginTop: "80px",
            padding: "60px 20px",
            borderRadius: "12px",
          }}
        >
          <h2 className="mb-5 text-green">What Our Customers Say</h2>
          <div className="grid grid-cols-3" style={{ gap: "24px" }}>
            <div
              className="p-4 border rounded"
              style={{
                padding: "30px",
                border: "2px solid #f0f0f0",
                borderRadius: "20px",
                background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
              }}
            >
              <p>"The components saved me so much time! Excellent quality."</p>
              <strong>- Sarah J.</strong>
            </div>
            <div
              className="p-4 border rounded"
              style={{
                padding: "30px",
                border: "2px solid #f0f0f0",
                borderRadius: "20px",
                background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
              }}
            >
              <p>"Amazing marketplace with trustworthy components."</p>
              <strong>- Michael R.</strong>
            </div>
            <div
              className="p-4 border rounded"
              style={{
                padding: "30px",
                border: "2px solid #f0f0f0",
                borderRadius: "20px",
                background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
              }}
            >
              <p>"I highly recommend it for all developers."</p>
              <strong>- Priya S.</strong>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div
          className="text-center"
          style={{
            marginTop: "80px",
            padding: "60px 0",
            backgroundColor: "#eef2f7",
            borderRadius: "12px",
          }}
        >
          <h2 className="mb-4">Trusted by Developers Worldwide</h2>
          <div
            className="grid grid-cols-4"
            style={{ maxWidth: "800px", margin: "0 auto" }}
          >
            <div>
              <div className="stat-value">10,000+</div>
              <div className="stat-label">Components</div>
            </div>
            <div>
              <div className="stat-value">5,000+</div>
              <div className="stat-label">Developers</div>
            </div>
            <div>
              <div className="stat-value">50,000+</div>
              <div className="stat-label">Downloads</div>
            </div>
            <div>
              <div className="stat-value">4.8★</div>
              <div className="stat-label">Average Rating</div>
            </div>
          </div>
        </div>

        {/* Optional CTA for users not signed up */}
        {!user && (
          <div className="text-center" style={{ marginTop: "80px" }}>
            <h2 className="mb-3">Join Thousands of Developers</h2>
            <p
              style={{ fontSize: "18px", color: "#555", marginBottom: "32px" }}
            >
              Start building better products faster today.
            </p>
            <Link to="/register" className="btn btn-primary btn-lg">
              Create Your Account
            </Link>
          </div>
        )}
      </div>

      {/* Footer Section */}
      <footer
        style={{
          marginTop: "100px",
          background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
          color: "#f9fafb",
          padding: "60px 20px 40px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "40px",
          }}
        >
          <div>
            <h4
              style={{
                marginBottom: "20px",
                fontSize: "1.3rem",
                color: "#00ff00",
              }}
            >
              ComponentHub
            </h4>
            <p style={{ color: "#ccc", fontSize: "1rem", lineHeight: "1.6" }}>
              A marketplace for high-quality components built by developers, for
              developers. Build faster, build better.
            </p>
          </div>
          <div>
            <h4 style={{ marginBottom: "20px", fontSize: "1.3rem" }}>
              Quick Links
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {[
                { to: "/components", text: "Browse Components" },
                { to: "/profile", text: "My Account" },
                { to: "/dashboard", text: "Seller Dashboard" },
              ].map((link, index) => (
                <li key={index} style={{ marginBottom: "10px" }}>
                  <Link
                    to={link.to}
                    style={{
                      color: "#ccc",
                      textDecoration: "none",
                      transition: "color 0.3s ease",
                    }}
                    onMouseOver={(e) => (e.target.style.color = "#00ff00")}
                    onMouseOut={(e) => (e.target.style.color = "#ccc")}
                  >
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ marginBottom: "20px", fontSize: "1.3rem" }}>
              Contact
            </h4>
            <p style={{ color: "#ccc", fontSize: "1rem", lineHeight: "1.8" }}>
              support@componenthub.com <br />
              +91 (800) 555-1234 <br />
              <span style={{ color: "#00ff00" }}>24/7 Support Available</span>
            </p>
          </div>
        </div>
        <div
          style={{
            textAlign: "center",
            marginTop: "40px",
            paddingTop: "30px",
            borderTop: "1px solid #374151",
            fontSize: "0.9rem",
            color: "#9ca3af",
          }}
        >
          © {new Date().getFullYear()} ComponentHub. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Home;
