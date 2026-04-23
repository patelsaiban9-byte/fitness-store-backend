import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { useState, useEffect } from "react";

// Components
import Navbar from "./components/navbar";
import Footer from "./components/Footer";

// Pages
import Login from "./pages/login";
import Register from "./pages/register";
import ForgotPassword from "./pages/forgotPassword";
import Home from "./pages/home";
import Products from "./pages/product";
import Cart from "./pages/cart";
import OrderForm from "./pages/orderform";
import About from "./pages/about";
import ProductDetail from "./pages/ProductDetail";
import Feedback from "./pages/Feedback";
import Wishlist from "./pages/Wishlist";


// Admin pages
import Admin from "./pages/admin";
import AdminOrders from "./pages/adminorder";
import OrderDetail from "./pages/OrderDetail";
import SalesReports from "./pages/SalesReports";
import AdminReturns from "./pages/AdminReturns";
import AdminFeedback from "./pages/AdminFeedback";
import AdminUsers from "./pages/AdminUsers";

// ✅ NEW PAGE
import MyOrders from "./pages/MyOrders";

/* ===============================
   ROUTE PROTECTION
   =============================== */
function getRedirectPath(location) {
  return `${location.pathname}${location.search}${location.hash}`;
}

function PublicOnlyRoute({ isLoggedIn, userRole, children }) {
  if (!isLoggedIn) return children;
  return <Navigate to={userRole === "admin" ? "/admin" : "/"} replace />;
}

function UserRoute({ isLoggedIn, userRole, children }) {
  const location = useLocation();

  if (!isLoggedIn) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: getRedirectPath(location) }}
      />
    );
  }

  if (userRole !== "user") {
    return <Navigate to={userRole === "admin" ? "/admin" : "/"} replace />;
  }

  return children;
}

function AdminRoute({ isLoggedIn, userRole, children }) {
  const location = useLocation();

  if (!isLoggedIn) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: getRedirectPath(location) }}
      />
    );
  }

  if (userRole !== "admin") return <Navigate to="/" replace />;
  return children;
}

/* ===============================
   LAYOUT (OLD LOGIC)
   =============================== */
