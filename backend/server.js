const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config({ path: './config.env' });

const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const app = express();
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB database!'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Enhanced database availability middleware with auto-reconnect
const checkDatabase = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    console.log(`⚠️ Database disconnected for ${req.method} ${req.path}. Attempting to reconnect...`);

    try {
      // Attempt to reconnect with enhanced options
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


app.use('/api/courses', checkDatabase, courseRoutes);

app.use('/api/subscriptions', checkDatabase, subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', checkDatabase, notificationRoutes);
app.use('/api/admin/settings', checkDatabase, settingsRoutes);
