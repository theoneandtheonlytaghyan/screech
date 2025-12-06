/**
 * ClanBadge Component
 * Badge display for clan affiliation
 */

import { useNavigate } from 'react-router-dom';
import { getClanByName } from '../../utils/constants';

const ClanBadge = ({
  clan,
  size = 'md',
  showName = true,
  showDescription = false,
  clickable = true,
  className = ''
}) => {
  const navigate = useNavigate();

  // Get clan data if only name is provided
  const clanData = typeof clan === 'string' ? getClanByName(clan) : clan;

  if (!clanData) return null;

  const { name, emoji, color, description } = clanData;

  // Size variants
  const sizes = {
    xs: {
      container: 'px-1.5 py-0.5 gap-1',
      emoji: 'text-sm',
      name: 'text-xs',
      description: 'text-[10px]'
    },
    sm: {
      container: 'px-2 py-1 gap-1.5',
      emoji: 'text-base',
      name: 'text-xs',
      description: 'text-[10px]'
    },
    md: {
      container: 'px-3 py-1.5 gap-2',
      emoji: 'text-lg',
      name: 'text-sm',
      description: 'text-xs'
    },
    lg: {
      container: 'px-4 py-2 gap-2',
      emoji: 'text-xl',
      name: 'text-base',
      description: 'text-sm'
    }
  };

  const sizeStyles = sizes[size];

  const handleClick = () => {
    if (clickable) {
      navigate(`/clans/${name.toLowerCase()}`);
    }
  };

  return (
    <div
      className={`
        inline-flex items-center rounded-full
        ${sizeStyles.container}
        ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
        ${className}
      `}
      style={{ backgroundColor: `${color}20` }}
      onClick={handleClick}
      title={description}
    >
      <span className={sizeStyles.emoji}>{emoji}</span>
      
      {showName && (
        <div className="flex flex-col">
          <span
            className={`font-semibold ${sizeStyles.name}`}
            style={{ color }}
          >
            {name}
          </span>
          {showDescription && description && (
            <span className={`text-screech-textMuted ${sizeStyles.description}`}>
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Clan Badge with Rank
 */
export const ClanBadgeWithRank = ({
  clan,
  rank,
  size = 'md',
  clickable = true
}) => {
  const navigate = useNavigate();
  const clanData = typeof clan === 'string' ? getClanByName(clan) : clan;

  if (!clanData) return null;

  const { name, emoji, color } = clanData;

  const handleClick = () => {
    if (clickable) {
      navigate(`/clans/${name.toLowerCase()}`);
    }
  };

  return (
    <div
      className={`
        inline-flex items-center gap-2 px-3 py-2 rounded-xl
        ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
      `}
      style={{ backgroundColor: `${color}15` }}
      onClick={handleClick}
    >
      <span className="text-xl">{emoji}</span>
      <div>
        <p className="font-semibold text-screech-text" style={{ color }}>
          {name}
        </p>
        {rank && (
          <p className="text-xs text-screech-textMuted">
            Rank #{rank}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Clan Icon Only
 */
export const ClanIcon = ({
  clan,
  size = 'md',
  showTooltip = true,
  clickable = true,
  className = ''
}) => {
  const navigate = useNavigate();
  const clanData = typeof clan === 'string' ? getClanByName(clan) : clan;

  if (!clanData) return null;

  const { name, emoji, color } = clanData;

  const sizes = {
    xs: 'w-5 h-5 text-xs',
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-base',
    lg: 'w-10 h-10 text-lg',
    xl: 'w-12 h-12 text-xl'
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (clickable) {
      navigate(`/clans/${name.toLowerCase()}`);
    }
  };

  return (
    <div
      className={`
        ${sizes[size]} rounded-full flex items-center justify-center
        ${clickable ? 'cursor-pointer hover:scale-110 transition-transform' : ''}
        ${className}
      `}
      style={{ backgroundColor: `${color}30` }}
      onClick={handleClick}
      title={showTooltip ? `${name} Clan` : undefined}
    >
      {emoji}
    </div>
  );
};

/**
 * All Clans Display
 */
export const AllClansBadges = ({
  selectedClan,
  onSelect,
  size = 'sm'
}) => {
  const { CLANS } = require('../../utils/constants');

  return (
    <div className="flex flex-wrap gap-2">
      {CLANS.map((clan) => (
        <button
          key={clan.name}
          onClick={() => onSelect?.(clan)}
          className={`
            transition-all
            ${selectedClan?.name === clan.name
              ? 'ring-2 ring-screech-accent ring-offset-2 ring-offset-screech-dark'
              : 'hover:scale-105'
            }
          `}
        >
          <ClanBadge
            clan={clan}
            size={size}
            clickable={false}
          />
        </button>
      ))}
    </div>
  );
};

/**
 * Clan Tag
 * Minimal inline display
 */
export const ClanTag = ({ clan, className = '' }) => {
  const clanData = typeof clan === 'string' ? getClanByName(clan) : clan;

  if (!clanData) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`}
      title={clanData.name}
    >
      <span>{clanData.emoji}</span>
    </span>
  );
};

/**
 * Clan Color Dot
 * Simple colored indicator
 */
export const ClanColorDot = ({ clan, size = 'md' }) => {
  const clanData = typeof clan === 'string' ? getClanByName(clan) : clan;

  if (!clanData) return null;

  const sizes = {
    xs: 'w-2 h-2',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <span
      className={`${sizes[size]} rounded-full inline-block`}
      style={{ backgroundColor: clanData.color }}
      title={clanData.name}
    />
  );
};

export default ClanBadge;