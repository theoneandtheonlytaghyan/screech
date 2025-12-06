/**
 * Post Routes
 * Handles post (hoot) endpoints
 */

import express from 'express';
import {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  getUserPosts
} from '../controllers/postController.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { postLimiter } from '../middleware/rateLimiter.js';
import {
  validateCreatePost,
  validateUpdatePost,
  validatePostId,
  validatePagination
} from '../middleware/validator.js';

const router = express.Router();

/**
 * @route   POST /api/posts
 * @desc    Create new post
 * @access  Private
 */
router.post('/', protect, postLimiter, validateCreatePost, createPost);

/**
 * @route   GET /api/posts
 * @desc    Get all posts (feed)
 * @access  Public
 */
router.get('/', optionalAuth, validatePagination, getPosts);

/**
 * @route   GET /api/posts/:id
 * @desc    Get single post
 * @access  Public
 */
router.get('/:id', optionalAuth, validatePostId, getPost);

/**
 * @route   PUT /api/posts/:id
 * @desc    Update post
 * @access  Private
 */
router.put('/:id', protect, validateUpdatePost, updatePost);

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete post
 * @access  Private
 */
router.delete('/:id', protect, validatePostId, deletePost);

/**
 * @route   POST /api/posts/:id/like
 * @desc    Like post
 * @access  Private
 */
router.post('/:id/like', protect, validatePostId, likePost);

/**
 * @route   DELETE /api/posts/:id/like
 * @desc    Unlike post
 * @access  Private
 */
router.delete('/:id/like', protect, validatePostId, unlikePost);

/**
 * @route   GET /api/posts/user/:id
 * @desc    Get user posts
 * @access  Public
 */
router.get('/user/:id', optionalAuth, validatePagination, getUserPosts);

export default router;