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

const emptyAddress = {
  fullName: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  isDefault: false,
};

function Profile() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: localStorage.getItem("name") || "",
    email: localStorage.getItem("email") || "",
    phone: localStorage.getItem("phone") || "",
    profileImage: localStorage.getItem("profileImage") || "",
  });
  const [profileImagePreview, setProfileImagePreview] = useState(localStorage.getItem("profileImage") || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);
  const [profileError, setProfileError] = useState(null);

  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressMessage, setAddressMessage] = useState(null);

  const [securityForm, setSecurityForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [securityMode, setSecurityMode] = useState("current");
  const [securityOtp, setSecurityOtp] = useState("");
  const [securityOtpSent, setSecurityOtpSent] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityMessage, setSecurityMessage] = useState(null);
  const [securityError, setSecurityError] = useState(null);

  const [ordersStats, setOrdersStats] = useState({ total: 0, completed: 0, pending: 0 });
  const [wishlistCount, setWishlistCount] = useState(0);
  const [coupons, setCoupons] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingMessage, setRatingMessage] = useState(null);

  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  useEffect(() => {
    if (!token || !userId) {
      navigate("/login");
      return;
    }
    loadData();
  }, [token, userId]);

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
  };

  const fetchJson = async (url, options = {}) => {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Request failed");
    }
    return data;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadProfile(),
        loadAddresses(),
        loadOrderStats(),
        loadWishlistCount(),
        loadCoupons(),
        loadRatings(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const data = await fetchJson(`${API_URL}/api/auth/profile`);
      const profileData = data?.user || data;
      const nextProfileImage = profileData?.profileImage || "";
      setProfile({
        name: profileData?.name || "",
        email: profileData?.email || "",
        phone: profileData?.phone || "",
        profileImage: nextProfileImage,
      });
      setProfileImagePreview(nextProfileImage);
      localStorage.setItem("name", profileData?.name || "");
      localStorage.setItem("email", profileData?.email || "");
      localStorage.setItem("phone", profileData?.phone || "");
      localStorage.setItem("profileImage", nextProfileImage || "");
    } catch (error) {
      console.error("Load profile error:", error);
    }
  };

  const loadAddresses = async () => {
    try {
      const data = await fetchJson(`${API_URL}/api/addresses`);
      setAddresses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Load addresses error:", error);
    }
  };

  const loadOrderStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/orders/my/user/${userId}`);
      const data = await res.json();
      const items = Array.isArray(data) ? data : [];
      const completed = items.filter((order) => order.orderStatus === "DELIVERED").length;
      const pending = items.filter((order) => order.orderStatus !== "DELIVERED" && order.orderStatus !== "CANCELLED").length;
      setOrdersStats({ total: items.length, completed, pending });
    } catch (error) {
      console.error("Load order stats error:", error);
    }
  };

  const loadWishlistCount = async () => {
    try {
      const data = await fetchJson(`${API_URL}/api/wishlist/count`);
      setWishlistCount(Number(data.count) || 0);
    } catch (error) {
      console.error("Load wishlist count error:", error);
    }
  };

  const loadCoupons = async () => {
    try {
      const res = await fetch(`${API_URL}/api/coupons/active`);
      const data = await res.json();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Load coupons error:", error);
      setCoupons([]);
    }
  };

  const loadRatings = async () => {
    setRatingLoading(true);
    try {
      const data = await fetchJson(`${API_URL}/api/ratings/my`);
      setRatings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Load ratings error:", error);
      setRatings([]);
    } finally {
      setRatingLoading(false);
    }
  };

  const handleProfileImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProfileError("Please choose a valid image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setProfileError("Please choose an image smaller than 2 MB.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Image upload failed");
      }

      const uploadedImageUrl = data.imageUrl;
      setProfile((prev) => ({ ...prev, profileImage: uploadedImageUrl }));
      setProfileImagePreview(uploadedImageUrl);
      localStorage.setItem("profileImage", uploadedImageUrl || "");
      setProfileError(null);
    } catch (error) {
      setProfileError(error.message || "Image upload failed");
    }
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setProfileLoading(true);
    setProfileError(null);
    setProfileMessage(null);

    try {
      if (profile.profileImage && !profile.profileImage.startsWith("http")) {
        const formData = new FormData();
        formData.append("image", profile.profileImage);

        const uploadResponse = await fetch(`${API_URL}/api/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(uploadData.message || "Profile image upload failed");
        }

        profile.profileImage = uploadData.imageUrl;
      }

      const data = await fetchJson(`${API_URL}/api/auth/profile`, {
        method: "PUT",
        body: JSON.stringify(profile),
      });
      setProfileMessage(data.message || "Profile updated successfully");
      showToast("Profile updated successfully", "success");
      localStorage.setItem("name", profile.name);
      localStorage.setItem("email", profile.email);
      localStorage.setItem("phone", profile.phone);
      localStorage.setItem("profileImage", profile.profileImage || "");
      window.dispatchEvent(new Event("profileUpdated"));
    } catch (error) {
      setProfileError(error.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSendSecurityOtp = async () => {
    setSecurityError(null);
    setSecurityMessage(null);
    setSecurityLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: profile.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }
      setSecurityOtpSent(true);
      setSecurityMessage(data.message || "OTP sent to your email");
    } catch (error) {
      setSecurityError(error.message);
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleSecuritySave = async (event) => {
    event.preventDefault();
    setSecurityError(null);
    setSecurityMessage(null);
    setSecurityLoading(true);

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setSecurityError("New password and confirm password must match.");
      setSecurityLoading(false);
      return;
    }
    if (securityForm.newPassword.length < 6) {
      setSecurityError("Password must be at least 6 characters.");
      setSecurityLoading(false);
      return;
    }

    try {
      if (securityMode === "otp") {
        if (!securityOtp) {
          setSecurityError("OTP is required to reset your password.");
          setSecurityLoading(false);
          return;
        }

        const res = await fetch(`${API_URL}/api/auth/reset-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: profile.email,
            otp: securityOtp,
            newPassword: securityForm.newPassword,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to reset password");
        }

        setSecurityMessage(data.message || "Password reset successfully");
        setSecurityForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        setSecurityOtp("");
        setSecurityOtpSent(false);
        showToast("Password reset successfully", "success");
      } else {
        const data = await fetchJson(`${API_URL}/api/auth/profile/password`, {
          method: "PATCH",
          body: JSON.stringify({
            oldPassword: securityForm.oldPassword,
            newPassword: securityForm.newPassword,
          }),
        });
        setSecurityMessage(data.message || "Password updated successfully");
        setSecurityForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        showToast("Password updated successfully", "success");
      }
    } catch (error) {
      setSecurityError(error.message);
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleAddressSave = async (event) => {
    event.preventDefault();
    setAddressLoading(true);
    setAddressMessage(null);

    try {
      const payload = { ...addressForm, isDefault: Boolean(addressForm.isDefault) };
      const url = editingAddress
        ? `${API_URL}/api/addresses/${editingAddress._id}`
        : `${API_URL}/api/addresses`;
      const method = editingAddress ? "PUT" : "POST";
      const data = await fetchJson(url, { method, body: JSON.stringify(payload) });
      setAddressMessage(data.message || "Address saved successfully");
      setAddressForm(emptyAddress);
      setEditingAddress(null);
      loadAddresses();
      showToast(data.message || "Address saved successfully", "success");
    } catch (error) {
      setAddressMessage(error.message);
    } finally {
      setAddressLoading(false);
    }
  };

  const handleAddressEdit = (address) => {
    setEditingAddress(address);
    setAddressForm({
      fullName: address.fullName,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      isDefault: Boolean(address.isDefault),
    });
    setActiveTab("addresses");
  };

  const handleAddressDelete = async (addressId) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await fetchJson(`${API_URL}/api/addresses/${addressId}`, { method: "DELETE" });
      loadAddresses();
      showToast("Address removed", "success");
    } catch (error) {
      showToast(error.message, "danger");
    }
  };

  const handleDefaultAddress = async (addressId) => {
    try {
      await fetchJson(`${API_URL}/api/addresses/${addressId}/default`, { method: "PATCH" });
      loadAddresses();
      showToast("Default address updated", "success");
    } catch (error) {
      showToast(error.message, "danger");
    }
  };

  const handleRatingUpdate = async (ratingId, newRating) => {
    try {
      const data = await fetchJson(`${API_URL}/api/ratings/${ratingId}`, {
        method: "PATCH",
        body: JSON.stringify({ rating: newRating }),
      });
      showToast(data.message || "Rating updated", "success");
      loadRatings();
    } catch (error) {
      showToast(error.message, "danger");
    }
  };

  const copyCoupon = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast(`Copied ${code}`, "success");
    } catch {
      showToast("Copy failed", "danger");
    }
  };

  const getInitials = (name = "User") => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "U";
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3">Loading your profile dashboard...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm" style={{ background: "linear-gradient(135deg, #f8fbff 0%, #eef4ff 100%)" }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center overflow-hidden border border-2 border-white shadow-sm"
                    style={{ width: 72, height: 72, background: "#0d6efd", color: "#fff", fontSize: "1.4rem", fontWeight: 700 }}
                  >
                    {profile.profileImage ? (
                      <img
                        src={profile.profileImage}
                        alt={profile.name || "User profile"}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      getInitials(profile.name)
                    )}
                  </div>

                  <div>
                    <div className="text-uppercase small text-primary fw-semibold mb-1">Profile</div>
                    <h2 className="fw-bold mb-1">{profile.name || "Profile User"}</h2>
                    <div className="d-flex flex-wrap gap-3 text-muted small">
                      <span>{profile.email || "No email added"}</span>
                      <span>📞 {profile.phone || "No phone number"}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary px-4"
                  onClick={() => setActiveTab("personal")}
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-3 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-body p-3">
              <div className="mb-4 text-center">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center border border-3 border-light shadow-sm overflow-hidden mx-auto"
                  style={{
                    width: 88,
                    height: 88,
                    background: "#0d6efd",
                    color: "#fff",
                    fontSize: "1.8rem",
                    fontWeight: 700,
                  }}
                >
                  {(profile.profileImage || profileImagePreview) ? (
                    <img
                      src={profile.profileImage || profileImagePreview}
                      alt="Profile"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    getInitials(profile.name)
                  )}
                </div>
              </div>
              <div className="list-group list-group-flush">
                {[
                  { id: "personal", label: "👤 Personal Information" },
                  { id: "addresses", label: "📍 Addresses" },
                  { id: "security", label: "🔒 Security" },
                  { id: "orders", label: "📦 Orders" },
                  { id: "wishlist", label: "❤️ Wishlist" },
                  { id: "ratings", label: "⭐ My Ratings" },
                  { id: "coupons", label: "🎟️ Saved Coupons" },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={`list-group-item list-group-item-action border-0 text-start ${activeTab === item.id ? "active" : ""}`}
                    onClick={() => setActiveTab(item.id)}
                    style={{ cursor: "pointer" }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-9">
          <div className="row g-3 mb-4">
            <div className="col-sm-4">
              <div className="card h-100 shadow-sm border-0" style={{ background: "linear-gradient(135deg, #f4f9ff 0%, #eef5ff 100%)" }}>
                <div className="card-body p-3">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <span className="d-inline-flex align-items-center justify-content-center rounded-circle" style={{ width: 40, height: 40, background: "#dfeeff", fontSize: "1.2rem" }}>🛍️</span>
                    <span className="text-muted small fw-semibold">Total Orders</span>
                  </div>
                  <div className="fs-2 fw-bold text-dark">{ordersStats.total}</div>
                </div>
              </div>
            </div>
            <div className="col-sm-4">
              <div className="card h-100 shadow-sm border-0" style={{ background: "linear-gradient(135deg, #f2fff7 0%, #edfdf2 100%)" }}>
                <div className="card-body p-3">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <span className="d-inline-flex align-items-center justify-content-center rounded-circle" style={{ width: 40, height: 40, background: "#dff7e8", fontSize: "1.2rem" }}>✅</span>
                    <span className="text-muted small fw-semibold">Completed</span>
                  </div>
                  <div className="fs-2 fw-bold text-dark">{ordersStats.completed}</div>
                </div>
              </div>
            </div>
            <div className="col-sm-4">
              <div className="card h-100 shadow-sm border-0" style={{ background: "linear-gradient(135deg, #fffaf1 0%, #fff4e5 100%)" }}>
                <div className="card-body p-3">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <span className="d-inline-flex align-items-center justify-content-center rounded-circle" style={{ width: 40, height: 40, background: "#ffe9c8", fontSize: "1.2rem" }}>⏳</span>
                    <span className="text-muted small fw-semibold">Pending</span>
                  </div>
                  <div className="fs-2 fw-bold text-dark">{ordersStats.pending}</div>
                </div>
              </div>
            </div>
          </div>

          {activeTab === "personal" && (
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body">
                <h4 className="mb-3">Personal Information</h4>
                {profileError && <div className="alert alert-danger">{profileError}</div>}
                {profileMessage && <div className="alert alert-success">{profileMessage}</div>}
                <form onSubmit={handleProfileSave}>
                  <div className="row gy-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Name</label>
                      <input
                        className="form-control"
                        value={profile.name}
                        placeholder="Profile User"
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Email</label>
                      <input
                        type="email"
                        className="form-control bg-light"
                        value={profile.email}
                        readOnly
                        disabled
                        aria-readonly="true"
                        style={{ cursor: "not-allowed", opacity: 0.9 }}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone</label>
                      <input
                        className="form-control"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Profile Picture</label>
                      <div className="d-flex align-items-center gap-3 flex-wrap">
                        <label className="btn btn-outline-primary mb-0" style={{ cursor: "pointer" }}>
                          Choose Image
                          <input
                            type="file"
                            accept="image/*"
                            className="d-none"
                            onChange={handleProfileImageChange}
                          />
                        </label>
                        {(profile.profileImage || profileImagePreview) && (
                          <img
                            src={profile.profileImage || profileImagePreview}
                            alt="Profile preview"
                            className="rounded-circle border"
                            style={{ width: 52, height: 52, objectFit: "cover" }}
                          />
                        )}
                      </div>
                      <div className="text-muted small mt-2">Recommended: JPG/PNG, max 2 MB</div>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary mt-5 px-4 py-2 fw-semibold" disabled={profileLoading}>
                    {profileLoading ? "Saving..." : "Save Profile"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === "addresses" && (
            <div>
              <div className="card shadow-sm border-0 mb-4">
                <div className="card-body">
                  <h4 className="mb-3">Addresses</h4>
                  {addressMessage && <div className="alert alert-info">{addressMessage}</div>}
                  {addresses.length === 0 ? (
                    <div className="text-muted">No saved addresses yet. Add one now.</div>
                  ) : (
                    <div className="row g-3 mb-4">
                      {addresses.map((address) => (
                        <div key={address._id} className="col-md-6">
                          <div className="card shadow-sm h-100">
                            <div className="card-body">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                  <h6 className="fw-bold mb-1">{address.fullName}</h6>
                                  <div className="small text-muted">{address.phone}</div>
                                </div>
                                {address.isDefault && (
                                  <span className="badge bg-success">Default</span>
                                )}
                              </div>
                              <p className="mb-2">{address.address}</p>
                              <p className="mb-2 text-muted">{address.city}, {address.state} - {address.pincode}</p>
                              <div className="d-flex flex-wrap gap-2">
                                <button
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() => handleAddressEdit(address)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => handleAddressDelete(address._id)}
                                >
                                  Delete
                                </button>
                                {!address.isDefault && (
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleDefaultAddress(address._id)}
                                  >
                                    Set Default
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="card shadow-sm border-0 p-4">
                    <h5>{editingAddress ? "Edit Address" : "Add Address"}</h5>
                    <form onSubmit={handleAddressSave} className="row g-3 mt-2">
                      <div className="col-md-6">
                        <label className="form-label">Full Name</label>
                        <input
                          className="form-control"
                          value={addressForm.fullName}
                          onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Phone</label>
                        <input
                          className="form-control"
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Address</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={addressForm.address}
                          onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">City</label>
                        <input
                          className="form-control"
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">State</label>
                        <input
                          className="form-control"
                          value={addressForm.state}
                          onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Pincode</label>
                        <input
                          className="form-control"
                          value={addressForm.pincode}
                          onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-12 form-check">
                        <input
                          type="checkbox"
                          id="defaultAddress"
                          className="form-check-input"
                          checked={addressForm.isDefault}
                          onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                        />
                        <label className="form-check-label" htmlFor="defaultAddress">
                          Set as default address
                        </label>
                      </div>
                      <div className="col-12 d-flex gap-2">
                        <button className="btn btn-primary" type="submit" disabled={addressLoading}>
                          {addressLoading ? "Saving..." : editingAddress ? "Update Address" : "Add Address"}
                        </button>
                        {editingAddress && (
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => {
                              setAddressForm(emptyAddress);
                              setEditingAddress(null);
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body">
                <h4 className="mb-3">Security Settings</h4>
                {securityError && <div className="alert alert-danger">{securityError}</div>}
                {securityMessage && <div className="alert alert-success">{securityMessage}</div>}
                <div className="btn-group mb-4" role="group" aria-label="Password reset mode">
                  <button
                    type="button"
                    className={`btn btn-outline-secondary ${securityMode === "current" ? "active" : ""}`}
                    onClick={() => setSecurityMode("current")}
                  >
                    Current Password
                  </button>
                  <button
                    type="button"
                    className={`btn btn-outline-secondary ${securityMode === "otp" ? "active" : ""}`}
                    onClick={() => setSecurityMode("otp")}
                  >
                    Email OTP
                  </button>
                </div>
                <form onSubmit={handleSecuritySave} className="row g-3">
                  {securityMode === "current" ? (
                    <div className="col-md-4">
                      <label className="form-label">Old Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={securityForm.oldPassword}
                        onChange={(e) => setSecurityForm({ ...securityForm, oldPassword: e.target.value })}
                        required
                      />
                    </div>
                  ) : (
                    <>
                      <div className="col-md-6">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-control"
                          value={profile.email}
                          disabled
                        />
                      </div>
                      <div className="col-md-6 d-flex align-items-end">
                        <button
                          type="button"
                          className="btn btn-outline-primary w-100"
                          onClick={handleSendSecurityOtp}
                          disabled={securityLoading}
                        >
                          {securityOtpSent ? "Resend OTP" : "Send OTP"}
                        </button>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">OTP</label>
                        <input
                          type="text"
                          className="form-control"
                          value={securityOtp}
                          onChange={(e) => setSecurityOtp(e.target.value)}
                          placeholder="Enter OTP"
                          maxLength={6}
                          required
                        />
                      </div>
                    </>
                  )}
                  <div className="col-md-4">
                    <label className="form-label">New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={securityForm.newPassword}
                      onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Confirm Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={securityForm.confirmPassword}
                      onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <button className="btn btn-primary" type="submit" disabled={securityLoading}>
                      {securityLoading ? "Updating..." : securityMode === "otp" ? "Reset Password" : "Change Password"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div>
              <div className="card shadow-sm border-0 mb-4 p-4">
                <h4 className="mb-3">Order Statistics</h4>
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="border rounded-3 p-3 h-100">
                      <p className="text-muted mb-2">Total Orders</p>
                      <h3>{ordersStats.total}</h3>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="border rounded-3 p-3 h-100">
                      <p className="text-muted mb-2">Completed</p>
                      <h3>{ordersStats.completed}</h3>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="border rounded-3 p-3 h-100">
                      <p className="text-muted mb-2">Pending</p>
                      <h3>{ordersStats.pending}</h3>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card shadow-sm border-0 p-4">
                <h5>Quick Cards</h5>
                <div className="row g-3 mt-2">
                  <div className="col-sm-4">
                    <div className="bg-light rounded-3 p-3 text-center h-100">
                      <div className="fs-4">📦</div>
                      <p className="mb-1">Orders</p>
                      <strong>{ordersStats.total}</strong>
                    </div>
                  </div>
                  <div className="col-sm-4">
                    <div className="bg-light rounded-3 p-3 text-center h-100">
                      <div className="fs-4">❤️</div>
                      <p className="mb-1">Wishlist</p>
                      <strong>{wishlistCount}</strong>
                    </div>
                  </div>
                  <div className="col-sm-4">
                    <div className="bg-light rounded-3 p-3 text-center h-100">
                      <div className="fs-4">⭐</div>
                      <p className="mb-1">Ratings</p>
                      <strong>{ratings.length}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "wishlist" && (
            <div className="card shadow-sm border-0 p-4">
              <h4 className="mb-3">Wishlist Summary</h4>
              <p className="mb-3">You have <strong>{wishlistCount}</strong> saved item(s) in your wishlist.</p>
              <p className="text-muted">Wishlist is available from the main menu, and your saved products remain ready for checkout.</p>
            </div>
          )}

          {activeTab === "ratings" && (
            <div className="card shadow-sm border-0 p-4">
              <h4 className="mb-3">My Ratings</h4>
              {ratingLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status"></div>
                </div>
              ) : ratings.length === 0 ? (
                <div className="text-muted">You have not rated any products yet.</div>
              ) : (
                <div className="list-group">
                  {ratings.map((item) => (
                    <div key={item._id} className="list-group-item border-0 shadow-sm mb-2 rounded-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <p className="fw-bold mb-1">{item.productId?.name || "Unknown Product"}</p>
                          <p className="text-muted small mb-1">Rated on {new Date(item.createdAt).toLocaleDateString()}</p>
                          <div className="d-flex align-items-center gap-2">
                            {Array.from({ length: 5 }, (_, index) => (
                              <span key={index}>{index < item.rating ? "⭐" : "☆"}</span>
                            ))}
                          </div>
                        </div>
                        <div className="text-end">
                          <select
                            className="form-select form-select-sm"
                            value={item.rating}
                            onChange={(e) => handleRatingUpdate(item._id, Number(e.target.value))}
                          >
                            {[1, 2, 3, 4, 5].map((value) => (
                              <option key={value} value={value}>{value} Star{value > 1 ? "s" : ""}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "coupons" && (
            <div className="card shadow-sm border-0 p-4">
              <h4 className="mb-3">Saved Coupons</h4>
              {coupons.length === 0 ? (
                <div className="text-muted">No coupons available right now.</div>
              ) : (
                <div className="row g-3">
                  {coupons.map((coupon) => (
                    <div key={coupon._id} className="col-md-6">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                          <h5 className="mb-2">{coupon.code}</h5>
                          <p className="small text-muted mb-3">{coupon.description || "Use this coupon at checkout."}</p>
                          <button
                            className="btn btn-outline-primary btn-sm"
                            type="button"
                            onClick={() => copyCoupon(coupon.code)}
                          >
                            Copy Coupon
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
