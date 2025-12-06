/**
 * Message Routes
 * Handles private messaging endpoints
 */

import express from 'express';
import {
  sendMessage,
  getConversations,
  getConversationMessages,
  getOrCreateConversation,
  markConversationAsRead,
  deleteMessage,
  getUnreadCount,
  deleteConversation
} from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';
import { messageLimiter } from '../middleware/rateLimiter.js';
import {
  validateSendMessage,
  validateConversationId,
  validatePagination
} from '../middleware/validator.js';

const router = express.Router();

/**
 * @route   POST /api/messages
 * @desc    Send a message
 * @access  Private
 */
router.post('/', protect, messageLimiter, validateSendMessage, sendMessage);

/**
 * @route   GET /api/messages/conversations
 * @desc    Get user conversations
 * @access  Private
 */
router.get('/conversations', protect, validatePagination, getConversations);

/**
 * @route   GET /api/messages/unread/count
 * @desc    Get unread messages count
 * @access  Private
 */
router.get('/unread/count', protect, getUnreadCount);

/**
 * @route   GET /api/messages/conversations/:conversationId
 * @desc    Get conversation messages
 * @access  Private
 */
router.get(
  '/conversations/:conversationId',
  protect,
  validateConversationId,
  validatePagination,
  getConversationMessages
);

/**
 * @route   POST /api/messages/conversations/:userId
 * @desc    Get or create conversation with user
 * @access  Private
 */
router.post('/conversations/:userId', protect, getOrCreateConversation);

/**
 * @route   PUT /api/messages/conversations/:conversationId/read
 * @desc    Mark conversation as read
 * @access  Private
 */
router.put(
  '/conversations/:conversationId/read',
  protect,
  validateConversationId,
  markConversationAsRead
);

/**
 * @route   DELETE /api/messages/conversations/:conversationId
 * @desc    Delete conversation
 * @access  Private
 */
router.delete(
  '/conversations/:conversationId',
  protect,
  validateConversationId,
  deleteConversation
);

/**
 * @route   DELETE /api/messages/:id
 * @desc    Delete a message
 * @access  Private
 */
router.delete('/:id', protect, deleteMessage);

export default router;