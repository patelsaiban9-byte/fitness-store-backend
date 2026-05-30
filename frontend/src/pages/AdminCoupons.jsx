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

  const submitCoupon = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!form.code.trim()) {
      setMessage({ type: "danger", text: "Coupon code is required." });
      return;
    }
    if (!form.discountValue || Number(form.discountValue) <= 0) {
      setMessage({ type: "danger", text: "Discount value must be greater than zero." });
      return;
    }
    if (!form.expiryDate) {
      setMessage({ type: "danger", text: "Expiry date is required." });
      return;
    }

    const payload = {
      ...form,
      discountValue: Number(form.discountValue),
      minOrderAmount: Number(form.minOrderAmount || 0),
      maxDiscountAmount: Number(form.maxDiscountAmount || 0),
      usageLimit: Number(form.usageLimit || 1),
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

  const handleDisable = async (couponId) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/coupons/${couponId}/disable`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "danger", text: data.message || data.error || "Failed to disable coupon." });
        return;
      }
      setMessage({ type: "success", text: "Coupon disabled." });
      fetchCoupons();
    } catch (err) {
      console.error("Disable coupon error:", err);
      setMessage({ type: "danger", text: "Failed to disable coupon." });
    }
  };

  const handleDelete = async (couponId) => {
    if (!window.confirm("Delete this coupon?")) return;
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
      fetchCoupons();
    } catch (err) {
      console.error("Delete coupon error:", err);
      setMessage({ type: "danger", text: "Failed to delete coupon." });
    }
  };

  return (
    <div className="container py-4">
      {message && (
        <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
          {message.text}
          <button type="button" className="btn-close" aria-label="Close" onClick={() => setMessage(null)}></button>
        </div>
      )}

      <h1 className="mb-4">Coupon Manager</h1>

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
                  onChange={handleChange}
                  className="form-control"
                  placeholder="FIT20"
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Discount Type</label>
                <select name="discountType" value={form.discountType} onChange={handleChange} className="form-select">
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Discount Value</label>
                <input
                  name="discountValue"
                  type="number"
                  value={form.discountValue}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="10 or 100"
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Min Order Amount</label>
                <input
                  name="minOrderAmount"
                  type="number"
                  value={form.minOrderAmount}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="1000"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Max Discount Amount</label>
                <input
                  name="maxDiscountAmount"
                  type="number"
                  value={form.maxDiscountAmount}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="500"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Expiry Date</label>
                <input
                  name="expiryDate"
                  type="date"
                  value={form.expiryDate}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Usage Limit</label>
                <input
                  name="usageLimit"
                  type="number"
                  value={form.usageLimit}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="100"
                />
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
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <h5>Coupons</h5>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Code</th>
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
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      No coupons found.
                    </td>
                  </tr>
                ) : (
                  coupons.map((coupon) => (
                    <tr key={coupon._id}>
                      <td>{coupon.code}</td>
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
                      <td>{coupon.isActive ? "Active" : "Inactive"}</td>
                      <td>₹{coupon.totalDiscountGiven || 0}</td>
                      <td className="d-flex gap-1">
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => handleEdit(coupon)}>
                          Edit
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-warning" onClick={() => handleDisable(coupon._id)}>
                          Disable
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(coupon._id)}>
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
