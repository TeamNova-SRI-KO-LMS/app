const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  validateUserRegistration,
  validateUserLogin,
  handleValidationErrors,
} = require('../middleware/validation');

const router = express.Router();

// Generate JWT Token
const generateToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

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