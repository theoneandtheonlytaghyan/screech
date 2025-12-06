/**
 * Search Routes
 * Handles search endpoints
 */

import express from 'express';
import {
  searchAll,
  searchPosts,
  searchUsers,
  getTrending,
  getHashtagPosts,
  searchHashtagsRoute,
  getSearchSuggestions
} from '../controllers/searchController.js';
import { optionalAuth } from '../middleware/auth.js';
import { searchLimiter } from '../middleware/rateLimiter.js';
import {
  validateSearch,
  validateHashtag,
  validatePagination
} from '../middleware/validator.js';

const router = express.Router();

/**
 * @route   GET /api/search
 * @desc    Search all (posts, users, hashtags)
 * @access  Public
 */
router.get('/', searchLimiter, optionalAuth, validateSearch, searchAll);

/**
 * @route   GET /api/search/posts
 * @desc    Search posts
 * @access  Public
 */
router.get('/posts', searchLimiter, optionalAuth, validatePagination, searchPosts);

/**
 * @route   GET /api/search/users
 * @desc    Search users
 * @access  Public
 */
router.get('/users', searchLimiter, validatePagination, searchUsers);

/**
 * @route   GET /api/search/trending
 * @desc    Get trending hashtags
 * @access  Public
 */
router.get('/trending', getTrending);

/**
 * @route   GET /api/search/hashtags
 * @desc    Search hashtags (autocomplete)
 * @access  Public
 */
router.get('/hashtags', searchLimiter, searchHashtagsRoute);

/**
 * @route   GET /api/search/suggestions
 * @desc    Get search suggestions
 * @access  Public
 */
router.get('/suggestions', searchLimiter, getSearchSuggestions);

/**
 * @route   GET /api/search/hashtag/:hashtag
 * @desc    Get posts by hashtag
 * @access  Public
 */
router.get('/hashtag/:hashtag', optionalAuth, validateHashtag, validatePagination, getHashtagPosts);

export default router;