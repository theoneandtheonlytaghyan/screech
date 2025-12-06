/**
 * Clan Controller
 * Handles clan operations and rankings
 */

import Clan from '../models/Clan.js';
import User from '../models/User.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { getTopClans, getClanMembers, calculateClanRankings } from '../services/clanService.js';
import { CLANS } from '../config/constants.js';
import { logger } from '../utils/logger.js';

/**
 * @desc    Get all clans with rankings
 * @route   GET /api/clans
 * @access  Public
 */
export const getAllClans = asyncHandler(async (req, res, next) => {
  const rankings = await calculateClanRankings();

  res.status(200).json({
    success: true,
    data: {
      clans: rankings
    }
  });
});

/**
 * @desc    Get top clans leaderboard
 * @route   GET /api/clans/leaderboard
 * @access  Public
 */
export const getClanLeaderboard = asyncHandler(async (req, res, next) => {
  const { limit = 5 } = req.query;

  const topClans = await getTopClans(parseInt(limit));

  res.status(200).json({
    success: true,
    data: {
      leaderboard: topClans
    }
  });
});

/**
 * @desc    Get clan by name
 * @route   GET /api/clans/:name
 * @access  Public
 */
export const getClanByName = asyncHandler(async (req, res, next) => {
  const { name } = req.params;

  // Find clan from constants
  const clanInfo = CLANS.find(c => c.name.toLowerCase() === name.toLowerCase());

  if (!clanInfo) {
    return next(new AppError('Clan not found', 404));
  }

  // Get clan stats from rankings
  const rankings = await calculateClanRankings();
  const clanStats = rankings.find(c => c.name.toLowerCase() === name.toLowerCase());

  res.status(200).json({
    success: true,
    data: {
      clan: clanStats || { ...clanInfo, score: 0, memberCount: 0, rank: 0 }
    }
  });
});

/**
 * @desc    Get clan members
 * @route   GET /api/clans/:name/members
 * @access  Public
 */
export const getClanMembersList = asyncHandler(async (req, res, next) => {
  const { name } = req.params;
  const { page = 1, limit = 20 } = req.query;

  // Verify clan exists
  const clanInfo = CLANS.find(c => c.name.toLowerCase() === name.toLowerCase());

  if (!clanInfo) {
    return next(new AppError('Clan not found', 404));
  }

  const result = await getClanMembers(clanInfo.name, parseInt(page), parseInt(limit));

  // Add rank to each member
  result.members = result.members.map((member, index) => ({
    ...member.toObject(),
    clanRank: (parseInt(page) - 1) * parseInt(limit) + index + 1
  }));

  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * @desc    Get clan statistics
 * @route   GET /api/clans/:name/stats
 * @access  Public
 */
export const getClanStats = asyncHandler(async (req, res, next) => {
  const { name } = req.params;

  // Verify clan exists
  const clanInfo = CLANS.find(c => c.name.toLowerCase() === name.toLowerCase());

  if (!clanInfo) {
    return next(new AppError('Clan not found', 404));
  }

  // Get detailed stats
  const memberCount = await User.countDocuments({ 'clan.name': clanInfo.name });

  const statsAggregation = await User.aggregate([
    { $match: { 'clan.name': clanInfo.name } },
    {
      $group: {
        _id: null,
        totalPoints: { $sum: '$stats.totalPoints' },
        totalPosts: { $sum: '$stats.postsCount' },
        totalLikesReceived: { $sum: '$stats.likesReceived' },
        totalCommentsReceived: { $sum: '$stats.commentsReceived' },
        avgPoints: { $avg: '$stats.totalPoints' },
        avgLevel: { $avg: '$level' }
      }
    }
  ]);

  const stats = statsAggregation[0] || {
    totalPoints: 0,
    totalPosts: 0,
    totalLikesReceived: 0,
    totalCommentsReceived: 0,
    avgPoints: 0,
    avgLevel: 1
  };

  // Get top member
  const topMember = await User.findOne({ 'clan.name': clanInfo.name })
    .select('username avatarColor stats level')
    .sort({ 'stats.totalPoints': -1 });

  // Get clan rank
  const rankings = await calculateClanRankings();
  const clanRanking = rankings.find(c => c.name === clanInfo.name);

  res.status(200).json({
    success: true,
    data: {
      clan: clanInfo,
      stats: {
        memberCount,
        totalPoints: stats.totalPoints,
        totalPosts: stats.totalPosts,
        totalLikesReceived: stats.totalLikesReceived,
        totalCommentsReceived: stats.totalCommentsReceived,
        avgPointsPerMember: Math.round(stats.avgPoints || 0),
        avgLevel: Math.round((stats.avgLevel || 1) * 10) / 10,
        rank: clanRanking?.rank || 0
      },
      topMember: topMember ? topMember.toObject() : null
    }
  });
});

/**
 * @desc    Get weekly clan rankings
 * @route   GET /api/clans/rankings/weekly
 * @access  Public
 */
export const getWeeklyRankings = asyncHandler(async (req, res, next) => {
  // Get users created or active in the last 7 days
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const weeklyStats = await User.aggregate([
    {
      $group: {
        _id: '$clan.name',
        weeklyPoints: { $sum: '$stats.totalPoints' },
        memberCount: { $sum: 1 },
        clan: { $first: '$clan' }
      }
    },
    { $sort: { weeklyPoints: -1 } }
  ]);

  const rankings = weeklyStats.map((item, index) => ({
    rank: index + 1,
    name: item._id,
    emoji: item.clan?.emoji,
    color: item.clan?.color,
    weeklyPoints: item.weeklyPoints,
    memberCount: item.memberCount
  }));

  res.status(200).json({
    success: true,
    data: {
      rankings,
      periodStart: oneWeekAgo,
      periodEnd: new Date()
    }
  });
});

/**
 * @desc    Get my clan info
 * @route   GET /api/clans/me
 * @access  Private
 */
export const getMyClan = asyncHandler(async (req, res, next) => {
  const userClan = req.user.clan;

  // Get clan stats
  const rankings = await calculateClanRankings();
  const clanStats = rankings.find(c => c.name === userClan.name);

  // Get user's rank in clan
  const clanMembers = await User.find({ 'clan.name': userClan.name })
    .select('_id stats')
    .sort({ 'stats.totalPoints': -1 });

  const userRank = clanMembers.findIndex(m => m._id.toString() === req.user._id.toString()) + 1;

  res.status(200).json({
    success: true,
    data: {
      clan: clanStats || userClan,
      userRank,
      totalMembers: clanMembers.length
    }
  });
});

export default {
  getAllClans,
  getClanLeaderboard,
  getClanByName,
  getClanMembersList,
  getClanStats,
  getWeeklyRankings,
  getMyClan
};