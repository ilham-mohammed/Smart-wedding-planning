import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../../firebase';
import './Packages.css';

/* ────────────────────────────────────────────────────────────────
   ADMIN CREDENTIALS
   These gate the "Edit" controls on this page only. They are
   checked client-side, so treat this as a light editorial lock,
   not real security — anyone who reads the bundled JS can see
   these values. If you already have a proper AdminAuthContext /
   Firebase-Auth-based admin login elsewhere in the app (e.g. for
   AdminDashboard), swap this local check out for that instead so
   there's one source of truth for "who is an admin".
   ──────────────────────────────────────────────────────────────── */
const ADMIN_EMAIL = 'wpadmin@gmail.com';
const ADMIN_PASSWORD = 'admin25';

/* ────────────────────────────────────────────────────────────────
   RELIGION TABS
   ──────────────────────────────────────────────────────────────── */
const RELIGIONS = [
  { key: 'hindu', label: 'Hindu', icon: '🕉️' },
  { key: 'muslim', label: 'Muslim', icon: '☪️' },
  { key: 'buddhist', label: 'Buddhist', icon: '☸️' },
  { key: 'christian', label: 'Christian', icon: '✝️' },
];

/* ────────────────────────────────────────────────────────────────
   DEFAULT PACKAGE DATA
   Seeded into Firestore the first time the page loads, then
   fully editable by the admin from here on. Feel free to change
   any of this copy through the admin panel instead of the code.
   ──────────────────────────────────────────────────────────────── */
