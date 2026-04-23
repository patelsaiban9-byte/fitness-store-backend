import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./product.css";

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

/*
  Product Component
  -----------------
  - Fetch products from backend
  - Show product cards
  - Click card to open product detail page
*/

function Product() {
  const [products, setProducts] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [wishlistPendingIds, setWishlistPendingIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  const toastTimerRef = useRef(null);

  const navigate = useNavigate();
  const { category } = useParams();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const userRole = localStorage.getItem("role");
  const isUser = userRole === "user";
  const token = localStorage.getItem("token") || "";
  const selectedCategory = decodeURIComponent(category || "");

  const showToast = (message, type = "info") => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setToast({ show: true, message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast({ show: false, message: "", type: "info" });
    }, 3000);
  };

  /* ===============================
     FETCH PRODUCTS
     =============================== */
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const endpoint = selectedCategory
        ? `${API_URL}/api/products/category/${encodeURIComponent(selectedCategory)}`
        : `${API_URL}/api/products`;

      const res = await fetch(endpoint);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlistIds = async () => {
    if (!isUser || !token) {
      setWishlistIds(new Set());
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/wishlist/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        return;
      }

      const data = await res.json();
      const ids = new Set(
        (Array.isArray(data) ? data : [])
          .map((item) => item?.productId?._id)
          .filter(Boolean)
      );

      setWishlistIds(ids);
    } catch (err) {
      console.error("Error fetching wishlist:", err);
    }
  };

  const updateWishlistState = (productId, action) => {
    setWishlistIds((prev) => {
      const updated = new Set(prev);

      if (action === "add") {
        updated.add(productId);
      } else {
        updated.delete(productId);
      }

      return updated;
    });
  };

  const toggleWishlist = async (product) => {
    if (!token || !isUser) {
      navigate("/login", { state: { from: "/products" } });
      return;
    }

    const productId = product._id;
    const isAlreadyInWishlist = wishlistIds.has(productId);

    if (wishlistPendingIds.has(productId)) {
      return;
    }

    setWishlistPendingIds((prev) => {
      const next = new Set(prev);
      next.add(productId);
      return next;
    });

    // Optimistic UI: immediately reflect add/remove action in card heart state.
    updateWishlistState(productId, isAlreadyInWishlist ? "remove" : "add");

    try {
      const res = isAlreadyInWishlist
        ? await fetch(`${API_URL}/api/wishlist/remove/${productId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        : await fetch(`${API_URL}/api/wishlist/add`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ productId }),
          });

      if (res.ok) {
        showToast(
          isAlreadyInWishlist
            ? `${product.name} removed from wishlist`
            : `${product.name} added to wishlist`,
          "success"
        );
        return;
      }

      if (!isAlreadyInWishlist && res.status === 409) {
        showToast("Already in wishlist", "warning");
        return;
      }

      if (isAlreadyInWishlist && res.status === 404) {
        showToast("Item already removed from wishlist", "info");
        return;
      }

      // Roll back optimistic change for real failures.
      updateWishlistState(productId, isAlreadyInWishlist ? "add" : "remove");

      const err = await res.json().catch(() => ({}));
      showToast(err?.message || "Failed to update wishlist", "danger");
    } catch (err) {
      console.error("Wishlist toggle error:", err);
      updateWishlistState(productId, isAlreadyInWishlist ? "add" : "remove");
      showToast("Failed to update wishlist", "danger");
    } finally {
      setWishlistPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchWishlistIds();
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, [selectedCategory]);

  useEffect(() => {
    if (!isUser) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent("wishlistUpdated", {
        detail: { count: wishlistIds.size },
      })
    );
  }, [isUser, wishlistIds]);

  /* ===============================
     IMAGE URL HANDLING
     =============================== */
  const getImageUrl = (img) => {
    if (!img) return "";
    if (img.startsWith("http")) return img;
    return `${API_URL}/${img.replace(/^\/+/, "")}`;
  };

  const handleImageError = (e) => {
    e.target.src =
      "https://via.placeholder.com/300x200?text=Image+Not+Available";
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredProducts = products.filter((product) => {
    if (!normalizedQuery) return true;

    const name = (product.name || "").toLowerCase();
    const categoryName = (product.category || "").toLowerCase();
    const description = (product.description || "").toLowerCase();
    const price = String(product.price ?? "").toLowerCase();

    return (
      name.includes(normalizedQuery) ||
      categoryName.includes(normalizedQuery) ||
      description.includes(normalizedQuery) ||
      price.includes(normalizedQuery)
    );
  });

  const renderProductCard = (product) => (
    <div
      key={product._id}
      className="col-12 col-sm-6 col-md-4 col-lg-3"
    >
      <div
        className="card h-100 product-card shadow-sm"
        onClick={() =>
          navigate(`/product/${product._id}`)
        }
      >
        <div className="product-image-wrap">
          <span className="product-chip">Top Pick</span>
          <img
            src={getImageUrl(product.image)}
            alt={product.name}
            className="w-100 h-100 product-image"
            onError={handleImageError}
          />
        </div>

        <div className="card-body d-flex flex-column product-body">
          <h5 className="fw-bold product-title">{product.name}</h5>

          <p className="mb-2">
            <span className="badge bg-info text-dark">{product.category || "General"}</span>
          </p>

          <p className="text-muted flex-grow-1 product-desc">
            {product.description || "No description available"}
          </p>

          <div className="price-row">
            <h6 className="fw-bold text-success mb-0">
              ₹{product.price}
            </h6>
            <span className="delivery-pill">Fast Delivery</span>
          </div>

          {product.stock != null && (
            <div className="mt-2 mb-2">
              {product.stock === 0 ? (
                <span className="badge bg-danger">Out of Stock</span>
              ) : product.stock <= (product.minimumStockThreshold || 5) ? (
                <span className="badge bg-warning text-dark">
                  Low Stock: {product.stock} left
                </span>
              ) : (
                <span className="badge bg-success">In Stock</span>
              )}
            </div>
          )}

          {userRole !== "admin" && (
            <>
              <button
                className="btn btn-success mt-2 w-100 product-btn"
                disabled={product.stock != null && product.stock === 0}
                onClick={(e) => {
                  e.stopPropagation();

                  if (product.stock != null && product.stock === 0) {
                    showToast("Sorry, this product is out of stock!", "warning");
                    return;
                  }

                  const cart = JSON.parse(localStorage.getItem("cart")) || [];
                  const existingItem = cart.find(
                    (item) => item._id === product._id
                  );

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
                  window.dispatchEvent(new Event("cartUpdated"));
                  showToast(`${product.name} added to cart!`, "success");
                }}
                style={{
                  opacity: (product.stock != null && product.stock === 0) ? 0.5 : 1,
                  cursor: (product.stock != null && product.stock === 0) ? "not-allowed" : "pointer",
                }}
              >
                {(product.stock != null && product.stock === 0) ? "Out of Stock" : "🛒 Add to Cart"}
              </button>

              {isUser && (
                <button
                  className={`btn mt-2 w-100 ${wishlistIds.has(product._id) ? "btn-outline-danger" : "btn-outline-dark"}`}
                  disabled={wishlistPendingIds.has(product._id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product);
                  }}
                >
                  {wishlistPendingIds.has(product._id)
                    ? "Updating..."
                    : wishlistIds.has(product._id)
                      ? "❤️ Remove from Wishlist"
                      : "🤍 Add to Wishlist"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  /* ===============================
     LOADING
     =============================== */
  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="container py-5 text-center">
        <h2>No Products Available</h2>
      </div>
    );
  }

  /* ===============================
     UI
     =============================== */
  return (
    <>
      <div className="container py-4">
        <Toast
          message={toast.message}
          type={toast.type}
          show={toast.show}
          onClose={() => setToast({ ...toast, show: false })}
        />

        <h1 className="text-center mb-5 fw-bold">
          🛍️ {selectedCategory ? `${selectedCategory} Products` : "Available Products"}
        </h1>

        <div className="product-search-wrap mb-4">
          <div className="input-group product-search-group">
            <span className="input-group-text product-search-icon">🔎</span>
            <input
              type="text"
              className="form-control product-search-input"
              placeholder="Search products by name, description, or price"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search products"
            />
            {searchQuery && (
              <button
                type="button"
                className="btn product-search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                title="Clear search"
              >
                Clear
              </button>
            )}
          </div>
          <p className="product-search-meta mb-0 mt-2">
            Showing {filteredProducts.length} of {products.length} products
            {selectedCategory ? ` in ${selectedCategory}` : ""}
          </p>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-4">
            <h5 className="mb-1">No matching products found</h5>
            <p className="text-muted mb-0">Try a different keyword.</p>
          </div>
        ) : (
          <div className="row g-4 product-grid-row mb-2">
            {filteredProducts.map(renderProductCard)}
          </div>
        )}
      </div>
    </>
  );
}

export default Product;
