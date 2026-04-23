import React, { useEffect, useMemo, useState } from "react";

function AdminFeedback() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const fetchFeedback = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/feedback/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setFeedbackList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch admin feedback error:", error);
      setFeedbackList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem("adminFeedbackLastSeenAt", String(Date.now()));
    window.dispatchEvent(new Event("feedbackUpdated"));
    fetchFeedback();
  }, []);

  const filteredFeedback = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return feedbackList;

    return feedbackList.filter((item) => {
      return (
        String(item.userName || "").toLowerCase().includes(query) ||
        String(item.userEmail || "").toLowerCase().includes(query) ||
        String(item.message || "").toLowerCase().includes(query) ||
        String(item.rating || "").includes(query)
      );
    });
  }, [feedbackList, searchQuery]);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h2 className="mb-1">Customer Feedback</h2>
          <p className="text-muted mb-0">All feedback submitted by users</p>
        </div>
        <span className="badge bg-primary fs-6">Total: {feedbackList.length}</span>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <input
            type="text"
            className="form-control"
            placeholder="Search by name, email, rating, or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          {loading ? (
            <p className="mb-0">Loading feedback...</p>
          ) : filteredFeedback.length === 0 ? (
            <p className="text-muted mb-0">No feedback found.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped align-middle">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Rating</th>
                    <th>Message</th>
                    <th>Submitted At</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeedback.map((item) => (
                    <tr key={item._id}>
                      <td>{item.userName}</td>
                      <td>{item.userEmail}</td>
                      <td>{item.rating} / 5</td>
                      <td style={{ minWidth: "240px" }}>{item.message}</td>
                      <td>{new Date(item.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminFeedback;
