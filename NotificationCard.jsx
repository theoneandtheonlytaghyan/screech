/**
 * NotificationCard Component
 * Individual notification display
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Mail,
  Trophy,
  Bell,
  Trash2,
  MoreHorizontal,
  Check
} from 'lucide-react';
import { timeAgo } from '../../utils/helpers';
import { NOTIFICATION_TYPES } from '../../utils/constants';
import Avatar from '../common/Avatar';
import { ConfirmModal } from '../common/Modal';

const NotificationCard = ({
  notification,
  onMarkAsRead,
  onDelete
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const navigate = useNavigate();

  const { type, message, sender, relatedPost, read, createdAt } = notification;

  // Get icon based on notification type
  const getIcon = () => {
    const iconProps = { size: 18 };

    switch (type) {
      case NOTIFICATION_TYPES.LIKE:
        return <Heart {...iconProps} className="text-red-500" />;
      case NOTIFICATION_TYPES.COMMENT:
        return <MessageCircle {...iconProps} className="text-blue-500" />;
      case NOTIFICATION_TYPES.MESSAGE:
        return <Mail {...iconProps} className="text-green-500" />;
      case NOTIFICATION_TYPES.CLAN_RANK:
        return <Trophy {...iconProps} className="text-yellow-500" />;
      case NOTIFICATION_TYPES.SYSTEM:
      default:
        return <Bell {...iconProps} className="text-screech-accent" />;
    }
  };

  // Get background color based on type
  const getIconBgColor = () => {
    switch (type) {
      case NOTIFICATION_TYPES.LIKE:
        return 'bg-red-500/10';
      case NOTIFICATION_TYPES.COMMENT:
        return 'bg-blue-500/10';
      case NOTIFICATION_TYPES.MESSAGE:
        return 'bg-green-500/10';
      case NOTIFICATION_TYPES.CLAN_RANK:
        return 'bg-yellow-500/10';
      case NOTIFICATION_TYPES.SYSTEM:
      default:
        return 'bg-screech-accent/10';
    }
  };

  // Handle click - navigate to related content
  const handleClick = () => {
    // Mark as read
    if (!read) {
      onMarkAsRead?.(notification._id);
    }

    // Navigate based on type
    switch (type) {
      case NOTIFICATION_TYPES.LIKE:
      case NOTIFICATION_TYPES.COMMENT:
        if (relatedPost) {
          navigate(`/post/${relatedPost._id || relatedPost}`);
        }
        break;
      case NOTIFICATION_TYPES.MESSAGE:
        navigate('/messages');
        break;
      case NOTIFICATION_TYPES.CLAN_RANK:
        navigate('/clans');
        break;
      default:
        if (sender) {
          navigate(`/user/${sender._id}`);
        }
    }
  };

  // Handle delete
  const handleDelete = async () => {
    await onDelete?.(notification._id);
    setShowDeleteModal(false);
  };

  return (
    <>
      <div
        className={`
          relative flex items-start gap-3 p-4 cursor-pointer transition-colors
          ${read
            ? 'bg-transparent hover:bg-screech-border/50'
            : 'bg-screech-accent/5 hover:bg-screech-accent/10'
          }
        `}
        onClick={handleClick}
      >
        {/* Unread Indicator */}
        {!read && (
          <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-screech-accent rounded-full" />
        )}

        {/* Avatar or Icon */}
        <div className="flex-shrink-0">
          {sender ? (
            <div className="relative">
              <Avatar
                username={sender.username}
                color={sender.avatarColor}
                emoji={sender.clan?.emoji}
                size="md"
              />
              {/* Type Icon Badge */}
              <div
                className={`
                  absolute -bottom-1 -right-1 p-1 rounded-full
                  ${getIconBgColor()}
                `}
              >
                {getIcon()}
              </div>
            </div>
          ) : (
            <div
              className={`
                w-12 h-12 rounded-full flex items-center justify-center
                ${getIconBgColor()}
              `}
            >
              {getIcon()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${read ? 'text-screech-textMuted' : 'text-screech-text'}`}>
            {sender && (
              <span
                className="font-semibold text-screech-accent hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/user/${sender._id}`);
                }}
              >
                {sender.username}
              </span>
            )}{' '}
            {formatMessage(message, sender)}
          </p>

          {/* Related Post Preview */}
          {relatedPost?.content && (
            <p className="mt-1 text-xs text-screech-textMuted truncate">
              "{relatedPost.content}"
            </p>
          )}

          {/* Time */}
          <p className="mt-1 text-xs text-screech-textMuted">
            {timeAgo(createdAt)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Mark as Read */}
          {!read && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead?.(notification._id);
              }}
              className="p-1.5 rounded-lg text-screech-textMuted hover:text-screech-accent hover:bg-screech-border transition-colors"
              title="Mark as read"
            >
              <Check size={16} />
            </button>
          )}

          {/* Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 rounded-lg text-screech-textMuted hover:text-screech-text hover:bg-screech-border transition-colors"
            >
              <MoreHorizontal size={16} />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-full mt-1 dropdown z-10"
                onClick={(e) => e.stopPropagation()}
              >
                {!read && (
                  <button
                    onClick={() => {
                      onMarkAsRead?.(notification._id);
                      setShowMenu(false);
                    }}
                    className="dropdown-item"
                  >
                    <Check size={14} />
                    Mark as read
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowDeleteModal(true);
                  }}
                  className="dropdown-item text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Notification"
        message="Are you sure you want to delete this notification?"
        confirmText="Delete"
        danger
      />
    </>
  );
};

/**
 * Format notification message
 * Remove sender name from message if present
 */
const formatMessage = (message, sender) => {
  if (!message) return '';

  // If sender exists and message starts with their username, remove it
  if (sender?.username && message.startsWith(sender.username)) {
    return message.replace(sender.username, '').trim();
  }

  return message;
};

/**
 * Notification Skeleton
 */
export const NotificationSkeleton = () => {
  return (
    <div className="flex items-start gap-3 p-4 animate-pulse">
      <div className="w-12 h-12 rounded-full bg-screech-border" />
      <div className="flex-1">
        <div className="h-4 bg-screech-border rounded w-3/4 mb-2" />
        <div className="h-3 bg-screech-border rounded w-1/4" />
      </div>
    </div>
  );
};

export default NotificationCard;