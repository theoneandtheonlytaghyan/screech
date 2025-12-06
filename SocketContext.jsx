/**
 * Socket Context
 * Manages WebSocket connections for real-time features
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SOCKET_URL } from '../utils/constants';

// Create context
const SocketContext = createContext(null);

/**
 * Socket Provider Component
 */
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const { token, isAuthenticated, user } = useAuth();

  /**
   * Initialize socket connection
   */
  useEffect(() => {
    if (!isAuthenticated || !token) {
      // Disconnect if not authenticated
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Create socket connection
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('🔌 Socket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error.message);
      setIsConnected(false);
    });

    // User online/offline events
    newSocket.on('user:online', ({ userId }) => {
      setOnlineUsers((prev) => new Set([...prev, userId]));
    });

    newSocket.on('user:offline', ({ userId }) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, token]);

  /**
   * Emit new post event
   */
  const emitNewPost = useCallback((post) => {
    if (socket && isConnected) {
      socket.emit('post:new', post);
    }
  }, [socket, isConnected]);

  /**
   * Emit post like event
   */
  const emitPostLike = useCallback((postId, authorId) => {
    if (socket && isConnected) {
      socket.emit('post:like', { postId, authorId });
    }
  }, [socket, isConnected]);

  /**
   * Emit new comment event
   */
  const emitNewComment = useCallback((postId, authorId, comment) => {
    if (socket && isConnected) {
      socket.emit('comment:new', { postId, authorId, comment });
    }
  }, [socket, isConnected]);

  /**
   * Emit send message event
   */
  const emitSendMessage = useCallback((recipientId, message, conversationId) => {
    if (socket && isConnected) {
      socket.emit('message:send', { recipientId, message, conversationId });
    }
  }, [socket, isConnected]);

  /**
   * Emit typing indicator
   */
  const emitTyping = useCallback((recipientId, conversationId, isTyping) => {
    if (socket && isConnected) {
      socket.emit('message:typing', { recipientId, conversationId, isTyping });
    }
  }, [socket, isConnected]);

  /**
   * Emit message read event
   */
  const emitMessageRead = useCallback((senderId, conversationId) => {
    if (socket && isConnected) {
      socket.emit('message:read', { senderId, conversationId });
    }
  }, [socket, isConnected]);

  /**
   * Emit clan message
   */
  const emitClanMessage = useCallback((message) => {
    if (socket && isConnected) {
      socket.emit('clan:message', { message });
    }
  }, [socket, isConnected]);

  /**
   * Subscribe to event
   */
  const subscribe = useCallback((event, callback) => {
    if (socket) {
      socket.on(event, callback);
      return () => socket.off(event, callback);
    }
    return () => {};
  }, [socket]);

  /**
   * Unsubscribe from event
   */
  const unsubscribe = useCallback((event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  }, [socket]);

  /**
   * Check if user is online
   */
  const isUserOnline = useCallback((userId) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  // Context value
  const value = {
    socket,
    isConnected,
    onlineUsers,
    emitNewPost,
    emitPostLike,
    emitNewComment,
    emitSendMessage,
    emitTyping,
    emitMessageRead,
    emitClanMessage,
    subscribe,
    unsubscribe,
    isUserOnline
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

/**
 * useSocket Hook
 */
export const useSocket = () => {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }

  return context;
};

export default SocketContext;