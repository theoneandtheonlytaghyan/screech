/**
 * Notification Service
 * Handles creating and managing notifications
 */

import Notification from '../models/Notification.js';
import { NOTIFICATION_TYPES } from '../config/constants.js';
import { paginate } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

/**
 * Create a new notification
 * @param {object} data - Notification data
 * @param {string} data.recipient - User ID of recipient
 * @param {string|null} data.sender - User ID of sender (nullable for system)
 * @param {string} data.type - Notification type
 * @param {string} data.message - Notification message
 * @param {string} data.relatedPost - Related post ID (optional)
 * @param {string} data.relatedComment - Related comment ID (optional)
 * @returns {Promise<object|null>} Created populated notification or null
 */
export const createNotification = async (data) => {
  const { recipient, sender = null, type, message, relatedPost = null, relatedComment = null } = data || {};

  if (!recipient) {
    return null;
  }

  // Validate notification type
  if (!Object.values(NOTIFICATION_TYPES).includes(type)) {
    throw new Error(`Invalid notification type: ${type}`);
  }

  // Don't notify the same user (guard both present)
  try {
    if (sender && recipient && recipient.toString && sender.toString && recipient.toString() === sender.toString()) {
      return null;
    }
  } catch (err) {
    // If toString isn't available for some reason, continue defensively
  }

  try {
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      message,
      relatedPost,
      relatedComment,
      read: false
    });

    // Populate sender for caller convenience
    await notification.populate('sender', 'username avatarColor clan');

    return notification;
  } catch (err) {
    logger.error('createNotification failed', err);
    throw err;
  }
};

/**
 * Helpers to create common notification types
 */
export const createLikeNotification = async (postAuthorId, likerId, likerUsername, postId) => {
  return createNotification({
    recipient: postAuthorId,
    sender: likerId,
    type: NOTIFICATION_TYPES.LIKE,
    message: `${likerUsername} liked your hoot`,
    relatedPost: postId
  });
};

export const createCommentNotification = async (postAuthorId, commenterId, commenterUsername, postId, commentId) => {
  return createNotification({
    recipient: postAuthorId,
    sender: commenterId,
    type: NOTIFICATION_TYPES.COMMENT,
    message: `${commenterUsername} commented on your hoot`,
    relatedPost: postId,
    relatedComment: commentId
  });
};

export const createMessageNotification = async (recipientId, senderId, senderUsername) => {
  return createNotification({
    recipient: recipientId,
    sender: senderId,
    type: NOTIFICATION_TYPES.MESSAGE,
    message: `${senderUsername} sent you a message`
  });
};

export const createClanRankNotification = async (userId, newRank, clanName) => {
  return createNotification({
    recipient: userId,
    sender: null,
    type: NOTIFICATION_TYPES.CLAN_RANK,
    message: `You are now rank #${newRank} in ${clanName}!`
  });
};

export const createSystemNotification = async (userId, message) => {
  return createNotification({
    recipient: userId,
    sender: null,
    type: NOTIFICATION_TYPES.SYSTEM,
    message
  });
};

/**
 * Get user notifications (paginated)
 * Uses parallel queries for list/total/unread counts and returns lean docs
 */
export const getUserNotifications = async (userId, page = 1, limit = 20) => {
  const { skip, limit: safeLimit } = paginate(page, limit);

  try {
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .populate('sender', 'username avatarColor clan')
        .lean()
        .exec(),
      Notification.countDocuments({ recipient: userId }),
      Notification.countDocuments({ recipient: userId, read: false })
    ]);

    return {
      notifications,
      total,
      unreadCount,
      page: Math.max(1, Number(page) || 1),
      pages: Math.ceil(total / safeLimit) || 0
    };
  } catch (err) {
    logger.error(`getUserNotifications failed for user ${userId}`, err);
    throw err;
  }
};

/**
 * Mark a single notification as read
 */
export const markAsRead = async (notificationId, userId) => {
  try {
    const updated = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { read: true },
      { new: true }
    ).lean().exec();
    return updated;
  } catch (err) {
    logger.error(`markAsRead failed for notification ${notificationId}`, err);
    throw err;
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId) => {
  try {
    const res = await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );
    return res;
  } catch (err) {
    logger.error(`markAllAsRead failed for user ${userId}`, err);
    throw err;
  }
};

/**
 * Delete a single notification (owner only)
 */
export const deleteNotification = async (notificationId, userId) => {
  try {
    const deleted = await Notification.findOneAndDelete({ _id: notificationId, recipient: userId }).lean().exec();
    return deleted;
  } catch (err) {
    logger.error(`deleteNotification failed for ${notificationId}`, err);
    throw err;
  }
};

/**
 * Clear all notifications for a user
 */
export const clearAllNotifications = async (userId) => {
  try {
    const res = await Notification.deleteMany({ recipient: userId });
    return res;
  } catch (err) {
    logger.error(`clearAllNotifications failed for user ${userId}`, err);
    throw err;
  }
};

/**
 * Export default object
 */
export default {
  createNotification,
  createLikeNotification,
  createCommentNotification,
  createMessageNotification,
  createClanRankNotification,
  createSystemNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications
};

/*
Recommended index additions (apply in models/Notification.js):
- NotificationSchema.index({ recipient: 1, createdAt: -1 });
- NotificationSchema.index({ recipient: 1, read: 1 });
These speed up the list/unread queries.
*/