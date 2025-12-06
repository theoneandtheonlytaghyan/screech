/**
 * Message Controller
 * Robust private messaging controller with safer checks and parallel updates.
 */

import MessageModel, { Conversation } from '../models/Message.js';
import User from '../models/User.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { createMessageNotification } from '../services/notificationService.js';
import { logger } from '../utils/logger.js';

/*
  Note: some code paths expect exports named `Message` and `Conversation`,
  while the local model file may export default or named. We try to use
  `MessageModel` as default and `Conversation` named import above.
*/
const Message = MessageModel;

/* Helper to get other participant if helper not present */
const getOtherParticipantFromConv = (conv, userId) => {
  try {
    if (!conv) return null;
    // If Mongoose method exists
    if (typeof conv.getOtherParticipant === 'function') {
      return conv.getOtherParticipant(userId);
    }
    // Conv may be lean: participants array exists
    const parts = conv.participants || [];
    return parts.find((p) => String(p) !== String(userId)) || null;
  } catch (err) {
    logger.debug('getOtherParticipantFromConv failed', { err: err?.message });
    return null;
  }
};

/**
 * Send a message
 * POST /api/messages
 * Private
 */
export const sendMessage = asyncHandler(async (req, res, next) => {
  if (!req.user) return next(new AppError('Not authenticated', 401));

  const { recipientId, content } = req.body || {};
  if (!recipientId || !content || String(content).trim().length === 0) {
    return next(new AppError('recipientId and content are required', 400));
  }

  if (String(recipientId) === String(req.user._id)) {
    return next(new AppError('You cannot message yourself', 400));
  }

  // Ensure recipient exists
  const recipient = await User.findById(recipientId).select('username').lean().exec();
  if (!recipient) return next(new AppError('Recipient not found', 404));

  // Get or create conversation
  const conversation = await Conversation.getOrCreate(req.user._id, recipientId);

  // Create message and update conversation.lastMessage + unread counts in parallel
  let message;
  try {
    message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      recipient: recipientId,
      content: String(content).trim()
    });
  } catch (err) {
    logger.error('Failed to create message', { err });
    throw err;
  }

  const tasks = [];

  // Update conversation (lastMessage, lastUpdated, increment unread for recipient)
  if (typeof conversation.updateLastMessage === 'function') {
    tasks.push(
      (async () => {
        try {
          await conversation.updateLastMessage(message._id, recipientId);
        } catch (e) {
          logger.warn('conversation.updateLastMessage failed', { err: e?.message, convId: conversation._id });
        }
      })()
    );
  } else {
    tasks.push(
      Conversation.findByIdAndUpdate(conversation._id, {
        $set: { lastMessage: message._id, lastUpdated: new Date() },
        $inc: { [`unreadCount.${String(recipientId)}`]: 1 }
      }).exec()
    );
  }

  // Fire notification (fire-and-forget)
  tasks.push(
    createMessageNotification(recipientId, req.user._id, req.user.username).catch((e) => {
      logger.warn('createMessageNotification failed', { err: e?.message });
    })
  );

  await Promise.all(tasks);

  // Populate sender/recipient for response
  try {
    await message.populate('sender', 'username avatarColor clan');
    await message.populate('recipient', 'username avatarColor clan');
  } catch (err) {
    // ignore populate failure; return raw message
  }

  logger.info('Message sent', { from: String(req.user._id), to: String(recipientId), messageId: message._id });

  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    data: {
      message,
      conversation: conversation._id
    }
  });
});

/**
 * Get user conversations
 * GET /api/messages/conversations
 * Private
 */
export const getConversations = asyncHandler(async (req, res, next) => {
  if (!req.user) return next(new AppError('Not authenticated', 401));

  const { page = 1, limit = 20 } = req.query;
  const result = await Conversation.getUserConversations(req.user._id, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10)
  });

  // Normalize conversations: attach otherParticipant and myUnreadCount
  result.conversations = (result.conversations || []).map((conv) => {
    const convObj = typeof conv.toObject === 'function' ? conv.toObject() : conv;
    const other = getOtherParticipantFromConv(conv, req.user._id);
    convObj.otherParticipant = other;
    // Some implementations use Map for unreadCount; handle both
    try {
      convObj.myUnreadCount = conv.unreadCount?.get ? conv.unreadCount.get(String(req.user._id)) || 0 : (conv.unreadCount ? conv.unreadCount[String(req.user._id)] || 0 : 0);
    } catch (_) {
      convObj.myUnreadCount = 0;
    }
    return convObj;
  });

  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * Get conversation messages
 * GET /api/messages/conversations/:conversationId
 * Private
 */
