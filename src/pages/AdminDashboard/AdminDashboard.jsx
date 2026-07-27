import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { db } from '../../firebase';
import { collection, query, where, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AdminDashboard.css';

// Static vendor data
const staticVendors = [
  { id: 1, name: 'Royal Photography', category: 'Photography', price: 'From Rs. 35,000', desc: 'Professional wedding photography', phone: '+94 77 123 4567' },
  { id: 2, name: 'Bloom Florist', category: 'Florist', price: 'From Rs. 25,000', desc: 'Beautiful floral arrangements', phone: '+94 71 234 5678' },
  { id: 3, name: 'Harmony Music', category: 'Music & DJ', price: 'From Rs. 45,000', desc: 'Live music and DJ services', phone: '+94 76 345 6789' },
  { id: 4, name: 'Golden Catering', category: 'Catering', price: 'From Rs. 75,000', desc: 'Exquisite cuisine', phone: '+94 77 456 7890' },
  { id: 5, name: 'Glow Lighting', category: 'Lighting', price: 'From Rs. 30,000', desc: 'Stunning lighting setups', phone: '+94 70 567 8901' },
  { id: 6, name: 'Sweet Cakes', category: 'Wedding Cake', price: 'From Rs. 20,000', desc: 'Custom designed wedding cakes', phone: '+94 72 678 9012' },
  { id: 7, name: 'Cinema Films', category: 'Photography', price: 'From Rs. 50,000', desc: 'Cinematic wedding videography', phone: '+94 78 789 0123' },
  { id: 8, name: 'Rose Garden', category: 'Florist', price: 'From Rs. 18,000', desc: 'Fresh rose arrangements', phone: '+94 71 890 1234' },
];

// Static supplies with item details
const staticSupplies = [
  { id: 's1', name: 'Floral Centerpieces', qty: 30 },
  { id: 's2', name: 'Table Linens', qty: 50 },
  { id: 's3', name: 'Chair Covers', qty: 100 },
  { id: 's4', name: 'Fairy Lights', qty: 20 },
  { id: 's5', name: 'Candle Holders', qty: 80 },
  { id: 's6', name: 'Balloon Arches', qty: 5 },
  { id: 's7', name: 'Backdrop Stands', qty: 8 },
  { id: 's8', name: 'Welcome Sign Boards', qty: 10 },
  { id: 's9', name: 'Aisle Runners', qty: 15 },
  { id: 's10', name: 'Cake Stands', qty: 12 },
  { id: 's11', name: 'Photo Booth Props', qty: 40 },
  { id: 's12', name: 'Guest Book Kits', qty: 6 },
  { id: 's13', name: 'Unity Candle Sets', qty: 10 },
  { id: 's14', name: 'Ring Pillows', qty: 8 },
  { id: 's15', name: 'Flower Girl Baskets', qty: 10 },
  { id: 's16', name: 'Table Number Frames', qty: 40 },
  { id: 's17', name: 'Menu Card Holders', qty: 60 },
];

// Static inventory items
const staticInventory = [
  { id: 'i1', name: 'Bridal Arch' },
  { id: 'i2', name: 'Mandap Set' },
  { id: 'i3', name: 'Round Tables (10)' },
  { id: 'i4', name: 'Banquet Chairs (100)' },
  { id: 'i5', name: 'Gold Candelabras' },
  { id: 'i6', name: 'Sound System' },
  { id: 'i7', name: 'LED Dance Floor' },
  { id: 'i8', name: 'Photo Booth Unit' },
  { id: 'i9', name: 'Projector & Screen' },
  { id: 'i10', name: 'Buffet Warmers' },
  { id: 'i11', name: 'Chandeliers (6)' },
  { id: 'i12', name: 'Cocktail Tables' },
  { id: 'i13', name: 'Ice Cream Cart' },
  { id: 'i14', name: 'Vintage Car (Decoration)' },
  { id: 'i15', name: 'Floral Wall Panel' },
];

// Static customers
const staticCustomers = [
  { id: 'c1', name: 'Amara & Dinesh', phone: '+94 77 100 2001', weddingDate: '2026-04-07', package: 'Full Package', venue: 'Grand Ballroom, Colombo' },
  { id: 'c2', name: 'Sithara & Kasun', phone: '+94 71 200 3002', weddingDate: '2026-04-13', package: 'Full Package', venue: 'Cinnamon Grand, Colombo' },
  { id: 'c3', name: 'Nisha & Roshan', phone: '+94 76 300 4003', weddingDate: '2026-06-21', package: 'Standard Package', venue: 'Hotel Galadari, Colombo' },
];

// Static weddings
const staticWeddings = [
  { id: 'w1', couple: 'Amara & Dinesh', date: '2026-04-07', venue: 'Grand Ballroom' },
  { id: 'w2', couple: 'Sithara & Kasun', date: '2026-04-13', venue: 'Cinnamon Grand' },
  { id: 'w3', couple: 'Nisha & Roshan', date: '2026-06-21', venue: 'Hotel Galadari' },
  { id: 'w4', couple: 'Priya & Thilak', date: '2026-07-05', venue: 'Mount Lavinia Hotel' },
  { id: 'w5', couple: 'Chamari & Nuwan', date: '2026-08-12', venue: 'Kingsbury Hotel' },
];

const AdminDashboard = () => {
  useEffect(() => {
    const isAdmin = localStorage.getItem('adminAuth');
    if (!isAdmin) window.location.href = '/admin-login';
  }, []);

  const [pendingVendors, setPendingVendors] = useState([]);
  const [approvedVendors, setApprovedVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [approvedReviews, setApprovedReviews] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookingsOnDate, setBookingsOnDate] = useState([]);

  // Modals
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showSuppliesModal, setShowSuppliesModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showWeddingsModal, setShowWeddingsModal] = useState(false);

  // Active section tabs
  const [vendorTab, setVendorTab] = useState('pending'); // 'pending' | 'approved'
  const [reviewTab, setReviewTab] = useState('pending'); // 'pending' | 'approved'

  const totalVendorsCount = staticVendors.length + approvedVendors.length;

  const getCategoryCounts = () => {
    const allVendors = [...staticVendors, ...approvedVendors];
    const categoryMap = new Map();
    allVendors.forEach(v => {
      const cat = v.category;
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    });
    return Array.from(categoryMap.entries()).map(([category, count]) => ({ category, count }));
  };
  const vendorCategoryData = getCategoryCounts();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const vendorsRef = collection(db, 'vendors');
        const pendingSnap = await getDocs(query(vendorsRef, where('approved', '==', false)));
        const approvedSnap = await getDocs(query(vendorsRef, where('approved', '==', true)));
        setPendingVendors(pendingSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setApprovedVendors(approvedSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const reviewsRef = collection(db, 'reviews');
        const pendingReviewsSnap = await getDocs(query(reviewsRef, where('approved', '==', false)));
        const approvedReviewsSnap = await getDocs(query(reviewsRef, where('approved', '==', true)));
        setPendingReviews(pendingReviewsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setApprovedReviews(approvedReviewsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const bookingsSnap = await getDocs(collection(db, 'bookings'));
        setAllBookings(bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Combine static + firestore bookings for calendar
  const allCombinedBookings = [
    ...staticCustomers.map(c => ({ id: c.id, clientName: c.name, clientPhone: c.phone, weddingDate: c.weddingDate, vendorName: c.package, venue: c.venue })),
    ...allBookings,
  ];

  useEffect(() => {
    if (!selectedDate) return;
    const filtered = allCombinedBookings.filter(
      b => b.weddingDate && new Date(b.weddingDate).toDateString() === selectedDate.toDateString()
    );
    setBookingsOnDate(filtered);
  }, [selectedDate, allBookings]);

  // Vendor actions
  const approveVendor = async (vendorId) => {
    try {
      await updateDoc(doc(db, 'vendors', vendorId), { approved: true });
      const vendorToMove = pendingVendors.find(v => v.id === vendorId);
      setPendingVendors(prev => prev.filter(v => v.id !== vendorId));
      if (vendorToMove) setApprovedVendors(prev => [...prev, { ...vendorToMove, approved: true }]);
      toast.success('Vendor approved!');
    } catch (error) { toast.error('Failed to approve vendor.'); }
  };

  const revokeVendor = async (vendorId) => {
    try {
      await updateDoc(doc(db, 'vendors', vendorId), { approved: false });
      const vendorToMove = approvedVendors.find(v => v.id === vendorId);
      setApprovedVendors(prev => prev.filter(v => v.id !== vendorId));
      if (vendorToMove) setPendingVendors(prev => [...prev, { ...vendorToMove, approved: false }]);
      toast.info('Vendor approval revoked.');
    } catch (error) { toast.error('Failed to revoke vendor.'); }
  };

  const deleteVendor = async (vendorId) => {
    if (window.confirm('Delete this vendor permanently?')) {
      try {
        await deleteDoc(doc(db, 'vendors', vendorId));
        setPendingVendors(prev => prev.filter(v => v.id !== vendorId));
        setApprovedVendors(prev => prev.filter(v => v.id !== vendorId));
        toast.success('Vendor deleted.');
      } catch (error) { toast.error('Failed to delete vendor.'); }
    }
  };

  // Review actions
  const approveReview = async (reviewId) => {
    try {
      await updateDoc(doc(db, 'reviews', reviewId), { approved: true });
      const reviewToMove = pendingReviews.find(r => r.id === reviewId);
      setPendingReviews(prev => prev.filter(r => r.id !== reviewId));
      if (reviewToMove) setApprovedReviews(prev => [...prev, { ...reviewToMove, approved: true }]);
      toast.success('Review approved!');
    } catch (error) { toast.error('Failed to approve review.'); }
  };

  const revokeReview = async (reviewId) => {
    try {
      await updateDoc(doc(db, 'reviews', reviewId), { approved: false });
      const reviewToMove = approvedReviews.find(r => r.id === reviewId);
      setApprovedReviews(prev => prev.filter(r => r.id !== reviewId));
      if (reviewToMove) setPendingReviews(prev => [...prev, { ...reviewToMove, approved: false }]);
      toast.info('Review approval revoked.');
    } catch (error) { toast.error('Failed to revoke review.'); }
  };

  const deleteReview = async (reviewId) => {
    if (window.confirm('Delete this review?')) {
      try {
        await deleteDoc(doc(db, 'reviews', reviewId));
        setPendingReviews(prev => prev.filter(r => r.id !== reviewId));
        setApprovedReviews(prev => prev.filter(r => r.id !== reviewId));
        toast.success('Review deleted!');
      } catch (error) { toast.error('Failed to delete review.'); }
    }
  };

  const getBookedDates = () =>
    allCombinedBookings.filter(b => b.weddingDate).map(b => new Date(b.weddingDate).toDateString());

  const tileClassName = ({ date, view }) =>
    view === 'month' && getBookedDates().includes(date.toDateString()) ? 'booked-date' : null;

  const handleLogout = () => { localStorage.removeItem('adminAuth'); window.location.href = '/admin-login'; };

  const allApprovedVendors = [...staticVendors, ...approvedVendors];

  if (loading) return <div className="admin-dashboard loading-screen"><div className="spinner"></div><p>Loading Dashboard...</p></div>;

  return (
    <div className="admin-dashboard">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      <header className="dashboard-header">
        <div className="header-left"><Link to="/" className="back-home">← Back to Home</Link></div>
        <div className="header-center"><h2>✦ Admin Dashboard ✦</h2></div>
        <div className="header-right"><button onClick={handleLogout} className="logout-btn">Logout</button></div>
      </header>

      {/* Stats */}
      <div className="dashboard-stats">
        <div className="stat-card clickable" onClick={() => setShowWeddingsModal(true)}>
          <div className="stat-icon">💍</div>
          <h3>Weddings</h3>
          <p>{staticWeddings.length}</p>
          <span className="click-hint">Click to view</span>
        </div>
        <div className="stat-card clickable" onClick={() => setShowInventoryModal(true)}>
          <div className="stat-icon">📦</div>
          <h3>Inventory Items</h3>
          <p>{staticInventory.length}</p>
          <span className="click-hint">Click to view</span>
        </div>
        <div className="stat-card clickable" onClick={() => setShowSuppliesModal(true)}>
          <div className="stat-icon">🛒</div>
          <h3>Supplies</h3>
          <p>{staticSupplies.length}</p>
          <span className="click-hint">Click to view</span>
        </div>
        <div className="stat-card clickable" onClick={() => setShowCustomerModal(true)}>
          <div className="stat-icon">👥</div>
          <h3>Customers</h3>
          <p>{staticCustomers.length}</p>
          <span className="click-hint">Click to view</span>
        </div>
        <div className="stat-card clickable" onClick={() => setShowVendorModal(true)}>
          <div className="stat-icon">🏪</div>
          <h3>Vendors</h3>
          <p>{totalVendorsCount}</p>
          <span className="click-hint">Click to view</span>
        </div>
      </div>

      {/* Vendor Management Section */}
      <div className="management-section">
        <div className="section-header">
          <h3>🏪 Vendor Management</h3>
          <div className="tab-buttons">
            <button className={`tab-btn ${vendorTab === 'pending' ? 'active' : ''}`} onClick={() => setVendorTab('pending')}>
              Pending {pendingVendors.length > 0 && <span className="badge">{pendingVendors.length}</span>}
            </button>
            <button className={`tab-btn ${vendorTab === 'approved' ? 'active' : ''}`} onClick={() => setVendorTab('approved')}>
              Approved {approvedVendors.length > 0 && <span className="badge green">{approvedVendors.length}</span>}
            </button>
          </div>
        </div>

        {vendorTab === 'pending' && (
          pendingVendors.length === 0
            ? <p className="empty-msg">✅ No pending vendor approvals.</p>
            : (
              <table className="admin-table">
                <thead><tr><th>Business Name</th><th>Category</th><th>Email</th><th>Phone</th><th>Actions</th></tr></thead>
                <tbody>
                  {pendingVendors.map(vendor => (
                    <tr key={vendor.id}>
                      <td>{vendor.name}</td><td>{vendor.category}</td><td>{vendor.email}</td><td>{vendor.phone}</td>
                      <td className="action-btns">
                        <button onClick={() => approveVendor(vendor.id)} className="approve-btn">✓ Approve</button>
                        <button onClick={() => deleteVendor(vendor.id)} className="delete-btn">✕ Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
        )}

        {vendorTab === 'approved' && (
          approvedVendors.length === 0
            ? <p className="empty-msg">No approved vendors yet.</p>
            : (
              <table className="admin-table">
                <thead><tr><th>Business Name</th><th>Category</th><th>Email</th><th>Phone</th><th>Actions</th></tr></thead>
                <tbody>
                  {approvedVendors.map(vendor => (
                    <tr key={vendor.id}>
                      <td>{vendor.name}</td><td>{vendor.category}</td><td>{vendor.email}</td><td>{vendor.phone}</td>
                      <td className="action-btns">
                        <button onClick={() => revokeVendor(vendor.id)} className="revoke-btn">↩ Revoke</button>
                        <button onClick={() => deleteVendor(vendor.id)} className="delete-btn">✕ Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
        )}
      </div>

      {/* Review Management Section */}
      <div className="management-section">
        <div className="section-header">
          <h3>⭐ Review Management</h3>
          <div className="tab-buttons">
            <button className={`tab-btn ${reviewTab === 'pending' ? 'active' : ''}`} onClick={() => setReviewTab('pending')}>
              Pending {pendingReviews.length > 0 && <span className="badge">{pendingReviews.length}</span>}
            </button>
            <button className={`tab-btn ${reviewTab === 'approved' ? 'active' : ''}`} onClick={() => setReviewTab('approved')}>
              Approved {approvedReviews.length > 0 && <span className="badge green">{approvedReviews.length}</span>}
            </button>
          </div>
        </div>

        {reviewTab === 'pending' && (
          pendingReviews.length === 0
            ? <p className="empty-msg">✅ No pending reviews.</p>
            : (
              <table className="admin-table">
                <thead><tr><th>Couple</th><th>Review</th><th>Image</th><th>Actions</th></tr></thead>
                <tbody>
                  {pendingReviews.map(review => (
                    <tr key={review.id}>
                      <td>{review.couple}</td>
                      <td>{review.text?.substring(0, 100)}...</td>
                      <td>{review.image ? <a href={review.image} target="_blank" rel="noopener noreferrer">View</a> : 'N/A'}</td>
                      <td className="action-btns">
                        <button onClick={() => approveReview(review.id)} className="approve-btn">✓ Approve</button>
                        <button onClick={() => deleteReview(review.id)} className="delete-btn">✕ Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
        )}

        {reviewTab === 'approved' && (
          approvedReviews.length === 0
            ? <p className="empty-msg">No approved reviews yet.</p>
            : (
              <table className="admin-table">
                <thead><tr><th>Couple</th><th>Review</th><th>Image</th><th>Actions</th></tr></thead>
                <tbody>
                  {approvedReviews.map(review => (
                    <tr key={review.id}>
                      <td>{review.couple}</td>
                      <td>{review.text?.substring(0, 100)}...</td>
                      <td>{review.image ? <a href={review.image} target="_blank" rel="noopener noreferrer">View</a> : 'N/A'}</td>
                      <td className="action-btns">
                        <button onClick={() => revokeReview(review.id)} className="revoke-btn">↩ Revoke</button>
                        <button onClick={() => deleteReview(review.id)} className="delete-btn">✕ Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
        )}
      </div>

      {/* Vendor Category Chart */}
      <div className="chart-section">
        <h3>📊 Vendor Distribution by Category</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={vendorCategoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#fbc4d044" />
            <XAxis dataKey="category" tick={{ fill: '#b45309', fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fill: '#b45309' }} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #fbc4d0' }} />
            <Legend />
            <Bar dataKey="count" fill="#d4af37" name="Number of Vendors" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Calendar */}
      <div className="calendar-section">
        <h3>📅 Wedding Bookings Calendar</h3>
        <div className="admin-calendar-container">
          <Calendar onChange={setSelectedDate} value={selectedDate} tileClassName={tileClassName} />
          <div className="bookings-on-date">
            <h4>📌 {selectedDate.toDateString()}</h4>
            {bookingsOnDate.length > 0 ? (
              <ul>
                {bookingsOnDate.map(b => (
                  <li key={b.id}>
                    <strong>👫 {b.clientName}</strong>
                    <span>📞 {b.clientPhone}</span>
                    <span>📦 {b.vendorName || b.package || 'N/A'}</span>
                    {b.venue && <span>📍 {b.venue}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="no-bookings">
                <span>🗓️</span>
                <p>No bookings on this date.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}

      {/* Weddings Modal */}
      {showWeddingsModal && (
        <div className="modal-overlay" onClick={() => setShowWeddingsModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>💍 Upcoming Weddings ({staticWeddings.length})</h3>
            <table className="admin-table">
              <thead><tr><th>#</th><th>Couple</th><th>Date</th><th>Venue</th></tr></thead>
              <tbody>
                {staticWeddings.map((w, i) => (
                  <tr key={w.id}>
                    <td>{i + 1}</td>
                    <td>{w.couple}</td>
                    <td>{new Date(w.date).toDateString()}</td>
                    <td>{w.venue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => setShowWeddingsModal(false)} className="close-modal-btn">Close</button>
          </div>
        </div>
      )}

      {/* Inventory Modal */}
      {showInventoryModal && (
        <div className="modal-overlay" onClick={() => setShowInventoryModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>📦 Inventory Items ({staticInventory.length})</h3>
            <table className="admin-table">
              <thead><tr><th>#</th><th>Item Name</th></tr></thead>
              <tbody>
                {staticInventory.map((item, i) => (
                  <tr key={item.id}><td>{i + 1}</td><td>{item.name}</td></tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => setShowInventoryModal(false)} className="close-modal-btn">Close</button>
          </div>
        </div>
      )}

      {/* Supplies Modal */}
      {showSuppliesModal && (
        <div className="modal-overlay" onClick={() => setShowSuppliesModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>🛒 Supplies ({staticSupplies.length})</h3>
            <table className="admin-table">
              <thead><tr><th>#</th><th>Supply Name</th><th>Qty</th></tr></thead>
              <tbody>
                {staticSupplies.map((s, i) => (
                  <tr key={s.id}><td>{i + 1}</td><td>{s.name}</td><td>{s.qty}</td></tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => setShowSuppliesModal(false)} className="close-modal-btn">Close</button>
          </div>
        </div>
      )}

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="modal-overlay" onClick={() => { setShowCustomerModal(false); setSelectedCustomer(null); }}>
          <div className="modal-content wide-modal" onClick={e => e.stopPropagation()}>
            <h3>👥 Customers ({staticCustomers.length})</h3>
            <div className="customer-layout">
              <table className="admin-table customer-table">
                <thead><tr><th>Name</th><th>Phone</th><th>Details</th></tr></thead>
                <tbody>
                  {staticCustomers.map(c => (
                    <tr key={c.id} onClick={() => setSelectedCustomer(c)} className={`clickable-row ${selectedCustomer?.id === c.id ? 'selected-row' : ''}`}>
                      <td>{c.name}</td>
                      <td>{c.phone}</td>
                      <td>🔍 View</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {selectedCustomer && (
                <div className="vendor-detail-panel">
                  <h4>Customer Details</h4>
                  <p><strong>👫 Couple:</strong> {selectedCustomer.name}</p>
                  <p><strong>📞 Phone:</strong> {selectedCustomer.phone}</p>
                  <p><strong>📅 Wedding Date:</strong> {new Date(selectedCustomer.weddingDate).toDateString()}</p>
                  <p><strong>📦 Package:</strong> {selectedCustomer.package}</p>
                  <p><strong>📍 Venue:</strong> {selectedCustomer.venue}</p>
                </div>
              )}
            </div>
            <button onClick={() => { setShowCustomerModal(false); setSelectedCustomer(null); }} className="close-modal-btn">Close</button>
          </div>
        </div>
      )}

      {/* Vendor Modal */}
      {showVendorModal && (
        <div className="modal-overlay" onClick={() => { setShowVendorModal(false); setSelectedVendor(null); }}>
          <div className="modal-content wide-modal" onClick={e => e.stopPropagation()}>
            <h3>🏪 All Vendors ({allApprovedVendors.length})</h3>
            <div className="customer-layout">
              <table className="admin-table">
                <thead><tr><th>Name</th><th>Phone</th><th>Details</th></tr></thead>
                <tbody>
                  {allApprovedVendors.map(vendor => (
                    <tr key={vendor.id} onClick={() => setSelectedVendor(vendor)} className={`clickable-row ${selectedVendor?.id === vendor.id ? 'selected-row' : ''}`}>
                      <td>{vendor.name}</td><td>{vendor.phone}</td><td>🔍 View</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {selectedVendor && (
                <div className="vendor-detail-panel">
                  <h4>Vendor Details</h4>
                  <p><strong>🏪 Name:</strong> {selectedVendor.name}</p>
                  <p><strong>🏷️ Category:</strong> {selectedVendor.category}</p>
                  <p><strong>📞 Phone:</strong> {selectedVendor.phone}</p>
                  <p><strong>💰 Price:</strong> {selectedVendor.price || 'Contact for Pricing'}</p>
                  <p><strong>📝 Description:</strong> {selectedVendor.desc || 'No description'}</p>
                  {selectedVendor.email && <p><strong>✉️ Email:</strong> {selectedVendor.email}</p>}
                </div>
              )}
            </div>
            <button onClick={() => { setShowVendorModal(false); setSelectedVendor(null); }} className="close-modal-btn">Close</button>
          </div>
        </div>
      )}

      <footer className="dashboard-footer">
        <p>© 2026 Smart Wedding Planning | Admin Panel</p>
      </footer>
    </div>
  );
};

export default AdminDashboard;
