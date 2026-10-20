const { body, validationResult } = require('express-validator');

// Custom validation middleware
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// Registration rules
exports.validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  // Public sign-up cannot create administrators; admins are created by an
  // existing admin through User Management (POST /api/users).
  body('role')
    .optional()
    .isIn(['student', 'instructor'])
    .withMessage('Role must be student or instructor'),
];

// Login rules
exports.validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password').notEmpty().withMessage('Password is required'),
];

exports.validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot be more than 500 characters'),

  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^(?:\d{10}|\+94\d{9})$/)
    .withMessage('Phone number must be 10 digits or use the +94 format followed by 9 digits'),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot be more than 100 characters'),

  body('website')
    .optional({ values: 'falsy' })
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .isLength({ max: 200 })
    .withMessage('Website must be a valid http:// or https:// URL no longer than 200 characters'),

  body('socialLinks.linkedin')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^https?:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9][A-Za-z0-9-_%]*\/?$/i)
    .isLength({ max: 200 })
    .withMessage('LinkedIn must be a valid https://linkedin.com/in/... URL no longer than 200 characters'),

  body('socialLinks.twitter')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Twitter URL cannot be more than 200 characters'),

  body('socialLinks.github')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('GitHub URL cannot be more than 200 characters'),

  body('avatar')
    .optional()
    .trim()
    .isLength({ max: 10 * 1024 * 1024 })
    .withMessage('Avatar cannot exceed 10MB'),
];

// Review validation rules
exports.validateReview = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment cannot be more than 500 characters'),
];

// Course validation rules
exports.validateCourseCreation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Course title must be between 3 and 100 characters'),

  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),

  body('category')
    .optional()
    .isIn([
      'Literature',
      'Business',
      'Language',
      'Culture',
      'Grammar',
      'Conversation',
      'Other',
    ])
    .withMessage('Invalid category'),

  body('level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid level'),

  body('duration')
    .optional()
    .isInt({ min: 1, max: 52 })
    .withMessage('Duration must be between 1 and 52 weeks'),

  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
];
