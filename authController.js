/**
 * Auth Controller
 * Robust authentication flows: register, login, logout, profile, password change, delete account.
 */

import crypto from 'crypto';
import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';
import { generateIdentity } from '../services/identityGenerator.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const USERNAME_SUFFIX_ATTEMPTS = 6;
const CREATE_USER_ATTEMPTS = 8;
const SUFFIX_MIN = 1000;
const SUFFIX_MAX = 9999;

function randomSuffix() {
  // secure random 4-digit numeric suffix
  const n = crypto.randomInt(SUFFIX_MIN, SUFFIX_MAX + 1);
  return String(n);
}

/**
 * Register new user
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req, res, next) => {
  const { email: rawEmail, password } = req.body || {};

  if (!rawEmail || !password) {
    return next(new AppError('Email and password are required', 400));
  }

  const email = String(rawEmail).trim().toLowerCase();

  // Quick existence check for email to give helpful feedback, but still handle races below
  const emailExists = await User.findOne({ email }).lean().exec();
  if (emailExists) {
    return next(new AppError('Email already registered', 400));
  }

  // Try to create user in a loop to be resilient against username/email race conditions
  let lastErr = null;
  for (let attempt = 0; attempt < CREATE_USER_ATTEMPTS; attempt++) {
    const identity = generateIdentity();
    const base = identity.username;
    let username = base;

    // If not first create attempt, append suffix to reduce chance of collision
    if (attempt > 0) {
      username = `${base}-${randomSuffix()}`;
    }

    try {
      const user = await User.create({
        email,
        password,
        username,
        avatarColor: identity.avatarColor,
        clan: identity.clan
      });

      // Created successfully
      let token;
      try {
        token = generateToken(user._id);
      } catch (tErr) {
        logger.error('Token generation failed after registration', tErr);
        // Still return created user but warn client that token failed
        return res.status(201).json({
          success: true,
          message: 'Registration successful (token error)',
          data: { user: user.toPublicProfile() }
        });
      }

      logger.info('New user registered', { user: user.username, userId: user._id });
      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: user.toPublicProfile(),
          token
        }
      });
    } catch (err) {
      lastErr = err;
      // Duplicate key error: determine field. If email conflict, bail out with friendly message.
      if (err && err.code === 11000) {
        const key = err.keyValue && Object.keys(err.keyValue)[0];
        if (key === 'email') {
          logger.info('Registration attempted with existing email (race)', { email });
          return next(new AppError('Email already registered', 400));
        }
        // else username collision -> retry
        logger.debug('Username collision during registration, retrying', { attempt, err });
        // continue next attempt
      } else {
        // Unexpected error - rethrow (will be caught by asyncHandler)
        logger.error('Unexpected error during registration', err);
        throw err;
      }
    }
  }

  // If we exit loop without successful create
  logger.error('Failed to create user after retries', lastErr);
  return next(new AppError('Unable to register at this time, please try again', 500));
});

/**
 * Login user
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res, next) => {
  const { email: rawEmail, password } = req.body || {};

  if (!rawEmail || !password) {
    return next(new AppError('Email and password are required', 400));
  }

  const email = String(rawEmail).trim().toLowerCase();

  // Find user and include password for comparison
  const userWithPassword = await User.findOne({ email }).select('+password');

  // Generic message to avoid account enumeration
  const invalidMsg = 'Invalid email or password';

  if (!userWithPassword) {
    logger.info('Login failed - user not found', { email, ip: req.ip });
    return next(new AppError(invalidMsg, 401));
  }

  const isMatch = await userWithPassword.comparePassword(password);
  if (!isMatch) {
    logger.info('Login failed - bad credentials', { userId: userWithPassword._id, ip: req.ip });
    return next(new AppError(invalidMsg, 401));
  }

  // Mark online and lastSeen on the document and save
  try {
    userWithPassword.isOnline = true;
    userWithPassword.lastSeen = new Date();
    await userWithPassword.save();
  } catch (e) {
    logger.warn('Failed to update online status after login', { err: e, userId: userWithPassword._id });
  }

  let token;
  try {
    token = generateToken(userWithPassword._id);
  } catch (err) {
    logger.error('Token generation failed on login', err);
    return next(new AppError('Login succeeded but failed to generate token', 500));
  }

  logger.info('User logged in', { user: userWithPassword.username, userId: userWithPassword._id });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: userWithPassword.toPublicProfile(),
      token
    }
  });
});

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Not authenticated', 401));
  }

  // Make sure we operate on a Mongoose document
  const user = await User.findById(req.user._id).select('+password');
  if (!user) return next(new AppError('User not found', 404));

  try {
    user.isOnline = false;
    user.lastSeen = new Date();
    await user.save();
  } catch (err) {
    logger.warn('Failed to update online status during logout', { err, userId: user._id });
  }

  logger.info('User logged out', { user: user.username, userId: user._id });

  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

/**
 * Get current user
 * GET /api/auth/me
 */
export const getMe = asyncHandler(async (req, res, next) => {
  if (!req.user) return next(new AppError('Not authenticated', 401));

  const user = await User.findById(req.user._id);
  if (!user) return next(new AppError('User not found', 404));

  res.status(200).json({
    success: true,
    data: {
      user: user.toPublicProfile()
    }
  });
});

/**
 * Change password
 * PUT /api/auth/password
 */
export const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return next(new AppError('Current and new password are required', 400));
  }

  if (!req.user) return next(new AppError('Not authenticated', 401));

  const user = await User.findById(req.user._id).select('+password');
  if (!user) return next(new AppError('User not found', 404));

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) return next(new AppError('Current password is incorrect', 401));

  user.password = newPassword;
  await user.save();

  let token;
  try {
    token = generateToken(user._id);
  } catch (err) {
    logger.error('Token generation failed after password change', err);
    return next(new AppError('Password changed but failed to generate token', 500));
  }

  logger.info('Password changed', { userId: user._id });

  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
    data: { token }
  });
});

/**
 * Delete account
 * DELETE /api/auth/account
 */
export const deleteAccount = asyncHandler(async (req, res, next) => {
  const { password } = req.body || {};

  if (!password) {
    return next(new AppError('Password is required to delete account', 400));
  }

  if (!req.user) return next(new AppError('Not authenticated', 401));

  const user = await User.findById(req.user._id).select('+password');
  if (!user) return next(new AppError('User not found', 404));

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return next(new AppError('Password is incorrect', 401));

  try {
    await User.findByIdAndDelete(user._id);
    logger.info('Account deleted', { user: user.username, userId: user._id });
    return res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    logger.error('Failed to delete account', { err, userId: user._id });
    throw err;
  }
});

export default {
  register,
  login,
  logout,
  getMe,
  changePassword,
  deleteAccount
};