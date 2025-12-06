/**
 * Notifications Page
 * Display and manage user notifications
 */

import { useState, useEffect } from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import NotificationCard from '../components/notifications/NotificationCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'

  const { socket } = useSocket();
  const { showToast } = useToast();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = filter === 'unread' 
        ? '/notifications?unreadOnly=true'
        : '/notifications';
      
      const response = await api.get(url);
      const { notifications: data, unreadCount: count } = response.data.data;
      
      setNotifications(data);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  // Listen for new notifications via socket
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      showToast(notification.message, 'info');
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket, showToast]);

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
      showToast('All notifications marked as read', 'success');
    } catch (err) {
      console.error('Error marking all as read:', err);
      showToast('Failed to mark as read', 'error');
    }
  };

  // Clear all notifications
  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) {
      return;
    }

    try {
      await api.delete('/notifications/all');
      setNotifications([]);
      setUnreadCount(0);
      showToast('All notifications cleared', 'success');
    } catch (err) {
      console.error('Error clearing notifications:', err);
      showToast('Failed to clear notifications', 'error');
    }
  };

  // Handle notification read
  const handleNotificationRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif._id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Handle notification delete
  const handleNotificationDelete = (notificationId) => {
    setNotifications(prev =>
      prev.filter(notif => notif._id !== notificationId)
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-screech-text flex items-center">
              <Bell className="mr-2" size={28} />
              Notifications
            </h1>
            {unreadCount > 0 && (
              <p className="text-screech-textMuted mt-1">
                {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            {notifications.length > 0 && unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center px-4 py-2 bg-screech-card border border-screech-border rounded-lg text-screech-text hover:bg-screech-hover transition-colors"
              >
                <CheckCheck size={18} className="mr-2" />
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center px-4 py-2 bg-screech-card border border-screech-border rounded-lg text-red-400 hover:bg-screech-hover transition-colors"
              >
                <Trash2 size={18} className="mr-2" />
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-screech-accent text-screech-dark'
                : 'bg-screech-card text-screech-textMuted hover:bg-screech-hover'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-screech-accent text-screech-dark'
                : 'bg-screech-card text-screech-textMuted hover:bg-screech-hover'
            }`}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4">
          <ErrorMessage message={error} />
        </div>
      )}

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="bg-screech-card rounded-lg border border-screech-border p-12 text-center">
          <Bell className="mx-auto mb-4 text-screech-textMuted" size={48} />
          <p className="text-screech-textMuted text-lg mb-2">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
          <p className="text-screech-textDark text-sm">
            {filter === 'unread' 
              ? 'You\'re all caught up!'
              : 'Notifications will appear here when someone interacts with your hoots'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification._id}
              notification={notification}
              onRead={handleNotificationRead}
              onDelete={handleNotificationDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;