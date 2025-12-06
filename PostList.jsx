/**
 * PostList Component
 * Displays a list of posts with infinite scroll
 */

import { useEffect, useRef, useCallback } from 'react';
import PostCard from './PostCard';
import { SkeletonPost } from '../common/Loader';
import EmptyState, { NoPostsState } from '../common/EmptyState';

const PostList = ({
  posts = [],
  loading = false,
  error = null,
  hasMore = false,
  onLoadMore,
  onLike,
  onDelete,
  onComment,
  emptyState,
  showCreatePrompt = false,
  onCreatePost
}) => {
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  // Infinite scroll with Intersection Observer
  const handleObserver = useCallback((entries) => {
    const [target] = entries;
    if (target.isIntersecting && hasMore && !loading && onLoadMore) {
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  useEffect(() => {
    const element = loadMoreRef.current;
    
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  // Loading state (initial load)
  if (loading && posts.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonPost key={index} />
        ))}
      </div>
    );
  }

  // Error state
  if (error && posts.length === 0) {
    return (
      <EmptyState
        emoji="😕"
        title="Failed to load posts"
        description={error}
        actionText="Try again"
        onAction={onLoadMore}
      />
    );
  }

  // Empty state
  if (!loading && posts.length === 0) {
    if (emptyState) {
      return emptyState;
    }

    if (showCreatePrompt) {
      return <NoPostsState onCreatePost={onCreatePost} />;
    }

    return (
      <EmptyState
        emoji="📭"
        title="No hoots yet"
        description="Be the first one to post something!"
      />
    );
  }

  return (
    <div>
      {/* Posts */}
      {posts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          onLike={onLike}
          onDelete={onDelete}
          onComment={onComment}
        />
      ))}

      {/* Load More Trigger */}
      <div ref={loadMoreRef} className="h-4" />

      {/* Loading More */}
      {loading && posts.length > 0 && (
        <div className="space-y-4 mt-4">
          <SkeletonPost />
          <SkeletonPost />
        </div>
      )}

      {/* End of List */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8">
          <span className="text-3xl mb-2 block">🦉</span>
          <p className="text-screech-textMuted text-sm">
            You've seen all the hoots!
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Compact Post List
 * For displaying posts in smaller spaces
 */
export const CompactPostList = ({
  posts = [],
  loading = false,
  onPostClick
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="h-4 bg-screech-border rounded w-3/4 mb-2" />
            <div className="h-3 bg-screech-border rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <p className="text-screech-textMuted text-sm text-center py-4">
        No posts to show
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <div
          key={post._id}
          onClick={() => onPostClick?.(post)}
          className="p-3 rounded-xl hover:bg-screech-border cursor-pointer transition-colors"
        >
          <p className="text-sm text-screech-text truncate-2">
            {post.content}
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-screech-textMuted">
            <span>❤️ {post.likesCount || 0}</span>
            <span>💬 {post.commentsCount || 0}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PostList;