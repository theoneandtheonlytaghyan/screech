/**
 * Notification Model
 * Defines the schema for user notifications
 */

import mongoose from 'mongoose';
import { NOTIFICATION_TYPES } from '../config/constants.js';
import { paginate } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  type: {
    type: String,
    enum: Object.values(NOTIFICATION_TYPES),
    required: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  relatedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },
  relatedComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ type: 1 });

// Auto-delete old notifications after 30 days
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }
);

// Mark notification as read
notificationSchema.methods.markAsRead = async function() {
  if (!this.read) {
    this.read = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

// Format for JSON response
notificationSchema.methods.toJSON = function() {
  const notification = this.toObject();
  delete notification.__v;
  return notification;
};

// Get icon based on notification type
notificationSchema.methods.getIcon = function() {
  const icons = {
    [NOTIFICATION_TYPES.LIKE]: '❤️',
    [NOTIFICATION_TYPES.COMMENT]: '💬',
    [NOTIFICATION_TYPES.MESSAGE]: '✉️',
    [NOTIFICATION_TYPES.CLAN_RANK]: '🏆',
    [NOTIFICATION_TYPES.SYSTEM]: '🔔'
  };
  return icons[this.type] || '🔔';
};

// Static method to get user notifications (paginated, lean, parallel counts)
notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
  const { page = 1, limit = 20, unreadOnly = false } = options;
  const { skip, limit: safeLimit } = paginate(page, limit);

  const query = { recipient: userId };
  if (unreadOnly) query.read = false;

  try {
    const [notifications, total, unreadCount] = await Promise.all([
      this.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .populate('sender', 'username avatarColor clan')
        .populate('relatedPost', 'content')
        .populate('relatedComment', 'content')
        .lean()
        .exec(),
      this.countDocuments(query),
      // unreadCount only if unreadOnly is false (otherwise it's the same as total)
      unreadOnly ? Promise.resolve(undefined) : this.countDocuments({ recipient: userId, read: false })
    ]);

    return {
      notifications,
      total,
      unreadCount: unreadCount === undefined ? notifications.filter(n => !n.read).length : unreadCount,
      page: Math.max(1, Number(page) || 1),
      pages: Math.ceil(total / safeLimit) || 0,
      hasMore: skip + notifications.length < total
    };
  } catch (err) {
    logger.error(`getUserNotifications failed for user ${userId}`, err);
    throw err;
  }
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  try {
    return this.countDocuments({
      recipient: userId,
      read: false
    });
  } catch (err) {
    logger.error(`getUnreadCount failed for user ${userId}`, err);
    throw err;
  }
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  try {
    return this.updateMany(
      { recipient: userId, read: false },
      { read: true, readAt: new Date() }
    );
  } catch (err) {
    logger.error(`markAllAsRead failed for user ${userId}`, err);
    throw err;
  }
};

// Static method to delete all for user
notificationSchema.statics.deleteAllForUser = async function(userId) {
  try {
    return this.deleteMany({ recipient: userId });
  } catch (err) {
    logger.error(`deleteAllForUser failed for user ${userId}`, err);
    throw err;
  }
};

// Static method to create notification (with duplicate check and defensive guards)
notificationSchema.statics.createNotification = async function(data) {
  const { recipient, sender = null, type, message, relatedPost = null, relatedComment = null, relatedUser = null } = data || {};

  if (!recipient) return null;

  // Don't notify yourself
  try {
    if (sender && String(recipient) === String(sender)) return null;
  } catch (err) {
    // continue defensively
  }

  try {
    // Check for duplicate notification in last hour (if related identifiers present)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const dupQuery = {
      recipient,
      type,
      createdAt: { $gte: oneHourAgo }
    };

    // only include sender/related ids in duplicate check if provided
    if (sender) dupQuery.sender = sender;
    if (relatedPost) dupQuery.relatedPost = relatedPost;
    if (relatedComment) dupQuery.relatedComment = relatedComment;
    if (relatedUser) dupQuery.relatedUser = relatedUser;

    const duplicate = await this.findOne(dupQuery).lean().exec();
    if (duplicate) return duplicate;

    const notification = await this.create({
      recipient,
      sender,
      type,
      message,
      relatedPost,
      relatedComment,
      relatedUser,
      read: false
    });

    await notification.populate('sender', 'username avatarColor clan');
    return notification;
  } catch (err) {
    logger.error('createNotification failed', err);
    throw err;
  }
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;