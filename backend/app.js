const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Also applies the public-DNS workaround for MongoDB Atlas locally (see config/dns.js)
const { connectDB, requireDatabase, getDatabaseStatus } = require('./config/db');
const { parseAllowedOrigins } = require('./config/cors');

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
const eventRoutes = require('./routes/eventRoutes');
const joinUsRoutes = require('./routes/joinUsRoutes');
const lectureRoutes = require('./routes/lectureRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const chatRoutes = require('./routes/chatRoutes');
const { globalLimiter, authLimiter } = require('./middleware/rateLimiter');

const app = express();

app.disable('x-powered-by');

// Trust proxy headers on Vercel or behind reverse proxies so req.ip is the client IP.
if (process.env.VERCEL || process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(cors({
  origin: parseAllowedOrigins(),
  credentials: true,
}));

// Apply global rate limiting to protect against abuse and DoS attacks
app.use(globalLimiter);

// Stricter limits on authentication routes to prevent brute-force attacks
const authRateLimitedRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/verify-reset-otp',
  '/login',
  '/register',
  '/forgot-password',
  '/verify-reset-otp',
];
app.use(authRateLimitedRoutes, authLimiter);

// 50 MB locally for base64 uploads; Vercel itself caps request bodies at 4.5 MB.
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve legacy uploaded files (avatars) when running locally. New uploads are
// stored in the database or Supabase, and Vercel ignores express.static().
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'SRI-KO LMS API',
    status: 'running',
    docs: '/api/health',
  });
});

// Health check used to verify a deployment: reports API and database status.
app.get('/api/health', async (req, res) => {
  try {
    await connectDB();
    res.json({
      success: true,
      status: 'ok',
      database: getDatabaseStatus(),
      environment: process.env.VERCEL ? 'vercel' : (process.env.NODE_ENV || 'development'),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      status: 'degraded',
      database: getDatabaseStatus(),
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Route registrations
app.use('/api/auth', requireDatabase, authRoutes);
app.use('/api/users', requireDatabase, userRoutes);
app.use('/api/courses', requireDatabase, courseRoutes);
app.use('/api/subscriptions', requireDatabase, subscriptionRoutes);
app.use('/api/payments', requireDatabase, paymentRoutes);
app.use('/api/notifications', requireDatabase, notificationRoutes);
app.use('/api/announcements', requireDatabase, announcementRoutes);
app.use('/api/forums', requireDatabase, discussionForumRoutes);
app.use('/api/admin/settings', requireDatabase, settingsRoutes);
app.use('/api/attendance', requireDatabase, attendanceRoutes);
app.use('/api/admin/analytics', requireDatabase, analyticsRoutes);
app.use('/api/events', requireDatabase, eventRoutes);
app.use('/api/join-us', requireDatabase, joinUsRoutes);
app.use('/api/lectures', requireDatabase, lectureRoutes);
app.use('/api/assignments', requireDatabase, assignmentRoutes);
app.use('/api/chat', requireDatabase, chatRoutes);

// Unknown API routes return JSON instead of Express's HTML 404 page.
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Final error handler: always answer with JSON so the function stays healthy.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Request body is too large.' });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Malformed JSON in request body.' });
  }

  console.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, err);
  return res.status(err.status || 500).json({
    success: false,
    message: 'Internal server error',
  });
});

module.exports = app;
