/**
 * CommentList Component
 * Displays a list of comments for a post
 */

import { useState, useEffect, useCallback } from 'react';
import { commentsAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/helpers';
import CommentCard from './CommentCard';
import CommentForm from './CommentForm';
import { Skeleton } from '../common/Loader';
import { NoCommentsState } from '../common/EmptyState';
import Button from '../common/Button';

const CommentList = ({
  postId,
  initialComments = [],
  showForm = true,
  onCommentCountChange
}) => {
  const [comments, setComments] = useState(initialComments);
  const [loading, setLoading] = useState(initialComments.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    hasMore: false
  });

  const { error: showError } = useToast();

  // Fetch comments
  const fetchComments = useCallback(async (page = 1) => {
    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const response = await commentsAPI.getPostComments(postId, {
        page,
        limit: 20
      });

      const { comments: fetchedComments, pages, total, hasMore } = response.data.data;

      if (page === 1) {
        setComments(fetchedComments);
      } else {
        setComments((prev) => [...prev, ...fetchedComments]);
      }

      setPagination({ page, pages, total, hasMore });
      onCommentCountChange?.(total);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [postId, showError, onCommentCountChange]);

  // Initial fetch
  useEffect(() => {
    if (initialComments.length === 0) {
      fetchComments(1);
    } else {
      setLoading(false);
    }
  }, [postId]);

  // Handle load more
  const handleLoadMore = () => {
    if (!loadingMore && pagination.hasMore) {
      fetchComments(pagination.page + 1);
    }
  };

  // Handle new comment
  const handleCommentAdded = (newComment) => {
    setComments((prev) => [newComment, ...prev]);
    setPagination((prev) => ({ ...prev, total: prev.total + 1 }));
    onCommentCountChange?.(pagination.total + 1);
  };

  // Handle comment deleted
  const handleCommentDeleted = async (commentId) => {
    try {
      await commentsAPI.delete(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      onCommentCountChange?.(Math.max(0, pagination.total - 1));
    } catch (err) {
      throw err;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        {showForm && (
          <div className="mb-6">
            <Skeleton height="80px" rounded="xl" />
          </div>
        )}
        {Array.from({ length: 3 }).map((_, index) => (
          <CommentSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Error state
  if (error && comments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-screech-textMuted mb-4">{error}</p>
        <Button onClick={() => fetchComments(1)} variant="secondary" size="sm">
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Comment Form */}
      {showForm && (
        <div className="mb-6">
          <CommentForm
            postId ={postId}
            onSubmit={handleCommentAdded}
          />
        </div>
      )}

      {/* Comments Header */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-screech-textMuted">
            {pagination.total} {pagination.total === 1 ? 'Comment' : 'Comments'}
          </h3>
        </div>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <NoCommentsState />
      ) : (
        <div className="divide-y divide-screech-border">
          {comments.map((comment) => (
            <CommentCard
              key={comment._id}
              comment={comment}
              postId={postId}
              onDelete={handleCommentDeleted}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {pagination.hasMore && (
        <div className="mt-4 text-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleLoadMore}
            loading={loadingMore}
          >
            Load more comments
          </Button>
        </div>
      )}

      {/* End of Comments */}
      {!pagination.hasMore && comments.length > 5 && (
        <div className="mt-6 text-center">
          <p className="text-xs text-screech-textMuted">
            No more comments
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Comment Skeleton Component
 */
const CommentSkeleton = () => {
  return (
    <div className="py-3 animate-pulse">
      <div className="flex items-start gap-3">
        <Skeleton width="32px" height="32px" rounded="full" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton width="100px" height="14px" />
            <Skeleton width="60px" height="12px" />
          </div>
          <Skeleton width="90%" height="14px" className="mb-1" />
          <Skeleton width="70%" height="14px" />
          <div className="flex gap-4 mt-2">
            <Skeleton width="40px" height="12px" />
            <Skeleton width="40px" height="12px" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Inline Comment List
 * Compact version for post previews
 */
export const InlineCommentList = ({
  comments = [],
  limit = 2,
  onViewAll
}) => {
  const displayComments = comments.slice(0, limit);
  const hasMore = comments.length > limit;

  if (comments.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 pt-3 border-t border-screech-border">
      {displayComments.map((comment) => (
        <div key={comment._id} className="flex gap-2 mb-2">
          <span className="text-sm font-semibold text-screech-accent">
            {comment.author?.username}:
          </span>
          <span className="text-sm text-screech-text truncate flex-1">
            {comment.content}
          </span>
        </div>
      ))}

      {hasMore && (
        <button
          onClick={onViewAll}
          className="text-xs text-screech-textMuted hover:text-screech-accent"
        >
          View all {comments.length} comments
        </button>
      )}
    </div>
  );
};

export default CommentList;