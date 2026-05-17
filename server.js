import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});
const port = 3001;
const db = new sqlite3.Database('./vaayun.db');

app.use(cors());
app.use(express.json());

// Serve static frontend files from 'dist'
app.use(express.static(path.join(__dirname, 'dist')));

// --- GMAIL SETUP ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'yuvan.siddi09@gmail.com',
    pass: 'xxdr uyew jkag vknr'
  }
});

// --- FLEET STATE ---
let fleetDrones = [
  { id: 'VX-99', status: 'OFFLINE', battery: 0, speed: 0, alt: 0, heading: 0, mode: 'STANDBY', armed: false, ip: null, isLive: false },
  { id: 'VX-102', status: 'STANDBY', battery: 100, speed: 0, alt: 0, heading: 0, mode: 'IDLE', armed: false },
  { id: 'VX-105', status: 'CHARGING', battery: 32, speed: 0, alt: 0, heading: 0, mode: 'IDLE', armed: false },
  { id: 'VX-108', status: 'STANDBY', battery: 98, speed: 0, alt: 0, heading: 0, mode: 'IDLE', armed: false },
  { id: 'VX-112', status: 'MAINTENANCE', battery: 15, speed: 0, alt: 0, heading: 0, mode: 'IDLE', armed: false },
  { id: 'VX-114', status: 'STANDBY', battery: 100, speed: 0, alt: 0, heading: 0, mode: 'IDLE', armed: false }
];

const vendors = [
  { id: 'V1', name: 'Apollo Pharmacy', distance: '1.2km', inventory: 85, activeOrders: 2 },
  { id: 'V2', name: 'MedPlus Store', distance: '3.5km', inventory: 92, activeOrders: 0 },
  { id: 'V3', name: 'Fortis Medicals', distance: '5.8km', inventory: 78, activeOrders: 1 }
];

// --- MEDICINE SEARCH ---
app.get('/api/medicines/search', (req, res) => {
  const { q, category } = req.query;
  let sql = "SELECT * FROM medicines WHERE 1=1";
  let params = [];
  if (q) {
    sql += " AND (product_name LIKE ? OR salt_composition LIKE ? OR sub_category LIKE ?)";
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (category && category !== 'all') {
    sql += " AND sub_category = ?";
    params.push(category);
  }
  sql += " LIMIT 50";
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/medicines', (req, res) => {
  db.all("SELECT * FROM medicines LIMIT 100", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// --- AUTH ROUTES (REAL GMAIL OTP) ---
let otpStorage = {};

app.post('/api/send-otp', (req, res) => {
  const { email, isLoginFlow } = req.body;
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  otpStorage[email] = otp;
  const mailOptions = {
    from: 'yuvan.siddi09@gmail.com',
    to: email,
    subject: 'Your Vaayun Verification Code',
    text: `Your verification code is: ${otp}. It is valid for 10 minutes.`
  };
  if (isLoginFlow) {
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ error: "User not found. Please Sign Up." });
      transporter.sendMail(mailOptions, (error) => {
        if (error) return res.status(500).json({ error: "Failed to send email." });
        res.json({ message: "OTP sent to your Gmail!" });
      });
    });
  } else {
    transporter.sendMail(mailOptions, (error) => {
      if (error) return res.status(500).json({ error: "Failed to send email." });
      res.json({ message: "Verification code sent to your Gmail!" });
    });
  }
});

app.post('/api/verify-otp', (req, res) => {
  const { email, otp, userData, isLoginFlow } = req.body;
  if (otpStorage[email] !== otp) {
    return res.status(400).json({ error: "Invalid OTP. Check your Gmail." });
  }
  delete otpStorage[email];
  if (isLoginFlow) {
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ user });
    });
  } else {
    const { name, phone, email, address, lat, lng } = userData;
    db.run(
      "INSERT INTO users (name, phone, email, address, lat, lng) VALUES (?, ?, ?, ?, ?, ?)",
      [name, phone, email, address, lat, lng],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        db.get("SELECT * FROM users WHERE id = ?", [this.lastID], (err, user) => {
          res.json({ user });
        });
      }
    );
  }
});

// --- USER ADDRESSES ---
app.post('/api/user/addresses', (req, res) => {
  const { email, type, address, lat, lng } = req.body;
  db.run("INSERT INTO user_addresses (email, type, address, lat, lng) VALUES (?, ?, ?, ?, ?)", [email, type, address, lat, lng], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id: this.lastID });
  });
});

