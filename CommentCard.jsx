/**
 * CommentCard Component
 * Individual comment display
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Trash2,
  Flag,
  Send,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { commentsAPI } from '../../services/api';
import { timeAgo } from '../../utils/helpers';
import Avatar from '../common/Avatar';
import { IconButton } from '../common/Button';
import { ConfirmModal } from '../common/Modal';
import { Skeleton } from '../common/Loader';
import CommentForm from './CommentForm';

const CommentCard = ({
  comment,
  postId,
  onDelete,
  onReply,
  depth = 0,
  maxDepth = 2
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [localLiked, setLocalLiked] = useState(comment.isLiked);
  const [localLikesCount, setLocalLikesCount] = useState(comment.likesCount || 0);

  const menuRef = useRef(null);
  const { user } = useAuth();
  const { error: showError } = useToast();
  const navigate = useNavigate();

  const isOwner = user?._id === comment.author?._id;
  const hasReplies = comment.repliesCount > 0;
  const canReply = depth < maxDepth;

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
    setLocalLiked(comment.isLiked);
    setLocalLikesCount(comment.likesCount || 0);
  }, [comment.isLiked, comment.likesCount]);

  // Load replies
  const loadReplies = async () => {
    if (loadingReplies) return;

    setLoadingReplies(true);

    try {
      const response = await commentsAPI.getReplies(comment._id);
      setReplies(response.data.data.replies || []);
      setShowReplies(true);
    } catch (err) {
      showError('Failed to load replies');
    } finally {
      setLoadingReplies(false);
    }
  };

  // Toggle replies
  const handleToggleReplies = () => {
    if (showReplies) {
      setShowReplies(false);
    } else if (replies.length > 0) {
      setShowReplies(true);
    } else {
      loadReplies();
    }
  };

  // Handle like
  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (isLiking) return;

    setIsLiking(true);

    const wasLiked = localLiked;
    setLocalLiked(!wasLiked);
    setLocalLikesCount((prev) => wasLiked ? prev - 1 : prev + 1);

    try {
      if (wasLiked) {
        await commentsAPI.unlike(comment._id);
      } else {
        await commentsAPI.like(comment._id);
      }
    } catch (err) {
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
      await onDelete?.(comment._id);
      setShowDeleteModal(false);
    } catch (err) {
      showError('Failed to delete comment');
    }
  };

  // Handle reply submitted
  const handleReplySubmitted = (newReply) => {
    setReplies((prev) => [...prev, newReply]);
    setShowReplyForm(false);
    setShowReplies(true);
  };

  // Handle reply deleted
  const handleReplyDeleted = (replyId) => {
    setReplies((prev) => prev.filter((r) => r._id !== replyId));
  };

  // Parse content with hashtags
  const renderContent = () => {
    const content = comment.content || '';
    const parts = content.split(/(#\w+)/g);

    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        const hashtag = part.slice(1);
        return (
          <span
            key={index}
            onClick={() => navigate(`/hashtag/${hashtag}`)}
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
      <div
        className={`
          py-3
          ${depth > 0 ? 'ml-8 pl-4 border-l-2 border-screech-border' : ''}
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate(`/user/${comment.author?._id}`)}
          >
            <Avatar
              username={comment.author?.username}
              color={comment.author?.avatarColor}
              emoji={comment.author?.clan?.emoji}
              size="sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-screech-accent hover:underline">
                  {comment.author?.username || 'Anonymous'}
                </span>
                {comment.author?.clan && (
                  <span className="text-xs">{comment.author.clan.emoji}</span>
                )}
              </div>
              <span className="text-xs text-screech-textMuted">
                {timeAgo(comment.createdAt)}
                {comment.isEdited && ' • edited'}
              </span>
            </div>
          </div>

          {/* Menu */}
          <div className="relative" ref={menuRef}>
            <IconButton
              icon={MoreHorizontal}
              size="sm"
              onClick={() => setShowMenu(!showMenu)}
            />

            {showMenu && (
              <div className="dropdown">
                {user && !isOwner && (
                  <>
                    <button
                      onClick={() => {
                        navigate(`/messages/new/${comment.author._id}`);
                        setShowMenu(false);
                      }}
                      className="dropdown-item"
                    >
                      <Send size={14} />
                      Message
                    </button>
                    <button className="dropdown-item">
                      <Flag size={14} />
                      Report
                    </button>
                  </>
                )}

                {isOwner && (
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
        </div>

        {/* Content */}
        <p className="text-sm text-screech-text whitespace-pre-wrap break-words mb-2">
          {renderContent()}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Like */}
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`
              flex items-center gap-1.5 text-xs transition-colors
              ${localLiked
                ? 'text-red-500'
                : 'text-screech-textMuted hover:text-red-500'
              }
            `}
          >
            <Heart size={14} className={localLiked ? 'fill-current' : ''} />
            <span>{localLikesCount}</span>
          </button>

          {/* Reply */}
          {canReply && user && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-1.5 text-xs text-screech-textMuted hover:text-screech-accent transition-colors"
            >
              <MessageCircle size={14} />
              <span>Reply</span>
            </button>
          )}

          {/* View Replies */}
          {hasReplies && (
            <button
              onClick={handleToggleReplies}
              className="flex items-center gap-1.5 text-xs text-screech-accent hover:underline"
            >
              {showReplies ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span>
                {showReplies ? 'Hide' : `View ${comment.repliesCount}`} {comment.repliesCount === 1 ? 'reply' : 'replies'}
              </span>
            </button>
          )}
        </div>

        {/* Reply Form */}
        {showReplyForm && (
          <div className="mt-3">
            <CommentForm
              postId={postId}
              parentCommentId={comment._id}
              onSubmit={handleReplySubmitted}
              onCancel={() => setShowReplyForm(false)}
              placeholder={`Reply to ${comment.author?.username}...`}
              autoFocus
              compact
            />
          </div>
        )}

        {/* Replies */}
        {loadingReplies && (
          <div className="mt-3 ml-8 space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-start gap-2">
                <Skeleton width="32px" height="32px" rounded="full" />
                <div className="flex-1">
                  <Skeleton width="100px" height="12px" className="mb-1" />
                  <Skeleton width="80%" height="14px" />
                </div>
              </div>
            ))}
          </div>
        )}

        {showReplies && replies.length > 0 && (
          <div className="mt-3">
            {replies.map((reply) => (
              <CommentCard
                key={reply._id}
                comment={reply}
                postId={postId}
                onDelete={handleReplyDeleted}
                depth={depth + 1}
                maxDepth={maxDepth}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment?"
        confirmText="Delete"
        danger
      />
    </>
  );
};

export default CommentCard;