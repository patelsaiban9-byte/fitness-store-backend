import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Feedback() {
  const navigate = useNavigate();
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [myFeedback, setMyFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    type: "info",
    text: "",
  });

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const token = localStorage.getItem("token");
  const savedName = localStorage.getItem("name") || "";
  const savedEmail = localStorage.getItem("email") || "";

  const showNotification = (text, type = "info") => {
    setNotification({ show: true, type, text });
    setTimeout(() => {
      setNotification({ show: false, type: "info", text: "" });
    }, 3000);
  };

  const fetchMyFeedback = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/feedback/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setMyFeedback(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch my feedback error:", error);
      setMyFeedback([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyFeedback();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      showNotification("Please login first", "warning");
      return;
    }

    const safeMessage = message.trim();
    if (safeMessage.length < 5) {
      showNotification("Please write at least 5 characters", "warning");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch(`${API_URL}/api/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating,
          message: safeMessage,
          userName: savedName,
          userEmail: savedEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showNotification(data.message || "Failed to submit feedback", "danger");
        return;
      }

      showNotification("Thank you. Your feedback has been submitted.", "success");
      setMessage("");
      setRating(5);
      fetchMyFeedback();
    } catch (error) {
      console.error("Submit feedback error:", error);
      showNotification("Failed to submit feedback", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="mb-3">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate("/products")}
            >
              ← Back to Products
            </button>
          </div>

          {notification.show && (
            <div
              className={`alert alert-${notification.type} alert-dismissible fade show`}
              role="alert"
            >
              {notification.text}
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() =>
                  setNotification({ show: false, type: "info", text: "" })
                }
              ></button>
            </div>
          )}

          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h2 className="mb-3">Feedback</h2>
              <p className="text-muted">Share your experience with our store.</p>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Rating</label>
                  <div>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="btn p-0 me-2"
                        onClick={() => setRating(star)}
                        aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                        title={`${star} star${star > 1 ? "s" : ""}`}
                        style={{
                          fontSize: "1.8rem",
                          lineHeight: 1,
                          color: star <= rating ? "#f59e0b" : "#d1d5db",
                          border: "none",
                          background: "transparent",
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <small className="text-muted">Selected: {rating} / 5</small>
                </div>

                <div className="mb-3">
                  <label className="form-label">Message</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder="Write your feedback..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>

                <button className="btn btn-primary" type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Feedback"}
                </button>
              </form>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-body">
              <h4 className="mb-3">My Previous Feedback</h4>

              {loading ? (
                <p>Loading...</p>
              ) : myFeedback.length === 0 ? (
                <p className="text-muted mb-0">No feedback submitted yet.</p>
              ) : (
                <div className="list-group">
                  {myFeedback.map((item) => (
                    <div key={item._id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <strong>{"★".repeat(item.rating)}</strong>
                        <small className="text-muted">
                          {new Date(item.createdAt).toLocaleString()}
                        </small>
                      </div>
                      <p className="mb-0">{item.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Feedback;
