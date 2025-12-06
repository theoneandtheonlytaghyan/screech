/**
 * EmptyState Component
 * Display when no content is available
 */

import Button from './Button';

const EmptyState = ({
  icon,
  emoji = '🦉',
  title,
  description,
  action,
  actionText,
  onAction,
  secondaryAction,
  secondaryActionText,
  onSecondaryAction,
  size = 'md',
  className = ''
}) => {
  // Size styles
  const sizes = {
    sm: {
      container: 'py-8',
      icon: 'text-4xl mb-3',
      title: 'text-base',
      description: 'text-sm'
    },
    md: {
      container: 'py-12',
      icon: 'text-6xl mb-4',
      title: 'text-lg',
      description: 'text-sm'
    },
    lg: {
      container: 'py-16',
      icon: 'text-7xl mb-6',
      title: 'text-xl',
      description: 'text-base'
    }
  };

  const sizeStyles = sizes[size];

  return (
    <div className={`text-center ${sizeStyles.container} ${className}`}>
      {/* Icon or Emoji */}
      {icon ? (
        <div className={`${sizeStyles.icon} text-screech-textMuted opacity-50`}>
          {icon}
        </div>
      ) : (
        <div className={`${sizeStyles.icon} opacity-50`}>
          {emoji}
        </div>
      )}

      {/* Title */}
      {title && (
        <h3 className={`font-semibold text-screech-text mb-2 ${sizeStyles.title}`}>
          {title}
        </h3>
      )}

      {/* Description */}
      {description && (
        <p className={`text-screech-textMuted max-w-sm mx-auto ${sizeStyles.description}`}>
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || actionText) && (
        <div className="mt-6 flex items-center justify-center gap-3">
          {(action || actionText) && (
            <Button onClick={onAction}>
              {action || actionText}
            </Button>
          )}
          {(secondaryAction || secondaryActionText) && (
            <Button variant="secondary" onClick={onSecondaryAction}>
              {secondaryAction || secondaryActionText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * No Posts Empty State
 */
export const NoPostsState = ({ onCreatePost }) => {
  return (
    <EmptyState
      emoji="📝"
      title="No hoots yet"
      description="Be the first to share something with the community!"
      actionText="Create a Hoot"
      onAction={onCreatePost}
    />
  );
};

/**
 * No Messages Empty State
 */
export const NoMessagesState = () => {
  return (
    <EmptyState
      emoji="💬"
      title="No messages yet"
      description="Start a conversation with someone from the community."
      size="sm"
    />
  );
};

/**
 * No Conversations Empty State
 */
export const NoConversationsState = () => {
  return (
    <EmptyState
      emoji="✉️"
      title="No conversations"
      description="Your messages will appear here when you start chatting."
    />
  );
};

/**
 * No Notifications Empty State
 */
export const NoNotificationsState = () => {
  return (
    <EmptyState
      emoji="🔔"
      title="No notifications"
      description="You're all caught up! New notifications will appear here."
    />
  );
};

/**
 * No Search Results Empty State
 */
export const NoSearchResultsState = ({ query }) => {
  return (
    <EmptyState
      emoji="🔍"
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try a different search term.`}
    />
  );
};

/**
 * No Comments Empty State
 */
export const NoCommentsState = () => {
  return (
    <EmptyState
      emoji="💭"
      title="No comments yet"
      description="Be the first to share your thoughts!"
      size="sm"
    />
  );
};

/**
 * Error State
 */
export const ErrorState = ({
  title = 'Something went wrong',
  description = 'An error occurred. Please try again.',
  onRetry
}) => {
  return (
    <EmptyState
      emoji="😕"
      title={title}
      description={description}
      actionText={onRetry ? 'Try Again' : undefined}
      onAction={onRetry}
    />
  );
};

/**
 * Offline State
 */
export const OfflineState = () => {
  return (
    <EmptyState
      emoji="📡"
      title="You're offline"
      description="Please check your internet connection and try again."
      actionText="Retry"
      onAction={() => window.location.reload()}
    />
  );
};

/**
 * Coming Soon State
 */
export const ComingSoonState = ({ feature }) => {
  return (
    <EmptyState
      emoji="🚧"
      title="Coming Soon"
      description={feature ? `${feature} is under development. Stay tuned!` : 'This feature is under development. Stay tuned!'}
    />
  );
};

export default EmptyState;