const DEFAULT_PACKAGES = {
  hindu: [
    {
      id: 'hindu-basic',
      name: 'Basic Package',
      guests: 'Up to 100 Guests',
      price: 599000,
      popular: false,
      features: [
        'Basic Catering Package',
        '4 Hours Photography',
        'Mandap Decoration (Standard)',
        'Wedding Cake (1 Tier)',
        'Standard Lighting Setup',
        'Background Music',
        'Digital Photo Album',
        'Bridal Dressing Room Arrangement',
      ],
    },
    {
      id: 'hindu-standard',
      name: 'Standard Package',
      guests: 'Up to 200 Guests',
      price: 799000,
      popular: true,
      features: [
        'Premium Catering Package',
        'Full Day Photo & Videography',
        'Mandap Decoration (Premium)',
        'Sacred Fire (Homam) Setup',
        'Wedding Cake (3 Tier)',
        'Floral Arrangement',
        'Live Music',
        'Digital & Physical Album',
      ],
    },
    {
      id: 'hindu-premium',
      name: 'Premium Package',
      guests: '300+ Guests',
      price: 1199000,
      popular: false,
      features: [
        'Gourmet Catering Package',
        'Full Day Photo & Videography',
        'Luxury Mandap & Premium Decor',
        'Sacred Fire (Homam) Setup',
        'Custom Wedding Cake (4 Tier)',
        'Cinematic Wedding Film',
        'Drone Photography',
        'Dedicated Wedding Planner',
        'Couple Transportation',
      ],
    },
  ],
  muslim: [
    {
      id: 'muslim-basic',
      name: 'Basic Package',
      guests: 'Up to 100 Guests',
      price: 599000,
      popular: false,
      features: [
        'Halal Catering Package',
        '4 Hours Photography',
        'Nikah Stage Setup (Standard)',
        'Wedding Cake (1 Tier)',
        'Standard Lighting Setup',
        'Background Music',
        'Digital Photo Album',
        'Bridal Dressing Room Arrangement',
      ],
    },
    {
      id: 'muslim-standard',
      name: 'Standard Package',
      guests: 'Up to 200 Guests',
      price: 799000,
      popular: true,
      features: [
        'Premium Halal Catering',
        'Full Day Photo & Videography',
        'Nikah & Valima Stage (Premium)',
        'Wedding Cake (3 Tier)',
        'Floral Arrangement',
        'Live Music (Optional)',
        'Digital & Physical Album',
        'Wedding Planner Consultation',
      ],
    },
    {
      id: 'muslim-premium',
      name: 'Premium Package',
      guests: '300+ Guests',
      price: 1199000,
      popular: false,
      features: [
        'Gourmet Halal Catering',
        'Full Day Photo & Videography',
        'Luxury Nikah & Valima Decor',
        'Custom Wedding Cake (4 Tier)',
        'Premium Floral Arrangement',
        'Cinematic Wedding Film',
        'Drone Photography',
        'Dedicated Wedding Planner',
        'Couple Transportation',
      ],
    },
  ],
  buddhist: [
    {
      id: 'buddhist-basic',
      name: 'Basic Package',
      guests: 'Up to 100 Guests',
      price: 599000,
      popular: false,
      features: [
        'Basic Catering Package',
        '4 Hours Photography',
        'Poruwa Ceremony Setup (Standard)',
        'Wedding Cake (1 Tier)',
        'Standard Lighting Setup',
        'Background Music',
        'Digital Photo Album',
        'Bridal Dressing Room Arrangement',
      ],
    },
    {
      id: 'buddhist-standard',
      name: 'Standard Package',
      guests: 'Up to 200 Guests',
      price: 799000,
      popular: true,
      features: [
        'Premium Catering Package',
        'Full Day Photo & Videography',
        'Poruwa Ceremony Setup (Premium)',
        'Blessing Ceremony Coordination',
        'Wedding Cake (3 Tier)',
        'Floral Arrangement',
        'Live Music',
        'Digital & Physical Album',
      ],
    },
    {
      id: 'buddhist-premium',
      name: 'Premium Package',
      guests: '300+ Guests',
      price: 1199000,
      popular: false,
      features: [
        'Gourmet Catering Package',
        'Full Day Photo & Videography',
        'Luxury Poruwa & Premium Decor',
        'Blessing Ceremony Coordination',
        'Custom Wedding Cake (4 Tier)',
        'Cinematic Wedding Film',
        'Drone Photography',
        'Dedicated Wedding Planner',
        'Couple Transportation',
      ],
    },
  ],
  christian: [
    {
      id: 'christian-basic',
      name: 'Basic Package',
      guests: 'Up to 100 Guests',
      price: 599000,
      popular: false,
      features: [
        'Basic Catering Package',
        '4 Hours Photography',
        'Standard Lighting Setup',
        'Wedding Cake (1 Tier)',
        'Church Decoration Coordination',
        'Background Music',
        'Digital Photo Album',
        'Bridal Dressing Room Arrangement',
      ],
    },
    {
      id: 'christian-standard',
      name: 'Standard Package',
      guests: 'Up to 200 Guests',
      price: 799000,
      popular: true,
      features: [
        'Premium Catering Package',
        'Full Day Photo & Videography',
        'Church & Reception Decor',
        'Wedding Cake (3 Tier)',
        'Floral Arrangement',
        'Live Music',
        'Digital & Physical Album',
        'Wedding Planner Consultation',
      ],
    },
    {
      id: 'christian-premium',
      name: 'Premium Package',
      guests: '300+ Guests',
      price: 1199000,
      popular: false,
      features: [
        'Gourmet Catering Package',
        'Full Day Photo & Videography',
        'Luxury Church & Reception Decor',
        'Custom Wedding Cake (4 Tier)',
        'Premium Floral Arrangement',
        'Cinematic Wedding Film',
        'Drone Photography',
        'Dedicated Wedding Planner',
        'Bridal Car Decoration',
      ],
    },
  ],
};

const STEPS = { CALENDAR: 'calendar', PAYMENT: 'payment' };

const formatPrice = (n) => 'Rs. ' + Number(n || 0).toLocaleString('en-LK');

/* ────────────────────────────────────────────────────────────────
   Minimal inline calendar (no external dependency)
   ──────────────────────────────────────────────────────────────── */
