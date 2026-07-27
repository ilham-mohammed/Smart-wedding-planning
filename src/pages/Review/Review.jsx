import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../firebase'; // ✅ must be correct path
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import './Review.css';

// Static reviews – always visible
const staticReviews = [
  {
    id: 1,
    couple: "Arjun & Priyanki",
    text: "Our beach wedding in Trincomalee was magical! Every detail was handled with care. The coordination was seamless.",
    image: "https://i.postimg.cc/VvvYmgZM/uncle-pours-water-over-fingers-260nw-1127790557.webp"
  },
  {
    id: 2,
    couple: "Tharindu & Nilani",
    text: "The vendor selection is top-notch. Highly professional team in the Eastern Province. They made our big day stress-free.",
    image: "https://i.postimg.cc/Pf0xdshL/sri-lankan-traditional-kandyan-wedding-260nw-2249863807.webp"
  }
];

const Review = () => {
  const [firestoreReviews, setFirestoreReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    coupleNames: '',
    reviewText: '',
    imageUrl: ''
  });
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });

  // Fetch approved reviews from Firestore
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const q = query(collection(db, 'reviews'), where('approved', '==', true));
        const querySnapshot = await getDocs(q);
        const reviewsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFirestoreReviews(reviewsData);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const allReviews = [...staticReviews, ...firestoreReviews];

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus({ type: '', message: '' });

    try {
      const docRef = await addDoc(collection(db, 'reviews'), {
        couple: formData.coupleNames,
        text: formData.reviewText,
        image: formData.imageUrl || 'https://via.placeholder.com/300?text=No+Image',
        approved: false,
        createdAt: new Date()
      });
      console.log("Review submitted with ID:", docRef.id);
      setSubmitStatus({ type: 'success', message: 'Thank you! Your review has been submitted for admin approval.' });
      setFormData({ coupleNames: '', reviewText: '', imageUrl: '' });
      setTimeout(() => closeModal(), 2000);
    } catch (error) {
      console.error("Firestore error:", error);
      setSubmitStatus({ type: 'error', message: `Failed to submit review: ${error.message}` });
    }
  };

  if (loading) return <div className="review-page"><p>Loading reviews...</p></div>;

  return (
    <div className="review-page">
      <div className="top-bar">
        <Link to="/" className="back-home-btn">← Back to Home</Link>
        <button className="btn-add-review" onClick={openModal}>+ Add Your Review</button>
      </div>

      <div className="review-container">
        <h2 className="gold-title">Couple Reviews</h2>

        <div className="reviews-grid">
          {allReviews.map(review => (
            <div className="review-card" key={review.id}>
              <img src={review.image} alt={review.couple} className="review-image" />
              <div className="review-content">
                <i className="fas fa-quote-left quote-icon"></i>
                <p className="review-text">{review.text}</p>
                <strong className="couple-name">- {review.couple}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="footer">
        <p>© 2026 Smart Wedding Planning | Trincomalee, Sri Lanka 💍</p>
      </footer>

      {/* Modal for adding review */}
      {modalOpen && (
        <div className="review-modal" onClick={closeModal}>
          <div className="review-modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-modal" onClick={closeModal}>&times;</span>
            <h3>Write a Review</h3>
            {submitStatus.message && (
              <div className={`submit-status ${submitStatus.type}`}>
                {submitStatus.message}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Couple Names</label>
                <input
                  type="text"
                  name="coupleNames"
                  placeholder="e.g. Sam & Sara"
                  value={formData.coupleNames}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Your Review</label>
                <textarea
                  name="reviewText"
                  rows="4"
                  placeholder="Share your experience..."
                  value={formData.reviewText}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>
              <div className="form-group">
                <label>Image URL (optional)</label>
                <input
                  type="url"
                  name="imageUrl"
                  placeholder="https://example.com/your-photo.jpg"
                  value={formData.imageUrl}
                  onChange={handleChange}
                />
              </div>
              <p className="approval-note">* Your review will be visible once approved by Admin.</p>
              <button type="submit" className="btn-submit-review">Submit for Approval</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Review;