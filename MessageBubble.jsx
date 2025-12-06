/**
 * MessageBubble Component
 * Individual message display in chat
 */

import { useState, useRef, useEffect } from 'react';
import { Check, CheckCheck, MoreHorizontal, Trash2, Copy } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { formatMessageTime, copyToClipboard } from '../../utils/helpers';
import { ConfirmModal } from '../common/Modal';

const MessageBubble = ({
  message,
  isOwn = false,
  onDelete,
  showAvatar = false,
  avatar = null
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const menuRef = useRef(null);
  const { success } = useToast();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle copy
  const handleCopy = async () => {
    const copied = await copyToClipboard(message.content);
    if (copied) {
      success('Message copied!');
    }
    setShowMenu(false);
  };

  // Handle delete
  const handleDelete = async () => {
    await onDelete?.(message._id);
    setShowDeleteModal(false);
  };

  return (
    <>
      <div
        className={`
          flex items-end gap-2 group
          ${isOwn ? 'justify-end' : 'justify-start'}
        `}
      >
        {/* Avatar (for received messages) */}
        {showAvatar && !isOwn && (
          <div className="flex-shrink-0 mb-5">
            {avatar}
          </div>
        )}

        {/* Message Container */}
        <div
          className={`
            relative max-w-[70%] sm:max-w-[60%]
            ${isOwn ? 'order-1' : 'order-2'}
          `}
        >
          {/* Menu Button */}
          <div
            ref={menuRef}
            className={`
              absolute top-1/2 -translate-y-1/2
              ${isOwn ? '-left-8' : '-right-8'}
              opacity-0 group-hover:opacity-100 transition-opacity
            `}
          >
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-full text-screech-textMuted hover:text-screech-text hover:bg-screech-border transition-colors"
            >
              <MoreHorizontal size={16} />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div
                className={`
                  absolute top-full mt-1 dropdown z-10
                  ${isOwn ? 'right-0' : 'left-0'}
                `}
              >
                <button onClick={handleCopy} className="dropdown-item">
                  <Copy size={14} />
                  Copy
                </button>
                {isOwn && (
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
                )}
              </div>
            )}
          </div>

          {/* Bubble */}
          <div
            className={`
              px-4 py-2.5 rounded-2xl break-words
              ${isOwn
                ? 'bg-screech-accent text-screech-dark rounded-br-md'
                : 'bg-screech-card border border-screech-border text-screech-text rounded-bl-md'
              }
            `}
          >
            {/* Content */}
            <p className="text-sm whitespace-pre-wrap">
              {renderContent(message.content)}
            </p>
          </div>

          {/* Time and Status */}
          <div
            className={`
              flex items-center gap-1 mt-1 text-xs text-screech-textMuted
              ${isOwn ? 'justify-end' : 'justify-start'}
            `}
          >
            <span>{formatMessageTime(message.createdAt)}</span>
            
            {/* Read Status (for own messages) */}
            {isOwn && (
              <span className="ml-1">
                {message.read ? (
                  <CheckCheck size={14} className="text-screech-accent" />
                ) : (
                  <Check size={14} />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Spacer for own messages */}
        {isOwn && <div className="w-8 flex-shrink-0 order-2" />}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Message"
        message="Are you sure you want to delete this message?"
        confirmText="Delete"
        danger
      />
    </>
  );
};

/**
 * Render message content with links
 */
const renderContent = (content) => {
  if (!content) return null;

  // URL regex
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  // Split content by URLs
  const parts = content.split(urlRegex);

  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:opacity-80"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

/**
 * System Message Component
 * For system notifications in chat
 */
export const SystemMessage = ({ message }) => {
  return (
    <div className="flex justify-center my-4">
      <div className="px-4 py-2 bg-screech-border rounded-full">
        <p className="text-xs text-screech-textMuted text-center">
          {message}
        </p>
      </div>
    </div>
  );
};

/**
 * Date Separator Component
 */
export const DateSeparator = ({ date }) => {
  const formatDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    }

    if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="flex items-center justify-center my-6">
      <div className="flex-1 h-px bg-screech-border" />
      <span className="px-4 text-xs text-screech-textMuted">
        {formatDate(date)}
      </span>
      <div className="flex-1 h-px bg-screech-border" />
    </div>
  );
};

/**
 * Typing Indicator Component
 */
export const TypingIndicator = ({ username }) => {
  return (
    <div className="flex items-end gap-2">
      <div className="px-4 py-3 bg-screech-card border border-screech-border rounded-2xl rounded-bl-md">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-screech-textMuted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-screech-textMuted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-screech-textMuted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
      <span className="text-xs text-screech-textMuted mb-1">
        {username} is typing...
      </span>
    </div>
  );
};

export default MessageBubble;