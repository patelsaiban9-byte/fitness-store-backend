import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./home.css";

function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const heroSlides = useMemo(
    () => [
      {
        tag: "Built for Performance",
        title: "Build Your Perfect Body",
        description:
          "Top quality gym equipment, supplements, and daily essentials to support every phase of your fitness journey.",
        image:
          "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?auto=format&fit=crop&w=900&q=80",
      },
      {
        tag: "Strength Collection",
        title: "Train Harder Every Day",
        description:
          "Upgrade your setup with durable gear and performance-focused products trusted by fitness enthusiasts.",
        image:
          "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=900&q=80",
      },
      {
        tag: "Recovery and Nutrition",
        title: "Recover Faster Stay Consistent",
        description:
          "Shop nutrition and recovery essentials that help you stay energized, recover better, and hit your goals.",
        image:
          "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=900&q=80",
      },
    ],
    []
  );

  const categoryItems = useMemo(() => {
    const categories = [
      ...new Set(
        allProducts
          .map((item) => (item?.category || "").trim())
          .filter(Boolean)
      ),
    ].slice(0, 6);

    return categories.map((category) => {
      const badge = category
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase() || "")
        .join("");

      return {
        title: category,
        category,
        badge: badge || "CT",
      };
    });
  }, [allProducts]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/products`);
        const data = await res.json();

        if (Array.isArray(data)) {
          setAllProducts(data);
          setProducts(data.slice(0, 5));
        }
      } catch {
        setAllProducts([]);
        setProducts([]);
      }
    };

    fetchProducts();
  }, [API_URL]);

  useEffect(() => {
    const slideTimer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => {
      window.clearInterval(slideTimer);
    };
  }, [heroSlides.length]);

  const getImageUrl = (img) => {
    if (!img) return "https://via.placeholder.com/320x220?text=FitStore+Item";
    if (img.startsWith("http")) return img;
    return `${API_URL}/${img.replace(/^\/+/, "")}`;
  };

  const addToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingItem = cart.find((item) => item._id === product._id);

    if (existingItem) {
      existingItem.qty += 1;
    } else {
      cart.push({
        _id: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        qty: 1,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const currentSlide = heroSlides[activeSlide];

  return (
    <div className="home-page">
      <section className="fit-hero">
        <div className="fit-hero-shapes" aria-hidden="true"></div>

        <div className="fit-hero-content" key={activeSlide}>
          <div className="fit-hero-left">
            <span className="fit-hero-tag">{currentSlide.tag}</span>
            <h1>{currentSlide.title}</h1>
            <p>{currentSlide.description}</p>

            <div className="fit-hero-actions">
              <button
                type="button"
                className="fit-primary-btn"
                onClick={() => navigate("/products")}
              >
                Shop Now
              </button>
              <button
                type="button"
                className="fit-secondary-btn"
                onClick={() => navigate("/about")}
              >
                Learn More
              </button>
            </div>

            <div className="fit-hero-proof">
              <div className="fit-avatar-stack" aria-hidden="true">
                <span>A</span>
                <span>R</span>
                <span>K</span>
              </div>
              <small>10K+ happy customers</small>
            </div>
          </div>

          <div className="fit-hero-right" aria-hidden="true">
            <div className="fit-image-ring">
              <img
                src={currentSlide.image}
                alt={currentSlide.title}
              />
            </div>
          </div>
        </div>

        <div className="fit-slider-dots" aria-label="Hero slides">
          {heroSlides.map((slide, index) => (
            <button
              key={slide.title}
              type="button"
              className={index === activeSlide ? "active" : ""}
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => setActiveSlide(index)}
            ></button>
          ))}
        </div>
      </section>

      <section className="fit-section">
        <div className="fit-section-head">
          <h2>Shop by Category</h2>
          <button
            type="button"
            className="fit-link-btn"
            onClick={() => navigate("/products")}
          >
            View all categories
          </button>
        </div>

        <div className="fit-category-grid">
          {categoryItems.map((item) => (
            <button
              key={item.title}
              type="button"
              className="fit-category-card"
              onClick={() =>
                navigate(`/products/category/${encodeURIComponent(item.category)}`)
              }
            >
              <span className="fit-category-badge">{item.badge}</span>
              <span>{item.title}</span>
            </button>
          ))}

          {categoryItems.length === 0 && (
            <div className="fit-empty-state">
              <p>Categories will appear here once products are available.</p>
            </div>
          )}
        </div>
      </section>

      <section className="fit-section">
        <div className="fit-section-head">
          <h2>Featured Products</h2>
          <button
            type="button"
            className="fit-link-btn"
            onClick={() => navigate("/products")}
          >
            View all products
          </button>
        </div>

        <div className="fit-product-grid">
          {products.map((product) => {
            const mrp = Math.round(Number(product.price || 0) * 1.2);

            return (
              <article
                key={product._id}
                className="fit-product-card"
                onClick={() => navigate(`/product/${product._id}`)}
              >
                <div className="fit-product-image-wrap">
                  <img
                    src={getImageUrl(product.image)}
                    alt={product.name}
                    className="fit-product-image"
                  />
                </div>

                <div className="fit-product-content">
                  <h3>{product.name}</h3>
                  <p className="fit-rating">4.7 (120)</p>
                  <div className="fit-price-row">
                    <strong>Rs {product.price}</strong>
                    <span>Rs {mrp}</span>
                  </div>

                  <button
                    type="button"
                    className="fit-cart-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      addToCart(product);
                    }}
                  >
                    Add to Cart
                  </button>
                </div>
              </article>
            );
          })}

          {products.length === 0 && (
            <div className="fit-empty-state">
              <p>Products will appear here once inventory is loaded.</p>
            </div>
          )}
        </div>
      </section>

      <section className="fit-service-strip">
        {[
          {
            title: "Free Shipping",
            subtitle: "On orders over Rs 999",
            code: "FS",
          },
          {
            title: "Secure Payment",
            subtitle: "100 percent protected checkout",
            code: "SP",
          },
          {
            title: "Easy Returns",
            subtitle: "30 day return window",
            code: "ER",
          },
          {
            title: "24/7 Support",
            subtitle: "Our team is here to help",
            code: "CS",
          },
        ].map((item) => (
          <div key={item.title} className="fit-service-card">
            <span>{item.code}</span>
            <div>
              <h4>{item.title}</h4>
              <p>{item.subtitle}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export default Home;