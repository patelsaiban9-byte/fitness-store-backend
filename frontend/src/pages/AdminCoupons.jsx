import React, { useEffect, useState } from "react";

function AdminCoupons() {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    minOrderAmount: "",
    maxDiscountAmount: "",
    expiryDate: "",
    usageLimit: "",
    isActive: true,
    description: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchCoupons = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/coupons/report`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });
      const data = await res.json();
      if (res.ok) {
        setCoupons(data);
      } else {
        setMessage({ type: "danger", text: data.message || data.error || "Failed to load coupons." });
      }
    } catch (err) {
      console.error("Fetch coupons error:", err);
      setMessage({ type: "danger", text: "Failed to load coupons." });
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setErrors({});
    setForm({
      code: "",
      discountType: "percentage",
      discountValue: "",
      minOrderAmount: "",
      maxDiscountAmount: "",
      expiryDate: "",
      usageLimit: "",
      isActive: true,
      description: "",
    });
  };

  const validateCouponForm = (candidate) => {
    const nextErrors = {};
    const normalizedCode = candidate.code.trim().toUpperCase();
    const discountValue = Number(candidate.discountValue);
    const minOrderAmount = Number(candidate.minOrderAmount || 0);
    const maxDiscountAmount = Number(candidate.maxDiscountAmount || 0);
    const usageLimit = Number(candidate.usageLimit || 1);

    if (!normalizedCode) {
      nextErrors.code = "Coupon code is required.";
    } else if (
      coupons.some((coupon) => coupon.code.toUpperCase() === normalizedCode && coupon._id !== editingId)
    ) {
      nextErrors.code = "Coupon code already exists.";
    }

    if (!candidate.discountValue || Number.isNaN(discountValue) || discountValue <= 0) {
      nextErrors.discountValue = "Discount value must be greater than zero.";
    } else if (candidate.discountType === "percentage" && discountValue > 100) {
      nextErrors.discountValue = "Percentage discount cannot exceed 100%.";
    }

    if (minOrderAmount < 0) {
      nextErrors.minOrderAmount = "Minimum order amount cannot be negative.";
    }

    if (maxDiscountAmount < 0) {
      nextErrors.maxDiscountAmount = "Maximum discount cannot be negative.";
    }

    if (!candidate.expiryDate) {
      nextErrors.expiryDate = "Expiry date is required.";
    } else {
      const selectedExpiry = new Date(`${candidate.expiryDate}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedExpiry < today) {
        nextErrors.expiryDate = "Expiry date cannot be in the past.";
      }
    }

    if (usageLimit <= 0) {
      nextErrors.usageLimit = "Usage limit must be greater than 0.";
    }

    return nextErrors;
  };

  const submitCoupon = async (e) => {
    e.preventDefault();
    setMessage(null);

    const normalizedCode = form.code.trim().toUpperCase();
    const discountValue = Number(form.discountValue);
    const minOrderAmount = Number(form.minOrderAmount || 0);
    const maxDiscountAmount = Number(form.maxDiscountAmount || 0);
    const usageLimit = Number(form.usageLimit || 1);
    const validationErrors = validateCouponForm(form);

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setMessage({ type: "danger", text: "Please fix the highlighted fields." });
      return;
    }

    const payload = {
      ...form,
      code: normalizedCode,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
    };

    try {
      const url = editingId
        ? `${API_URL}/api/admin/coupons/${editingId}`
        : `${API_URL}/api/admin/coupons`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "danger", text: data.message || data.error || "Failed to save coupon." });
        return;
      }

      setMessage({ type: "success", text: editingId ? "Coupon updated." : "Coupon created." });
      resetForm();
      fetchCoupons();
    } catch (err) {
      console.error("Save coupon error:", err);
      setMessage({ type: "danger", text: "Failed to save coupon." });
    }
  };

  const handleEdit = (coupon) => {
    setEditingId(coupon._id);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount || "",
      maxDiscountAmount: coupon.maxDiscountAmount || "",
      expiryDate: coupon.expiryDate ? coupon.expiryDate.split("T")[0] : "",
      usageLimit: coupon.usageLimit || "",
      isActive: coupon.isActive,
      description: coupon.description || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDisable = async (coupon) => {
    const nextIsActive = !coupon.isActive;

    try {
      const res = await fetch(`${API_URL}/api/admin/coupons/${coupon._id}/disable`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ isActive: nextIsActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "danger", text: data.message || data.error || "Failed to update coupon status." });
        return;
      }
      setMessage({ type: "success", text: nextIsActive ? "Coupon enabled." : "Coupon disabled." });
      fetchCoupons();
    } catch (err) {
      console.error("Disable coupon error:", err);
      setMessage({ type: "danger", text: "Failed to update coupon status." });
    }
  };

  const handleDelete = async (couponId) => {
    if (!couponId) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/coupons/${couponId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "danger", text: data.message || data.error || "Failed to delete coupon." });
        return;
      }
      setMessage({ type: "success", text: "Coupon deleted." });
      setDeleteTarget(null);
      fetchCoupons();
    } catch (err) {
      console.error("Delete coupon error:", err);
      setMessage({ type: "danger", text: "Failed to delete coupon." });
    }
  };

  const now = new Date();
  const getCouponStatus = (coupon) => {
    if (!coupon.isActive) return "disabled";
    if (coupon.expiryDate && new Date(coupon.expiryDate) < now) return "expired";
    return "active";
  };

  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter((coupon) => getCouponStatus(coupon) === "active").length;
  const expiredCoupons = coupons.filter((coupon) => getCouponStatus(coupon) === "expired").length;
  const totalDiscountGiven = coupons.reduce(
    (sum, coupon) => sum + Number(coupon.totalDiscountGiven || 0),
    0
  );

  const filteredCoupons = coupons.filter((coupon) => {
    const status = getCouponStatus(coupon);
    const matchesSearch =
      !searchTerm ||
      coupon.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.discountType?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = [
    { label: "Coupons", value: totalCoupons, icon: "🎟️", accent: "#eef2ff", color: "#312e81" },
    { label: "Active", value: activeCoupons, icon: "🟢", accent: "#dcfce7", color: "#166534" },
    { label: "Expired", value: expiredCoupons, icon: "⏰", accent: "#fef3c7", color: "#92400e" },
    { label: "Discount", value: `₹${totalDiscountGiven.toLocaleString("en-IN")}`, icon: "💰", accent: "#f3e8ff", color: "#6b21a8" },
  ];

  return (
    <div className="container py-4">
      {message && (
        <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
          {message.text}
          <button type="button" className="btn-close" aria-label="Close" onClick={() => setMessage(null)}></button>
        </div>
      )}

      <h1 className="mb-4">Coupon Manager</h1>

      <div className="mb-4">
        <div className="row g-3">
          {stats.map((stat) => (
            <div className="col-sm-6 col-xl-3" key={stat.label}>
              <div
                className="card border-0 h-100 shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${stat.accent} 0%, #ffffff 100%)`,
                  border: "1px solid rgba(148, 163, 184, 0.18)",
                }}
              >
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span
                      className="d-inline-flex align-items-center justify-content-center rounded-circle"
                      style={{
                        width: 44,
                        height: 44,
                        background: "rgba(255,255,255,0.7)",
                        fontSize: "1.2rem",
                      }}
                    >
                      {stat.icon}
                    </span>
                    <span className="text-muted small fw-semibold">{stat.label}</span>
                  </div>
                  <div
                    className="fw-bold"
                    style={{ fontSize: "1.9rem", lineHeight: 1.2, color: stat.color }}
                  >
                    {stat.value}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h5>{editingId ? "Edit Coupon" : "Create Coupon"}</h5>
          <form onSubmit={submitCoupon}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Code</label>
                <input
                  name="code"
                  value={form.code}
                  onChange={(e) => {
                    handleChange(e);
                    setErrors((prev) => ({ ...prev, code: "" }));
                  }}
                  className={`form-control ${errors.code ? "is-invalid" : ""}`}
                  placeholder="FIT20"
                  required
                />
                {errors.code && <div className="invalid-feedback d-block">{errors.code}</div>}
              </div>
              <div className="col-md-4">
                <label className="form-label">Discount Type</label>
                <select
                  name="discountType"
                  value={form.discountType}
                  onChange={(e) => {
                    handleChange(e);
                    setErrors((prev) => ({ ...prev, discountValue: "" }));
                  }}
                  className="form-select"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Discount Value</label>
                <input
                  name="discountValue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.discountValue}
                  onChange={(e) => {
                    handleChange(e);
                    setErrors((prev) => ({ ...prev, discountValue: "" }));
                  }}
                  className={`form-control ${errors.discountValue ? "is-invalid" : ""}`}
                  placeholder={form.discountType === "percentage" ? "e.g. 20" : "e.g. ₹500"}
                  required
                />
                {errors.discountValue && <div className="invalid-feedback d-block">{errors.discountValue}</div>}
              </div>
              <div className="col-md-4">
                <label className="form-label">Min Order Amount</label>
                <input
                  name="minOrderAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.minOrderAmount}
                  onChange={(e) => {
                    handleChange(e);
                    setErrors((prev) => ({ ...prev, minOrderAmount: "" }));
                  }}
                  className={`form-control ${errors.minOrderAmount ? "is-invalid" : ""}`}
                  placeholder="1000"
                />
                {errors.minOrderAmount && <div className="invalid-feedback d-block">{errors.minOrderAmount}</div>}
              </div>
              <div className="col-md-4">
                <label className="form-label">Max Discount Amount</label>
                <input
                  name="maxDiscountAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.maxDiscountAmount}
                  onChange={(e) => {
                    handleChange(e);
                    setErrors((prev) => ({ ...prev, maxDiscountAmount: "" }));
                  }}
                  className={`form-control ${errors.maxDiscountAmount ? "is-invalid" : ""}`}
                  placeholder="500"
                />
                {errors.maxDiscountAmount && <div className="invalid-feedback d-block">{errors.maxDiscountAmount}</div>}
              </div>
              <div className="col-md-4">
                <label className="form-label">Expiry Date</label>
                <div className="input-group">
                  <span className="input-group-text">📅</span>
                  <input
                    name="expiryDate"
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={form.expiryDate}
                    onChange={(e) => {
                      handleChange(e);
                      setErrors((prev) => ({ ...prev, expiryDate: "" }));
                    }}
                    className={`form-control ${errors.expiryDate ? "is-invalid" : ""}`}
                    required
                  />
                </div>
                {errors.expiryDate && <div className="invalid-feedback d-block">{errors.expiryDate}</div>}
              </div>
              <div className="col-md-4">
                <label className="form-label">Usage Limit</label>
                <input
                  name="usageLimit"
                  type="number"
                  min="1"
                  step="1"
                  value={form.usageLimit}
                  onChange={(e) => {
                    handleChange(e);
                    setErrors((prev) => ({ ...prev, usageLimit: "" }));
                  }}
                  className={`form-control ${errors.usageLimit ? "is-invalid" : ""}`}
                  placeholder="100"
                />
                {errors.usageLimit && <div className="invalid-feedback d-block">{errors.usageLimit}</div>}
              </div>
              <div className="col-md-4 d-flex align-items-center">
                <div className="form-check mt-4">
                  <input
                    name="isActive"
                    type="checkbox"
                    checked={form.isActive}
                    onChange={handleChange}
                    className="form-check-input"
                    id="couponIsActive"
                  />
                  <label className="form-check-label" htmlFor="couponIsActive">
                    Active
                  </label>
                </div>
              </div>
              <div className="col-12">
                <label className="form-label">Description</label>
                <input
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Optional coupon description"
                />
              </div>
            </div>
            <div className="mt-3 d-flex gap-2">
              <button type="submit" className="btn btn-primary">
                {editingId ? "Update Coupon" : "Create Coupon"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  resetForm();
                  setMessage(null);
                }}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>

      {deleteTarget && (
        <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delete Coupon?</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setDeleteTarget(null)}></button>
              </div>
              <div className="modal-body">
                <p className="mb-0">
                  Are you sure you want to permanently delete <strong>{deleteTarget.code}</strong>?
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={() => handleDelete(deleteTarget._id)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card shadow-sm">
        <div className="card-body">
          <h5>Coupons</h5>

          <div className="row g-2 mb-3">
            <div className="col-md-8">
              <input
                type="text"
                className="form-control"
                placeholder="Search coupon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Expiry</th>
                  <th>Usage</th>
                  <th>Status</th>
                  <th>Total Discount Given</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoupons.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-4">
                      No coupons found.
                    </td>
                  </tr>
                ) : (
                  filteredCoupons.map((coupon) => (
                    <tr key={coupon._id}>
                      <td>{coupon.code}</td>
                      <td>
                        <span className="badge rounded-pill bg-light text-dark border">
                          {coupon.discountType === "percentage" ? "Percentage" : "Fixed"}
                        </span>
                      </td>
                      <td>
                        {coupon.discountType === "percentage"
                          ? `${coupon.discountValue}% off${coupon.maxDiscountAmount ? ` (max ₹${coupon.maxDiscountAmount})` : ""}`
                          : `₹${coupon.discountValue} off`}
                      </td>
                      <td>₹{coupon.minOrderAmount || 0}</td>
                      <td>{coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : "-"}</td>
                      <td>
                        {coupon.usedTimes || coupon.usedCount || 0}/{coupon.usageLimit || 0}
                      </td>
                      <td>
                        {getCouponStatus(coupon) === "active" ? (
                          <span className="badge rounded-pill bg-success-subtle text-success-emphasis border border-success-subtle">
                            🟢 Active
                          </span>
                        ) : getCouponStatus(coupon) === "expired" ? (
                          <span className="badge rounded-pill bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle">
                            ⚫ Expired
                          </span>
                        ) : (
                          <span className="badge rounded-pill bg-danger-subtle text-danger-emphasis border border-danger-subtle">
                            🔴 Disabled
                          </span>
                        )}
                      </td>
                      <td>₹{coupon.totalDiscountGiven || 0}</td>
                      <td className="d-flex gap-1">
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => handleEdit(coupon)}>
                          Edit
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-warning" onClick={() => handleDisable(coupon)}>
                          {coupon.isActive ? "Disable" : "Enable"}
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setDeleteTarget(coupon)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminCoupons;
