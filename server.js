/**
 * Screech Backend Server
 * Main entry point for the application
 */

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import configurations
import connectDatabase from './config/database.js';

// Import middleware
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';

// Import routes
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import commentRoutes from './routes/comments.js';
import messageRoutes from './routes/messages.js';
import notificationRoutes from './routes/notifications.js';
import userRoutes from './routes/users.js';
import clanRoutes from './routes/clans.js';
import searchRoutes from './routes/search.js';

// Import socket handler
import { initializeSocket } from './socket/socketHandler.js';

// Import utilities
import { logger } from './utils/logger.js';

// Initialize express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Connect to database
connectDatabase();

// Initialize socket handlers
initializeSocket(io);

// Make io accessible to routes
app.set('io', io);

/**
 * Middleware
 */

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rate limiting
app.use('/api', apiLimiter);

/**
 * Health Check
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Screech API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clans', clanRoutes);
app.use('/api/search', searchRoutes);

/**
 * API Documentation
 */
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Screech API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me'
      },
      posts: {
        create: 'POST /api/posts',
        getAll: 'GET /api/posts',
        getOne: 'GET /api/posts/:id',
        update: 'PUT /api/posts/:id',
        delete: 'DELETE /api/posts/:id',
        like: 'POST /api/posts/:id/like',
        unlike: 'DELETE /api/posts/:id/like'
      },
      comments: {
        create: 'POST /api/comments',
        getPostComments: 'GET /api/comments/post/:postId',
        getReplies: 'GET /api/comments/:id/replies',
        update: 'PUT /api/comments/:id',
        delete: 'DELETE /api/comments/:id',
        like: 'POST /api/comments/:id/like',
        unlike: 'DELETE /api/comments/:id/like'
      },
      messages: {
        send: 'POST /api/messages',
        getConversations: 'GET /api/messages/conversations',
        getMessages: 'GET /api/messages/conversations/:conversationId',
        markRead: 'PUT /api/messages/conversations/:conversationId/read',
        delete: 'DELETE /api/messages/:id'
      },
      notifications: {
        getAll: 'GET /api/notifications',
        getUnreadCount: 'GET /api/notifications/unread/count',
        markRead: 'PUT /api/notifications/:id/read',
        markAllRead: 'PUT /api/notifications/read-all',
        delete: 'DELETE /api/notifications/:id',
        deleteAll: 'DELETE /api/notifications/all'
      },
      users: {
        getProfile: 'GET /api/users/:id',
        getStats: 'GET /api/users/:id/stats',
        getPosts: 'GET /api/users/:id/posts',
        regenerateIdentity: 'POST /api/users/regenerate-identity',
        leaderboard: 'GET /api/users/leaderboard'
      },
      clans: {
        getAll: 'GET /api/clans',
        getLeaderboard: 'GET /api/clans/leaderboard',
        getOne: 'GET /api/clans/:name',
        getMembers: 'GET /api/clans/:name/members',
        getStats: 'GET /api/clans/:name/stats'
      },
      search: {
        searchAll: 'GET /api/search',
        searchPosts: 'GET /api/search/posts',
        searchUsers: 'GET /api/search/users',
        trending: 'GET /api/search/trending',
        hashtag: 'GET /api/search/hashtag/:hashtag'
      }
    }
  });
});

/**
 * Error Handling
 */
app.use(notFound);
app.use(errorHandler);

/**
 * Start Server
 */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`🦉 Screech server running on port ${PORT}`);
  logger.info(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 API URL: http://localhost:${PORT}/api`);
  logger.info(`💚 Health check: http://localhost:${PORT}/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err.message);
  process.exit(1);
});

export default app;