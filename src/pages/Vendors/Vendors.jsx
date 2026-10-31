import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { db } from '../../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
  doc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './Vendors.css';

// ── Static vendor data – all IDs are now strings with "static_" prefix ──
const staticVendors = [
  {
    id: 'static_1',
    name: 'Elegant Decor',
    category: 'Decoration',
    price: 'From Rs. 30,000',
    priceNum: 30000,
    phone: '+94 77 123 4567',
    desc: 'Stunning decor setups for a magical wedding atmosphere',
    images: [
      'https://i.postimg.cc/MGGQkD1S/Whats-App-Image-2026-08-07-at-1-33-51-PM-(2).jpg',
      'https://i.postimg.cc/j2DwWdZg/Whats-App-Image-2026-08-07-at-1-33-52-PM.jpg',
      'https://i.postimg.cc/wvCymYPS/Whats-App-Image-2026-08-07-at-1-33-51-PM-(1).jpg',
      'https://i.postimg.cc/vmmVRz5Q/Whats-App-Image-2026-08-07-at-1-33-51-PM.jpg',
      'https://i.postimg.cc/mDz1kgdN/Whats-App-Image-2026-08-07-at-1-33-52-PM-(1).jpg',
    ],
    details: {
      experience: '6+ years',
      style: 'Modern, Rustic, Floral, Themed',
      materials: 'Fresh flowers, Drapery, Fairy lights, Props',
      services: 'Venue styling, Stage decor, Aisle decor, Table centerpieces',
      team: '1 lead designer + 3 assistants',
    },
  },
  {
    id: 'static_2',
    name: 'Bloom Florist',
    category: 'Florist',
    price: 'From Rs. 25,000',
    priceNum: 25000,
    phone: '+94 71 234 5678',
    desc: 'Beautiful floral arrangements for your dream wedding',
    images: [
       'https://i.postimg.cc/W1YM1CN3/Whats-App-Image-2026-08-07-at-1-49-16-PM.jpg',
      'https://i.postimg.cc/9QR9vChj/23817-0-wild-fleur-co-ditto-dianto.jpg',
      'https://i.postimg.cc/QdCTwmpy/Whats-App-Image-2026-08-07-at-1-49-16-PM-(1).jpg',
      'https://i.postimg.cc/288bLGXZ/Whats-App-Image-2026-08-07-at-1-49-15-PM-(1).jpg',
      'https://i.postimg.cc/V685fWCs/Whats-App-Image-2026-08-07-at-1-49-15-PM.jpg',
    ],
    details: {
      flower_types: 'Roses, Lilies, Orchids, Peonies, Tulips',
      services: 'Bridal Bouquet, Centerpieces, Aisle Decor, Arch',
      delivery: 'Free delivery within 50 km',
      custom_orders: 'Yes, with 2 weeks notice',
    },
  },
  {
    id: 'static_3',
    name: 'Harmony Music',
    category: 'Music & DJ',
    price: 'From Rs. 45,000',
    priceNum: 45000,
    phone: '+94 76 345 6789',
    desc: 'Live music and DJ services for your celebration',
    images: [
      'https://i.postimg.cc/brS5mkmt/Whats-App-Image-2026-08-07-at-1-55-22-PM.jpg',
      'https://i.postimg.cc/d0h5HzWr/better.jpg',
      'https://i.postimg.cc/9f1s0W40/Whats-App-Image-2026-08-07-at-1-55-47-PM.jpg',
      'https://i.postimg.cc/J7y7fFgX/Whats-App-Image-2026-08-07-at-1-55-21-PM-(1).jpg',
      'https://i.postimg.cc/0yv8JyN0/Whats-App-Image-2026-08-07-at-1-55-21-PM.jpg',
    ],
    details: {
      performers: '5-piece band, DJ, Saxophonist',
      genres: 'Pop, Jazz, Classical, Sri Lankan, Bollywood',
      duration: 'Up to 6 hours',
      sound_system: 'High-end JBL speakers, wireless mics',
    },
  },
  {
    id: 'static_4',
    name: 'Golden Catering',
    category: 'Catering',
    price: 'From Rs. 75,000',
    priceNum: 75000,
    phone: '+94 77 456 7890',
    desc: 'Exquisite cuisine for your wedding reception',
    images: [
      'https://images.unsplash.com/photo-1555244162-803834f70033?w=600',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
      'https://images.unsplash.com/photo-1556761223-4c4282c73f77?w=600',
    ],
    details: {
      cuisine_types: 'Sri Lankan, Indian, Chinese, Western, Italian',
      menu: 'Vegetarian, Non-Vegetarian, Seafood, Desserts',
      serving_style: 'Buffet, Sit-down, Food Stations',
      guest_capacity: 'Up to 500 guests',
      beverages: 'Soft drinks, Juice, Tea/Coffee, Bar service',
    },
    foodItems: [
      { foodName: 'Chicken Curry', foodType: 'Non-Veg', pricePerPerson: 'Rs. 450' },
      { foodName: 'Vegetable Fried Rice', foodType: 'Veg', pricePerPerson: 'Rs. 250' },
      { foodName: 'Fish Ambulthiyal', foodType: 'Non-Veg', pricePerPerson: 'Rs. 550' },
      { foodName: 'Watalappan', foodType: 'Dessert', pricePerPerson: 'Rs. 150' },
    ],
  },
  {
    id: 'static_5',
    name: 'Glow Lighting',
    category: 'Lighting',
    price: 'From Rs. 30,000',
    priceNum: 30000,
    phone: '+94 70 567 8901',
    desc: 'Stunning lighting setups for magical atmosphere',
    images: [
       'https://i.postimg.cc/HLX4gP13/images.jpg',
      'https://i.postimg.cc/P5KqjGNV/elegant-outdoor-wedding-stockcake.webp',
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600',
      
    ],
    details: {
      types: 'String lights, Uplights, Spotlights, LED Dance Floor',
      colors: 'RGB, Warm White, Cool White, Custom',
      installation: 'Professional team with 2 hours setup',
      power: 'Generator backup included',
    },
  },
  {
    id: 'static_6',
    name: 'Sweet Cakes',
    category: 'Wedding Cake',
    price: 'From Rs. 20,000',
    priceNum: 20000,
    phone: '+94 72 678 9012',
    desc: 'Custom designed wedding cakes for your special day',
    images: [
       'https://i.postimg.cc/tT7q68Rf/114465-D-0252-orig.jpg',
      'https://i.postimg.cc/284RTB1g/images.jpg',
      'https://i.postimg.cc/sgyZWfkn/Wedding-Cakes.jpg',
      'https://i.postimg.cc/85FFG76x/SAN5422.jpg',
      'https://i.postimg.cc/VsCSHb1W/images.jpg',
    ],
    details: {
      flavors: 'Vanilla, Chocolate, Red Velvet, Carrot, Fruit',
      sizes: '3-tier, 4-tier, 5-tier, Cupcake Tower',
      designs: 'Custom fondant, Buttercream, Fresh Flowers',
      servings: '50–200 guests',
    },
  },
  {
    id: 'static_7',
    name: 'Isuru Malshan Photography',
    category: 'Photography',
    price: 'From Rs. 50,000',
    priceNum: 50000,
    phone: '+94 78 789 0123',
    desc: 'Cinematic wedding videography and drone shots',
    images: [
      'https://i.postimg.cc/qqk9n3Gf/Whats-App-Image-2026-08-07-at-7-21-39-PM-(1).jpg',
      'https://i.postimg.cc/0jWHwHQz/Whats-App-Image-2026-08-07-at-7-21-38-PM.jpg',
      'https://i.postimg.cc/Ghf53N6n/Whats-App-Image-2026-08-07-at-7-21-37-PM.jpg',
      'https://i.postimg.cc/xC9sFSNg/Whats-App-Image-2026-08-07-at-7-21-39-PM.jpg',
      'https://i.postimg.cc/h4yCM6Dr/Whats-App-Image-2026-08-07-at-7-21-41-PM.jpg',
    ],
    details: {
      videography: '4K Cinematic, Highlight Reel, Full Ceremony',
      drone: 'Aerial shots with DJI Mavic 3',
      editing: 'Color grading, Sound design, Slow-motion',
      delivery: 'Digital download + USB drive',
    },
  },
  {
    id: 'static_8',
    name: 'Glam Makeup Studio',
    category: 'Makeup',
    price: 'From Rs. 18,000',
    priceNum: 18000,
    phone: '+94 71 890 1234',
    desc: 'Professional bridal makeup and hair styling for your big day',
    images: [
      'https://i.postimg.cc/1X39GtGd/Whats-App-Image-2026-08-07-at-7-31-23-PM.jpg',
      'https://i.postimg.cc/nz0xhJyY/Whats-App-Image-2026-08-07-at-7-31-26-PM.jpg',
      'https://i.postimg.cc/vZVGLCnm/Whats-App-Image-2026-08-07-at-7-31-20-PM.jpg',
      'https://i.postimg.cc/bNKhJL5P/Whats-App-Image-2026-08-07-at-7-31-27-PM.jpg',
    ],
    details: {
      services: 'Bridal Makeup, Hair Styling, Airbrush, Natural Glow',
      products: 'High-end brands (MAC, NARS, Huda Beauty)',
      trial: 'Complimentary trial session included',
      team: '1 lead artist + 2 assistants',
      duration: 'Up to 4 hours on wedding day',
    },
  },
];

