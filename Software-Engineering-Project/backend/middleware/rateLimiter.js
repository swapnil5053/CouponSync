// Rate Limiting Middleware for API Protection
import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts, please try again after 15 minutes.',
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * EPIC 4: Story 4 - Redemption rate limiter for fraud prevention
 */
export const redemptionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 redemption attempts per minute
  message: 'Too many redemption attempts, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    // Log potential fraud attempt
    console.warn(`Rate limit exceeded for redemption: IP ${req.ip}`);
    res.status(429).json({
      message: 'Too many redemption attempts detected. Please try again later.',
      retry_after: 60
    });
  }
});

/**
 * Registration rate limiter
 */
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour from same IP
  message: 'Too many accounts created from this IP, please try again later.',
});

/**
 * Coupon generation rate limiter
 */
export const generationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 generation requests per minute
  message: 'Too many coupon generation requests, please wait.',
});

export default {
  apiLimiter,
  authLimiter,
  redemptionLimiter,
  registrationLimiter,
  generationLimiter
};
