import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "../assets/logo";

function Navbar({ isLoggedIn, userRole, setIsLoggedIn, setUserRole }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const isAdmin = userRole === "admin";
  const isUser = isLoggedIn && !isAdmin;
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // ✅ Cart count state
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [myOrdersCount, setMyOrdersCount] = useState(0);
  const [adminOrdersCount, setAdminOrdersCount] = useState(0);
  const [adminFeedbackCount, setAdminFeedbackCount] = useState(0);
  const [pendingReturnCount, setPendingReturnCount] = useState(0);

  /* ===============================
     READ CART COUNT FROM localStorage
     =============================== */
  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const totalQty = cart.reduce(
        (sum, item) => sum + item.qty,
        0
      );
      setCartCount(totalQty);
    };

    updateCartCount();

    // Listen for cart changes (other tabs / updates)
    window.addEventListener("storage", updateCartCount);
    
    // Listen for custom cart update event (same tab updates)
    window.addEventListener("cartUpdated", updateCartCount);

    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("cartUpdated", updateCartCount);
    };
  }, []);

  useEffect(() => {
    if (!isUser) {
      setWishlistCount(0);
      return;
    }

    const fetchWishlistCount = async () => {
      try {
        const token = localStorage.getItem("token") || "";
        if (!token) {
          setWishlistCount(0);
          return;
        }

        const res = await fetch(`${API_URL}/api/wishlist/count`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          setWishlistCount(0);
          return;
        }

        const data = await res.json();
        setWishlistCount(Number(data?.count) || 0);
      } catch {
        setWishlistCount(0);
      }
    };

    const handleWishlistUpdated = (event) => {
      const value = Number(event?.detail?.count);
      if (!Number.isNaN(value) && value >= 0) {
        setWishlistCount(value);
      } else {
        fetchWishlistCount();
      }
    };

    fetchWishlistCount();
    window.addEventListener("wishlistUpdated", handleWishlistUpdated);
    window.addEventListener("storage", fetchWishlistCount);

    return () => {
      window.removeEventListener("wishlistUpdated", handleWishlistUpdated);
      window.removeEventListener("storage", fetchWishlistCount);
    };
  }, [API_URL, isUser]);

  useEffect(() => {
    if (!isUser || !isLoggedIn) {
      setMyOrdersCount(0);
      return;
    }

    const fetchMyOrdersCount = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          setMyOrdersCount(0);
          return;
        }

        const seenKey = `myOrdersLastSeenAt_${userId}`;
        let lastSeenAt = Number(localStorage.getItem(seenKey));

        if (!Number.isFinite(lastSeenAt)) {
          lastSeenAt = Date.now();
          localStorage.setItem(seenKey, String(lastSeenAt));
        }

        const res = await fetch(`${API_URL}/api/orders/my/user/${userId}`);
        if (!res.ok) {
          setMyOrdersCount(0);
          return;
        }

        const data = await res.json();
        const newOrdersCount = Array.isArray(data)
          ? data.filter((order) => {
              const createdAtMs = new Date(order?.createdAt).getTime();
              return Number.isFinite(createdAtMs) && createdAtMs > lastSeenAt;
            }).length
          : 0;

        setMyOrdersCount(newOrdersCount);
      } catch {
        setMyOrdersCount(0);
      }
    };

    fetchMyOrdersCount();

    const intervalId = window.setInterval(fetchMyOrdersCount, 60000);
    window.addEventListener("ordersUpdated", fetchMyOrdersCount);
    window.addEventListener("storage", fetchMyOrdersCount);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("ordersUpdated", fetchMyOrdersCount);
      window.removeEventListener("storage", fetchMyOrdersCount);
    };
  }, [API_URL, isLoggedIn, isUser]);

  useEffect(() => {
    if (!isAdmin || !isLoggedIn) {
      setAdminOrdersCount(0);
      return;
    }

    const fetchAdminOrdersCount = async () => {
      try {
        const seenKey = "adminOrdersLastSeenAt";
        let lastSeenAt = Number(localStorage.getItem(seenKey));

        if (!Number.isFinite(lastSeenAt)) {
          lastSeenAt = Date.now();
          localStorage.setItem(seenKey, String(lastSeenAt));
        }

        const res = await fetch(`${API_URL}/api/orders`);
        if (!res.ok) {
          setAdminOrdersCount(0);
          return;
        }

        const data = await res.json();
        const newOrdersCount = Array.isArray(data)
          ? data.filter((order) => {
              const createdAtMs = new Date(order?.createdAt).getTime();
              return Number.isFinite(createdAtMs) && createdAtMs > lastSeenAt;
            }).length
          : 0;

        setAdminOrdersCount(newOrdersCount);
      } catch {
        setAdminOrdersCount(0);
      }
    };

    fetchAdminOrdersCount();

    const intervalId = window.setInterval(fetchAdminOrdersCount, 60000);
    window.addEventListener("ordersUpdated", fetchAdminOrdersCount);
    window.addEventListener("storage", fetchAdminOrdersCount);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("ordersUpdated", fetchAdminOrdersCount);
      window.removeEventListener("storage", fetchAdminOrdersCount);
    };
  }, [API_URL, isAdmin, isLoggedIn]);

  useEffect(() => {
    if (!isAdmin || !isLoggedIn) {
      setAdminFeedbackCount(0);
      return;
    }

    const fetchAdminFeedbackCount = async () => {
      try {
        const seenKey = "adminFeedbackLastSeenAt";
        let lastSeenAt = Number(localStorage.getItem(seenKey));

        if (!Number.isFinite(lastSeenAt)) {
          lastSeenAt = Date.now();
          localStorage.setItem(seenKey, String(lastSeenAt));
        }

        const token = localStorage.getItem("token") || "";
        if (!token) {
          setAdminFeedbackCount(0);
          return;
        }

        const res = await fetch(`${API_URL}/api/feedback/admin/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          setAdminFeedbackCount(0);
          return;
        }

        const data = await res.json();
        const newFeedbackCount = Array.isArray(data)
          ? data.filter((item) => {
              const createdAtMs = new Date(item?.createdAt).getTime();
              return Number.isFinite(createdAtMs) && createdAtMs > lastSeenAt;
            }).length
          : 0;

        setAdminFeedbackCount(newFeedbackCount);
      } catch {
        setAdminFeedbackCount(0);
      }
    };

    fetchAdminFeedbackCount();

    const intervalId = window.setInterval(fetchAdminFeedbackCount, 60000);
    window.addEventListener("feedbackUpdated", fetchAdminFeedbackCount);
    window.addEventListener("storage", fetchAdminFeedbackCount);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("feedbackUpdated", fetchAdminFeedbackCount);
      window.removeEventListener("storage", fetchAdminFeedbackCount);
    };
  }, [API_URL, isAdmin, isLoggedIn]);

  useEffect(() => {
    if (!isAdmin || !isLoggedIn) {
      setPendingReturnCount(0);
      return;
    }

    const fetchPendingReturnsCount = async () => {
      try {
        const res = await fetch(`${API_URL}/api/returns/admin/all`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });

        const data = await res.json();
        const pendingCount = Array.isArray(data)
          ? data.filter((item) => item?.status === "PENDING").length
          : 0;

        setPendingReturnCount(pendingCount);
      } catch {
        setPendingReturnCount(0);
      }
    };

    const handleReturnsUpdated = (event) => {
      const value = Number(event?.detail?.pendingCount);
      if (!Number.isNaN(value) && value >= 0) {
        setPendingReturnCount(value);
      } else {
        fetchPendingReturnsCount();
      }
    };

    fetchPendingReturnsCount();

    const intervalId = window.setInterval(fetchPendingReturnsCount, 60000);
    window.addEventListener("returnsUpdated", handleReturnsUpdated);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("returnsUpdated", handleReturnsUpdated);
    };
  }, [API_URL, isAdmin, isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("phone");
    localStorage.removeItem("userId");
    localStorage.removeItem("name");
    // 🛒 Keep cart data - only clear on order placement
    setIsLoggedIn(false);
    setUserRole(null);
    setMyOrdersCount(0);
    setAdminOrdersCount(0);
    setAdminFeedbackCount(0);
    setPendingReturnCount(0);
    navigate(isAdmin ? "/admin/login" : "/login");
    setIsOpen(false);
  };

  const toggleNavbar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-lg sticky-top">
      <div className="container-fluid px-3 px-md-4">
        {/* BRAND */}
        <Link
          className="navbar-brand fw-bolder fs-5 d-flex align-items-center gap-2"
          to="/"
          onClick={() => setIsOpen(false)}
          style={{ textDecoration: 'none', color: 'white', transition: 'all 0.3s ease' }}
        >
          <Logo size={40} />
          <span className="d-none d-sm-inline">Health & Fitness Store</span>
          <span className="d-sm-none fs-6">FitHub</span>
        </Link>

        {/* TOGGLER */}
        <button
          className="navbar-toggler"
          type="button"
          onClick={toggleNavbar}
          aria-expanded={isOpen ? "true" : "false"}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* LINKS */}
        <div className={`collapse navbar-collapse ${isOpen ? "show" : ""}`}>
          <ul className="navbar-nav ms-auto align-items-center">
            {/* PUBLIC LINKS */}
            <li className="nav-item">
              <Link
                className="nav-link text-white fw-semibold mx-1"
                to="/"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
            </li>

            <li className="nav-item">
              <Link
                className="nav-link text-white fw-semibold mx-1"
                to="/products"
                onClick={() => setIsOpen(false)}
              >
                Products
              </Link>
            </li>

            <li className="nav-item">
              <Link
                className="nav-link text-white fw-semibold mx-1"
                to="/about"
                onClick={() => setIsOpen(false)}
              >
                About Us
              </Link>
            </li>

            {/* 🛒 CART (NON-ADMIN) */}
            {!isAdmin && (
              <li className="nav-item position-relative">
                <Link
                  className="nav-link text-white fw-semibold mx-1"
                  to="/cart"
                  onClick={() => setIsOpen(false)}
                >
                  🛒 Cart
                  {cartCount > 0 && (
                    <span
                      className="badge bg-warning text-dark ms-1"
                      style={{ fontSize: "0.7rem" }}
                    >
                      {cartCount}
                    </span>
                  )}
                </Link>
              </li>
            )}

            {isUser && (
              <li className="nav-item position-relative">
                <Link
                  className="nav-link text-white fw-semibold mx-1"
                  to="/wishlist"
                  onClick={() => setIsOpen(false)}
                >
                  ❤️ Wishlist ({wishlistCount})
                </Link>
              </li>
            )}

            {/* USER LINKS */}
            {isUser && (
              <li className="nav-item position-relative">
                <Link
                  className="nav-link text-white fw-semibold mx-1"
                  to="/my-orders"
                  onClick={() => setIsOpen(false)}
                >
                  My Orders
                  {myOrdersCount > 0 && (
                    <span
                      className="badge bg-warning text-dark ms-1"
                      style={{ fontSize: "0.7rem" }}
                    >
                      {myOrdersCount}
                    </span>
                  )}
                </Link>
              </li>
            )}

            {isUser && (
              <li className="nav-item">
                <Link
                  className="nav-link text-white fw-semibold mx-1"
                  to="/feedback"
                  onClick={() => setIsOpen(false)}
                >
                  Feedback
                </Link>
              </li>
            )}

            {/* ADMIN LINKS */}
            {isAdmin && (
              <>
                <li className="nav-item">
                  <Link
                    className="nav-link text-warning fw-bolder mx-1"
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                  >
                    Admin
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    className="nav-link text-warning fw-bolder mx-1"
                    to="/admin/users"
                    onClick={() => setIsOpen(false)}
                  >
                    Users
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    className="nav-link text-warning fw-bolder mx-1"
                    to="/admin/orders"
                    onClick={() => setIsOpen(false)}
                  >
                    Orders
                    {adminOrdersCount > 0 && (
                      <span
                        className="badge bg-danger text-white ms-1"
                        style={{ fontSize: "0.7rem" }}
                      >
                        {adminOrdersCount}
                      </span>
                    )}
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    className="nav-link text-warning fw-bolder mx-1"
                    to="/admin/reports"
                    onClick={() => setIsOpen(false)}
                  >
                    Sales Reports
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    className="nav-link text-warning fw-bolder mx-1"
                    to="/admin/returns"
                    onClick={() => setIsOpen(false)}
                  >
                    Returns
                    {pendingReturnCount > 0 && (
                      <span
                        className="badge bg-danger text-white ms-1"
                        style={{ fontSize: "0.7rem" }}
                      >
                        {pendingReturnCount}
                      </span>
                    )}
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    className="nav-link text-warning fw-bolder mx-1"
                    to="/admin/feedback"
                    onClick={() => setIsOpen(false)}
                  >
                    Feedback
                    {adminFeedbackCount > 0 && (
                      <span
                        className="badge bg-danger text-white ms-1"
                        style={{ fontSize: "0.7rem" }}
                      >
                        {adminFeedbackCount}
                      </span>
                    )}
                  </Link>
                </li>
              </>
            )}

            {/* AUTH ACTIONS */}
            {isLoggedIn ? (
              <li className="nav-item">
                <button
                  className="btn btn-danger fw-bold ms-lg-2 px-3"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <Link
                    className="btn btn-warning fw-bold text-dark ms-lg-2 px-3"
                    to="/login"
                    onClick={() => setIsOpen(false)}
                  >
                    User Login
                  </Link>
                </li>
                <li className="nav-item mt-2 mt-lg-0">
                  <Link
                    className="btn btn-outline-light fw-bold ms-lg-2 px-3"
                    to="/admin/login"
                    onClick={() => setIsOpen(false)}
                  >
                    Admin Login
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
