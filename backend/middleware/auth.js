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
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }

  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'JWT_SECRET is not configured',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

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
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

