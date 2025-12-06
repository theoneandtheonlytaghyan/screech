/**
 * User Routes
 * Handles user profile and identity endpoints
 */

import express from 'express';
import {
  getUserProfile,
  getUserStats,
  regenerateUserIdentity,
  getMyProfile,
  updateOnlineStatus,
  getUserPosts,
  searchUsers,
  getLeaderboard
} from '../controllers/userController.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { identityLimiter } from '../middleware/rateLimiter.js';
import {
  validateUserId,
  validateUpdateProfile,
  validatePagination
} from '../middleware/validator.js';

const router = express.Router();

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', protect, getMyProfile);

/**
 * @route   GET /api/users/leaderboard
 * @desc    Get user leaderboard
 * @access  Public
 */
router.get('/leaderboard', getLeaderboard);

/**
 * @route   GET /api/users/search
 * @desc    Search users
 * @access  Public
 */
router.get('/search', validatePagination, searchUsers);

/**
 * @route   POST /api/users/regenerate-identity
 * @desc    Regenerate user identity
 * @access  Private
 */
router.post(
  '/regenerate-identity',
  protect,
  identityLimiter,
  validateUpdateProfile,
  regenerateUserIdentity
);

/**
 * @route   PUT /api/users/online-status
 * @desc    Update online status
 * @access  Private
 */
router.put('/online-status', protect, updateOnlineStatus);

/**
 * @route   GET /api/users/:id
 * @desc    Get user profile
 * @access  Public
 */
router.get('/:id', validateUserId, getUserProfile);

/**
 * @route   GET /api/users/:id/stats
 * @desc    Get user stats
 * @access  Public
 */
router.get('/:id/stats', validateUserId, getUserStats);

/**
 * @route   GET /api/users/:id/posts
 * @desc    Get user's posts
 * @access  Public
 */
router.get('/:id/posts', optionalAuth, validateUserId, validatePagination, getUserPosts);

export default router;