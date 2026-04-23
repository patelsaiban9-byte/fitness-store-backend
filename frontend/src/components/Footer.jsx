import { Link } from "react-router-dom";
import "./footer.css";

function Footer({ isLoggedIn, userRole }) {
  const year = new Date().getFullYear();
  const isAdmin = isLoggedIn && userRole === "admin";

  const quickLinks = isAdmin
    ? [
        { to: "/admin", label: "Dashboard" },
        { to: "/admin/orders", label: "Orders" },
        { to: "/admin/returns", label: "Returns" },
        { to: "/admin/reports", label: "Reports" },
      ]
    : [
        { to: "/", label: "Home" },
        { to: "/products", label: "Products" },
        { to: "/cart", label: "Cart" },
        { to: "/about", label: "About" },
      ];

  const secondaryHeading = isAdmin ? "Management" : "Customer";
  const secondaryLinks = isAdmin
    ? [
        { to: "/admin/feedback", label: "Feedback" },
        { to: "/admin/users", label: "Users" },
      ]
    : [
        { to: "/my-orders", label: "My Orders" },
        { to: "/wishlist", label: "Wishlist" },
        { to: "/feedback", label: "Feedback" },
      ];

  return (
    <footer className="site-footer mt-5">
      <div className="container py-4">
        <div className="row g-4 align-items-start">
          <div className="col-12 col-md-6">
            <h5 className="footer-brand mb-2">Fitness Store</h5>
            <p className="footer-text mb-0">
              Premium fitness gear and supplements to support every step of your training journey.
            </p>
          </div>

          <div className="col-6 col-md-3">
            <h6 className="footer-heading">Quick Links</h6>
            <ul className="list-unstyled mb-0 footer-links">
              {quickLinks.map((item) => (
                <li key={item.to}>
                  <Link to={item.to}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-6 col-md-3">
            <h6 className="footer-heading">{secondaryHeading}</h6>
            <ul className="list-unstyled mb-0 footer-links">
              {secondaryLinks.map((item) => (
                <li key={item.to}>
                  <Link to={item.to}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom py-3">
        <div className="container d-flex flex-column flex-sm-row justify-content-between gap-2">
          <small>© {year} Fitness Store. All rights reserved.</small>
          <small>Built for your active lifestyle.</small>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
