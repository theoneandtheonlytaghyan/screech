/**
 * Socket Handler
 * Handles real-time WebSocket connections
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';

// Store connected users
const connectedUsers = new Map();

/**
 * Initialize Socket.IO
 * @param {object} io - Socket.IO instance
 */
export const initializeSocket = (io) => {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error.message);
      next(new Error('Invalid token'));
    }
  });

  // Handle connections
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();

    logger.info(`User connected: ${socket.user.username} (${userId})`);

    // Add user to connected users
    connectedUsers.set(userId, {
      socketId: socket.id,
      user: socket.user
    });

    // Update user online status
    updateUserOnlineStatus(userId, true);

    // Broadcast online status to all users
    io.emit('user:online', {
      userId,
      username: socket.user.username,
      isOnline: true
    });

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Join clan room
    if (socket.user.clan?.name) {
      socket.join(`clan:${socket.user.clan.name}`);
    }

    /**
     * Handle new post
     */
    socket.on('post:new', (post) => {
      // Broadcast to all users except sender
      socket.broadcast.emit('post:created', {
        post,
        author: {
          _id: socket.user._id,
          username: socket.user.username,
          avatarColor: socket.user.avatarColor,
          clan: socket.user.clan
        }
      });
    });

    /**
     * Handle post like
     */
    socket.on('post:like', (data) => {
      const { postId, authorId } = data;

      // Notify post author
      io.to(`user:${authorId}`).emit('notification:new', {
        type: 'like',
        message: `${socket.user.username} liked your hoot`,
        postId,
        from: {
          _id: socket.user._id,
          username: socket.user.username,
          avatarColor: socket.user.avatarColor
        }
      });

      // Broadcast like count update
      io.emit('post:liked', {
        postId,
        userId: socket.user._id
      });
    });

    /**
     * Handle new comment
     */
    socket.on('comment:new', (data) => {
      const { postId, authorId, comment } = data;

      // Notify post author
      if (authorId !== userId) {
        io.to(`user:${authorId}`).emit('notification:new', {
          type: 'comment',
          message: `${socket.user.username} commented on your hoot`,
          postId,
          comment,
          from: {
            _id: socket.user._id,
            username: socket.user.username,
            avatarColor: socket.user.avatarColor
          }
        });
      }

      // Broadcast new comment
      io.emit('comment:created', {
        postId,
        comment,
        author: {
          _id: socket.user._id,
          username: socket.user.username,
          avatarColor: socket.user.avatarColor,
          clan: socket.user.clan
        }
      });
    });

    /**
     * Handle private message
     */
    socket.on('message:send', (data) => {
      const { recipientId, message, conversationId } = data;

      // Send to recipient
      io.to(`user:${recipientId}`).emit('message:received', {
        message,
        conversationId,
        from: {
          _id: socket.user._id,
          username: socket.user.username,
          avatarColor: socket.user.avatarColor
        }
      });

      // Send notification
      io.to(`user:${recipientId}`).emit('notification:new', {
        type: 'message',
        message: `${socket.user.username} sent you a message`,
        conversationId,
        from: {
          _id: socket.user._id,
          username: socket.user.username,
          avatarColor: socket.user.avatarColor
        }
      });
    });

    /**
     * Handle typing indicator
     */
    socket.on('message:typing', (data) => {
      const { recipientId, conversationId, isTyping } = data;

      io.to(`user:${recipientId}`).emit('message:typing', {
        conversationId,
        userId: socket.user._id,
        username: socket.user.username,
        isTyping
      });
    });

    /**
     * Handle message read
     */
    socket.on('message:read', (data) => {
      const { senderId, conversationId } = data;

      io.to(`user:${senderId}`).emit('message:read', {
        conversationId,
        readBy: socket.user._id
      });
    });

    /**
     * Handle clan chat message
     */
    socket.on('clan:message', (data) => {
      const { message } = data;
      const clanName = socket.user.clan?.name;

      if (clanName) {
        socket.to(`clan:${clanName}`).emit('clan:message', {
          message,
          from: {
            _id: socket.user._id,
            username: socket.user.username,
            avatarColor: socket.user.avatarColor
          },
          timestamp: new Date()
        });
      }
    });

    /**
     * Handle disconnect
     */
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.user.username} (${userId})`);

      // Remove from connected users
      connectedUsers.delete(userId);

      // Update user online status
      updateUserOnlineStatus(userId, false);

      // Broadcast offline status
      io.emit('user:offline', {
        userId,
        username: socket.user.username,
        isOnline: false
      });
    });

    /**
     * Handle errors
     */
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${socket.user.username}:`, error);
    });
  });

  logger.info('Socket.IO initialized');
};

/**
 * Update user online status in database
 * @param {string} userId - User ID
 * @param {boolean} isOnline - Online status
 */
const updateUserOnlineStatus = async (userId, isOnline) => {
  try {
    await User.findByIdAndUpdate(userId, {
      isOnline,
      lastSeen: new Date()
    });
  } catch (error) {
    logger.error('Error updating online status:', error.message);
  }
};

/**
 * Get connected users
 * @returns {Map} Connected users map
 */
export const getConnectedUsers = () => connectedUsers;

/**
 * Check if user is online
 * @param {string} userId - User ID
 * @returns {boolean} Is user online
 */
export const isUserOnline = (userId) => connectedUsers.has(userId);

/**
 * Get user socket ID
 * @param {string} userId - User ID
 * @returns {string|null} Socket ID or null
 */
export const getUserSocketId = (userId) => {
  const user = connectedUsers.get(userId);
  return user?.socketId || null;
};

export default {
  initializeSocket,
  getConnectedUsers,
  isUserOnline,
  getUserSocketId
};