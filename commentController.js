/**
 * Comment Controller
 * Improved comment CRUD with safer DB updates, atomic increments, and robust responses.
 */

import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { createCommentNotification } from '../services/notificationService.js';
import { POINTS } from '../config/constants.js';
import { logger } from '../utils/logger.js';

/* Helpers */
const toPlain = (doc) => (doc && typeof doc.toObject === 'function' ? doc.toObject() : doc);

const isLikedBy = (item, userId) => {
  if (!userId || !item) return false;
  try {
    if (typeof item.isLikedBy === 'function') return Boolean(item.isLikedBy(userId));
    if (Array.isArray(item.likes)) return item.likes.some(id => String(id) === String(userId));
    if (Array.isArray(item.likers)) return item.likers.some(id => String(id) === String(userId));
    return false;
  } catch (err) {
    logger.debug('isLikedBy check failed', { err: err?.message });
    return false;
  }
};

/**
 * Create new comment
 * POST /api/comments
 */
export const createComment = asyncHandler(async (req, res, next) => {
  if (!req.user) return next(new AppError('Not authenticated', 401));

  const { content, postId, parentCommentId } = req.body || {};

  if (!content || String(content).trim().length === 0) {
    return next(new AppError('Comment content is required', 400));
  }
  if (!postId) return next(new AppError('postId is required', 400));

  const post = await Post.findById(postId).exec();
  if (!post) return next(new AppError('Post not found', 404));

  // If parent provided, validate it belongs to post
  if (parentCommentId) {
    const parent = await Comment.findById(parentCommentId).exec();
    if (!parent) return next(new AppError('Parent comment not found', 404));
    if (String(parent.post) !== String(postId)) return next(new AppError('Parent comment does not belong to this post', 400));
  }

  const comment = await Comment.create({
    post: postId,
    author: req.user._id,
    content: String(content).trim(),
    parentComment: parentCommentId || null
  });

  // Parallel atomic updates:
  const ops = [];

  // Increment post comment count
  ops.push(Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } }).exec());

  // Increment parent repliesCount if provided
  if (parentCommentId) {
    ops.push(Comment.findByIdAndUpdate(parentCommentId, { $inc: { repliesCount: 1 } }).exec());
  }

  // Update commenter stats (+ points)
  ops.push(User.findByIdAndUpdate(req.user._id, {
    $inc: { 'stats.commentsGiven': 1, 'stats.totalPoints': POINTS.COMMENT_GIVEN }
  }).exec());

  // If commenter is not post author, update post author stats and create notification
  if (String(post.author) !== String(req.user._id)) {
    ops.push((async () => {
      try {
        await User.findByIdAndUpdate(post.author, {
          $inc: { 'stats.commentsReceived': 1, 'stats.totalPoints': POINTS.COMMENT_RECEIVED }
        }).exec();

        // Create notification (fire-and-forget)
        await createCommentNotification(post.author, req.user._id, req.user.username, post._id, comment._id);
      } catch (e) {
        logger.warn('Failed to update post author stats or send comment notification', { err: e?.message, authorId: post.author });
      }
    })());
  }

  await Promise.all(ops).catch(err => {
    // Non-fatal: log and continue — comment is created
    logger.warn('One or more post/comment/user updates failed after comment create', { err: err?.message });
  });

  // Populate author on comment for response
  await comment.populate('author', 'username avatarColor clan level');

  logger.info('Comment created', { commentId: comment._id, postId, author: String(req.user._id) });

  res.status(201).json({
    success: true,
    message: 'Comment created successfully',
    data: {
      comment: toPlain(comment)
    }
  });
});

/**
 * Get top-level comments for a post
 * GET /api/comments/post/:postId
 */
export const getPostComments = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const post = await Post.findById(postId).exec();
  if (!post) return next(new AppError('Post not found', 404));

  const result = await Comment.getPostComments(postId, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    parentComment: null
  });

  const userId = req.user ? (req.user._id || req.user.id) : null;
  result.comments = (result.comments || []).map(c => {
    const co = toPlain(c);
    co.isLiked = isLikedBy(c, userId);
    return co;
  });

  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * Get replies for a comment
 * GET /api/comments/:id/replies
 */
export const getCommentReplies = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const comment = await Comment.findById(id).exec();
  if (!comment) return next(new AppError('Comment not found', 404));

  const result = await Comment.getReplies(id, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10)
  });

  const userId = req.user ? (req.user._id || req.user.id) : null;
  result.replies = (result.replies || []).map(r => {
    const ro = toPlain(r);
    ro.isLiked = isLikedBy(r, userId);
    return ro;
  });

  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * Get single comment
 * GET /api/comments/:id
 */
export const getComment = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id).populate('author', 'username avatarColor clan level').exec();
  if (!comment) return next(new AppError('Comment not found', 404));

  const obj = toPlain(comment);
  if (req.user) obj.isLiked = isLikedBy(comment, req.user._id);

  res.status(200).json({
    success: true,
    data: { comment: obj }
  });
});

/**
 * Update comment
 * PUT /api/comments/:id
 */
