/**
 * ChatWindow Component
 * Main chat interface for conversations
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, MoreHorizontal, Trash2, Phone, Video, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { timeAgo } from '../../utils/helpers';
import Avatar from '../common/Avatar';
import { Skeleton } from '../common/Loader';
import { NoMessagesState } from '../common/EmptyState';
import { ConfirmModal } from '../common/Modal';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

const ChatWindow = ({
  conversation,
  messages = [],
  loading = false,
  loadingMore = false,
  hasMore = false,
  onSendMessage,
  onLoadMore,
  onDeleteMessage,
  onDeleteConversation,
  onBack,
  typingUser = null
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);

  const navigate = useNavigate();
  const { isUserOnline } = useSocket();

  const otherUser = conversation?.otherParticipant;
  const isOnline = isUserOnline(otherUser?._id) || otherUser?.isOnline;

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }, []);

  // Scroll to bottom on new messages if already at bottom
  useEffect(() => {
    if (isAtBottom && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isAtBottom, scrollToBottom]);

  // Initial scroll to bottom
  useEffect(() => {
    scrollToBottom(false);
  }, [conversation?._id]);

  // Handle scroll for infinite loading
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Check if at bottom
    const { scrollTop, scrollHeight, clientHeight } = container;
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50);

    // Load more when scrolling to top
    if (scrollTop < 100 && hasMore && !loadingMore) {
      onLoadMore?.();
    }
  }, [hasMore, loadingMore, onLoadMore]);

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

  // Handle delete conversation
  const handleDeleteConversation = async () => {
    await onDeleteConversation?.(conversation._id);
    setShowDeleteModal(false);
    onBack?.();
  };

  // Handle send message
  const handleSendMessage = async (content) => {
    const result = await onSendMessage?.(content);
    if (result?.success) {
      scrollToBottom();
    }
    return result;
  };

  // No conversation selected
  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-screech-dark">
        <div className="text-center">
          <span className="text-6xl mb-4 block">💬</span>
          <h3 className="text-lg font-semibold text-screech-text mb-2">
            Select a conversation
          </h3>
          <p className="text-sm text-screech-textMuted">
            Choose a conversation from the list or start a new one
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-screech-dark">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-screech-border bg-screech-card">
        <div className="flex items-center gap-3">
          {/* Back Button (Mobile) */}
          <button
            onClick={onBack}
            className="p-2 rounded-lg text-screech-textMuted hover:text-screech-text hover:bg-screech-border transition-colors md:hidden"
          >
            <ArrowLeft size={20} />
          </button>

          {/* User Info */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate(`/user/${otherUser?._id}`)}
          >
            <Avatar
              username={otherUser?.username}
              color={otherUser?.avatarColor}
              emoji={otherUser?.clan?.emoji}
              size="md"
              showStatus
              isOnline={isOnline}
            />
            <div>
              <h3 className="font-semibold text-screech-text hover:text-screech-accent">
                {otherUser?.username || 'Unknown User'}
              </h3>
              <p className="text-xs text-screech-textMuted">
                {isOnline ? (
                  <span className="text-green-500">Online</span>
                ) : otherUser?.lastSeen ? (
                  `Last seen ${timeAgo(otherUser.lastSeen)}`
                ) : (
                  'Offline'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(`/user/${otherUser?._id}`)}
            className="p-2 rounded-lg text-screech-textMuted hover:text-screech-text hover:bg-screech-border transition-colors"
            title="View profile"
          >
            <Info size={20} />
          </button>

          {/* Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg text-screech-textMuted hover:text-screech-text hover:bg-screech-border transition-colors"
            >
              <MoreHorizontal size={20} />
            </button>

            {showMenu && (
              <div className="dropdown right-0">
                <button
                  onClick={() => {
                    navigate(`/user/${otherUser?._id}`);
                    setShowMenu(false);
                  }}
                  className="dropdown-item"
                >
                  <Info size={14} />
                  View profile
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowDeleteModal(true);
                  }}
                  className="dropdown-item text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 size={14} />
                  Delete conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {/* Load More Indicator */}
        {loadingMore && (
          <div className="flex justify-center py-2">
            <div className="w-6 h-6 border-2 border-screech-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <MessageSkeleton key={index} isOwn={index % 2 === 0} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <NoMessagesState />
        ) : (
          <>
            {messages.map((message, index) => {
              const prevMessage = messages[index - 1];
              const showDate = !prevMessage ||
                new Date(message.createdAt).toDateString() !==
                new Date(prevMessage.createdAt).toDateString();

              return (
                <div key={message._id}>
                  {/* Date Separator */}
                  {showDate && (
                    <div className="flex items-center justify-center my-4">
                      <span className="px-3 py-1 bg-screech-border rounded-full text-xs text-screech-textMuted">
                        {new Date(message.createdAt).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}

                  <MessageBubble
                    message={message}
                    isOwn={message.sender?._id === conversation.participants?.find(
                      p => p._id !== otherUser?._id
                    )?._id || message.sender === conversation.participants?.find(
                      p => p._id !== otherUser?._id
                    )?._id}
                    onDelete={onDeleteMessage}
                  />
                </div>
              );
            })}

            {/* Typing Indicator */}
            {typingUser && (
              <div className="flex items-center gap-2 text-sm text-screech-textMuted">
                <Avatar
                  username={otherUser?.username}
                  color={otherUser?.avatarColor}
                  size="xs"
                />
                <span>{otherUser?.username} is typing</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-screech-textMuted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-screech-textMuted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-screech-textMuted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            )}

            {/* Scroll Anchor */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <MessageInput
        onSend={handleSendMessage}
        disabled={loading}
        recipientName={otherUser?.username}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConversation}
        title="Delete Conversation"
        message="Are you sure you want to delete this conversation? All messages will be permanently deleted."
        confirmText="Delete"
        danger
      />
    </div>
  );
};

/**
 * Message Skeleton
 */
const MessageSkeleton = ({ isOwn }) => {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        <Skeleton
          width={Math.random() > 0.5 ? '200px' : '150px'}
          height="50px"
          rounded="xl"
          className={isOwn ? 'bg-screech-accent/20' : ''}
        />
      </div>
    </div>
  );
};

export default ChatWindow;