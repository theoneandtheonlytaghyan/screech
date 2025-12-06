/**
 * NotificationList Component
 * Displays list of notifications
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Check, CheckCheck, Trash2, Bell, Filter } from 'lucide-react';
import NotificationCard, { NotificationSkeleton } from './NotificationCard';
import Button from '../common/Button';
import { NoNotificationsState } from '../common/EmptyState';
import { ConfirmModal } from '../common/Modal';
import { NOTIFICATION_TYPES } from '../../utils/constants';

const NotificationList = ({
  notifications = [],
  loading = false,
  loadingMore = false,
  hasMore = false,
  unreadCount = 0,
  onLoadMore,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onDeleteAll
}) => {
  const [filter, setFilter] = useState('all');
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);
  const filterMenuRef = useRef(null);

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: NOTIFICATION_TYPES.LIKE, label: 'Likes', icon: '❤️' },
    { value: NOTIFICATION_TYPES.COMMENT, label: 'Comments', icon: '💬' },
    { value: NOTIFICATION_TYPES.MESSAGE, label: 'Messages', icon: '✉️' },
    { value: NOTIFICATION_TYPES.CLAN_RANK, label: 'Clan', icon: '🏆' },
    { value: NOTIFICATION_TYPES.SYSTEM, label: 'System', icon: '🔔' }
  ];

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.type === filter;
  });

  // Infinite scroll
  const handleObserver = useCallback((entries) => {
    const [target] = entries;
    if (target.isIntersecting && hasMore && !loading && !loadingMore) {
      onLoadMore?.();
    }
  }, [hasMore, loading, loadingMore, onLoadMore]);

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  // Close filter menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target)) {
        setShowFilterMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle delete all
  const handleDeleteAll = async () => {
    await onDeleteAll?.();
    setShowDeleteAllModal(false);
  };

  return (
    <div>
      {/* Header Actions */}
      <div className="flex items-center justify-between p-4 border-b border-screech-border sticky top-0 bg-screech-card z-10">
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-screech-accent" />
          <h2 className="font-semibold text-screech-text">Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-screech-accent text-screech-dark text-xs font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="relative" ref={filterMenuRef}>
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`
                p-2 rounded-lg transition-colors
                ${filter !== 'all'
                  ? 'bg-screech-accent/10 text-screech-accent'
                  : 'text-screech-textMuted hover:text-screech-text hover:bg-screech-border'
                }
              `}
              title="Filter"
            >
              <Filter size={18} />
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-1 dropdown w-48 z-20">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilter(option.value);
                      setShowFilterMenu(false);
                    }}
                    className={`
                      dropdown-item
                      ${filter === option.value ? 'bg-screech-accent/10 text-screech-accent' : ''}
                    `}
                  >
                    {option.icon && <span>{option.icon}</span>}
                    <span>{option.label}</span>
                    {filter === option.value && <Check size={14} className="ml-auto" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mark All as Read */}
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="p-2 rounded-lg text-screech-textMuted hover:text-screech-accent hover:bg-screech-border transition-colors"
              title="Mark all as read"
            >
              <CheckCheck size={18} />
            </button>
          )}

          {/* Delete All */}
          {notifications.length > 0 && (
            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="p-2 rounded-lg text-screech-textMuted hover:text-red-500 hover:bg-red-500/10 transition-colors"
              title="Delete all"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Indicator */}
      {filter !== 'all' && (
        <div className="px-4 py-2 bg-screech-dark border-b border-screech-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-screech-textMuted">
              Showing: <span className="text-screech-accent">{filterOptions.find(f => f.value === filter)?.label}</span>
            </span>
            <button
              onClick={() => setFilter('all')}
              className="text-xs text-screech-accent hover:underline"
            >
              Clear filter
            </button>
          </div>
        </div>
      )}

      {/* Notifications List */}
      {loading && notifications.length === 0 ? (
        <div className="divide-y divide-screech-border">
          {Array.from({ length: 5 }).map((_, index) => (
            <NotificationSkeleton key={index} />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        filter !== 'all' ? (
          <div className="text-center py-12">
            <span className="text-4xl mb-4 block">🔍</span>
            <p className="text-screech-textMuted">
              No {filterOptions.find(f => f.value === filter)?.label.toLowerCase()} notifications
            </p>
            <button
              onClick={() => setFilter('all')}
              className="mt-2 text-screech-accent text-sm hover:underline"
            >
              View all notifications
            </button>
          </div>
        ) : (
          <NoNotificationsState />
        )
      ) : (
        <div className="divide-y divide-screech-border">
          {filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification._id}
              notification={notification}
              onMarkAsRead={onMarkAsRead}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* Load More Trigger */}
      <div ref={loadMoreRef} className="h-4" />

      {/* Loading More */}
      {loadingMore && (
        <div className="divide-y divide-screech-border">
          {Array.from({ length: 3 }).map((_, index) => (
            <NotificationSkeleton key={index} />
          ))}
        </div>
      )}

      {/* End of List */}
      {!hasMore && filteredNotifications.length > 0 && (
        <div className="text-center py-8">
          <p className="text-xs text-screech-textMuted">
            No more notifications
          </p>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        onConfirm={handleDeleteAll}
        title="Delete All Notifications"
        message="Are you sure you want to delete all notifications? This action cannot be undone."
        confirmText="Delete All"
        danger
      />
    </div>
  );
};

/**
 * Notification Badge Component
 * For displaying in navbar
 */
export const NotificationBadge = ({ count = 0, onClick }) => {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-lg text-screech-textMuted hover:text-screech-text hover:bg-screech-border transition-colors"
    >
      <Bell size={20} />
      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1">
        {count > 99 ? '99+' : count}
      </span>
    </button>
  );
};

export default NotificationList;