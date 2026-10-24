const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Check if user is enrolled in course or is instructor/admin
exports.checkCourseAccess = async (req, res, next) => {
  try {
    const Course = require('../models/Course');
    const Progress = require('../models/Progress');

    const course = await Course.findById(req.params.id || req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Admin and instructors have access
    if (
      req.user.role === 'admin' ||
      course.instructor.toString() === req.user._id.toString()
    ) {
      req.course = course;
      return next();
    }

    // Check if student is enrolled
    if (req.user.role === 'student') {
      const progress = await Progress.findOne({
        student: req.user._id,
        course: course._id,
      });

      if (!progress) {
        return res.status(403).json({
          success: false,
          message: 'You are not enrolled in this course',
        });
      }

      req.progress = progress;
    }

    req.course = course;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Protect routes - Verify token and add user to request
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    console.warn(`[auth.protect] No token provided in authorization header for ${req.method} ${req.originalUrl}`);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }

  try {
    if (!process.env.JWT_SECRET) {
      console.error('[auth.protect] JWT_SECRET is not configured');
      return res.status(500).json({
        success: false,
        message: 'JWT_SECRET is not configured',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      console.warn(`[auth.protect] User not found for id ${decoded.id}`);
      return res.status(401).json({
        success: false,
        message: 'Token is not valid',
      });
    }

    if (!req.user.isActive) {
      console.warn(`[auth.protect] User ${req.user._id} is deactivated`);
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    next();
  } catch (error) {
    console.warn(`[auth.protect] Token verification failed for ${req.method} ${req.originalUrl}:`, error.message);
    return res.status(401).json({
      success: false,
      message: error.message || 'Token is not valid',
    });
  }
};

// Attach req.user when a valid token is sent, but let visitors without one through.
// Used by routes that also serve guests (the chatbot); it never responds with 401,
// so an expired token simply continues as a guest instead of logging the user out.
exports.optionalAuth = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer') || !process.env.JWT_SECRET) {
    return next();
  }

  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user && user.isActive) {
      req.user = user;
    }
  } catch {
    // Invalid or expired token: continue as a guest
  }

  next();
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

