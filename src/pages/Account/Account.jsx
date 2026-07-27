// src/pages/Account/Account.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import './Account.css';

// Cloudinary config – replace with your own
const CLOUD_NAME = 'dcjfpouji';
const UPLOAD_PRESET = 'wedding_planning'; // unsigned preset

const Account = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);

  const [userData, setUserData] = useState({
    name: '',
    phone: '',
    email: '',
    weddingDate: '',
    photoURL: '',
  });
  const [draft, setDraft] = useState({ ...userData });

  const toast = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Load user profile from Firestore 'clients' collection
  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) {
        toast('Please log in first');
        setTimeout(() => navigate('/login'), 1500);
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'clients', user.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData({
            name: data.name || '',
            phone: data.phone || '',
            email: data.email || user.email || '',
            weddingDate: data.weddingDate || '',
            photoURL: data.photoURL || '',
          });
        } else {
          // No profile yet – create an empty one with email
          setUserData({
            name: '',
            phone: '',
            email: user.email || '',
            weddingDate: '',
            photoURL: '',
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  // Keep draft in sync when userData changes
  useEffect(() => {
    setDraft(userData);
  }, [userData]);

  // Save edits to Firestore 'clients' collection
  const saveEdit = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userDocRef = doc(db, 'clients', user.uid);
      await setDoc(
        userDocRef,
        {
          name: draft.name,
          phone: draft.phone,
          email: draft.email,
          weddingDate: draft.weddingDate,
          photoURL: draft.photoURL,
        },
        { merge: true }
      );
      setUserData({ ...draft });
      setIsEditing(false);
      toast('✓ Profile updated successfully!');
    } catch (error) {
      console.error('Save error:', error);
      toast('✗ Failed to save changes');
    }
  };

  // Days remaining calculation
  const getDaysRemaining = (dateStr) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const wedding = new Date(dateStr);
    wedding.setHours(0, 0, 0, 0);
    const diffTime = wedding - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const currentWeddingDate = isEditing ? draft.weddingDate : userData.weddingDate;
  const daysLeft = getDaysRemaining(currentWeddingDate);

  // ── Photo upload (Cloudinary) ───────────────────────────────
  const openPicker = () => fileInputRef.current?.click();

  const onFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast('⚠ Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('⚠ Image must be under 5 MB.');
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', UPLOAD_PRESET);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body: fd }
      );
      if (!res.ok) throw new Error('Upload failed');

      const { secure_url } = await res.json();

      // Update Firestore
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, 'clients', user.uid);
        await setDoc(userDocRef, { photoURL: secure_url }, { merge: true });
      }
      setUserData((p) => ({ ...p, photoURL: secure_url }));
      setDraft((p) => ({ ...p, photoURL: secure_url }));
      toast('✓ Photo uploaded!');
    } catch {
      toast('✗ Upload failed — check Cloudinary config.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePhoto = async () => {
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, 'clients', user.uid);
      await setDoc(userDocRef, { photoURL: '' }, { merge: true });
    }
    setUserData((p) => ({ ...p, photoURL: '' }));
    setDraft((p) => ({ ...p, photoURL: '' }));
    toast('✓ Photo removed.');
  };

  const startEdit = () => {
    setDraft({ ...userData });
    setIsEditing(true);
  };
  const cancelEdit = () => {
    setDraft({ ...userData });
    setIsEditing(false);
  };
  const onChange = (e) =>
    setDraft((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const photo = isEditing ? draft.photoURL : userData.photoURL;
  const nameLabel = isEditing ? draft.name : userData.name;

  if (loading) {
    return (
      <div className="account-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        Loading profile...
      </div>
    );
  }

  return (
    <div className="account-page">
      {/* background blobs */}
      <div className="acc-blob acc-blob-tl" />
      <div className="acc-blob acc-blob-br" />

      <div className="acc-wrap">
        {/* Header */}
        <div className="acc-header">
          <p className="acc-eyebrow">Smart Wedding Planning</p>
          <h2 className="acc-title">
            My Wedding <span>Profile</span>
          </h2>
          <div className="acc-rule">
            <span className="acc-rule-line" />
            <span className="acc-rule-dot">◆</span>
            <span className="acc-rule-line acc-rl-right" />
          </div>
        </div>

        {/* Card */}
        <div className="acc-card">
          {/* Photo banner */}
          <div className="acc-banner">
            <div className="acc-avatar-wrap">
              {photo ? (
                <img src={photo} alt="Profile" className="acc-avatar-img" />
              ) : (
                <div className="acc-avatar-placeholder">💍</div>
              )}

              {uploading && (
                <div className="acc-upload-overlay">
                  <div className="acc-spinner" />
                </div>
              )}

              <div className="acc-avatar-btns">
                <button
                  className="acc-av-btn av-upload"
                  title="Upload photo"
                  onClick={openPicker}
                  disabled={uploading}
                >
                  📷
                </button>
                {photo && (
                  <button
                    className="acc-av-btn av-remove"
                    title="Remove photo"
                    onClick={removePhoto}
                    disabled={uploading}
                  >
                    ✕
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="acc-file-input"
                onChange={onFileChange}
              />
            </div>

            <p className="acc-banner-name">{nameLabel || 'Guest'}</p>
            <p className="acc-banner-role">Member</p>
          </div>

          {/* Form */}
          <div className="acc-form">
            <p className="acc-section-lbl">Personal Details</p>

            <div className="acc-field">
              <label>Account Name</label>
              <div className="acc-input-wrap">
                <span className="acc-icon">👤</span>
                <input
                  type="text"
                  name="name"
                  value={isEditing ? draft.name : userData.name}
                  onChange={onChange}
                  disabled={!isEditing}
                  placeholder="Enter your name"
                />
              </div>
            </div>

            <div className="acc-field">
              <label>Phone Number</label>
              <div className="acc-input-wrap">
                <span className="acc-icon">📞</span>
                <input
                  type="tel"
                  name="phone"
                  value={isEditing ? draft.phone : userData.phone}
                  onChange={onChange}
                  disabled={!isEditing}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="acc-field">
              <label>Email Address</label>
              <div className="acc-input-wrap">
                <span className="acc-icon">✉️</span>
                <input
                  type="email"
                  name="email"
                  value={isEditing ? draft.email : userData.email}
                  onChange={onChange}
                  disabled={!isEditing}
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div className="acc-field">
              <label>Wedding Date</label>
              <div className="acc-input-wrap">
                <span className="acc-icon">📅</span>
                <input
                  type="date"
                  name="weddingDate"
                  value={currentWeddingDate}
                  onChange={onChange}
                  disabled={!isEditing}
                />
              </div>
              {/* Days remaining display */}
              {currentWeddingDate && daysLeft !== null && (
                <div className="acc-days-remaining">
                  {daysLeft > 0
                    ? `🎉 ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining for your wedding!`
                    : daysLeft === 0
                    ? '💒 Today is your wedding day!'
                    : '✨ Your wedding has passed. Congratulations!'}
                </div>
              )}
            </div>

            <div className="acc-btns">
              {!isEditing ? (
                <button className="acc-btn acc-btn-edit" onClick={startEdit}>
                  ✏️ &nbsp;Edit Profile
                </button>
              ) : (
                <>
                  <button className="acc-btn acc-btn-save" onClick={saveEdit}>
                    ✓ &nbsp;Save Changes
                  </button>
                  <button className="acc-btn acc-btn-cancel" onClick={cancelEdit}>
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="acc-footer">
            <div className="acc-footer-line" />
            <Link to="/" className="acc-home-link">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div className={`acc-toast${showToast ? ' acc-toast-show' : ''}`}>{toastMsg}</div>
    </div>
  );
};

export default Account;