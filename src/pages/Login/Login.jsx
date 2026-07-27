// src/pages/Login/Login.jsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

import { auth, db } from '../../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';

import {
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';

const Login = () => {

  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginErrors, setLoginErrors] = useState({ email: '', password: '', general: '' });
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [regData, setRegData] = useState({
    fullName: '', phone: '', weddingDate: '', email: '', password: '', confirmPassword: ''
  });
  const [regErrors, setRegErrors] = useState({
    fullName: '', phone: '', weddingDate: '', email: '', password: '', confirmPassword: '', general: ''
  });
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [successModal, setSuccessModal] = useState({ show: false, message: '' });

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setLoginErrors({});
    setRegErrors({});
  };

  // ── LOGIN ──
  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const validateLogin = () => {
    let errors = {};
    if (!loginData.email) errors.email = 'Email required';
    if (!loginData.password) errors.password = 'Password required';
    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginData.email, loginData.password);
      const user = userCredential.user;
      const clientRef = doc(db, 'clients', user.uid);
      const snap = await getDoc(clientRef);
      if (!snap.exists()) {
        await setDoc(clientRef, { uid: user.uid, email: user.email, createdAt: new Date() });
      }
      setSuccessModal({ show: true, message: 'Login successful! 🎉' });
    } catch (error) {
      setLoginErrors({ general: 'Invalid email or password' });
    }
  };

  // ── REGISTER ──
  const handleRegChange = (e) => {
    setRegData({ ...regData, [e.target.name]: e.target.value });
  };

  const validateRegister = () => {
    let errors = {};
    if (!regData.fullName) errors.fullName = 'Name required';
    if (!regData.phone) errors.phone = 'Phone required';
    if (!regData.weddingDate) errors.weddingDate = 'Date required';
    if (!regData.email) errors.email = 'Email required';
    if (regData.password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (regData.password !== regData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setRegErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!validateRegister()) return;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, regData.email, regData.password);
      const user = userCredential.user;
      await setDoc(doc(db, 'clients', user.uid), {
        uid: user.uid,
        name: regData.fullName,
        phone: regData.phone,
        weddingDate: regData.weddingDate,
        email: regData.email,
        createdAt: new Date()
      });
      setSuccessModal({ show: true, message: 'Registration successful! 🎉' });
    } catch (error) {
      setRegErrors({ general: 'Registration failed. Email may already be in use.' });
    }
  };

  // ── MODAL OK ──
  const handleModalOk = () => {
    setSuccessModal({ show: false, message: '' });
    navigate('/', { replace: true });
  };

  // ── UI ──
  return (
    <div className="auth-page">
      <div className="auth-container">

        {/* Success Modal */}
        {successModal.show && (
          <div className="auth-modal-overlay">
            <div className="auth-modal">
              <p>{successModal.message}</p>
              <button onClick={handleModalOk} className="modal-ok-btn">OK</button>
            </div>
          </div>
        )}

        {/* ── LOGIN FORM ── */}
        {isLogin && (
          <div className="form-panel">
            <h2>Login</h2>

            {loginErrors.general && (
              <div className="error-box">{loginErrors.general}</div>
            )}

            <form onSubmit={handleLoginSubmit}>

              <input
                type="email"
                name="email"
                placeholder="Email"
                onChange={handleLoginChange}
              />
              {loginErrors.email && <p className="error">{loginErrors.email}</p>}

              <div className="password-field">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  onChange={handleLoginChange}
                />
                <span
                  className="toggle-password-text"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                >
                  {showLoginPassword ? 'Hide' : 'Show'}
                </span>
              </div>
              {loginErrors.password && <p className="error">{loginErrors.password}</p>}

              <button type="submit">Login</button>
            </form>

            <p className="switch-text" onClick={toggleForm}>
              Don't have an account? Create one
            </p>
          </div>
        )}

        {/* ── REGISTER FORM ── */}
        {!isLogin && (
          <div className="form-panel">
            <h2>Register</h2>

            {regErrors.general && (
              <div className="error-box">{regErrors.general}</div>
            )}

            <form onSubmit={handleRegisterSubmit}>

              <input
                name="fullName"
                placeholder="Full Name"
                onChange={handleRegChange}
              />
              {regErrors.fullName && <p className="error">{regErrors.fullName}</p>}

              <input
                name="phone"
                placeholder="Phone Number"
                onChange={handleRegChange}
              />
              {regErrors.phone && <p className="error">{regErrors.phone}</p>}

              <input
                type="date"
                name="weddingDate"
                onChange={handleRegChange}
              />
              {regErrors.weddingDate && <p className="error">{regErrors.weddingDate}</p>}

              <input
                type="email"
                name="email"
                placeholder="Email"
                onChange={handleRegChange}
              />
              {regErrors.email && <p className="error">{regErrors.email}</p>}

              <div className="password-field">
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  onChange={handleRegChange}
                />
                <span
                  className="toggle-password-text"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                >
                  {showRegPassword ? 'Hide' : 'Show'}
                </span>
              </div>
              {regErrors.password && <p className="error">{regErrors.password}</p>}

              <div className="password-field">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  onChange={handleRegChange}
                />
                <span
                  className="toggle-password-text"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </span>
              </div>
              {regErrors.confirmPassword && <p className="error">{regErrors.confirmPassword}</p>}

              <button type="submit">Register</button>
            </form>

            <p className="switch-text" onClick={toggleForm}>
              Already have an account? Login
            </p>
          </div>
        )}

        <Link to="/" className="back-home">← Back to Home</Link>

      </div>
    </div>
  );
};

export default Login;