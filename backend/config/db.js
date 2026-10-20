const mongoose = require('mongoose');
const { databaseLookup } = require('./dns');

const CONNECTION_OPTIONS = {
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 1,
  connectTimeoutMS: 30000,
  heartbeatFrequencyMS: 10000,
  maxIdleTimeMS: 30000,
  retryWrites: true,
  w: 'majority',
  // Resolve Atlas hosts via public DNS when running locally (see config/dns.js)
  ...(databaseLookup ? { lookup: databaseLookup } : {}),
};

// In-flight connection attempt. Serverless instances (Vercel) keep module scope
// warm between invocations, so concurrent cold-start requests share one attempt
// and later requests reuse the open connection instead of reconnecting.
let connectionPromise = null;

const connectDB = () => {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose.connection);
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  if (!process.env.MONGODB_URI) {
    return Promise.reject(new Error('MONGODB_URI is not configured'));
  }

  connectionPromise = mongoose
    .connect(process.env.MONGODB_URI, CONNECTION_OPTIONS)
    .then(() => {
      console.log('Connected to MongoDB database!');
      return mongoose.connection;
    })
    .finally(() => {
      connectionPromise = null;
    });

  return connectionPromise;
};

// Express middleware: make sure the database is reachable before a route runs.
const requireDatabase = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error(`❌ Database unavailable for ${req.method} ${req.originalUrl}:`, err.message);
    res.status(503).json({
      success: false,
      message: 'Database service temporarily unavailable. Please try again shortly.',
      error: 'DATABASE_CONNECTION_ERROR',
      retryAfter: 5, // seconds
    });
  }
};

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

const getDatabaseStatus = () => DB_STATES[mongoose.connection.readyState] || 'unknown';

module.exports = { connectDB, requireDatabase, getDatabaseStatus };
