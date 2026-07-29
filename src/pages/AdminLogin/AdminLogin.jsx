import React, { useState } from 'react';
import { auth } from '../../firebase'; // Ensure you export auth from your firebase.js
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import './AdminLogin.css'; // Import the CSS file here
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // 1. Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Optional: Set your local storage for route guarding
      localStorage.setItem('adminAuth', 'true');
      
      toast.success('Admin authenticated successfully!');
      navigate('/admin-dashboard');
    } catch (error) {
      console.error("Login Error:", error.code);
      toast.error('Invalid admin credentials.');
    }
  };

  return (
    <div className="admin-login-page">
      <ToastContainer />
      <div className="admin-login-card">
        <form onSubmit={handleLogin}>
          <h2>Admin Login</h2>
          <input 
            type="email" 
            placeholder="Admin Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <button type="submit">Login to Dashboard</button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;