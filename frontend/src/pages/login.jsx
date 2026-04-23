import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "./auth.css";

// Helper component for the Bootstrap Toast
const Toast = ({ message, type, show, onClose }) => {
  if (!show) return null;

  const alertClass = {
    success: "alert-success",
    danger: "alert-danger",
    warning: "alert-warning",
  }[type] || "alert-info";

  return (
    <div
      className={`alert ${alertClass} alert-dismissible fade show fixed-top mx-auto mt-3`}
      role="alert"
      style={{ width: "90%", maxWidth: "500px", zIndex: 1050 }}
    >
      {message}
      <button
        type="button"
        className="btn-close"
        onClick={onClose}
        aria-label="Close"
      ></button>
    </div>
  );
};

function Login({ setIsLoggedIn, setUserRole, mode = "user" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminMode = mode === "admin";
  const redirectFrom = location.state?.from;

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "info",
  });

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "info" });
    }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setToast({ show: false, message: "", type: "info" });

    try {
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5000";

      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      // Keep user/admin login UIs separated even when backend uses one endpoint.
      if (!isAdminMode && data.user.role === "admin") {
        setError("Admin accounts must sign in from the admin login page.");
        return;
      }

      if (isAdminMode && data.user.role !== "admin") {
        setError("This page is only for admin accounts.");
        return;
      }

      // 🔐 EXISTING LOGIC (UNCHANGED)
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("email", data.user.email);

      // ✅ Persist user identifiers for client-side requests
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("phone", data.user.phone);
      localStorage.setItem("name", data.user.name);

      // 🛒 Keep cart on login (user retains their cart after logging in)

      setIsLoggedIn(true);
      setUserRole(data.user.role);

      showToast("✅ Login Successful", "success");

      setTimeout(() => {
        if (isAdminMode) {
          navigate(
            typeof redirectFrom === "string" && redirectFrom.startsWith("/admin")
              ? redirectFrom
              : "/admin"
          );
        } else {
          navigate(
            typeof redirectFrom === "string" && redirectFrom.startsWith("/")
              ? redirectFrom
              : "/"
          );
        }
      }, 1000);
    } catch (err) {
      console.error("❌ Login error:", err);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="auth-page">
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <div className="auth-container">
        <div className="auth-content">
          {/* Left Side */}
          <div className="auth-side auth-side-left">
            <div className="auth-branding">
              <h2 className="auth-title">
                {isAdminMode ? "Admin Access" : "Welcome Back"}
              </h2>
              <p className="auth-subtitle">
                {isAdminMode
                  ? "Sign in with your admin account"
                  : "Sign in to your account to continue"}
              </p>
              <div className="auth-features">
                <div className="feature">
                  <span>✓</span> {isAdminMode ? "Manage Store Operations" : "Access Your Account"}
                </div>
                <div className="feature">
                  <span>✓</span> {isAdminMode ? "Monitor Orders & Returns" : "Track Your Orders"}
                </div>
                <div className="feature">
                  <span>✓</span> {isAdminMode ? "Review Reports & Users" : "Exclusive Deals"}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="auth-side auth-side-right">
            <div className="auth-form-wrapper">
              <div className="auth-form-header">
                <h3 className="auth-form-title">
                  {isAdminMode ? "Admin Sign In" : "Sign In"}
                </h3>
              </div>

              {error && (
                <div className="alert alert-danger text-center mb-3">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="input-wrapper">
                    <span className="input-icon">✉️</span>
                    <input
                      type="email"
                      className="form-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🔒</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                </div>

                {!isAdminMode && (
                  <div className="text-end mb-3">
                    <Link to="/forgot-password" className="link-primary">
                      Forgot Password?
                    </Link>
                  </div>
                )}

                <button type="submit" className="auth-button">
                  {isAdminMode ? "Sign In as Admin" : "Sign In"}
                </button>
              </form>

              <div className="auth-divider">or</div>

              {isAdminMode ? (
                <p className="auth-link">
                  Not an admin?{" "}
                  <Link to="/login" className="link-primary">
                    User Login
                  </Link>
                </p>
              ) : (
                <>
                  <p className="auth-link">
                    Don't have an account?{" "}
                    <Link to="/register" className="link-primary">
                      Create one now
                    </Link>
                  </p>
                  <p className="auth-link mt-2">
                    Admin account?{" "}
                    <Link to="/admin/login" className="link-primary">
                      Go to Admin Login
                    </Link>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

