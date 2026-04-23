import React, { useEffect, useState } from "react";
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

/*
  Cart Page
  ---------
  - Read cart data from localStorage
  - Increase / decrease quantity
  - Remove product
  - Show total price
  - Redirect to OrderForm on checkout
*/

function Cart() {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
  };

  // Load cart from localStorage and fetch product data on page load
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
        setCart(storedCart);

        // Fetch current product data for stock validation
        if (storedCart.length > 0) {
          const productIds = storedCart.map(item => item._id);
          const res = await fetch(`${API_URL}/api/products`);
          const allProducts = await res.json();
          
          // Create a map of product ID to product data
          const productMap = {};
          allProducts.forEach(p => {
            productMap[p._id] = p;
          });
          setProducts(productMap);

          // Validate cart items against current stock (only if stock is being tracked)
          const validatedCart = storedCart.map(item => {
            const currentProduct = productMap[item._id];
            // Only validate if product exists and stock is actively managed (not undefined/null)
            if (currentProduct && currentProduct.stock != null && currentProduct.stock > 0) {
              if (item.qty > currentProduct.stock) {
                return { ...item, qty: currentProduct.stock };
              }
            }
            return item;
          }).filter(item => {
            const currentProduct = productMap[item._id];
            // Only remove if stock is explicitly 0 (not undefined/null)
            if (!currentProduct) return false;
            if (currentProduct.stock != null && currentProduct.stock === 0) return false;
            return true;
          });

          // Update cart if items were adjusted
          if (JSON.stringify(validatedCart) !== JSON.stringify(storedCart)) {
            updateCart(validatedCart);
            showToast("Some items in your cart were adjusted based on current stock availability.", "warning");
          }
        }
      } catch (err) {
        console.error("Error fetching product data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, []);

  // Update localStorage + state together
  const updateCart = (updatedCart) => {
    setCart(updatedCart);
    localStorage.setItem(
      "cart",
      JSON.stringify(updatedCart)
    );
    // Dispatch custom event to notify navbar (same-tab updates)
    window.dispatchEvent(new Event("cartUpdated"));
  };

  // Increase quantity
  const increaseQty = (id) => {
    const item = cart.find(item => item._id === id);
    const currentProduct = products[id];
    
    // Only enforce stock limit if stock is actively managed (not undefined/null and > 0)
    if (currentProduct && currentProduct.stock != null && currentProduct.stock > 0) {
      if (item.qty >= currentProduct.stock) {
        showToast(`Sorry, only ${currentProduct.stock} units available in stock.`, "warning");
        return;
      }
    }

    const updatedCart = cart.map((item) =>
      item._id === id
        ? { ...item, qty: item.qty + 1 }
        : item
    );
    updateCart(updatedCart);
  };

  // Decrease quantity
  const decreaseQty = (id) => {
    const updatedCart = cart
      .map((item) =>
        item._id === id
          ? { ...item, qty: item.qty - 1 }
          : item
      )
      .filter((item) => item.qty > 0);

    updateCart(updatedCart);
  };

  // Remove item completely
  const removeItem = (id) => {
    const updatedCart = cart.filter(
      (item) => item._id !== id
    );
    updateCart(updatedCart);
  };

  // Calculate total price
  const totalPrice = cart.reduce(
    (total, item) =>
      total + item.price * item.qty,
    0
  );

  // ✅ NEW: Checkout → OrderForm (cart mode)
  const handleCheckout = () => {
    navigate("/checkout");
  };

  // If cart empty
  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container py-5 text-center">
        <h2>Your Cart is Empty 🛒</h2>
        <button
          className="btn btn-primary mt-3"
          onClick={() => navigate("/products")}
        >
          Go to Products
        </button>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <h2 className="mb-4 fw-bold">🛒 My Cart</h2>

      {cart.map((item) => (
        <div
          key={item._id}
          className="card mb-3 shadow-sm"
        >
          <div className="card-body d-flex justify-content-between align-items-center flex-wrap">
            <div className="d-flex align-items-center">
              <img
                src={item.image || (item.images && item.images[0]) || item.imageUrl}
                alt={item.name}
                style={{ width: 80, height: 80, objectFit: "cover" }}
                className="rounded"
              />

              <div className="ms-3">
                <h5 className="mb-0 d-flex align-items-center gap-3">
                  <span className="fw-bold">{item.name}</span>

                  {/* Price then Quantity, centered together */}
                  <div className="ms-3 d-flex align-items-center justify-content-center gap-3 text-center">
                    <span className="text-muted">Price: ₹{item.price}</span>
                    <small className="text-muted">Qty: {item.qty}</small>
                  </div>
                </h5>
                {/* Stock warning - only show if stock is being tracked */}
                {products[item._id] && products[item._id].stock != null && (
                  <div className="mt-2">
                    {products[item._id].stock === 0 ? (
                      <span className="badge bg-danger">Out of Stock</span>
                    ) : products[item._id].stock <= (products[item._id].minimumStockThreshold || 5) ? (
                      <span className="badge bg-warning text-dark">
                        Only {products[item._id].stock} left
                      </span>
                    ) : item.qty >= products[item._id].stock ? (
                      <span className="badge bg-warning text-dark">
                        Max stock reached
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            <div className="d-flex gap-2 mt-3 mt-md-0">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => decreaseQty(item._id)}
              >
                −
              </button>

              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => increaseQty(item._id)}
              >
                +
              </button>

              <button
                className="btn btn-sm btn-danger"
                onClick={() => removeItem(item._id)}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ))}

      <hr />

      <h4 className="fw-bold">
        Total: ₹{totalPrice}
      </h4>

      {/* ✅ UPDATED BUTTON */}
      <button
        className="btn btn-success mt-3"
        onClick={handleCheckout}
      >
        Proceed to Checkout
      </button>
    </div>
  );
}

export default Cart;
