/**
 * Authentication Middleware
 * Improved JWT handling, ownership checks, and token utilities.
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  logger.warn('JWT_SECRET is not set. Authentication will fail without a valid secret.');
}

function getTokenFromRequest(req) {
  // Authorization: Bearer <token>
  const authHeader = req.headers?.authorization;
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  // Common alternate locations
  if (req.cookies?.token) return req.cookies.token;
  if (req.headers['x-access-token']) return req.headers['x-access-token'];
  if (req.query?.token) return req.query.token;

  return null;
}

async function protect(req, res, next) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    if (!JWT_SECRET) {
      logger.error('protect middleware invoked without JWT_SECRET configured');
      return res.status(500).json({ success: false, message: 'Server authentication misconfiguration' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      // Hide internal error details from clients to avoid information leakage
      logger.debug('Token verification error', { message: err.message, name: err.name });
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    if (!decoded?.id) {
      logger.debug('Token decoded but missing id', { decoded });
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const user = await User.findById(decoded.id).select('-password').lean().exec();
    if (!user) {
      logger.info('Token valid but user not found', { userId: decoded.id });
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    req.user = user;
    req.auth = { token, decoded };
    return next();
  } catch (err) {
    logger.error('Unexpected error in protect middleware', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function optionalAuth(req, res, next) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return next();

    if (!JWT_SECRET) {
      logger.warn('optionalAuth: JWT_SECRET not configured');
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded?.id) {
        const user = await User.findById(decoded.id).select('-password').lean().exec();
        if (user) {
          req.user = user;
          req.auth = { token, decoded };
        }
      }
    } catch (err) {
      logger.debug('optionalAuth - token invalid or expired', { message: err.message });
      // intentionally swallow: optional auth should not block the request
    }

    return next();
  } catch (err) {
    logger.error('Unexpected error in optionalAuth', err);
    return next();
  }
}

/**
 * Verify resource ownership.
 * Accepts:
 *  - a string path (dot notation) to a field in `req`, e.g. 'params.userId' or 'body.ownerId'
 *  - a function `(req) => ownerId`
 *  - a raw id to compare directly
 */
export function verifyOwnership(resourceSelector) {
  const getByPath = (obj, path) => {
    if (!path) return undefined;
    return String(path).split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
  };

  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized' });
      }

      let ownerId;
      if (typeof resourceSelector === 'function') {
        ownerId = resourceSelector(req);
      } else if (typeof resourceSelector === 'string') {
        ownerId = getByPath(req, resourceSelector);
      } else {
        ownerId = resourceSelector;
      }

      if (!ownerId) {
        // If no ownerId could be determined, deny to be safe
        return res.status(403).json({ success: false, message: 'Not authorized to perform this action' });
      }

      const userId = String(req.user._id ?? req.user.id ?? req.user).toString();
      if (userId !== String(ownerId).toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to perform this action' });
      }

      return next();
    } catch (err) {
      logger.error('Error in verifyOwnership middleware', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  };
}

/**
 * Returns true if `ownerId` matches the authenticated user on `req`.
 * Accepts ownerId of any type (ObjectId, string).
 */
export function isOwner(req, ownerId) {
  try {
    if (!req?.user || !ownerId) return false;
    const userId = String(req.user._id ?? req.user.id ?? req.user).toString();
    return userId === String(ownerId).toString();
  } catch (err) {
    logger.debug('isOwner comparison failed', { err: err.message });
    return false;
  }
}

/**
 * Generate JWT token for a user id.
 * - `extraPayload` merges additional small claims (avoid large objects).
 * - `options` can override `expiresIn`.
 */
export function generateToken(userId, { extraPayload = {}, options = {} } = {}) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }
  const payload = { id: String(userId), ...extraPayload };
  const signOptions = { expiresIn: options.expiresIn || JWT_EXPIRES_IN };
  return jwt.sign(payload, JWT_SECRET, signOptions);
}

export default {
  protect,
  optionalAuth,
  verifyOwnership,
  isOwner,
  generateToken
};