function MonthCalendar({ selectedDate, onSelect }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="calendar">
      <div className="cal-header">
        <button className="cal-nav" onClick={prevMonth} type="button">‹</button>
        <span className="cal-title">{monthNames[viewMonth]} {viewYear}</span>
        <button className="cal-nav" onClick={nextMonth} type="button">›</button>
      </div>
      <div className="cal-grid">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
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
              type="button"
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

/* ────────────────────────────────────────────────────────────────
   Inline edit form shown on a package card when the admin clicks Edit
   ──────────────────────────────────────────────────────────────── */
function PackageEditForm({ draft, onChange, onAddFeature, onRemoveFeature, onFeatureChange, onSave, onCancel, saving }) {
  const [newFeature, setNewFeature] = useState('');

  return (
    <div className="pkg-edit-form">
      <label className="edit-label">
        Package Name
        <input
          className="edit-input"
          value={draft.name}
          onChange={(e) => onChange('name', e.target.value)}
        />
      </label>

      <label className="edit-label">
        Guest Count Label
        <input
          className="edit-input"
          value={draft.guests}
          onChange={(e) => onChange('guests', e.target.value)}
        />
      </label>

      <label className="edit-label">
        Price (Rs.)
        <input
          className="edit-input"
          type="number"
          min="0"
          value={draft.price}
          onChange={(e) => onChange('price', Number(e.target.value))}
        />
      </label>

      <label className="edit-checkbox-label">
        <input
          type="checkbox"
          checked={!!draft.popular}
          onChange={(e) => onChange('popular', e.target.checked)}
        />
        Mark as "Most Popular"
      </label>

      <div className="edit-label">Features</div>
      <ul className="edit-feature-list">
        {draft.features.map((f, i) => (
          <li key={i} className="edit-feature-row">
            <input
              className="edit-input"
              value={f}
              onChange={(e) => onFeatureChange(i, e.target.value)}
            />
            <button
              type="button"
              className="edit-remove-btn"
              onClick={() => onRemoveFeature(i)}
              aria-label="Remove feature"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <div className="edit-add-feature-row">
        <input
          className="edit-input"
          placeholder="Add a new feature..."
          value={newFeature}
          onChange={(e) => setNewFeature(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newFeature.trim()) {
              onAddFeature(newFeature.trim());
              setNewFeature('');
            }
          }}
        />
        <button
          type="button"
          className="edit-add-btn"
          onClick={() => {
            if (newFeature.trim()) {
              onAddFeature(newFeature.trim());
              setNewFeature('');
            }
          }}
        >
          + Add
        </button>
      </div>

      <div className="edit-actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="button" className="btn-primary" onClick={onSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

export default function Packages() {
  const navigate = useNavigate();

  /* Booking modal (calendar → payment) */
  const [modal, setModal] = useState(null); // { pkg, step, date }

  /* Religion tabs + package data */
  const [religion, setReligion] = useState('hindu');
  const [packagesData, setPackagesData] = useState(DEFAULT_PACKAGES);
  const [loadingPackages, setLoadingPackages] = useState(true);

  /* Admin login + editing */
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminError, setAdminError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  /* Floating chat */
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const chatEndRef = useRef(null);
  const prevMsgCount = useRef(0);

  /* Chat identity — a unique username stands in for login.
     Set once, then remembered on this browser so the same
     person always lands back on their own thread. */
  const [username, setUsername] = useState('');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);

  useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async (user) => {
    if (!user) {
      setUsername('');
      return;
    }

    try {
      const snap = await getDoc(doc(db, "clients", user.uid));

      if (snap.exists()) {
        setUsername(snap.data().name);
      } else {
        setUsername(user.email);
      }
    } catch (err) {
      console.error(err);
    }
  });

  return unsubscribe;
}, []);

  /* ── Load (and seed) package data from Firestore, then stay in sync ── */
  useEffect(() => {
    const ref = doc(db, 'siteConfig', 'weddingPackages');

    const seedIfMissing = async () => {
      try {
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, DEFAULT_PACKAGES);
        }
      } catch (err) {
        console.error('Could not seed wedding packages:', err);
      }
    };
    seedIfMissing();

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setPackagesData(snap.data());
        }
        setLoadingPackages(false);
      },
      (err) => {
        console.error('Package listener error:', err);
        setLoadingPackages(false);
      }
    );

    return () => unsub();
  }, []);

  /* ── Live chat messages for this username, once one is set ── */
  useEffect(() => {
    if (!username) {
      setMessages([]);
      return;
    }
    const messagesRef = collection(db, 'chats', username, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(msgs);

      if (msgs.length > prevMsgCount.current) {
        const newest = msgs[msgs.length - 1];
        if (newest.sender === 'admin' && !chatOpen) {
          setUnreadCount((c) => c + 1);
        }
      }
      prevMsgCount.current = msgs.length;
    });

    return () => unsub();
  }, [username, chatOpen]);

  /* ── Keep the chat thread doc up to date so the admin dashboard can list it ── */
  const touchChatThread = async (lastMessage) => {
    if (!username) return;
    try {
      await setDoc(
        doc(db, 'chats', username),
        {
          username,
          lastMessage,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Could not update chat thread:', err);
    }
  };

  /* ── Chat bubble click: ask for a username the first time, otherwise
       just open the panel straight to the person's own thread ── */
  const handleChatFabClick = () => {
    if (chatOpen) {
      setChatOpen(false);
      return;
    }
   if (!auth.currentUser) {
  navigate("/login");
  return;
}
    setChatOpen(true);
  };

  /* ── First-time username claim. Since there's no password, a name
       already in use by someone else can't be reused — this is the
       only way two people don't end up sharing one thread. ── */
  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    const trimmed = usernameInput.trim();
    if (!trimmed) {
      setUsernameError('Please enter a name.');
      return;
    }
    setCheckingUsername(true);
    setUsernameError('');
    try {
      const ref = doc(db, 'chats', trimmed);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setUsernameError('That name is already taken. Please try a different one.');
        setCheckingUsername(false);
        return;
      }
      await setDoc(ref, {
        username: trimmed,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: '',
      });
      
      setUsername(trimmed);
      setShowUsernameModal(false);
      setUsernameInput('');
      setChatOpen(true);
    } catch (err) {
      console.error('Could not claim username:', err);
      setUsernameError('Something went wrong. Please try again.');
    } finally {
      setCheckingUsername(false);
    }
  };

  useEffect(() => {
    if (chatOpen) {
      setUnreadCount(0);
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatOpen, messages]);

  const sendMessage = async () => {
    const text = chatInput.trim();
    if (!text || !username) return;
    setChatInput('');
    try {
      await addDoc(collection(db, 'chats', username, 'messages'), {
        sender: 'user',
        text,
        timestamp: serverTimestamp(),
      });
      await touchChatThread(text);
    } catch (err) {
      console.error('Could not send message:', err);
    }
  };

  /* ── Booking modal handlers ── */
  const openModal = (pkg) => setModal({ pkg, step: STEPS.CALENDAR, date: null });
  const closeModal = () => setModal(null);
  const handleDateSelect = (date) => setModal((m) => ({ ...m, date }));
  const handleDateConfirm = () => {
    if (!modal.date) return;
    setModal((m) => ({ ...m, step: STEPS.PAYMENT }));
  };
  const handlePaymentSelect = (type) => {
    const { pkg, date } = modal;
    let amount;
    if (type === 'advance') amount = Math.round(pkg.price * 0.1);
    else if (type === 'full') amount = pkg.price;
    else amount = 0;

    navigate('/payment', {
      state: {
        packageId: pkg.id,
        packageName: pkg.name,
        weddingDate: date.toDateString(),
        totalPrice: pkg.price,
        paymentType: type,
        amountDue: amount,
        religion,
      },
    });
  };
  const formatDate = (d) =>
    d ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  /* ── Admin login ── */
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (
      adminEmailInput.trim().toLowerCase() === ADMIN_EMAIL &&
      adminPasswordInput === ADMIN_PASSWORD
    ) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminError('');
      setAdminEmailInput('');
      setAdminPasswordInput('');
    } else {
      setAdminError('Incorrect email or password.');
    }
  };
  const handleAdminLogout = () => {
    setIsAdmin(false);
    setEditingId(null);
    setEditDraft(null);
  };

  /* ── Package editing ── */
  const startEdit = (pkg) => {
    setEditingId(pkg.id);
    setEditDraft({ ...pkg, features: [...pkg.features] });
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };
  const changeDraftField = (field, value) =>
    setEditDraft((d) => ({ ...d, [field]: value }));
  const changeDraftFeature = (index, value) =>
    setEditDraft((d) => {
      const features = [...d.features];
      features[index] = value;
      return { ...d, features };
    });
  const addDraftFeature = (value) =>
    setEditDraft((d) => ({ ...d, features: [...d.features, value] }));
  const removeDraftFeature = (index) =>
    setEditDraft((d) => ({ ...d, features: d.features.filter((_, i) => i !== index) }));

  const saveEdit = async () => {
    setSaving(true);
    const updatedReligionPkgs = packagesData[religion].map((p) =>
      p.id === editDraft.id ? editDraft : p
    );
    const updatedData = { ...packagesData, [religion]: updatedReligionPkgs };
    try {
      await setDoc(doc(db, 'siteConfig', 'weddingPackages'), updatedData);
      setPackagesData(updatedData);
      setEditingId(null);
      setEditDraft(null);
    } catch (err) {
      console.error('Could not save package:', err);
      alert('Could not save changes. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const currentPackages = packagesData[religion] || [];

  return (
    <div>
      {/* Top bar */}
      <div className="top-bar">
        <Link to="/" className="back-home-btn">← Back to Home</Link>
        {isAdmin ? (
          <button className="admin-toggle-btn" onClick={handleAdminLogout} type="button">
            Logout Admin
          </button>
        ) : (
          <button className="admin-toggle-btn" onClick={() => setShowAdminLogin(true)} type="button">
            Admin Login
          </button>
        )}
      </div>

      <div className="packages-page">
        <h1 className="section-title">Wedding Packages</h1>
        <p className="section-subtitle">Exclusive planning services for your special day</p>

        {/* Religion tabs */}
        <div className="religion-tabs">
          {RELIGIONS.map((r) => (
            <button
              key={r.key}
              type="button"
              className={`religion-tab ${religion === r.key ? 'active' : ''}`}
              onClick={() => setReligion(r.key)}
            >
              <span className="religion-icon">{r.icon}</span> {r.label}
            </button>
          ))}
        </div>

        {loadingPackages ? (
          <p className="section-subtitle">Loading packages...</p>
        ) : (
          <div className="packages-grid">
            {currentPackages.map((pkg) => (
              <div key={pkg.id} className={`package-card ${pkg.popular ? 'popular' : ''}`}>
                {pkg.popular && <div className="package-badge">MOST POPULAR</div>}

                {isAdmin && editingId !== pkg.id && (
                  <button
                    type="button"
                    className="pkg-edit-btn"
                    onClick={() => startEdit(pkg)}
                  >
                    ✎ Edit
                  </button>
                )}

                {editingId === pkg.id ? (
                  <PackageEditForm
                    draft={editDraft}
                    onChange={changeDraftField}
                    onAddFeature={addDraftFeature}
                    onRemoveFeature={removeDraftFeature}
                    onFeatureChange={changeDraftFeature}
                    onSave={saveEdit}
                    onCancel={cancelEdit}
                    saving={saving}
                  />
                ) : (
                  <>
                    <div className="package-name">{pkg.name}</div>
                    <p className="guest-count">{pkg.guests}</p>
                    <div className="package-price">{formatPrice(pkg.price)}</div>
                    <ul className="package-features">
                      {pkg.features.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                    <button
                      className="btn-primary"
                      onClick={() => openModal(pkg)}
                      disabled={isAdmin && editingId !== null}
                    >
                      Select Package
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="footer">
        <p>© 2026 Smart Wedding Planning | Trincomalee, Sri Lanka 💍</p>
      </footer>

      {/* ── Admin Login Modal ── */}
      {showAdminLogin && (
        <div className="modal-overlay" onClick={() => setShowAdminLogin(false)}>
          <div className="modal-box admin-login-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAdminLogin(false)} type="button">✕</button>
            <div className="modal-header">
              <div className="modal-icon">🔐</div>
              <h2 className="modal-title">Admin Login</h2>
              <p className="modal-subtitle">Sign in to edit package details</p>
            </div>
            <form onSubmit={handleAdminLogin} className="admin-login-form">
              <label className="edit-label">
                Email
                <input
                  className="edit-input"
                  type="email"
                  value={adminEmailInput}
                  onChange={(e) => setAdminEmailInput(e.target.value)}
                  autoComplete="username"
                  required
                />
              </label>
              <label className="edit-label">
                Password
                <input
                  className="edit-input"
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>
              {adminError && <p className="admin-error">{adminError}</p>}
              <button className="btn-primary modal-cta" type="submit">
                Log In
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Booking Modal Overlay ── */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal} type="button">✕</button>

            {modal.step === STEPS.CALENDAR && (
              <>
                <div className="modal-header">
                  <div className="modal-icon">📅</div>
                  <h2 className="modal-title">Choose Your Wedding Date</h2>
                  <p className="modal-subtitle">{modal.pkg.name}</p>
                </div>

                <MonthCalendar selectedDate={modal.date} onSelect={handleDateSelect} />

                {modal.date && (
                  <div className="selected-date-badge">✨ {formatDate(modal.date)}</div>
                )}

                <button
                  className="btn-primary modal-cta"
                  disabled={!modal.date}
                  onClick={handleDateConfirm}
                  type="button"
                >
                  Confirm Date →
                </button>
              </>
            )}

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
                  <button className="payment-option" onClick={() => handlePaymentSelect('later')} type="button">
                    <div className="pay-icon">🗓️</div>
                    <div className="pay-info">
                      <div className="pay-label">Pay Later</div>
                      <div className="pay-desc">Reserve now, pay before the event</div>
                      <div className="pay-amount">Rs. 0 now</div>
                    </div>
                  </button>

                  <button className="payment-option recommended" onClick={() => handlePaymentSelect('advance')} type="button">
                    <div className="pay-badge">RECOMMENDED</div>
                    <div className="pay-icon">💰</div>
                    <div className="pay-info">
                      <div className="pay-label">Pay Advance (10%)</div>
                      <div className="pay-desc">Secure your date with a small deposit</div>
                      <div className="pay-amount">{formatPrice(Math.round(modal.pkg.price * 0.1))}</div>
                    </div>
                  </button>

                  <button className="payment-option" onClick={() => handlePaymentSelect('full')} type="button">
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

      
      {/* ── Floating Chat Widget ── */}
      <button
        className="chat-fab"
        onClick={handleChatFabClick}
        type="button"
        aria-label="Open chat with admin"
      >
        {chatOpen ? '✕' : '💬'}
        {!chatOpen && unreadCount > 0 && <span className="chat-fab-badge">{unreadCount}</span>}
      </button>

      {chatOpen && username && (
        <div className="chat-panel">
          <div className="chat-panel-header">
            <div className="chat-panel-header-text">
              <span>Chat with us</span>
              <small>Chatting as {username}</small>
            </div>
            <button className="chat-panel-close" onClick={() => setChatOpen(false)} type="button">✕</button>
          </div>

          <div className="chat-panel-messages">
            {messages.length === 0 && (
              <p className="chat-empty-hint">Send us a message and we'll reply here.</p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`chat-bubble ${m.sender === 'admin' ? 'chat-bubble-admin' : 'chat-bubble-user'}`}
              >
                {m.text}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-panel-input-row">
            <input
              className="chat-panel-input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendMessage();
              }}
              placeholder="Type a message..."
            />
            <button className="chat-panel-send" onClick={sendMessage} type="button">
              Send
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
