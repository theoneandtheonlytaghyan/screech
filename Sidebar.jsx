/**
 * Sidebar Component
 * Left sidebar with trending hashtags
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Hash, RefreshCw } from 'lucide-react';
import { searchAPI } from '../../services/api';
import { formatNumber } from '../../utils/helpers';
import Card from '../common/Card';
import { Skeleton } from '../common/Loader';

const Sidebar = ({ className = '' }) => {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Fetch trending hashtags
  const fetchTrending = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await searchAPI.getTrending({ limit: 8 });
      setTrending(response.data.data.trending || []);
    } catch (err) {
      console.error('Failed to fetch trending:', err);
      setError('Failed to load trending');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrending();
  }, []);

  const handleHashtagClick = (hashtag) => {
    navigate(`/hashtag/${hashtag}`);
  };

  return (
    <aside className={`w-full ${className}`}>
      {/* Trending Hashtags */}
      <Card className="sticky top-20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-screech-accent" />
            <h2 className="font-semibold text-screech-text">Trending</h2>
          </div>
          
          <button
            onClick={fetchTrending}
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
                <Skeleton width="24px" height="24px" rounded="lg" />
                <div className="flex-1">
                  <Skeleton width="80%" height="14px" className="mb-1" />
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
              onClick={fetchTrending}
              className="text-screech-accent text-sm hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Trending List */}
        {!loading && !error && trending.length > 0 && (
          <div className="space-y-1">
            {trending.map((item, index) => (
              <TrendingItem
                key={item.hashtag}
                rank={index + 1}
                hashtag={item.hashtag}
                count={item.count}
                onClick={() => handleHashtagClick(item.hashtag)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && trending.length === 0 && (
          <div className="text-center py-6">
            <span className="text-3xl mb-2 block">📊</span>
            <p className="text-screech-textMuted text-sm">
              No trending hashtags yet
            </p>
          </div>
        )}

        {/* View All Link */}
        {trending.length > 0 && (
          <Link
            to="/search?type=hashtags"
            className="block mt-4 pt-4 border-t border-screech-border text-screech-accent text-sm hover:underline"
          >
            View all hashtags
          </Link>
        )}
      </Card>

      {/* Footer Links */}
      <div className="mt-4 px-2">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-screech-textMuted">
          <Link to="/about" className="hover:text-screech-accent">About</Link>
          <Link to="/terms" className="hover:text-screech-accent">Terms</Link>
          <Link to="/privacy" className="hover:text-screech-accent">Privacy</Link>
          <Link to="/help" className="hover:text-screech-accent">Help</Link>
        </div>
        <p className="mt-2 text-xs text-screech-textDark">
          © 2024 Screech 🦉
        </p>
      </div>
    </aside>
  );
};

/**
 * Trending Item Component
 */
const TrendingItem = ({ rank, hashtag, count, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-screech-border transition-colors text-left group"
    >
      {/* Rank */}
      <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-screech-border text-screech-textMuted text-xs font-bold group-hover:bg-screech-accent group-hover:text-screech-dark transition-colors">
        {rank}
      </span>

      {/* Hashtag Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <Hash size={14} className="text-screech-accent" />
          <span className="font-medium text-screech-text truncate">
            {hashtag}
          </span>
        </div>
        <p className="text-xs text-screech-textMuted">
          {formatNumber(count)} {count === 1 ? 'hoot' : 'hoots'}
        </p>
      </div>
    </button>
  );
};

/**
 * Mini Sidebar Component
 * Compact version for smaller screens
 */
export const MiniSidebar = ({ className = '' }) => {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await searchAPI.getTrending({ limit: 5 });
        setTrending(response.data.data.trending || []);
      } catch (err) {
        console.error('Failed to fetch trending:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  if (loading || trending.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {trending.slice(0, 5).map((item) => (
        <button
          key={item.hashtag}
          onClick={() => navigate(`/hashtag/${item.hashtag}`)}
          className="badge badge-primary hover:bg-screech-accent/30 transition-colors"
        >
          #{item.hashtag}
        </button>
      ))}
    </div>
  );
};

export default Sidebar;