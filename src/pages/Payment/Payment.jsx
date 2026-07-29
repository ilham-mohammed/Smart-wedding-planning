import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Payment.css';
import { db } from "../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const formatPrice = (n) =>
  'Rs. ' + Number(n).toLocaleString('en-LK');

const PAYMENT_LABELS = {
  later:   { label: 'Pay Later',        icon: '🗓️', color: '#8B6F6F' },
  advance: { label: 'Advance (10%)',    icon: '💰', color: '#D4AF37' },
  full:    { label: 'Full Payment',     icon: '✅', color: '#4CAF7D' },
};

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state || {};

  const {
    packageName  = 'Wedding Package',
    weddingDate  = '—',
    totalPrice   = 0,
    paymentType  = 'later',
    amountDue    = 0,
  } = booking;

  const [step, setStep] = useState('form'); // 'form' | 'success'
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    nic: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardName: '',
  });

  const isPaying = paymentType !== 'later';

  const handle = (e) => {
    const { name, value } = e.target;
    let v = value;

    if (name === 'cardNumber') {
      v = v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    }
    if (name === 'expiry') {
      v = v.replace(/\D/g, '').slice(0, 4);
      if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
    }
    if (name === 'cvv') {
      v = v.replace(/\D/g, '').slice(0, 3);
    }
    if (name === 'phone') {
      v = v.replace(/\D/g, '').slice(0, 10);
    }

    setForm(f => ({ ...f, [name]: v }));
    setErrors(er => ({ ...er, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim())   e.fullName = 'Full name is required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Valid email required';
    if (form.phone.length < 9)   e.phone = 'Valid phone number required';
    if (!form.nic.trim())        e.nic = 'NIC number is required';
    if (isPaying) {
      if (form.cardNumber.replace(/\s/g,'').length < 16) e.cardNumber = 'Enter 16-digit card number';
      if (!form.expiry.match(/^\d{2}\/\d{2}$/))          e.expiry = 'Format: MM/YY';
      if (form.cvv.length < 3)                            e.cvv = 'Enter 3-digit CVV';
      if (!form.cardName.trim())                          e.cardName = 'Name on card is required';
    }
    return e;
  };

  const handleSubmit = async () => {
  const e = validate();

  if (Object.keys(e).length) {
    setErrors(e);
    return;
  }

  try {

    await addDoc(collection(db, "bookings"), {

      clientName: form.fullName,
      clientPhone: form.phone,

      weddingDate,

      vendorName: packageName,

      paymentType,

      totalPrice,

      amountPaid: amountDue,

      email: form.email,

      nic: form.nic,

      createdAt: serverTimestamp()

    });

    setStep("success");

  } catch (error) {

    console.log(error);

    alert("Booking not saved.");

  }
};

  const payInfo = PAYMENT_LABELS[paymentType] || PAYMENT_LABELS.later;

  /* ── Success Screen ── */
  if (step === 'success') {
    return (
      <div className="pay-page">
        <div className="pay-success-wrap">
          <div className="success-card">
            <div className="success-rings">
              <div className="ring r1" /><div className="ring r2" /><div className="ring r3" />
              <div className="success-icon">💍</div>
            </div>
            <h2 className="success-title">Booking Confirmed!</h2>
            <p className="success-msg">
              Thank you, <strong>{form.fullName}</strong>! Your wedding has been reserved.<br/>
              A confirmation will be sent to <strong>{form.email}</strong>.
            </p>
            <div className="success-summary">
              <div className="ss-row"><span>Package</span><strong>{packageName}</strong></div>
              <div className="ss-row"><span>Wedding Date</span><strong>{weddingDate}</strong></div>
              <div className="ss-row"><span>Payment Type</span><strong>{payInfo.icon} {payInfo.label}</strong></div>
              <div className="ss-row highlight"><span>Amount Paid</span><strong>{formatPrice(amountDue)}</strong></div>
            </div>
            <Link to="/" className="btn-go-home">← Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <div className="pay-page">
      {/* Top bar */}
      <div className="top-bar">
        <Link to="/packages" className="back-home-btn">← Back to Packages</Link>
      </div>

      <div className="pay-layout">

        {/* ── Left: Booking Summary ── */}
        <aside className="pay-sidebar">
          <div className="sidebar-deco" />
          <h3 className="sidebar-title">Booking Summary</h3>

          <div className="summary-package-name">{packageName}</div>

          <div className="summary-rows">
            <div className="summary-row">
              <span>📅 Wedding Date</span>
              <strong>{weddingDate}</strong>
            </div>
            <div className="summary-row">
              <span>💼 Total Price</span>
              <strong>{formatPrice(totalPrice)}</strong>
            </div>
            <div className="summary-row">
              <span>{payInfo.icon} Payment</span>
              <strong>{payInfo.label}</strong>
            </div>
          </div>

          <div className="due-box">
            <div className="due-label">Amount Due Now</div>
            <div className="due-amount">{formatPrice(amountDue)}</div>
            {paymentType === 'advance' && (
              <div className="due-note">Remaining {formatPrice(totalPrice - amountDue)} payable before event</div>
            )}
            {paymentType === 'later' && (
              <div className="due-note">Full amount payable before the event</div>
            )}
          </div>

          <div className="sidebar-badges">
            <span className="badge">🔒 Secure Booking</span>
            <span className="badge">📍 Trincomalee, LK</span>
          </div>
        </aside>

        {/* ── Right: Form ── */}
        <main className="pay-form-wrap">
          <div className="form-header">
            <div className="form-step-label">Complete Your Reservation</div>
            <h1 className="form-title">Payment Details</h1>
          </div>

          {/* Personal Info */}
          <section className="form-section">
            <div className="section-heading">
              <span className="section-num">01</span> Personal Information
            </div>
            <div className="form-grid">
              <div className="field full">
                <label>Full Name</label>
                <input name="fullName" value={form.fullName} onChange={handle} placeholder="Your full name" className={errors.fullName ? 'err' : ''} />
                {errors.fullName && <span className="err-msg">{errors.fullName}</span>}
              </div>
              <div className="field">
                <label>Email Address</label>
                <input name="email" type="email" value={form.email} onChange={handle} placeholder="you@email.com" className={errors.email ? 'err' : ''} />
                {errors.email && <span className="err-msg">{errors.email}</span>}
              </div>
              <div className="field">
                <label>Phone Number</label>
                <input name="phone" value={form.phone} onChange={handle} placeholder="07X XXX XXXX" className={errors.phone ? 'err' : ''} />
                {errors.phone && <span className="err-msg">{errors.phone}</span>}
              </div>
              <div className="field full">
                <label>NIC Number</label>
                <input name="nic" value={form.nic} onChange={handle} placeholder="National Identity Card number" className={errors.nic ? 'err' : ''} />
                {errors.nic && <span className="err-msg">{errors.nic}</span>}
              </div>
            </div>
          </section>

          {/* Card Info — only if paying now */}
          {isPaying && (
            <section className="form-section">
              <div className="section-heading">
                <span className="section-num">02</span> Card Information
              </div>

              <div className="card-preview">
                <div className="card-chip">💳</div>
                <div className="card-number-display">
                  {form.cardNumber || '•••• •••• •••• ••••'}
                </div>
                <div className="card-meta">
                  <span>{form.cardName || 'CARD HOLDER'}</span>
                  <span>{form.expiry || 'MM/YY'}</span>
                </div>
              </div>

              <div className="form-grid">
                <div className="field full">
                  <label>Card Number</label>
                  <input name="cardNumber" value={form.cardNumber} onChange={handle} placeholder="1234 5678 9012 3456" className={errors.cardNumber ? 'err' : ''} />
                  {errors.cardNumber && <span className="err-msg">{errors.cardNumber}</span>}
                </div>
                <div className="field full">
                  <label>Name on Card</label>
                  <input name="cardName" value={form.cardName} onChange={handle} placeholder="As printed on card" className={errors.cardName ? 'err' : ''} />
                  {errors.cardName && <span className="err-msg">{errors.cardName}</span>}
                </div>
                <div className="field">
                  <label>Expiry Date</label>
                  <input name="expiry" value={form.expiry} onChange={handle} placeholder="MM/YY" className={errors.expiry ? 'err' : ''} />
                  {errors.expiry && <span className="err-msg">{errors.expiry}</span>}
                </div>
                <div className="field">
                  <label>CVV</label>
                  <input name="cvv" value={form.cvv} onChange={handle} placeholder="•••" type="password" className={errors.cvv ? 'err' : ''} />
                  {errors.cvv && <span className="err-msg">{errors.cvv}</span>}
                </div>
              </div>
            </section>
          )}

          <button className="btn-pay" onClick={handleSubmit}>
            {isPaying
              ? `💳 Pay ${formatPrice(amountDue)}`
              : '📋 Confirm Reservation'}
          </button>

          <p className="pay-note">🔒 Your information is encrypted and secure.</p>
        </main>
      </div>
    </div>
  );
}