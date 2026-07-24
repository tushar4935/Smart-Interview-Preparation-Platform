const rateLimit = require('express-rate-limit');

// don't throttle inside the test suite - it fires lots of requests fast
const skip = () => process.env.NODE_ENV === 'test';

// generous global cap - just there to stop obvious abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  message: { success: false, message: 'Too many requests, please slow down.' },
});

// auth is a common brute-force target, keep it tighter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  message: { success: false, message: 'Too many attempts, try again in a bit.' },
});

// the AI routes hit the free Gemini quota, so guard them hardest
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  message: { success: false, message: 'AI is busy - wait a moment before trying again.' },
});

module.exports = { apiLimiter, authLimiter, aiLimiter };
