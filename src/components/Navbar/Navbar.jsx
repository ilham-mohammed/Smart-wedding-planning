import React from 'react';
import { Link } from 'react-router-dom';
import './About.css';

function About() {
  return (
    <div className="about-page">
      {/* Back to Home link */}
      <div className="back-home">
        <Link to="/">← Back to Home</Link>
      </div>

      {/* Hero section */}
      <div className="about-hero">
        <h1>About Us</h1>
        <p>Your dream wedding, perfectly planned.</p>
      </div>

      {/* Rest of the content remains the same */}
      <div className="about-content">
        <div className="about-section">
          <h2>Our Story</h2>
          <p>
            WeddingBliss was born from a passion to make every couple's special day
            stress‑free and magical. We believe that your wedding should reflect your
            unique love story, and we're here to help you craft it.
          </p>
          <p>
            Founded in 2026, our platform connects you with the best vendors,
            curated packages, and expert planning tools – all in one place.
          </p>
        </div>

        <div className="about-section">
          <h2>Our Mission</h2>
          <p>
            To simplify wedding planning by offering a seamless, personalised
            experience that lets you focus on what truly matters – celebrating your love.
          </p>
        </div>

        <div className="about-section">
          <h2>Why Choose Us?</h2>
          <ul className="features-list">
            <li>✅ Trusted vendors with verified reviews</li>
            <li>✅ Customisable packages to fit any budget</li>
            <li>✅ Easy online booking and payment</li>
            <li>✅ Dedicated support team</li>
          </ul>
        </div>

        <div className="contact-section">
          <h2>Contact Us</h2>
          <div className="contact-details">
            <div className="contact-card">
              <div className="contact-icon">📍</div>
              <h3>Address</h3>
              <p>123 Wedding Street,<br />Trincomalee, Sri Lanka</p>
            </div>
            <div className="contact-card">
              <div className="contact-icon">📞</div>
              <h3>Phone</h3>
              <p>+94 123 456 789</p>
            </div>
            <div className="contact-card">
              <div className="contact-icon">✉️</div>
              <h3>Email</h3>
              <p>hello@weddingbliss.com</p>
            </div>
          </div>

          <div className="contact-form">
            <h3>Send us a message</h3>
            <form>
              <input type="text" placeholder="Your Name" required />
              <input type="email" placeholder="Your Email" required />
              <textarea placeholder="Your Message" rows="4" required></textarea>
              <button type="submit">Send Message</button>
            </form>
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>© 2026 Smart Wedding Planning | Trincomalee, Sri Lanka 💍</p>
      </footer>
    </div>
  );
}

export default About;