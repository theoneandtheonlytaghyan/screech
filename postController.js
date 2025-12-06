/**
 * Post Controller
 * Handles post (hoot) CRUD operations with safer DB updates and robust response shaping.
 */

import Post from '../models/Post.js';
import User from '../models/User.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { createLikeNotification } from '../services/notificationService.js';
import { POINTS, LIKE_EXPIRATION_DAYS } from '../config/constants.js';
import { logger } from '../utils/logger.js';

/* Helper: robustly convert post to plain object and determine isLiked */
const toPlainPost = (post) => {
  // If it's a Mongoose document, call toObject; if plain already, return as-is
  try {
    return typeof post.toObject === 'function' ? post.toObject() : post;
  } catch (err) {
    return post;
  }
};

const isPostLikedBy = (post, userId) => {
  if (!userId) return false;
  try {
    // If model instance exposes helper method
    if (post && typeof post.isLikedBy === 'function') {
      return Boolean(post.isLikedBy(userId));
    }
    // If lean object contains array of likes
    if (Array.isArray(post.likes)) {
      return post.likes.some((id) => String(id) === String(userId));
    }
    if (Array.isArray(post.likers)) {
      return post.likers.some((id) => String(id) === String(userId));
    }
    if (Array.isArray(post.likedBy)) {
      return post.likedBy.some((id) => String(id) === String(userId));
    }
    // No reliable list present — conservatively return false
    return false;
  } catch (err) {
    logger.debug('isPostLikedBy check failed', { err: err?.message });
    return false;
  }
};

/**
 * Create new post
 * POST /api/posts
 * Private
 */
export const createPost = asyncHandler(async (req, res, next) => {
  if (!req.user) return next(new AppError('Not authenticated', 401));

  const { content } = req.body || {};
  if (!content || String(content).trim().length === 0) {
    return next(new AppError('Post content is required', 400));
  }

  // Create post document
  const post = await Post.create({
    author: req.user._id,
    content: String(content).trim()
  });

  // Update author stats atomically, then fetch saved user for derived fields (level)
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $inc: {
          'stats.postsCount': 1,
          'stats.totalPoints': POINTS.POST_CREATED
        }
      },
      { new: false }
    ).exec();

    // Fetch and recompute level if method exists
    const freshUser = await User.findById(req.user._id);
    if (freshUser) {
      if (typeof freshUser.calculateLevel === 'function') {
        freshUser.level = freshUser.calculateLevel();
        await freshUser.save();
      } else {
        await freshUser.save().catch(() => {});
      }
    }
  } catch (err) {
    logger.warn('Failed to update user stats after post creation', { err: err?.message, userId: req.user._id });
  }

  // Populate author details for the response
  await post.populate('author', 'username avatarColor clan level').execPopulate?.() || post.populate('author', 'username avatarColor clan level');

  logger.info('Post created', { postId: post._id, author: String(req.user._id) });

  res.status(201).json({
    success: true,
    message: 'Post created successfully',
    data: {
      post: toPlainPost(post)
    }
  });
});

/**
 * Get posts (feed)
 * GET /api/posts
 * Public
 */
export const getPosts = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20, hashtag } = req.query;

  const result = await Post.getFeed({
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    hashtag
  });

  // Normalize posts and attach isLiked when possible
  const userId = req.user && (req.user._id || req.user.id) ? (req.user._id || req.user.id) : null;
  const posts = (result.posts || []).map((post) => {
    const p = toPlainPost(post);
    p.isLiked = isPostLikedBy(post, userId);
    return p;
  });

  res.status(200).json({
    success: true,
    data: {
      ...result,
      posts
    }
  });
});

/**
 * Get single post
 * GET /api/posts/:id
 * Public
 */
export const getPost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id)
    .populate('author', 'username avatarColor clan level');

  if (!post) return next(new AppError('Post not found', 404));

  const p = toPlainPost(post);
  p.isLiked = isPostLikedBy(post, req.user && (req.user._id || req.user.id));

  res.status(200).json({
    success: true,
    data: {
      post: p
    }
  });
});

/**
 * Update post
 * PUT /api/posts/:id
 * Private
 */
export const updatePost = asyncHandler(async (req, res, next) => {
  if (!req.user) return next(new AppError('Not authenticated', 401));

  const { content } = req.body || {};
  if (!content || String(content).trim().length === 0) {
    return next(new AppError('Post content is required', 400));
  }

  const post = await Post.findById(req.params.id);
  if (!post) return next(new AppError('Post not found', 404));

  if (String(post.author) !== String(req.user._id)) {
    return next(new AppError('Not authorized to update this post', 403));
  }

  post.content = String(content).trim();
  post.isEdited = true;
  post.editedAt = new Date();
  await post.save();

  await post.populate('author', 'username avatarColor clan level').execPopulate?.() || post.populate('author', 'username avatarColor clan level');

  logger.info('Post updated', { postId: post._id, author: String(req.user._id) });

  res.status(200).json({
    success: true,
    message: 'Post updated successfully',
    data: {
      post: toPlainPost(post)
    }
  });
});

/**
 * Delete post
 * DELETE /api/posts/:id
 * Private
 */
