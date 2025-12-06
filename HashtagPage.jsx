/**
 * Hashtag Page
 * View posts for a specific hashtag
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Hash, TrendingUp } from 'lucide-react';
import api from '../utils/api';
import PostCard from '../components/posts/PostCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

function HashtagPage() {
  const { hashtag } = useParams();
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Fetch hashtag posts
  const fetchPosts = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const response = await api.get(`/search/hashtag/${hashtag}?page=${pageNum}&limit=20`);
      const { posts: newPosts, hasMore: more } = response.data.data;

      if (append) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }
      
      setHasMore(more);
    } catch (err) {
      console.error('Error fetching hashtag posts:', err);
      setError(err.response?.data?.message || 'Failed to load posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Fetch hashtag stats
  const fetchStats = async () => {
    try {
      const response = await api.get(`/search/hashtag/${hashtag}/stats`);
      setStats(response.data.data);
    } catch (err) {
      console.error('Error fetching hashtag stats:', err);
    }
  };

  useEffect(() => {
    fetchPosts(1);
    fetchStats();
  }, [hashtag]);

  // Handle load more
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage, true);
    }
  };

  // Handle post deleted
  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(post => post._id !== postId));
  };

  // Handle post updated
  const handlePostUpdated = (updatedPost) => {
    setPosts(prev =>
      prev.map(post => post._id === updatedPost._id ? updatedPost : post)
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Hash className="text-screech-accent mr-2" size={32} />
          <h1 className="text-3xl font-bold text-screech-text">
            {hashtag}
          </h1>
        </div>

        {/* Stats */}
        {stats && (
          <div className="flex flex-wrap items-center gap-4 text-screech-textMuted">
            <div className="flex items-center">
              <span className="font-medium text-screech-text mr-1">
                {stats.totalPosts}
              </span>
              <span className="text-sm">
                {stats.totalPosts === 1 ? 'hoot' : 'hoots'}
              </span>
            </div>
            
            {stats.recentPosts > 0 && (
              <div className="flex items-center">
                <TrendingUp size={16} className="mr-1 text-screech-accent" />
                <span className="text-sm">
                  {stats.recentPosts} in last 24h
                </span>
              </div>
            )}

            {stats.isTrending && (
              <span className="px-3 py-1 bg-screech-accent text-screech-dark text-xs font-bold rounded-full">
                TRENDING
              </span>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4">
          <ErrorMessage message={error} />
        </div>
      )}

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="bg-screech-card rounded-lg border border-screech-border p-8 text-center">
          <Hash className="mx-auto mb-4 text-screech-textMuted" size={48} />
          <p className="text-screech-textMuted text-lg mb-2">
            No hoots found
          </p>
          <p className="text-screech-textDark text-sm">
            Be the first to use #{hashtag}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard
                key={post._id}
                post={post}
                onDelete={handlePostDeleted}
                onUpdate={handlePostUpdated}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center py-6 mt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-3 bg-screech-card border border-screech-border rounded-lg text-screech-text hover:bg-screech-hover transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default HashtagPage;