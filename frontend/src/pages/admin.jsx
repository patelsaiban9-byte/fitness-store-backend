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

  // Filter products based on search query
  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      (product.category || "").toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query) ||
      product.price.toString().includes(query)
    );
  });

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
        <Link to="/admin/reports" className="btn btn-primary">
          � View Sales Reports
        </Link>
        <Link to="/admin/feedback" className="btn btn-primary">
          📝 View Feedback
        </Link>
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
      
      {/* Search Bar */}
      <div className="card shadow-sm mb-3">
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
                  placeholder="Search products by name, category, description, or price..."
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
                Showing {filteredProducts.length} of {products.length} products
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
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  <div className="text-muted">
                    {searchQuery
                      ? `No products found matching "${searchQuery}"`
                      : "No products available"}
                  </div>
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => (
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
                      // ✅ FIX 3: Correct casing for display
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
    </div>
  );
}

export default Admin;