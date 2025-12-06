/**
 * User Controller
 * Handles user profile and identity operations
 */

import User from '../models/User.js';
import Post from '../models/Post.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { regenerateIdentity } from '../services/identityGenerator.js';
import { getUserClanRank } from '../services/clanService.js';
import { logger } from '../utils/logger.js';

/**
 * @desc    Get user profile
 * @route   GET /api/users/:id
 * @access  Public
 */
export const getUserProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Get user's clan rank
  const clanRank = await getUserClanRank(user._id, user.clan.name);

  const profile = user.toPublicProfile();
  profile.clanRank = clanRank;

  res.status(200).json({
    success: true,
    data: {
      user: profile
    }
  });
});

/**
 * @desc    Get user stats
 * @route   GET /api/users/:id/stats
 * @access  Public
 */
export const getUserStats = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Get additional stats
  const postsCount = await Post.countDocuments({ author: user._id });
  const clanRank = await getUserClanRank(user._id, user.clan.name);

  res.status(200).json({
    success: true,
    data: {
      stats: {
        ...user.stats.toObject(),
        postsCount,
        level: user.level,
        clanRank,
        memberSince: user.createdAt
      }
    }
  });
});

/**
 * @desc    Regenerate user identity
 * @route   POST /api/users/regenerate-identity
 * @access  Private
 */
export const regenerateUserIdentity = asyncHandler(async (req, res, next) => {
  const { keepClan = false } = req.body;

  // Check cooldown (can only regenerate once per 24 hours)
  const lastRegeneration = req.user.identityRegeneratedAt;
  if (lastRegeneration) {
    const hoursSinceLastRegeneration = (Date.now() - lastRegeneration.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastRegeneration < 24) {
      const hoursRemaining = Math.ceil(24 - hoursSinceLastRegeneration);
      return next(new AppError(`You can regenerate your identity in ${hoursRemaining} hours`, 429));
    }
  }

  // Generate new identity
  const newIdentity = regenerateIdentity({
    keepClan,
    currentClan: req.user.clan
  });

  // Ensure username is unique
  let username = newIdentity.username;
  let usernameExists = await User.findOne({ username, _id: { $ne: req.user._id } });
  let attempts = 0;

  while (usernameExists && attempts < 10) {
    const anotherIdentity = regenerateIdentity({ keepClan, currentClan: req.user.clan });
    username = anotherIdentity.username;
    usernameExists = await User.findOne({ username, _id: { $ne: req.user._id } });
    attempts++;
  }

  // Update user
  req.user.username = username;
  req.user.avatarColor = newIdentity.avatarColor;
  if (!keepClan) {
    req.user.clan = newIdentity.clan;
  }
  req.user.identityRegeneratedAt = new Date();
  await req.user.save();

  logger.info(`Identity regenerated for user: ${req.user._id}`);

  res.status(200).json({
    success: true,
    message: 'Identity regenerated successfully',
    data: {
      user: req.user.toPublicProfile()
    }
  });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/users/me
 * @access  Private
 */
export const getMyProfile = asyncHandler(async (req, res, next) => {
  const clanRank = await getUserClanRank(req.user._id, req.user.clan.name);

  const profile = req.user.toPublicProfile();
  profile.clanRank = clanRank;

  res.status(200).json({
    success: true,
    data: {
      user: profile
    }
  });
});

/**
 * @desc    Update online status
 * @route   PUT /api/users/online-status
 * @access  Private
 */
export const updateOnlineStatus = asyncHandler(async (req, res, next) => {
  const { isOnline } = req.body;

  req.user.isOnline = isOnline;
  req.user.lastSeen = new Date();
  await req.user.save();

  res.status(200).json({
    success: true,
    message: 'Online status updated',
    data: {
      isOnline: req.user.isOnline,
      lastSeen: req.user.lastSeen
    }
  });
});

/**
 * @desc    Get user's posts
 * @route   GET /api/users/:id/posts
 * @access  Public
 */
export const getUserPosts = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const result = await Post.getFeed({
    page: parseInt(page),
    limit: parseInt(limit),
    userId: req.params.id
  });

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
 * @desc    Search users
 * @route   GET /api/users/search
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
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

/**
 * @desc    Get leaderboard
 * @route   GET /api/users/leaderboard
 * @access  Public
 */
export const getLeaderboard = asyncHandler(async (req, res, next) => {
  const { limit = 10 } = req.query;

  const users = await User.find({})
    .select('username avatarColor clan level stats')
    .sort({ 'stats.totalPoints': -1 })
    .limit(parseInt(limit));

  const leaderboard = users.map((user, index) => ({
    rank: index + 1,
    ...user.toPublicProfile()
  }));

  res.status(200).json({
    success: true,
    data: {
      leaderboard
    }
  });
});

export default {
  getUserProfile,
  getUserStats,
  regenerateUserIdentity,
  getMyProfile,
  updateOnlineStatus,
  getUserPosts,
  searchUsers,
  getLeaderboard
};