export const getConversationMessages = asyncHandler(async (req, res, next) => {
  if (!req.user) return next(new AppError('Not authenticated', 401));

  const { conversationId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const conversation = await Conversation.findById(conversationId).lean().exec();
  if (!conversation) return next(new AppError('Conversation not found', 404));

  const isParticipant = (conversation.participants || []).some(p => String(p) === String(req.user._id));
  if (!isParticipant) return next(new AppError('Not authorized to view this conversation', 403));

  const result = await Message.getConversationMessages(conversationId, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10)
  });

  // Mark messages as read and clear unread count (parallel)
  await Promise.all([
    Message.markConversationAsRead(conversationId, req.user._id).catch((e) => logger.warn('markConversationAsRead failed', { err: e?.message })),
    (async () => {
      try {
        const convDoc = await Conversation.findById(conversationId);
        if (convDoc && typeof convDoc.clearUnreadCount === 'function') {
          await convDoc.clearUnreadCount(req.user._id);
        } else {
          await Conversation.findByIdAndUpdate(conversationId, { $set: { [`unreadCount.${String(req.user._id)}`]: 0 } }).exec();
        }
      } catch (e) {
        logger.warn('Failed to clear unreadCount on conversation', { err: e?.message, conversationId });
      }
    })()
  ]);

  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * Get or create conversation with user
 * POST /api/messages/conversations/:userId
 * Private
 */
export const getOrCreateConversation = asyncHandler(async (req, res, next) => {
  if (!req.user) return next(new AppError('Not authenticated', 401));

  const { userId } = req.params;
  if (!userId) return next(new AppError('userId is required', 400));
  if (String(userId) === String(req.user._id)) return next(new AppError('You cannot message yourself', 400));

  const other = await User.findById(userId).select('username').lean().exec();
  if (!other) return next(new AppError('User not found', 404));

  const conversation = await Conversation.getOrCreate(req.user._id, userId);

  const convObj = typeof conversation.toObject === 'function' ? conversation.toObject() : conversation;
  convObj.otherParticipant = getOtherParticipantFromConv(conversation, req.user._id);
  try {
    convObj.myUnreadCount = conversation.unreadCount?.get ? conversation.unreadCount.get(String(req.user._id)) || 0 : (conversation.unreadCount ? conversation.unreadCount[String(req.user._id)] || 0 : 0);
  } catch (_) {
    convObj.myUnreadCount = 0;
  }

  res.status(200).json({
    success: true,
    data: {
      conversation: convObj
    }
  });
});

/**
 * Mark conversation as read
 * PUT /api/messages/conversations/:conversationId/read
 * Private
 */
export const markConversationAsRead = asyncHandler(async (req, res, next) => {
  if (!req.user) return next(new AppError('Not authenticated', 401));

  const { conversationId } = req.params;
  const conversation = await Conversation.findById(conversationId).lean().exec();
  if (!conversation) return next(new AppError('Conversation not found', 404));

  const isParticipant = (conversation.participants || []).some(p => String(p) === String(req.user._id));
  if (!isParticipant) return next(new AppError('Not authorized', 403));

  await Promise.all([
    Message.markConversationAsRead(conversationId, req.user._id).catch(e => logger.warn('markConversationAsRead failed', { err: e?.message })),
    (async () => {
      try {
        const convDoc = await Conversation.findById(conversationId);
        if (convDoc && typeof convDoc.clearUnreadCount === 'function') {
          await convDoc.clearUnreadCount(req.user._id);
        } else {
          await Conversation.findByIdAndUpdate(conversationId, { $set: { [`unreadCount.${String(req.user._id)}`]: 0 } }).exec();
        }
      } catch (e) {
        logger.warn('Failed to clear unreadCount', { err: e?.message });
      }
    })()
  ]);

  res.status(200).json({ success: true, message: 'Conversation marked as read' });
});

/**
 * Delete a message
 * DELETE /api/messages/:id
 * Private
 */
export const deleteMessage = asyncHandler(async (req, res, next) => {
  if (!req.user) return next(new AppError('Not authenticated', 401));

  const message = await Message.findById(req.params.id).exec();
  if (!message) return next(new AppError('Message not found', 404));

  if (String(message.sender) !== String(req.user._id)) return next(new AppError('Not authorized to delete this message', 403));

  await Message.findByIdAndDelete(req.params.id).exec();

  logger.info('Message deleted', { messageId: req.params.id, userId: String(req.user._id) });

  res.status(200).json({ success: true, message: 'Message deleted successfully' });
});

/**
 * Get unread messages count
 * GET /api/messages/unread/count
 * Private
 */
export const getUnreadCount = asyncHandler(async (req, res, next) => {
  if (!req.user) return next(new AppError('Not authenticated', 401));
  const count = await Message.getUnreadCount(req.user._id);
  res.status(200).json({ success: true, data: { unreadCount: count } });
});

/**
 * Delete conversation
 * DELETE /api/messages/conversations/:conversationId
 * Private
 */
export const deleteConversation = asyncHandler(async (req, res, next) => {
  if (!req.user) return next(new AppError('Not authenticated', 401));

  const { conversationId } = req.params;
  const conversation = await Conversation.findById(conversationId).exec();
  if (!conversation) return next(new AppError('Conversation not found', 404));

  const isParticipant = (conversation.participants || []).some(p => String(p) === String(req.user._id));
  if (!isParticipant) return next(new AppError('Not authorized to delete this conversation', 403));

  // Delete messages and conversation
  await Promise.all([
    Message.deleteMany({ conversation: conversationId }).exec(),
    Conversation.findByIdAndDelete(conversationId).exec()
  ]);

  logger.info('Conversation deleted', { conversationId, by: String(req.user._id) });

  res.status(200).json({ success: true, message: 'Conversation deleted successfully' });
});

export default {
  sendMessage,
  getConversations,
  getConversationMessages,
  getOrCreateConversation,
  markConversationAsRead,
  deleteMessage,
  getUnreadCount,
  deleteConversation
};