/**
 * Message Model
 * Defines the schema for private messages between users
 */

import mongoose from 'mongoose';
import { paginate } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [1000, 'Message cannot exceed 1000 characters'],
    trim: true
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
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ recipient: 1, read: 1 });

// Mark message as read
messageSchema.methods.markAsRead = async function() {
  if (!this.read) {
    this.read = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

// Format for JSON response
messageSchema.methods.toJSON = function() {
  const message = this.toObject();
  delete message.__v;
  return message;
};

// Static method to get conversation messages (paginated)
// Returns messages in chronological order (oldest first) for the requested page.
// Internally we fetch newest-first page for convenience then reverse to chronological.
messageSchema.statics.getConversationMessages = async function(conversationId, options = {}) {
  const { page = 1, limit = 50 } = options;
  const { skip, limit: safeLimit } = paginate(page, limit);

  try {
    // Fetch messages newest-first so paging by page 1 returns the most recent page,
    // then reverse to present oldest->newest ordering within the page.
    const [messages, total] = await Promise.all([
      this.find({ conversation: conversationId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .populate('sender', 'username avatarColor clan')
        .populate('recipient', 'username avatarColor clan')
        .lean()
        .exec(),
      this.countDocuments({ conversation: conversationId })
    ]);

    // messages were fetched newest-first; reverse to chronological for UI
    const ordered = (messages || []).slice().reverse();

    return {
      messages: ordered,
      total,
      page: Math.max(1, Number(page) || 1),
      pages: Math.ceil(total / safeLimit) || 0,
      hasMore: skip + messages.length < total
    };
  } catch (err) {
    logger.error(`getConversationMessages failed for conversation ${conversationId}`, err);
    throw err;
  }
};

// Static method to get unread count for user
messageSchema.statics.getUnreadCount = async function(userId) {
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

// Static method to mark all messages in conversation as read by the recipient
messageSchema.statics.markConversationAsRead = async function(conversationId, userId) {
  try {
    return this.updateMany(
      {
        conversation: conversationId,
        recipient: userId,
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );
  } catch (err) {
    logger.error(`markConversationAsRead failed for conversation ${conversationId}`, err);
    throw err;
  }
};

const Message = mongoose.model('Message', messageSchema);

/**
 * Conversation Model
 * Defines the schema for conversations between users
 */

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  // Map keyed by userId string -> number
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

// Helper to normalize participant array for consistent queries
const normalizeParticipantIds = (a, b) => [String(a), String(b)].sort();

// Get or create conversation between two users
conversationSchema.statics.getOrCreate = async function(userId1, userId2) {
  try {
    if (!userId1 || !userId2) throw new Error('Missing participant id(s)');

    // Look for existing conversation containing both participants
    let conversation = await this.findOne({
      participants: { $all: [userId1, userId2] }
    })
      .populate('participants', 'username avatarColor clan')
      .populate('lastMessage');

    if (!conversation) {
      // Build initial unreadCount map with both participants set to 0
      const map = {};
      map[String(userId1)] = 0;
      map[String(userId2)] = 0;

      conversation = await this.create({
        participants: [userId1, userId2],
        unreadCount: map
      });

      // populate before returning
      await conversation.populate('participants', 'username avatarColor clan');
    }

    return conversation;
  } catch (err) {
    logger.error(`getOrCreate conversation failed for ${userId1}, ${userId2}`, err);
    throw err;
  }
};

// Get user conversations (paginated) - returns populated, lean results
conversationSchema.statics.getUserConversations = async function(userId, options = {}) {
  const { page = 1, limit = 20 } = options;
  const { skip, limit: safeLimit } = paginate(page, limit);

  try {
    const [conversations, total] = await Promise.all([
      this.find({ participants: userId })
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .populate('participants', 'username avatarColor clan isOnline lastSeen')
        .populate({
          path: 'lastMessage',
          populate: [{ path: 'sender', select: 'username avatarColor clan' }, { path: 'recipient', select: 'username avatarColor clan' }]
        })
        .lean()
        .exec(),
      this.countDocuments({ participants: userId })
    ]);

    return {
      conversations,
      total,
      page: Math.max(1, Number(page) || 1),
      pages: Math.ceil(total / safeLimit) || 0,
      hasMore: skip + conversations.length < total
    };
  } catch (err) {
    logger.error(`getUserConversations failed for user ${userId}`, err);
    throw err;
  }
};

// Update last message and increment unread count for recipient
conversationSchema.methods.updateLastMessage = async function(messageId, recipientId) {
  try {
    this.lastMessage = messageId;
    this.lastMessageAt = new Date();

    const key = String(recipientId);
    const currentCount = Number(this.unreadCount.get ? this.unreadCount.get(key) : (this.unreadCount && this.unreadCount[key]) || 0);
    // support Map-like and plain object representations
    if (this.unreadCount.set) {
      this.unreadCount.set(key, currentCount + 1);
    } else {
      this.unreadCount = this.unreadCount || {};
      this.unreadCount[key] = currentCount + 1;
    }

    await this.save();
  } catch (err) {
    logger.error(`updateLastMessage failed on conversation ${this._id}`, err);
    throw err;
  }
};

// Clear unread count for user
conversationSchema.methods.clearUnreadCount = async function(userId) {
  try {
    const key = String(userId);
    if (this.unreadCount.set) {
      this.unreadCount.set(key, 0);
    } else {
      this.unreadCount = this.unreadCount || {};
      this.unreadCount[key] = 0;
    }
    await this.save();
  } catch (err) {
    logger.error(`clearUnreadCount failed on conversation ${this._id}`, err);
    throw err;
  }
};

// Get other participant (returns plain participant object)
conversationSchema.methods.getOtherParticipant = function(userId) {
  if (!Array.isArray(this.participants)) return null;
  const uid = String(userId);
  return this.participants.find(p => String(p._id || p) !== uid) || null;
};

// Format for JSON response
conversationSchema.methods.toJSON = function() {
  const conversation = this.toObject();
  try {
    // Convert Mongoose Map to plain object if necessary
    if (conversation.unreadCount && typeof conversation.unreadCount === 'object' && !(conversation.unreadCount instanceof Object)) {
      // fallback - leave as is
    }
    // If it's a Map-like object, ensure a plain object is returned
    if (this.unreadCount && this.unreadCount instanceof Map) {
      conversation.unreadCount = Object.fromEntries(this.unreadCount);
    } else if (conversation.unreadCount && typeof conversation.unreadCount === 'object') {
      // already plain object
    } else {
      conversation.unreadCount = {};
    }
  } catch (err) {
    conversation.unreadCount = {};
  }

  delete conversation.__v;
  return conversation;
};

const Conversation = mongoose.model('Conversation', conversationSchema);

export { Message, Conversation };
export default Message;