import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div>
      {/* Navbar with original links + two buttons on the right */}
      <nav className="navbar">
        <div className="navbar-logo">💍 Wedding Planning</div>
        <ul className="navbar-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/packages">Packages</Link></li>
          <li><Link to="/vendors">Vendors</Link></li>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/review">Review</Link></li>
        </ul>
        <div className="navbar-right">
          <Link to="/account" className="customer-icon" aria-label="Account">
            👤
          </Link>
          <Link to="/login">
            <button className="navbar-btn">Login / Register</button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero">
        <div className="hero-content">
          <h1>Plan Your Dream Wedding</h1>
          <p>Find the best vendors, packages, and make your special day unforgettable.</p>
          <Link to="/packages">
            <button className="get-started-btn">Get Started</button>
          </Link>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="features">
        <div className="feature-card">
          <div className="feature-icon">📦</div>
          <h3>Packages</h3>
          <p>Explore our curated wedding packages to fit your style and budget.</p>
          <Link to="/packages">Learn More →</Link>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📸</div>
          <h3>Vendors</h3>
          <p>Choose from top-rated photographers, florists, and more.</p>
          <Link to="/vendors">Learn More →</Link>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⭐</div>
          <h3>Reviews</h3>
          <p>Read real reviews from happy couples.</p>
          <Link to="/review">Learn More →</Link>
        </div>
        <div className="feature-card">
          <div className="feature-icon">👤</div>
          <h3>Account</h3>
          <p>Manage your bookings and profile.</p>
          <Link to="/account">Learn More →</Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>© 2026 Smart Wedding Planning | Trincomalee, Sri Lanka 💍</p>
      </footer>
    </div>
  );
}

export default Home;