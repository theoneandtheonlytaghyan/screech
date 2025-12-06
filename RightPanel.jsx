/**
 * RightPanel Component
 * Right sidebar with clan leaderboard and user suggestions
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Users, ChevronRight, RefreshCw } from 'lucide-react';
import { clansAPI, usersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatNumber } from '../../utils/helpers';
import { getClanByName } from '../../utils/constants';
import Card from '../common/Card';
import Avatar, { AvatarWithName } from '../common/Avatar';
import Button from '../common/Button';
import { Skeleton } from '../common/Loader';

const RightPanel = ({ className = '' }) => {
  return (
    <aside className={`w-full space-y-4 ${className}`}>
      {/* Clan Leaderboard */}
      <ClanLeaderboard />

      {/* Who to Follow / Active Users */}
      <ActiveUsers />
    </aside>
  );
};

/**
 * Clan Leaderboard Component
 */
const ClanLeaderboard = () => {
  const [clans, setClans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchClans = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await clansAPI.getLeaderboard({ limit: 5 });
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
  }, []);

  return (
    <Card className="sticky top-20">
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

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton width="28px" height="28px" rounded="lg" />
              <Skeleton width="28px" height="28px" rounded="full" />
              <div className="flex-1">
                <Skeleton width="60%" height="14px" className="mb-1" />
                <Skeleton width="40%" height="12px" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-4">
          <p className="text-screech-textMuted text-sm mb-2">{error}</p>
          <button
            onClick={fetchClans}
            className="text-screech-accent text-sm hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Clan List */}
      {!loading && !error && clans.length > 0 && (
        <div className="space-y-2">
          {clans.map((clan, index) => {
            const isUserClan = user?.clan?.name === clan.name;
            
            return (
              <button
                key={clan.name}
                onClick={() => navigate(`/clans/${clan.name.toLowerCase()}`)}
                className={`
                  w-full flex items-center gap-3 p-2 rounded-xl transition-colors text-left
                  ${isUserClan 
                    ? 'bg-screech-accent/10 hover:bg-screech-accent/20' 
                    : 'hover:bg-screech-border'
                  }
                `}
              >
                {/* Rank */}
                <span
                  className={`
                    w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold
                    ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' : ''}
                    ${index === 1 ? 'bg-gray-400/20 text-gray-400' : ''}
                    ${index === 2 ? 'bg-amber-600/20 text-amber-600' : ''}
                    ${index > 2 ? 'bg-screech-border text-screech-textMuted' : ''}
                  `}
                >
                  {index + 1}
                </span>

                {/* Clan Emoji */}
                <span className="text-2xl">{clan.emoji}</span>

                {/* Clan Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-screech-text">
                      {clan.name}
                    </span>
                    {isUserClan && (
                      <span className="text-xs text-screech-accent">(You)</span>
                    )}
                  </div>
                  <p className="text-xs text-screech-textMuted">
                    {formatNumber(clan.score)} pts • {formatNumber(clan.memberCount)} members
                  </p>
                </div>

                <ChevronRight size={16} className="text-screech-textMuted" />
              </button>
            );
          })}
        </div>
      )}

      {/* View All Link */}
      <Link
        to="/clans"
        className="block mt-4 pt-4 border-t border-screech-border text-screech-accent text-sm hover:underline"
      >
        View all clans
      </Link>
    </Card>
  );
};

/**
 * Active Users Component
 */
const ActiveUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await usersAPI.getLeaderboard({ limit: 5 });
      // Filter out current user
      const filteredUsers = (response.data.data.leaderboard || [])
        .filter(u => u._id !== currentUser?._id);
      setUsers(filteredUsers.slice(0, 4));
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentUser]);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-screech-accent" />
          <h2 className="font-semibold text-screech-text">Top Users</h2>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="p-1.5 rounded-lg text-screech-textMuted hover:text-screech-text hover:bg-screech-border transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton width="40px" height="40px" rounded="full" />
              <div className="flex-1">
                <Skeleton width="70%" height="14px" className="mb-1" />
                <Skeleton width="50%" height="12px" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-4">
          <p className="text-screech-textMuted text-sm mb-2">{error}</p>
          <button
            onClick={fetchUsers}
            className="text-screech-accent text-sm hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Users List */}
      {!loading && !error && users.length > 0 && (
        <div className="space-y-3">
          {users.map((user, index) => (
            <div
              key={user._id}
              className="flex items-center justify-between"
            >
              <AvatarWithName
                username={user.username}
                color={user.avatarColor}
                emoji={user.clan?.emoji}
                clan={user.clan}
                subtitle={`Level ${user.level} • ${formatNumber(user.stats?.totalPoints || 0)} pts`}
                size="sm"
                onClick={() => navigate(`/user/${user._id}`)}
                className="flex-1 min-w-0"
              />

              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/messages/new/${user._id}`)}
              >
                Message
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && users.length === 0 && (
        <div className="text-center py-6">
          <span className="text-3xl mb-2 block">👥</span>
          <p className="text-screech-textMuted text-sm">
            No users to show
          </p>
        </div>
      )}

      {/* View All Link */}
      {users.length > 0 && (
        <Link
          to="/search?type=users"
          className="block mt-4 pt-4 border-t border-screech-border text-screech-accent text-sm hover:underline"
        >
          Find more users
        </Link>
      )}
    </Card>
  );
};

export default RightPanel;