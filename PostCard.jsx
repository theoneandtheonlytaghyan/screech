/**
 * PostCard Component
 * Individual post display card
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Trash2,
  Flag,
  Copy,
  Send
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { timeAgo, copyToClipboard } from '../../utils/helpers';
import Avatar from '../common/Avatar';
import { IconButton } from '../common/Button';
import { ConfirmModal } from '../common/Modal';

const PostCard = ({
  post,
  onLike,
  onDelete,
  onComment,
  showFullContent = false,
  clickable = true
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [localLiked, setLocalLiked] = useState(post.isLiked);
  const [localLikesCount, setLocalLikesCount] = useState(post.likesCount || 0);

  const menuRef = useRef(null);
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();

  const isOwner = user?._id === post.author?._id;

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

  // Sync local state with props
  useEffect(() => {
    setLocalLiked(post.isLiked);
    setLocalLikesCount(post.likesCount || 0);
  }, [post.isLiked, post.likesCount]);

  // Handle like
  const handleLike = async (e) => {
    e.stopPropagation();

    if (!user) {
      navigate('/login');
      return;
    }

    if (isLiking) return;

    setIsLiking(true);

    // Optimistic update
    const wasLiked = localLiked;
    setLocalLiked(!wasLiked);
    setLocalLikesCount((prev) => wasLiked ? prev - 1 : prev + 1);

    try {
      await onLike?.(post);
    } catch (err) {
      // Revert on error
      setLocalLiked(wasLiked);
      setLocalLikesCount((prev) => wasLiked ? prev + 1 : prev - 1);
      showError('Failed to update like');
    } finally {
      setIsLiking(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await onDelete?.(post._id);
      setShowDeleteModal(false);
    } catch (err) {
      showError('Failed to delete post');
    }
  };

  // Handle share/copy link
  const handleShare = async (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post._id}`;
    
    const copied = await copyToClipboard(url);
    if (copied) {
      success('Link copied to clipboard!');
    } else {
      showError('Failed to copy link');
    }
    setShowMenu(false);
  };

  // Handle card click
  const handleCardClick = () => {
    if (clickable) {
      navigate(`/post/${post._id}`);
    }
  };

  // Handle message author
  const handleMessage = (e) => {
    e.stopPropagation();
    navigate(`/messages/new/${post.author._id}`);
    setShowMenu(false);
  };

  // Parse content with hashtags
  const renderContent = () => {
    const content = post.content || '';
    const parts = content.split(/(#\w+)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        const hashtag = part.slice(1);
        return (
          <span
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/hashtag/${hashtag}`);
            }}
            className="text-screech-accent hover:underline cursor-pointer"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };
    return (
    <>
      <article
        className={`
          card mb-4 transition-all duration-200
          ${clickable ? 'card-hover cursor-pointer' : ''}
        `}
        onClick={handleCardClick}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/user/${post.author?._id}`);
            }}
          >
            <Avatar
              username={post.author?.username}
              color={post.author?.avatarColor}
              emoji={post.author?.clan?.emoji}
              size="md"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-screech-accent hover:underline">
                  {post.author?.username || 'Anonymous'}
                </span>
                {post.author?.clan && (
                  <span className="text-sm" title={post.author.clan.name}>
                    {post.author.clan.emoji}
                  </span>
                )}
              </div>
              <span className="text-xs text-screech-textMuted">
                {timeAgo(post.createdAt)}
                {post.isEdited && ' • edited'}
              </span>
            </div>
          </div>

          {/* Menu */}
          <div className="relative" ref={menuRef}>
            <IconButton
              icon={MoreHorizontal}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
            />

            {showMenu && (
              <div className="dropdown">
                <button onClick={handleShare} className="dropdown-item">
                  <Copy size={16} />
                  Copy link
                </button>

                {user && !isOwner && (
                  <>
                    <button onClick={handleMessage} className="dropdown-item">
                      <Send size={16} />
                      Message
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                      }}
                      className="dropdown-item"
                    >
                      <Flag size={16} />
                      Report
                    </button>
                  </>
                )}

                {isOwner && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      setShowDeleteModal(true);
                    }}
                    className="dropdown-item text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          <p className="text-screech-text whitespace-pre-wrap break-words leading-relaxed">
            {renderContent()}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6 pt-3 border-t border-screech-border">
          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`
              flex items-center gap-2 text-sm transition-colors
              ${localLiked 
                ? 'text-red-500' 
                : 'text-screech-textMuted hover:text-red-500'
              }
              disabled:opacity-50
            `}
          >
            <Heart
              size={18}
              className={localLiked ? 'fill-current' : ''}
            />
            <span>{localLikesCount}</span>
          </button>

          {/* Comment Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onComment) {
                onComment(post);
              } else {
                navigate(`/post/${post._id}`);
              }
            }}
            className="flex items-center gap-2 text-sm text-screech-textMuted hover:text-screech-accent transition-colors"
          >
            <MessageCircle size={18} />
            <span>{post.commentsCount || 0}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-sm text-screech-textMuted hover:text-screech-accent transition-colors"
          >
            <Share2 size={18} />
          </button>
        </div>
      </article>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Hoot"
        message="Are you sure you want to delete this hoot? This action cannot be undone."
        confirmText="Delete"
        danger
      />
    </>
  );
};

export default PostCard;