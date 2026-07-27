import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Packages.css';

const packages = [
  {
    id: 'basic',
    name: 'Basic Package',
    guests: 'Up to 100 Guests',
    price: 599000,
    popular: false,
    features: [
      'Basic Catering Package',
      '4 Hours Photography',
      'Standard Lighting Setup',
      'Wedding Cake (1 Tier)',
      'Basic Decoration',
      'Background Music',
      'Digital Photo Album',
      'Bridal Dressing Room Arrangement',
      'Guest Welcome Drinks',
    ],
  },
  {
    id: 'standard',
    name: 'Standard Package',
    guests: 'Up to 200 Guests',
    price: 799000,
    popular: true,
    features: [
      'Premium Catering Package',
      'Full Day Photo & Videography',
      'Premium Lighting & Decor',
      'Wedding Cake (3 Tier)',
      'Floral Arrangement',
      'Live Music',
      'Digital & Physical Album',
      'Wedding Planner Consultation',
    ],
  },
  {
    id: 'premium',
    name: 'Premium Package',
    guests: '300+ Guests',
    price: 1199000,
    popular: false,
    features: [
      'Gourmet Catering Package',
      'Full Day Photo & Videography',
      'Luxury Lighting & Premium Decor',
      'Custom Wedding Cake (4 Tier)',
      'Premium Floral Arrangement',
      'Cinematic Wedding Film',
      'Drone Photography',
      'Dedicated Wedding Planner',
      'Red Carpet & Fireworks',
      'Couple Transportation',
    ],
  },
];

const STEPS = { CALENDAR: 'calendar', PAYMENT: 'payment' };

const formatPrice = (n) =>
  'Rs. ' + n.toLocaleString('en-LK');

// Minimal inline calendar (no external dep)
function MonthCalendar({ selectedDate, onSelect }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="calendar">
      <div className="cal-header">
        <button className="cal-nav" onClick={prevMonth}>‹</button>
        <span className="cal-title">{monthNames[viewMonth]} {viewYear}</span>
        <button className="cal-nav" onClick={nextMonth}>›</button>
      </div>
      <div className="cal-grid">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="cal-day-name">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const cellDate = new Date(viewYear, viewMonth, day);
          const isPast = cellDate < today;
          const isSelected =
            selectedDate &&
            selectedDate.getDate() === day &&
            selectedDate.getMonth() === viewMonth &&
            selectedDate.getFullYear() === viewYear;
          return (
            <button
              key={day}
              className={`cal-day ${isPast ? 'past' : ''} ${isSelected ? 'selected' : ''}`}
              disabled={isPast}
              onClick={() => !isPast && onSelect(new Date(viewYear, viewMonth, day))}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Packages() {
  const navigate = useNavigate();
  const [modal, setModal] = useState(null); // { pkg, step, date }

  const openModal = (pkg) =>
    setModal({ pkg, step: STEPS.CALENDAR, date: null });

  const closeModal = () => setModal(null);

  const handleDateSelect = (date) =>
    setModal(m => ({ ...m, date }));

  const handleDateConfirm = () => {
    if (!modal.date) return;
    setModal(m => ({ ...m, step: STEPS.PAYMENT }));
  };

  const handlePaymentSelect = (type) => {
    const { pkg, date } = modal;
    let amount;
    if (type === 'advance') amount = Math.round(pkg.price * 0.1);
    else if (type === 'full') amount = pkg.price;
    else amount = 0; // pay later

    // Pass booking info via navigation state to Payment page
    navigate('/payment', {
      state: {
        packageId: pkg.id,
        packageName: pkg.name,
        weddingDate: date.toDateString(),
        totalPrice: pkg.price,
        paymentType: type,
        amountDue: amount,
      },
    });
  };

  const formatDate = (d) =>
    d ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  return (
    <div>
      {/* Top bar */}
      <div className="top-bar">
        <Link to="/" className="back-home-btn">← Back to Home</Link>
      </div>

      <div className="packages-page">
        <h1 className="section-title">Wedding Packages</h1>
        <p className="section-subtitle">Exclusive planning services for your special day</p>

        <div className="packages-grid">
          {packages.map((pkg) => (
            <div key={pkg.id} className={`package-card ${pkg.popular ? 'popular' : ''}`}>
              {pkg.popular && <div className="package-badge">MOST POPULAR</div>}
              <div className="package-name">{pkg.name}</div>
              <p className="guest-count">{pkg.guests}</p>
              <div className="package-price">{formatPrice(pkg.price)}</div>
              <ul className="package-features">
                {pkg.features.map((f) => <li key={f}>{f}</li>)}
              </ul>
              <button className="btn-primary" onClick={() => openModal(pkg)}>
                Select Package
              </button>
            </div>
          ))}
        </div>
      </div>

      <footer className="footer">
        <p>© 2026 Smart Wedding Planning | Trincomalee, Sri Lanka 💍</p>
      </footer>

      {/* ── Modal Overlay ── */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>✕</button>

            {/* ── Step 1: Calendar ── */}
            {modal.step === STEPS.CALENDAR && (
              <>
                <div className="modal-header">
                  <div className="modal-icon">📅</div>
                  <h2 className="modal-title">Choose Your Wedding Date</h2>
                  <p className="modal-subtitle">{modal.pkg.name}</p>
                </div>

                <MonthCalendar
                  selectedDate={modal.date}
                  onSelect={handleDateSelect}
                />

                {modal.date && (
                  <div className="selected-date-badge">
                    ✨ {formatDate(modal.date)}
                  </div>
                )}

                <button
                  className="btn-primary modal-cta"
                  disabled={!modal.date}
                  onClick={handleDateConfirm}
                >
                  Confirm Date →
                </button>
              </>
            )}

            {/* ── Step 2: Payment ── */}
            {modal.step === STEPS.PAYMENT && (
              <>
                <div className="modal-header">
                  <div className="modal-icon">💳</div>
                  <h2 className="modal-title">Select Payment Option</h2>
                  <p className="modal-subtitle">{modal.pkg.name}</p>
                </div>

                <div className="booking-summary">
                  <span>Wedding Date</span>
                  <strong>{formatDate(modal.date)}</strong>
                  <span>Total Price</span>
                  <strong>{formatPrice(modal.pkg.price)}</strong>
                </div>

                <div className="payment-options">
                  <button
                    className="payment-option"
                    onClick={() => handlePaymentSelect('later')}
                  >
                    <div className="pay-icon">🗓️</div>
                    <div className="pay-info">
                      <div className="pay-label">Pay Later</div>
                      <div className="pay-desc">Reserve now, pay before the event</div>
                      <div className="pay-amount">Rs. 0 now</div>
                    </div>
                  </button>

                  <button
                    className="payment-option recommended"
                    onClick={() => handlePaymentSelect('advance')}
                  >
                    <div className="pay-badge">RECOMMENDED</div>
                    <div className="pay-icon">💰</div>
                    <div className="pay-info">
                      <div className="pay-label">Pay Advance (10%)</div>
                      <div className="pay-desc">Secure your date with a small deposit</div>
                      <div className="pay-amount">{formatPrice(Math.round(modal.pkg.price * 0.1))}</div>
                    </div>
                  </button>

                  <button
                    className="payment-option"
                    onClick={() => handlePaymentSelect('full')}
                  >
                    <div className="pay-icon">✅</div>
                    <div className="pay-info">
                      <div className="pay-label">Full Payment</div>
                      <div className="pay-desc">Pay in full and enjoy priority service</div>
                      <div className="pay-amount">{formatPrice(modal.pkg.price)}</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}