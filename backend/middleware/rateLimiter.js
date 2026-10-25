const { rateLimit } = require('express-rate-limit');

/**
 * Global rate limiter: applied to all incoming API requests.
 * Protects against basic denial-of-service (DoS) and excessive API traffic.
 * Default: 500 requests per 15 minutes per IP.
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: process.env.RATE_LIMIT_GLOBAL_MAX
    ? parseInt(process.env.RATE_LIMIT_GLOBAL_MAX, 10)
    : 500,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  skip: (req) => req.path === '/' || req.path === '/api/health',
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

/**
 * Stricter rate limiter for sensitive authentication endpoints:
 * (/login, /register, /forgot-password, /verify-reset-otp)
 * Prevents brute-force attacks, credential stuffing, and OTP flooding.
 * Default: 10 attempts per 15 minutes per IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: process.env.RATE_LIMIT_AUTH_MAX
    ? parseInt(process.env.RATE_LIMIT_AUTH_MAX, 10)
    : 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
  },
});

module.exports = {
  globalLimiter,
  authLimiter,
};
