/**
 * Clan Service
 * Handles clan rankings and scoring
 *
 * - calculateClanRankings: uses MongoDB aggregation to compute stats per clan
 * - getTopClans: returns top N clans
 * - getClanByName: returns a specific clan with stats (case-insensitive)
 * - getClanMembers: paginated list of members for a clan (case-insensitive)
 * - getUserClanRank: efficient single-query rank calculation for a user within a clan
 */

import User from '../models/User.js';
import { CLANS } from '../config/constants.js';
import { paginate } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

/**
 * Escape string for use in RegExp (exact match)
 */
const escapeRegex = (str = '') => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Calculate clan scores based on member activity using aggregation (DB-side)
 * Returns array of clans with stats and rank, sorted by score desc.
 * Each returned object includes: name, emoji, color, description, memberCount, score, totalPosts, totalLikes, rank
 */
export const calculateClanRankings = async () => {
  try {
    // Aggregate user stats grouped by clan name
    const agg = await User.aggregate([
      // Only include users that have a clan name
      { $match: { 'clan.name': { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$clan.name',
          memberCount: { $sum: 1 },
          score: { $sum: { $ifNull: ['$stats.totalPoints', 0] } },
          totalPosts: { $sum: { $ifNull: ['$stats.postsCount', 0] } },
          totalLikes: { $sum: { $ifNull: ['$stats.likesReceived', 0] } }
        }
      }
    ]);

    // Map aggregation results to a lookup by clan name
    const scoreMap = Object.fromEntries(agg.map(a => [a._id, a]));

    // Ensure clans with no members are included
    const rankings = CLANS.map(clan => {
      const stats = scoreMap[clan.name] || { memberCount: 0, score: 0, totalPosts: 0, totalLikes: 0 };
      return {
        ...clan,
        memberCount: stats.memberCount,
        score: stats.score,
        totalPosts: stats.totalPosts,
        totalLikes: stats.totalLikes
      };
    })
      .sort((a, b) => b.score - a.score)
      .map((clan, idx) => ({ ...clan, rank: idx + 1 }));

    return rankings;
  } catch (err) {
    logger.error('Failed to calculate clan rankings', err);
    throw err;
  }
};

/**
 * Get top clans for leaderboard
 * @param {number} limit - Number of clans to return
 */
export const getTopClans = async (limit = 5) => {
  const rankings = await calculateClanRankings();
  return rankings.slice(0, Math.max(0, limit));
};

/**
 * Get clan by name (case-insensitive)
 * @param {string} clanName
 */
export const getClanByName = async (clanName) => {
  if (!clanName) return null;
  const rankings = await calculateClanRankings();
  return rankings.find(c => c.name.toLowerCase() === clanName.toLowerCase()) || null;
};

/**
 * Get clan members with pagination (case-insensitive clan name match)
 * @param {string} clanName
 * @param {number} page
 * @param {number} limit
 */
export const getClanMembers = async (clanName, page = 1, limit = 20) => {
  if (!clanName) {
    return { members: [], total: 0, page: 1, pages: 0 };
  }

  const { skip, limit: safeLimit } = paginate(page, limit);

  // Case-insensitive exact match for clan name
  const regex = new RegExp(`^${escapeRegex(clanName)}$`, 'i');

  try {
    const members = await User.find({ 'clan.name': regex })
      .select('username avatarColor stats createdAt')
      .sort({ 'stats.totalPoints': -1 })
      .skip(skip)
      .limit(safeLimit)
      .exec();

    const total = await User.countDocuments({ 'clan.name': regex });

    return {
      members,
      total,
      page: Math.max(1, Number(page) || 1),
      pages: Math.ceil(total / safeLimit)
    };
  } catch (err) {
    logger.error(`Failed to get members for clan "${clanName}"`, err);
    throw err;
  }
};

/**
 * Get user rank within their clan efficiently (single DB count)
 * @param {string} userId
 * @param {string} clanName
 * @returns {number|null} rank (1-based) or null if user/clan not found
 */
export const getUserClanRank = async (userId, clanName) => {
  if (!userId || !clanName) return null;

  try {
    // Fetch user's points first
    const user = await User.findById(userId).select('stats').lean();
    if (!user) return null;

    const userPoints = (user.stats && typeof user.stats.totalPoints === 'number') ? user.stats.totalPoints : 0;
    const regex = new RegExp(`^${escapeRegex(clanName)}$`, 'i');

    // Count how many members have strictly more points than this user
    const higherCount = await User.countDocuments({
      'clan.name': regex,
      'stats.totalPoints': { $gt: userPoints }
    });

    return higherCount + 1;
  } catch (err) {
    logger.error(`Failed to compute clan rank for user ${userId} in clan "${clanName}"`, err);
    throw err;
  }
};

export default {
  calculateClanRankings,
  getTopClans,
  getClanByName,
  getClanMembers,
  getUserClanRank
};