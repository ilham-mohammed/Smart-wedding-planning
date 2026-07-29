import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './About.css';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db }  from "../../firebase";

function About() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    await addDoc(collection(db, "contactMessages"), {
      name: form.name,
      email: form.email,
      message: form.message,
      createdAt: serverTimestamp(),
    });

    setSubmitted(true);
    setForm({
      name: "",
      email: "",
      message: "",
    });

  } catch (error) {
    console.error("Error sending message:", error);
    alert("Failed to send message. Please try again.");
  } finally {
    setLoading(false);
  }
};

  const handleDismiss = () => setSubmitted(false);

  return (
    <div className="about-page">

      {/* Success Notification */}
      {submitted && (
        <div className="success-toast">
          <div className="toast-icon">✉️</div>
          <div className="toast-text">
            <strong>Message Received!</strong>
            <span>Thank you! We'll get back to you soon. 💍</span>
          </div>
          <button className="toast-close" onClick={handleDismiss}>✕</button>
        </div>
      )}

      {/* Back to Home */}
      <div className="back-home-link">
        <Link to="/">← Back to Home</Link>
      </div>

      {/* Hero Section */}
      <div className="about-hero">
        <h1>About Us</h1>
        <p>Your dream wedding, perfectly planned.</p>
      </div>

      <div className="about-content">

        {/* Our Story */}
        <div className="about-section">
          <h2>Our Story</h2>
          <p>
            WeddingBliss was born from a passion to make every couple's special day
            stress-free and magical. We believe that your wedding should reflect your
            unique love story, and we're here to help you craft it.
          </p>
          <p>
            Founded in 2026, our platform connects you with the best vendors,
            curated packages, and expert planning tools – all in one place.
          </p>
        </div>

        {/* Mission */}
        <div className="about-section">
          <h2>Our Mission</h2>
          <p>
            To simplify wedding planning by offering a seamless, personalised
            experience that lets you focus on what truly matters – celebrating your love.
          </p>
        </div>

        {/* Contact Section */}
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
              <p>hello@weddingplan.com</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="contact-form">
            <h3>Send us a message</h3>

            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                required
                value={form.name}
                onChange={handleChange}
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                required
                value={form.email}
                onChange={handleChange}
              />
              <textarea
                name="message"
                placeholder="Your Message"
                rows="4"
                required
                value={form.message}
                onChange={handleChange}
              ></textarea>
              <button type="submit" disabled={loading} className={loading ? 'btn-loading' : ''}>
                {loading ? (
                  <span className="btn-spinner">Sending...</span>
                ) : (
                  'Send Message'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Admin Dashboard Link */}
      <div className="account-links">
        <Link to="/admin-login" className="admin-link">
          Go to Admin Dashboard
        </Link>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>© 2026 Smart Wedding Planning | Trincomalee, Sri Lanka 💍</p>
      </footer>

    </div>
  );
}

export default About;