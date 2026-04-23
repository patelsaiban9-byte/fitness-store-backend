import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  /* ===============================
     FETCH ALL ORDERS
     =============================== */
  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/api/orders`);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  useEffect(() => {
    localStorage.setItem("adminOrdersLastSeenAt", String(Date.now()));
    window.dispatchEvent(new Event("ordersUpdated"));
    fetchOrders();
  }, []);

  // Filter orders based on search query (case-insensitive)
  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase();
    return (
      order._id.toLowerCase().includes(query) ||
      order.customer?.name?.toLowerCase().includes(query) ||
      order.customer?.phone?.toLowerCase().includes(query) ||
      order.orderStatus?.toLowerCase().includes(query) ||
      order.paymentStatus?.toLowerCase().includes(query) ||
      order.paymentMethod?.toLowerCase().includes(query) ||
      order.totalAmount?.toString().includes(query)
    );
  });

  // Helper function to get date label (Today, Yesterday, or date)
  const getDateLabel = (dateString) => {
    const orderDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time to compare only dates
    orderDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);

    if (orderDate.getTime() === today.getTime()) {
      return "Today";
    } else if (orderDate.getTime() === yesterday.getTime()) {
      return "Yesterday";
    } else {
      return orderDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  // Group orders by date
  const groupedOrders = filteredOrders.reduce((groups, order) => {
    const dateLabel = getDateLabel(order.createdAt);
    if (!groups[dateLabel]) {
      groups[dateLabel] = [];
    }
    groups[dateLabel].push(order);
    return groups;
  }, {});

  // Sort date groups (Today first, Yesterday second, then older dates)
  const sortedDateGroups = Object.keys(groupedOrders).sort((a, b) => {
    if (a === "Today") return -1;
    if (b === "Today") return 1;
    if (a === "Yesterday") return -1;
    if (b === "Yesterday") return 1;
    // For other dates, sort by most recent first
    const dateA = new Date(groupedOrders[a][0].createdAt);
    const dateB = new Date(groupedOrders[b][0].createdAt);
    return dateB - dateA;
  });

  return (
    <>
      <style>
        {`
          .order-card {
            transition: all 0.3s ease;
            cursor: pointer;
            border: 1px solid #e9ecef !important;
          }
          .order-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.15) !important;
          }
          .date-section {
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
        `}
      </style>

      <div className="container-fluid py-5" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
        <div className="container">
          <div className="row mb-4">
            <div className="col-12">
              <h1 className="display-5 fw-bold">
                <span style={{ fontSize: "2.5rem" }}>📦</span> Order Management
              </h1>
              <p className="text-muted fs-6">Click on any order card to view full details</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <div className="input-group">
                    <span className="input-group-text bg-primary text-white">
                      🔍
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by Order ID, Customer, Status, Payment, or Amount..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoComplete="off"
                    />
                    {searchQuery && (
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => setSearchQuery("")}
                      >
                        ✕ Clear
                      </button>
                    )}
                  </div>
                </div>
                <div className="col-md-4 mt-2 mt-md-0">
                  <div className="text-muted">
                    Showing {filteredOrders.length} of {orders.length} orders
                  </div>
                </div>
              </div>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="alert alert-info text-center py-5">
              <h5>
                {searchQuery
                  ? `No orders found matching "${searchQuery}"`
                  : "No orders found."}
              </h5>
            </div>
          ) : (
            <>
              {sortedDateGroups.map((dateLabel) => (
                <div key={dateLabel} className="mb-5">
                  {/* Date Header */}
                  <div className="d-flex align-items-center mb-3 date-section">
                    <h3 className="fw-bold mb-0">
                      <span className="text-primary">
                        {dateLabel === "Today" ? "📅 " : dateLabel === "Yesterday" ? "📆 " : "🗓️ "}
                      </span>
                      {dateLabel}
                    </h3>
                    <span className="badge bg-primary ms-3">
                      {groupedOrders[dateLabel].length} order{groupedOrders[dateLabel].length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Orders for this date */}
                  <div className="row g-4">
                    {groupedOrders[dateLabel].map((order) => (
                      <div key={order._id} className="col-12 col-md-6 col-lg-4">
                        <div 
                          className="card h-100 order-card shadow-sm border-0" 
                          onClick={() => navigate(`/adminorder/${order._id}`)}
                          style={{ borderTop: "4px solid #2563eb" }}
                        >
                          {/* CARD HEADER */}
                          <div className="card-header bg-light border-0 py-3">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <small className="text-muted">ORDER ID</small>
                                <div className="fw-bold text-truncate" style={{ maxWidth: "200px" }}>
                                  {order._id}
                                </div>
                              </div>
                              <span className={`badge ${
                                order.orderStatus === "DELIVERED" ? "bg-success" :
                                order.orderStatus === "CANCELLED" ? "bg-danger" :
                                order.orderStatus === "SHIPPED" || order.orderStatus === "OUT_FOR_DELIVERY" ? "bg-info" :
                                "bg-warning"
                              }`}>
                                {order.orderStatus || "PLACED"}
                              </span>
                            </div>
                          </div>

                          {/* CARD BODY */}
                          <div className="card-body">
                            {/* CUSTOMER INFO */}
                            <div className="mb-3">
                              <h6 className="text-muted mb-2">👤 Customer</h6>
                              <div className="fw-bold">{order.customer?.name}</div>
                              <div className="text-muted small">{order.customer?.phone}</div>
                            </div>

                            {/* ORDER INFO */}
                            <div className="mb-3">
                              <h6 className="text-muted mb-2">📅 Order Date</h6>
                              <div>{new Date(order.createdAt).toLocaleDateString()}</div>
                            </div>

                            {/* ITEMS COUNT */}
                            <div className="mb-3">
                              <h6 className="text-muted mb-2">🛍️ Items</h6>
                              <div>{order.items?.length || 0} item(s)</div>
                            </div>

                            {/* PAYMENT */}
                            <div className="mb-3">
                              <h6 className="text-muted mb-2">💳 Payment</h6>
                              <div>
                                <span className="badge bg-secondary me-2">
                                  {order.paymentMethod || "COD"}
                                </span>
                                <span className={`badge ${
                                  order.paymentStatus === "PAID" ? "bg-success" : 
                                  order.paymentStatus === "FAILED" ? "bg-danger" : 
                                  "bg-warning"
                                }`}>
                                  {order.paymentStatus || "PENDING"}
                                </span>
                              </div>
                            </div>

                            {/* TOTAL */}
                            <div className="border-top pt-3 mt-3">
                              <div className="d-flex justify-content-between align-items-center">
                                <h6 className="text-muted mb-0">Total Amount</h6>
                                <h5 className="fw-bold text-success mb-0">
                                  ₹{Number(order.totalAmount).toFixed(2)}
                                </h5>
                              </div>
                            </div>
                          </div>

                          {/* CARD FOOTER */}
                          <div className="card-footer bg-light border-top py-2 text-center">
                            <small className="text-muted">Click to view full details →</small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default AdminOrders;
