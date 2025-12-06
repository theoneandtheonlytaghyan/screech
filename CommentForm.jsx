/**
 * CommentForm Component
 * Form for creating comments and replies
 */

import { useState, useRef, useEffect } from 'react';
import { Send, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { commentsAPI } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';
import { COMMENT_MAX_LENGTH, getCharCounterColor } from '../../utils/constants';
import Avatar from '../common/Avatar';
import Button from '../common/Button';

const CommentForm = ({
  postId,
  parentCommentId = null,
  onSubmit,
  onCancel,
  placeholder = 'Write a comment...',
  autoFocus = false,
  compact = false
}) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const textareaRef = useRef(null);
  const { user } = useAuth();
  const { error: showError } = useToast();

  const charCount = content.length;
  const remaining = COMMENT_MAX_LENGTH - charCount;
  const isValid = content.trim().length > 0 && remaining >= 0;

  // Auto focus
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [content]);

  // Handle submit
  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!isValid || loading) return;

    setLoading(true);

    try {
      const response = await commentsAPI.create({
        postId,
        content,
        parentCommentId
      });

      const newComment = response.data.data.comment;

      // Call onSubmit callback
      onSubmit?.(newComment);

      // Reset form
      setContent('');
      setIsFocused(false);

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      const message = getErrorMessage(err);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle keyboard shortcut
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit();
    }

    if (e.key === 'Escape' && onCancel) {
      onCancel();
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setContent('');
    setIsFocused(false);
    onCancel?.();
  };

  if (!user) {
    return (
      <div className="text-center py-4 text-sm text-screech-textMuted">
        <a href="/login" className="text-screech-accent hover:underline">
          Sign in
        </a>{' '}
        to leave a comment
      </div>
    );
  }

  if (compact) {
    return (
      <CompactCommentForm
        content={content}
        setContent={setContent}
        onSubmit={handleSubmit}
        onCancel={onCancel}
        loading={loading}
        placeholder={placeholder}
        remaining={remaining}
        isValid={isValid}
        textareaRef={textareaRef}
        handleKeyDown={handleKeyDown}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-screech-card rounded-xl p-4 border border-screech-border">
      <div className="flex gap-3">
        {/* User Avatar */}
        <Avatar
          username={user?.username}
          color={user?.avatarColor}
          emoji={user?.clan?.emoji}
          size="sm"
          className="flex-shrink-0"
        />

        {/* Input Area */}
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            maxLength={COMMENT_MAX_LENGTH + 10}
            rows={1}
            className="w-full bg-transparent text-screech-text placeholder-screech-textMuted resize-none outline-none text-sm leading-relaxed min-h-[36px]"
          />

          {/* Actions */}
          {(isFocused || content.length > 0) && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-screech-border">
              {/* Character Count */}
              <div className="flex items-center gap-2">
                <span className={`text-xs ${getCharCounterColor(remaining, COMMENT_MAX_LENGTH)}`}>
                  {remaining} characters left
                </span>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2">
                {onCancel && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  size="sm"
                  loading={loading}
                  disabled={!isValid}
                  icon={Send}
                >
                  {parentCommentId ? 'Reply' : 'Comment'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

/**
 * Compact Comment Form
 * Smaller version for replies
 */
const CompactCommentForm = ({
  content,
  setContent,
  onSubmit,
  onCancel,
  loading,
  placeholder,
  remaining,
  isValid,
  textareaRef,
  handleKeyDown
}) => {
  const { user } = useAuth();

  return (
    <div className="flex items-start gap-2 p-3 bg-screech-dark rounded-xl border border-screech-border">
      <Avatar
        username={user?.username}
        color={user?.avatarColor}
        size="xs"
        className="flex-shrink-0 mt-1"
      />

      <div className="flex-1 min-w-0">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={COMMENT_MAX_LENGTH}
          rows={1}
          className="w-full bg-transparent text-screech-text placeholder-screech-textMuted resize-none outline-none text-sm leading-relaxed min-h-[24px]"
        />

        {/* Actions Row */}
        <div className="flex items-center justify-between mt-2">
          <span className={`text-xs ${getCharCounterColor(remaining, COMMENT_MAX_LENGTH)}`}>
            {remaining}
          </span>

          <div className="flex items-center gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="p-1 rounded text-screech-textMuted hover:text-screech-text transition-colors"
              >
                <X size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={onSubmit}
              disabled={!isValid || loading}
              className={`
                p-1.5 rounded-lg transition-colors
                ${isValid
                  ? 'bg-screech-accent text-screech-dark hover:bg-screech-accentHover'
                  : 'bg-screech-border text-screech-textMuted cursor-not-allowed'
                }
              `}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Quick Comment Input
 * Single line input for quick comments
 */
export const QuickCommentInput = ({
  postId,
  onSubmit,
  placeholder = 'Add a comment...'
}) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { error: showError } = useToast();

  const handleSubmit = async () => {
    if (!content.trim() || loading) return;

    setLoading(true);

    try {
      const response = await commentsAPI.create({
        postId,
        content
      });

      onSubmit?.(response.data.data.comment);
      setContent('');
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-screech-border">
      <Avatar
        username={user?.username}
        color={user?.avatarColor}
        size="xs"
      />
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder={placeholder}
        maxLength={COMMENT_MAX_LENGTH}
        className="flex-1 bg-transparent text-sm text-screech-text placeholder-screech-textMuted outline-none"
      />
      <button
        onClick={handleSubmit}
        disabled={!content.trim() || loading}
        className={`
          p-1.5 rounded-lg transition-colors
          ${content.trim()
            ? 'text-screech-accent hover:bg-screech-accent/10'
            : 'text-screech-textMuted cursor-not-allowed'
          }
        `}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
        ) : (
          <Send size={16} />
        )}
      </button>
    </div>
  );
};

export default CommentForm;