app.get('/api/user/addresses/:email', (req, res) => {
  db.all("SELECT * FROM user_addresses WHERE email = ?", [req.params.email], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// --- ORDERS & SUPPORT ---
app.get('/api/orders', (req, res) => {
  db.all("SELECT * FROM orders ORDER BY created_at DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/orders/:id', (req, res) => {
  db.get("SELECT * FROM orders WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
});

app.get('/api/user/orders/:email', (req, res) => {
  db.all("SELECT * FROM orders WHERE user_email = ? ORDER BY created_at DESC", [req.params.email], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/admin/drones', (req, res) => res.json(fleetDrones));

app.post('/api/orders', (req, res) => {
  const { email, name, lat, lng, items } = req.body;
  const itemsStr = JSON.stringify(items);
  db.run(
    "INSERT INTO orders (user_email, user_name, status, lat, lng, items) VALUES (?, ?, 'PENDING', ?, ?, ?)",
    [email, name, lat, lng, itemsStr],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      const orderId = this.lastID;
      io.emit('new-order', { id: orderId, user_name: name, status: 'PENDING' });
      res.json({ success: true, orderId });
    }
  );
});

app.post('/api/assign-drone', (req, res) => {
  const { orderId, droneId } = req.body;
  db.run("UPDATE orders SET status = 'DISPATCHED', drone_id = ? WHERE id = ?", [droneId, orderId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    const drone = fleetDrones.find(d => d.id === droneId);
    if (drone) drone.status = 'ACTIVE';
    io.emit('order-assigned', { orderId, droneId, drone });
    res.json({ success: true });
  });
});

app.post('/api/orders/:id/deliver', (req, res) => {
  const orderId = req.params.id;
  db.get("SELECT drone_id FROM orders WHERE id = ?", [orderId], (err, order) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!order) return res.status(404).json({ error: "Order not found" });
    db.run("UPDATE orders SET status = 'DELIVERED' WHERE id = ?", [orderId], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      const droneId = order.drone_id;
      if (droneId) {
        const drone = fleetDrones.find(d => d.id === droneId);
        if (drone) drone.status = 'STANDBY';
      }
      io.emit('order-delivered', { id: orderId, droneId });
      res.json({ success: true });
    });
  });
});

app.get('/api/support/tickets', (req, res) => {
  db.all("SELECT * FROM support_tickets", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/support/chat/:email', (req, res) => {
  db.all("SELECT * FROM support_messages WHERE email = ? ORDER BY timestamp ASC", [req.params.email], (err, messages) => {
    if (err) return res.status(500).json({ error: err.message });
    const hasAdmin = messages.some(m => m.sender === 'admin');
    res.json({ messages, status: hasAdmin ? 'human' : 'ai' });
  });
});

app.post('/api/support/chat', (req, res) => {
  const { email, name, message, sender } = req.body;
  if (sender === 'user') {
    db.run("INSERT OR IGNORE INTO support_tickets (email, name, status) VALUES (?, ?, 'ai')", [email, name], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get("SELECT status FROM support_tickets WHERE email = ?", [email], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        const isHuman = row && row.status === 'human';
        db.run("INSERT INTO support_messages (email, sender, message) VALUES (?, ?, ?)", [email, sender, message], (err) => {
          if (err) return res.status(500).json({ error: err.message });
          if (!isHuman) {
            let aiResponse = "I've received your message. A Vaayun agent will be with you shortly.";
            const msg = message.toLowerCase();
            if (msg.includes('order')) aiResponse = "You can track your active orders in the 'SkyNet HUD' or check 'Recent Orders' in your account.";
            if (msg.includes('drone')) aiResponse = "Our drones are VX-series high-performance delivery units. They are fully autonomous and safe.";
            if (msg.includes('medic')) aiResponse = "We have 250,000+ medicines in our database. Search for yours in the home screen!";
            setTimeout(() => {
              db.run("INSERT INTO support_messages (email, sender, message) VALUES (?, 'ai', ?)", [email, aiResponse]);
              io.emit('new-message', { email, sender: 'ai', message: aiResponse });
            }, 1500);
          }
          io.emit('new-message', { email, sender, message });
          res.json({ success: true });
        });
      });
    });
  } else {
    db.run("INSERT INTO support_messages (email, sender, message) VALUES (?, ?, ?)", [email, sender, message], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      io.emit('new-message', { email, sender, message });
      res.json({ success: true });
    });
  }
});

app.post('/api/support/send-message', (req, res) => {
  const { email, sender, message } = req.body;
  db.run("UPDATE support_tickets SET status = 'human' WHERE email = ?", [email], () => {
    db.run("INSERT INTO support_messages (email, sender, message) VALUES (?, ?, ?)", [email, sender, message], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      io.emit('new-message', { email, sender, message });
      res.json({ success: true });
    });
  });
});

app.delete('/api/support/chat/:email', (req, res) => {
  const email = req.params.email;
  db.run("DELETE FROM support_tickets WHERE email = ?", [email], (err2) => {
    if (err2) return res.status(500).json({ error: err2.message });
    const endMessage = "Support session has been officially closed by the agent.";
    db.run("INSERT INTO support_messages (email, sender, message) VALUES (?, 'system', ?)", [email, endMessage], () => {
      io.emit('chat-ended', { email });
      io.emit('new-message', { email, sender: 'system', message: endMessage });
      res.json({ success: true });
    });
  });
});

// --- FLEET API ---
app.get('/api/drones', (req, res) => res.json(fleetDrones));
app.get('/api/vendors', (req, res) => res.json(vendors));

// --- SOCKET.IO ---
// ================================================================
// ONLY THIS SECTION WAS CHANGED — all other code is identical
// ================================================================
io.on('connection', (socket) => {
  const clientIp = socket.handshake.address.replace('::ffff:', '');

  // Pi registers itself and sends camera URL
  socket.on('register_drone', (data) => {
    const update = { ...data, ip: clientIp, isLive: true, status: 'ACTIVE' };
    updateDroneState(update);
    io.emit('telemetry-update', update);
  });

  // Position → lat, lng, alt (renamed from alt_rel to match frontend)
  socket.on('telemetry_position', (data) => {
    const update = {
      id: data.id,
      lat: data.lat,
      lng: data.lng,
      alt: data.alt_rel,
      alt_abs: data.alt_abs,
    };
    updateDroneState(update);
    io.emit('telemetry-update', update);
  });

  // Heading
  socket.on('telemetry_heading', (data) => {
    const update = { id: data.id, heading: data.heading };
    updateDroneState(update);
    io.emit('telemetry-update', update);
  });

  // Velocity → speed converted m/s to km/h (frontend reads drone.speed in km/h)
  socket.on('telemetry_velocity', (data) => {
    const update = {
      id: data.id,
      speed: parseFloat((data.ground_speed_ms * 3.6).toFixed(1)),
      vertical_speed: data.vertical_speed_ms,
    };
    updateDroneState(update);
    io.emit('telemetry-update', update);
  });

  // Attitude (roll, pitch, yaw)
  socket.on('telemetry_attitude', (data) => {
    const update = { id: data.id, roll: data.roll, pitch: data.pitch, yaw: data.yaw };
    updateDroneState(update);
    io.emit('telemetry-update', update);
  });

  // Battery → percent renamed to battery (frontend reads drone.battery)
  socket.on('telemetry_battery', (data) => {
    const update = {
      id: data.id,
      battery: data.percent,
      voltage: data.voltage,
    };
    updateDroneState(update);
    io.emit('telemetry-update', update);
  });

  // GPS fix info
  socket.on('telemetry_gps', (data) => {
    const update = { id: data.id, num_sats: data.num_sats, fix_type: data.fix_type };
    updateDroneState(update);
    io.emit('telemetry-update', update);
  });

  // Flight mode
  socket.on('telemetry_mode', (data) => {
    const update = { id: data.id, mode: data.mode };
    updateDroneState(update);
    io.emit('telemetry-update', update);
  });

  // Armed state
  socket.on('telemetry_armed', (data) => {
    const update = { id: data.id, armed: data.armed };
    updateDroneState(update);
    io.emit('telemetry-update', update);
  });

  // RC signal
  socket.on('telemetry_rc', (data) => {
    const update = { id: data.id, rc_available: data.available, rc_signal: data.signal_strength };
    updateDroneState(update);
    io.emit('telemetry-update', update);
  });

  // Legacy combined event — kept for backwards compatibility
  socket.on('drone-telemetry', (data) => {
    const update = { ...data, ip: clientIp };
    updateDroneState(update);
    io.emit('telemetry-update', update);
  });
});

app.use(express.static(path.join(__dirname, 'dist')));

function updateDroneState(data) {
  const drone = fleetDrones.find(d => d.id === data.id);
  if (drone) Object.keys(data).forEach(key => { if (data[key] != null) drone[key] = data[key]; });
}

// Fallback routes for SPA
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'admin.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

httpServer.listen(port, '0.0.0.0', () => {
  const ip = Object.values(os.networkInterfaces()).flat().find(i => i.family === 'IPv4' && !i.internal)?.address || 'localhost';
  console.log(`🚀 Vaayun Backend FULLY RESTORED on http://${ip}:${port}`);
});