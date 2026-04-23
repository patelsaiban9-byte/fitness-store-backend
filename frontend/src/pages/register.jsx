import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./auth.css";

// Reusing the Toast component structure for consistent feedback
const Toast = ({ message, type, show, onClose }) => {
  if (!show) return null;

  const alertClass = {
    success: 'alert-success',
    danger: 'alert-danger',
    warning: 'alert-warning',
  }[type] || 'alert-info';

  return (
    <div
      className={`alert ${alertClass} alert-dismissible fade show fixed-top mx-auto mt-3`}
      role="alert"
      style={{ width: '90%', maxWidth: '500px', zIndex: 1050 }}
    >
      {message}
      <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
    </div>
  );
};

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // State for Toast Notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  // Function to show toast message
  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'info' });
    }, 3000);
  };

  // ✅ Updated: use VITE_API_URL from .env for Vite
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const validateForm = () => {
    if (!name.trim()) {
      setError("❌ Please enter your name.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("❌ Please enter a valid email address.");
      return false;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      setError("❌ Phone number must be exactly 10 digits.");
      return false;
    }

    if (password.length < 6) {
      setError("❌ Password must be at least 6 characters long.");
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Use setError for form-based errors
        setError(data.message || "Registration failed");
        return;
      }

      // Replaced alert() with showToast()
      showToast("✅ Registration Successful! Please login.", "success");
      
      // Navigate after a short delay to allow toast to show briefly
      setTimeout(() => {
          navigate("/login");
      }, 1000);
      
    } catch (err) {
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
              <h2 className="auth-title">Join Us Today</h2>
              <p className="auth-subtitle">Start your fitness journey with us</p>
              <div className="auth-features">
                <div className="feature">
                  <span>✓</span> Premium Products
                </div>
                <div className="feature">
                  <span>✓</span> Expert Support
                </div>
                <div className="feature">
                  <span>✓</span> Member Benefits
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="auth-side auth-side-right">
            <div className="auth-form-wrapper">
              <div className="auth-form-header">
                <h3 className="auth-form-title">Create Account</h3>
              </div>

              {error && (
                <div className="alert alert-danger text-center mb-3">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="input-wrapper">
                    <span className="input-icon">👤</span>
                    <input
                      type="text"
                      className="form-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>

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
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <div className="input-wrapper">
                    <span className="input-icon">📱</span>
                    <input
                      type="tel"
                      className="form-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10 digit phone number"
                      maxLength="10"
                      autoComplete="tel"
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
                      placeholder="Minimum 6 characters"
                      autoComplete="new-password"
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

                <button type="submit" className="auth-button">
                  Create Account
                </button>
              </form>

              <div className="auth-divider">or</div>

              <p className="auth-link">
                Already have an account?{" "}
                <Link to="/login" className="link-primary">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
