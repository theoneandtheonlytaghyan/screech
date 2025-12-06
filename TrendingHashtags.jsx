/**
 * Trending Hashtags Component
 * Displays trending hashtags
 */

import { useState, useEffect } from 'react';
import { TrendingUp, Hash } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import LoadingSpinner from '../common/LoadingSpinner';

function TrendingHashtags() {
  const [hashtags, setHashtags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      setLoading(true);
      const response = await api.get('/search/trending');
      setHashtags(response.data.data.hashtags || []);
    } catch (err) {
      console.error('Error fetching trending hashtags:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-screech-card rounded-lg border border-screech-border p-4">
      <div className="flex items-center mb-4">
        <TrendingUp className="text-screech-accent mr-2" size={20} />
        <h2 className="text-lg font-bold text-screech-text">
          Trending Hashtags
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="sm" />
        </div>
      ) : hashtags.length === 0 ? (
        <p className="text-screech-textMuted text-sm text-center py-4">
          No trending hashtags yet
        </p>
      ) : (
        <div className="space-y-2">
          {hashtags.map((hashtag, index) => (
            <Link
              key={hashtag.hashtag}
              to={`/hashtag/${hashtag.hashtag}`}
              className="flex items-center justify-between p-2 rounded hover:bg-screech-hover transition-colors group"
            >
              <div className="flex items-center flex-1 min-w-0">
                <span className="text-screech-textMuted mr-2 font-medium">
                  {index + 1}
                </span>
                <Hash size={16} className="text-screech-accent mr-1 flex-shrink-0" />
                <span className="text-screech-text group-hover:text-screech-accent transition-colors truncate">
                  {hashtag.hashtag}
                </span>
              </div>
              <span className="text-screech-textMuted text-sm ml-2 flex-shrink-0">
                {hashtag.count}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default TrendingHashtags;