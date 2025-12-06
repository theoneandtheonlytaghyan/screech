/**
 * ClanLeaderboard Component
 * Displays clan rankings and statistics
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, TrendingUp, ChevronRight, RefreshCw, Crown } from 'lucide-react';
import { clansAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatNumber } from '../../utils/helpers';
import Card from '../common/Card';
import Button from '../common/Button';
import { Skeleton } from '../common/Loader';

const ClanLeaderboard = ({
  limit = 6,
  showHeader = true,
  showViewAll = true,
  compact = false
}) => {
  const [clans, setClans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch clan rankings
  const fetchClans = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await clansAPI.getLeaderboard({ limit });
      setClans(response.data.data.leaderboard || []);
    } catch (err) {
      console.error('Failed to fetch clan leaderboard:', err);
      setError('Failed to load clans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClans();
  }, [limit]);

  // Get rank badge
  const getRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return { icon: '🥇', color: 'text-yellow-500', bg: 'bg-yellow-500/20' };
      case 2:
        return { icon: '🥈', color: 'text-gray-400', bg: 'bg-gray-400/20' };
      case 3:
        return { icon: '🥉', color: 'text-amber-600', bg: 'bg-amber-600/20' };
      default:
        return { icon: rank, color: 'text-screech-textMuted', bg: 'bg-screech-border' };
    }
  };

  if (compact) {
    return (
      <CompactClanLeaderboard
        clans={clans}
        loading={loading}
        userClan={user?.clan}
        onClanClick={(name) => navigate(`/clans/${name.toLowerCase()}`)}
      />
    );
  }

  return (
    <Card>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-yellow-500" />
            <h2 className="font-semibold text-screech-text">Clan Rankings</h2>
          </div>

          <button
            onClick={fetchClans}
            disabled={loading}
            className="p-1.5 rounded-lg text-screech-textMuted hover:text-screech-text hover:bg-screech-border transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: limit }).map((_, index) => (
            <ClanItemSkeleton key={index} />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-6">
          <p className="text-screech-textMuted text-sm mb-3">{error}</p>
          <Button size="sm" variant="secondary" onClick={fetchClans}>
            Try again
          </Button>
        </div>
      )}

      {/* Clans List */}
      {!loading && !error && clans.length > 0 && (
        <div className="space-y-2">
          {clans.map((clan, index) => {
            const rank = index + 1;
            const isUserClan = user?.clan?.name === clan.name;
            const rankBadge = getRankBadge(rank);

            return (
              <div
                key={clan.name}
                onClick={() => navigate(`/clans/${clan.name.toLowerCase()}`)}
                className={`
                  flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
                  ${isUserClan
                    ? 'bg-screech-accent/10 border border-screech-accent/30 hover:bg-screech-accent/15'
                    : 'hover:bg-screech-border'
                  }
                `}
              >
                {/* Rank */}
                <div
                  className={`
                    w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
                    ${rankBadge.bg} ${rankBadge.color}
                  `}
                >
                  {rank <= 3 ? rankBadge.icon : rank}
                </div>

                {/* Clan Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-2xl">{clan.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-screech-text truncate">
                        {clan.name}
                      </span>
                      {isUserClan && (
                        <span className="text-xs bg-screech-accent/20 text-screech-accent px-1.5 py-0.5 rounded">
                          You
                        </span>
                      )}
                      {rank === 1 && (
                        <Crown size={14} className="text-yellow-500" />
                      )}
                    </div>
                    <p className="text-xs text-screech-textMuted">
                      {clan.description}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right">
                  <p className="font-bold text-screech-accent">
                    {formatNumber(clan.score)}
                  </p>
                  <p className="text-xs text-screech-textMuted flex items-center gap-1 justify-end">
                    <Users size={10} />
                    {formatNumber(clan.memberCount)}
                  </p>
                </div>

                <ChevronRight size={16} className="text-screech-textMuted" />
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && clans.length === 0 && (
        <div className="text-center py-8">
          <span className="text-4xl mb-3 block">🏆</span>
          <p className="text-screech-textMuted">No clan data available</p>
        </div>
      )}

      {/* View All Link */}
      {showViewAll && clans.length > 0 && (
        <button
          onClick={() => navigate('/clans')}
          className="w-full mt-4 pt-4 border-t border-screech-border text-screech-accent text-sm hover:underline"
        >
          View all clans
        </button>
      )}
    </Card>
  );
};

/**
 * Compact Clan Leaderboard
 */
const CompactClanLeaderboard = ({
  clans,
  loading,
  userClan,
  onClanClick
}) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 animate-pulse">
            <Skeleton width="24px" height="24px" rounded="lg" />
            <Skeleton width="24px" height="24px" rounded="full" />
            <Skeleton width="80px" height="14px" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {clans.slice(0, 5).map((clan, index) => {
        const isUserClan = userClan?.name === clan.name;

        return (
          <div
            key={clan.name}
            onClick={() => onClanClick(clan.name)}
            className={`
              flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors
              ${isUserClan ? 'bg-screech-accent/10' : 'hover:bg-screech-border'}
            `}
          >
            <span className="w-6 text-center text-sm font-bold text-screech-textMuted">
              {index + 1}
            </span>
            <span className="text-lg">{clan.emoji}</span>
            <span className={`text-sm font-medium flex-1 ${isUserClan ? 'text-screech-accent' : 'text-screech-text'}`}>
              {clan.name}
            </span>
            <span className="text-xs text-screech-textMuted">
              {formatNumber(clan.score)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Clan Item Skeleton
 */
const ClanItemSkeleton = () => {
  return (
    <div className="flex items-center gap-3 p-3 animate-pulse">
      <Skeleton width="32px" height="32px" rounded="lg" />
      <Skeleton width="32px" height="32px" rounded="full" />
      <div className="flex-1">
        <Skeleton width="100px" height="16px" className="mb-1" />
        <Skeleton width="150px" height="12px" />
      </div>
      <div className="text-right">
        <Skeleton width="50px" height="16px" className="mb-1" />
        <Skeleton width="30px" height="12px" />
      </div>
    </div>
  );
};

/**
 * Clan Stats Summary
 */
export const ClanStatsSummary = ({ clan }) => {
  if (!clan) return null;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center p-3 bg-screech-dark rounded-xl">
        <TrendingUp size={16} className="mx-auto text-screech-accent mb-1" />
        <p className="text-lg font-bold text-screech-text">
          #{clan.rank || '-'}
        </p>
        <p className="text-xs text-screech-textMuted">Rank</p>
      </div>
      <div className="text-center p-3 bg-screech-dark rounded-xl">
        <Trophy size={16} className="mx-auto text-yellow-500 mb-1" />
        <p className="text-lg font-bold text-screech-text">
          {formatNumber(clan.score || 0)}
        </p>
        <p className="text-xs text-screech-textMuted">Points</p>
      </div>
      <div className="text-center p-3 bg-screech-dark rounded-xl">
        <Users size={16} className="mx-auto text-blue-500 mb-1" />
        <p className="text-lg font-bold text-screech-text">
          {formatNumber(clan.memberCount || 0)}
        </p>
        <p className="text-xs text-screech-textMuted">Members</p>
      </div>
    </div>
  );
};

export default ClanLeaderboard;