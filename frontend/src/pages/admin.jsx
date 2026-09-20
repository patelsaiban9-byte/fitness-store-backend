import React, { useState, useEffect } from "react";
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
      style={{ width: "90%", maxWidth: "500px", zIndex: 1050 }}
    >
      {message}
      <button type="button" className="btn-close" onClick={onClose}></button>
    </div>
  );
};

function Admin() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState({
    name: "",
    category: "Supplements",
    description: "",
    price: "",
    image: "",
    stock: "",
    minimumStockThreshold: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products`);
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      showToast("Failed to fetch products.", "danger");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // ✅ FIXED IMAGE UPLOAD — stores file permanently in backend/upload/
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.imageUrl) {
        // ✅ Save backend file path (e.g., /upload/filename.jpg)
        setForm((prev) => ({ ...prev, image: data.imageUrl }));
        showToast("Image uploaded successfully!", "success");
      } else {
        showToast(data.message || "Image upload failed.", "danger");
      }
    } catch (err) {
      console.error("Upload error:", err);
      showToast("An error occurred during image upload.", "danger");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // ✅ FIX: Only require an image if adding a NEW product AND no image is set.
    if (!editingId && !form.image) {
      showToast("Please upload an image first.", "warning");
      return;
    }

    try {
      const url = editingId
        ? `${API_URL}/api/products/${editingId}`
        : `${API_URL}/api/products`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok || res.status === 200 || res.status === 201) {
        showToast(
          editingId ? "Product updated successfully!" : "Product added successfully!",
          "success"
        );
        setForm({ name: "", category: "Supplements", description: "", price: "", image: "", stock: "", minimumStockThreshold: "" });
        setEditingId(null);
        fetchProducts();
      } else {
        const errorData = await res.json();
        showToast(
          errorData.message || `Error saving product: ${res.statusText}`,
          "danger"
        );
      }
    } catch (error) {
      console.error("Error saving product:", error);
      showToast("An error occurred while saving the product.", "danger");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`${API_URL}/api/products/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Product deleted successfully!", "success");
        fetchProducts();
      } else {
        const errorData = await res.json();
        showToast(
          errorData.message || `Error deleting product: ${res.statusText}`,
          "danger"
        );
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      showToast("An error occurred while deleting the product.", "danger");
    }
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name,
      category: product.category || "Supplements",
      description: product.description,
      price: product.price,
      image: product.image,
      stock: product.stock || 0,
      minimumStockThreshold: product.minimumStockThreshold || 5,
    });
    setEditingId(product._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Function to correctly construct the image URL
  const getImageUrl = (img) => {
    if (!img) return "";
    
    // ✅ If already a full URL (Cloudinary or external), return as-is
    if (img.startsWith('http://') || img.startsWith('https://')) {
      return img;
    }
    
    // ✅ If relative path, prepend API_URL (for old local images)
    return `${API_URL}/${img.replace(/^\/+/, "")}`;
  };

  const categoryOptions = Array.from(
    new Set(
      products
        .map((product) => product.category)
        .filter((category) => category && category.trim())
    )
  ).sort((a, b) => a.localeCompare(b));

  // Filter products based on search query and admin filters
  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      product.name.toLowerCase().includes(query) ||
      (product.category || "").toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query) ||
      product.price.toString().includes(query);

    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;

    const stockValue = Number(product.stock ?? -1);
    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "in-stock" && stockValue > 0) ||
      (stockFilter === "low-stock" &&
        product.stock != null &&
        stockValue <= Number(product.minimumStockThreshold || 5) &&
        stockValue > 0) ||
      (stockFilter === "out-of-stock" && stockValue === 0) ||
      (stockFilter === "not-tracked" && product.stock == null);

    return matchesSearch && matchesCategory && matchesStock;
  });

  const PAGE_SIZE = 8;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, stockFilter]);

  const paginatedProducts = filteredProducts.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  );

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1).slice(
    0,
    Math.min(totalPages, 3)
  );

  const totalStock = products.reduce((sum, product) => {
    const stock = Number(product.stock ?? 0);
    return Number.isFinite(stock) ? sum + stock : sum;
  }, 0);

  const lowStockProducts = products.filter(
    (product) =>
      product.stock != null &&
      Number(product.stock) <= Number(product.minimumStockThreshold || 5)
  );

  const averagePrice =
    products.length > 0
      ? products.reduce((sum, product) => sum + Number(product.price || 0), 0) /
        products.length
      : 0;

  const categoryCount = new Set(
    products
      .map((product) => product.category)
      .filter((category) => category && category.trim())
  ).size;

  const summaryStats = [
    {
      label: "Total Products",
      value: products.length,
      icon: "🛍️",
      accent: "#e0f2fe",
      color: "#0f172a",
    },
    {
      label: "Inventory Stock",
      value: totalStock,
      icon: "📦",
      accent: "#dcfce7",
      color: "#14532d",
    },
    {
      label: "Low Stock Alerts",
      value: lowStockProducts.length,
      icon: "⚠️",
      accent: "#fef3c7",
      color: "#92400e",
    },
    {
      label: "Average Price",
      value: `₹${averagePrice.toFixed(2)}`,
      icon: "💰",
      accent: "#f3e8ff",
      color: "#6b21a8",
    },
    {
      label: "Categories",
      value: categoryCount,
      icon: "🏷️",
      accent: "#dbeafe",
      color: "#1d4ed8",
    },
  ];

  return (
    <div className="container py-4">
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <h1 className="text-center mb-4">
        🛒 <strong>Admin Dashboard</strong>
      </h1>

      <div className="text-center mb-4 d-flex justify-content-center gap-3 flex-wrap">
        <Link to="/admin/orders" className="btn btn-primary">
          📦 View All Orders
        </Link>
        <Link to="/admin/users" className="btn btn-primary">
          👥 Manage Users
        </Link>
        <Link to="/admin/coupons" className="btn btn-primary">
          🎟️ Manage Coupons
        </Link>
        <Link to="/admin/reports" className="btn btn-primary">
          � View Sales Reports
        </Link>
        <Link to="/admin/feedback" className="btn btn-primary">
          📝 View Feedback
        </Link>
      </div>

      <div className="mb-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <h3 className="mb-0 fw-bold">Overview</h3>
          <span className="text-muted small">Live inventory snapshot</span>
        </div>

        <div className="row g-3">
          {summaryStats.map((stat) => (
            <div className="col-sm-6 col-lg" key={stat.label}>
              <div
                className="card border-0 h-100"
                style={{
                  background: `linear-gradient(135deg, ${stat.accent} 0%, #ffffff 100%)`,
                  border: "1px solid rgba(148, 163, 184, 0.18)",
                  boxShadow: "0 12px 24px rgba(15, 23, 42, 0.06)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span
                      className="d-inline-flex align-items-center justify-content-center rounded-circle"
                      style={{
                        width: 46,
                        height: 46,
                        background: "rgba(255,255,255,0.7)",
                        fontSize: "1.25rem",
                        boxShadow: "0 4px 10px rgba(15, 23, 42, 0.08)",
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

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h2 className="card-title">
            {editingId ? "✏️ Edit Product" : "➕ Add New Product"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="name" className="form-label">
                Product Name
              </label>
              <input
                id="name"
                type="text"
                name="name"
                placeholder="Product Name"
                value={form.name}
                onChange={handleChange}
                className="form-control"
                required
                autoComplete="off"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <input
                id="description"
                type="text"
                name="description"
                placeholder="Description"
                value={form.description}
                onChange={handleChange}
                className="form-control"
                required
                autoComplete="off"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="category" className="form-label">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="Supplements">Supplements</option>
                <option value="Fitness Gear">Fitness Gear</option>
                <option value="Training Guides">Training Guides</option>
                <option value="Energy Boosters">Energy Boosters</option>
                <option value="General">General</option>
              </select>
            </div>

            <div className="mb-3">
              <label htmlFor="price" className="form-label">
                Price
              </label>
              <input
                id="price"
                type="number"
                name="price"
                placeholder="Price"
                value={form.price}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="stock" className="form-label">
                  📦 Stock Quantity
                </label>
                <input
                  id="stock"
                  type="number"
                  name="stock"
                  placeholder="Available Stock (leave empty to not track)"
                  value={form.stock}
                  onChange={handleChange}
                  className="form-control"
                  min="0"
                />
                <small className="text-muted">
                  Leave empty to allow unlimited purchases
                </small>
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="minimumStockThreshold" className="form-label">
                  ⚠️ Low Stock Alert Threshold
                </label>
                <input
                  id="minimumStockThreshold"
                  type="number"
                  name="minimumStockThreshold"
                  placeholder="Minimum Stock Level"
                  value={form.minimumStockThreshold}
                  onChange={handleChange}
                  className="form-control"
                  min="0"
                />
                <small className="text-muted">
                  Email alert when stock reaches this level (only if tracking stock)
                </small>
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="image" className="form-label">
                Product Image (Upload new to replace)
              </label>
              <input
                id="image"
                type="file"
                name="image"
                accept="image/*"
                onChange={handleImageUpload}
                className="form-control"
                // ✅ FIX 1: Only require image for new products
                required={!editingId && !form.image}
              />
              {form.image && (
                <img
                  // ✅ FIX 2: Correct casing
                  src={getImageUrl(form.image)}
                  alt="preview"
                  className="img-thumbnail mt-2"
                  style={{ height: "60px", width: "60px", objectFit: "cover" }}
                />
              )}
            </div>

            <button type="submit" className="btn btn-primary w-100">
              {editingId ? "✏️ Update Product" : "➕ Add Product"}
            </button>

            {editingId && (
              <button
                type="button"
                className="btn btn-secondary w-100 mt-2"
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    name: "",
                    category: "Supplements",
                    description: "",
                    price: "",
                    image: "",
                    stock: "",
                    minimumStockThreshold: "",
                  });
                }}
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>
      </div>

      <h2 className="mb-3">All Products</h2>

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-3 align-items-center">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-primary text-white">
                  🔍
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search products..."
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
                    ✕
                  </button>
                )}
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">Category ▼</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
              >
                <option value="all">Stock Status ▼</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
                <option value="not-tracked">Not Tracked</option>
              </select>
            </div>
            <div className="col-md-1 text-end">
              <div className="text-muted small">
                {filteredProducts.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered table-hover align-middle">
          <thead className="table-light">
            <tr className="text-center">
              <th>Name</th>
              <th>Category</th>
              <th>Description</th>
              <th>Price</th>
              <th>Stock Status</th>
              <th>Image</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  <div className="text-muted">
                    {searchQuery || categoryFilter !== "all" || stockFilter !== "all"
                      ? "No products match the current filters"
                      : "No products available"}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedProducts.map((p) => (
                <tr key={p._id} className="text-center">
                  <td>{p.name}</td>
                  <td>{p.category || "General"}</td>
                  <td>{p.description}</td>
                  <td>₹{p.price}</td>
                  <td>
                    {p.stock == null ? (
                      <span className="badge bg-secondary">Stock Not Tracked</span>
                    ) : p.stock === 0 ? (
                      <span className="badge bg-danger">Out of Stock</span>
                    ) : p.stock <= (p.minimumStockThreshold || 5) ? (
                      <span className="badge bg-warning text-dark">
                        Low Stock: {p.stock} units
                      </span>
                    ) : (
                      <span className="badge bg-success">
                        In Stock: {p.stock} units
                      </span>
                    )}
                    {p.stock != null && (
                      <div className="small text-muted mt-1">
                        Alert at: {p.minimumStockThreshold || 5} units
                      </div>
                    )}
                  </td>
                  <td>
                    {p.image && (
                      <img
                        src={getImageUrl(p.image)}
                        alt={p.name}
                        className="img-thumbnail mx-auto d-block"
                        style={{ height: "40px", width: "40px", objectFit: "cover" }}
                      />
                    )}
                  </td>
                  <td>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleEdit(p);
                      }}
                      className="btn btn-warning btn-sm me-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="btn btn-danger btn-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredProducts.length > 0 && (
        <div className="d-flex justify-content-center align-items-center flex-wrap gap-2 mt-4">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={safeCurrentPage === 1}
          >
            ← Previous
          </button>

          {pageNumbers.map((page) => (
            <button
              key={page}
              type="button"
              className={`btn btn-sm ${safeCurrentPage === page ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={safeCurrentPage === totalPages}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default Admin;