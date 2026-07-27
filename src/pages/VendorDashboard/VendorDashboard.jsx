import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { db, auth } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import './VendorDashboard.css';

// ── Cloudinary Upload Function ──
const uploadImageToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'wedding_planning');

  const response = await fetch(
    'https://api.cloudinary.com/v1_1/dcjfpouji/image/upload',
    { method: 'POST', body: formData }
  );
  const data = await response.json();
  return data.secure_url;
};

const VendorDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [vendorData, setVendorData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookingsOnDate, setBookingsOnDate] = useState([]);

  // Post new service modal state
  const [showPostModal, setShowPostModal] = useState(false);
  const [postForm, setPostForm] = useState({
    name: '',
    category: 'Photography',
    price: '',
    desc: '',
    image: '',
    phone: '',
  });
  const [postError, setPostError] = useState('');
  const [postSuccess, setPostSuccess] = useState('');

  // Cloudinary image upload state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState('upload'); // 'upload' | 'url'

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/vendor-login'); return; }

    const fetchData = async () => {
      try {
        const vendorRef = doc(db, 'vendors', user.uid);
        const vendorSnap = await getDoc(vendorRef);

        if (!vendorSnap.exists()) {
          alert('Vendor profile not found. Please contact support.');
          navigate('/vendor-login');
          return;
        }
        setVendorData(vendorSnap.data());

        const bookingsRef = collection(db, 'bookings');
        const q = query(bookingsRef, where('vendorId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const allBookings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBookings(allBookings);
      } catch (err) {
        console.error(err);
        alert(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!selectedDate) return;
    const filtered = bookings.filter(b => {
      if (!b.weddingDate) return false;
      return new Date(b.weddingDate).toDateString() === selectedDate.toDateString();
    });
    setBookingsOnDate(filtered);
  }, [selectedDate, bookings]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/vendor-login');
  };

  // Handle image file selection
  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setPostForm(prev => ({ ...prev, image: '' }));
  };

  // Handle form submit with Cloudinary upload
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    setPostError('');
    setPostSuccess('');

    if (!user) { setPostError('You must be logged in.'); return; }

    try {
      let finalImageUrl = postForm.image;

      // If user selected a file, upload to Cloudinary first
      if (uploadMode === 'upload' && imageFile) {
        setImageUploading(true);
        finalImageUrl = await uploadImageToCloudinary(imageFile);
        setImageUploading(false);
      }

      await addDoc(collection(db, 'vendors'), {
        ...postForm,
        image: finalImageUrl || 'https://via.placeholder.com/300?text=New+Vendor',
        email: user.email,
        uid: user.uid,
        approved: false,
        createdAt: serverTimestamp(),
      });

      setPostSuccess('✅ Your service has been submitted for admin approval!');

      setTimeout(() => {
        setShowPostModal(false);
        setPostForm({ name: '', category: 'Photography', price: '', desc: '', image: '', phone: '' });
        setImageFile(null);
        setImagePreview('');
        setPostSuccess('');
        setUploadMode('upload');
      }, 2000);

    } catch (err) {
      setImageUploading(false);
      setPostError('❌ Failed to submit. Please try again.');
    }
  };

  const getBookedDates = () =>
    bookings.filter(b => b.weddingDate).map(b => new Date(b.weddingDate).toDateString());

  const tileClassName = ({ date, view }) =>
    view === 'month' && getBookedDates().includes(date.toDateString()) ? 'booked-date' : null;

  const handleCloseModal = () => {
    setShowPostModal(false);
    setPostForm({ name: '', category: 'Photography', price: '', desc: '', image: '', phone: '' });
    setImageFile(null);
    setImagePreview('');
    setPostError('');
    setPostSuccess('');
    setUploadMode('upload');
  };

  if (authLoading || loading) {
    return (
      <div className="v-dashboard-page loading-screen">
        <div className="loading-ring" />
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  if (!vendorData) return null;

  return (
    <div className="v-dashboard-page">
      <header className="v-dashboard-header">
        <div className="header-left">
          <button className="go-vendors-btn" onClick={() => navigate('/vendors')}>
            📋 Vendors Page
          </button>
          <button className="post-service-btn" onClick={() => setShowPostModal(true)}>
            + Post New Service
          </button>
        </div>
        <div className="header-center">
          <h1>Welcome, {vendorData?.name}</h1>
        </div>
        <div className="header-right">
          <button className="v-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <section className="v-dashboard-content">
        <div className="dashboard-two-columns">

          {/* Bookings Table */}
          <div className="bookings-list">
            <h2>Upcoming Bookings</h2>
            {bookings.length === 0 ? (
              <div className="no-bookings-msg">
                <span>📭</span>
                <p>No bookings yet</p>
              </div>
            ) : (
              <table className="v-bookings-table">
                <thead>
                  <tr>
                    <th>Client Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Wedding Date</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id}>
                      <td>{b.clientName}</td>
                      <td>{b.clientEmail}</td>
                      <td>{b.clientPhone}</td>
                      <td>{b.weddingDate ? new Date(b.weddingDate).toLocaleDateString() : 'Not Set'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Calendar */}
          <div className="calendar-container">
            <h2>Booking Calendar</h2>
            <Calendar onChange={setSelectedDate} value={selectedDate} tileClassName={tileClassName} />
            {bookingsOnDate.length > 0 && (
              <div className="bookings-on-date">
                <h4>📌 {selectedDate.toDateString()}</h4>
                <ul>
                  {bookingsOnDate.map(b => (
                    <li key={b.id}>{b.clientName} — {b.clientPhone}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Post New Service Modal ── */}
      {showPostModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>📸 Post a New Vendor Service</h3>

            {postError && <div className="error-box">{postError}</div>}
            {postSuccess && <div className="success-box">{postSuccess}</div>}

            <form onSubmit={handlePostSubmit}>
              <input
                type="text"
                placeholder="Business Name"
                required
                value={postForm.name}
                onChange={e => setPostForm({ ...postForm, name: e.target.value })}
              />

              <select
                value={postForm.category}
                onChange={e => setPostForm({ ...postForm, category: e.target.value })}
              >
                <option value="Photography">Photography</option>
                <option value="Florist">Florist</option>
                <option value="Music & DJ">Music & DJ</option>
                <option value="Catering">Catering</option>
                <option value="Lighting">Lighting</option>
                <option value="Wedding Cake">Wedding Cake</option>
                <option value="Other">Other</option>
              </select>

              <input
                type="text"
                placeholder="Price (e.g., From Rs. 20,000)"
                value={postForm.price}
                onChange={e => setPostForm({ ...postForm, price: e.target.value })}
              />

              <textarea
                placeholder="Description"
                rows="3"
                value={postForm.desc}
                onChange={e => setPostForm({ ...postForm, desc: e.target.value })}
              />

              {/* ── Image Upload Section ── */}
              <div className="image-upload-section">
                <label className="image-section-label">📷 Service Image</label>

                {/* Toggle between upload and URL */}
                <div className="upload-toggle">
                  <button
                    type="button"
                    className={`toggle-btn ${uploadMode === 'upload' ? 'active' : ''}`}
                    onClick={() => { setUploadMode('upload'); setPostForm(p => ({ ...p, image: '' })); }}
                  >
                    📁 Upload Image
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${uploadMode === 'url' ? 'active' : ''}`}
                    onClick={() => { setUploadMode('url'); setImageFile(null); setImagePreview(''); }}
                  >
                    🔗 Paste URL
                  </button>
                </div>

                {/* Upload from device */}
                {uploadMode === 'upload' && (
                  <div className="file-upload-area">
                    <input
                      type="file"
                      accept="image/*"
                      id="imageUpload"
                      className="file-input-hidden"
                      onChange={handleImageFileChange}
                    />
                    <label htmlFor="imageUpload" className="file-upload-label">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="image-preview" />
                      ) : (
                        <div className="upload-placeholder">
                          <span>🖼️</span>
                          <p>Click to select image from your device</p>
                          <small>JPG, PNG, WEBP supported</small>
                        </div>
                      )}
                    </label>
                    {imagePreview && (
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => { setImageFile(null); setImagePreview(''); }}
                      >
                        ✕ Remove Image
                      </button>
                    )}
                  </div>
                )}

                {/* Paste URL */}
                {uploadMode === 'url' && (
                  <input
                    type="url"
                    placeholder="Paste image URL (e.g. https://...)"
                    value={postForm.image}
                    onChange={e => setPostForm({ ...postForm, image: e.target.value })}
                  />
                )}
              </div>

              <input
                type="tel"
                placeholder="Phone Number"
                required
                value={postForm.phone}
                onChange={e => setPostForm({ ...postForm, phone: e.target.value })}
              />

              <div className="modal-buttons">
                <button type="submit" disabled={imageUploading} className="submit-btn">
                  {imageUploading ? (
                    <span className="btn-spinner">Uploading...</span>
                  ) : (
                    '✓ Submit for Approval'
                  )}
                </button>
                <button type="button" onClick={handleCloseModal} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;