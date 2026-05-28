const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - Verify token and add user to request
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }

  try {
    // Debug logging
    console.log('JWT_SECRET available:', !!process.env.JWT_SECRET);
    console.log('JWT_SECRET value:', process.env.JWT_SECRET);
    console.log(`Token received: ${token.substring(0, 20)}...`);

    // Verify token using the same fallback as token generation
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, jwtSecret);
    console.log('Token decoded successfully:', decoded);

    // Get user from payload
    req.user = await User.findById(decoded.id);
    console.log('User found:', !!req.user);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid',
      });
    }

    if (!req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token is not valid',
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};
