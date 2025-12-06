/**
 * usePosts Hook
 * Manages posts state and operations
 */

import { useState, useCallback } from 'react';
import { postsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { getErrorMessage } from '../utils/helpers';
import { POSTS_PER_PAGE } from '../utils/constants';

export const usePosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    hasMore: false
  });

  const { success, error: showError } = useToast();
  const { emitNewPost, emitPostLike } = useSocket();

  /**
   * Fetch posts
   */
  const fetchPosts = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await postsAPI.getAll({
        page: 1,
        limit: POSTS_PER_PAGE,
        ...params
      });

      const { posts: fetchedPosts, page, pages, total, hasMore } = response.data.data;

      setPosts(fetchedPosts);
      setPagination({ page, pages, total, hasMore });

      return { success: true, posts: fetchedPosts };
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load more posts (pagination)
   */
  const loadMore = useCallback(async (params = {}) => {
    if (loading || !pagination.hasMore) return;

    setLoading(true);

    try {
      const response = await postsAPI.getAll({
        page: pagination.page + 1,
        limit: POSTS_PER_PAGE,
        ...params
      });

      const { posts: newPosts, page, pages, total, hasMore } = response.data.data;

      setPosts((prev) => [...prev, ...newPosts]);
      setPagination({ page, pages, total, hasMore });

      return { success: true };
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [loading, pagination]);

  /**
   * Create new post
   */
  const createPost = useCallback(async (content) => {
    try {
      const response = await postsAPI.create({ content });
      const newPost = response.data.data.post;

      // Add to beginning of posts list
      setPosts((prev) => [newPost, ...prev]);
      setPagination((prev) => ({ ...prev, total: prev.total + 1 }));

      // Emit socket event
      emitNewPost(newPost);

      success('Hoot posted! 🦉');
      return { success: true, post: newPost };
    } catch (err) {
      const message = getErrorMessage(err);
      showError(message);
      return { success: false, error: message };
    }
  }, [emitNewPost, success, showError]);

  /**
   * Delete post
   */
  const deletePost = useCallback(async (postId) => {
    try {
      await postsAPI.delete(postId);

      // Remove from posts list
      setPosts((prev) => prev.filter((post) => post._id !== postId));
      setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));

      success('Post deleted');
      return { success: true };
    } catch (err) {
      const message = getErrorMessage(err);
      showError(message);
      return { success: false, error: message };
    }
  }, [success, showError]);

  /**
   * Like post
   */
  const likePost = useCallback(async (postId, authorId) => {
    try {
      const response = await postsAPI.like(postId);
      const { likesCount } = response.data.data;

      // Update post in list
      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? { ...post, likesCount, isLiked: true }
            : post
        )
      );

      // Emit socket event
      emitPostLike(postId, authorId);

      return { success: true, likesCount };
    } catch (err) {
      const message = getErrorMessage(err);
      showError(message);
      return { success: false, error: message };
    }
  }, [emitPostLike, showError]);

  /**
   * Unlike post
   */
  const unlikePost = useCallback(async (postId) => {
    try {
      const response = await postsAPI.unlike(postId);
      const { likesCount } = response.data.data;

      // Update post in list
      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? { ...post, likesCount, isLiked: false }
            : post
        )
      );

      return { success: true, likesCount };
    } catch (err) {
      const message = getErrorMessage(err);
      showError(message);
      return { success: false, error: message };
    }
  }, [showError]);

  /**
   * Toggle like
   */
  const toggleLike = useCallback(async (post) => {
    if (post.isLiked) {
      return unlikePost(post._id);
    } else {
      return likePost(post._id, post.author._id);
    }
  }, [likePost, unlikePost]);

  /**
   * Get single post
   */
  const getPost = useCallback(async (postId) => {
    try {
      const response = await postsAPI.getOne(postId);
      return { success: true, post: response.data.data.post };
    } catch (err) {
      const message = getErrorMessage(err);
      return { success: false, error: message };
    }
  }, []);

  /**
   * Update post in list
   */
  const updatePostInList = useCallback((postId, updates) => {
    setPosts((prev) =>
      prev.map((post) =>
        post._id === postId ? { ...post, ...updates } : post
      )
    );
  }, []);

  /**
   * Add post to beginning of list
   */
  const addPost = useCallback((post) => {
    setPosts((prev) => [post, ...prev]);
    setPagination((prev) => ({ ...prev, total: prev.total + 1 }));
  }, []);

  /**
   * Clear posts
   */
  const clearPosts = useCallback(() => {
    setPosts([]);
    setPagination({ page: 1, pages: 1, total: 0, hasMore: false });
  }, []);

  return {
    posts,
    loading,
    error,
    pagination,
    fetchPosts,
    loadMore,
    createPost,
    deletePost,
    likePost,
    unlikePost,
    toggleLike,
    getPost,
    updatePostInList,
    addPost,
    clearPosts
  };
};

export default usePosts;