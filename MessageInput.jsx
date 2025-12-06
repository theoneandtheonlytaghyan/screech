/**
 * MessageInput Component
 * Input field for sending messages
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, X } from 'lucide-react';
import { MESSAGE_MAX_LENGTH } from '../../utils/constants';

const MessageInput = ({
  onSend,
  onTyping,
  disabled = false,
  placeholder,
  recipientName = ''
}) => {
  const [content, setContent] = useState('');
  const [loading, setSending] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const charCount = content.length;
  const isValid = content.trim().length > 0 && charCount <= MESSAGE_MAX_LENGTH;

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [content]);

  // Handle typing indicator
  const handleTyping = (isTyping) => {
    onTyping?.(isTyping);
  };

  // Handle input change
  const handleChange = (e) => {
    const value = e.target.value;
    setContent(value);

    // Send typing indicator
    handleTyping(true);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      handleTyping(false);
    }, 2000);
  };

  // Handle send
  const handleSend = async () => {
    if (!isValid || loading || disabled) return;

    setSending(true);
    handleTyping(false);

    try {
      const result = await onSend?.(content.trim());

      if (result?.success !== false) {
        setContent('');
        
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Focus input
  const focusInput = () => {
    textareaRef.current?.focus();
  };

  return (
    <div className="p-4 border-t border-screech-border bg-screech-card">
      {/* Character Limit Warning */}
      {charCount > MESSAGE_MAX_LENGTH * 0.9 && (
        <div className="mb-2 text-xs text-right">
          <span className={charCount > MESSAGE_MAX_LENGTH ? 'text-red-500' : 'text-yellow-500'}>
            {MESSAGE_MAX_LENGTH - charCount} characters remaining
          </span>
        </div>
      )}

      {/* Input Container */}
      <div
        className={`
          flex items-end gap-2 p-2 rounded-2xl border transition-colors
          ${isFocused
            ? 'bg-screech-dark border-screech-accent'
            : 'bg-screech-dark border-screech-border'
          }
          ${disabled ? 'opacity-50' : ''}
        `}
        onClick={focusInput}
      >
        {/* Attachment Button */}
        <button
          type="button"
          disabled={disabled}
          className="p-2 rounded-xl text-screech-textMuted hover:text-screech-text hover:bg-screech-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Attach file (coming soon)"
        >
          <Paperclip size={20} />
        </button>

        {/* Text Input */}
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || `Message ${recipientName || ''}...`}
            disabled={disabled}
            maxLength={MESSAGE_MAX_LENGTH + 100}
            rows={1}
            className="w-full bg-transparent text-screech-text placeholder-screech-textMuted resize-none outline-none text-sm leading-relaxed max-h-[120px]"
          />
        </div>

        {/* Emoji Button */}
        <button
          type="button"
          disabled={disabled}
          className="p-2 rounded-xl text-screech-textMuted hover:text-screech-text hover:bg-screech-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add emoji (coming soon)"
        >
          <Smile size={20} />
        </button>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!isValid || loading || disabled}
          className={`
            p-2 rounded-xl transition-all
            ${isValid && !loading && !disabled
              ? 'bg-screech-accent text-screech-dark hover:bg-screech-accentHover'
              : 'bg-screech-border text-screech-textMuted cursor-not-allowed'
            }
          `}
          title="Send message"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
          ) : (
            <Send size={20} />
          )}
        </button>
      </div>

      {/* Keyboard Shortcut Hint */}
      <p className="mt-2 text-xs text-screech-textDark text-center">
        Press <kbd className="px-1 py-0.5 bg-screech-border rounded text-screech-textMuted">Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-screech-border rounded text-screech-textMuted">Shift + Enter</kbd> for new line
      </p>
    </div>
  );
};

/**
 * Quick Reply Component
 * Pre-defined quick reply options
 */
export const QuickReplies = ({ replies = [], onSelect }) => {
  if (replies.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 p-3 border-t border-screech-border">
      {replies.map((reply, index) => (
        <button
          key={index}
          onClick={() => onSelect(reply)}
          className="px-3 py-1.5 text-sm bg-screech-border text-screech-text rounded-full hover:bg-screech-hover transition-colors"
        >
          {reply}
        </button>
      ))}
    </div>
  );
};

/**
 * Reply Preview Component
 * Shows when replying to a specific message
 */
export const ReplyPreview = ({ message, onCancel }) => {
  if (!message) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-screech-dark border-l-2 border-screech-accent mx-4 mb-2 rounded-r-lg">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-screech-accent font-medium">
          Replying to {message.sender?.username}
        </p>
        <p className="text-sm text-screech-textMuted truncate">
          {message.content}
        </p>
      </div>
      <button
        onClick={onCancel}
        className="p-1 rounded text-screech-textMuted hover:text-screech-text transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default MessageInput;