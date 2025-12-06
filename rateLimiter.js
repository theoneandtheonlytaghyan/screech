/**
 * Rate Limiter Middleware
 * Configurable rate limiters with robust keying and logging.
 *
 * Notes:
 * - For horizontal scale, install and configure a Redis-backed store
 *   such as `rate-limit-redis` + `ioredis` and pass it to createLimiter as `store`.
 */

import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger.js';

const parseIntEnv = (name, fallback) => {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

const parseMsEnv = (name, fallback) => {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

// Defaults
const DEFAULTS = {
  API_WINDOW_MS: parseMsEnv('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000), // 15m
  API_MAX_REQ: parseIntEnv('RATE_LIMIT_MAX_REQUESTS', 100),
  AUTH_WINDOW_MS: parseMsEnv('RATE_LIMIT_AUTH_WINDOW_MS', 60 * 60 * 1000), // 1h
  AUTH_MAX_REQ: parseIntEnv('RATE_LIMIT_AUTH_MAX_REQUESTS', 10),
  POST_WINDOW_MS: parseMsEnv('RATE_LIMIT_POST_WINDOW_MS', 60 * 60 * 1000),
  POST_MAX_REQ: parseIntEnv('RATE_LIMIT_POST_MAX_REQUESTS', 30),
  COMMENT_WINDOW_MS: parseMsEnv('RATE_LIMIT_COMMENT_WINDOW_MS', 60 * 60 * 1000),
  COMMENT_MAX_REQ: parseIntEnv('RATE_LIMIT_COMMENT_MAX_REQUESTS', 60),
  MESSAGE_WINDOW_MS: parseMsEnv('RATE_LIMIT_MESSAGE_WINDOW_MS', 60 * 1000),
  MESSAGE_MAX_REQ: parseIntEnv('RATE_LIMIT_MESSAGE_MAX_REQUESTS', 20),
  SEARCH_WINDOW_MS: parseMsEnv('RATE_LIMIT_SEARCH_WINDOW_MS', 60 * 1000),
  SEARCH_MAX_REQ: parseIntEnv('RATE_LIMIT_SEARCH_MAX_REQUESTS', 30),
  IDENTITY_WINDOW_MS: parseMsEnv('RATE_LIMIT_IDENTITY_WINDOW_MS', 24 * 60 * 60 * 1000),
  IDENTITY_MAX_REQ: parseIntEnv('RATE_LIMIT_IDENTITY_MAX_REQUESTS', 3)
};

// Request key identification:
// prefer authenticated user id, else X-Forwarded-For (if present), else req.ip
const requestKey = (req) => {
  try {
    if (req.user && (req.user._id || req.user.id)) {
      return String(req.user._id ?? req.user.id);
    }
    // If behind proxy, X-Forwarded-For may contain a comma separated list
    const xff = req.headers['x-forwarded-for'] || req.headers['X-Forwarded-For'];
    if (xff && typeof xff === 'string') {
      return xff.split(',')[0].trim();
    }
    return req.ip || req.connection?.remoteAddress || 'unknown';
  } catch (err) {
    logger.debug('requestKey resolution failed', { err: err.message });
    return req.ip || 'unknown';
  }
};

// Default handler to send consistent JSON + Retry-After header
const defaultHandler = (req, res, next, options) => {
  try {
    const retryAfter = options?.windowMs ? Math.ceil(options.windowMs / 1000) : undefined;
    if (retryAfter) res.setHeader('Retry-After', String(retryAfter));
    logger.warn('Rate limit exceeded', {
      path: req.originalUrl,
      method: req.method,
      ip: req.ip,
      key: requestKey(req),
      limiter: options?.name || 'unknown'
    });
    return res.status(options.statusCode || 429).json({
      success: false,
      message: (options && options.message) ? options.message : 'Too many requests, please try again later.'
    });
  } catch (err) {
    // If logging/headers fail, fallback to minimal response
    return res.status(429).json({ success: false, message: 'Too many requests' });
  }
};

// Factory to create a limiter; optionally accept a `store` (e.g., Redis store instance)
export const createLimiter = (opts = {}) => {
  const {
    windowMs,
    max,
    message,
    name,
    skipSuccessfulRequests = false,
    keyGenerator = requestKey,
    standardHeaders = true,
    legacyHeaders = false,
    store = undefined
  } = opts;

  const limiterOptions = {
    windowMs,
    max,
    message: message || { success: false, message: 'Too many requests, please try again later.' },
    standardHeaders,
    legacyHeaders,
    skipSuccessfulRequests,
    keyGenerator,
    handler: (req, res, next, options) => defaultHandler(req, res, next, { ...options, name }),
    store
  };

  return rateLimit(limiterOptions);
};

// Preconfigured limiters
export const apiLimiter = createLimiter({
  windowMs: DEFAULTS.API_WINDOW_MS,
  max: DEFAULTS.API_MAX_REQ,
  name: 'apiLimiter',
  standardHeaders: true,
  legacyHeaders: false
});

export const authLimiter = createLimiter({
  windowMs: DEFAULTS.AUTH_WINDOW_MS,
  max: DEFAULTS.AUTH_MAX_REQ,
  name: 'authLimiter',
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many authentication attempts, please try again after an hour.' }
});

export const postLimiter = createLimiter({
  windowMs: DEFAULTS.POST_WINDOW_MS,
  max: DEFAULTS.POST_MAX_REQ,
  name: 'postLimiter',
  keyGenerator: (req) => requestKey(req),
  message: { success: false, message: 'Too many posts created, please try again later.' }
});

export const commentLimiter = createLimiter({
  windowMs: DEFAULTS.COMMENT_WINDOW_MS,
  max: DEFAULTS.COMMENT_MAX_REQ,
  name: 'commentLimiter',
  keyGenerator: (req) => requestKey(req),
  message: { success: false, message: 'Too many comments, please try again later.' }
});

export const messageLimiter = createLimiter({
  windowMs: DEFAULTS.MESSAGE_WINDOW_MS,
  max: DEFAULTS.MESSAGE_MAX_REQ,
  name: 'messageLimiter',
  keyGenerator: (req) => requestKey(req),
  message: { success: false, message: 'Too many messages, please slow down.' }
});

export const searchLimiter = createLimiter({
  windowMs: DEFAULTS.SEARCH_WINDOW_MS,
  max: DEFAULTS.SEARCH_MAX_REQ,
  name: 'searchLimiter',
  message: { success: false, message: 'Too many search requests, please try again later.' }
});

export const identityLimiter = createLimiter({
  windowMs: DEFAULTS.IDENTITY_WINDOW_MS,
  max: DEFAULTS.IDENTITY_MAX_REQ,
  name: 'identityLimiter',
  keyGenerator: (req) => requestKey(req),
  message: { success: false, message: 'You can only regenerate your identity a few times per day.' }
});

export default {
  createLimiter,
  apiLimiter,
  authLimiter,
  postLimiter,
  commentLimiter,
  messageLimiter,
  searchLimiter,
  identityLimiter
};