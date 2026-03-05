import { rateLimit } from 'express-rate-limit';

// ─── Auth Rate Limiter ───────────────────────────────────────────────────────
// Strict limiter for login/signup/forgot-password to prevent brute force.
// 10 attempts per 15 minutes per IP.

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again in 15 minutes.'
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  validate: { xForwardedForHeader: false }
});

// ─── API Rate Limiter ────────────────────────────────────────────────────────
// Per-user rate limiter for API endpoints. 200 requests per 15 minutes.

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 200 : 50000,
  message: {
    success: false,
    error: 'Too many requests. Please slow down.'
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  skip: (req) => req.path === '/health'
});

// ─── Upload Rate Limiter ─────────────────────────────────────────────────────
// Strict limiter for file uploads. 20 uploads per 15 minutes.

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: 'Too many uploads. Please try again later.'
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }
});