import React from 'react';
import { motion } from 'framer-motion';
import { Navigation, Clock, MapPin, ShieldCheck } from 'lucide-react';

const Tracking = ({ onClose }) => {
  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="glass"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        zIndex: 2000, 
        background: 'var(--bg-dark)',
        borderRadius: 0,
        padding: '40px 20px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '24px' }}>Drone Live Track</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px' }}>×</button>
      </div>

      {/* Map Visualization (Mock) */}
      <div className="glass" style={{ height: '300px', marginBottom: '30px', position: 'relative', overflow: 'hidden', background: 'rgba(0,0,0,0.5)' }}>
        <div style={{ 
          position: 'absolute', 
          width: '100%', 
          height: '100%', 
          backgroundImage: 'radial-gradient(circle, #1a2a30 1px, transparent 1px)', 
          backgroundSize: '20px 20px' 
        }}></div>
        
        {/* Path Line */}
        <svg width="100%" height="100%" style={{ position: 'absolute' }}>
          <motion.path 
            d="M 50 250 Q 150 50 350 150" 
            fill="transparent" 
            stroke="var(--primary)" 
            strokeWidth="2" 
            strokeDasharray="5,5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </svg>

        {/* Drone Icon */}
        <motion.div 
          animate={{ x: [50, 150, 350], y: [250, 50, 150] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <div style={{ transform: 'translate(-50%, -50%)' }}>
            <Navigation size={32} color="var(--primary)" fill="rgba(0, 210, 255, 0.2)" />
            <div className="shadow-glow" style={{ position: 'absolute', width: '20px', height: '20px', background: 'var(--primary)', filter: 'blur(10px)', borderRadius: '50%' }}></div>
          </div>
        </motion.div>

        {/* Home Icon */}
        <div style={{ position: 'absolute', bottom: '30px', left: '40px' }}>
          <MapPin size={24} color="var(--text-dim)" />
        </div>
        {/* Dest Icon */}
        <div style={{ position: 'absolute', top: '130px', right: '40px' }}>
          <MapPin size={24} color="var(--accent)" />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Clock size={24} color="var(--primary)" />
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>ETA</p>
            <p style={{ fontWeight: '700' }}>06:45 min</p>
          </div>
        </div>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <ShieldCheck size={24} color="#00ff88" />
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Status</p>
            <p style={{ fontWeight: '700' }}>In Flight</p>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ marginTop: '20px', padding: '24px' }}>
        <h3 style={{ marginBottom: '10px' }}>Package Details</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-dim)' }}>Order ID: #VN-99210</p>
        <p style={{ fontSize: '14px', color: 'var(--text-dim)' }}>Temp: <span style={{ color: '#00ff88' }}>4.2°C (Optimal)</span></p>
      </div>

      <button className="btn-primary" style={{ width: '100%', marginTop: '30px' }}>Call Support</button>
    </motion.div>
  );
};

export default Tracking;
