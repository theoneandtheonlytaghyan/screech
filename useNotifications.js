/**
 * useNotifications Hook
 * Manages notifications state and operations
 */

import { useState, useCallback, useEffect } from 'react';
import { notificationsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { getErrorMessage } from '../utils/helpers';
import { NOTIFICATIONS_PER_PAGE } from '../utils/constants';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    hasMore: false
  });

  const { error: showError } = useToast();
  const { subscribe } = useSocket();

  /**
   * Listen for real-time notifications
   */
  useEffect(() => {
    const handleNewNotification = (notification) => {
      // Add to beginning of list
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      setPagination((prev) => ({ ...prev, total: prev.total + 1 }));
    };

    const unsubscribe = subscribe('notification:new', handleNewNotification);

    return () => {
      unsubscribe();
    };
  }, [subscribe]);

  /**
   * Fetch notifications
   */
  const fetchNotifications = useCallback(async (params = {}) => {
    setLoading(true);

    try {
      const response = await notificationsAPI.getAll({
        page: 1,
        limit: NOTIFICATIONS_PER_PAGE,
        ...params
      });

      const { notifications: notifs, page, pages, total, hasMore } = response.data.data;

      setNotifications(notifs);
      setPagination({ page, pages, total, hasMore });

      return { success: true, notifications: notifs };
    } catch (err) {
      const message = getErrorMessage(err);
      showError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [showError]);

  /**
   * Load more notifications
   */
  const loadMore = useCallback(async () => {
    if (loading || !pagination.hasMore) return;

    setLoading(true);

    try {
      const response = await notificationsAPI.getAll({
        page: pagination.page + 1,
        limit: NOTIFICATIONS_PER_PAGE
      });

      const { notifications: newNotifs, page, pages, total, hasMore } = response.data.data;

      setNotifications((prev) => [...prev, ...newNotifs]);
      setPagination({ page, pages, total, hasMore });

      return { success: true };
    } catch (err) {
      const message = getErrorMessage(err);
      showError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [loading, pagination, showError]);

  /**
   * Fetch unread count
   */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      const { unreadCount: count } = response.data.data;
      setUnreadCount(count);
      return count;
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
      return 0;
    }
  }, []);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId);

      // Update notification in list
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId
            ? { ...notif, read: true }
            : notif
        )
      );

      // Decrement unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));

      return { success: true };
    } catch (err) {
      const message = getErrorMessage(err);
      showError(message);
      return { success: false, error: message };
    }
  }, [showError]);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsAPI.markAllAsRead();

      // Update all notifications
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );

      // Reset unread count
      setUnreadCount(0);

      return { success: true };
    } catch (err) {
      const message = getErrorMessage(err);
      showError(message);
      return { success: false, error: message };
    }
  }, [showError]);

  /**
   * Delete notification
   */
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      // Find notification to check if unread
      const notification = notifications.find((n) => n._id === notificationId);

      await notificationsAPI.delete(notificationId);

      // Remove from list
      setNotifications((prev) => prev.filter((notif) => notif._id !== notificationId));
      setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));

      // Decrement unread count if was unread
      if (notification && !notification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      return { success: true };
    } catch (err) {
      const message = getErrorMessage(err);
      showError(message);
      return { success: false, error: message };
    }
  }, [notifications, showError]);

  /**
   * Delete all notifications
   */
  const deleteAllNotifications = useCallback(async () => {
    try {
      await notificationsAPI.deleteAll();

      // Clear all
      setNotifications([]);
      setUnreadCount(0);
      setPagination({ page: 1, pages: 1, total: 0, hasMore: false });

      return { success: true };
    } catch (err) {
      const message = getErrorMessage(err);
      showError(message);
      return { success: false, error: message };
    }
  }, [showError]);

  /**
   * Add notification locally
   */
  const addNotification = useCallback((notification) => {
    setNotifications((prev) => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount((prev) => prev + 1);
    }
    setPagination((prev) => ({ ...prev, total: prev.total + 1 }));
  }, []);

  /**
   * Clear notifications
   */
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setPagination({ page: 1, pages: 1, total: 0, hasMore: false });
  }, []);

  return {
    notifications,
    loading,
    unreadCount,
    pagination,
    fetchNotifications,
    loadMore,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    addNotification,
    clearNotifications
  };
};

export default useNotifications;