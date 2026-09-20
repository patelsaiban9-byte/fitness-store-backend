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
      style={{ width: "90%", maxWidth: "560px", zIndex: 1050 }}
    >
      {message}
      <button type="button" className="btn-close" onClick={onClose}></button>
    </div>
  );
};

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [returns, setReturns] = useState([]);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [returnReason, setReturnReason] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("info");
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();

  const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

  const displayToast = (message, type = "info") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const getImageUrl = (img) => {
    if (!img) return null;
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    return `${API_URL}/${img.replace(/^\/+/, "")}`;
  };

  const formatPaymentMethod = (method) => {
    if (!method) return "COD";

    const normalized = String(method).trim().toUpperCase();

    if (normalized === "COD") return "COD";
    if (normalized === "UPI") return "UPI";
    if (normalized === "CARD") return "Card";
    if (normalized === "ONLINE" || normalized === "RAZORPAY") return "Razorpay";

    return method;
  };

  const trackingSteps = [
    { key: "PLACED", label: "Placed" },
    { key: "CONFIRMED", label: "Confirmed" },
    { key: "SHIPPED", label: "Shipped" },
    { key: "OUT_FOR_DELIVERY", label: "Out for\nDelivery" },
    { key: "DELIVERED", label: "Delivered" },
  ];

  const getTrackingStepIndex = (status) => {
    const safeStatus = status || "PLACED";
    return trackingSteps.findIndex((step) => step.key === safeStatus);
  };

  const formatDateRange = (startDate) => {
    if (!startDate) return "Not available";

    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 2);

    const format = (date) =>
      new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);

    return `${format(start)}–${format(end)}`;
  };

  const getEstimatedDelivery = (order) => {
    if (!order?.createdAt) return "Not available";
    const baseDate = new Date(order.createdAt);
    baseDate.setDate(baseDate.getDate() + 3);
    return formatDateRange(baseDate);
  };

  const getTrackingEvents = (order) => {
    if (Array.isArray(order?.trackingEvents) && order.trackingEvents.length > 0) {
      return order.trackingEvents.map((event) => ({
        status: event.status,
        note: event.note || "Order update",
        createdAt: event.createdAt,
      }));
    }

    const createdAt = order?.createdAt ? new Date(order.createdAt) : new Date();
    const fallbackEvents = [
      { status: "PLACED", note: "Order placed", createdAt: createdAt },
      { status: "CONFIRMED", note: "Order confirmed", createdAt: new Date(createdAt.getTime() + 2 * 60 * 60 * 1000) },
      { status: "SHIPPED", note: "Shipped", createdAt: new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000) },
      { status: "OUT_FOR_DELIVERY", note: "Out for delivery", createdAt: new Date(createdAt.getTime() + 4 * 24 * 60 * 60 * 1000) },
      { status: "DELIVERED", note: "Delivered", createdAt: new Date(createdAt.getTime() + 6 * 24 * 60 * 60 * 1000) },
    ];

    return fallbackEvents.filter((event) => {
      const eventIndex = trackingSteps.findIndex((step) => step.key === event.status);
      const currentIndex = getTrackingStepIndex(order?.orderStatus);
      return eventIndex <= currentIndex || currentIndex === -1;
    });
  };

  const handleImageError = (e) => {
    e.target.src = "https://via.placeholder.com/80?text=No+Image";
  };

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

  // ✅ LOGIN STORES userId
  const userId = localStorage.getItem("userId");

  const fetchMyOrders = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/orders/my/user/${userId}`
      );
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Fetch my orders error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    const seenKey = `myOrdersLastSeenAt_${userId}`;
    localStorage.setItem(seenKey, String(Date.now()));
    window.dispatchEvent(new Event("ordersUpdated"));

    const fetchMyReturns = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/returns/user/${userId}`
        );
        const data = await res.json();
        setReturns(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("❌ Fetch returns error:", err);
        setReturns([]);
      }
    };

    fetchMyOrders();
    fetchMyReturns();
  }, [userId, API_URL, navigate]);

  // Handle return request submission
  const handleReturnRequest = async () => {
    if (!returnReason.trim()) {
      displayToast("Please provide a reason for return", "warning");
      return;
    }

    try {
      setSubmittingReturn(true);
      const res = await fetch(`${API_URL}/api/returns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder._id,
          userId: userId,
          items: selectedOrder.items,
          reason: returnReason,
          refundAmount: selectedOrder.totalAmount,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        displayToast("Return request submitted successfully!", "success");
        setShowReturnModal(false);
        setReturnReason("");
        setSelectedOrder(null);
        
        // Refresh returns
        const returnsRes = await fetch(
          `${API_URL}/api/returns/user/${userId}`
        );
        const returnsData = await returnsRes.json();
        setReturns(Array.isArray(returnsData) ? returnsData : []);
      } else {
        displayToast(data.error || "Failed to submit return request", "danger");
      }
    } catch (err) {
      console.error("❌ Return request error:", err);
      displayToast("Failed to submit return request", "danger");
    } finally {
      setSubmittingReturn(false);
    }
  };

  // Check if order has a return request
  const getReturnStatus = (orderId) => {
    return returns.find(r => r.orderId?._id === orderId);
  };

  const canCancelOrder = (status) => {
    return ["PLACED", "CONFIRMED"].includes(status || "PLACED");
  };

  const getCancelButtonTitle = (status) => {
    if (canCancelOrder(status)) {
      return "Cancel this order";
    }

    if (status === "SHIPPED") {
      return "Order cannot be cancelled after it is shipped";
    }

    if (status === "OUT_FOR_DELIVERY") {
      return "Order cannot be cancelled once it is out for delivery";
    }

    if (status === "DELIVERED") {
      return "Delivered orders cannot be cancelled";
    }

    if (status === "CANCELLED") {
      return "Order is already cancelled";
    }

    if (status === "RETURNED") {
      return "Returned orders cannot be cancelled";
    }

    return "Order cannot be cancelled in the current status";
  };

  const handleCancelOrder = async (order) => {
    if (!canCancelOrder(order.orderStatus)) {
      return;
    }

    if (!window.confirm("Cancel this order?")) {
      return;
    }

    try {
      setCancelling(order._id);
      const res = await fetch(`${API_URL}/api/orders/cancel/${order._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        displayToast(data.error || "Failed to cancel order", "danger");
        return;
      }

      displayToast("Order cancelled successfully", "success");
      await fetchMyOrders();
      window.dispatchEvent(new Event("ordersUpdated"));
    } catch (err) {
      console.error("❌ Cancel order error:", err);
      displayToast("Failed to cancel order", "danger");
    } finally {
      setCancelling(null);
    }
  };

  /* ===============================
     LOADING UI
     =============================== */
  if (loading) {
    return (
      <div className="container py-5 text-center">
        <h4>Loading your orders...</h4>
      </div>
    );
  }

  /* ===============================
     NO ORDERS UI
     =============================== */
  if (orders.length === 0) {
    return (
      <div className="container py-5 text-center">
        <h3>No orders yet 📦</h3>
        <button
          className="btn btn-primary mt-3"
          onClick={() => navigate("/products")}
        >
          Shop Now
        </button>
      </div>
    );
  }

  /* ===============================
     ORDERS UI
     =============================== */
  // Group orders by date
  const groupedOrders = orders.reduce((groups, order) => {
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
    <div className="container py-5">
      <style>
        {`
          .date-section {
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
        `}
      </style>

      <div className="row mb-4">
        <div className="col">
          <h2 className="fw-bold text-primary">📦 My Orders</h2>
          <p className="text-muted">Track and manage all your orders</p>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          {sortedDateGroups.map((dateLabel) => (
            <div key={dateLabel} className="mb-5">
              {/* Date Header */}
              <div className="d-flex align-items-center mb-4 date-section">
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
              {groupedOrders[dateLabel].map((order) => {
                const currentStepIndex = getTrackingStepIndex(order.orderStatus);
                const activeStepIndex = currentStepIndex >= 0 ? currentStepIndex : 0;
                const visibleTrackingEvents = getTrackingEvents(order);

                return (
                <div key={order._id} className="card mb-4 shadow-sm border-0">
                  {/* CARD HEADER */}
                  <div className="card-header bg-light border-bottom">
                    <div className="row align-items-center">
                      <div className="col-md-6">
                        <h6 className="mb-0 fw-bold">
                          Order ID: <span className="text-primary">{order._id.slice(-8).toUpperCase()}</span>
                        </h6>
                        <small className="text-muted">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : "N/A"}
                        </small>
                      </div>
                      <div className="col-md-6 text-md-end">
                        <span
                          className={`badge me-2 ${
                            order.paymentStatus === "PAID"
                              ? "bg-success"
                              : order.paymentStatus === "FAILED"
                              ? "bg-danger"
                              : "bg-warning text-dark"
                          }`}
                        >
                          💳 {order.paymentStatus || "PENDING"}
                        </span>
                        <span className="badge bg-info text-dark">
                          📦 {order.orderStatus || "PLACED"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CARD BODY */}
                  <div className="card-body">
                    {/* ITEMS */}
                    <div className="mb-4">
                      <h6 className="fw-bold mb-3 text-secondary">Order Items</h6>
                      {Array.isArray(order.items) &&
                        order.items.map((item, i) => (
                          <div
                            key={i}
                            className="row align-items-center mb-3 pb-3 border-bottom"
                          >
                            <div className="col-2 col-md-1">
                              {/* 🖼️ PRODUCT IMAGE */}
                              <img
                                src={getImageUrl(item.productId?.image || item.image) || undefined}
                                onError={handleImageError}
                                alt={item.productId?.name || item.name}
                                className="img-fluid rounded"
                                style={{
                                  objectFit: "cover",
                                  aspectRatio: "1",
                                  border: "1px solid #e9ecef",
                                }}
                              />
                            </div>
                            <div className="col-7 col-md-8">
                              <p className="mb-0 fw-500">
                                {item.productId?.name || item.name}
                              </p>
                              <small className="text-muted">
                                Quantity: <strong>{item.qty}</strong>
                              </small>
                            </div>
                            <div className="col-3 text-end">
                              <p className="mb-0 fw-bold text-success">
                                ₹{(item.price * item.qty).toFixed(2)}
                              </p>
                              <small className="text-muted">₹{item.price}/item</small>
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* TOTAL */}
                    <div className="row mb-4 pb-3 border-top border-bottom">
                      <div className="col-6 col-md-8 text-end">
                        <h6 className="fw-bold">Total Amount:</h6>
                      </div>
                      <div className="col-6 col-md-4 text-end">
                        <h6 className="fw-bold text-success">₹{order.totalAmount.toFixed(2)}</h6>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        {trackingSteps.map((step, index) => {
                          const isComplete = index <= activeStepIndex;
                          const isCurrent = index === activeStepIndex;

                          return (
                            <div key={step.key} className="flex-fill text-center" style={{ minWidth: 0 }}>
                              <div className="d-flex justify-content-center align-items-center mb-2">
                                <div
                                  className={`d-flex align-items-center justify-content-center rounded-circle border ${
                                    isComplete ? "bg-success text-white border-success" : "bg-white text-muted border-secondary"
                                  } ${isCurrent ? "shadow-sm" : ""}`}
                                  style={{ width: 22, height: 22, fontSize: "0.7rem", fontWeight: 700 }}
                                >
                                  {isComplete ? "✓" : "○"}
                                </div>
                              </div>
                              <div
                                className={`small text-center ${
                                  isCurrent ? "fw-bold text-success" : isComplete ? "text-success" : "text-muted"
                                }`}
                                style={{ whiteSpace: "pre-line", lineHeight: "1.2" }}
                              >
                                {step.label}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="position-relative mt-2 mb-3">
                        <div className="w-100 bg-light rounded" style={{ height: 6 }}>
                          <div
                            className="bg-success rounded"
                            style={{
                              height: "100%",
                              width: `${((activeStepIndex + 1) / trackingSteps.length) * 100}%`,
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mb-4 p-3 border rounded bg-light-subtle">
                      <div className="fw-bold text-secondary mb-2">🚚 Estimated delivery</div>
                      <div className="text-dark fw-semibold">{getEstimatedDelivery(order)}</div>
                    </div>

                    <div className="mb-4 p-3 border rounded bg-light-subtle">
                      <div className="fw-bold text-secondary mb-2">📍 Delivery Address</div>
                      <div className="text-dark">
                        {order.customer?.name || "Customer"}<br />
                        {order.customer?.address || "Address not available"}<br />
                        {order.customer?.landmark ? `${order.customer.landmark}, ` : ""}
                        {order.customer?.pincode || ""}
                      </div>
                    </div>

                    {/* INVOICE DOWNLOAD & RETURN REQUEST */}
                    <div className="d-flex gap-2 flex-wrap">
                      <button
                        className="btn btn-primary"
                        onClick={async () => {
                          try {
                            setDownloading(order._id);
                            const res = await fetch(
                              `${API_URL}/api/orders/invoice/${order._id}`
                            );
                            if (!res.ok) throw new Error("Failed to download");

                            const blob = await res.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `invoice-${order._id}.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            window.URL.revokeObjectURL(url);
                          } catch (err) {
                            console.error("Invoice download error:", err);
                            alert("Failed to download invoice");
                          } finally {
                            setDownloading(null);
                          }
                        }}
                        disabled={downloading && downloading !== order._id}
                      >
                        {downloading === order._id
                          ? "📥 Downloading..."
                          : "📄 Download Invoice"}
                      </button>

                      <button
                        className="btn btn-outline-info"
                        onClick={() => {
                          setSelectedOrderDetails(order);
                          setShowOrderDetailsModal(true);
                        }}
                      >
                        👁️ View Details
                      </button>

                      {(() => {
                        const status = order.orderStatus || "PLACED";

                        if (status === "PLACED" || status === "CONFIRMED") {
                          return (
                            <button
                              className={`btn ${canCancelOrder(status) ? "btn-outline-danger" : "btn-outline-secondary"}`}
                              onClick={() => handleCancelOrder(order)}
                              disabled={
                                cancelling === order._id ||
                                !canCancelOrder(status)
                              }
                              title={getCancelButtonTitle(status)}
                            >
                              {cancelling === order._id ? "Cancelling..." : "Cancel Order"}
                            </button>
                          );
                        }

                        if (status === "SHIPPED" || status === "OUT_FOR_DELIVERY") {
                          return (
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => {
                                setSelectedOrderDetails(order);
                                setShowOrderDetailsModal(true);
                              }}
                            >
                              📦 Track Package
                            </button>
                          );
                        }

                        if (status === "DELIVERED") {
                          return (
                            <>
                              <button
                                className="btn btn-outline-success"
                                onClick={() => navigate("/feedback")}
                              >
                                ⭐ Rate & Review
                              </button>
                              <button
                                className="btn btn-primary"
                                onClick={() => navigate("/products")}
                              >
                                🛍️ Buy Again
                              </button>
                            </>
                          );
                        }

                        return null;
                      })()}

                      {/* RETURN REQUEST BUTTON */}
                      {order.orderStatus === "DELIVERED" && (() => {
                        const returnRequest = getReturnStatus(order._id);
                        if (returnRequest) {
                          return (
                            <button
                              className={`btn ${
                                returnRequest.status === "APPROVED"
                                  ? "btn-success"
                                  : returnRequest.status === "REJECTED"
                                  ? "btn-danger"
                                  : "btn-warning"
                              }`}
                              disabled
                            >
                              {returnRequest.status === "PENDING" && "⏳ Return Pending"}
                              {returnRequest.status === "APPROVED" && "✅ Return Approved"}
                              {returnRequest.status === "REJECTED" && "❌ Return Rejected"}
                            </button>
                          );
                        }
                        return (
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowReturnModal(true);
                            }}
                          >
                            🔄 Request Return
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ORDER DETAILS MODAL */}
      {showOrderDetailsModal && selectedOrderDetails && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowOrderDetailsModal(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Order Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowOrderDetailsModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <strong>Order ID:</strong>
                    <div className="text-muted">{selectedOrderDetails._id}</div>
                  </div>
                  <div className="col-md-6">
                    <strong>Status:</strong>
                    <div className="text-muted">{selectedOrderDetails.orderStatus || "PLACED"}</div>
                  </div>
                  <div className="col-md-6">
                    <strong>Payment Status:</strong>
                    <div className="text-muted">{selectedOrderDetails.paymentStatus || "PENDING"}</div>
                  </div>
                  <div className="col-md-6">
                    <strong>Payment Method:</strong>
                    <div className="text-muted">
                      {formatPaymentMethod(selectedOrderDetails.paymentMethod)}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <strong>Estimated Delivery:</strong>
                    <div className="text-muted">{getEstimatedDelivery(selectedOrderDetails)}</div>
                  </div>
                  <div className="col-md-12">
                    <strong>Delivery Address:</strong>
                    <div className="text-muted">
                      {selectedOrderDetails.customer?.name || "Customer"}<br />
                      {selectedOrderDetails.customer?.address || "Address not available"}<br />
                      {selectedOrderDetails.customer?.landmark ? `${selectedOrderDetails.customer.landmark}, ` : ""}
                      {selectedOrderDetails.customer?.pincode || ""}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <strong>Date:</strong>
                    <div className="text-muted">
                      {selectedOrderDetails.createdAt
                        ? new Date(selectedOrderDetails.createdAt).toLocaleString()
                        : "N/A"}
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <strong>Tracking Information</strong>
                  <div className="mt-2">
                    {getTrackingEvents(selectedOrderDetails).map((ev, idx) => {
                      const isCompleted = idx <= getTrackingStepIndex(selectedOrderDetails.orderStatus || "PLACED");

                      return (
                        <div key={`${ev.status}-${idx}`} className="d-flex mb-3">
                          <div className="me-3">
                            <div
                              className={`rounded-circle d-flex align-items-center justify-content-center ${isCompleted ? "bg-success text-white" : "bg-light text-muted border"}`}
                              style={{ width: "28px", height: "28px", minWidth: "28px" }}
                            >
                              <small>{isCompleted ? "✓" : "○"}</small>
                            </div>
                          </div>
                          <div className="flex-grow-1">
                            <div className={`fw-bold ${isCompleted ? "text-dark" : "text-muted"}`}>
                              {ev.status.replace(/_/g, " ")}
                            </div>
                            <small className="text-muted d-block">{ev.note}</small>
                            <small className="text-muted">
                              {ev.createdAt ? new Date(ev.createdAt).toLocaleString([], {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              }) : "Waiting for update"}
                            </small>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-3">
                  <strong>Items</strong>
                  <div className="mt-2">
                    {selectedOrderDetails.items?.map((item, index) => (
                      <div key={index} className="d-flex justify-content-between border-bottom py-2">
                        <div>
                          <div className="fw-semibold">{item.productId?.name || item.name}</div>
                          <small className="text-muted">Qty: {item.qty}</small>
                        </div>
                        <div className="text-end">
                          <div className="fw-semibold">₹{(item.price * item.qty).toFixed(2)}</div>
                          <small className="text-muted">₹{item.price}/item</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center border-top pt-3">
                  <strong>Total Amount</strong>
                  <strong className="text-success">₹{Number(selectedOrderDetails.totalAmount).toFixed(2)}</strong>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowOrderDetailsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RETURN REQUEST MODAL */}
      {showReturnModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => {
            if (!submittingReturn) {
              setShowReturnModal(false);
              setReturnReason("");
              setSelectedOrder(null);
            }
          }}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Request Return</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    if (!submittingReturn) {
                      setShowReturnModal(false);
                      setReturnReason("");
                      setSelectedOrder(null);
                    }
                  }}
                  disabled={submittingReturn}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>Order ID:</strong> {selectedOrder?._id.slice(-8).toUpperCase()}
                </p>
                <p>
                  <strong>Total Amount:</strong> ₹{selectedOrder?.totalAmount.toFixed(2)}
                </p>
                <div className="mb-3">
                  <label className="form-label">
                    <strong>Reason for Return <span className="text-danger">*</span></strong>
                  </label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder="Please explain why you want to return this order..."
                    disabled={submittingReturn}
                    maxLength={500}
                  ></textarea>
                  <small className="text-muted">
                    {returnReason.length}/500 characters
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    if (!submittingReturn) {
                      setShowReturnModal(false);
                      setReturnReason("");
                      setSelectedOrder(null);
                    }
                  }}
                  disabled={submittingReturn}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleReturnRequest}
                  disabled={submittingReturn || !returnReason.trim()}
                >
                  {submittingReturn ? "Submitting..." : "Submit Return Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      <Toast
        message={toastMessage}
        type={toastType}
        show={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}

export default MyOrders;
