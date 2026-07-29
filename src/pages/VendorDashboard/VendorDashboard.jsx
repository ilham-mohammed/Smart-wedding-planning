import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import './VendorDashboard.css';

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

const emptyPostForm = {
  name: '',
  category: 'Photography',
  price: '',
  desc: '',
  phone: '',
  image: '',
};

const VendorDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [vendorData, setVendorData] = useState(null);
  const [vendorServices, setVendorServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingsOnDate, setBookingsOnDate] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const [showPostModal, setShowPostModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [postForm, setPostForm] = useState(emptyPostForm);
  const [customCategory, setCustomCategory] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [postError, setPostError] = useState('');
  const [postSuccess, setPostSuccess] = useState('');

  const loadServices = async () => {
    if (!user) return;

    const snapshot = await getDocs(
      query(collection(db, 'vendors'), where('uid', '==', user.uid))
    );

    setVendorServices(
      snapshot.docs.map((service) => ({
        id: service.id,
        ...service.data(),
      }))
    );
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/vendor-login');
      return;
    }

    const loadDashboard = async () => {
      try {
        const vendorSnapshot = await getDoc(doc(db, 'vendors', user.uid));

        if (vendorSnapshot.exists()) {
          setVendorData(vendorSnapshot.data());
        }

        await loadServices();

        const bookingSnapshot = await getDocs(
          query(
            collection(db, 'bookings'),
            where('vendorId', '==', user.uid)
          )
        );

        setBookings(
          bookingSnapshot.docs.map((booking) => ({
            id: booking.id,
            ...booking.data(),
          }))
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const filteredBookings = bookings.filter((booking) => {
      if (!booking.weddingDate) return false;

      return (
        new Date(booking.weddingDate).toDateString() ===
        selectedDate.toDateString()
      );
    });

    setBookingsOnDate(filteredBookings);
  }, [bookings, selectedDate]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/vendor-login');
  };

  const openNewService = () => {
    setEditingService(null);
    setPostForm(emptyPostForm);
    setCustomCategory('');
    setImageFile(null);
    setImagePreview('');
    setPostError('');
    setPostSuccess('');
    setShowPostModal(true);
  };

  const openEditService = (service) => {
    const knownCategories = [
      'Photography',
      'Florist',
      'Catering',
      'Music & DJ',
      'Lighting',
      'Wedding Cake',
    ];

    const isCustomCategory = !knownCategories.includes(service.category);

    setEditingService(service);
    setPostForm({
      name: service.name || '',
      category: isCustomCategory ? 'Other' : service.category,
      price: service.price || '',
      desc: service.desc || '',
      phone: service.phone || '',
      image: service.image || '',
    });

    setCustomCategory(isCustomCategory ? service.category : '');
    setImageFile(null);
    setImagePreview(service.image || '');
    setPostError('');
    setPostSuccess('');
    setShowPostModal(true);
  };

  const handleImageFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleCloseModal = () => {
    setShowPostModal(false);
    setEditingService(null);
    setPostForm(emptyPostForm);
    setCustomCategory('');
    setImageFile(null);
    setImagePreview('');
    setPostError('');
    setPostSuccess('');
  };

  const handlePostSubmit = async (event) => {
    event.preventDefault();
    setPostError('');
    setPostSuccess('');

    try {
      let finalImage = postForm.image;

      if (imageFile) {
        setImageUploading(true);
        finalImage = await uploadImageToCloudinary(imageFile);
      }

      const category =
        postForm.category === 'Other'
          ? customCategory.trim()
          : postForm.category;

      if (!category) {
        throw new Error('Please enter your service category.');
      }

      const serviceDetails = {
        name: postForm.name.trim(),
        category,
        price: postForm.price.trim(),
        desc: postForm.desc.trim(),
        phone: postForm.phone.trim(),
        image: finalImage || 'https://via.placeholder.com/300',
        uid: user.uid,
        email: user.email,
      };

      if (editingService) {
  await setDoc(
    doc(db, 'vendors', editingService.id),
    {
      pendingUpdate: serviceDetails,
      updateStatus: 'pending',
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  setPostSuccess(
    '✅ Changes saved and sent for admin approval.'
  );
} else {
  await addDoc(collection(db, 'vendors'), {
    ...serviceDetails,
    approved: false,
    updateStatus: 'pending',
    createdAt: serverTimestamp(),
  });

  setPostSuccess(
    '✅ Service submitted for admin approval.'
  );
}

      await loadServices();
    } catch (error) {
      console.error(error);
      setPostError(`❌ ${error.message}`);
    } finally {
      setImageUploading(false);
    }
  };

  const getBookedDates = () =>
    bookings
      .filter((booking) => booking.weddingDate)
      .map((booking) => new Date(booking.weddingDate).toDateString());

  const tileClassName = ({ date, view }) => {
    if (
      view === 'month' &&
      getBookedDates().includes(date.toDateString())
    ) {
      return 'booked-date';
    }

    return null;
  };

  if (loading || authLoading) {
    return <div className="loading-screen">Loading dashboard...</div>;
  }

  return (
    <div className="v-dashboard-page">
      <header className="v-dashboard-header">
        <div className="header-left">
          <button
            className="go-vendors-btn"
            onClick={() => navigate('/vendors')}
          >
            📋 Vendors Page
          </button>

          <button className="post-service-btn" onClick={openNewService}>
            + Post New Service
          </button>
        </div>

        <div className="header-center">
          <h1>Welcome, {vendorData?.name || user?.email || 'Vendor'}</h1>
        </div>

        <div className="header-right">
          <button className="v-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <section className="v-dashboard-content">
        <div className="dashboard-two-columns">
          <div className="bookings-list">
            <h2>Upcoming Bookings</h2>

            {bookings.length === 0 ? (
              <p>No bookings yet.</p>
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
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>{booking.clientName}</td>
                      <td>{booking.clientEmail}</td>
                      <td>{booking.clientPhone}</td>
                      <td>
                        {booking.weddingDate
                          ? new Date(booking.weddingDate).toLocaleDateString()
                          : 'Not Set'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="calendar-container">
            <h2>Booking Calendar</h2>
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              tileClassName={tileClassName}
            />

            {bookingsOnDate.length > 0 && (
              <ul>
                {bookingsOnDate.map((booking) => (
                  <li key={booking.id}>
                    {booking.clientName} - {booking.clientPhone}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <section className="my-services">
          <h2>My Posted Services</h2>

          {vendorServices.length === 0 ? (
            <p>No services posted yet.</p>
          ) : (
            vendorServices.map((service) => (
              <div className="service-card" key={service.id}>
                <img
                  src={service.image || 'https://via.placeholder.com/300'}
                  alt={service.name}
                />

                <div className="service-info">
                  <h3>{service.name}</h3>
                  <p>Category: {service.category}</p>
                  <p>Price: {service.price}</p>
                  <p>{service.desc}</p>

                  <p>
                    Status:{' '}
                    {service.pendingUpdate ? (
                      <span className="pending-status">
                        Edited details awaiting approval
                      </span>
                    ) : service.approved ? (
                      <span className="approved-status">Approved</span>
                    ) : (
                      <span className="pending-status">
                        Pending admin approval
                      </span>
                    )}
                  </p>

                  <button
                    className="edit-service-btn"
                    onClick={() => openEditService(service)}
                  >
                    ✏ Edit Service
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </section>

      {showPostModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div
            className="modal-content"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>
              {editingService ? '✏ Edit Service' : '📸 Post New Service'}
            </h3>

            {postError && <div className="error-box">{postError}</div>}
            {postSuccess && (
              <div className="success-box">{postSuccess}</div>
            )}

            <form onSubmit={handlePostSubmit}>
              <input
                type="text"
                placeholder="Business Name"
                required
                value={postForm.name}
                onChange={(event) =>
                  setPostForm({ ...postForm, name: event.target.value })
                }
              />

              <select
                value={postForm.category}
                onChange={(event) =>
                  setPostForm({ ...postForm, category: event.target.value })
                }
              >
                <option value="Photography">Photography</option>
                <option value="Florist">Florist</option>
                <option value="Catering">Catering</option>
                <option value="Music & DJ">Music & DJ</option>
                <option value="Lighting">Lighting</option>
                <option value="Wedding Cake">Wedding Cake</option>
                <option value="Other">Other</option>
              </select>

              {postForm.category === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter your category"
                  required
                  value={customCategory}
                  onChange={(event) =>
                    setCustomCategory(event.target.value)
                  }
                />
              )}

              <input
                type="text"
                placeholder="Price"
                required
                value={postForm.price}
                onChange={(event) =>
                  setPostForm({ ...postForm, price: event.target.value })
                }
              />

              <textarea
                placeholder="Description"
                required
                value={postForm.desc}
                onChange={(event) =>
                  setPostForm({ ...postForm, desc: event.target.value })
                }
              />

              {imagePreview && (
                <img
                  src={imagePreview}
                  className="image-preview"
                  alt="Preview"
                />
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
              />

              <input
                type="tel"
                placeholder="Phone Number"
                required
                value={postForm.phone}
                onChange={(event) =>
                  setPostForm({ ...postForm, phone: event.target.value })
                }
              />

              <button
                type="submit"
                className="submit-btn"
                disabled={imageUploading}
              >
                {imageUploading
                  ? 'Uploading...'
                  : editingService
                    ? 'Send Changes for Approval'
                    : 'Submit for Approval'}
              </button>

              <button
                type="button"
                className="cancel-btn"
                onClick={handleCloseModal}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;