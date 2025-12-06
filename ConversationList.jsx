/**
 * ConversationList Component
 * Displays list of conversations in messages
 */

import { useState } from 'react';
import { Search, Plus, MoreHorizontal, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { timeAgo, truncateText } from '../../utils/helpers';
import Avatar from '../common/Avatar';
import { Skeleton } from '../common/Loader';
import { NoConversationsState } from '../common/EmptyState';
import { ConfirmModal } from '../common/Modal';

const ConversationList = ({
  conversations = [],
  loading = false,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { user } = useAuth();

  // Filter conversations by search
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    
    const otherUser = conv.otherParticipant;
    return otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Handle delete
  const handleDelete = async () => {
    if (deleteTarget) {
      await onDeleteConversation?.(deleteTarget);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-screech-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-screech-text">Messages</h2>
          <button
            onClick={onNewConversation}
            className="p-2 rounded-lg bg-screech-accent text-screech-dark hover:bg-screech-accentHover transition-colors"
            title="New message"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-screech-textMuted"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="input pl-10 py-2 text-sm"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <ConversationSkeleton key={index} />
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          searchQuery ? (
            <div className="p-4 text-center">
              <p className="text-screech-textMuted text-sm">
                No conversations found for "{searchQuery}"
              </p>
            </div>
          ) : (
            <NoConversationsState />
          )
        ) : (
          <div className="divide-y divide-screech-border">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation._id}
                conversation={conversation}
                isActive={activeConversationId === conversation._id}
                currentUserId={user?._id}
                onClick={() => onSelectConversation(conversation)}
                onDelete={() => setDeleteTarget(conversation._id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Conversation"
        message="Are you sure you want to delete this conversation? All messages will be permanently deleted."
        confirmText="Delete"
        danger
      />
    </div>
  );
};

/**
 * Conversation Item Component
 */
const ConversationItem = ({
  conversation,
  isActive,
  currentUserId,
  onClick,
  onDelete
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const otherUser = conversation.otherParticipant;
  const lastMessage = conversation.lastMessage;
  const unreadCount = conversation.myUnreadCount || 0;

  // Determine if last message was from current user
  const isOwnLastMessage = lastMessage?.sender === currentUserId ||
    lastMessage?.sender?._id === currentUserId;

  return (
    <div
      className={`
        relative flex items-center gap-3 p-4 cursor-pointer transition-colors
        ${isActive 
          ? 'bg-screech-accent/10 border-l-2 border-screech-accent' 
          : 'hover:bg-screech-border'
        }
      `}
      onClick={onClick}
    >
      {/* Avatar */}
      <Avatar
        username={otherUser?.username}
        color={otherUser?.avatarColor}
        emoji={otherUser?.clan?.emoji}
        size="md"
        showStatus
        isOnline={otherUser?.isOnline}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className={`font-semibold truncate ${unreadCount > 0 ? 'text-screech-text' : 'text-screech-accent'}`}>
            {otherUser?.username || 'Unknown User'}
          </span>
          <span className="text-xs text-screech-textMuted flex-shrink-0 ml-2">
            {lastMessage ? timeAgo(conversation.lastMessageAt) : ''}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <p className={`text-sm truncate ${unreadCount > 0 ? 'text-screech-text font-medium' : 'text-screech-textMuted'}`}>
            {lastMessage ? (
              <>
                {isOwnLastMessage && <span className="text-screech-textMuted">You: </span>}
                {truncateText(lastMessage.content, 40)}
              </>
            ) : (
              <span className="italic">No messages yet</span>
            )}
          </p>

          {/* Unread Badge */}
          {unreadCount > 0 && (
            <span className="ml-2 min-w-[20px] h-5 flex items-center justify-center bg-screech-accent text-screech-dark text-xs font-bold rounded-full px-1.5">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Menu Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        className="p-1.5 rounded-lg text-screech-textMuted hover:text-screech-text hover:bg-screech-border opacity-0 group-hover:opacity-100 transition-all"
      >
        <MoreHorizontal size={16} />
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <div
          className="absolute right-4 top-12 dropdown z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              onDelete();
              setShowMenu(false);
            }}
            className="dropdown-item text-red-500 hover:bg-red-500/10"
          >
            <Trash2 size={14} />
            Delete conversation
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Conversation Skeleton
 */
const ConversationSkeleton = () => {
  return (
    <div className="flex items-center gap-3 animate-pulse">
      <Skeleton width="48px" height="48px" rounded="full" />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <Skeleton width="100px" height="14px" />
          <Skeleton width="40px" height="12px" />
        </div>
        <Skeleton width="80%" height="12px" />
      </div>
    </div>
  );
};

export default ConversationList;