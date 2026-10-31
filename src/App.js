import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Home from './pages/Home/home.jsx';
import Packages from './pages/Packages/Packages';
import Vendors from './pages/Vendors/Vendors.jsx';
import About from './pages/About/About.jsx';
import Review from './pages/Review/Review.jsx';
import Login from './pages/Login/Login.jsx';
import Account from './pages/Account/Account.jsx';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import VendorLogin from './pages/VendorLogin/VendorLogin';
import VendorDashboard from './pages/VendorDashboard/VendorDashboard';
import PrivateRoute from './components/PrivateRoute.jsx';
import AdminLogin from './pages/AdminLogin/AdminLogin.jsx';
import Payment from './pages/Payment/Payment.jsx';
import Inventory from './pages/Inventory/Inventory.jsx';
import Reports from './pages/Reports/Reports.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/packages" element={<Packages />} />
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/about" element={<About />} />
        <Route path="/review" element={<Review />} />
        <Route path="/login" element={<Login />} />
        <Route path="/account" element={<Account />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/vendor-login" element={<VendorLogin />} />
        <Route
          path="/vendor-dashboard"
          element={
            <PrivateRoute>
              <VendorDashboard />
            </PrivateRoute>
          }
        />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>

      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
    </Router>
  );
}

export default App;