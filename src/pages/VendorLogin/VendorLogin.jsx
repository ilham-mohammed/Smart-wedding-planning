import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import './VendorLogin.css';

const VendorLogin = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('Photography');
  const [customCategory, setCustomCategory] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Success modal state
  const [successModal, setSuccessModal] = useState({ show: false, message: '' });

  // ── Friendly error messages ──
  const getFriendlyError = (errorCode) => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return '❌ Invalid email address. Please check and try again.';
      case 'auth/user-not-found':
        return '❌ No account found with this email. Please register first.';
      case 'auth/wrong-password':
        return '❌ Incorrect password. Please try again.';
      case 'auth/invalid-credential':
        return '❌ Incorrect email or password. Please try again.';
      case 'auth/email-already-in-use':
        return '❌ This email is already registered. Please login instead.';
      case 'auth/weak-password':
        return '❌ Password is too weak. Use at least 6 characters.';
      case 'auth/too-many-requests':
        return '❌ Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return '❌ Network error. Please check your internet connection.';
      case 'auth/user-disabled':
        return '❌ This account has been disabled. Contact support.';
      default:
        return '❌ Something went wrong. Please try again.';
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccessModal({ show: true, message: "Login successful! 🎉" });
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const finalCategory = category === 'Other' ? customCategory : category;

        await setDoc(doc(db, "vendors", user.uid), {
          uid: user.uid,
          name: vendorName,
          category: finalCategory,
          email: email,
          phone: phone,
          price: "Contact for Pricing",
          desc: "New vendor registered via portal",
          image: "https://via.placeholder.com/300?text=New+Vendor",
          approved: false,
        });

        setSuccessModal({ show: true, message: "Registration successful! 🎉 Please wait for admin approval." });
      }
    } catch (err) {
      setError(getFriendlyError(err.code));
    }
  };

  const handleModalOk = () => {
    setSuccessModal({ show: false, message: '' });
    navigate('/vendor-dashboard');
  };

  return (
    <div className="v-login-page">
      <div className="v-login-card">
        <Link to="/vendors" className="v-back">← Back to Vendors</Link>
        <h2>{isLogin ? "Vendor Login" : "Vendor Registration"}</h2>

        {error && <p className="v-error">{error}</p>}

        <form onSubmit={handleAuth}>
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="Business Name"
                required
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
              />
              <input
                type="tel"
                placeholder="Phone Number"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Photography">Photography</option>
                <option value="Florist">Florist</option>
                <option value="Catering">Catering</option>
                <option value="Music & DJ">Music & DJ</option>
                <option value="Wedding Cake">Wedding Cake</option>
                <option value="Other">Other</option>
              </select>

              {category === "Other" && (
                <input
                  type="text"
                  placeholder="Enter your category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  required
                />
              )}
            </>
          )}

          <input
            type="email"
            placeholder="Email Address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Password field with toggle */}
          <div className="v-password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span
              className="v-toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </span>
          </div>

          <button type="submit" className="v-submit-btn">
            {isLogin ? "Login" : "Register Business"}
          </button>
        </form>

        <p className="v-toggle" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "New vendor? Register your business" : "Already have an account? Login"}
        </p>
      </div>

      {/* Success Modal */}
      {successModal.show && (
        <div className="v-modal-overlay">
          <div className="v-modal">
            <p>{successModal.message}</p>
            <button onClick={handleModalOk} className="v-modal-ok-btn">OK</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorLogin;