import React, { useState, useEffect, useRef } from 'react';
import { 
  Plane, 
  Battery, 
  Activity, 
  Compass, 
  Radio, 
  Navigation, 
  MapPin, 
  Shield, 
  Info, 
  X, 
  PlaneTakeoff, 
  CheckCircle, 
  AlertCircle,
  MessageSquare,
  Send,
  Tag,
  Package,
  Users,
  Search,
  ShoppingCart,
  MessageCircle,
  MoreVertical,
  LogOut,
  Settings,
  Bell,
  RefreshCw,
  Clock,
  ExternalLink
} from 'lucide-react';
import io from 'socket.io-client';

const isDev = import.meta.env.DEV;
const API_BASE = isDev ? `${API_BASE}` : '';
const socket = io(isDev ? `${API_BASE}` : undefined);

const AdminApp = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [fleetDrones, setFleetDrones] = useState([]);
  const [selectedDrone, setSelectedDrone] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadEmails, setUnreadEmails] = useState(new Set());

  useEffect(() => {
    fetchData();
    
    socket.on('telemetry-update', (data) => {
      if (!data || !data.id) return;
      setFleetDrones(prev => {
        const index = prev.findIndex(d => d.id === data.id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...data, isLive: true };
          return updated;
        }
        return [...prev, { ...data, isLive: true }];
      });
      setSelectedDrone(prev => {
        if (prev?.id === data.id) return { ...prev, ...data, isLive: true };
        return prev;
      });
    });

    socket.on('new-order', (data) => {
      fetchData();
      alert(`🚀 New Order Received from ${data.user_name}!`);
    });

    socket.on('order-delivered', (data) => {
      fetchData();
    });

    socket.on('new-message', (data) => {
      if (selectedTicket && data.email === selectedTicket.email) {
        fetchMessages(data.email);
      } else {
        setUnreadEmails(prev => new Set(prev).add(data.email));
      }
    });

    return () => {
      socket.off('telemetry-update');
      socket.off('new-order');
      socket.off('order-delivered');
      socket.off('new-message');
    };
  }, [selectedTicket]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.email);
    }
  }, [selectedTicket]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchMessages = async (email) => {
    try {
      const res = await fetch(`${API_BASE}/api/support/chat/${email}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Chat fetch error:", err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    try {
      const res = await fetch(`${API_BASE}/api/support/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: selectedTicket.email,
          sender: 'admin',
          message: newMessage
        })
      });
      if (res.ok) {
        setMessages(prev => [...prev, { sender: 'admin', message: newMessage, timestamp: new Date() }]);
        setNewMessage('');
      }
    } catch (err) {
      console.error("Send error:", err);
    }
  };

  const handleAssignDrone = async (droneId) => {
    if (!selectedOrder) return;
    try {
      const res = await fetch(`${API_BASE}/api/assign-drone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: selectedOrder.id, droneId })
      });
      if (res.ok) {
        fetchData();
        setSelectedOrder(null);
        setIsAssigning(false);
      }
    } catch (err) {
      console.error("Assign error:", err);
    }
  };

  const handleCompleteOrder = async (orderId, droneId) => {
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/deliver`, {
        method: 'POST'
      });
      if (res.ok) {
        setSelectedOrder(null);
        fetchData();
      }
    } catch (err) {
      console.error("Complete error:", err);
    }
  };

  const filteredMedicines = medicines.filter(m => 
    m.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.sub_category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchData = async () => {
    try {
      const [dronesRes, ordersRes, vendorsRes, medRes, ticketsRes] = await Promise.all([
        fetch(`${API_BASE}/api/drones`),
        fetch(`${API_BASE}/api/orders`),
        fetch(`${API_BASE}/api/vendors`),
        fetch(`${API_BASE}/api/medicines`),
        fetch(`${API_BASE}/api/support/tickets`)
      ]);

      const [dronesData, ordersData, vendorsData, medData, ticketsData] = await Promise.all([
        dronesRes.json(),
        ordersRes.json(),
        vendorsRes.json(),
        medRes.json(),
        ticketsRes.json()
      ]);

      setFleetDrones(dronesData);
      setOrders(ordersData);
      setVendors(vendorsData);
      setMedicines(medData);
      setSupportTickets(ticketsData);
    } catch (err) {
      console.error("Fetch error:", err);
      alert(`⚠️ Dashboard Connection Error: Cannot reach the backend on port 3001. Ensure your firewall isn't blocking it. Details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#FFC107';
      case 'DISPATCHED': return '#2196F3';
      case 'DELIVERED': return '#4CAF50';
      case 'ACTIVE': return '#4CAF50';
      case 'STANDBY': return '#9E9E9E';
      case 'CHARGING': return '#2196F3';
      default: return '#eee';
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar / Nav */}
      <div style={{ display: 'flex' }}>
        <aside style={{ width: '280px', background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)', minHeight: '100vh', color: 'white', position: 'fixed', left: 0, top: 0, boxShadow: '4px 0 24px rgba(0,0,0,0.1)' }}>
          <div style={{ padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <img src="/logo.png" alt="Vaayun Logo" style={{ width: '120px', height: '120px', objectFit: 'contain' }} />
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', letterSpacing: '0.5px' }}>VAAYUN ADMIN</h1>
          </div>

          <nav style={{ padding: '20px 10px' }}>
            {[
              { id: 'orders', icon: <ShoppingCart size={18} />, label: 'Orders' },
              { id: 'vendors', icon: <Users size={18} />, label: 'Vendors' },
              { id: 'inventory', icon: <Package size={18} />, label: 'Inventory' },
              { id: 'fleet', icon: <Activity size={18} />, label: 'Fleet Command' },
              { 
                id: 'support', 
                icon: (
                  <div style={{ position: 'relative' }}>
                    <MessageCircle size={18} />
                    {unreadEmails.size > 0 && <div style={{ position: 'absolute', top: -4, right: -4, width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', border: '2px solid #1e293b' }}></div>}
                  </div>
                ), 
                label: 'Support' 
              }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.id === 'support') {
                    // Do not clear all, wait for individual ticket selection
                  }
                }}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  background: activeTab === item.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                  border: 'none',
                  color: activeTab === item.id ? '#fff' : '#94a3b8',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  marginBottom: '8px',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  fontWeight: activeTab === item.id ? '600' : '500',
                  boxShadow: activeTab === item.id ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                }}
                onMouseEnter={(e) => { if (activeTab !== item.id) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff'; }}}
                onMouseLeave={(e) => { if (activeTab !== item.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}}
              >
                {item.icon}
                <span style={{ fontSize: '15px' }}>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main style={{ marginLeft: '280px', flex: 1, padding: '40px', maxWidth: '1400px' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', background: 'rgba(255,255,255,0.8)', padding: '20px 30px', borderRadius: '20px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 4px 24px rgba(0,0,0,0.02)' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Dashboard
              </h2>
              <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Manage your high-performance delivery ecosystem</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <button onClick={fetchData} style={{ padding: '12px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }} onMouseEnter={e => e.currentTarget.style.color = '#0f172a'} onMouseLeave={e => e.currentTarget.style.color = '#64748b'}><RefreshCw size={18} /></button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#fff', padding: '8px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px' }}>A</div>
                <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>Admin User</div>
              </div>
            </div>
          </header>

          {activeTab === 'orders' && (
            <div style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ORDER ID</th>
                    <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CUSTOMER</th>
                    <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>STATUS</th>
                    <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DRONE</th>
                    <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'all 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '20px 24px', fontWeight: '600', color: '#0f172a' }}>#{order.id}</td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>{order.user_name}</div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>{order.user_email}</div>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <span style={{ 
                          padding: '6px 12px', 
                          borderRadius: '20px', 
                          fontSize: '12px', 
                          fontWeight: '600', 
                          background: getStatusColor(order.status) + '15',
                          color: getStatusColor(order.status),
                          border: `1px solid ${getStatusColor(order.status)}30`
                        }}>{order.status}</span>
                      </td>
                      <td style={{ padding: '20px 24px', color: '#64748b', fontWeight: '500' }}>{order.drone_id || '---'}</td>
                      <td style={{ padding: '20px 24px' }}>
                        <button 
                          onClick={() => setSelectedOrder(order)}
                          style={{ background: '#f1f5f9', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: '600', padding: '8px 16px', borderRadius: '8px', transition: 'all 0.2s ease' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Order Management Modal */}
          {selectedOrder && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0 }}>Order #{selectedOrder.id}</h3>
                  <X style={{ cursor: 'pointer' }} onClick={() => setSelectedOrder(null)} />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', color: '#888' }}>CUSTOMER</div>
                  <div style={{ fontWeight: '600' }}>{selectedOrder.user_name}</div>
                  <div style={{ fontSize: '14px' }}>{selectedOrder.user_email}</div>
                </div>
                
                <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>DELIVERY COORDINATES</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#0f172a' }}>
                    Lat: {selectedOrder.lat}<br/>
                    Lng: {selectedOrder.lng}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedOrder.status === 'PENDING' && (
                    <button 
                      onClick={() => setIsAssigning(true)}
                      style={{ padding: '12px', borderRadius: '8px', background: '#0A3D62', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Assign Drone
                    </button>
                  )}
                  {selectedOrder.status === 'DISPATCHED' && (
                    <button 
                      onClick={() => handleCompleteOrder(selectedOrder.id, selectedOrder.drone_id)}
                      style={{ padding: '12px', borderRadius: '8px', background: '#4CAF50', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Mark as Delivered
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Drone Selection Modal */}
          {isAssigning && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '450px', maxHeight: '80vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0 }}>Select a Drone</h3>
                  <X style={{ cursor: 'pointer' }} onClick={() => setIsAssigning(false)} />
                </div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {fleetDrones.filter(d => d.status === 'STANDBY').map(drone => (
                    <button 
                      key={drone.id}
                      onClick={() => handleAssignDrone(drone.id)}
                      style={{ padding: '15px', borderRadius: '10px', border: '1px solid #ddd', background: 'white', textAlign: 'left', cursor: 'pointer' }}
                    >
                      <div style={{ fontWeight: '700' }}>{drone.id}</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>Battery: {drone.battery}% | Speed: {drone.speed}km/h</div>
                    </button>
                  ))}
                  {fleetDrones.filter(d => d.status === 'STANDBY').length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No drones available</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vendors' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {vendors.map(vendor => (
                <div key={vendor.id} style={{ background: '#fff', padding: '24px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', transition: 'all 0.3s ease', cursor: 'pointer' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.08)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.04)'; }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: '700' }}>{vendor.name}</h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Premium Partner</p>
                    </div>
                    <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '12px' }}>
                      <Tag size={20} color="#3b82f6" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: '#f8fafc', padding: '16px', borderRadius: '16px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>DISTANCE</div>
                      <div style={{ fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>{vendor.distance}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>INVENTORY</div>
                      <div style={{ fontWeight: '700', fontSize: '16px', color: '#10b981' }}>{vendor.inventory}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'inventory' && (
            <div style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', background: '#f8fafc' }}>
                <div style={{ position: 'relative', width: '350px' }}>
                  <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input 
                    type="text" 
                    placeholder="Search 250k+ medicines..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ padding: '12px 16px 12px 48px', borderRadius: '12px', border: '1px solid #e2e8f0', width: '100%', outline: 'none', background: '#fff', transition: 'all 0.2s ease', fontSize: '14px' }} 
                    onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                  />
                </div>
              </div>
              <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: '#fff', position: 'sticky', top: 0, borderBottom: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <tr>
                      <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PRODUCT</th>
                      <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CATEGORY</th>
                      <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PRICE</th>
                      <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>STOCK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMedicines.map(med => (
                      <tr key={med.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'all 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '20px 24px' }}>
                          <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>{med.product_name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{med.product_manufactured}</div>
                        </td>
                        <td style={{ padding: '20px 24px', color: '#475569' }}>{med.sub_category}</td>
                        <td style={{ padding: '20px 24px', fontWeight: '700', color: '#0f172a' }}>{med.product_price}</td>
                        <td style={{ padding: '20px 24px' }}>
                          <span style={{ color: '#10b981', fontWeight: '700', background: '#d1fae5', padding: '6px 12px', borderRadius: '20px', fontSize: '12px' }}>IN STOCK</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'fleet' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' }}>
              {fleetDrones.map(drone => (
                <div key={drone.id} style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', transition: 'all 0.3s ease' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.boxShadow = '0 20px 40px rgba(0,0,0,0.08)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.boxShadow = '0 10px 40px rgba(0,0,0,0.04)'; }}>
                  <div style={{ padding: '20px 24px', background: drone.isLive ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ padding: '10px', borderRadius: '12px', background: drone.isLive ? 'rgba(255,255,255,0.2)' : '#0f172a' }}>
                        <Plane size={20} color="white" />
                      </div>
                      <span style={{ fontWeight: '800', color: drone.isLive ? 'white' : '#0f172a', fontSize: '18px' }}>{drone.id}</span>
                    </div>
                    {drone.isLive && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.2)', padding: '6px 12px', borderRadius: '20px', backdropFilter: 'blur(4px)', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                        <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', animation: 'pulse 1.5s infinite', boxShadow: '0 0 8px #10b981' }}></div>
                        <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '800', letterSpacing: '0.5px' }}>PI CONNECTED</span>
                      </div>
                    )}
                  </div>

                  {drone.isLive && (
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#0f172a' }}>
                      <img 
                        src={`http://${drone.ip}:8080`} 
                        alt="Feed" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'none', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#64748b', fontSize: '12px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <AlertCircle size={28} style={{ marginBottom: '12px', opacity: 0.5 }} />
                          <div style={{ fontWeight: '600', letterSpacing: '1px' }}>VIDEO OFFLINE</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ padding: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', marginBottom: '4px' }}><Battery size={14}/> BATTERY</div>
                        <div style={{ fontWeight: '800', fontSize: '20px', color: drone.battery < 30 ? '#ef4444' : '#0f172a' }}>{drone.battery}%</div>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', marginBottom: '4px' }}><Navigation size={14}/> SPEED</div>
                        <div style={{ fontWeight: '800', fontSize: '20px', color: '#0f172a' }}>{drone.speed} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>km/h</span></div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedDrone(drone)}
                      style={{ 
                        width: '100%', padding: '14px', borderRadius: '12px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; }}
                    >
                      <Activity size={18} />
                      Command Drone
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'support' && (
            <div style={{ background: '#fff', borderRadius: '24px', height: '70vh', display: 'flex', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '320px', borderRight: '1px solid #e2e8f0', overflowY: 'auto', background: '#f8fafc' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', fontWeight: '700', color: '#0f172a', fontSize: '18px' }}>Active Conversations</div>
                {supportTickets.map(ticket => (
                  <div 
                    key={ticket.email} 
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setUnreadEmails(prev => {
                        const next = new Set(prev);
                        next.delete(ticket.email);
                        return next;
                      });
                    }} 
                    style={{ 
                      padding: '20px 24px', 
                      borderBottom: '1px solid #e2e8f0', 
                      cursor: 'pointer', 
                      background: selectedTicket?.email === ticket.email ? '#fff' : 'transparent',
                      borderLeft: selectedTicket?.email === ticket.email ? '4px solid #3b82f6' : '4px solid transparent',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '15px', marginBottom: '4px' }}>{ticket.name}</div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>{ticket.email}</div>
                    </div>
                    {unreadEmails.has(ticket.email) && <div style={{ width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%', boxShadow: '0 0 0 4px rgba(239,68,68,0.2)' }}></div>}
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>
                {selectedTicket ? (
                  <>
                    <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                      <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{selectedTicket.name.charAt(0)}</div>
                        {selectedTicket.name}
                      </div>
                      <button 
                        onClick={async () => {
                          if (window.confirm("Are you sure the issue is resolved? This will conclude the session.")) {
                            const res = await fetch(`${API_BASE}/api/support/chat/${selectedTicket.email}`, { method: 'DELETE' });
                            if (res.ok) {
                              setSelectedTicket(null);
                              fetchData();
                            }
                          }
                        }}
                        style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(239,68,68,0.2)' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        End Conversation
                      </button>
                    </div>
                    <div style={{ flex: 1, padding: '30px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {messages.map((msg, i) => (
                        <div key={i} style={{ 
                          alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start',
                          background: msg.sender === 'admin' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#fff',
                          color: msg.sender === 'admin' ? 'white' : '#0f172a',
                          padding: '14px 20px',
                          borderRadius: msg.sender === 'admin' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                          maxWidth: '65%',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                          border: msg.sender === 'admin' ? 'none' : '1px solid #e2e8f0',
                          fontSize: '15px',
                          lineHeight: '1.5'
                        }}>
                          {msg.message}
                          <div style={{ fontSize: '11px', opacity: msg.sender === 'admin' ? 0.8 : 0.5, marginTop: '6px', textAlign: 'right' }}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                    <div style={{ padding: '24px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '16px', background: '#fff' }}>
                      <input 
                        type="text" 
                        placeholder="Type your response..." 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        style={{ flex: 1, padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '15px', background: '#f8fafc', transition: 'all 0.2s ease' }} 
                        onFocus={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#fff'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
                      />
                      <button 
                        onClick={handleSendMessage}
                        style={{ padding: '0 24px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(59,130,246,0.3)', transition: 'all 0.2s ease' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <Send size={20}/>
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexDirection: 'column', gap: '20px', background: '#f8fafc' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                      <MessageCircle size={36} color="#cbd5e1" />
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '500' }}>Select a ticket to join the conversation</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Telemetry Modal */}
      {selectedDrone && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }} onClick={() => setSelectedDrone(null)}>
          <div style={{ background: '#1a1a1a', width: '100%', maxWidth: '1100px', height: '85vh', borderRadius: '25px', display: 'flex', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <div style={{ flex: 2, position: 'relative', background: '#000' }}>
               <img 
                  src={`http://${selectedDrone.ip}:8080`} 
                  alt="Full Feed" 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
               />
               <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'none', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#ff4444' }}>
                 <div style={{ textAlign: 'center' }}>
                    <AlertCircle size={48} style={{ marginBottom: '15px' }} />
                    <h2 style={{ margin: 0 }}>NO VIDEO SIGNAL</h2>
                    <p style={{ color: '#666' }}>Checking Pi connection at {selectedDrone.ip}:8080</p>
                 </div>
               </div>
               
               {/* Overlay HUD */}
               <div style={{ position: 'absolute', top: '20px', left: '20px', display: 'flex', gap: '10px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.6)', padding: '10px 15px', borderRadius: '10px', color: 'white', backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '10px', opacity: 0.7 }}>ALTITUDE</div>
                    <div style={{ fontWeight: '700', fontSize: '18px' }}>{selectedDrone.alt}m</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.6)', padding: '10px 15px', borderRadius: '10px', color: 'white', backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '10px', opacity: 0.7 }}>HEADING</div>
                    <div style={{ fontWeight: '700', fontSize: '18px' }}>{selectedDrone.heading}°</div>
                  </div>
               </div>
            </div>
            
            <div style={{ width: '350px', padding: '30px', color: 'white', display: 'flex', flexDirection: 'column', gap: '25px', background: '#222' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '22px' }}>{selectedDrone.id}</h3>
                  <X style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => setSelectedDrone(null)} />
               </div>

               <div style={{ display: 'grid', gap: '15px' }}>
                  <div style={{ background: '#333', padding: '15px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '11px', opacity: 0.6, marginBottom: '5px' }}>FLIGHT MODE</div>
                    <div style={{ fontWeight: '700', color: '#2196F3' }}>{selectedDrone.mode}</div>
                  </div>
                  <div style={{ background: '#333', padding: '15px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '11px', opacity: 0.6, marginBottom: '5px' }}>MOTOR STATUS</div>
                    <div style={{ fontWeight: '700', color: selectedDrone.armed ? '#FF5252' : '#999' }}>{selectedDrone.armed ? 'ARMED' : 'DISARMED'}</div>
                  </div>
                  <div style={{ background: '#333', padding: '15px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '11px', opacity: 0.6, marginBottom: '5px' }}>GPS COORDINATES</div>
                    <div style={{ fontSize: '14px', fontFamily: 'monospace' }}>{selectedDrone.lat?.toFixed(5)}, {selectedDrone.lng?.toFixed(5)}</div>
                  </div>
               </div>

               <div style={{ marginTop: 'auto' }}>
                  <button style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#FF5252', color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer' }}>EMERGENCY LAND</button>
               </div>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default AdminApp;
