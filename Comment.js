/**
 * Comment Model
 * Defines the schema for comments on posts
 */

import mongoose from 'mongoose';
import { paginate } from '../utils/helpers.js';

const commentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    maxlength: [280, 'Comment cannot exceed 280 characters'],
    trim: true
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  repliesCount: {
    type: Number,
    default: 0
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });
// Compound index to support fetching comments/replies for a post quickly
commentSchema.index({ post: 1, parentComment: 1, createdAt: -1 });

// Defensive helper for ID comparison
const idEquals = (a, b) => String(a) === String(b);

// Check if user has liked this comment
commentSchema.methods.isLikedBy = function(userId) {
  if (!userId || !Array.isArray(this.likes)) return false;
  const uid = String(userId);
  return this.likes.some(like => String(like.user) === uid);
};

/**
 * Add like to comment
 * @param {ObjectId} userId
 * @param {Object} opts - { save: boolean } - if true, method will save the document
 * @returns {Promise<boolean>} true if added, false if already liked
 */
commentSchema.methods.addLike = async function(userId, { save = false } = {}) {
  if (!userId) return false;
  if (this.isLikedBy(userId)) return false;

  this.likes = this.likes || [];
  this.likes.push({
    user: userId,
    createdAt: new Date()
  });
  this.likesCount = this.likes.length;

  if (save) await this.save();
  return true;
};

/**
 * Remove like from comment
 * @param {ObjectId} userId
 * @param {Object} opts - { save: boolean } - if true, method will save the document
 * @returns {Promise<boolean>} true if removed, false if not found
 */
commentSchema.methods.removeLike = async function(userId, { save = false } = {}) {
  if (!userId || !Array.isArray(this.likes)) return false;
  const uid = String(userId);
  const initialLength = this.likes.length;
  this.likes = this.likes.filter(like => String(like.user) !== uid);
  this.likesCount = this.likes.length;

  if (save) await this.save();
  return this.likes.length < initialLength;
};

// Format for JSON response
commentSchema.methods.toJSON = function() {
  const comment = this.toObject();

  comment.likedBy = (comment.likes || []).map(like => like.user);
  delete comment.likes;
  delete comment.__v;

  return comment;
};

// Static method to get comments for a post (paginated, lean, parallel counts)
commentSchema.statics.getPostComments = async function(postId, options = {}) {
  const {
    page = 1,
    limit = 20,
    parentComment = null
  } = options;

  const { skip, limit: safeLimit } = paginate(page, limit);

  const query = {
    post: postId,
    parentComment: parentComment
  };

  const [comments, total] = await Promise.all([
    this.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate('author', 'username avatarColor clan level')
      .lean()
      .exec(),
    this.countDocuments(query)
  ]);

  return {
    comments,
    total,
    page: Math.max(1, Number(page) || 1),
    pages: Math.ceil(total / safeLimit) || 0,
    hasMore: skip + comments.length < total
  };
};

// Static method to get replies for a comment (paginated, lean)
commentSchema.statics.getReplies = async function(commentId, options = {}) {
  const {
    page = 1,
    limit = 10
  } = options;

  const { skip, limit: safeLimit } = paginate(page, limit);

  const [replies, total] = await Promise.all([
    this.find({ parentComment: commentId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(safeLimit)
      .populate('author', 'username avatarColor clan level')
      .lean()
      .exec(),
    this.countDocuments({ parentComment: commentId })
  ]);

  return {
    replies,
    total,
    page: Math.max(1, Number(page) || 1),
    pages: Math.ceil(total / safeLimit) || 0,
    hasMore: skip + replies.length < total
  };
};

// Update parent comment replies count after save (incremental when it's a new reply)
commentSchema.post('save', async function() {
  try {
    if (this.parentComment && this.isNew) {
      const Comment = mongoose.model('Comment');
      await Comment.findByIdAndUpdate(this.parentComment, { $inc: { repliesCount: 1 } }).exec();
    }
  } catch (err) {
    // Log or handle if you have a logger; avoid throwing in hooks
  }
});

// Update parent comment replies count after delete (decrement)
commentSchema.post('findOneAndDelete', async function(doc) {
  try {
    if (doc && doc.parentComment) {
      const Comment = mongoose.model('Comment');
      await Comment.findByIdAndUpdate(doc.parentComment, { $inc: { repliesCount: -1 } }).exec();
    }
  } catch (err) {
    // Log or handle if you have a logger; avoid throwing in hooks
  }
});

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;