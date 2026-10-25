const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper: Check if user is enrolled in course or is instructor/admin
exports.hasCourseAccess = async (user, course) => {
  if (!user || !course) return false;

  // Admin always has access
  if (user.role === 'admin') return true;

  // Instructor of the course has access
  const instructorId = course.instructor?._id || course.instructor;
  if (instructorId && instructorId.toString() === user._id.toString()) {
    return true;
  }

  const userIdStr = user._id.toString();
  const courseIdStr = (course._id || course).toString();

  // Check enrolledStudents array on the course
  if (Array.isArray(course.enrolledStudents)) {
    const isEnrolled = course.enrolledStudents.some(
      s => (s?._id || s).toString() === userIdStr
    );
    if (isEnrolled) return true;
  }

  // Check enrolledCourses array on the user
  if (Array.isArray(user.enrolledCourses)) {
    const hasCourse = user.enrolledCourses.some(
      c => (c?._id || c).toString() === courseIdStr
    );
    if (hasCourse) return true;
  }

  // Check if progress document exists for this student and course
  try {
    const Progress = require('../models/Progress');
    const hasProgress = await Progress.exists({
      student: user._id,
      course: course._id || course,
    });
    if (hasProgress) return true;
  } catch (err) {
    console.warn('[hasCourseAccess] Progress check warning:', err.message);
  }

  return false;
};

// Check if user is enrolled in course or is instructor/admin
exports.checkCourseAccess = async (req, res, next) => {
  try {
    const Course = require('../models/Course');
    const Progress = require('../models/Progress');

    const courseId = req.params.id || req.params.courseId;
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to access this course',
      });
    }

    const hasAccess = await exports.hasCourseAccess(req.user, course);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this course',
      });
    }

    const progress = await Progress.findOne({
      student: req.user._id,
      course: course._id,
    });

    req.course = course;
    if (progress) req.progress = progress;
    next();
  } catch (error) {
    console.error('[checkCourseAccess] Error:', error);
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