const filters = ['All', 'Photography', 'Florist', 'Music & DJ', 'Catering', 'Lighting', 'Wedding Cake', 'Decoration', 'Makeup'];
const formatPrice = (n) => 'Rs. ' + Number(n).toLocaleString('en-LK');

// ── Star Rating Display ──
function StarRatingDisplay({ rating, reviewCount }) {
  if (rating === undefined || rating === null || rating === 0) {
    return <div className="vendor-rating vendor-rating-none">☆ No ratings yet</div>;
  }
  const rounded = Math.round(rating * 2) / 2;
  const full = Math.floor(rounded);
  const half = rounded - full === 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="vendor-rating">
      <span className="stars">
        {'★'.repeat(full)}
        {half ? '⯨' : ''}
        {'☆'.repeat(Math.max(empty, 0))}
      </span>
      <span className="rating-num">{rating.toFixed(1)}</span>
      {reviewCount !== undefined && reviewCount !== null && (
        <span className="review-count">({reviewCount})</span>
      )}
    </div>
  );
}

// ── Interactive Star Rating ──
function InteractiveRating({ selectedRating, onSelect, disabled = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="interactive-rating" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          style={{
            fontSize: '24px',
            cursor: disabled ? 'default' : 'pointer',
            color: star <= (hover || selectedRating) ? '#FFD700' : '#ccc',
            transition: 'color 0.15s',
          }}
          onMouseEnter={() => !disabled && setHover(star)}
          onMouseLeave={() => !disabled && setHover(0)}
          onClick={() => !disabled && onSelect(star)}
        >
          ★
        </span>
      ))}
      {selectedRating > 0 && <span style={{ marginLeft: '8px' }}>({selectedRating})</span>}
    </div>
  );
}