export const updateComment = asyncHandler(async (req, res, next) => {
  if (!req.user) return next(new AppError('Not authenticated', 401));
  const { content } = req.body || {};

  if (!content || String(content).trim().length === 0) {
    return next(new AppError('Comment content is required', 400));
  }

  const comment = await Comment.findById(req.params.id).exec();
  if (!comment) return next(new AppError('Comment not found', 404));

  if (String(comment.author) !== String(req.user._id)) {
    return next(new AppError('Not authorized to update this comment', 403));
  }

  comment.content = String(content).trim();
  comment.isEdited = true;
  comment.editedAt = new Date();
  await comment.save();

  await comment.populate('author', 'username avatarColor clan level');

  logger.info('Comment updated', { commentId: comment._id, author: String(req.user._id) });

  res.status(200).json({
    success: true,
    message: 'Comment updated successfully',
    data: { comment: toPlain(comment) }
  });
});

/**
 * Delete comment (and its direct replies)
 * DELETE /api/comments/:id
 */
export const deleteComment = asyncHandler(async (req, res, next) => {
  if (!req.user) return next(new AppError('Not authenticated', 401));

  const comment = await Comment.findById(req.params.id).exec();
  if (!comment) return next(new AppError('Comment not found', 404));

  if (String(comment.author) !== String(req.user._id)) {
    return next(new AppError('Not authorized to delete this comment', 403));
  }

  // Count direct replies to compute proper decrement
  const repliesResult = await Comment.deleteMany({ parentComment: comment._id }).exec();
  const deletedReplies = repliesResult?.deletedCount || 0;

  // Delete the comment itself
  await Comment.findByIdAndDelete(comment._id).exec();

  // Decrement post commentsCount by 1 + deletedReplies
  try {
    await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -(1 + deletedReplies) } }).exec();
  } catch (err) {
    logger.warn('Failed to decrement post commentsCount after deletion', { err: err?.message, postId: comment.post });
  }

  // Decrement commenter stats
  try {
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.commentsGiven': -1 } }).exec();
  } catch (err) {
    logger.warn('Failed to decrement user commentsGiven after deletion', { err: err?.message, userId: req.user._id });
  }

  // Decrement parent comment repliesCount if this was a reply
  if (comment.parentComment) {
    try {
      await Comment.findByIdAndUpdate(comment.parentComment, { $inc: { repliesCount: -1 } }).exec();
    } catch (err) {
      logger.warn('Failed to decrement parent repliesCount after deletion', { err: err?.message, parentId: comment.parentComment });
    }
  }

  logger.info('Comment deleted', { commentId: String(comment._id), author: String(req.user._id), removedReplies: deletedReplies });

  res.status(200).json({
    success: true,
    message: 'Comment deleted successfully'
  });
});

/**
 * Like comment
 * POST /api/comments/:id/like
 */
export const likeComment = asyncHandler(async (req, res, next) => {
  if (!req.user) return next(new AppError('Not authenticated', 401));

  const comment = await Comment.findById(req.params.id).exec();
  if (!comment) return next(new AppError('Comment not found', 404));

  if (isLikedBy(comment, req.user._id)) {
    return next(new AppError('You have already liked this comment', 400));
  }

  if (typeof comment.addLike === 'function') {
    comment.addLike(req.user._id);
    await comment.save();
  } else {
    await Comment.findByIdAndUpdate(comment._id, { $addToSet: { likes: req.user._id }, $inc: { likesCount: 1 } }).exec();
  }

  // Update liker stats
  try {
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.likesGiven': 1, 'stats.totalPoints': POINTS.LIKE_GIVEN } }).exec();
  } catch (err) {
    logger.warn('Failed to update liker stats after comment like', { err: err?.message, likerId: req.user._id });
  }

  // Notify comment author if not self
  if (String(comment.author) !== String(req.user._id)) {
    await createCommentNotification(comment.author, req.user._id, req.user.username, comment.post, comment._id)
      .catch(e => logger.warn('Failed to create comment like notification', { err: e?.message }));
  }

  const fresh = await Comment.findById(comment._id).lean().exec();

  logger.info('Comment liked', { commentId: comment._id, liker: String(req.user._id) });

  res.status(200).json({
    success: true,
    message: 'Comment liked successfully',
    data: { likesCount: fresh?.likesCount ?? comment.likesCount ?? 0 }
  });
});

/**
 * Unlike comment
 * DELETE /api/comments/:id/like
 */
export const unlikeComment = asyncHandler(async (req, res, next) => {
  if (!req.user) return next(new AppError('Not authenticated', 401));

  const comment = await Comment.findById(req.params.id).exec();
  if (!comment) return next(new AppError('Comment not found', 404));

  if (!isLikedBy(comment, req.user._id)) {
    return next(new AppError('You have not liked this comment', 400));
  }

  if (typeof comment.removeLike === 'function') {
    comment.removeLike(req.user._id);
    await comment.save();
  } else {
    await Comment.findByIdAndUpdate(comment._id, { $pull: { likes: req.user._id }, $inc: { likesCount: -1 } }).exec();
  }

  try {
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.likesGiven': -1 } }).exec();
  } catch (err) {
    logger.warn('Failed to update liker stats after comment unlike', { err: err?.message, likerId: req.user._id });
  }

  const fresh = await Comment.findById(comment._id).lean().exec();

  logger.info('Comment unliked', { commentId: comment._id, liker: String(req.user._id) });

  res.status(200).json({
    success: true,
    message: 'Comment unliked successfully',
    data: { likesCount: fresh?.likesCount ?? comment.likesCount ?? 0 }
  });
});

export default {
  createComment,
  getPostComments,
  getCommentReplies,
  getComment,
  updateComment,
  deleteComment,
  likeComment,
  unlikeComment
};