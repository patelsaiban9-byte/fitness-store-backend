import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

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

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const userRole = localStorage.getItem("role");
  const isLoggedIn = Boolean(localStorage.getItem("token"));
  const token = localStorage.getItem("token") || "";

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  // ✅ NEW (ONLY ADD)
  const [relatedProducts, setRelatedProducts] = useState([]);

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
  };

  /* ===============================
     FETCH SINGLE PRODUCT (OLD)
     =============================== */
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_URL}/api/products/${id}`);
        const data = await res.json();
        setProduct(data);

        // ✅ NEW: fetch all products for related
        const allRes = await fetch(`${API_URL}/api/products`);
        const allProducts = await allRes.json();

        // remove current product
        const filtered = allProducts.filter(
          (p) => p._id !== data._id
        );

        // take first 4
        setRelatedProducts(filtered.slice(0, 4));
      } catch (err) {
        console.error("Product detail error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, API_URL]);

  /* ===============================
     ADD TO CART (OLD – SAME)
     =============================== */
  const addToCart = () => {
    // Check stock availability (only if stock is being tracked)
    if (product.stock != null && product.stock === 0) {
      showToast("Sorry, this product is out of stock!", "warning");
      return;
    }

    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    const existingItem = cart.find(
      (item) => item._id === product._id
    );

    // Check if adding to cart would exceed available stock (only if stock is tracked)
    if (product.stock != null && product.stock > 0) {
      const currentQtyInCart = existingItem ? existingItem.qty : 0;
      if (currentQtyInCart >= product.stock) {
        showToast(
          `Sorry, only ${product.stock} units available. You already have ${currentQtyInCart} in your cart.`,
          "warning"
        );
        return;
      }
    }

    if (existingItem) {
      existingItem.qty += 1;
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
    // Dispatch custom event to notify navbar (same-tab updates)
    window.dispatchEvent(new Event("cartUpdated"));
    showToast("Product added to cart 🛒", "success");
  };

  /* ===============================
     BUY NOW - DIRECT ORDER (SEPARATE FROM CART)
     =============================== */
  const buyNow = () => {
    // Check stock availability (only if stock is being tracked)
    if (product.stock != null && product.stock === 0) {
      showToast("Sorry, this product is out of stock!", "warning");
      return;
    }

    // Store only this product for direct purchase (NOT in cart)
    const directBuyItem = {
      _id: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      qty: 1,
    };

    // Save to sessionStorage (temporary, clears when tab closes)
    sessionStorage.setItem("directBuyItem", JSON.stringify(directBuyItem));

    if (!isLoggedIn) {
      navigate("/login", { state: { from: "/buynow" } });
      return;
    }

    navigate("/buynow");
  };

  const addToWishlist = async () => {
    if (!isLoggedIn) {
      navigate("/login", { state: { from: `/product/${id}` } });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/wishlist/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product._id }),
      });

      if (res.status === 409) {
        showToast("Already in wishlist", "warning");
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err?.message || "Failed to add to wishlist", "danger");
        return;
      }

      const countRes = await fetch(`${API_URL}/api/wishlist/count`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const countData = countRes.ok ? await countRes.json() : { count: null };

      window.dispatchEvent(
        new CustomEvent("wishlistUpdated", {
          detail: { count: Number(countData?.count) || undefined },
        })
      );
      showToast("Added to wishlist", "success");
    } catch (error) {
      console.error("Add wishlist error:", error);
      showToast("Failed to add to wishlist", "danger");
    }
  };

  /* ===============================
     DELIVERY DATE (UI ONLY)
     =============================== */
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 4);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-5 text-center">
        <h3>Product not found</h3>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />

      {/* BACK */}
      <button
        className="btn btn-outline-secondary mb-4"
        onClick={() => navigate(-1)}
      >
        ⬅ Back
      </button>

      <div className="row g-4">
        {/* IMAGE */}
        <div className="col-md-6">
          <div className="bg-light p-4 rounded shadow-sm">
            <img
              src={
                product.image?.startsWith("http")
                  ? product.image
                  : `${API_URL}/${product.image}`
              }
              alt={product.name}
              className="img-fluid rounded"
              style={{ maxHeight: "420px", objectFit: "contain" }}
            />
          </div>
        </div>

        {/* DETAILS */}
        <div className="col-md-6">
          <h2 className="fw-bold">{product.name}</h2>

          <div className="mb-2 text-warning">
            ⭐⭐⭐⭐☆ <span className="text-muted">(4.2 | 1,248 ratings)</span>
          </div>

          <h4 className="text-success fw-bold mb-3">
            ₹{product.price}
          </h4>

          {/* STOCK STATUS - Only show if stock is being tracked */}
          {product.stock != null && (
            <div className="mb-3">
              {product.stock === 0 ? (
                <span className="badge bg-danger fs-6">🚫 Out of Stock</span>
              ) : product.stock <= (product.minimumStockThreshold || 5) ? (
                <span className="badge bg-warning text-dark fs-6">
                  ⚠️ Only {product.stock} left - Order soon!
                </span>
              ) : (
                <span className="badge bg-success fs-6">✅ In Stock</span>
              )}
            </div>
          )}

          <p className="text-muted">{product.description}</p>

          <div className="mb-3">
            <strong>🚚 Delivery by:</strong>{" "}
            {deliveryDate.toDateString()}
          </div>

          <div className="mb-4">
            <div>🔒 100% Secure Payment</div>
            <div>✅ Genuine Product</div>
            <div>↩️ 7 Days Replacement</div>
          </div>

          {userRole !== "admin" && (
            <div className="d-flex gap-3 mb-4">
              <button
                className="btn btn-outline-primary btn-lg w-50"
                onClick={addToCart}
                disabled={product.stock != null && product.stock === 0}
                style={{
                  opacity: (product.stock != null && product.stock === 0) ? 0.5 : 1,
                  cursor: (product.stock != null && product.stock === 0) ? "not-allowed" : "pointer",
                }}
              >
                {(product.stock != null && product.stock === 0) ? "Out of Stock" : "➕ Add to Cart"}
              </button>

              <button
                className="btn btn-primary btn-lg w-50"
                onClick={buyNow}
                disabled={product.stock != null && product.stock === 0}
                style={{
                  opacity: (product.stock != null && product.stock === 0) ? 0.5 : 1,
                  cursor: (product.stock != null && product.stock === 0) ? "not-allowed" : "pointer",
                }}
              >
                {(product.stock != null && product.stock === 0) ? "Out of Stock" : "🛒 Buy Now"}
              </button>
            </div>
          )}

          {userRole === "user" && (
            <button className="btn btn-outline-danger w-100 mb-4" onClick={addToWishlist}>
              ❤️ Add to Wishlist
            </button>
          )}
        </div>
      </div>

      {/* 📦 RELATED PRODUCTS (REAL + IMAGES) */}
      <hr className="my-5" />
      <h4 className="fw-bold mb-4">📦 Related Products</h4>

      <div className="row g-3">
        {relatedProducts.map((rp) => (
          <div key={rp._id} className="col-6 col-md-3">
            <div
              className="card h-100 shadow-sm"
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/product/${rp._id}`)}
            >
              <div
                className="bg-light"
                style={{ height: "140px", overflow: "hidden" }}
              >
                <img
                  src={
                    rp.image?.startsWith("http")
                      ? rp.image
                      : `${API_URL}/${rp.image}`
                  }
                  alt={rp.name}
                  className="w-100 h-100"
                  style={{ objectFit: "contain" }}
                />
              </div>
              <div className="card-body">
                <h6 className="fw-bold">{rp.name}</h6>
                <p className="text-success fw-bold mb-0">
                  ₹{rp.price}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductDetail;
