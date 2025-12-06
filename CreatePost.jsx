/**
 * CreatePost Component
 * Form for creating new posts/hoots
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Image, Smile, Hash } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { POST_MAX_LENGTH, getCharCounterColor } from '../../utils/constants';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import Card from '../common/Card';
import { Textarea } from '../common/Input';

const CreatePost = ({
  onSubmit,
  placeholder = "What's on your mind? 🦉",
  autoFocus = false,
  compact = false
}) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const textareaRef = useRef(null);
  const { user } = useAuth();

  const charCount = content.length;
  const remaining = POST_MAX_LENGTH - charCount;
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
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  // Handle submit
  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!isValid || loading) return;

    setLoading(true);

    try {
      await onSubmit?.(content);
      setContent('');
      setIsFocused(false);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle keyboard shortcut (Ctrl/Cmd + Enter)
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit();
    }
  };

  // Extract hashtags for preview
  const extractHashtags = () => {
    const matches = content.match(/#\w+/g);
    return matches ? [...new Set(matches)] : [];
  };

  const hashtags = extractHashtags();

  if (compact) {
    return (
      <CompactCreatePost
        content={content}
        setContent={setContent}
        onSubmit={handleSubmit}
        loading={loading}
        placeholder={placeholder}
        remaining={remaining}
        isValid={isValid}
      />
    );
  }

  return (
    <Card className="mb-6">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          {/* User Avatar */}
          <Avatar
            username={user?.username}
            color={user?.avatarColor}
            emoji={user?.clan?.emoji}
            size="md"
            className="flex-shrink-0"
          />

          {/* Input Area */}
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(content.length > 0)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              maxLength={POST_MAX_LENGTH + 10}
              className="w-full bg-transparent text-screech-text placeholder-screech-textMuted resize-none outline-none text-base leading-relaxed min-h-[60px]"
              rows={2}
            />

            {/* Hashtag Preview */}
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 mb-3">
                {hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="badge badge-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Actions Bar */}
            {(isFocused || content.length > 0) && (
              <div className="flex items-center justify-between pt-3 border-t border-screech-border mt-3">
                {/* Tools */}
                <div className="flex items-center gap-1">
                  <ToolButton icon={Hash} title="Add hashtag" />
                  <ToolButton icon={Smile} title="Add emoji" />
                </div>

                {/* Character Count & Submit */}
                <div className="flex items-center gap-3">
                  <CharacterCounter
                    remaining={remaining}
                    max={POST_MAX_LENGTH}
                  />
                  
                  <Button
                    type="submit"
                    size="sm"
                    loading={loading}
                    disabled={!isValid}
                    icon={Send}
                  >
                    Hoot
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Keyboard Shortcut Hint */}
      {isFocused && (
        <p className="text-xs text-screech-textDark mt-3 text-right">
          Press <kbd className="px-1.5 py-0.5 bg-screech-border rounded text-screech-textMuted">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-screech-border rounded text-screech-textMuted">Enter</kbd> to post
        </p>
      )}
    </Card>
  );
};

/**
 * Compact Create Post
 * Smaller version for inline use
 */
const CompactCreatePost = ({
  content,
  setContent,
  onSubmit,
  loading,
  placeholder,
  remaining,
  isValid
}) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-screech-card rounded-xl border border-screech-border">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder={placeholder}
        maxLength={POST_MAX_LENGTH}
        className="flex-1 bg-transparent text-screech-text placeholder-screech-textMuted outline-none text-sm"
      />
      
      <span className={`text-xs ${getCharCounterColor(remaining, POST_MAX_LENGTH)}`}>
        {remaining}
      </span>
      
      <Button
        size="sm"
        loading={loading}
        disabled={!isValid}
        onClick={onSubmit}
      >
        Post
      </Button>
    </div>
  );
};

/**
 * Tool Button Component
 */
const ToolButton = ({ icon: Icon, title, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="p-2 rounded-lg text-screech-textMuted hover:text-screech-accent hover:bg-screech-border transition-colors"
    >
      <Icon size={18} />
    </button>
  );
};

/**
 * Character Counter Component
 */
const CharacterCounter = ({ remaining, max }) => {
  const percentage = remaining / max;
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(1, (max - remaining) / max));

  const getColor = () => {
    if (remaining < 0) return '#EF4444';
    if (remaining < 20) return '#EF4444';
    if (remaining < 50) return '#F59E0B';
    return '#9C8170';
  };

  return (
    <div className="flex items-center gap-2">
      {/* Circular Progress */}
      <svg width="24" height="24" className="transform -rotate-90">
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          stroke="#3D3329"
          strokeWidth="2"
        />
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>

      {/* Number */}
      {remaining <= 20 && (
        <span
          className="text-sm font-medium"
          style={{ color: getColor() }}
        >
          {remaining}
        </span>
      )}
    </div>
  );
};

export default CreatePost;