const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const {
  validateUserRegistration,
  validateUserLogin,
  handleValidationErrors,
} = require('../middleware/validation');

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register user
router.post(
  '/register',
  validateUserRegistration,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, email, password, role } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists',
        });
      }

      const user = await User.create({
        name,
        email,
        password,
        role: role || 'student',
      });

      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error during registration',
      });
    }
  },
);

// Login user
router.post(
  '/login',
  validateUserLogin,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).select('+password');
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      const token = generateToken(user._id);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error during login',
      });
    }
  },
);

module.exports = router;

// POST /api/auth/google - verify Google ID token and login existing users (no auto-register)
router.post('/google', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ success: false, message: 'idToken required' });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Find user by googleId or email. Do NOT auto-register new users here.
    let user = await User.findOne({ googleId }) || await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'No account found. Please register first.' });
    }

    // Disallow admin login via Google if needed
    if (user.role && user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Google login not allowed for this account type' });
    }

    // Optionally save googleId for future logins
    if (!user.googleId) {
      user.googleId = googleId;
      user.avatar = user.avatar || picture;
      await user.save();
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful via Google',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid Google ID token' });
  }
});