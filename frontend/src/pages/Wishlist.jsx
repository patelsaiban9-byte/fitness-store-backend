import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

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
      style={{ width: "90%", maxWidth: "520px", zIndex: 1050 }}
    >
      {message}
      <button type="button" className="btn-close" onClick={onClose}></button>
    </div>
  );
};

function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  const toastTimerRef = useRef(null);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const showToast = (message, type = "info") => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setToast({ show: true, message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast({ show: false, message: "", type: "info" });
    }, 3000);
  };

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || "";

      const res = await fetch(`${API_URL}/api/wishlist/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err?.message || "Failed to load wishlist", "danger");
        setItems([]);
        return;
      }

      const data = await res.json();
      const validItems = Array.isArray(data)
        ? data.filter((entry) => entry?.productId)
        : [];

      setItems(validItems);
      window.dispatchEvent(
        new CustomEvent("wishlistUpdated", {
          detail: { count: validItems.length },
        })
      );
    } catch (error) {
      console.error("Wishlist fetch error:", error);
      showToast("Failed to load wishlist", "danger");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();

    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const totalItems = useMemo(() => items.length, [items]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/products");
  };

  const removeFromWishlist = async (productId, options = {}) => {
    try {
      const token = localStorage.getItem("token") || "";

      const res = await fetch(`${API_URL}/api/wishlist/remove/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err?.message || "Failed to remove item", "danger");
        return false;
      }

      const updated = items.filter((entry) => entry.productId?._id !== productId);
      setItems(updated);
      window.dispatchEvent(
        new CustomEvent("wishlistUpdated", {
          detail: { count: updated.length },
        })
      );
      if (!options.silent) {
        showToast("Removed from wishlist", "success");
      }
      return true;
    } catch (error) {
      console.error("Wishlist remove error:", error);
      showToast("Failed to remove item", "danger");
      return false;
    }
  };

  const moveToCart = async (entry) => {
    const product = entry.productId;
    if (!product?._id) {
      showToast("Product is unavailable", "warning");
      return;
    }

    if (product.stock != null && product.stock === 0) {
      showToast("Sorry, this product is out of stock!", "warning");
      return;
    }

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existing = cart.find((item) => item._id === product._id);

    if (product.stock != null && product.stock > 0) {
      const currentQtyInCart = existing ? existing.qty : 0;
      if (currentQtyInCart >= product.stock) {
        showToast(
          `Sorry, only ${product.stock} units available. You already have ${currentQtyInCart} in your cart.`,
          "warning"
        );
        return;
      }
    }

    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        _id: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        qty: 1,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));

    const removed = await removeFromWishlist(product._id, { silent: true });
    if (removed) {
      showToast("Moved to cart successfully", "success");
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />

      <div className="mb-3">
        <button type="button" className="btn btn-outline-secondary" onClick={handleBack}>
          ← Back
        </button>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">❤️ My Wishlist</h2>
        <span className="badge bg-danger-subtle text-dark fs-6">
          {totalItems} item{totalItems === 1 ? "" : "s"}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-5 bg-light rounded-3 border">
          <h4 className="mb-2">Your wishlist is empty</h4>
          <p className="text-muted mb-3">Save products here to quickly buy them later.</p>
          <button className="btn btn-primary" onClick={() => navigate("/products")}>
            Browse Products
          </button>
        </div>
      ) : (
        <div className="row g-4">
          {items.map((entry) => {
            const product = entry.productId;

            return (
              <div key={entry._id} className="col-12 col-sm-6 col-lg-4">
                <div className="card h-100 shadow-sm">
                  <div
                    className="bg-light"
                    style={{ height: "220px", overflow: "hidden", cursor: "pointer" }}
                    onClick={() => navigate(`/product/${product._id}`)}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-100 h-100"
                      style={{ objectFit: "contain" }}
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/300x220?text=Image+Not+Available";
                      }}
                    />
                  </div>

                  <div className="card-body d-flex flex-column">
                    <h5 className="fw-bold mb-1">{product.name}</h5>
                    <p className="text-muted mb-2">{product.category || "General"}</p>
                    <h6 className="text-success fw-bold mb-3">₹{product.price}</h6>

                    <div className="d-flex gap-2 mt-auto">
                      <button
                        className="btn btn-success w-100"
                        onClick={() => moveToCart(entry)}
                        disabled={product.stock != null && product.stock === 0}
                      >
                        {product.stock != null && product.stock === 0 ? "Out of Stock" : "🛒 Add to Cart"}
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => removeFromWishlist(product._id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Wishlist;
