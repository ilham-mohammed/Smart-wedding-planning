import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from "firebase/auth";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { collection, query, where, getDocs,  getDoc, doc, addDoc, setDoc, serverTimestamp, orderBy, onSnapshot} from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import './VendorDashboard.css';

/* ------------------------------------------------------------------ */
/* Cloudinary upload helper                                           */
/* ------------------------------------------------------------------ */

const uploadImageToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'wedding_planning');

  const response = await fetch(
    'https://api.cloudinary.com/v1_1/dcjfpouji/image/upload',
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok || !data.secure_url) {
    throw new Error(
      data?.error?.message || 'Image upload failed. Check Cloudinary settings.'
    );
  }

  return data.secure_url;
};

/* ------------------------------------------------------------------ */
/* Category configuration                                             */
/* ------------------------------------------------------------------ */

const MAX_IMAGES = 5;

const CATEGORIES = [
  'Photography',
  'Florist',
  'Catering',
  'Music & DJ',
  'Lighting',
  'Make-Up',
  'Wedding Cake',
  'Decoration',
  'Venue',
  'Mehendi',
  'Other',
];

// Simple field definitions per category (rendered generically).
// Catering is handled separately below because it needs a repeatable
// food-item table instead of flat fields.
const CATEGORY_FIELDS = {
  Photography: [
    { key: 'workingHours', label: 'Working Hours', type: 'text', placeholder: 'e.g. Full day (9 AM - 9 PM)', required: true },
    { key: 'coverageType', label: 'Coverage Type', type: 'select', options: ['Full Day', 'Half Day', 'Event Only', 'Pre-Wedding + Wedding'], required: true },
    { key: 'teamSize', label: 'Team Size', type: 'text', placeholder: 'e.g. 2 Photographers + 1 Videographer' },
    { key: 'deliverables', label: 'Deliverables', type: 'text', placeholder: 'e.g. 500 edited photos, 1 highlight video' },
  ],
  Florist: [
    { key: 'flowerTypes', label: 'Flower Types Available', type: 'text', placeholder: 'e.g. Roses, Orchids, Lilies' },
    { key: 'arrangementStyle', label: 'Arrangement Style', type: 'text', placeholder: 'e.g. Bouquets, Mandap decor, Centerpieces' },
    { key: 'setupIncluded', label: 'Setup & Delivery Included', type: 'select', options: ['Yes', 'No'] },
  ],
  'Music & DJ': [
    { key: 'performanceHours', label: 'Performance Hours', type: 'text', placeholder: 'e.g. 5 hours', required: true },
    { key: 'equipmentProvided', label: 'Equipment Provided', type: 'text', placeholder: 'e.g. Speakers, Mic, Lighting console' },
    { key: 'genre', label: 'Music Genre', type: 'text', placeholder: 'e.g. Bollywood, EDM, Classical' },
    { key: 'teamSize', label: 'Team Size', type: 'text', placeholder: 'e.g. 1 DJ + 2 assistants' },
  ],
  Lighting: [
    { key: 'setupTime', label: 'Setup Time Required', type: 'text', placeholder: 'e.g. 3 hours before event' },
    { key: 'lightingTypes', label: 'Lighting Types', type: 'text', placeholder: 'e.g. Fairy lights, LED walls, Chandeliers' },
    { key: 'powerBackup', label: 'Power Backup Available', type: 'select', options: ['Yes', 'No'] },
  ],
  'Make-Up': [
    { key: 'servicesIncluded', label: 'Services Included', type: 'text', placeholder: 'e.g. Bridal makeup, Hairstyling, Saree draping', required: true },
    { key: 'artistsCount', label: 'Number of Artists', type: 'text', placeholder: 'e.g. 2' },
    { key: 'travelAvailable', label: 'Travel to Venue Available', type: 'select', options: ['Yes', 'No'] },
  ],
  'Wedding Cake': [
    { key: 'flavors', label: 'Flavors Available', type: 'text', placeholder: 'e.g. Chocolate, Vanilla, Red Velvet', required: true },
    { key: 'weightOptions', label: 'Weight / Size Options', type: 'text', placeholder: 'e.g. 1kg, 2kg, 3-tier' },
    { key: 'pricePerKg', label: 'Price per Kg', type: 'text', placeholder: 'e.g. ₹800/kg' },
  ],
  Decoration: [
    { key: 'themeTypes', label: 'Theme Types Offered', type: 'text', placeholder: 'e.g. Royal, Boho, Minimalist' },
    { key: 'materialUsed', label: 'Materials Used', type: 'text', placeholder: 'e.g. Fabric drapes, Flowers, Balloons' },
    { key: 'setupTime', label: 'Setup Time Required', type: 'text' },
  ],
  Venue: [
    { key: 'capacity', label: 'Guest Capacity', type: 'text', placeholder: 'e.g. 200-500 guests', required: true },
    { key: 'indoorOutdoor', label: 'Indoor / Outdoor', type: 'select', options: ['Indoor', 'Outdoor', 'Both'] },
    { key: 'parkingAvailable', label: 'Parking Available', type: 'select', options: ['Yes', 'No'] },
  ],
  Mehendi: [
    { key: 'designStyles', label: 'Design Styles', type: 'text', placeholder: 'e.g. Arabic, Rajasthani, Indo-Western' },
    { key: 'artistsCount', label: 'Number of Artists', type: 'text' },
    { key: 'timeRequired', label: 'Time Required', type: 'text', placeholder: 'e.g. 3-4 hours' },
  ],
};

