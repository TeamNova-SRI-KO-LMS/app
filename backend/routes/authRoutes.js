const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const {
  validateUserRegistration,
  validateUserLogin,
  handleValidationErrors,
} = require('../middleware/validation');

const router = express.Router();
const OTP_EXPIRY_MINUTES = 10;

const mailTransporter = () => {
  const requiredSettings = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  const missingSetting = requiredSettings.find(setting => !process.env[setting]);
  if (missingSetting) {
    throw new Error(`Email service is not configured: missing ${missingSetting}`);
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const hashOtp = otp =>
  crypto.createHash('sha256').update(otp).digest('hex');

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
      const { email, password, portal } = req.body;

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

      // Role & portal access enforcement
      if (portal === 'user' && user.role === 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin accounts cannot log in through the user login. Please use the Admin Access Portal.',
        });
      }

      if (portal === 'admin' && user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only administrator accounts can log in through the Admin Access Portal.',
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

// Request a one-time password reset code.
router.post('/forgot-password', async (req, res) => {
  const email = typeof req.body.email === 'string'
    ? req.body.email.trim().toLowerCase()
    : '';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address',
    });
  }

  try {
    const user = await User.findOne({ email });

    // Keep this response identical for existing and unknown addresses.
    if (!user || !user.isActive) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists for this email, a verification code has been sent',
      });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    user.resetPasswordToken = hashOtp(otp);
    user.resetPasswordExpire = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await user.save();

    try {
      await mailTransporter().sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: 'SRI-KO password reset verification code',
        text: `Your SRI-KO password reset code is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
        html: `<p>Your SRI-KO password reset code is <strong>${otp}</strong>.</p><p>This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>`,
      });
    } catch (mailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      console.error('Password reset email could not be sent:', mailError.message);
      return res.status(503).json({
        success: false,
        message: 'Unable to send the verification email. Please try again later.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'If an account exists for this email, a verification code has been sent',
    });
  } catch (error) {
    console.error('Password reset request failed:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while requesting a password reset',
    });
  }
});

// Verify a password reset code and issue a short-lived reset credential.
router.post('/verify-reset-otp', async (req, res) => {
  const email = typeof req.body.email === 'string'
    ? req.body.email.trim().toLowerCase()
    : '';
  const otp = typeof req.body.otp === 'string' ? req.body.otp.trim() : '';

  if (!email || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({
      success: false,
      message: 'A valid email address and six-digit verification code are required',
    });
  }

  try {
    const user = await User.findOne({ email }).select('+resetPasswordToken');
    const isValid = user
      && user.isActive
      && user.resetPasswordToken
      && user.resetPasswordExpire
      && user.resetPasswordExpire > new Date()
      && crypto.timingSafeEqual(
        Buffer.from(user.resetPasswordToken, 'hex'),
        Buffer.from(hashOtp(otp), 'hex'),
      );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code',
      });
    }

    const resetToken = jwt.sign(
      { id: user._id.toString(), purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' },
    );

    return res.status(200).json({
      success: true,
      message: 'Verification code accepted',
      resetToken,
    });
  } catch (error) {
    console.error('Password reset verification failed:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while verifying the password reset code',
    });
  }
});

// Set a new password using a credential issued by verify-reset-otp.
router.post('/reset-password', async (req, res) => {
  const { resetToken, password } = req.body;

  if (typeof resetToken !== 'string' || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'A reset token and a password of at least six characters are required',
    });
  }

  try {
    const payload = jwt.verify(resetToken, process.env.JWT_SECRET);
    if (payload.purpose !== 'password-reset') {
      return res.status(401).json({
        success: false,
        message: 'Invalid password reset token',
      });
    }

    const user = await User.findById(payload.id).select('+resetPasswordToken');
    if (!user || !user.isActive || !user.resetPasswordToken || !user.resetPasswordExpire || user.resetPasswordExpire <= new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Password reset token is invalid or expired',
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Password reset token is invalid or expired',
      });
    }

    console.error('Password reset failed:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while resetting the password',
    });
  }
});

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

    // Disallow admin login via Google / user login
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin accounts cannot log in through the user login. Please use the Admin Access Portal.' });
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

const { protect } = require('../middleware/auth');

// GET /api/auth/me - Get current logged-in user
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        phone: user.phone,
        location: user.location,
        enrolledCourses: user.enrolledCourses,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});


module.exports = router;