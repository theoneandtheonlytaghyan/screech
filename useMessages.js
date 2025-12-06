/**
 * useMessages Hook
 * Manages messages and conversations state
 */

import { useState, useCallback, useEffect } from 'react';
import { messagesAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { getErrorMessage } from '../utils/helpers';
import { MESSAGES_PER_PAGE } from '../utils/constants';

export const useMessages = () => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    hasMore: false
  });

  const { error: showError } = useToast();
  const { subscribe, emitSendMessage, emitTyping, emitMessageRead } = useSocket();

  /**
   * Listen for real-time messages
   */
  useEffect(() => {
    const handleNewMessage = ({ message, conversationId, from }) => {
      // Add message if in current conversation
      if (currentConversation?._id === conversationId) {
        setMessages((prev) => [...prev, message]);
        
        // Mark as read
        emitMessageRead(from._id, conversationId);
      } else {
        // Increment unread count
        setUnreadCount((prev) => prev + 1);
      }

      // Update conversation list
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === conversationId
            ? { ...conv, lastMessage: message, lastMessageAt: new Date() }
            : conv
        ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
      );
    };

    const handleMessageRead = ({ conversationId }) => {
      // Update messages read status
      if (currentConversation?._id === conversationId) {
        setMessages((prev) =>
          prev.map((msg) => ({ ...msg, read: true }))
        );
      }
    };

    const unsubscribeMessage = subscribe('message:received', handleNewMessage);
    const unsubscribeRead = subscribe('message:read', handleMessageRead);

    return () => {
      unsubscribeMessage();
      unsubscribeRead();
    };
  }, [subscribe, currentConversation, emitMessageRead]);

  /**
   * Fetch conversations
   */
  const fetchConversations = useCallback(async () => {
    setLoading(true);

    try {
      const response = await messagesAPI.getConversations({ limit: 50 });
      const { conversations: convs } = response.data.data;

      setConversations(convs);
      return { success: true, conversations: convs };
    } catch (err) {
      const message = getErrorMessage(err);
      showError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [showError]);

  /**
   * Fetch messages for a conversation
   */
  const fetchMessages = useCallback(async (conversationId, page = 1) => {
    setLoadingMessages(true);

    try {
      const response = await messagesAPI.getConversationMessages(conversationId, {
        page,
        limit: MESSAGES_PER_PAGE
      });

      const { messages: msgs, pages, hasMore } = response.data.data;

      if (page === 1) {
        setMessages(msgs);
      } else {
        setMessages((prev) => [...msgs, ...prev]);
      }

      setPagination({ page, pages, hasMore });

      return { success: true, messages: msgs };
    } catch (err) {
      const message = getErrorMessage(err);
      showError(message);
      return { success: false, error: message };
    } finally {
      setLoadingMessages(false);
    }
  }, [showError]);

  /**
   * Load more messages
   */
  const loadMoreMessages = useCallback(async () => {
    if (loadingMessages || !pagination.hasMore || !currentConversation) return;

    return fetchMessages(currentConversation._id, pagination.page + 1);
  }, [loadingMessages, pagination, currentConversation, fetchMessages]);

  /**
   * Open conversation
   */
  const openConversation = useCallback(async (conversationOrUserId) => {
    try {
      let conversation;

      // Check if it's a conversation object or user ID
      if (typeof conversationOrUserId === 'string') {
        // Get or create conversation with user
        const response = await messagesAPI.getOrCreateConversation(conversationOrUserId);
        conversation = response.data.data.conversation;
      } else {
        conversation = conversationOrUserId;
      }

      setCurrentConversation(conversation);

      // Fetch messages
      await fetchMessages(conversation._id, 1);

      // Mark as read
      await messagesAPI.markAsRead(conversation._id);

      // Update unread count in conversations
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === conversation._id
            ? { ...conv, myUnreadCount: 0 }
            : conv
        )
      );

      return { success: true, conversation };
    } catch (err) {
      const message = getErrorMessage(err);
      showError(message);
      return { success: false, error: message };
    }
  }, [fetchMessages, showError]);

  /**
   * Close current conversation
   */
  const closeConversation = useCallback(() => {
    setCurrentConversation(null);
    setMessages([]);
    setPagination({ page: 1, pages: 1, hasMore: false });
  }, []);

  /**
   * Send message
   */
  const sendMessage = useCallback(async (content) => {
    if (!currentConversation) return { success: false, error: 'No conversation selected' };

    const recipientId = currentConversation.otherParticipant?._id;

    if (!recipientId) return { success: false, error: 'No recipient found' };

    try {
      const response = await messagesAPI.send({
        recipientId,
        content
      });

      const newMessage = response.data.data.message;

      // Add message to list
      setMessages((prev) => [...prev, newMessage]);

      // Update conversation
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === currentConversation._id
            ? { ...conv, lastMessage: newMessage, lastMessageAt: new Date() }
            : conv
        ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
      );

      // Emit socket event
      emitSendMessage(recipientId, newMessage, currentConversation._id);

      return { success: true, message: newMessage };
    } catch (err) {
      const message = getErrorMessage(err);
      showError(message);
      return { success: false, error: message };
    }
  }, [currentConversation, emitSendMessage, showError]);

  /**
   * Delete message
   */
  const deleteMessage = useCallback(async (messageId) => {
    try {
      await messagesAPI.deleteMessage(messageId);

      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));

      return { success: true };
    } catch (err) {
      const message = getErrorMessage(err);
      showError(message);
      return { success: false, error: message };
    }
  }, [showError]);

  /**
   * Delete conversation
   */
  const deleteConversation = useCallback(async (conversationId) => {
    try {
      await messagesAPI.deleteConversation(conversationId);

      setConversations((prev) => prev.filter((conv) => conv._id !== conversationId));

      if (currentConversation?._id === conversationId) {
        closeConversation();
      }

      return { success: true };
    } catch (err) {
      const message = getErrorMessage(err);
      showError(message);
      return { success: false, error: message };
    }
  }, [currentConversation, closeConversation, showError]);

  /**
   * Fetch unread count
   */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await messagesAPI.getUnreadCount();
      const { unreadCount: count } = response.data.data;
      setUnreadCount(count);
      return count;
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
      return 0;
    }
  }, []);

  /**
   * Send typing indicator
   */
  const sendTypingIndicator = useCallback((isTyping) => {
    if (!currentConversation) return;

    const recipientId = currentConversation.otherParticipant?._id;
    if (recipientId) {
      emitTyping(recipientId, currentConversation._id, isTyping);
    }
  }, [currentConversation, emitTyping]);

  return {
    conversations,
    currentConversation,
    messages,
    loading,
    loadingMessages,
    unreadCount,
    pagination,
    fetchConversations,
    fetchMessages,
    loadMoreMessages,
    openConversation,
    closeConversation,
    sendMessage,
    deleteMessage,
    deleteConversation,
    fetchUnreadCount,
    sendTypingIndicator
  };
};

export default useMessages;