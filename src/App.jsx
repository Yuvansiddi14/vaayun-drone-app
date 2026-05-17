import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, MapPin, User, ShoppingCart, ChevronRight, Pill, 
  HeartPulse, Microscope, Sparkles, Leaf, Thermometer, Baby, Apple, 
  Plus, Minus, Trash2, Navigation, LogOut, ChevronDown, 
  X, Crosshair, Package, Upload, Menu, Home, Grid, MessageCircle, Heart, Clock, CreditCard,
  ShoppingBag, MessageSquare, Wallet, RefreshCw, Gift, Star, Bell, Info, ChevronLeft, Settings, ShieldCheck
} from 'lucide-react';
import io from 'socket.io-client';

const isDev = import.meta.env.DEV;
const API_BASE = isDev ? `http://${window.location.hostname}:3001` : '';
const socket = io(isDev ? `http://${window.location.hostname}:3001` : undefined);

const getIcon = (iconName) => {
  const icons = { Pill, HeartPulse, Microscope, Sparkles, Leaf, Thermometer, Baby, Apple };
  const Icon = icons[iconName] || Pill;
  return <Icon size={24} strokeWidth={1.5} />;
};

const VaayunApp = () => {
  const [activeTab, setActiveTab] = useState('home'); // home, categories, tracking, account
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [dbMedicines, setDbMedicines] = useState([]);
  
  // Product Details & Wishlist
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [wishlist, setWishlist] = useState([]);

  // Account Dashboard State
  const [userOrders, setUserOrders] = useState([]);
  const [userAddresses, setUserAddresses] = useState([]);
  const [accountSubTab, setAccountSubTab] = useState('menu'); // menu, orders, wishlist, addresses
  const [placeholderModal, setPlaceholderModal] = useState(null);
  
  // Exhaustive Categories State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedNav, setExpandedNav] = useState('health');
  
  // Checkout & Payment State
  const [checkoutStep, setCheckoutStep] = useState(null); // 'location', 'payment', 'processing'
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  
  const healthStoreCategories = [
    'Factory Direct', 'Gift Store', 'Baby Needs', 'Personal Care', 'Women Care', 
    'Health & Nutrition', 'OTC & Health Needs', 'Vitamins & Supplements', 
    'Diabetic Needs', 'Household Needs', 'Ayurvedic', 'Fashion & Lifestyle', 'Combo Products'
  ];
  
  const pharmacyCategories = [
    { id: 'gastro', name: 'Gastrointestinal & Hepatobiliary', query: 'Gastro' },
    { id: 'cardio', name: 'Cardiovascular & Hematopoietic', query: 'Cardiac' },
    { id: 'respiratory', name: 'Respiratory System', query: 'Cough' },
    { id: 'cns', name: 'Central Nervous System', query: 'Epileptic' },
    { id: 'musculo', name: 'Musculo-Skeletal System', query: 'Anti Rheumatics' },
    { id: 'hormones', name: 'Hormones', query: 'Hormone' },
    { id: 'infectious', name: 'Infectious Disease Drugs', query: 'Cephalosporin' },
    { id: 'oncology', name: 'Oncology', query: 'Oncology' },
    { id: 'endocrine', name: 'Endocrine & Metabolic System', query: 'Antidiabetic' },
    { id: 'vitamins', name: 'Vitamins & Minerals', query: 'Vitamin' },
    { id: 'eye', name: 'Eye Care', query: 'Ophthalmological' },
    { id: 'derma', name: 'Dermatologicals', query: 'Derma' }
  ];

  const quickCategories = [
    { id: 'stomach', name: 'Stomach Care', query: 'Gastro', icon: 'Leaf' },
    { id: 'cold', name: 'Cold & Cough', query: 'Cough', icon: 'Thermometer' },
    { id: 'diabetes', name: 'Diabetes', query: 'Antidiabetic', icon: 'HeartPulse' },
    { id: 'antibiotics', name: 'Antibiotics', query: 'Cephalosporin', icon: 'Microscope' },
    { id: 'baby', name: 'Baby Care', query: 'Baby', icon: 'Baby' },
    { id: 'nutrition', name: 'Nutrition', query: 'Vitamin', icon: 'Apple' }
  ];

  const [isSearching, setIsSearching] = useState(false);
  
  // Auth & User State
  const [user, setUser] = useState(null);
  const [isLoginFlow, setIsLoginFlow] = useState(true);
  const [authStep, setAuthStep] = useState('details'); 
  const [authForm, setAuthForm] = useState({ name: '', phone: '', email: '', lat: null, lng: null });
  const [otpInput, setOtpInput] = useState('');
  const [addressDetails, setAddressDetails] = useState({ houseNo: '', line1: '', landmark: '', city: '', state: '', pincode: '' });
  
  // Checkout & Tracking State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [trackingStatus, setTrackingStatus] = useState('PENDING'); 
  const [activeDroneData, setActiveDroneData] = useState(null);
  const [showDeliveryComplete, setShowDeliveryComplete] = useState(false);
  
  // Tracking Flow
  const mapRef = useRef(null);
  const [telemetry, setTelemetry] = useState({ eta: 14, dist: 3.2, alt: 0 });

  useEffect(() => {
    const savedUser = localStorage.getItem('vaayun_current_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    
    const savedWishlist = localStorage.getItem('vaayun_wishlist');
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    
    fetchMedicines('', 'all');
  }, []);

  // Fetch User Data when Account Tab is active
  useEffect(() => {
    if (activeTab === 'account' && user) {
      fetch(`${API_BASE}/api/user/orders/${user.email}`)
        .then(res => res.json())
        .then(data => setUserOrders(data))
        .catch(console.error);
        
      fetch(`${API_BASE}/api/user/addresses/${user.email}`)
        .then(res => res.json())
        .then(data => setUserAddresses(data))
        .catch(console.error);
    }
  }, [activeTab, user]);

  useEffect(() => {
    socket.on('order-assigned', (data) => {
      if (data.orderId === activeOrderId) {
        setTrackingStatus('ASSIGNED');
        setActiveDroneData(data.drone);
      }
    });

    socket.on('telemetry-update', (data) => {
      if (activeDroneData && data.id === activeDroneData.id) {
        setTelemetry(prev => ({
          ...prev,
          alt: data.alt || prev.alt,
          dist: calculateDistance(data.lat, data.lng, user.lat, user.lng),
          eta: Math.ceil(calculateDistance(data.lat, data.lng, user.lat, user.lng) * 2)
        }));
      }
    });

    return () => {
      socket.off('order-assigned');
      socket.off('telemetry-update');
    };
  }, [activeOrderId, activeDroneData, user]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  };

  const fetchMedicines = async (query, cat = selectedCategory) => {
    setIsSearching(true);
    try {
      let apiQuery = query;
      let apiCat = cat;
      const catObj = pharmacyCategories.find(c => c.id === cat) || quickCategories.find(c => c.id === cat);
      if (catObj && cat !== 'all') {
        apiQuery = query ? `${query} ${catObj.query}` : catObj.query;
        apiCat = 'all';
      }
      const res = await fetch(`${API_BASE}/api/medicines/search?q=${encodeURIComponent(apiQuery)}&category=${encodeURIComponent(apiCat)}`);
      const data = await res.json();
      
      // Parse pricing properly
      const processedData = data.map(item => {
        let actualPrice = 0;
        if (item.product_price) {
          actualPrice = parseFloat(item.product_price.replace('₹', '').replace(',', ''));
        }
        // Generate a mock MRP (1.2x to 1.35x actual price) to show premium discounts
        const mockMrpMultiplier = 1.2 + (Math.random() * 0.15); 
        const mockMrp = Math.ceil(actualPrice * mockMrpMultiplier);
        
        return { ...item, parsedPrice: actualPrice, mockMrp };
      });
      
      setDbMedicines(processedData);
    } catch (err) {}
    setIsSearching(false);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchMedicines(searchQuery, selectedCategory);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedCategory]);

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
          const data = await res.json();
          if (data && data.address) {
            setAddressDetails(prev => ({
              ...prev,
              line1: data.address.road || data.address.suburb || '',
              city: data.address.city || data.address.town || '',
              state: data.address.state || '',
              pincode: data.address.postcode || ''
            }));
          }
        } catch (e) {}
      }, () => alert("Location permission denied."));
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/api/send-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authForm.email, isLoginFlow })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setAuthStep('otp');
      alert(data.message);
    } catch (error) { alert(error.message); }
  };

  const proceedToVerify = async (userData) => {
    try {
      const response = await fetch(`${API_BASE}/api/verify-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authForm.email, otp: otpInput, userData, isLoginFlow })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      localStorage.setItem('vaayun_current_user', JSON.stringify(data.user));
      setUser(data.user); setActiveTab('home'); setAuthStep('details'); setOtpInput('');
    } catch (error) { alert(error.message); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!isLoginFlow) {
      const fullAddress = `${addressDetails.houseNo}, ${addressDetails.line1}, ${addressDetails.city}, ${addressDetails.state} - ${addressDetails.pincode}`;
      proceedToVerify({ ...authForm, address: fullAddress, lat: 17.3850, lng: 78.4867 });
    } else { proceedToVerify(authForm); }
  };

  const handleLogout = () => {
    localStorage.removeItem('vaayun_current_user');
    setUser(null);
    setActiveTab('home');
  };

  const toggleWishlist = (item, e) => {
    if(e) e.stopPropagation();
    const exists = wishlist.find(w => w.id === item.id);
    let newWishlist;
    if (exists) {
      newWishlist = wishlist.filter(w => w.id !== item.id);
    } else {
      newWishlist = [...wishlist, item];
    }
    setWishlist(newWishlist);
    localStorage.setItem('vaayun_wishlist', JSON.stringify(newWishlist));
  };

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1, price: item.parsedPrice }];
    });
    if (selectedProduct) setSelectedProduct(null);
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: i.quantity + delta } : i).filter(i => i.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const initiateCheckout = () => {
    if (cart.length === 0) return;
    setDeliveryLocation({ lat: user.lat, lng: user.lng });
    setCheckoutStep('location');
  };

  const processPaymentAndOrder = async () => {
    setCheckoutStep('processing');
    
    // Simulate Payment Gateway Delay
    await new Promise(r => setTimeout(r, 2000));
    
    try {
      const response = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, name: user.name, lat: deliveryLocation.lat, lng: deliveryLocation.lng, items: cart })
      });
      const data = await response.json();
      if (data.success) {
        setCart([]);
        setIsCartOpen(false);
        setCheckoutStep(null);
        setActiveOrderId(data.orderId);
        setTrackingStatus('PENDING');
        setActiveTab('tracking');
      } else {
        alert("Server error: " + (data.error || "Unknown error"));
        setCheckoutStep(null);
      }
    } catch (error) { 
      console.error(error);
      alert("Failed to process payment & order: " + error.message); 
      setCheckoutStep(null);
    }
  };

  const updateLocationViaGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setDeliveryLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => alert("Failed to get GPS location. Please allow location access.")
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const handleCategorySelect = (id) => {
    setSelectedCategory(id);
    setIsDrawerOpen(false);
    setSearchQuery('');
  };

  // Drone Map Effect
  useEffect(() => {
    if (activeTab === 'tracking' && user && window.L) {
      try {
        if (mapRef.current) mapRef.current.remove();
        const targetLat = activeDroneData?.delivery?.lat || user.lat || 17.3850;
        const targetLng = activeDroneData?.delivery?.lng || user.lng || 78.4867;
        
        const map = window.L.map('drone-map', { zoomControl: false }).setView([targetLat, targetLng], 14);
        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);

        const pulseIcon = window.L.divIcon({ className: 'pulse-icon', html: `<div style="width: 20px; height: 20px; background: rgba(0, 136, 81, 0.4); border: 2px solid #008851; border-radius: 50%;"></div>` });
        window.L.marker([targetLat, targetLng], { icon: pulseIcon }).addTo(map);
        
        const hubLat = activeDroneData?.vendor?.lat || (targetLat + 0.04);
        const hubLng = activeDroneData?.vendor?.lng || (targetLng + 0.04);
        
        const droneSvg = `<svg width="30" height="30" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="12" style="box-shadow: 0 2px 6px rgba(0,0,0,0.3)"/><path d="M12 4L12 20M4 12L20 12" stroke="#c91f28" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="#008851"/></svg>`;
        const droneIcon = window.L.divIcon({ html: `<div style="transform: rotate(${Math.atan2(targetLng-hubLng, targetLat-hubLat)*180/Math.PI}deg);">${droneSvg}</div>`, className: '', iconSize: [30, 30], iconAnchor: [15, 15] });
        const droneMarker = window.L.marker([hubLat, hubLng], { icon: droneIcon }).addTo(map);
        window.L.polyline([[hubLat, hubLng], [targetLat, targetLng]], { color: '#c91f28', dashArray: '4, 8', weight: 2 }).addTo(map);
        
        mapRef.current = map;

        if (trackingStatus === 'PENDING') {
           map.panTo([hubLat, hubLng], { animate: false });
           return;
        }

        let progress = 0;
        const totalFrames = 800;
        const animate = () => {
          if (!mapRef.current || progress >= totalFrames) return;
          progress++;
          const ease = 1 - Math.pow(1 - progress/totalFrames, 3);
          const currentLat = hubLat + (targetLat - hubLat) * ease;
          const currentLng = hubLng + (targetLng - hubLng) * ease;
          
          droneMarker.setLatLng([currentLat, currentLng]);
          map.panTo([currentLat, currentLng], { animate: false });
          
          if (progress < totalFrames) requestAnimationFrame(animate);
          else {
            setTelemetry({ eta: 'Landed', dist: '0.00', alt: 0 });
            fetch(`${API_BASE}/api/orders/${activeOrderId}/deliver`, { method: 'POST' });
            setShowDeliveryComplete(true);
          }
        };
        setTimeout(() => requestAnimationFrame(animate), 500);
      } catch (err) {
        console.error("Leaflet Error:", err);
      }
    }
  }, [activeTab, user, trackingStatus, activeDroneData]);

  if (!user) {
    return (
      <div className="app-wrapper">
        <div className="app-container">
          <div className="mobile-header" style={{ alignItems: 'center' }}>
          <div className="logo-text" style={{ fontSize: '24px' }}>VAAYUN<span>MART</span></div>
        </div>
        <div className="auth-container">
          <h2 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: '700' }}>{isLoginFlow ? 'Login / Sign Up' : 'Create Account'}</h2>
          {authStep === 'details' ? (
            <form onSubmit={handleAuthSubmit}>
              {!isLoginFlow && (
                <>
                  <input required type="text" placeholder="Full Name" className="input-field" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} />
                  <input required type="text" placeholder="Phone Number" className="input-field" value={authForm.phone} onChange={e => setAuthForm({...authForm, phone: e.target.value})} />
                </>
              )}
              <input required type="email" placeholder="Email Address" className="input-field" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
              
              {!isLoginFlow && (
                <div style={{ background: '#f9f9f9', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '14px', margin: 0, fontWeight: '600' }}>Delivery Address</h4>
                    <span onClick={handleUseCurrentLocation} style={{ color: 'var(--secondary)', fontSize: '12px', fontWeight: '600' }}>Auto Detect</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input required type="text" placeholder="House/Flat No." className="input-field" value={addressDetails.houseNo} onChange={e => setAddressDetails({...addressDetails, houseNo: e.target.value})} />
                    <input required type="text" placeholder="Pincode" className="input-field" value={addressDetails.pincode} onChange={e => setAddressDetails({...addressDetails, pincode: e.target.value})} />
                  </div>
                  <input required type="text" placeholder="Address Line 1" className="input-field" value={addressDetails.line1} onChange={e => setAddressDetails({...addressDetails, line1: e.target.value})} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input required type="text" placeholder="City" className="input-field" value={addressDetails.city} onChange={e => setAddressDetails({...addressDetails, city: e.target.value})} />
                    <input required type="text" placeholder="State" className="input-field" value={addressDetails.state} onChange={e => setAddressDetails({...addressDetails, state: e.target.value})} />
                  </div>
                </div>
              )}
              <button type="submit" className="btn-add-cart-solid" style={{ padding: '14px', fontSize: '16px' }}>{isLoginFlow ? 'Send OTP' : 'Sign Up'}</button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>Enter the 4-digit code sent to {authForm.email}</p>
              <input required type="text" placeholder="1234" maxLength="4" className="input-field" style={{ fontSize: '24px', letterSpacing: '8px', textAlign: 'center', fontWeight: '700' }} value={otpInput} onChange={e => setOtpInput(e.target.value)} />
              <button type="submit" className="btn-add-cart-solid" style={{ padding: '14px', fontSize: '16px' }}>Verify</button>
            </form>
          )}
          {authStep === 'details' && (
            <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              {isLoginFlow ? "New User? " : "Already registered? "}
              <span style={{ color: 'var(--primary)', fontWeight: '600' }} onClick={() => setIsLoginFlow(!isLoginFlow)}>{isLoginFlow ? 'Sign Up' : 'Login'}</span>
            </p>
          )}
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <div className="app-container">
        
        {/* Drawer Overlay */}
        {isDrawerOpen && (
          <div className="drawer-overlay" onClick={() => setIsDrawerOpen(false)}>
            <div className="hamburger-drawer" onClick={e => e.stopPropagation()}>
              <div className="drawer-header">
                <div className="drawer-profile">
                  <div className="profile-avatar"><User size={24} color="white" /></div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '800' }}>Hi, {user.name.split(' ')[0]}</div>
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>View Profile</div>
                  </div>
                </div>
                <X size={24} onClick={() => setIsDrawerOpen(false)} style={{ cursor: 'pointer' }} />
              </div>
              
              <div className="drawer-content">
                <div className="drawer-item" onClick={() => setExpandedNav(expandedNav === 'health' ? '' : 'health')}>
                  <Grid size={18} color="var(--primary)" />
                  <span style={{ flex: 1, fontWeight: '600' }}>Health Store</span>
                  <ChevronDown size={16} style={{ transform: expandedNav === 'health' ? 'rotate(180deg)' : 'none', transition: 'var(--transition)' }} />
                </div>
                {expandedNav === 'health' && healthStoreCategories.map(cat => (
                  <div key={cat} className="drawer-sub-item" onClick={() => handleCategorySelect(cat)}>{cat}</div>
                ))}
                
                <div className="drawer-item" onClick={() => setExpandedNav(expandedNav === 'pharmacy' ? '' : 'pharmacy')}>
                  <Pill size={18} color="var(--primary)" />
                  <span style={{ flex: 1, fontWeight: '600' }}>Pharmacy</span>
                  <ChevronDown size={16} style={{ transform: expandedNav === 'pharmacy' ? 'rotate(180deg)' : 'none', transition: 'var(--transition)' }} />
                </div>
                {expandedNav === 'pharmacy' && pharmacyCategories.map(cat => (
                  <div key={cat.id} className="drawer-sub-item" onClick={() => handleCategorySelect(cat.id)}>
                    {cat.name}
                  </div>
                ))}
                
                <div className="drawer-section-title">Other Services</div>
                <div className="drawer-item"><Microscope size={18} color="var(--text-secondary)"/> Diagnostics</div>
                <div className="drawer-item"><HeartPulse size={18} color="var(--text-secondary)"/> Doctors</div>
                <div className="drawer-item"><Sparkles size={18} color="var(--text-secondary)"/> MedPlus Advantage</div>
              </div>
            </div>
          </div>
        )}

        {/* Product Details Full Screen Overlay */}
        {selectedProduct && (
          <div className="product-details-overlay">
            <div className="details-header">
              <X size={28} onClick={() => setSelectedProduct(null)} style={{ cursor: 'pointer' }} />
              <div style={{ flex: 1, textAlign: 'center', fontWeight: '800', fontSize: '16px' }}>Details</div>
              <Heart 
                size={24} 
                color={wishlist.find(w => w.id === selectedProduct.id) ? "var(--primary)" : "var(--text-tertiary)"}
                fill={wishlist.find(w => w.id === selectedProduct.id) ? "var(--primary)" : "none"}
                onClick={() => toggleWishlist(selectedProduct)} 
                style={{ cursor: 'pointer' }}
              />
            </div>
            
            <div className="details-content">
              <div className="product-image-large">
                {selectedProduct.image_url ? (
                  <img src={selectedProduct.image_url} alt={selectedProduct.product_name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '24px' }} />
                ) : (
                  <Pill size={80} color="var(--text-tertiary)" opacity={0.3} />
                )}
              </div>
              
              <div className="details-info-card">
                <div className="details-brand">{selectedProduct.product_manufactured || 'MedPlus Health Services'}</div>
                <h1 className="details-name">{selectedProduct.product_name}</h1>
                
                <div className="price-row-top" style={{ marginBottom: '8px' }}>
                  <span className="mrp" style={{ fontSize: '14px' }}>MRP ₹{selectedProduct.mockMrp}</span>
                  <span className="save-percent" style={{ fontSize: '13px' }}>
                    Save {Math.round(((selectedProduct.mockMrp - selectedProduct.parsedPrice) / selectedProduct.mockMrp) * 100)}%
                  </span>
                </div>
                <div className="final-price" style={{ fontSize: '28px' }}>₹{selectedProduct.parsedPrice}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Inclusive of all taxes</div>
              </div>

              <div className="details-info-card">
                <div className="details-section-title"><Sparkles size={18} color="var(--primary)"/> Uses & Composition</div>
                <div className="details-composition">
                  <strong>Salt Composition:</strong> {selectedProduct.salt_composition || 'Not available'}
                </div>
                <p className="details-text">{selectedProduct.medicine_desc || 'Detailed uses and descriptions are currently unavailable for this specific medicine. Please consult your doctor.'}</p>
              </div>

              <div className="details-info-card">
                <div className="details-section-title"><HeartPulse size={18} color="var(--primary)"/> Side Effects</div>
                <p className="details-text">{selectedProduct.side_effects || 'No common side effects reported. Consult your physician if you experience any discomfort.'}</p>
              </div>
              
              <div className="details-info-card" style={{ borderBottom: 'none' }}>
                <div className="details-section-title"><Microscope size={18} color="var(--primary)"/> Drug Interactions</div>
                <p className="details-text">{selectedProduct.drug_interactions || 'No severe interactions found. Inform your doctor about all ongoing medications.'}</p>
              </div>
            </div>

            <div className="details-bottom-bar">
              <div className="details-price-box">
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Total Price</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>₹{selectedProduct.parsedPrice}</div>
              </div>
              <button className="details-btn-cart" onClick={() => addToCart(selectedProduct)}>
                Add to Cart
              </button>
            </div>
          </div>
        )}

        {/* Cart Drawer */}
        {isCartOpen && (
          <div className="drawer-overlay" onClick={() => setIsCartOpen(false)} style={{ zIndex: 1100 }}>
            <div className="drawer" onClick={e => e.stopPropagation()}>
              <div className="drawer-header" style={{ padding: '24px 20px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 'inherit' }}>
                <div style={{ fontSize: '18px', fontWeight: '800' }}>Your Cart ({cartItemCount})</div>
                <X size={24} onClick={() => setIsCartOpen(false)} style={{ cursor: 'pointer' }} />
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px', marginBottom: '16px' }}>
                    <div style={{ width: '64px', height: '64px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Pill size={24} color="#94a3b8" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', lineHeight: '1.3' }}>{item.product_name}</div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '12px' }}>₹{item.price}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--border-color)', width: 'fit-content', borderRadius: '24px', padding: '4px 8px' }}>
                        <Minus size={16} onClick={() => updateQuantity(item.id, -1)} style={{ cursor: 'pointer' }} />
                        <span style={{ fontSize: '14px', fontWeight: '700' }}>{item.quantity}</span>
                        <Plus size={16} onClick={() => updateQuantity(item.id, 1)} style={{ cursor: 'pointer' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {cart.length > 0 && (
                <div className="drawer-footer">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '18px', fontWeight: '800' }}>
                    <span>Total Amount</span>
                    <span>₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <button className="btn-checkout" onClick={initiateCheckout}>Place Drone Order</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Placeholder Modal for Profile Actions */}
        {placeholderModal && (
          <div className="drawer-overlay" style={{ opacity: 1, visibility: 'visible', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'white', padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
               <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f3e8ff', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                 <Sparkles size={32} />
               </div>
               <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{placeholderModal}</h3>
               <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
                 This feature is currently in active development. We're building something amazing for you!
               </p>
               <button onClick={() => setPlaceholderModal(null)} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--primary)', color: 'white', fontWeight: '700', border: 'none', cursor: 'pointer' }}>
                 Got it
               </button>
            </div>
          </div>
        )}

        {/* Checkout - Location Confirmation */}
        {checkoutStep === 'location' && (
          <div className="drawer-overlay" style={{ opacity: 1, visibility: 'visible', zIndex: 3000 }}>
            <div className="drawer-content" style={{ transform: 'translateX(0)' }}>
              <div className="drawer-header">
                <h2>Confirm Delivery Location</h2>
                <X onClick={() => setCheckoutStep(null)} style={{ cursor: 'pointer' }} />
              </div>
              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <MapPin size={24} color="var(--primary)" />
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-primary)' }}>Delivery Coordinates</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>These coordinates will be sent to the drone.</div>
                    </div>
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '15px', background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold' }}>
                    Lat: {deliveryLocation?.lat?.toFixed(5) || 'Loading...'}<br/>
                    Lng: {deliveryLocation?.lng?.toFixed(5) || 'Loading...'}
                  </div>
                </div>
                
                <button onClick={updateLocationViaGPS} style={{ padding: '16px', borderRadius: '12px', background: 'white', border: '2px solid var(--primary)', color: 'var(--primary)', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <Navigation size={20} /> Update via GPS
                </button>
              </div>
              <div className="drawer-footer">
                <button className="btn-checkout" onClick={() => setCheckoutStep('payment')}>Confirm & Proceed to Payment</button>
              </div>
            </div>
          </div>
        )}

        {/* Checkout - Payment Gateway */}
        {(checkoutStep === 'payment' || checkoutStep === 'processing') && (
          <div className="drawer-overlay" style={{ opacity: 1, visibility: 'visible', zIndex: 3000 }}>
            <div className="drawer-content" style={{ transform: 'translateX(0)', background: '#f8fafc' }}>
              <div className="drawer-header" style={{ background: 'white', borderBottom: '1px solid #e2e8f0' }}>
                <h2>Secure Payment</h2>
                <X onClick={() => setCheckoutStep(null)} style={{ cursor: 'pointer' }} />
              </div>
              
              {checkoutStep === 'processing' ? (
                <div style={{ padding: '40px 24px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                   <div style={{ width: '60px', height: '60px', border: '4px solid #e2e8f0', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                   <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Processing Payment...</h3>
                   <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>Please do not close this window or press back.</p>
                </div>
              ) : (
                <>
                  <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', marginBottom: '24px', textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Amount to Pay</div>
                      <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)' }}>₹{cartTotal.toFixed(2)}</div>
                    </div>

                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>Payment Methods</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {['UPI', 'Credit/Debit Card', 'Cash on Delivery'].map((method) => (
                        <div 
                          key={method}
                          onClick={() => setPaymentMethod(method)}
                          style={{
                            background: 'white', padding: '16px', borderRadius: '12px', border: `2px solid ${paymentMethod === method ? 'var(--primary)' : '#e2e8f0'}`,
                            display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'var(--transition)'
                          }}
                        >
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `6px solid ${paymentMethod === method ? 'var(--primary)' : '#e2e8f0'}` }} />
                          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{method}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="drawer-footer" style={{ background: 'white' }}>
                    <button className="btn-checkout" onClick={processPaymentAndOrder} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <ShieldCheck size={20} /> Pay ₹{cartTotal.toFixed(2)} Securely
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Mobile Header (Hidden if activeTab is 'account') */}
        {activeTab !== 'account' && (
          <>
            <div className="mobile-header">
              <div className="header-top-row">
                <div className="header-left">
                  <button className="hamburger-btn" onClick={() => setIsDrawerOpen(true)}>
                    <Menu size={26} strokeWidth={2.5} />
                  </button>
                  <div className="logo-text">VAAYUN<span>MART</span></div>
                </div>
                <div className="header-right">
                  <div className="header-icon" onClick={() => setIsCartOpen(true)}>
                    <ShoppingCart size={24} />
                    {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
                  </div>
                </div>
              </div>
              
              <div className="search-bar-container">
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Search Medicines..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="search-btn"><Search size={18} /></button>
              </div>
            </div>
            
            <div className="location-bar">
              <MapPin size={16} color="var(--primary)" />
              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.address}</span>
            </div>
          </>
        )}

        {/* Main Content Area */}
        <main className="main-content">
          {(activeTab === 'home' || activeTab === 'search') && (
            <>
              {activeTab === 'home' && !searchQuery && (
                <>
                  <div className="banner-slider">
                    <div className="banner-item">
                      <div className="banner-card" style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)' }}>
                        <div className="banner-content">
                          <div className="banner-title" style={{ color: '#0369a1' }}>FLAT 20% OFF</div>
                          <div className="banner-subtitle" style={{ color: '#0c4a6e' }}>On medicine orders above ₹1000</div>
                          <div style={{ fontSize: '10px', color: '#0369a1', marginTop: '8px', fontWeight: '700' }}>*T&C Apply</div>
                        </div>
                        <div className="banner-img-container"><Package size={50} color="#0284c7" /></div>
                      </div>
                    </div>
                    <div className="banner-item">
                      <div className="banner-card" style={{ background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' }}>
                        <div className="banner-content">
                          <div className="banner-title" style={{ color: '#166534' }}>FAST DRONE</div>
                          <div className="banner-subtitle" style={{ color: '#14532d' }}>Get medicines delivered in minutes</div>
                          <div style={{ fontSize: '14px', fontWeight: '800', color: '#166534', marginTop: '4px' }}>Try Now</div>
                        </div>
                        <div className="banner-img-container"><Navigation size={50} color="#15803d" /></div>
                      </div>
                    </div>
                  </div>

                  <div className="section-header">
                    <h2 className="section-title">Shop by Category</h2>
                    <span className="view-all">View All</span>
                  </div>
                  
                  <div className="category-scroll">
                    {quickCategories.map(cat => (
                      <div key={cat.id} className="cat-circle-item" onClick={() => handleCategorySelect(cat.id)}>
                        <div className="cat-circle">{getIcon(cat.icon)}</div>
                        <span className="cat-label">{cat.name}</span>
                      </div>
                    ))}
                  </div>

                  <div className="section-header">
                    <h2 className="section-title">Best Sellers</h2>
                    <span className="view-all">View All</span>
                  </div>
                </>
              )}

              <div className={searchQuery || selectedCategory !== 'all' ? "product-grid" : "product-horizontal-list"}>
                {dbMedicines.map((item) => {
                  const discount = Math.round(((item.mockMrp - item.parsedPrice) / item.mockMrp) * 100);
                  const inWishlist = wishlist.find(w => w.id === item.id);
                  
                  return (
                    <div key={item.id} className={searchQuery || selectedCategory !== 'all' ? "product-card" : "mobile-product-card"} onClick={() => setSelectedProduct(item)}>
                      <div className="wishlist-btn" onClick={(e) => toggleWishlist(item, e)}>
                        <Heart size={16} color={inWishlist ? "var(--primary)" : "var(--text-tertiary)"} fill={inWishlist ? "var(--primary)" : "none"} />
                      </div>
                      
                      <div className="product-image-box">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.product_name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px', borderRadius: 'var(--radius-sm)' }} />
                        ) : (
                          getIcon(quickCategories.find(c => item.sub_category?.includes(c.query))?.icon || 'Pill')
                        )}
                      </div>
                      <div className="product-brand">{item.product_manufactured || 'MedPlus Health Services'}</div>
                      <div className="product-name" title={item.product_name}>{item.product_name}</div>
                      
                      <div className="price-box">
                        <div className="price-row-top">
                          <span className="mrp">MRP ₹{item.mockMrp}</span>
                          <span className="save-percent">Save {discount}%</span>
                        </div>
                        <div className="final-price">₹{item.parsedPrice}</div>
                      </div>
                      
                      <button className="btn-add-cart-solid" onClick={(e) => { e.stopPropagation(); addToCart(item); }}>
                        Add to Cart
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Account Dashboard / Zepto-Style Profile */}
          {activeTab === 'account' && (
            <div style={{ background: '#f4f5f7', minHeight: '100%', paddingBottom: '100px' }}>
              
              {/* Common Profile Header */}
              <div style={{ background: 'white', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 }}>
                <ChevronLeft size={24} color="#0f172a" style={{ cursor: 'pointer' }} onClick={() => accountSubTab !== 'menu' ? setAccountSubTab('menu') : setActiveTab('home')} />
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Profile</h2>
              </div>

              {accountSubTab === 'menu' && (
                <div style={{ padding: '20px' }}>
                  {/* User Info Block */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #7e22ce)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <User size={32} />
                    </div>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>{user.name}</div>
                      <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>+91 {user.phone || '99999 99999'}</div>
                    </div>
                  </div>

                  {/* 3 Quick Action Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                    {[
                      { id: 'orders', icon: <ShoppingBag size={24} color="#334155" />, label: 'Your Orders' },
                      { id: 'support', icon: <MessageSquare size={24} color="#334155" />, label: 'Help & Support' },
                      { id: 'wishlist', icon: <Heart size={24} color="#334155" />, label: 'Your Wishlist' }
                    ].map(btn => (
                      <div 
                        key={btn.id}
                        onClick={() => btn.id === 'support' ? setPlaceholderModal('Help & Support') : setAccountSubTab(btn.id)}
                        style={{ background: 'white', borderRadius: '16px', padding: '16px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', textAlign: 'center' }}
                      >
                        {btn.icon}
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', lineHeight: '1.2' }}>{btn.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Zepto Cash Banner */}
                  <div style={{ background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px', border: '1px solid #d8b4fe' }}>
                    <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(168, 85, 247, 0.2)', cursor: 'pointer' }} onClick={() => setPlaceholderModal('Vaayun Cash & Gift Card')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '700', color: '#0f172a' }}>
                        <Wallet size={20} color="#7e22ce" /> Vaayun Cash & Gift Card
                      </div>
                      <ChevronRight size={18} color="#64748b" />
                    </div>
                    <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '14px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Available Balance <span style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>₹0</span>
                      </div>
                      <button onClick={() => setPlaceholderModal('Add Balance')} style={{ background: 'white', color: '#0f172a', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        Add Balance
                      </button>
                    </div>
                  </div>

                  {/* Update Available Banner */}
                  <div style={{ background: 'white', borderRadius: '16px', padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', cursor: 'pointer' }} onClick={() => setPlaceholderModal('App Update')}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <RefreshCw size={24} color="#64748b" />
                      <div>
                        <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '15px', marginBottom: '2px' }}>Update Available</div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>Enjoy a more seamless shopping experience</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ background: '#10b981', color: 'white', fontSize: '11px', fontWeight: '800', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>New</span>
                      <ChevronRight size={18} color="#f43f5e" />
                    </div>
                  </div>

                  {/* Your Information List */}
                  <div style={{ fontWeight: '800', fontSize: '18px', color: '#0f172a', marginBottom: '12px' }}>Your Information</div>
                  <div style={{ background: 'white', borderRadius: '16px', padding: '0 16px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    {[
                      { id: 'refunds', icon: <RefreshCw size={20} color="#334155" />, label: 'Your Refunds' },
                      { id: 'wishlist', icon: <Heart size={20} color="#334155" />, label: 'Your Wishlist' },
                      { id: 'giftcards', icon: <CreditCard size={20} color="#334155" />, label: 'E-Gift Cards' },
                      { id: 'support', icon: <MessageSquare size={20} color="#334155" />, label: 'Help & Support' },
                      { id: 'addresses', icon: <MapPin size={20} color="#334155" />, label: 'Saved Addresses', sub: `${userAddresses.length} Addresses` },
                      { id: 'profile', icon: <User size={20} color="#334155" />, label: 'Profile' },
                      { id: 'rewards', icon: <Gift size={20} color="#334155" />, label: 'Rewards' },
                      { id: 'payment', icon: <CreditCard size={20} color="#334155" />, label: 'Payment Management' }
                    ].map((item, idx, arr) => (
                      <div 
                        key={item.id} 
                        onClick={() => ['wishlist', 'addresses'].includes(item.id) ? setAccountSubTab(item.id) : setPlaceholderModal(item.label)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: idx !== arr.length - 1 ? '1px dashed #e2e8f0' : 'none', cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          {item.icon}
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>{item.label}</div>
                            {item.sub && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{item.sub}</div>}
                          </div>
                        </div>
                        <ChevronRight size={18} color="#94a3b8" />
                      </div>
                    ))}
                  </div>

                  {/* Other Information List */}
                  <div style={{ fontWeight: '800', fontSize: '18px', color: '#0f172a', marginBottom: '12px' }}>Other Information</div>
                  <div style={{ background: 'white', borderRadius: '16px', padding: '0 16px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    {[
                      { id: 'appicon', icon: <Sparkles size={20} color="#334155" />, label: 'Change App Icon' },
                      { id: 'suggest', icon: <Star size={20} color="#334155" />, label: 'Suggest Products' },
                      { id: 'notifications', icon: <Bell size={20} color="#334155" />, label: 'Notifications' },
                      { id: 'general', icon: <Info size={20} color="#334155" />, label: 'General Info' }
                    ].map((item, idx, arr) => (
                      <div 
                        key={item.id} 
                        onClick={() => setPlaceholderModal(item.label)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: idx !== arr.length - 1 ? '1px dashed #e2e8f0' : 'none', cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          {item.icon}
                          <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>{item.label}</div>
                        </div>
                        <ChevronRight size={18} color="#94a3b8" />
                      </div>
                    ))}
                  </div>

                  <button onClick={handleLogout} style={{ width: '100%', background: 'white', border: 'none', borderRadius: '16px', padding: '18px', fontWeight: '800', fontSize: '16px', color: '#0f172a', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', cursor: 'pointer', marginBottom: '20px' }}>
                    Log Out
                  </button>

                  <div style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', paddingBottom: '20px' }}>
                    App version 26.4.7<br/>v159-13
                  </div>
                </div>
              )}

              {/* Sub-Pages */}
              <div style={{ padding: '20px' }}>
                {accountSubTab === 'orders' && (
                  <>
                    <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '800' }}>Your Orders</h3>
                    {userOrders.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                        <Package size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                        <p>No recent orders found.</p>
                      </div>
                    ) : (
                      userOrders.map(order => (
                        <div key={order.id} className="order-card" style={{ background: 'white', padding: '16px', borderRadius: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                          <div className="order-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                            <div>
                              <div className="order-id" style={{ fontWeight: '800', color: '#0f172a' }}>Order #{order.id}</div>
                              <div className="order-date" style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{new Date(order.created_at).toLocaleString()}</div>
                            </div>
                            <div className={`order-status status-${order.status}`} style={{ fontWeight: '700', fontSize: '12px' }}>{order.status}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700', color: 'var(--primary)' }}>
                            <Navigation size={16} /> Drone Delivery
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}

                {accountSubTab === 'wishlist' && (
                  <>
                    <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '800' }}>Saved Items</h3>
                    {wishlist.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                        <Heart size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                        <p>Your wishlist is empty.</p>
                      </div>
                    ) : (
                      <div className="product-grid" style={{ padding: 0 }}>
                        {wishlist.map(item => (
                          <div key={item.id} className="product-card" onClick={() => setSelectedProduct(item)} style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
                            <div className="wishlist-btn" onClick={(e) => toggleWishlist(item, e)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'white', padding: '6px', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                              <Heart size={16} color="var(--primary)" fill="var(--primary)" />
                            </div>
                            <div className="product-image-box" style={{ height: '120px', background: '#f8fafc', padding: '12px' }}>
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.product_name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              ) : (
                                <Pill size={24} color="#ccc" style={{ margin: 'auto', display: 'block' }} />
                              )}
                            </div>
                            <div style={{ padding: '12px' }}>
                              <div className="product-name" style={{ height: '36px', overflow: 'hidden', fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>{item.product_name}</div>
                              <div className="final-price" style={{ fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>₹{item.parsedPrice}</div>
                              <button className="btn-add-cart-solid" onClick={(e) => { e.stopPropagation(); addToCart(item); }} style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: '700', fontSize: '13px' }}>Move to Cart</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {accountSubTab === 'addresses' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Saved Addresses</h3>
                      <span onClick={() => setPlaceholderModal('Add New Address')} style={{ color: 'var(--primary)', fontSize: '13px', fontWeight: '700', cursor: 'pointer', background: '#f3e8ff', padding: '6px 12px', borderRadius: '20px' }}>+ Add New</span>
                    </div>
                    {userAddresses.length === 0 ? (
                      <div className="address-card" style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                          <Home size={24} color="#94a3b8" />
                          <div>
                            <div style={{ fontWeight: '800', fontSize: '15px', color: '#0f172a', marginBottom: '4px' }}>Primary Address</div>
                            <div style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>{user.address}</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      userAddresses.map(addr => (
                        <div key={addr.id} className="address-card" style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                            <Home size={24} color="#94a3b8" />
                            <div>
                              <div style={{ fontWeight: '800', fontSize: '15px', color: '#0f172a', marginBottom: '4px' }}>{addr.type || 'Home'}</div>
                              <div style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>{addr.address}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Drone Tracking HUD */}
          {activeTab === 'tracking' && (
            <div className="drone-tracking-container">
              <div className="tracking-header">
                <div style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>Order #{activeOrderId}</div>
                <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '700' }}>
                  {trackingStatus === 'PENDING' ? 'Preparing Drone Dispatch...' : `Drone ${activeDroneData?.id} Dispatched`}
                </div>
              </div>
              
              <div id="drone-map" className="map-container"></div>
              
              <div className="telemetry-dashboard">
                <div className="telemetry-grid">
                  <div className="telemetry-item"><div className="telemetry-label">ETA</div><div className="telemetry-value" style={{ color: 'var(--primary)' }}>{telemetry.eta} Min</div></div>
                  <div className="telemetry-item"><div className="telemetry-label">Distance</div><div className="telemetry-value">{telemetry.dist} km</div></div>
                  <div className="telemetry-item"><div className="telemetry-label">Altitude</div><div className="telemetry-value">{telemetry.alt} m</div></div>
                  <div className="telemetry-item"><div className="telemetry-label">Speed</div><div className="telemetry-value">{activeDroneData?.speed || 0} km/h</div></div>
                </div>
              </div>
              
              {showDeliveryComplete && (
                <div style={{ padding: '32px', textAlign: 'center', background: 'var(--bg-surface)' }}>
                  <h3 style={{ color: 'var(--secondary)', marginBottom: '12px', fontSize: '24px', fontWeight: '800' }}>Delivered Successfully!</h3>
                  <button className="btn-checkout" onClick={() => setActiveTab('home')}>Return to Home</button>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Floating WhatsApp Action Button */}
        {(activeTab === 'home' || activeTab === 'search') && !isDrawerOpen && !isCartOpen && !selectedProduct && (
          <div className="fab-whatsapp"><MessageCircle size={26} /></div>
        )}

        {/* Bottom Navigation */}
        <nav className="bottom-nav">
          <div className={`nav-item ${activeTab === 'home' && !searchQuery && selectedCategory === 'all' ? 'active' : ''}`} onClick={() => {setActiveTab('home'); setSelectedCategory('all'); setSearchQuery('');}}>
            <Home size={22} /><span>Home</span>
          </div>
          <div className={`nav-item ${activeTab === 'search' || selectedCategory !== 'all' ? 'active' : ''}`} onClick={() => setIsDrawerOpen(true)}>
            <Grid size={22} /><span>Categories</span>
          </div>
          <div className={`nav-item ${activeTab === 'tracking' ? 'active' : ''}`} onClick={() => { if(activeOrderId) setActiveTab('tracking'); else alert("No active orders found"); }}>
            <Navigation size={22} /><span>Track</span>
          </div>
          <div className={`nav-item ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}>
            <User size={22} /><span>Account</span>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default VaayunApp;
