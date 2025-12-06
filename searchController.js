/**
 * Search Controller
 * Handles search operations for posts, users, and hashtags
 */

import Post from '../models/Post.js';
import User from '../models/User.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { getTrendingHashtags, getPostsByHashtag, searchHashtags } from '../services/trendingService.js';
import { logger } from '../utils/logger.js';

/**
 * @desc    Search all (posts, users, hashtags)
 * @route   GET /api/search
 * @access  Public
 */
export const searchAll = asyncHandler(async (req, res, next) => {
  const { q, type = 'all', page = 1, limit = 20 } = req.query;

  if (!q || q.length < 2) {
    return next(new AppError('Search query must be at least 2 characters', 400));
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const results = {};

  // Search posts
  if (type === 'all' || type === 'posts') {
    const posts = await Post.find({
      $text: { $search: q }
    })
      .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
      .skip(type === 'posts' ? skip : 0)
      .limit(type === 'posts' ? parseInt(limit) : 5)
      .populate('author', 'username avatarColor clan level');

    const postsTotal = await Post.countDocuments({ $text: { $search: q } });

    results.posts = {
      items: posts,
      total: postsTotal
    };
  }

  // Search users
  if (type === 'all' || type === 'users') {
    const users = await User.find({
      username: { $regex: q, $options: 'i' }
    })
      .select('username avatarColor clan level stats')
      .sort({ 'stats.totalPoints': -1 })
      .skip(type === 'users' ? skip : 0)
      .limit(type === 'users' ? parseInt(limit) : 5);

    const usersTotal = await User.countDocuments({
      username: { $regex: q, $options: 'i' }
    });

    results.users = {
      items: users,
      total: usersTotal
    };
  }

  // Search hashtags
  if (type === 'all' || type === 'hashtags') {
    const hashtags = await searchHashtags(q, type === 'hashtags' ? parseInt(limit) : 5);

    results.hashtags = {
      items: hashtags,
      total: hashtags.length
    };
  }

  res.status(200).json({
    success: true,
    data: {
      query: q,
      type,
      results,
      page: parseInt(page),
      limit: parseInt(limit)
    }
  });
});

/**
 * @desc    Search posts
 * @route   GET /api/search/posts
 * @access  Public
 */
export const searchPosts = asyncHandler(async (req, res, next) => {
  const { q, page = 1, limit = 20 } = req.query;

  if (!q || q.length < 2) {
    return next(new AppError('Search query must be at least 2 characters', 400));
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Search using text index or regex
  let posts;
  let total;

  try {
    // Try text search first
    posts = await Post.find({ $text: { $search: q } })
      .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'username avatarColor clan level');

    total = await Post.countDocuments({ $text: { $search: q } });
  } catch (error) {
    // Fallback to regex search
    posts = await Post.find({
      content: { $regex: q, $options: 'i' }
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'username avatarColor clan level');

    total = await Post.countDocuments({
      content: { $regex: q, $options: 'i' }
    });
  }

  // Add isLiked flag for authenticated users
  if (req.user) {
    posts = posts.map(post => {
      const postObj = post.toObject();
      postObj.isLiked = post.isLikedBy(req.user._id);
      return postObj;
    });
  }

  res.status(200).json({
    success: true,
    data: {
      posts,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      query: q
    }
  });
});

/**
 * @desc    Search users
 * @route   GET /api/search/users
 * @access  Public
 */
export const searchUsers = asyncHandler(async (req, res, next) => {
  const { q, page = 1, limit = 20 } = req.query;

  if (!q || q.length < 2) {
    return next(new AppError('Search query must be at least 2 characters', 400));
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const users = await User.find({
    username: { $regex: q, $options: 'i' }
  })
    .select('username avatarColor clan level stats createdAt')
    .sort({ 'stats.totalPoints': -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments({
    username: { $regex: q, $options: 'i' }
  });

  res.status(200).json({
    success: true,
    data: {
      users,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      query: q
    }
  });
});

/**
 * @desc    Get trending hashtags
 * @route   GET /api/search/trending
 * @access  Public
 */
export const getTrending = asyncHandler(async (req, res, next) => {
  const { limit = 10 } = req.query;

  const trending = await getTrendingHashtags(parseInt(limit));

  res.status(200).json({
    success: true,
    data: {
      trending
    }
  });
});

/**
 * @desc    Get posts by hashtag
 * @route   GET /api/search/hashtag/:hashtag
 * @access  Public
 */
export const getHashtagPosts = asyncHandler(async (req, res, next) => {
  const { hashtag } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const result = await getPostsByHashtag(hashtag, parseInt(page), parseInt(limit));

  // Add isLiked flag for authenticated users
  if (req.user) {
    result.posts = result.posts.map(post => {
      const postObj = post.toObject();
      postObj.isLiked = post.isLikedBy(req.user._id);
      return postObj;
    });
  }

  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * @desc    Search hashtags (autocomplete)
 * @route   GET /api/search/hashtags
 * @access  Public
 */
export const searchHashtagsRoute = asyncHandler(async (req, res, next) => {
  const { q, limit = 10 } = req.query;

  if (!q) {
    return next(new AppError('Search query is required', 400));
  }

  const hashtags = await searchHashtags(q, parseInt(limit));

  res.status(200).json({
    success: true,
    data: {
      hashtags,
      query: q
    }
  });
});

/**
 * @desc    Get search suggestions
 * @route   GET /api/search/suggestions
 * @access  Public
 */
export const getSearchSuggestions = asyncHandler(async (req, res, next) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.status(200).json({
      success: true,
      data: {
        suggestions: []
      }
    });
  }

  // Get user suggestions
  const users = await User.find({
    username: { $regex: `^${q}`, $options: 'i' }
  })
    .select('username avatarColor clan')
    .limit(3);

  // Get hashtag suggestions
  const hashtags = await searchHashtags(q, 3);

  const suggestions = [
    ...users.map(u => ({
      type: 'user',
      value: u.username,
      data: u
    })),
    ...hashtags.map(h => ({
      type: 'hashtag',
      value: `#${h.hashtag}`,
      data: h
    }))
  ];

  res.status(200).json({
    success: true,
    data: {
      suggestions,
      query: q
    }
  });
});

export default {
  searchAll,
  searchPosts,
  searchUsers,
  getTrending,
  getHashtagPosts,
  searchHashtagsRoute,
  getSearchSuggestions
};