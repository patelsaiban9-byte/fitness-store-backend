import React from "react";
import { useNavigate } from "react-router-dom";
import "./about.css";

function About() {
  const navigate = useNavigate();

  const handleShopNow = () => {
    navigate("/products");
  };

  const handleJoinCommunity = () => {
    navigate("/register");
  };

  return (
    <div className="about-page">
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="container hero-content">
          <div className="hero-text">
            <h1 className="hero-title">Health & Fitness Store</h1>
            <p className="hero-subtitle">Transform Your Body, Elevate Your Life</p>
            <p className="hero-description">
              Your premier destination for premium fitness products, expert guidance, and a supportive community dedicated to your wellness journey.
            </p>
            <button className="btn btn-light btn-lg hero-btn" onClick={handleJoinCommunity}>
              Join Our Community
            </button>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="values-section">
        <div className="container">
          <h2 className="section-title">Our Core Values</h2>
          <div className="row g-4 mt-4">
            
            {/* Mission Card */}
            <div className="col-lg-4 col-md-6">
              <div className="value-card">
                <div className="icon-wrapper mission-icon">
                  <span className="icon-text">🎯</span>
                </div>
                <h3 className="card-title">Our Mission</h3>
                <p className="card-text">
                  Empower individuals to achieve their health and fitness goals through premium products and expert guidance.
                </p>
              </div>
            </div>
            
            {/* Team Card */}
            <div className="col-lg-4 col-md-6">
              <div className="value-card">
                <div className="icon-wrapper team-icon">
                  <span className="icon-text">👥</span>
                </div>
                <h3 className="card-title">Expert Team</h3>
                <p className="card-text">
                  Certified trainers and nutrition experts dedicated to supporting your journey every step of the way.
                </p>
              </div>
            </div>
            
            {/* Community Card */}
            <div className="col-lg-4 col-md-6">
              <div className="value-card">
                <div className="icon-wrapper community-icon">
                  <span className="icon-text">💪</span>
                </div>
                <h3 className="card-title">Community First</h3>
                <p className="card-text">
                  Join our thriving community of health enthusiasts and unlock exclusive content, tips, and member perks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="why-section">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <h2 className="section-title mb-4">Why Choose Us?</h2>
              <ul className="features-list">
                <li className="feature-item">
                  <span className="checkmark">✓</span>
                  <div>
                    <h4>Premium Quality</h4>
                    <p>Carefully curated products from trusted brands</p>
                  </div>
                </li>
                <li className="feature-item">
                  <span className="checkmark">✓</span>
                  <div>
                    <h4>Expert Guidance</h4>
                    <p>Personalized advice from certified professionals</p>
                  </div>
                </li>
                <li className="feature-item">
                  <span className="checkmark">✓</span>
                  <div>
                    <h4>Fast Delivery</h4>
                    <p>Quick and reliable shipping to your doorstep</p>
                  </div>
                </li>
                <li className="feature-item">
                  <span className="checkmark">✓</span>
                  <div>
                    <h4>24/7 Support</h4>
                    <p>Customer support team always ready to help</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="col-lg-6">
              <div className="stats-container">
                <div className="stat-box">
                  <h3>10K+</h3>
                  <p>Happy Customers</p>
                </div>
                <div className="stat-box">
                  <h3>500+</h3>
                  <p>Premium Products</p>
                </div>
                <div className="stat-box">
                  <h3>50+</h3>
                  <p>Expert Trainers</p>
                </div>
                <div className="stat-box">
                  <h3>15+</h3>
                  <p>Years Experience</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container text-center">
          <h2 className="cta-title">Ready to Start Your Fitness Journey?</h2>
          <p className="cta-subtitle">Join thousands of satisfied customers achieving their goals</p>
          <div className="cta-buttons">
            <button className="btn btn-success btn-lg" onClick={handleShopNow}>
              Shop Now
            </button>
            <button className="btn btn-outline-success btn-lg" onClick={handleShopNow}>
              Learn More
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;