function Layout({
  children,
  isLoggedIn,
  userRole,
  setIsLoggedIn,
  setUserRole,
}) {
  const location = useLocation();
  const authPaths = ["/login", "/admin/login", "/register", "/forgot-password"];
  const hideNavbar = authPaths.includes(location.pathname);
  const hideFooter = authPaths.includes(location.pathname);

  return (
    <div className="d-flex flex-column min-vh-100">
      {!hideNavbar && (
        <Navbar
          isLoggedIn={isLoggedIn}
          userRole={userRole}
          setIsLoggedIn={setIsLoggedIn}
          setUserRole={setUserRole}
        />
      )}
      <main className="container mt-4 flex-grow-1">{children}</main>
      {!hideFooter && <Footer isLoggedIn={isLoggedIn} userRole={userRole} />}
    </div>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  /* ===============================
     AUTH CHECK (OLD LOGIC)
     =============================== */
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      if (!token || !role) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const currentTime = Date.now() / 1000;

        if (payload.exp && payload.exp < currentTime) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          localStorage.removeItem("email");
          localStorage.removeItem("phone");
          setIsLoggedIn(false);
          setUserRole(null);
        } else {
          setIsLoggedIn(true);
          setUserRole(role);
        }
      } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("email");
        localStorage.removeItem("phone");
        setIsLoggedIn(false);
        setUserRole(null);
      }

      setIsCheckingAuth(false);
    };

    checkAuth();
  }, []);

  /* ===============================
     LOADING SCREEN
     =============================== */
  if (isCheckingAuth) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-3">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Layout
        isLoggedIn={isLoggedIn}
        userRole={userRole}
        setIsLoggedIn={setIsLoggedIn}
        setUserRole={setUserRole}
      >
        <Routes>
          {/* Login / Register */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute isLoggedIn={isLoggedIn} userRole={userRole}>
                <Login
                  mode="user"
                  setIsLoggedIn={setIsLoggedIn}
                  setUserRole={setUserRole}
                />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/admin/login"
            element={
              <PublicOnlyRoute isLoggedIn={isLoggedIn} userRole={userRole}>
                <Login
                  mode="admin"
                  setIsLoggedIn={setIsLoggedIn}
                  setUserRole={setUserRole}
                />
              </PublicOnlyRoute>
            }
          />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/category/:category" element={<Products />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/about" element={<About />} />
          <Route path="/product/:id" element={<ProductDetail />} />

          {/* My Orders (USER) */}
          <Route
            path="/my-orders"
            element={
              <UserRoute isLoggedIn={isLoggedIn} userRole={userRole}>
                <MyOrders />
              </UserRoute>
            }
          />

          {/* User Protected Routes */}
          <Route
            path="/checkout"
            element={
              <UserRoute isLoggedIn={isLoggedIn} userRole={userRole}>
                <OrderForm />
              </UserRoute>
            }
          />

          <Route
            path="/buynow"
            element={
              <UserRoute isLoggedIn={isLoggedIn} userRole={userRole}>
                <OrderForm />
              </UserRoute>
            }
          />

          <Route
            path="/order/:id"
            element={
              <UserRoute isLoggedIn={isLoggedIn} userRole={userRole}>
                <OrderForm />
              </UserRoute>
            }
          />

          <Route
            path="/feedback"
            element={
              <UserRoute isLoggedIn={isLoggedIn} userRole={userRole}>
                <Feedback />
              </UserRoute>
            }
          />

          <Route
            path="/wishlist"
            element={
              <UserRoute isLoggedIn={isLoggedIn} userRole={userRole}>
                <Wishlist />
              </UserRoute>
            }
          />

          {/* Admin Dashboard */}
          <Route
            path="/admin"
            element={
              <AdminRoute
                isLoggedIn={isLoggedIn}
                userRole={userRole}
              >
                <Admin />
              </AdminRoute>
            }
          />

          {/* Admin Orders */}
          <Route
            path="/admin/orders"
            element={
              <AdminRoute
                isLoggedIn={isLoggedIn}
                userRole={userRole}
              >
                <AdminOrders />
              </AdminRoute>
            }
          />

          {/* Admin Order List (alternative path) */}
          <Route
            path="/adminorder"
            element={
              <AdminRoute
                isLoggedIn={isLoggedIn}
                userRole={userRole}
              >
                <AdminOrders />
              </AdminRoute>
            }
          />

          {/* Admin Order Detail */}
          <Route
            path="/adminorder/:id"
            element={
              <AdminRoute
                isLoggedIn={isLoggedIn}
                userRole={userRole}
              >
                <OrderDetail />
              </AdminRoute>
            }
          />

          {/* Admin Reports */}
          <Route
            path="/admin/reports"
            element={
              <AdminRoute
                isLoggedIn={isLoggedIn}
                userRole={userRole}
              >
                <SalesReports />
              </AdminRoute>
            }
          />

          {/* Admin Returns */}
          <Route
            path="/admin/returns"
            element={
              <AdminRoute
                isLoggedIn={isLoggedIn}
                userRole={userRole}
              >
                <AdminReturns />
              </AdminRoute>
            }
          />

          {/* Admin Feedback */}
          <Route
            path="/admin/feedback"
            element={
              <AdminRoute
                isLoggedIn={isLoggedIn}
                userRole={userRole}
              >
                <AdminFeedback />
              </AdminRoute>
            }
          />

          {/* Admin User Management */}
          <Route
            path="/admin/users"
            element={
              <AdminRoute
                isLoggedIn={isLoggedIn}
                userRole={userRole}
              >
                <AdminUsers />
              </AdminRoute>
            }
          />

          {/* Fallback */}
          <Route
            path="*"
            element={
              <Navigate
                to={isLoggedIn ? (userRole === "admin" ? "/admin" : "/") : "/"}
                replace
              />
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
