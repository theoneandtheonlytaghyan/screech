/**
 * Notification Routes
 * Handles notification endpoints
 */

import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getNotification
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';
import {
  validateNotificationId,
  validatePagination
} from '../middleware/validator.js';

const router = express.Router();

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/', protect, validatePagination, getNotifications);

/**
 * @route   GET /api/notifications/unread/count
 * @desc    Get unread notifications count
 * @access  Private
 */
router.get('/unread/count', protect, getUnreadCount);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', protect, markAllAsRead);

/**
 * @route   DELETE /api/notifications/all
 * @desc    Delete all notifications
 * @access  Private
 */
router.delete('/all', protect, deleteAllNotifications);

/**
 * @route   GET /api/notifications/:id
 * @desc    Get notification by ID
 * @access  Private
 */
router.get('/:id', protect, validateNotificationId, getNotification);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:id/read', protect, validateNotificationId, markAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:id', protect, validateNotificationId, deleteNotification);

export default router;