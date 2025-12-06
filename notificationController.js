/**
 * Notification Controller
 * Handles notification operations with safer ownership checks and robust responses.
 */

import Notification from '../models/Notification.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

/**
 * GET /api/notifications
 * Private
 */
export const getNotifications = asyncHandler(async (req, res, next) => {
  if (!req.user) return next(new AppError('Not authenticated', 401));

  const { page = 1, limit = 20, unreadOnly = false } = req.query;

  const result = await Notification.getUserNotifications(req.user._id, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    unreadOnly: unreadOnly === 'true' || unreadOnly === true
  });

  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * GET /api/notifications/unread/count
 * Private
 */
export const getUnreadCount = asyncHandler(async (req, res, next) => {
  if (!req.user) return next(new AppError('Not authenticated', 401));

  const count = await Notification.getUnreadCount(req.user._id);

  res.status(200).json({
    success: true,
    data: { unreadCount: count }
  });
});

/**
 * PUT /api/notifications/:id/read
 * Private - mark single notification as read (ownership enforced)
 */
export const markAsRead = asyncHandler(async (req, res, next) => {
  if (!req.user) return next(new AppError('Not authenticated', 401));

  const notifId = req.params.id;

  // Atomic ownership-checked update
  const updated = await Notification.findOneAndUpdate(
    { _id: notifId, recipient: req.user._id, read: false },
    { $set: { read: true, readAt: new Date() } },
    { new: true }
  )
    .populate('sender', 'username avatarColor clan')
    .populate('relatedPost', 'content')
    .populate('relatedComment', 'content')
    .lean()
    .exec();

  if (!updated) {
    // Could be not found, already read, or not owner
    const exists = await Notification.findById(notifId).lean().exec();
    if (!exists) return next(new AppError('Notification not found', 404));
    // exists but not owned or already read
    if (String(exists.recipient) !== String(req.user._id)) {
      return next(new AppError('Not authorized to access this notification', 403));
    }
    // already read: return current state
    return res.status(200).json({ success: true, message: 'Notification already marked as read', data: { notification: exists } });
  }

  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
    data: { notification: updated }
  });
});

/**
 * PUT /api/notifications/read-all
 * Private - mark all unread for user as read
 */
export const markAllAsRead = asyncHandler(async (req, res, next) => {
  if (!req.user) return next(new AppError('Not authenticated', 401));

  try {
    const result = await Notification.markAllAsRead(req.user._id);
    logger.info(`All notifications marked as read for user`, { userId: req.user._id });
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: { result }
    });
  } catch (err) {
    logger.error('markAllAsRead failed', err);
    throw err;
  }
});

/**
 * DELETE /api/notifications/:id
 * Private - delete one notification (ownership enforced)
 */
export const deleteNotification = asyncHandler(async (req, res, next) => {
  if (!req.user) return next(new AppError('Not authenticated', 401));

  const notifId = req.params.id;

  const deleted = await Notification.findOneAndDelete({ _id: notifId, recipient: req.user._id }).lean().exec();
  if (!deleted) {
    const exists = await Notification.findById(notifId).lean().exec();
    if (!exists) return next(new AppError('Notification not found', 404));
    if (String(exists.recipient) !== String(req.user._id)) return next(new AppError('Not authorized to delete this notification', 403));
    // Fallback
    return next(new AppError('Unable to delete notification', 500));
  }

  logger.info('Notification deleted', { userId: req.user._id, notificationId: notifId });

  res.status(200).json({
    success: true,
    message: 'Notification deleted successfully'
  });
});

/**
 * DELETE /api/notifications/all
 * Private - delete all notifications for user
 */
export const deleteAllNotifications = asyncHandler(async (req, res, next) => {
  if (!req.user) return next(new AppError('Not authenticated', 401));

  try {
    const result = await Notification.deleteAllForUser(req.user._id);
    logger.info('All notifications deleted for user', { userId: req.user._id });
    res.status(200).json({
      success: true,
      message: 'All notifications deleted successfully',
      data: { result }
    });
  } catch (err) {
    logger.error('deleteAllNotifications failed', err);
    throw err;
  }
});

/**
 * GET /api/notifications/:id
 * Private - fetch single notification (ownership enforced)
 */
export const getNotification = asyncHandler(async (req, res, next) => {
  if (!req.user) return next(new AppError('Not authenticated', 401));

  const notif = await Notification.findById(req.params.id)
    .populate('sender', 'username avatarColor clan')
    .populate('relatedPost', 'content')
    .populate('relatedComment', 'content')
    .lean()
    .exec();

  if (!notif) return next(new AppError('Notification not found', 404));
  if (String(notif.recipient) !== String(req.user._id)) return next(new AppError('Not authorized to access this notification', 403));

  res.status(200).json({
    success: true,
    data: { notification: notif }
  });
});

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getNotification
};