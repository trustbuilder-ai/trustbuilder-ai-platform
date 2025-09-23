import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "../shared/lib/supabase";
import { AUTH_CONFIG } from "../config";
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthLabel } from "../shared/utils/passwordValidation";
import "./ResetPassword.css";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [isValidToken, setIsValidToken] = useState(false);

  useEffect(() => {
    // Check if we have a valid reset token in the URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(location.search);

    const tokenHash = hashParams.get("token_hash") || queryParams.get("token_hash");
    const type = hashParams.get("type") || queryParams.get("type");

    if (tokenHash && type === "recovery") {
      setIsValidToken(true);
    } else {
      setError("Invalid or missing password reset link. Please request a new one.");
      setIsValidToken(false);
    }
  }, [location]);

  useEffect(() => {
    if (password) {
      setPasswordStrength(validatePassword(password));
    } else {
      setPasswordStrength(null);
    }
  }, [password]);

  const handlePasswordReset = async (e) => {
    e.preventDefault();

    if (!isValidToken) {
      setError("Invalid reset token. Please request a new password reset.");
      return;
    }

    if (!password.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
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
      const { error } = await auth.updatePassword(password);

      if (error) throw error;

      setMessage("Password successfully reset! Redirecting to login...");
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      setError(error.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <h1>Reset Your Password</h1>

        {isValidToken ? (
          <form onSubmit={handlePasswordReset} className="reset-password-form">
            <p className="form-description">
              Enter your new password below
            </p>

            <div className="form-group">
              <input
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
                minLength={AUTH_CONFIG.PASSWORD_MIN_LENGTH}
                autoFocus
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
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
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <button
              type="button"
              className="back-button"
              onClick={() => navigate("/")}
            >
              Back to Login
            </button>
          </form>
        ) : (
          <div className="error-container">
            <p className="error-description">{error}</p>
            <button
              className="back-button"
              onClick={() => navigate("/")}
            >
              Back to Login
            </button>
          </div>
        )}

        {message && <div className="success-message">{message}</div>}
        {error && isValidToken && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default ResetPassword;