/**
 * Profile Page
 * User profile with posts and stats
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import ProfileCard from '../components/profile/ProfileCard';
import ProfileStats from '../components/profile/ProfileStats';
import RegenerateIdentity from '../components/profile/RegenerateIdentity';
import PostCard from '../components/posts/PostCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

function ProfilePage() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [postsLoading, setPostsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const isOwnProfile = currentUser?._id === userId;

  // Fetch user profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/users/${userId}`);
      setUser(response.data.data.user);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user posts
  const fetchPosts = async (pageNum = 1, append = false) => {
    try {
      setPostsLoading(true);

      const response = await api.get(`/users/${userId}/posts?page=${pageNum}&limit=20`);
      const { posts: newPosts, hasMore: more } = response.data.data;

      if (append) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }
      
      setHasMore(more);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, [userId]);

  // Handle identity regenerated
  const handleIdentityRegenerated = (updatedUser) => {
    setUser(updatedUser);
  };

  // Handle load more posts
  const handleLoadMore = () => {
    if (!postsLoading && hasMore) {
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

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-screech-card rounded-lg border border-screech-border p-8 text-center">
          <p className="text-screech-textMuted text-lg">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <ProfileCard user={user} isOwnProfile={isOwnProfile} />
          <ProfileStats user={user} />
          {isOwnProfile && (
            <RegenerateIdentity onRegenerated={handleIdentityRegenerated} />
          )}
        </div>

        {/* Posts Section */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-screech-text mb-4">
            {isOwnProfile ? 'Your Hoots' : `${user.username}'s Hoots`}
          </h2>

          {postsLoading && page === 1 ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-screech-card rounded-lg border border-screech-border p-8 text-center">
              <p className="text-screech-textMuted text-lg mb-2">
                No hoots yet
              </p>
              <p className="text-screech-textDark text-sm">
                {isOwnProfile
                  ? 'Start sharing your thoughts with the community'
                  : 'This user hasn\'t posted anything yet'
                }
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
                    disabled={postsLoading}
                    className="px-6 py-3 bg-screech-card border border-screech-border rounded-lg text-screech-text hover:bg-screech-hover transition-colors disabled:opacity-50"
                  >
                    {postsLoading ? (
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
    </div>
  );
}

export default ProfilePage;