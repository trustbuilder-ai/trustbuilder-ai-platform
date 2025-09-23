import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../shared/hooks/useAuth";
import { AUTH_CONFIG } from "../config";
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthLabel } from "../shared/utils/passwordValidation";
import "./AccountSettings.css";

const AccountSettings = () => {
  const navigate = useNavigate();
  const { session, authMethod, updateUserPassword } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (newPassword) {
      setPasswordStrength(validatePassword(newPassword));
    } else {
      setPasswordStrength(null);
    }
  }, [newPassword]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password must be different from current password");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (passwordStrength && !passwordStrength.isValid) {
      setError("Please meet all password requirements");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      // Note: Supabase doesn't verify current password for authenticated users
      const { error } = await updateUserPassword(currentPassword, newPassword);

      if (error) throw error;

      setMessage("Password successfully updated!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordStrength(null);
    } catch (error) {
      setError(error.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    navigate("/");
    return null;
  }

  return (
    <div className="account-settings-container">
      <div className="account-settings-card">
        <div className="settings-header">
          <h1>Account Settings</h1>
          <button className="close-button" onClick={() => navigate(-1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </button>
          {authMethod === "password" && (
            <button
              className={`settings-tab ${activeTab === "security" ? "active" : ""}`}
              onClick={() => setActiveTab("security")}
            >
              Security
            </button>
          )}
        </div>

        <div className="settings-content">
          {activeTab === "profile" && (
            <div className="profile-section">
              <h2>Profile Information</h2>
              <div className="profile-info">
                <div className="info-row">
                  <label>Email:</label>
                  <span>{session.user.email}</span>
                </div>
                <div className="info-row">
                  <label>User ID:</label>
                  <span className="user-id">{session.user.id}</span>
                </div>
                <div className="info-row">
                  <label>Auth Method:</label>
                  <span className="auth-method">
                    {authMethod === "password" ? "Password" : "One-Time Password (OTP)"}
                  </span>
                </div>
                <div className="info-row">
                  <label>Account Created:</label>
                  <span>{new Date(session.user.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && authMethod === "password" && (
            <div className="security-section">
              <h2>Change Password</h2>
              <form onSubmit={handlePasswordChange} className="password-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="form-input"
                    minLength={AUTH_CONFIG.PASSWORD_MIN_LENGTH}
                  />
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="form-input"
                  />
                </div>

                {passwordStrength && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div
                        className="strength-fill"
                        style={{
                          width: `${(passwordStrength.score + 1) * 20}%`,
                          backgroundColor: getPasswordStrengthColor(passwordStrength.score),
                        }}
                      />
                    </div>
                    <span className="strength-label" style={{ color: getPasswordStrengthColor(passwordStrength.score) }}>
                      {getPasswordStrengthLabel(passwordStrength.score)}
                    </span>
                    {passwordStrength.feedback.length > 0 && (
                      <ul className="password-feedback">
                        {passwordStrength.feedback.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  className="submit-button"
                  disabled={loading || !passwordStrength?.isValid}
                >
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </form>

              {message && <div className="success-message">{message}</div>}
              {error && <div className="error-message">{error}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;