/**
 * Comment Routes
 * Handles comment endpoints
 */

import express from 'express';
import {
  createComment,
  getPostComments,
  getCommentReplies,
  getComment,
  updateComment,
  deleteComment,
  likeComment,
  unlikeComment
} from '../controllers/commentController.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { commentLimiter } from '../middleware/rateLimiter.js';
import {
  validateCreateComment,
  validateCommentId,
  validatePagination
} from '../middleware/validator.js';

const router = express.Router();

/**
 * @route   POST /api/comments
 * @desc    Create new comment
 * @access  Private
 */
router.post('/', protect, commentLimiter, validateCreateComment, createComment);

/**
 * @route   GET /api/comments/post/:postId
 * @desc    Get comments for a post
 * @access  Public
 */
router.get('/post/:postId', optionalAuth, validatePagination, getPostComments);

/**
 * @route   GET /api/comments/:id/replies
 * @desc    Get replies for a comment
 * @access  Public
 */
router.get('/:id/replies', optionalAuth, validateCommentId, validatePagination, getCommentReplies);

/**
 * @route   GET /api/comments/:id
 * @desc    Get single comment
 * @access  Public
 */
router.get('/:id', optionalAuth, validateCommentId, getComment);

/**
 * @route   PUT /api/comments/:id
 * @desc    Update comment
 * @access  Private
 */
router.put('/:id', protect, validateCommentId, updateComment);

/**
 * @route   DELETE /api/comments/:id
 * @desc    Delete comment
 * @access  Private
 */
router.delete('/:id', protect, validateCommentId, deleteComment);

/**
 * @route   POST /api/comments/:id/like
 * @desc    Like comment
 * @access  Private
 */
router.post('/:id/like', protect, validateCommentId, likeComment);

/**
 * @route   DELETE /api/comments/:id/like
 * @desc    Unlike comment
 * @access  Private
 */
router.delete('/:id/like', protect, validateCommentId, unlikeComment);

export default router;