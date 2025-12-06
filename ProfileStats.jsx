/**
 * ProfileStats Component
 * Detailed user statistics display
 */

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Award,
  Heart,
  MessageCircle,
  Users,
  Calendar,
  Zap,
  Target,
  Star
} from 'lucide-react';
import { usersAPI } from '../../services/api';
import { formatNumber, formatDate } from '../../utils/helpers';
import { getLevelTitle, getPointsForNextLevel, LEVEL_THRESHOLDS } from '../../utils/constants';
import Card from '../common/Card';
import { Skeleton } from '../common/Loader';

const ProfileStats = ({
  userId,
  stats: initialStats,
  level = 1,
  showDetailed = false
}) => {
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(!initialStats);

  // Fetch detailed stats
  useEffect(() => {
    if (!initialStats && userId) {
      const fetchStats = async () => {
        setLoading(true);
        try {
          const response = await usersAPI.getStats(userId);
          setStats(response.data.data.stats);
        } catch (err) {
          console.error('Failed to fetch stats:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchStats();
    }
  }, [userId, initialStats]);

  if (loading) {
    return <ProfileStatsSkeleton />;
  }

  if (!stats) {
    return null;
  }

  const levelTitle = getLevelTitle(level);
  const nextLevelInfo = getPointsForNextLevel(level, stats.totalPoints || 0);

  return (
    <div className="space-y-4">
      {/* Level Progress Card */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star size={20} className="text-yellow-500" />
            <h3 className="font-semibold text-screech-text">Level Progress</h3>
          </div>
          <span className="text-sm text-screech-textMuted">{levelTitle}</span>
        </div>

        {/* Current Level Display */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-screech-accent/20 flex items-center justify-center">
              <span className="text-xl font-bold text-screech-accent">{level}</span>
            </div>
            <div>
              <p className="text-sm text-screech-textMuted">Current Level</p>
              <p className="font-semibold text-screech-text">{levelTitle}</p>
            </div>
          </div>
          
          {nextLevelInfo && (
            <div className="text-right">
              <p className="text-sm text-screech-textMuted">Next Level</p>
              <p className="font-semibold text-screech-accent">
                {formatNumber(nextLevelInfo.needed)} pts to go
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {nextLevelInfo && (
          <div>
            <div className="w-full h-3 bg-screech-dark rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-screech-accent to-yellow-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(nextLevelInfo.progress, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-screech-textMuted">
              <span>{formatNumber(stats.totalPoints)} pts</span>
              <span>{formatNumber(nextLevelInfo.total)} pts</span>
            </div>
          </div>
        )}

        {/* Max Level Indicator */}
        {!nextLevelInfo && (
          <div className="text-center py-4 bg-screech-dark rounded-xl">
            <span className="text-2xl mb-2 block">🏆</span>
            <p className="text-screech-accent font-semibold">Max Level Reached!</p>
            <p className="text-xs text-screech-textMuted">
              {formatNumber(stats.totalPoints)} total points
            </p>
          </div>
        )}
      </Card>

      {/* Main Stats Grid */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-screech-accent" />
          <h3 className="font-semibold text-screech-text">Statistics</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatBox
            icon={<Award className="text-yellow-500" />}
            label="Total Points"
            value={formatNumber(stats.totalPoints || 0)}
            color="yellow"
          />
          <StatBox
            icon={<MessageCircle className="text-blue-500" />}
            label="Hoots Posted"
            value={formatNumber(stats.postsCount || 0)}
            color="blue"
          />
          <StatBox
            icon={<Heart className="text-red-500" />}
            label="Likes Received"
            value={formatNumber(stats.likesReceived || 0)}
            color="red"
          />
          <StatBox
            icon={<Heart className="text-pink-500" />}
            label="Likes Given"
            value={formatNumber(stats.likesGiven || 0)}
            color="pink"
          />
          <StatBox
            icon={<MessageCircle className="text-green-500" />}
            label="Comments Received"
            value={formatNumber(stats.commentsReceived || 0)}
            color="green"
          />
          <StatBox
            icon={<MessageCircle className="text-teal-500" />}
            label="Comments Given"
            value={formatNumber(stats.commentsGiven || 0)}
            color="teal"
          />
        </div>
      </Card>

      {/* Detailed Stats (Optional) */}
      {showDetailed && (
        <>
          {/* Activity Overview */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Zap size={20} className="text-screech-accent" />
              <h3 className="font-semibold text-screech-text">Activity</h3>
            </div>

            <div className="space-y-3">
              <ActivityBar
                label="Hoots"
                value={stats.postsCount || 0}
                maxValue={100}
                color="#3B82F6"
              />
              <ActivityBar
                label="Engagement"
                value={(stats.likesReceived || 0) + (stats.commentsReceived || 0)}
                maxValue={500}
                color="#EF4444"
              />
              <ActivityBar
                label="Contributions"
                value={(stats.likesGiven || 0) + (stats.commentsGiven || 0)}
                maxValue={200}
                color="#10B981"
              />
            </div>
          </Card>

          {/* Level Milestones */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Target size={20} className="text-screech-accent" />
              <h3 className="font-semibold text-screech-text">Level Milestones</h3>
            </div>

            <div className="space-y-2">
              {LEVEL_THRESHOLDS.slice(0, 6).map((threshold) => (
                <div
                  key={threshold.level}
                  className={`
                    flex items-center justify-between p-2 rounded-lg
                    ${level >= threshold.level
                      ? 'bg-screech-accent/10'
                      : 'bg-screech-dark'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                        ${level >= threshold.level
                          ? 'bg-screech-accent text-screech-dark'
                          : 'bg-screech-border text-screech-textMuted'
                        }
                      `}
                    >
                      {threshold.level}
                    </span>
                    <div>
                      <p className={`text-sm font-medium ${level >= threshold.level ? 'text-screech-accent' : 'text-screech-textMuted'}`}>
                        {threshold.title}
                      </p>
                      <p className="text-xs text-screech-textMuted">
                        {formatNumber(threshold.points)} points
                      </p>
                    </div>
                  </div>
                  {level >= threshold.level && (
                    <span className="text-green-500">✓</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Member Since */}
      {stats.memberSince && (
        <div className="flex items-center justify-center gap-2 text-sm text-screech-textMuted py-2">
          <Calendar size={14} />
          <span>Member since {formatDate(stats.memberSince)}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Stat Box Component
 */
const StatBox = ({ icon, label, value, color }) => {
  const colorClasses = {
    yellow: 'bg-yellow-500/10',
    blue: 'bg-blue-500/10',
    red: 'bg-red-500/10',
    pink: 'bg-pink-500/10',
    green: 'bg-green-500/10',
    teal: 'bg-teal-500/10'
  };

  return (
    <div className={`p-4 rounded-xl ${colorClasses[color] || 'bg-screech-dark'}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
      </div>
      <p className="text-2xl font-bold text-screech-text">{value}</p>
      <p className="text-xs text-screech-textMuted">{label}</p>
    </div>
  );
};

/**
 * Activity Bar Component
 */
const ActivityBar = ({ label, value, maxValue, color }) => {
  const percentage = Math.min((value / maxValue) * 100, 100);

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-screech-textMuted">{label}</span>
        <span className="text-screech-text font-medium">{formatNumber(value)}</span>
      </div>
      <div className="w-full h-2 bg-screech-dark rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

/**
 * Profile Stats Skeleton
 */
const ProfileStatsSkeleton = () => {
  return (
    <div className="space-y-4">
      <Card className="animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton width="20px" height="20px" rounded="full" />
          <Skeleton width="120px" height="20px" />
        </div>
        <Skeleton width="100%" height="60px" rounded="xl" className="mb-3" />
        <Skeleton width="100%" height="12px" rounded="full" />
      </Card>

      <Card className="animate-pulse">
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} width="100%" height="100px" rounded="xl" />
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ProfileStats;