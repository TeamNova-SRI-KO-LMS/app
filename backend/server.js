const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // or load config.env path

const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

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

app.use('/api/courses', checkDatabase, courseRoutes);

app.use('/api/subscriptions', checkDatabase, subscriptionRoutes);
app.use('/api/payments', paymentRoutes);