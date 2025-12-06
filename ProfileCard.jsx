/**
 * ProfileCard Component
 * User profile display card
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  Calendar,
  Award,
  Users,
  Settings,
  RefreshCw,
  MoreHorizontal,
  Flag,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatNumber } from '../../utils/helpers';
import { getLevelTitle } from '../../utils/constants';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import Card from '../common/Card';

const ProfileCard = ({
  user,
  isOwnProfile = false,
  onMessage,
  onRegenerateIdentity
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  if (!user) return null;

  const {
    username,
    avatarColor,
    clan,
    level,
    stats,
    clanRank,
    createdAt,
    isOnline,
    lastSeen
  } = user;

  const levelTitle = getLevelTitle(level);

  return (
    <Card className="relative overflow-hidden">
      {/* Background Pattern */}
      <div
        className="absolute top-0 left-0 right-0 h-24 opacity-20"
        style={{
          background: `linear-gradient(135deg, ${avatarColor} 0%, ${clan?.color || avatarColor} 100%)`
        }}
      />

      {/* Content */}
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          {/* Avatar */}
          <div className="relative -mt-2">
            <Avatar
              username={username}
              color={avatarColor}
              emoji={clan?.emoji}
              size="xl"
              showStatus={!isOwnProfile}
              isOnline={isOnline}
              className="ring-4 ring-screech-card"
            />
            
            {/* Level Badge */}
            <div
              className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ backgroundColor: avatarColor, color: '#1C1410' }}
            >
              Lv.{level}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isOwnProfile ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={RefreshCw}
                  onClick={onRegenerateIdentity}
                >
                  <span className="hidden sm:inline">New Identity</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Settings}
                  onClick={() => navigate('/settings')}
                />
              </>
            ) : (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  icon={MessageCircle}
                  onClick={onMessage}
                >
                  Message
                </Button>
                
                {/* Menu */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={MoreHorizontal}
                    onClick={() => setShowMenu(!showMenu)}
                  />
                  
                  {showMenu && (
                    <div className="absolute right-0 top-full mt-1 dropdown z-10">
                      <button className="dropdown-item">
                        <Flag size={14} />
                        Report user
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-screech-text">
              {username}
            </h1>
            {clan && (
              <span className="text-lg" title={clan.name}>
                {clan.emoji}
              </span>
            )}
          </div>
          
          <p className="text-sm text-screech-accent font-medium">
            {levelTitle}
          </p>
        </div>

        {/* Clan Info */}
        {clan && (
          <div
            className="flex items-center gap-3 p-3 rounded-xl mb-4 cursor-pointer hover:opacity-80 transition-opacity"
            style={{ backgroundColor: `${clan.color}20` }}
            onClick={() => navigate(`/clans/${clan.name.toLowerCase()}`)}
          >
            <span className="text-2xl">{clan.emoji}</span>
            <div className="flex-1">
              <p className="font-semibold text-screech-text">
                {clan.name} Clan
              </p>
              <p className="text-xs text-screech-textMuted">
                {clan.description}
              </p>
            </div>
            {clanRank && (
              <div className="text-right">
                <p className="text-lg font-bold text-screech-accent">
                  #{clanRank}
                </p>
                <p className="text-xs text-screech-textMuted">Rank</p>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <StatItem
            icon={<Award size={16} />}
            label="Points"
            value={formatNumber(stats?.totalPoints || 0)}
          />
          <StatItem
            icon={<MessageCircle size={16} />}
            label="Hoots"
            value={formatNumber(stats?.postsCount || 0)}
          />
          <StatItem
            icon={<Users size={16} />}
            label="Likes"
            value={formatNumber(stats?.likesReceived || 0)}
          />
        </div>

        {/* Join Date */}
        <div className="flex items-center gap-2 text-sm text-screech-textMuted">
          <Calendar size={14} />
          <span>Joined {formatDate(createdAt)}</span>
        </div>

        {/* Online Status (for other users) */}
        {!isOwnProfile && (
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span
              className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`}
            />
            <span className="text-screech-textMuted">
              {isOnline ? 'Online now' : lastSeen ? `Last seen ${formatDate(lastSeen)}` : 'Offline'}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};

/**
 * Stat Item Component
 */
const StatItem = ({ icon, label, value }) => {
  return (
    <div className="text-center p-3 bg-screech-dark rounded-xl">
      <div className="flex items-center justify-center gap-1 text-screech-accent mb-1">
        {icon}
      </div>
      <p className="text-lg font-bold text-screech-text">{value}</p>
      <p className="text-xs text-screech-textMuted">{label}</p>
    </div>
  );
};

/**
 * Compact Profile Card
 * For sidebars and smaller displays
 */
export const CompactProfileCard = ({ user, onClick }) => {
  if (!user) return null;

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-screech-border cursor-pointer transition-colors"
      onClick={onClick}
    >
      <Avatar
        username={user.username}
        color={user.avatarColor}
        emoji={user.clan?.emoji}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-screech-accent truncate">
            {user.username}
          </span>
          {user.clan && (
            <span className="text-sm">{user.clan.emoji}</span>
          )}
        </div>
        <p className="text-xs text-screech-textMuted">
          Level {user.level} • {formatNumber(user.stats?.totalPoints || 0)} pts
        </p>
      </div>
    </div>
  );
};

/**
 * Profile Card Skeleton
 */
export const ProfileCardSkeleton = () => {
  return (
    <Card className="animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-20 h-20 rounded-full bg-screech-border" />
        <div className="w-24 h-8 rounded-lg bg-screech-border" />
      </div>
      <div className="mb-4">
        <div className="w-40 h-6 rounded bg-screech-border mb-2" />
        <div className="w-24 h-4 rounded bg-screech-border" />
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-screech-border" />
        ))}
      </div>
      <div className="w-32 h-4 rounded bg-screech-border" />
    </Card>
  );
};

export default ProfileCard;