import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import './Review.css';

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

const uploadImageToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'wedding_planning');

  const response = await fetch(
    'https://api.cloudinary.com/v1_1/dcjfpouji/image/upload',
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok || !data.secure_url) {
    throw new Error(
      data?.error?.message || 'Image upload failed. Check Cloudinary settings.'
    );
  }

  return data.secure_url;
};

const Review = () => {
  const [firestoreReviews, setFirestoreReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    coupleNames: '',
    reviewText: '',
    image: null
  });

  const [submitStatus, setSubmitStatus] = useState({
    type: '',
    message: ''
  });

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const q = query(
          collection(db, 'reviews'),
          where('approved', '==', true)
        );

        const querySnapshot = await getDocs(q);

        const reviewsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setFirestoreReviews(reviewsData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const allReviews = [...staticReviews, ...firestoreReviews];

  const openModal = () => setModalOpen(true);

  const closeModal = () => {
    setModalOpen(false);
    setPreview(null);
    setSubmitStatus({ type: '', message: '' });
    setFormData({
      coupleNames: '',
      reviewText: '',
      image: null
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setFormData({
      ...formData,
      image: file
    });

    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus({ type: '', message: '' });

    try {
      let imageUrl = 'https://via.placeholder.com/300?text=No+Image';

      if (formData.image) {
        imageUrl = await uploadImageToCloudinary(formData.image);
      }

      await addDoc(collection(db, 'reviews'), {
        couple: formData.coupleNames,
        text: formData.reviewText,
        image: imageUrl,
        approved: false,
        createdAt: new Date()
      });

      setSubmitStatus({
        type: 'success',
        message: 'Thank you! Your review has been submitted for admin approval.'
      });

      setFormData({
        coupleNames: '',
        reviewText: '',
        image: null
      });

      setPreview(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setTimeout(() => {
        closeModal();
      }, 2000);

    } catch (error) {
      console.error(error);

      setSubmitStatus({
        type: 'error',
        message: error.message
      });
    }
  };

  if (loading) {
    return (
      <div className="review-page">
        <p>Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="review-page">
      <div className="top-bar">
        <Link to="/" className="back-home-btn">
          ← Back to Home
        </Link>

        <button className="btn-add-review" onClick={openModal}>
          + Add Your Review
        </button>
      </div>

      <div className="review-container">
        <h2 className="gold-title">Couple Reviews</h2>

        <div className="reviews-grid">
          {allReviews.map(review => (
            <div className="review-card" key={review.id}>
              <img
                src={review.image}
                alt={review.couple}
                className="review-image"
              />

              <div className="review-content">
                <i className="fas fa-quote-left quote-icon"></i>

                <p className="review-text">{review.text}</p>

                <strong className="couple-name">
                  - {review.couple}
                </strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="footer">
        <p>© 2026 Smart Wedding Planning | Trincomalee, Sri Lanka 💍</p>
      </footer>

      {modalOpen && (
        <div className="review-modal" onClick={closeModal}>
          <div
            className="review-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="close-modal" onClick={closeModal}>
              &times;
            </span>

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
                <label>Upload Photo (Optional)</label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />

                {preview && (
                  <img
                    src={preview}
                    alt="Preview"
                    style={{
                      width: "150px",
                      marginTop: "10px",
                      borderRadius: "10px"
                    }}
                  />
                )}
              </div>

              <p className="approval-note">
                * Your review will be visible once approved by Admin.
              </p>

              <button
                type="submit"
                className="btn-submit-review"
              >
                Submit for Approval
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Review;