// ── Mini Calendar ──
function MonthCalendar({ selectedDate, onSelect }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1);
  };
  const next = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1);
  };
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return (
    <div className="calendar">
      <div className="cal-header">
        <button className="cal-nav" onClick={prev}>‹</button>
        <span className="cal-title">{monthNames[viewMonth]} {viewYear}</span>
        <button className="cal-nav" onClick={next}>›</button>
      </div>
      <div className="cal-grid">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="cal-day-name">{d}</div>)}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const cellDate = new Date(viewYear, viewMonth, day);
          const isPast = cellDate < today;
          const isSelected = selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === viewMonth && selectedDate.getFullYear() === viewYear;
          return (
            <button
              key={day}
              className={`cal-day${isPast ? ' past' : ''}${isSelected ? ' selected' : ''}`}
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

// ── Cart Drawer ──
function CartDrawer({ cart, onRemove, onCheckout, onClose }) {
  const total = cart.reduce((sum, v) => sum + (v.priceNum || 0), 0);
  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-drawer" onClick={e => e.stopPropagation()}>
        <div className="cart-header">
          <h2 className="cart-title">🛒 Your Selected Vendors</h2>
          <button className="cart-close" onClick={onClose}>✕</button>
        </div>
        {cart.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-icon">💍</div>
            <p>No vendors selected yet.<br />Go pick your dream team!</p>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map((v, idx) => (
                <div className="cart-item" key={`${v.id}-${idx}`}>
                  <img src={v.image || v.images?.[0] || 'https://via.placeholder.com/60'} alt={v.name} className="cart-item-img" />
                  <div className="cart-item-info">
                    <div className="cart-item-name">{v.name}</div>
                    <div className="cart-item-cat">{v.category}</div>
                    <div className="cart-item-price">{v.priceNum ? formatPrice(v.priceNum) : v.price}</div>
                  </div>
                  <button className="cart-remove" onClick={() => onRemove(idx)}>✕</button>
                </div>
              ))}
            </div>
            <div className="cart-footer">
              <div className="cart-total-row">
                <span>Total ({cart.length} vendor{cart.length > 1 ? 's' : ''})</span>
                <strong>{formatPrice(total)}</strong>
              </div>
              <button className="btn-checkout" onClick={onCheckout}>
                Proceed to Checkout →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Checkout Modal ──
function CheckoutModal({ cart, onClose, onPay }) {
  const [date, setDate] = useState(null);
  const [step, setStep] = useState('calendar');
  const total = cart.reduce((sum, v) => sum + (v.priceNum || 0), 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        {step === 'calendar' && (
          <>
            <div className="modal-header">
              <div className="modal-icon">📅</div>
              <h2 className="modal-title">Choose Your Wedding Date</h2>
              <p className="modal-subtitle">{cart.length} vendor{cart.length > 1 ? 's' : ''} selected</p>
            </div>
            <MonthCalendar selectedDate={date} onSelect={setDate} />
            {date && (
              <div className="selected-date-badge">
                ✨ {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            )}
            <button className="btn-primary modal-cta" disabled={!date} onClick={() => setStep('payment')}>
              Continue to Payment →
            </button>
          </>
        )}
        {step === 'payment' && (
          <>
            <div className="modal-header">
              <div className="modal-icon">💳</div>
              <h2 className="modal-title">Select Payment Option</h2>
              <p className="modal-subtitle">{date?.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="booking-summary">
              <span>Vendors</span><strong>{cart.length} selected</strong>
              <span>Total Price</span><strong>{formatPrice(total)}</strong>
            </div>
            <div className="checkout-vendor-pills">
              {cart.map((v, i) => (
                <span key={i} className="vendor-pill">{v.name}</span>
              ))}
            </div>
            <div className="payment-options">
              <button className="payment-option" onClick={() => onPay('later', date, 0, total)}>
                <div className="pay-icon">🗓️</div>
                <div className="pay-info">
                  <div className="pay-label">Pay Later</div>
                  <div className="pay-desc">Reserve now, pay before the event</div>
                  <div className="pay-amount">Rs. 0 now</div>
                </div>
              </button>
              <button className="payment-option recommended" onClick={() => onPay('advance', date, Math.round(total * 0.1), total)}>
                <div className="pay-badge">RECOMMENDED</div>
                <div className="pay-icon">💰</div>
                <div className="pay-info">
                  <div className="pay-label">Pay Advance (10%)</div>
                  <div className="pay-desc">Secure your date with a small deposit</div>
                  <div className="pay-amount">{formatPrice(Math.round(total * 0.1))}</div>
                </div>
              </button>
              <button className="payment-option" onClick={() => onPay('full', date, total, total)}>
                <div className="pay-icon">✅</div>
                <div className="pay-info">
                  <div className="pay-label">Full Payment</div>
                  <div className="pay-desc">Pay in full and enjoy priority service</div>
                  <div className="pay-amount">{formatPrice(total)}</div>
                </div>
              </button>
            </div>
            <button className="back-step-btn" onClick={() => setStep('calendar')}>← Change Date</button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Chat Modal ──
function ChatModal({ vendor, user, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const chatId = `${vendor.id}_${user.uid}`;

  useEffect(() => {
    const messagesRef = collection(db, 'vendorChats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => { console.error('Error listening to chat:', err); setLoading(false); }
    );
    return () => unsub();
  }, [chatId]);

  const sendMessage = async () => {
    const messageText = text.trim();
    if (!messageText || sending) return;
    setSending(true);
    setText('');
    try {
      const clientSnap = await getDoc(doc(db, 'clients', user.uid));
      const clientName = clientSnap.exists() ? clientSnap.data().name : user.email;
      const chatDocRef = doc(db, 'vendorChats', chatId);
      await setDoc(chatDocRef, {
        vendorId: vendor.id,
        vendorName: vendor.name,
        vendorImage: vendor.image || vendor.images?.[0] || '',
        userId: user.uid,
        userName: clientName || 'Customer',
        lastMessage: messageText,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      await addDoc(collection(db, 'vendorChats', chatId, 'messages'), {
        text: messageText,
        senderId: user.uid,
        senderName: user.displayName || user.email || 'Customer',
        senderType: 'user',
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="chat-modal-box" onClick={e => e.stopPropagation()}>
        <div className="chat-modal-header">
          <img src={vendor.image || vendor.images?.[0] || 'https://via.placeholder.com/40'} alt={vendor.name} className="chat-vendor-avatar" />
          <div className="chat-vendor-meta">
            <div className="chat-vendor-name">{vendor.name}</div>
            <div className="chat-vendor-category">{vendor.category}</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="chat-messages">
          {loading ? (
            <div className="chat-loading">Loading conversation…</div>
          ) : messages.length === 0 ? (
            <div className="chat-empty">👋 Say hello to {vendor.name} to start the conversation!</div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className={`chat-bubble ${msg.senderType === 'user' ? 'chat-bubble-user' : 'chat-bubble-vendor'}`}>
                <div className="chat-bubble-text">{msg.text}</div>
              </div>
            ))
          )}
        </div>
        <div className="chat-input-row">
          <input
            type="text"
            className="chat-input"
            placeholder={`Message ${vendor.name}...`}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="chat-send-btn" onClick={sendMessage} disabled={!text.trim() || sending}>Send</button>
        </div>
      </div>
    </div>
  );
}

// ── Vendor Details Modal (enhanced) ──
function VendorDetailsModal({ vendor, onClose, user, onRatingSubmitted, initialRating, initialReviewCount }) {
  const [ratings, setRatings] = useState([]);
  const [avgRating, setAvgRating] = useState(initialRating || vendor.rating || 0);
  const [reviewCount, setReviewCount] = useState(initialReviewCount || vendor.reviewCount || 0);
  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const formatLabel = (text) =>
    text
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());

  // Fetch ratings for this vendor
  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const q = query(collection(db, 'vendorRatings'), where('vendorId', '==', vendor.id));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRatings(data);
        if (data.length > 0) {
          const total = data.reduce((sum, r) => sum + r.rating, 0);
          const avg = total / data.length;
          setAvgRating(avg);
          setReviewCount(data.length);
        } else {
          setAvgRating(0);
          setReviewCount(0);
        }
        if (user) {
          const existing = data.find(r => r.userId === user.uid);
          if (existing) setUserRating(existing.rating);
        }
      } catch (err) {
        console.error('Error fetching ratings:', err);
      }
    };
    fetchRatings();
  }, [vendor.id, user]);

  const handleSubmitRating = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (submitting || userRating === 0) {
      alert('Please select a star rating first.');
      return;
    }

    setSubmitting(true);
    try {
      // Check for existing rating by this user
      const existingQuery = query(
        collection(db, 'vendorRatings'),
        where('vendorId', '==', vendor.id),
        where('userId', '==', user.uid)
      );
      const existingSnap = await getDocs(existingQuery);

      if (!existingSnap.empty) {
        const docRef = existingSnap.docs[0].ref;
        await updateDoc(docRef, {
          rating: userRating,
          comment: comment,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'vendorRatings'), {
          vendorId: vendor.id,
          userId: user.uid,
          userEmail: user.email || 'anonymous@example.com',
          rating: userRating,
          comment: comment,
          createdAt: serverTimestamp(),
        });
      }

      // Refresh ratings
      const q = query(collection(db, 'vendorRatings'), where('vendorId', '==', vendor.id));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRatings(data);
      if (data.length > 0) {
        const total = data.reduce((sum, r) => sum + r.rating, 0);
        const avg = total / data.length;
        setAvgRating(avg);
        setReviewCount(data.length);
        if (onRatingSubmitted) onRatingSubmitted(vendor.id, avg, data.length);
      }
      setComment('');
      toast.success('Rating submitted successfully!');
    } catch (err) {
      console.error('Firestore error:', err);
      toast.error(
  `Failed to submit rating: ${err.message || 'Unknown error'}`
);
    } finally {
      setSubmitting(false);
    }
  };

  const images = (vendor.images && vendor.images.length > 0) ? vendor.images : [vendor.image || 'https://via.placeholder.com/600'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="vendor-details-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <Swiper
          modules={[Navigation, Pagination]}
          navigation
          pagination={{ clickable: true }}
          className="vendor-details-swiper"
        >
          {images.map((img, index) => (
            <SwiperSlide key={index}>
              <img src={img} alt={`${vendor.name}-${index}`} className="vendor-details-image" />
            </SwiperSlide>
          ))}
        </Swiper>

        <h2>{vendor.name}</h2>
        <p><strong>Category:</strong> {vendor.category}</p>
        <p><strong>Price:</strong> {vendor.price}</p>
        <p><strong>Description:</strong> {vendor.desc}</p>
        <p><strong>Phone:</strong> {vendor.phone}</p>

        {vendor.details && Object.entries(vendor.details).map(([key, value]) => (
          <p key={key}>
            <strong>{formatLabel(key)}:</strong> {value}
          </p>
        ))}

        {vendor.category === 'Catering' && vendor.foodItems && (
          <>
            <h3>Food Menu</h3>
            <table className="food-menu-table">
              <thead>
                <tr>
                  <th>Food</th>
                  <th>Type</th>
                  <th>Price per Person</th>
                </tr>
              </thead>
              <tbody>
                {vendor.foodItems.map((item, i) => (
                  <tr key={i}>
                    <td>{item.foodName}</td>
                    <td>{item.foodType}</td>
                    <td>{item.pricePerPerson}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <div className="rating-section">
          <h3>Ratings & Reviews</h3>
          <div className="rating-summary">
            <StarRatingDisplay rating={avgRating} reviewCount={reviewCount} />
            <span className="rating-count">{reviewCount} reviews</span>
          </div>

          {user ? (
            <div className="user-rating-form">
              <p>Your rating:</p>
              <InteractiveRating
                selectedRating={userRating}
                onSelect={setUserRating}
                disabled={submitting}
              />
              <textarea
                className="rating-comment-input"
                placeholder="Share your experience (optional)"
                value={comment}
                onChange={e => setComment(e.target.value)}
                disabled={submitting}
              />
              <button
                className="btn-submit-rating"
                onClick={handleSubmitRating}
                disabled={submitting || userRating === 0}
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          ) : (
            <p>
              <button className="btn-link" onClick={() => navigate('/login')}>Login</button> to rate this vendor.
            </p>
          )}

          <div className="reviews-list">
            {ratings.length > 0 ? (
              ratings.map(r => (
                <div key={r.id} className="review-item">
                  <div className="review-header">
                    <span className="review-user">{r.userEmail || 'Anonymous'}</span>
                    <span className="review-rating">{'★'.repeat(r.rating)}</span>
                  </div>
                  {r.comment && <p className="review-comment">{r.comment}</p>}
                </div>
              ))
            ) : (
              <p className="no-reviews">No reviews yet. Be the first!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════
function Vendors() {
  const navigate = useNavigate();
  const [firestoreVendors, setFirestoreVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const { user } = useAuth();
  const [revealedPhones, setRevealedPhones] = useState({});
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [addedIds, setAddedIds] = useState(new Set());
  const [chatVendor, setChatVendor] = useState(null);

  // ── Global ratings map from Firestore ──
  const [vendorRatings, setVendorRatings] = useState({});

  // Fetch approved vendors from Firestore
  useEffect(() => {
    const fetchApprovedVendors = async () => {
      try {
        const q = query(collection(db, 'vendors'), where('approved', '==', true));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          const priceNum = d.priceNum || parseInt((d.price || '').replace(/[^0-9]/g, '')) || 0;
          return { id: doc.id, ...d, priceNum };
        });
        setFirestoreVendors(data);
      } catch (err) {
        console.error('Error fetching vendors:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApprovedVendors();
  }, []);

  // Fetch all ratings from Firestore for all vendors
  useEffect(() => {
    const fetchAllRatings = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'vendorRatings'));
        const ratingsMap = {};
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const vendorId = data.vendorId;
          if (!ratingsMap[vendorId]) {
            ratingsMap[vendorId] = { total: 0, count: 0 };
          }
          ratingsMap[vendorId].total += data.rating;
          ratingsMap[vendorId].count += 1;
        });
        const result = {};
        Object.keys(ratingsMap).forEach(id => {
          const { total, count } = ratingsMap[id];
          result[id] = { avgRating: total / count, reviewCount: count };
        });
        setVendorRatings(result);
      } catch (err) {
        console.error('Error fetching ratings:', err);
      }
    };
    fetchAllRatings();
  }, []);

  // Combine static + firestore vendors
  const allVendors = [...staticVendors, ...firestoreVendors];

  const getVendorRating = (vendor) => {
    const id = String(vendor.id);
    if (vendorRatings[id]) {
      return {
        rating: vendorRatings[id].avgRating,
        reviewCount: vendorRatings[id].reviewCount,
      };
    }
    return {
      rating: vendor.rating || 0,
      reviewCount: vendor.reviewCount || 0,
    };
  };

  const filteredVendors = allVendors.filter(v => {
    const matchSearch = v.name?.toLowerCase().includes(search.toLowerCase()) || v.category?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === 'All' || v.category === activeFilter;
    return matchSearch && matchFilter;
  });

  const addToCart = (vendor) => {
    if (cart.some(v => v.id === vendor.id)) {
      alert(`${vendor.name} is already in your cart.`);
      return;
    }
    setCart(prev => [...prev, vendor]);
    setAddedIds(prev => new Set([...prev, vendor.id]));
  };

  const removeFromCart = (index) => {
    const removed = cart[index];
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    const stillIn = newCart.some(v => v.id === removed.id);
    if (!stillIn) {
      setAddedIds(prev => {
        const s = new Set(prev);
        s.delete(removed.id);
        return s;
      });
    }
  };

  const revealPhone = (id, phone) => setRevealedPhones(prev => ({ ...prev, [id]: phone }));
  const openChat = (vendor) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setChatVendor(vendor);
  };

  const handlePay = (paymentType, date, amountDue, total) => {
    navigate('/payment', {
      state: {
        packageName: `${cart.length} Vendor${cart.length > 1 ? 's' : ''} Selected`,
        weddingDate: date.toDateString(),
        totalPrice: total,
        paymentType,
        amountDue,
        vendors: cart,
      },
    });
  };

  const handleRatingSubmitted = (vendorId, newAvg, newCount) => {
    setVendorRatings(prev => ({
      ...prev,
      [vendorId]: { avgRating: newAvg, reviewCount: newCount },
    }));
  };

  if (loading) return (
    <div className="vendors-page loading-state">
      <div className="loading-ring" />
      <p>Loading vendors…</p>
    </div>
  );

  return (
    <div>
      <div className="top-bar">
        <Link to="/" className="back-home-btn">← Back to Home</Link>
        <div className="top-bar-right">
          {cart.length > 0 && (
            <button className="cart-fab" onClick={() => setShowCart(true)}>
              🛒
              <span className="cart-count">{cart.length}</span>
            </button>
          )}
          <Link to="/vendor-login">
            <button className="vendor-login-btn">🏪 Login as Vendor</button>
          </Link>
        </div>
      </div>

      <div className="vendors-page">
        <h1 className="section-title">Our Vendors</h1>
        <p className="section-subtitle">Build your perfect wedding team</p>

        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search vendors by name or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
          {search && <button className="clear-btn" onClick={() => setSearch('')}>✕</button>}
        </div>

        <div className="vendor-filter">
          {filters.map(f => (
            <button
              key={f}
              className={`filter-btn ${activeFilter === f ? 'active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {filteredVendors.length === 0 ? (
          <div className="no-results">
            <p>😔 No vendors found for "<strong>{search}</strong>"</p>
            <button className="btn-primary" onClick={() => { setSearch(''); setActiveFilter('All'); }}>Clear Search</button>
          </div>
        ) : (
          <div className="vendors-grid">
            {filteredVendors.map((vendor, idx) => {
              const uid = vendor.id || `static-${idx}`;
              const isAdded = addedIds.has(vendor.id);
              const isInCart = cart.some(v => v.id === vendor.id);
              const images = vendor.images && vendor.images.length > 0 ? vendor.images : [vendor.image || 'https://via.placeholder.com/600'];
              const { rating, reviewCount } = getVendorRating(vendor);

              return (
                <div
                  className={`vendor-card ${isAdded ? 'in-cart' : ''}`}
                  key={uid}
                  onClick={() => setSelectedVendor(vendor)}
                >
                  {isAdded && <div className="in-cart-ribbon">✓ In Cart</div>}
                  <div onClick={e => e.stopPropagation()}>
                    <Swiper
                      modules={[Navigation, Pagination]}
                      navigation
                      pagination={{ clickable: true }}
                      spaceBetween={0}
                      slidesPerView={1}
                      className="vendor-swiper"
                    >
                      {images.map((img, index) => (
                        <SwiperSlide key={index}>
                          <img src={img} alt={`${vendor.name}-${index}`} className="vendor-image" />
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  </div>
                  <div className="vendor-name">{vendor.name}</div>
                  <div className="vendor-category">{vendor.category}</div>
                  <StarRatingDisplay rating={rating} reviewCount={reviewCount} />
                  <div className="vendor-price">{vendor.price || 'Contact for Pricing'}</div>
                  <p className="vendor-desc">{vendor.desc || 'No description available'}</p>
                  {vendor.phone && (
                    <div className="vendor-phone">
                      {revealedPhones[uid] ? (
                        <span>📞 {revealedPhones[uid]}</span>
                      ) : (
                        <button
                          className="show-phone-btn"
                          onClick={(e) => { e.stopPropagation(); revealPhone(uid, vendor.phone); }}
                        >
                          📞 Show Phone Number
                        </button>
                      )}
                    </div>
                  )}
                  <div className="vendor-card-actions">
                    <button
                      className={`btn-add ${isAdded ? 'btn-added' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isInCart) addToCart(vendor);
                        else alert('Already added to cart');
                      }}
                      disabled={isInCart}
                    >
                      {isInCart ? '✓ Added' : '+ Add Vendor'}
                    </button>
                    <button className="btn-chat" onClick={(e) => { e.stopPropagation(); openChat(vendor); }}>
                      💬 Chat
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {cart.length > 0 && (
          <div className="cart-bar">
            <div className="cart-bar-left">
              <span className="cart-bar-count">{cart.length} vendor{cart.length > 1 ? 's' : ''} selected</span>
              <span className="cart-bar-total">{formatPrice(cart.reduce((s, v) => s + (v.priceNum || 0), 0))}</span>
            </div>
            <div className="cart-bar-actions">
              <button className="cart-bar-view" onClick={() => setShowCart(true)}>View Cart</button>
              <button className="cart-bar-checkout" onClick={() => setShowCheckout(true)}>Checkout →</button>
            </div>
          </div>
        )}
      </div>

      <footer className="footer">
        <p>© 2026 Smart Wedding Planning | Trincomalee, Sri Lanka 💍</p>
      </footer>

      {showCart && (
        <CartDrawer
          cart={cart}
          onRemove={removeFromCart}
          onCheckout={() => { setShowCart(false); setShowCheckout(true); }}
          onClose={() => setShowCart(false)}
        />
      )}
      {showCheckout && (
        <CheckoutModal
          cart={cart}
          onClose={() => setShowCheckout(false)}
          onPay={handlePay}
        />
      )}
      {chatVendor && user && (
        <ChatModal
          vendor={chatVendor}
          user={user}
          onClose={() => setChatVendor(null)}
        />
      )}
      {selectedVendor && (
        <VendorDetailsModal
          vendor={selectedVendor}
          onClose={() => setSelectedVendor(null)}
          user={user}
          onRatingSubmitted={handleRatingSubmitted}
          initialRating={getVendorRating(selectedVendor).rating}
          initialReviewCount={getVendorRating(selectedVendor).reviewCount}
        />
      )}
    </div>
  );
}

export default Vendors;