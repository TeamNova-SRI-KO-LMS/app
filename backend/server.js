const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dns = require('dns');
require('dotenv').config();

// Use public DNS to prevent SRV lookup failures (ECONNREFUSED) with MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  console.warn('Could not set custom DNS servers:', e.message);
}

const { initSocket } = require('./socket/socketManager');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const discussionForumRoutes = require('./routes/discussionForumRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const joinUsRoutes = require('./routes/joinUsRoutes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO with HTTP server
initSocket(server);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB database!'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files (avatars)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Enhanced database availability middleware with auto-reconnect
const checkDatabase = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    console.log(`⚠️ Database disconnected for ${req.method} ${req.path}. Attempting to reconnect...`);

    try {
      const mongooseOptions = {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 1,
        bufferCommands: false,
        connectTimeoutMS: 30000,
        heartbeatFrequencyMS: 10000,
        maxIdleTimeMS: 30000,
        retryWrites: true,
        w: 'majority'
      };

      await mongoose.connect(process.env.MONGODB_URI, mongooseOptions);
      console.log('✅ Database reconnected successfully');
      return next();
    } catch (err) {
      console.error('❌ Database reconnection failed:', err.message);
      return res.status(503).json({
        success: false,
        message: 'Database service temporarily unavailable. Please try again shortly.',
        error: 'DATABASE_CONNECTION_ERROR',
        retryAfter: 5 // seconds
      });
    }
  }
  next();
};

// Route registrations
app.use('/api/auth', authRoutes);
app.use('/api/users', checkDatabase, userRoutes);
app.use('/api/courses', checkDatabase, courseRoutes);
app.use('/api/subscriptions', checkDatabase, subscriptionRoutes);
app.use('/api/payments', checkDatabase, paymentRoutes);
app.use('/api/notifications', checkDatabase, notificationRoutes);
app.use('/api/announcements', checkDatabase, announcementRoutes);
app.use('/api/forums', checkDatabase, discussionForumRoutes);
app.use('/api/admin/settings', checkDatabase, settingsRoutes);
app.use('/api/attendance', checkDatabase, attendanceRoutes);
app.use('/api/admin/analytics', checkDatabase, analyticsRoutes);
app.use('/api/join-us', checkDatabase, joinUsRoutes);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