export const deletePost = asyncHandler(async (req, res, next) => {
  if (!req.user) return next(new AppError('Not authenticated', 401));

  const post = await Post.findById(req.params.id);
  if (!post) return next(new AppError('Post not found', 404));

  if (String(post.author) !== String(req.user._id)) {
    return next(new AppError('Not authorized to delete this post', 403));
  }

  await Post.findByIdAndDelete(req.params.id);

  // Decrement user post count safely
  try {
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.postsCount': -1 } }).exec();
  } catch (err) {
    logger.warn('Failed to decrement user post count after deletion', { err: err?.message, userId: req.user._id });
  }

  logger.info('Post deleted', { postId: req.params.id, author: String(req.user._id) });

  res.status(200).json({
    success: true,
    message: 'Post deleted successfully'
  });
});

/**
 * Like post
 * POST /api/posts/:id/like
 * Private
 */
export const likePost = asyncHandler(async (req, res, next) => {
  if (!req.user) return next(new AppError('Not authenticated', 401));

  const post = await Post.findById(req.params.id);
  if (!post) return next(new AppError('Post not found', 404));

  if (isPostLikedBy(post, req.user._id)) {
    return next(new AppError('You have already liked this post', 400));
  }

  // Add like (model method expected to add to list and update likesCount)
  if (typeof post.addLike === 'function') {
    post.addLike(req.user._id, LIKE_EXPIRATION_DAYS);
    await post.save();
  } else {
    // Fallback: attempt atomic update
    await Post.findByIdAndUpdate(post._id, { $addToSet: { likes: req.user._id }, $inc: { likesCount: 1 } }).exec();
  }

  // Update author and liker stats in parallel (author may be the same as liker)
  const authorId = post.author;
  const likerId = req.user._id;
  const tasks = [];

  if (String(authorId) !== String(likerId)) {
    // update author points & received likes
    tasks.push(
      (async () => {
        try {
          const author = await User.findById(authorId);
          if (author) {
            author.stats.likesReceived = (author.stats.likesReceived || 0) + 1;
            author.stats.totalPoints = (author.stats.totalPoints || 0) + POINTS.LIKE_RECEIVED;
            if (typeof author.calculateLevel === 'function') {
              author.level = author.calculateLevel();
            }
            await author.save();
          }
        } catch (e) {
          logger.warn('Failed to update post author stats after like', { err: e?.message, authorId });
        }
      })()
    );
  }

  // update liker stats
  tasks.push(
    (async () => {
      try {
        const liker = await User.findById(likerId);
        if (liker) {
          liker.stats.likesGiven = (liker.stats.likesGiven || 0) + 1;
          liker.stats.totalPoints = (liker.stats.totalPoints || 0) + POINTS.LIKE_GIVEN;
          if (typeof liker.calculateLevel === 'function') {
            liker.level = liker.calculateLevel();
          }
          await liker.save();
        }
      } catch (e) {
        logger.warn('Failed to update liker stats after like', { err: e?.message, likerId });
      }
    })()
  );

  // Send notification to post author if not self-like
  if (String(authorId) !== String(likerId)) {
    tasks.push(
      createLikeNotification(
        authorId,
        likerId,
        req.user.username,
        post._id
      ).catch((e) => logger.warn('Failed to create like notification', { err: e?.message }))
    );
  }

  await Promise.all(tasks);

  // Refresh post likesCount if model doesn't keep it updated in-memory
  const freshPost = await Post.findById(post._id).lean().exec();

  logger.info('Post liked', { postId: post._id, liker: String(likerId) });

  res.status(200).json({
    success: true,
    message: 'Post liked successfully',
    data: {
      likesCount: freshPost?.likesCount ?? post.likesCount ?? 0
    }
  });
});

/**
 * Unlike post
 * DELETE /api/posts/:id/like
 * Private
 */
export const unlikePost = asyncHandler(async (req, res, next) => {
  if (!req.user) return next(new AppError('Not authenticated', 401));

  const post = await Post.findById(req.params.id);
  if (!post) return next(new AppError('Post not found', 404));

  if (!isPostLikedBy(post, req.user._id)) {
    return next(new AppError('You have not liked this post', 400));
  }

  if (typeof post.removeLike === 'function') {
    post.removeLike(req.user._id);
    await post.save();
  } else {
    await Post.findByIdAndUpdate(post._id, { $pull: { likes: req.user._id }, $inc: { likesCount: -1 } }).exec();
  }

  // Update liker stats
  try {
    const liker = await User.findById(req.user._id);
    if (liker) {
      liker.stats.likesGiven = Math.max(0, (liker.stats.likesGiven || 0) - 1);
      await liker.save();
    }
  } catch (e) {
    logger.warn('Failed to update liker stats after unlike', { err: e?.message, likerId: req.user._id });
  }

  const freshPost = await Post.findById(post._id).lean().exec();

  logger.info('Post unliked', { postId: post._id, liker: String(req.user._id) });

  res.status(200).json({
    success: true,
    message: 'Post unliked successfully',
    data: {
      likesCount: freshPost?.likesCount ?? post.likesCount ?? 0
    }
  });
});

/**
 * Get posts by user
 * GET /api/posts/user/:id
 * Public
 */
export const getUserPosts = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;

  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found', 404));

  const result = await Post.getFeed({
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    userId: req.params.id
  });

  const userId = req.user && (req.user._id || req.user.id) ? (req.user._id || req.user.id) : null;
  const posts = (result.posts || []).map((post) => {
    const p = toPlainPost(post);
    p.isLiked = isPostLikedBy(post, userId);
    return p;
  });

  res.status(200).json({
    success: true,
    data: {
      ...result,
      posts
    }
  });
});

export default {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  getUserPosts
};