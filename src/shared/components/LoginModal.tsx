import React, { useState, useEffect } from "react";
import "./LoginModal.css";
import { auth } from "../lib/supabase";
import { AUTH_CONFIG } from "../../config";
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthLabel } from "../utils/passwordValidation";

const LoginModal = ({ onClose }) => {
  const [authMethod, setAuthMethod] = useState("password"); // "password" or "otp"
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (password && isSignUp) {
      setPasswordStrength(validatePassword(password));
    } else {
      setPasswordStrength(null);
    }
  }, [password, isSignUp]);

  const handlePasswordAuth = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (passwordStrength && !passwordStrength.isValid) {
        setError("Please meet all password requirements");
        return;
      }
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (isSignUp) {
        const { error } = await auth.signUp(email, password);
        if (error) throw error;
        setMessage(AUTH_CONFIG.REQUIRE_EMAIL_CONFIRMATION
          ? "Check your email to confirm your account!"
          : "Account created successfully! You are now logged in.");
        if (!AUTH_CONFIG.REQUIRE_EMAIL_CONFIRMATION) {
          setTimeout(() => onClose(), 1500);
        }
      } else {
        const { error } = await auth.signInWithPassword(email, password);
        if (error) throw error;
        setMessage("Successfully logged in!");
        setTimeout(() => onClose(), 1500);
      }
    } catch (error) {
      setError(error.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpRequest = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { error } = await auth.signInWithOtp(email);
      if (error) throw error;
      setMessage("Check your email for the 6-digit code!");
      setShowOtpInput(true);
    } catch (error) {
      setError(error.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerification = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) return;

    setLoading(true);
    setError("");

    try {
      const { error } = await auth.verifyOtp(email, otp);
      if (error) throw error;
      setMessage("Successfully logged in!");
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      setError(error.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setError("Please enter your email address first");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { error } = await auth.resetPasswordForEmail(email);
      if (error) throw error;
      setMessage("Check your email for password reset instructions!");
      setShowResetModal(false);
    } catch (error) {
      setError(error.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Login / Register</h2>
          <button className="close-button" onClick={onClose}>
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

        {/* Auth method tabs */}
        {AUTH_CONFIG.ENABLE_PASSWORD_AUTH && AUTH_CONFIG.ENABLE_OTP_AUTH && (
          <div className="auth-tabs">
            <button
              className={`auth-tab ${authMethod === "password" ? "active" : ""}`}
              onClick={() => {
                setAuthMethod("password");
                setShowOtpInput(false);
                setError("");
                setMessage("");
              }}
              type="button"
            >
              Password
            </button>
            <button
              className={`auth-tab ${authMethod === "otp" ? "active" : ""}`}
              onClick={() => {
                setAuthMethod("otp");
                setError("");
                setMessage("");
              }}
              type="button"
            >
              One-Time Code
            </button>
          </div>
        )}

        {/* Password Authentication */}
        {authMethod === "password" && AUTH_CONFIG.ENABLE_PASSWORD_AUTH && (
          <>
            {!showResetModal ? (
              <form onSubmit={handlePasswordAuth} className="login-form">
                <p className="form-description">
                  {isSignUp ? "Create a new account" : "Sign in to your account"}
                </p>

                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="email-input"
                  autoFocus
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="email-input"
                  minLength={AUTH_CONFIG.PASSWORD_MIN_LENGTH}
                />

                {isSignUp && (
                  <>
                    <input
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="email-input"
                    />

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
                  </>
                )}

                <button type="submit" className="submit-button" disabled={loading}>
                  {loading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
                </button>

                <div className="form-footer">
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setError("");
                      setMessage("");
                      setPassword("");
                      setConfirmPassword("");
                    }}
                  >
                    {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
                  </button>

                  {!isSignUp && (
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => setShowResetModal(true)}
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="login-form">
                <p className="form-description">
                  Enter your email to receive password reset instructions
                </p>

                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="email-input"
                  autoFocus
                />

                <button
                  onClick={handlePasswordReset}
                  className="submit-button"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Reset Email"}
                </button>

                <button
                  type="button"
                  className="link-button"
                  onClick={() => setShowResetModal(false)}
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </>
        )}

        {/* OTP Authentication */}
        {authMethod === "otp" && AUTH_CONFIG.ENABLE_OTP_AUTH && (
          <>
            {!showOtpInput ? (
              <form onSubmit={handleOtpRequest} className="login-form">
                <p className="form-description">
                  Enter your email address to receive a one-time password
                </p>

                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="email-input"
                  autoFocus
                />

                <button type="submit" className="submit-button" disabled={loading}>
                  {loading ? "Sending..." : "Send OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleOtpVerification} className="login-form">
                <p className="form-description">
                  Enter the 6-digit code sent to {email}
                </p>

                <input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setOtp(value);
                  }}
                  required
                  className="email-input otp-input"
                  autoFocus
                  maxLength={6}
                  style={{ letterSpacing: "0.5em", textAlign: "center" }}
                />

                <button
                  type="submit"
                  className="submit-button"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? "Verifying..." : "Verify Code"}
                </button>

                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    setShowOtpInput(false);
                    setOtp("");
                    setMessage("");
                    setError("");
                  }}
                >
                  Use different email
                </button>
              </form>
            )}
          </>
        )}

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default LoginModal;
