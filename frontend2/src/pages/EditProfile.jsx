"use client";

import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    website: user?.website || "",
    location: user?.location || "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await updateProfile(formData);
      setSuccess("Profile updated successfully!");
    } catch (error) {
      setError(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="profile-edit-container"
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "40px 20px",
        color: "var(--color-fg-default)",
      }}
    >
      <h1 style={{ marginBottom: "16px" }}>Edit Profile</h1>
      <p style={{ color: "var(--color-fg-muted)", marginBottom: "32px" }}>
        Update your personal information and account settings.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "32px" }}>
        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {/* Top Section: Avatar + Personal Info */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "24px",
            backgroundColor:
              user.role.toLowerCase() === "seller" ? "#e8f5e9" : "#f9f9f9",
            padding: "24px",
            borderRadius: "16px",
            boxShadow: "0 6px 16px rgba(0,0,0,0.05)",
            alignItems: "center",
          }}
        >
          {/* Avatar */}
          <div style={{ flexShrink: 0 }}>
            <div
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                backgroundColor: "#c8e6c9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "36px",
                color: "#2e7d32",
                marginBottom: "12px",
              }}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <button type="button" className="btn btn-secondary btn-sm">
              Change Picture
            </button>
          </div>

          {/* Personal Information */}
          <div
            style={{ flex: 1, minWidth: "220px", display: "grid", gap: "12px" }}
          >
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid var(--color-border-default)",
              }}
              required
            />
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Bio"
              rows={3}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid var(--color-border-default)",
              }}
            />
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="Website"
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid var(--color-border-default)",
              }}
            />
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Location"
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid var(--color-border-default)",
              }}
            />

            <div
              style={{
                padding: "10px",
                borderRadius: "8px",
                backgroundColor: "#c8e6c9",
                color: "#2e7d32",
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              {user?.role} (Contact support to change)
            </div>
          </div>
        </div>

        {/* Middle Section: Account Settings */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
            flexWrap: "wrap",
          }}
        >
          {/* Change Password / 2FA */}
          <div
            style={{
              backgroundColor: "#fff",
              padding: "24px",
              borderRadius: "16px",
              boxShadow: "0 6px 16px rgba(0,0,0,0.05)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <h3>Account Settings</h3>

            <div>
              <label style={{ fontWeight: 500 }}>Change Password</label>
              <p style={{ color: "var(--color-fg-muted)", fontSize: "14px" }}>
                Update your password to keep your account secure.
              </p>
              <button className="btn btn-secondary">Change Password</button>
            </div>

            <div>
              <label style={{ fontWeight: 500 }}>
                Two-Factor Authentication
              </label>
              <p style={{ color: "var(--color-fg-muted)", fontSize: "14px" }}>
                Add an extra layer of security to your account.
              </p>
              <button className="btn btn-secondary">Enable 2FA</button>
            </div>
          </div>

          {/* Danger Zone */}
          <div
            style={{
              backgroundColor: "#fff",
              padding: "24px",
              borderRadius: "16px",
              boxShadow: "0 6px 16px rgba(0,0,0,0.05)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <h3 style={{ color: "#d32f2f" }}>Danger Zone</h3>
            <p style={{ color: "var(--color-fg-muted)", fontSize: "14px" }}>
              Once you delete your account, there is no going back. Please be
              certain.
            </p>
            <button className="btn btn-danger">Delete Account</button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ width: "100%", padding: "12px", fontSize: "16px" }}
        >
          {loading ? "Updating..." : "Update Profile"}
        </button>
      </form>

      {/* Mobile Responsive */}
      <style>
        {`
          @media (max-width: 768px) {
            .profile-edit-container form > div:nth-child(2) {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Profile;
