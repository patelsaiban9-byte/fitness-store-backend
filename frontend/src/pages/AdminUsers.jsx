import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
  };

  const fetchUsers = async (search = "") => {
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Admin token missing. Please login again.", "warning");
      return;
    }

    try {
      setLoading(true);
      const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
      const res = await fetch(`${API_URL}/api/admin/users${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "Failed to fetch users.", "danger");
        return;
      }

      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching users:", error);
      showToast("Failed to fetch users.", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleToggleStatus = async (user) => {
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Admin token missing. Please login again.", "warning");
      return;
    }

    const currentStatus = user.isActive !== false;
    const nextStatus = !currentStatus;
    const actionText = nextStatus ? "activate" : "deactivate";

    if (!window.confirm(`Are you sure you want to ${actionText} this user?`)) return;

    try {
      setActionLoadingId(user._id);
      const res = await fetch(`${API_URL}/api/admin/users/${user._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Failed to update user status.", "danger");
        return;
      }

      const baseMessage = data.message || "User status updated successfully.";
      if (data.emailNotificationSent === false) {
        showToast(`${baseMessage} User status changed, but email notification could not be sent.`, "warning");
      } else {
        showToast(baseMessage, "success");
      }
      fetchUsers(searchQuery);
    } catch (error) {
      console.error("Error updating user status:", error);
      showToast("Failed to update user status.", "danger");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (user) => {
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Admin token missing. Please login again.", "warning");
      return;
    }

    if (!window.confirm(`Delete user ${user.email}? This action cannot be undone.`)) return;

    try {
      setActionLoadingId(user._id);
      const res = await fetch(`${API_URL}/api/admin/users/${user._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Failed to delete user.", "danger");
        return;
      }

      showToast(data.message || "User deleted successfully.", "success");
      fetchUsers(searchQuery);
    } catch (error) {
      console.error("Error deleting user:", error);
      showToast("Failed to delete user.", "danger");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="container py-4">
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <h1 className="text-center mb-4">
        👥 <strong>User Management</strong>
      </h1>

      <div className="text-center mb-4 d-flex justify-content-center gap-2 flex-wrap">
        <Link to="/admin" className="btn btn-outline-primary">
          ← Back to Admin Dashboard
        </Link>
        <Link to="/admin/orders" className="btn btn-outline-success">
          📦 View Orders
        </Link>
      </div>

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="input-group">
                <span className="input-group-text bg-dark text-white">🔍</span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search users by name or email..."
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
            <div className="col-md-4 mt-2 mt-md-0 text-muted text-md-end">
              {loading ? "Loading users..." : `Showing ${users.length} user(s)`}
            </div>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered table-hover align-middle">
          <thead className="table-light">
            <tr className="text-center">
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && users.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-muted">
                  {searchQuery
                    ? `No users found matching "${searchQuery}"`
                    : "No users found"}
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isActive = user.isActive !== false;
                const isBusy = actionLoadingId === user._id;

                return (
                  <tr key={user._id} className="text-center">
                    <td>{user.name || "-"}</td>
                    <td>{user.email}</td>
                    <td>{user.phone || "-"}</td>
                    <td>
                      <span className={`badge ${isActive ? "bg-success" : "bg-danger"}`}>
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`btn btn-sm me-2 ${isActive ? "btn-warning" : "btn-success"}`}
                        disabled={isBusy}
                        onClick={() => handleToggleStatus(user)}
                      >
                        {isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={isBusy}
                        onClick={() => handleDeleteUser(user)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminUsers;