const emptyFoodItem = { foodName: '', foodType: 'Veg', pricePerPerson: '' };

const emptyPostForm = {
  name: '',
  category: 'Photography',
  price: '',
  desc: '',
  phone: '',
};

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

const VendorDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [vendorData, setVendorData] = useState(null);
  const [vendorServices, setVendorServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingsOnDate, setBookingsOnDate] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [chatList, setChatList] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  

  // reviews: { [serviceId]: { avg: number, count: number, reviews: [...] } }
  const [reviewsByService, setReviewsByService] = useState({});

  // which image is currently showing in each service card's gallery
  const [galleryIndex, setGalleryIndex] = useState({});

  const [showPostModal, setShowPostModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [postForm, setPostForm] = useState(emptyPostForm);
  const [customCategory, setCustomCategory] = useState('');
  const [details, setDetails] = useState({});
  const [foodItems, setFoodItems] = useState([{ ...emptyFoodItem }]);
  const [cateringInfo, setCateringInfo] = useState({
    cuisineType: '',
    minGuests: '',
    maxGuests: '',
  });

  const [existingImages, setExistingImages] = useState([]); // URLs already saved (edit mode)
  const [newImageFiles, setNewImageFiles] = useState([]); // File objects picked this session
  const [newImagePreviews, setNewImagePreviews] = useState([]); // local preview URLs

  const [imageUploading, setImageUploading] = useState(false);
  const [postError, setPostError] = useState('');
  const [postSuccess, setPostSuccess] = useState('');

  /* ---------------------------- data loading ---------------------------- */

const loadServices = () => {
  if (!user) return;

  const q = query(
    collection(db, 'vendors'),
    where('uid', '==', user.uid)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const services = snapshot.docs.map((doc) => {
      const data = doc.data();
      
      // Start with the original data
      let serviceData = { id: doc.id, ...data };

      // If the vendor is approved and there is a pendingUpdate, merge it
      if (data.approved === true && data.pendingUpdate) {
        serviceData = {
          ...serviceData,
          ...data.pendingUpdate,
          // preserve the ID and any fields you don't want overwritten
          id: doc.id,
          // keep approved status
          approved: true,
          // keep the original uid, email, etc.
          uid: data.uid,
          email: data.email,
        };
      }

      return serviceData;
    });

    setVendorServices(services);
    loadReviewsForServices(services);
  }, (error) => {
    console.error('Error listening to vendor services:', error);
  });

  return unsubscribe;
};

  const loadReviewsForServices = async (services) => {
    if (!services || services.length === 0) {
      setReviewsByService({});
      return;
    }

    const reviewMap = {};

    await Promise.all(
      services.map(async (service) => {
        try {
          const reviewSnapshot = await getDocs(
            query(
              collection(db, 'reviews'),
              where('serviceId', '==', service.id)
            )
          );

          const reviews = reviewSnapshot.docs.map((review) => ({
            id: review.id,
            ...review.data(),
          }));

          const count = reviews.length;
          const avg =
            count > 0
              ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / count
              : 0;

          reviewMap[service.id] = { avg, count, reviews };
        } catch (error) {
          console.error('Failed to load reviews for service', service.id, error);
          reviewMap[service.id] = { avg: 0, count: 0, reviews: [] };
        }
      })
    );

    setReviewsByService(reviewMap);
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/vendor-login');
      return;
    }

    const loadDashboard = async () => {
      try {
        const vendorSnapshot = await getDoc(doc(db, 'vendors', user.uid));

        if (vendorSnapshot.exists()) {
          setVendorData(vendorSnapshot.data());
        }

        const services = await loadServices();
        await loadReviewsForServices(services);

        const bookingSnapshot = await getDocs(
          query(
            collection(db, 'bookings'),
            where('vendorUid', '==', user.uid)
          )
        );

        setBookings(
          bookingSnapshot.docs.map((booking) => ({
            id: booking.id,
            ...booking.data(),
          }))
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const filteredBookings = bookings.filter((booking) => {
      if (!booking.weddingDate) return false;

      return (
        new Date(booking.weddingDate).toDateString() ===
        selectedDate.toDateString()
      );
    });

    setBookingsOnDate(filteredBookings);
  }, [bookings, selectedDate]);

  const handleLogout = async () => {
  try {
    await auth.signOut();
    navigate('/', { replace: true });
    window.location.reload();
  } catch (error) {
    console.error("Logout error:", error);
  }
};
  useEffect(() => {
  if (!user) return;

  const loadChats = async () => {

    // Find vendor document id
    const vendorQuery = query(
      collection(db, "vendors"),
      where("uid", "==", user.uid)
    );

    const vendorSnapshot = await getDocs(vendorQuery);

    if (vendorSnapshot.empty) return;

    const vendorId = vendorSnapshot.docs[0].id;


    // Get chats using vendor document id
    const q = query(
      collection(db, "vendorChats"),
      where("vendorId", "==", vendorId)
    );


    const unsubscribe = onSnapshot(q, (snapshot) => {

      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setChatList(chats);

    });

  };

  loadChats();

}, [user]);
const openChat = (chat) => {

  setSelectedChat(chat);

  const q = query(
    collection(db, "vendorChats", chat.id, "messages"),
    orderBy("createdAt", "asc")
  );

  onSnapshot(q, (snapshot) => {

    const msgs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setMessages(msgs);

  });

};

const sendReply = async () => {

  if (!reply.trim()) return;

  await addDoc(
    collection(db, "vendorChats", selectedChat.id, "messages"),
    {
       senderType: "vendor",
      text: reply,
      createdAt: serverTimestamp()
    }
  );

  setReply("");

};


  /* ---------------------------- modal helpers ---------------------------- */

  const resetImageState = () => {
    newImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setExistingImages([]);
    setNewImageFiles([]);
    setNewImagePreviews([]);
  };

  const openNewService = () => {
    setEditingService(null);
    setPostForm(emptyPostForm);
    setCustomCategory('');
    setDetails({});
    setFoodItems([{ ...emptyFoodItem }]);
    setCateringInfo({ cuisineType: '', minGuests: '', maxGuests: '' });
    resetImageState();
    setPostError('');
    setPostSuccess('');
    setShowPostModal(true);
  };

  const openEditService = (service) => {
    const isCustomCategory = !CATEGORIES.includes(service.category);

    setEditingService(service);
    setPostForm({
      name: service.name || '',
      category: isCustomCategory ? 'Other' : service.category,
      price: service.price || '',
      desc: service.desc || '',
      phone: service.phone || '',
    });

    setCustomCategory(isCustomCategory ? service.category : '');
    setDetails(service.details || {});

    if (service.category === 'Catering') {
      setFoodItems(
        service.foodItems && service.foodItems.length > 0
          ? service.foodItems
          : [{ ...emptyFoodItem }]
      );
      setCateringInfo({
        cuisineType: service.cuisineType || '',
        minGuests: service.minGuests || '',
        maxGuests: service.maxGuests || '',
      });
    } else {
      setFoodItems([{ ...emptyFoodItem }]);
      setCateringInfo({ cuisineType: '', minGuests: '', maxGuests: '' });
    }

    // support both the new "images" array and the old single "image" field
    const priorImages =
      service.images && service.images.length > 0
        ? service.images
        : service.image
          ? [service.image]
          : [];

    setExistingImages(priorImages);
    setNewImageFiles([]);
    setNewImagePreviews([]);

    setPostError('');
    setPostSuccess('');
    setShowPostModal(true);
  };

  const handleCloseModal = () => {
    setShowPostModal(false);
    setEditingService(null);
    setPostForm(emptyPostForm);
    setCustomCategory('');
    setDetails({});
    setFoodItems([{ ...emptyFoodItem }]);
    setCateringInfo({ cuisineType: '', minGuests: '', maxGuests: '' });
    resetImageState();
    setPostError('');
    setPostSuccess('');
  };

  const handleCategoryChange = (newCategory) => {
    setPostForm({ ...postForm, category: newCategory });
    setDetails({});
    setFoodItems([{ ...emptyFoodItem }]);
    setCateringInfo({ cuisineType: '', minGuests: '', maxGuests: '' });
  };

  const handleDetailChange = (key, value) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
  };

  /* ---------------------------- catering helpers ---------------------------- */

  const handleFoodItemChange = (index, key, value) => {
    setFoodItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    );
  };

  const addFoodItem = () => {
    setFoodItems((prev) => [...prev, { ...emptyFoodItem }]);
  };

  const removeFoodItem = (index) => {
    setFoodItems((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev
    );
  };

  /* ---------------------------- image helpers ---------------------------- */

  const totalImageCount = existingImages.length + newImagePreviews.length;

  const handleImageFilesChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const availableSlots = MAX_IMAGES - totalImageCount;

    if (availableSlots <= 0) {
      setPostError(`You can upload a maximum of ${MAX_IMAGES} photos.`);
      event.target.value = '';
      return;
    }

    const filesToAdd = files.slice(0, availableSlots);

    setNewImageFiles((prev) => [...prev, ...filesToAdd]);
    setNewImagePreviews((prev) => [
      ...prev,
      ...filesToAdd.map((file) => URL.createObjectURL(file)),
    ]);

    event.target.value = '';
  };

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    setNewImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /* ---------------------------- submit ---------------------------- */

  const handlePostSubmit = async (event) => {
    event.preventDefault();
    setPostError('');
    setPostSuccess('');

    try {
      if (totalImageCount === 0) {
        throw new Error('Please add at least 1 photo of your work.');
      }

      const category =
        postForm.category === 'Other'
          ? customCategory.trim()
          : postForm.category;

      if (!category) {
        throw new Error('Please enter your service category.');
      }

      // validate required fields for the selected category
      const requiredFields = CATEGORY_FIELDS[postForm.category] || [];
      for (const field of requiredFields) {
        if (field.required && !details[field.key]) {
          throw new Error(`Please fill in "${field.label}".`);
        }
      }

      if (postForm.category === 'Catering') {
        if (!cateringInfo.minGuests || !cateringInfo.maxGuests) {
          throw new Error('Please enter minimum and maximum guest count.');
        }
        for (const item of foodItems) {
          if (!item.foodName || !item.pricePerPerson) {
            throw new Error('Please fill in every food item name and price.');
          }
        }
      }

      let uploadedUrls = [];

      if (newImageFiles.length > 0) {
        setImageUploading(true);
        uploadedUrls = await Promise.all(
          newImageFiles.map((file) => uploadImageToCloudinary(file))
        );
      }

      const finalImages = [...existingImages, ...uploadedUrls].slice(
        0,
        MAX_IMAGES
      );

      const serviceDetails = {
        name: postForm.name.trim(),
        category,
        price: postForm.price.trim(),
        desc: postForm.desc.trim(),
        phone: postForm.phone.trim(),
        images: finalImages,
        image: finalImages[0] || 'https://via.placeholder.com/300', // kept for backward compatibility
        details,
        uid: user.uid,
        email: user.email,
      };

      if (postForm.category === 'Catering') {
        serviceDetails.foodItems = foodItems;
        serviceDetails.cuisineType = cateringInfo.cuisineType.trim();
        serviceDetails.minGuests = cateringInfo.minGuests;
        serviceDetails.maxGuests = cateringInfo.maxGuests;
      }

      if (editingService) {
        await setDoc(
          doc(db, 'vendors', editingService.id),
          {
            pendingUpdate: serviceDetails,
            updateStatus: 'pending',
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        setPostSuccess('✅ Changes saved and sent for admin approval.');
      } else {
        await addDoc(collection(db, 'vendors'), {
          ...serviceDetails,
          approved: false,
          updateStatus: 'pending',
          createdAt: serverTimestamp(),
        });

        setPostSuccess('✅ Service submitted for admin approval.');
      }

      const services = await loadServices();
      await loadReviewsForServices(services);
    } catch (error) {
      console.error(error);
      setPostError(`❌ ${error.message}`);
    } finally {
      setImageUploading(false);
    }
  };

  /* ---------------------------- calendar helpers ---------------------------- */

  const getBookedDates = () =>
    bookings
      .filter((booking) => booking.weddingDate)
      .map((booking) => new Date(booking.weddingDate).toDateString());

  const tileClassName = ({ date, view }) => {
    if (
      view === 'month' &&
      getBookedDates().includes(date.toDateString())
    ) {
      return 'booked-date';
    }

    return null;
  };

  /* ---------------------------- gallery helpers ---------------------------- */

  const getGalleryImages = (service) =>
    service.images && service.images.length > 0
      ? service.images
      : service.image
        ? [service.image]
        : ['https://via.placeholder.com/300'];

  const nextImage = (serviceId, length) => {
    setGalleryIndex((prev) => ({
      ...prev,
      [serviceId]: ((prev[serviceId] || 0) + 1) % length,
    }));
  };

  const prevImage = (serviceId, length) => {
    setGalleryIndex((prev) => ({
      ...prev,
      [serviceId]: ((prev[serviceId] || 0) - 1 + length) % length,
    }));
  };

  /* ---------------------------- small display helpers ---------------------------- */

  const renderStars = (avg) => {
    const rounded = Math.round(avg || 0);
    return '★★★★★☆☆☆☆☆'.slice(5 - rounded, 10 - rounded);
  };

  const formatDetailLabel = (category, key) => {
    const field = (CATEGORY_FIELDS[category] || []).find((f) => f.key === key);
    return field ? field.label : key;
  };

  if (loading || authLoading) {
    return <div className="loading-screen">Loading dashboard...</div>;
  }

  const activeCategory = postForm.category;
  const activeCategoryFields = CATEGORY_FIELDS[activeCategory] || [];

  return (
    <div className="v-dashboard-page">
      <header className="v-dashboard-header">
        <div className="header-left">
          <button
            className="go-vendors-btn"
            onClick={() => navigate('/vendors')}
          >
            📋 Vendors Page
          </button>

          <button className="post-service-btn" onClick={openNewService}>
            + Post New Service
          </button>
        </div>

        <div className="header-center">
          <h1>Welcome, {vendorData?.name || user?.email || 'Vendor'}</h1>
        </div>

        <div className="header-right">
          <button className="v-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <section className="v-dashboard-content">
        <div className="dashboard-two-columns">
          <div className="bookings-list">
            <h2>Upcoming Bookings</h2>

         

            {bookings.length === 0 ? (
              <p>No bookings yet.</p>
            ) : (
              <table className="v-bookings-table">
                <thead>
                  <tr>
                    <th>Client Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Wedding Date</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>{booking.clientName}</td>
                      <td>{booking.clientEmail}</td>
                      <td>{booking.clientPhone}</td>
                      <td>
                        {booking.weddingDate
                          ? new Date(booking.weddingDate).toLocaleDateString()
                          : 'Not Set'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="calendar-container">
            <h2>Booking Calendar</h2>
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              tileClassName={tileClassName}
            />

            {bookingsOnDate.length > 0 && (
              <ul>
                {bookingsOnDate.map((booking) => (
                  <li key={booking.id}>
                    {booking.clientName} - {booking.clientPhone}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

          <div className="vendor-chat-container">

  <div className="vendor-chat-panel">

    <h2>Customer Messages</h2>

    {chatList.map(chat => (
      <div
        key={chat.id}
        className={`chat-user ${
          selectedChat?.id === chat.id ? "active" : ""
        }`}
        onClick={() => openChat(chat)}
      >
        {chat.userName || "Customer"}
      </div>
    ))}

  </div>

  <div className="vendor-chat-box">

    {selectedChat ? (
      <>
        <h3>{selectedChat.userName || "Customer" }</h3>

        <div className="messages">

          {messages.map(msg => (
            <div
              key={msg.id}
              className={
               msg.senderType === "vendor" || msg.sender === "vendor"
                  ? "vendor-msg"
                  : "client-msg"
              }
            >
              {msg.text}
            </div>
          ))}

        </div>

        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Reply..."
        />

        <button onClick={sendReply}>
          Send
        </button>
      </>
    ) : (
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#777",
          fontSize: "18px"
        }}
      >
        Select a customer to start chatting
      </div>
    )}

  </div>

</div>


        <section className="my-services">
          <h2>My Posted Services</h2>

          {vendorServices.length === 0 ? (
            <p>No services posted yet.</p>
          ) : (
            vendorServices.map((service) => {
              const images = getGalleryImages(service);
              const currentIndex = galleryIndex[service.id] || 0;
              const reviewInfo = reviewsByService[service.id] || {
                avg: 0,
                count: 0,
                reviews: [],
              };
              const serviceDetails = service.details || {};

              return (
                <div className="service-card" key={service.id}>
                  <div className="service-gallery">
                    <img
                      src={images[currentIndex]}
                      alt={`${service.name} ${currentIndex + 1}`}
                    />

                    {images.length > 1 && (
                      <div className="gallery-controls">
                        <button
                          type="button"
                          onClick={() => prevImage(service.id, images.length)}
                        >
                          ‹
                        </button>
                        <span>
                          {currentIndex + 1} / {images.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => nextImage(service.id, images.length)}
                        >
                          ›
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="service-info">
                    <h3>{service.name}</h3>
                    <p>Category: {service.category}</p>
                    <p>Price: {service.price}</p>
                    <p>{service.desc}</p>

                    {/* category-specific details */}
                    {Object.keys(serviceDetails).length > 0 && (
                      <ul className="service-detail-list">
                        {Object.entries(serviceDetails).map(([key, value]) =>
                          value ? (
                            <li key={key}>
                              <strong>{formatDetailLabel(service.category, key)}:</strong>{' '}
                              {value}
                            </li>
                          ) : null
                        )}
                      </ul>
                    )}

                    {/* catering food items */}
                    {service.category === 'Catering' && (
                      <div className="catering-summary">
                        {service.cuisineType && (
                          <p>Cuisine: {service.cuisineType}</p>
                        )}
                        {(service.minGuests || service.maxGuests) && (
                          <p>
                            Guests: {service.minGuests || '?'} - {service.maxGuests || '?'}
                          </p>
                        )}
                        {service.foodItems && service.foodItems.length > 0 && (
                          <table className="food-items-table">
                            <thead>
                              <tr>
                                <th>Food Item</th>
                                <th>Type</th>
                                <th>Price / Person</th>
                              </tr>
                            </thead>
                            <tbody>
                              {service.foodItems.map((item, i) => (
                                <tr key={i}>
                                  <td>{item.foodName}</td>
                                  <td>{item.foodType}</td>
                                  <td>{item.pricePerPerson}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}

                    {/* ratings & reviews (submitted by clients on the Vendors page) */}
                    <div className="service-rating">
                      <span className="stars">{renderStars(reviewInfo.avg)}</span>
                      <span>
                        {reviewInfo.count > 0
                          ? `${reviewInfo.avg.toFixed(1)} (${reviewInfo.count} review${reviewInfo.count === 1 ? '' : 's'})`
                          : 'No reviews yet'}
                      </span>
                    </div>

                    {reviewInfo.reviews.length > 0 && (
                      <ul className="review-list">
                        {reviewInfo.reviews.slice(0, 3).map((review) => (
                          <li key={review.id}>
                            <strong>{review.clientName || 'Client'}</strong>{' '}
                            ({review.rating}★): {review.comment}
                          </li>
                        ))}
                      </ul>
                    )}

                    <p>
                      Status:{' '}
                      {service.pendingUpdate ? (
                        <span className="pending-status">
                          Edited details awaiting approval
                        </span>
                      ) : service.approved ? (
                        <span className="approved-status">Approved</span>
                      ) : (
                        <span className="pending-status">
                          Pending admin approval
                        </span>
                      )}
                    </p>

                    <button
                      className="edit-service-btn"
                      onClick={() => openEditService(service)}
                    >
                      ✏ Edit Service
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </section>

      {showPostModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div
            className="modal-content"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>
              {editingService ? '✏ Edit Service' : '📸 Post New Service'}
            </h3>

            {postError && <div className="error-box">{postError}</div>}
            {postSuccess && (
              <div className="success-box">{postSuccess}</div>
            )}

            <form onSubmit={handlePostSubmit}>
              <input
                type="text"
                placeholder="Business Name"
                required
                value={postForm.name}
                onChange={(event) =>
                  setPostForm({ ...postForm, name: event.target.value })
                }
              />

              <select
                value={postForm.category}
                onChange={(event) => handleCategoryChange(event.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {postForm.category === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter your category"
                  required
                  value={customCategory}
                  onChange={(event) => setCustomCategory(event.target.value)}
                />
              )}

              {/* ---- category-specific fields ---- */}
              {postForm.category !== 'Catering' &&
                activeCategoryFields.map((field) => (
                  <div className="detail-field" key={field.key}>
                    <label>{field.label}{field.required ? ' *' : ''}</label>
                    {field.type === 'select' ? (
                      <select
                        required={field.required}
                        value={details[field.key] || ''}
                        onChange={(event) =>
                          handleDetailChange(field.key, event.target.value)
                        }
                      >
                        <option value="">Select</option>
                        {field.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder={field.placeholder || field.label}
                        required={field.required}
                        value={details[field.key] || ''}
                        onChange={(event) =>
                          handleDetailChange(field.key, event.target.value)
                        }
                      />
                    )}
                  </div>
                ))}

              {postForm.category === 'Other' && (
                <textarea
                  placeholder="Describe your service details fully (working hours, inclusions, team size, price breakdown, etc.)"
                  value={details.manualDetails || ''}
                  onChange={(event) =>
                    handleDetailChange('manualDetails', event.target.value)
                  }
                />
              )}

              {/* ---- catering-specific fields ---- */}
              {postForm.category === 'Catering' && (
                <div className="catering-fields">
                  <input
                    type="text"
                    placeholder="Cuisine Type (e.g. North Indian, Continental)"
                    value={cateringInfo.cuisineType}
                    onChange={(event) =>
                      setCateringInfo({ ...cateringInfo, cuisineType: event.target.value })
                    }
                  />

                  <div className="guest-range">
                    <input
                      type="number"
                      placeholder="Min Guests"
                      required
                      value={cateringInfo.minGuests}
                      onChange={(event) =>
                        setCateringInfo({ ...cateringInfo, minGuests: event.target.value })
                      }
                    />
                    <input
                      type="number"
                      placeholder="Max Guests"
                      required
                      value={cateringInfo.maxGuests}
                      onChange={(event) =>
                        setCateringInfo({ ...cateringInfo, maxGuests: event.target.value })
                      }
                    />
                  </div>

                  <h4>Food Items</h4>
                  {foodItems.map((item, index) => (
                    <div className="food-item-row" key={index}>
                      <input
                        type="text"
                        placeholder="Food Item Name"
                        required
                        value={item.foodName}
                        onChange={(event) =>
                          handleFoodItemChange(index, 'foodName', event.target.value)
                        }
                      />
                      <select
                        value={item.foodType}
                        onChange={(event) =>
                          handleFoodItemChange(index, 'foodType', event.target.value)
                        }
                      >
                        <option value="Veg">Veg</option>
                        <option value="Non-Veg">Non-Veg</option>
                        <option value="Vegan">Vegan</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Price / Person"
                        required
                        value={item.pricePerPerson}
                        onChange={(event) =>
                          handleFoodItemChange(index, 'pricePerPerson', event.target.value)
                        }
                      />
                      <button
                        type="button"
                        className="remove-food-item-btn"
                        onClick={() => removeFoodItem(index)}
                        disabled={foodItems.length === 1}
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="add-food-item-btn"
                    onClick={addFoodItem}
                  >
                    + Add Food Item
                  </button>
                </div>
              )}

              <input
                type="text"
                placeholder="Overall / Starting Price"
                required
                value={postForm.price}
                onChange={(event) =>
                  setPostForm({ ...postForm, price: event.target.value })
                }
              />

              <textarea
                placeholder="Short Description"
                required
                value={postForm.desc}
                onChange={(event) =>
                  setPostForm({ ...postForm, desc: event.target.value })
                }
              />

              {/* ---- image upload (up to MAX_IMAGES) ---- */}
              <div className="image-upload-section">
                <label>
                  Sample Work Photos ({totalImageCount}/{MAX_IMAGES})
                </label>

                <div className="image-preview-grid">
                  {existingImages.map((url, index) => (
                    <div className="image-thumb" key={`existing-${index}`}>
                      <img src={url} alt={`existing-${index}`} />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {newImagePreviews.map((url, index) => (
                    <div className="image-thumb" key={`new-${index}`}>
                      <img src={url} alt={`new-${index}`} />
                      <button type="button" onClick={() => removeNewImage(index)}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {totalImageCount < MAX_IMAGES && (
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageFilesChange}
                  />
                )}
              </div>

              <input
                type="tel"
                placeholder="Phone Number"
                required
                value={postForm.phone}
                onChange={(event) =>
                  setPostForm({ ...postForm, phone: event.target.value })
                }
              />

              <button
                type="submit"
                className="submit-btn"
                disabled={imageUploading}
              >
                {imageUploading
                  ? 'Uploading...'
                  : editingService
                    ? 'Send Changes for Approval'
                    : 'Submit for Approval'}
              </button>

              <button
                type="button"
                className="cancel-btn"
                onClick={handleCloseModal}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;
