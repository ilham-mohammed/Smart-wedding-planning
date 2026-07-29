import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import './Vendors.css';

const staticVendors = [
  { id: 1, image: 'https://i.postimg.cc/k4xFL9Kp/professional-wedding-photographer-taking-pictures-260nw-2396969949.webp', name: 'Royal Photography', category: 'Photography', price: 'From Rs. 35,000', priceNum: 35000, desc: 'Professional wedding photography with 8 years experience', phone: '+94 77 123 4567' },
  { id: 2, image: 'https://i.postimg.cc/9QR9vChj/23817-0-wild-fleur-co-ditto-dianto.jpg', name: 'Bloom Florist', category: 'Florist', price: 'From Rs. 25,000', priceNum: 25000, desc: 'Beautiful floral arrangements for your dream wedding', phone: '+94 71 234 5678' },
  { id: 3, image: 'https://i.postimg.cc/d0h5HzWr/better.jpg', name: 'Harmony Music', category: 'Music & DJ', price: 'From Rs. 45,000', priceNum: 45000, desc: 'Live music and DJ services for your celebration', phone: '+94 76 345 6789' },
  { id: 4, image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=300', name: 'Golden Catering', category: 'Catering', price: 'From Rs. 75,000', priceNum: 75000, desc: 'Exquisite cuisine for your wedding reception', phone: '+94 77 456 7890' },
  { id: 5, image: 'https://i.postimg.cc/P5KqjGNV/elegant-outdoor-wedding-stockcake.webp', name: 'Glow Lighting', category: 'Lighting', price: 'From Rs. 30,000', priceNum: 30000, desc: 'Stunning lighting setups for magical atmosphere', phone: '+94 70 567 8901' },
  { id: 6, image: 'https://i.postimg.cc/284RTB1g/images.jpg', name: 'Sweet Cakes', category: 'Wedding Cake', price: 'From Rs. 20,000', priceNum: 20000, desc: 'Custom designed wedding cakes for your special day', phone: '+94 72 678 9012' },
  { id: 7, image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300', name: 'Cinema Films', category: 'Photography', price: 'From Rs. 50,000', priceNum: 50000, desc: 'Cinematic wedding videography and drone shots', phone: '+94 78 789 0123' },
  { id: 8, image: 'https://i.postimg.cc/2yCJmt17/wedding-flower-aisle-1080x720.jpg', name: 'Rose Garden', category: 'Florist', price: 'From Rs. 18,000', priceNum: 18000, desc: 'Fresh rose arrangements and bridal bouquets', phone: '+94 71 890 1234' },
];

const filters = ['All', 'Photography', 'Florist', 'Music & DJ', 'Catering', 'Lighting', 'Wedding Cake'];
const formatPrice = (n) => 'Rs. ' + Number(n).toLocaleString('en-LK');

// ── Mini Calendar ──
function MonthCalendar({ selectedDate, onSelect }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prev = () => { if (viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}else setViewMonth(m=>m-1); };
  const next = () => { if (viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}else setViewMonth(m=>m+1); };
  const cells = [];
  for(let i=0;i<firstDay;i++) cells.push(null);
  for(let d=1;d<=daysInMonth;d++) cells.push(d);
  return (
    <div className="calendar">
      <div className="cal-header">
        <button className="cal-nav" onClick={prev}>‹</button>
        <span className="cal-title">{monthNames[viewMonth]} {viewYear}</span>
        <button className="cal-nav" onClick={next}>›</button>
      </div>
      <div className="cal-grid">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=><div key={d} className="cal-day-name">{d}</div>)}
        {cells.map((day,i)=>{
          if(!day) return <div key={`e-${i}`}/>;
          const cellDate = new Date(viewYear,viewMonth,day);
          const isPast = cellDate < today;
          const isSelected = selectedDate && selectedDate.getDate()===day && selectedDate.getMonth()===viewMonth && selectedDate.getFullYear()===viewYear;
          return (
            <button key={day} className={`cal-day${isPast?' past':''}${isSelected?' selected':''}`} disabled={isPast} onClick={()=>!isPast&&onSelect(new Date(viewYear,viewMonth,day))}>
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
      <div className="cart-drawer" onClick={e=>e.stopPropagation()}>
        <div className="cart-header">
          <h2 className="cart-title">🛒 Your Selected Vendors</h2>
          <button className="cart-close" onClick={onClose}>✕</button>
        </div>

        {cart.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-icon">💍</div>
            <p>No vendors selected yet.<br/>Go pick your dream team!</p>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map((v, idx) => (
                <div className="cart-item" key={`${v.id}-${idx}`}>
                  <img src={v.image || 'https://via.placeholder.com/60'} alt={v.name} className="cart-item-img" />
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
                <span>Total ({cart.length} vendor{cart.length>1?'s':''})</span>
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
  const [step, setStep] = useState('calendar'); // 'calendar' | 'payment'
  const total = cart.reduce((sum, v) => sum + (v.priceNum || 0), 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        {step === 'calendar' && (
          <>
            <div className="modal-header">
              <div className="modal-icon">📅</div>
              <h2 className="modal-title">Choose Your Wedding Date</h2>
              <p className="modal-subtitle">{cart.length} vendor{cart.length>1?'s':''} selected</p>
            </div>
            <MonthCalendar selectedDate={date} onSelect={setDate} />
            {date && (
              <div className="selected-date-badge">
                ✨ {date.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}
              </div>
            )}
            <button className="btn-primary modal-cta" disabled={!date} onClick={()=>setStep('payment')}>
              Continue to Payment →
            </button>
          </>
        )}

        {step === 'payment' && (
          <>
            <div className="modal-header">
              <div className="modal-icon">💳</div>
              <h2 className="modal-title">Select Payment Option</h2>
              <p className="modal-subtitle">{date?.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</p>
            </div>

            <div className="booking-summary">
              <span>Vendors</span><strong>{cart.length} selected</strong>
              <span>Total Price</span><strong>{formatPrice(total)}</strong>
            </div>

            <div className="checkout-vendor-pills">
              {cart.map((v,i)=>(
                <span key={i} className="vendor-pill">{v.name}</span>
              ))}
            </div>

            <div className="payment-options">
              <button className="payment-option" onClick={()=>onPay('later', date, 0, total)}>
                <div className="pay-icon">🗓️</div>
                <div className="pay-info">
                  <div className="pay-label">Pay Later</div>
                  <div className="pay-desc">Reserve now, pay before the event</div>
                  <div className="pay-amount">Rs. 0 now</div>
                </div>
              </button>
              <button className="payment-option recommended" onClick={()=>onPay('advance', date, Math.round(total*0.1), total)}>
                <div className="pay-badge">RECOMMENDED</div>
                <div className="pay-icon">💰</div>
                <div className="pay-info">
                  <div className="pay-label">Pay Advance (10%)</div>
                  <div className="pay-desc">Secure your date with a small deposit</div>
                  <div className="pay-amount">{formatPrice(Math.round(total*0.1))}</div>
                </div>
              </button>
              <button className="payment-option" onClick={()=>onPay('full', date, total, total)}>
                <div className="pay-icon">✅</div>
                <div className="pay-info">
                  <div className="pay-label">Full Payment</div>
                  <div className="pay-desc">Pay in full and enjoy priority service</div>
                  <div className="pay-amount">{formatPrice(total)}</div>
                </div>
              </button>
            </div>

            <button className="back-step-btn" onClick={()=>setStep('calendar')}>← Change Date</button>
          </>
        )}
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

  // Cart state
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [addedIds, setAddedIds] = useState(new Set()); // for button state

  useEffect(() => {
    const fetchApprovedVendors = async () => {
      try {
        const q = query(collection(db, 'vendors'), where('approved', '==', true));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          // Parse priceNum from Firestore price string if not stored separately
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

  const allVendors = [...staticVendors, ...firestoreVendors];
  const filteredVendors = allVendors.filter(v => {
    const matchSearch = v.name?.toLowerCase().includes(search.toLowerCase()) || v.category?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === 'All' || v.category === activeFilter;
    return matchSearch && matchFilter;
  });

  const addToCart = (vendor) => {
    setCart(prev => [...prev, vendor]);
    setAddedIds(prev => new Set([...prev, vendor.id]));
    // Brief "added" flash then show cart badge
  };

  const removeFromCart = (index) => {
    const removed = cart[index];
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    // Only remove from addedIds if no other instance of same vendor remains
    const stillIn = newCart.some(v => v.id === removed.id);
    if (!stillIn) setAddedIds(prev => { const s = new Set(prev); s.delete(removed.id); return s; });
  };

  const revealPhone = (id, phone) => setRevealedPhones(prev => ({ ...prev, [id]: phone }));

  const handlePay = (paymentType, date, amountDue, total) => {
    navigate('/payment', {
  state: {
    packageName: `${cart.length} Vendor${cart.length > 1 ? 's' : ''} Selected`,
    weddingDate: date.toDateString(),
    totalPrice: total,
    paymentType,
    amountDue,

    vendors: cart   // <-- send complete vendor objects
  }
});
  };

  if (loading) return (
    <div className="vendors-page loading-state">
      <div className="loading-ring" />
      <p>Loading vendors…</p>
    </div>
  );

  return (
    <div>
      {/* Top Bar */}
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

        {/* Search */}
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search vendors by name or category..." value={search} onChange={e=>setSearch(e.target.value)} className="search-input" />
          {search && <button className="clear-btn" onClick={()=>setSearch('')}>✕</button>}
        </div>

        {/* Filters */}
        <div className="vendor-filter">
          {filters.map(f => (
            <button key={f} className={`filter-btn ${activeFilter===f?'active':''}`} onClick={()=>setActiveFilter(f)}>{f}</button>
          ))}
        </div>

        {/* Vendor Grid */}
        {filteredVendors.length === 0 ? (
          <div className="no-results">
            <p>😔 No vendors found for "<strong>{search}</strong>"</p>
            <button className="btn-primary" onClick={()=>{setSearch('');setActiveFilter('All');}}>Clear Search</button>
          </div>
        ) : (
          <div className="vendors-grid">
            {filteredVendors.map((vendor, idx) => {
              const uid = vendor.id || `static-${idx}`;
              const isAdded = addedIds.has(vendor.id);
              return (
                <div className={`vendor-card ${isAdded ? 'in-cart' : ''}`} key={uid}>
                  {isAdded && <div className="in-cart-ribbon">✓ In Cart</div>}
                  <img src={vendor.image || 'https://via.placeholder.com/300'} alt={vendor.name} className="vendor-image" />
                  <div className="vendor-name">{vendor.name}</div>
                  <div className="vendor-category">{vendor.category}</div>
                  <div className="vendor-price">{vendor.price || 'Contact for Pricing'}</div>
                  <p className="vendor-desc">{vendor.desc || 'No description available'}</p>
                  {vendor.phone && (
                    <div className="vendor-phone">
                      {revealedPhones[uid] ? (
                        <span>📞 {revealedPhones[uid]}</span>
                      ) : (
                        <button className="show-phone-btn" onClick={()=>revealPhone(uid, vendor.phone)}>📞 Show Phone Number</button>
                      )}
                    </div>
                  )}
                  <button
                    className={`btn-add ${isAdded ? 'btn-added' : ''}`}
                    onClick={() => addToCart(vendor)}
                  >
                    {isAdded ? '+ Add Again' : '+ Add Vendor'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Floating Cart Bar (shows when cart has items) ── */}
        {cart.length > 0 && (
          <div className="cart-bar">
            <div className="cart-bar-left">
              <span className="cart-bar-count">{cart.length} vendor{cart.length>1?'s':''} selected</span>
              <span className="cart-bar-total">{formatPrice(cart.reduce((s,v)=>s+(v.priceNum||0),0))}</span>
            </div>
            <div className="cart-bar-actions">
              <button className="cart-bar-view" onClick={()=>setShowCart(true)}>View Cart</button>
              <button className="cart-bar-checkout" onClick={()=>setShowCheckout(true)}>Checkout →</button>
            </div>
          </div>
        )}
      </div>

      <footer className="footer">
        <p>© 2026 Smart Wedding Planning | Trincomalee, Sri Lanka 💍</p>
      </footer>

      {/* Cart Drawer */}
      {showCart && (
        <CartDrawer
          cart={cart}
          onRemove={removeFromCart}
          onCheckout={()=>{setShowCart(false);setShowCheckout(true);}}
          onClose={()=>setShowCart(false)}
        />
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <CheckoutModal
          cart={cart}
          onClose={()=>setShowCheckout(false)}
          onPay={handlePay}
        />
      )}
    </div>
  );
}

export default Vendors;