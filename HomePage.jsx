/**
 * Home Page
 * Main feed with posts and trending content
 */

import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import PostForm from '../components/posts/PostForm';
import PostCard from '../components/posts/PostCard';
import TrendingHashtags from '../components/trending/TrendingHashtags';
import ClanLeaderboard from '../components/clans/ClanLeaderboard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

function HomePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const { socket } = useSocket();
  const { showToast } = useToast();

  // Fetch posts
  const fetchPosts = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const response = await api.get(`/posts?page=${pageNum}&limit=20`);
      const { posts: newPosts, hasMore: more } = response.data.data;

      if (append) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }
      
      setHasMore(more);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err.response?.data?.message || 'Failed to load posts');
      showToast('Failed to load posts', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPosts(1);
  }, []);

  // Listen for new posts via socket
  useEffect(() => {
    if (!socket) return;

    const handleNewPost = (data) => {
      setPosts(prev => [data.post, ...prev]);
    };

    socket.on('post:created', handleNewPost);

    return () => {
      socket.off('post:created', handleNewPost);
    };
  }, [socket]);

  // Handle load more
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage, true);
    }
  };

  // Handle post created
  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
    if (socket) {
      socket.emit('post:new', newPost);
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
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2">
          {/* Post Form */}
          <PostForm onPostCreated={handlePostCreated} />

          {/* Error Message */}
          {error && (
            <div className="mb-4">
              <ErrorMessage message={error} />
            </div>
          )}

          {/* Posts List */}
          <div className="space-y-4 mt-6">
            {posts.length === 0 ? (
              <div className="bg-screech-card rounded-lg border border-screech-border p-8 text-center">
                <p className="text-screech-textMuted text-lg mb-2">No hoots yet</p>
                <p className="text-screech-textDark text-sm">
                  Be the first to share something with your clan!
                </p>
              </div>
            ) : (
              <>
                {posts.map(post => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onDelete={handlePostDeleted}
                    onUpdate={handlePostUpdated}
                  />
                ))}

                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center py-6">
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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trending Hashtags */}
          <TrendingHashtags />

          {/* Clan Leaderboard */}
          <ClanLeaderboard />
        </div>
      </div>
    </div>
  );
}

export default HomePage;