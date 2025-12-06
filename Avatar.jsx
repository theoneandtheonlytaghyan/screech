/**
 * Avatar Component
 * User avatar with fallback and status indicator
 */

import { forwardRef } from 'react';
import { getInitials } from '../../utils/helpers';

const Avatar = forwardRef(({
  username,
  color,
  emoji,
  size = 'md',
  showStatus = false,
  isOnline = false,
  className = '',
  ...props
}, ref) => {
  // Size styles
  const sizes = {
    xs: 'avatar-sm w-6 h-6 text-xs',
    sm: 'avatar-sm',
    md: 'avatar-md',
    lg: 'avatar-lg',
    xl: 'avatar-xl',
    '2xl': 'w-20 h-20 text-3xl'
  };

  // Status indicator sizes
  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
    '2xl': 'w-4 h-4'
  };

  // Get display content
  const displayContent = emoji || getInitials(username);

  return (
    <div className={`relative inline-block ${className}`} {...props}>
      {/* Avatar */}
      <div
        ref={ref}
        className={`avatar ${sizes[size]} font-bold`}
        style={{ backgroundColor: color || '#8B7355' }}
        title={username}
      >
        {displayContent}
      </div>

      {/* Online status indicator */}
      {showStatus && (
        <span
          className={`
            absolute bottom-0 right-0 
            ${statusSizes[size]}
            rounded-full border-2 border-screech-card
            ${isOnline ? 'bg-green-500' : 'bg-gray-500'}
          `}
        />
      )}
    </div>
  );
});

/**
 * Avatar Group Component
 * Display multiple avatars stacked
 */
export const AvatarGroup = ({
  users = [],
  max = 4,
  size = 'md',
  className = ''
}) => {
  const displayUsers = users.slice(0, max);
  const remaining = users.length - max;

  // Overlap offset based on size
  const offsets = {
    xs: '-ml-1.5',
    sm: '-ml-2',
    md: '-ml-2.5',
    lg: '-ml-3',
    xl: '-ml-4',
    '2xl': '-ml-5'
  };

  return (
    <div className={`flex items-center ${className}`}>
      {displayUsers.map((user, index) => (
        <div
          key={user._id || index}
          className={index > 0 ? offsets[size] : ''}
          style={{ zIndex: displayUsers.length - index }}
        >
          <Avatar
            username={user.username}
            color={user.avatarColor}
            emoji={user.clan?.emoji}
            size={size}
            className="ring-2 ring-screech-card"
          />
        </div>
      ))}

      {/* Remaining count */}
      {remaining > 0 && (
        <div
          className={`
            ${offsets[size]} 
            avatar ${size === 'sm' ? 'avatar-sm' : size === 'lg' ? 'avatar-lg' : 'avatar-md'}
            bg-screech-border text-screech-textMuted
            ring-2 ring-screech-card
          `}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};

/**
 * Avatar with Name Component
 */
export const AvatarWithName = ({
  username,
  color,
  emoji,
  clan,
  subtitle,
  size = 'md',
  showStatus = false,
  isOnline = false,
  onClick,
  className = ''
}) => {
  const nameSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  return (
    <div
      className={`flex items-center gap-3 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <Avatar
        username={username}
        color={color}
        emoji={emoji}
        size={size}
        showStatus={showStatus}
        isOnline={isOnline}
      />
      
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`font-semibold text-screech-accent truncate ${nameSizes[size]}`}>
            {username}
          </span>
          {clan && (
            <span className="text-sm" title={clan.name}>
              {clan.emoji}
            </span>
          )}
        </div>
        
        {subtitle && (
          <p className="text-xs text-screech-textMuted truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

Avatar.displayName = 'Avatar';

export default Avatar;