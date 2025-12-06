/**
 * Post Model
 * Defines the schema for hoots (posts)
 */

import mongoose from 'mongoose';
import { extractHashtags, paginate } from '../utils/helpers.js';

const likeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, { _id: false });

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Post content is required'],
    maxlength: [180, 'Post cannot exceed 180 characters'],
    trim: true
  },
  hashtags: [{
    type: String,
    lowercase: true
  }],
  likes: [likeSchema],
  likesCount: {
    type: Number,
    default: 0
  },
  commentsCount: {
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

// Indexes for better query performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ hashtags: 1, createdAt: -1 }); // compound for recent-hashtag queries
postSchema.index({ createdAt: -1 });
postSchema.index({ likesCount: -1 });
postSchema.index({ content: 'text' });

// Extract hashtags before saving; also remove expired likes and update likesCount
postSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    this.hashtags = extractHashtags(this.content);
  }

  // Remove expired likes and update likesCount
  const now = new Date();
  if (Array.isArray(this.likes) && this.likes.length) {
    this.likes = this.likes.filter(like => like.expiresAt > now);
    this.likesCount = this.likes.length;
  } else {
    this.likesCount = 0;
  }

  next();
});

// Keep hashtags in sync for query-style updates (findOneAndUpdate / findByIdAndUpdate)
postSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (!update) return next();

  const content = update.content || (update.$set && update.$set.content);
  if (!content) return next();

  try {
    const tags = extractHashtags(content);
    if (update.$set) {
      update.$set.hashtags = tags;
    } else {
      update.hashtags = tags;
    }
    this.setUpdate(update);
  } catch (err) {
    // continue defensively
  }

  next();
});

// Update likes count (in-memory) - callers should save() after mutations if they expect persistence
postSchema.methods.updateLikesCount = function() {
  const now = new Date();
  this.likes = (this.likes || []).filter(like => like.expiresAt > now);
  this.likesCount = this.likes.length;
};

// Check if user has liked this post
postSchema.methods.isLikedBy = function(userId) {
  const now = new Date();
  if (!this.likes || this.likes.length === 0) return false;
  const uid = String(userId);
  return this.likes.some(
    like => String(like.user) === uid && like.expiresAt > now
  );
};

// Add like to post (mutates document; caller should save())
postSchema.methods.addLike = function(userId, expirationDays = 7) {
  if (this.isLikedBy(userId)) {
    return false;
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expirationDays);

  this.likes.push({
    user: userId,
    createdAt: new Date(),
    expiresAt
  });

  this.likesCount = this.likes.length;
  return true;
};

// Remove like from post (mutates document; caller should save())
postSchema.methods.removeLike = function(userId) {
  const initialLength = this.likes ? this.likes.length : 0;
  const uid = String(userId);
  this.likes = (this.likes || []).filter(
    like => String(like.user) !== uid
  );
  this.likesCount = this.likes.length;
  return this.likes.length < initialLength;
};

// Get post with author details for response
postSchema.methods.toJSON = function() {
  const post = this.toObject();

  // Convert likes array to just user IDs for response (only currently active likes)
  post.likedBy = (post.likes || [])
    .filter(like => like.expiresAt > new Date())
    .map(like => like.user);

  delete post.likes;
  delete post.__v;

  return post;
};

// Static method to get feed posts (uses paginate + lean)
postSchema.statics.getFeed = async function(options = {}) {
  const {
    page = 1,
    limit = 20,
    userId = null,
    hashtag = null
  } = options;

  const { skip, limit: safeLimit } = paginate(page, limit);
  const query = {};

  if (userId) {
    query.author = userId;
  }

  if (hashtag) {
    query.hashtags = String(hashtag).toLowerCase();
  }

  const [posts, total] = await Promise.all([
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
    posts,
    total,
    page: Math.max(1, Number(page) || 1),
    pages: Math.ceil(total / safeLimit) || 0,
    hasMore: skip + posts.length < total
  };
};

// Static method to clean expired likes (only touch affected posts)
postSchema.statics.cleanExpiredLikes = async function() {
  const now = new Date();

  // Find affected post ids first
  const affectedIds = await this.distinct('_id', { 'likes.expiresAt': { $lt: now } });
  if (!affectedIds || affectedIds.length === 0) {
    return { affectedCount: 0 };
  }

  // Pull expired likes from affected posts
  await this.updateMany(
    { _id: { $in: affectedIds } },
    { $pull: { likes: { expiresAt: { $lt: now } } } }
  );

  // Recompute likesCount for those posts using an update pipeline (requires MongoDB 4.2+)
  await this.updateMany(
    { _id: { $in: affectedIds } },
    [{ $set: { likesCount: { $size: '$likes' } } }]
  );

  return { affectedCount: affectedIds.length };
};

const Post = mongoose.model('Post', postSchema);

export default Post;