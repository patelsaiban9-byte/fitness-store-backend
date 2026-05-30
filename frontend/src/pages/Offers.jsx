import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./offers.css";

function Offers() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await fetch(`${API_URL}/api/coupons/active`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load offers.");
        }
        setCoupons(data);
      } catch (error) {
        console.error("Offers fetch error:", error);
        setMessage({ type: "danger", text: error.message || "Unable to load offers." });
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, [API_URL]);

  const formatDiscount = (coupon) => {
    return coupon.discountType === "percentage"
      ? `${coupon.discountValue}% OFF`
      : `₹${coupon.discountValue} OFF`;
  };

  return (
    <div className="offers-page container py-4">
      <div className="offers-hero shadow-sm">
        <div>
          <p className="offers-hero-tag">🔥 Coupon Offers</p>
          <h1>Discover savings before checkout</h1>
          <p>
            Browse all active offers, copy the coupon code, and apply it during checkout.
            This is how smart shoppers save on every order.
          </p>
        </div>
        <button
          type="button"
          className="offers-hero-btn"
          onClick={() => navigate("/products")}
        >
          Shop with offers
        </button>
      </div>

      {message && (
        <div className={`alert alert-${message.type} mt-4`} role="alert">
          {message.text}
        </div>
      )}

      <div className="offers-section mt-4">
        <div className="offers-section-head">
          <h2>Active Coupon Codes</h2>
          <span>{loading ? "Loading offers..." : `${coupons.length} available`}</span>
        </div>

        <div className="offers-grid">
          {loading && (
            <div className="offers-empty">Fetching available coupons...</div>
          )}

          {!loading && coupons.length === 0 && (
            <div className="offers-empty">
              No active coupons right now. Check back soon for new savings.
            </div>
          )}

          {!loading && coupons.map((coupon) => (
            <article key={coupon.code} className="offers-card">
              <div className="offers-card-top">
                <span className="offers-badge">{formatDiscount(coupon)}</span>
                <span className="offers-code">{coupon.code}</span>
              </div>
              <p className="offers-description">
                {coupon.description || "Apply this coupon during checkout to claim the discount."}
              </p>
              <div className="offers-meta">
                <span>Min order ₹{coupon.minOrderAmount || 0}</span>
                {coupon.maxDiscountAmount > 0 && (
                  <span>Max discount ₹{coupon.maxDiscountAmount}</span>
                )}
              </div>
              <div className="offers-actions">
                <button
                  type="button"
                  className="offers-copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(coupon.code);
                    setMessage({ type: "success", text: `${coupon.code} copied to clipboard!` });
                  }}
                >
                  Copy code
                </button>
                <button
                  type="button"
                  className="offers-learn-btn"
                  onClick={() => navigate("/cart")}
                >
                  Use at checkout
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Offers;
