/**
 * Trending Service
 * Handles trending hashtags calculation (with caching, input validation, and error handling)
 */

import Post from '../models/Post.js';
import { TRENDING_HOURS } from '../config/constants.js';
import { paginate } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

const TRENDING_TTL_MS = Number(process.env.TRENDING_TTL_MS) || 60 * 1000; // 60s default cache

const trendingCache = {
  ts: 0,
  data: null
};

const escapeRegex = (s = '') => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Get trending hashtags
 * - Uses aggregation
 * - Caches results for a short TTL to avoid repeated heavy aggregations
 */
export const getTrendingHashtags = async (limit = 10) => {
  try {
    const now = Date.now();
    if (trendingCache.data && (now - trendingCache.ts) < TRENDING_TTL_MS) {
      return trendingCache.data.slice(0, Math.max(1, Number(limit) || 10));
    }

    const timeThreshold = new Date(Date.now() - TRENDING_HOURS * 60 * 60 * 1000);

    const result = await Post.aggregate([
      { $match: { createdAt: { $gte: timeThreshold }, hashtags: { $exists: true, $ne: [] } } },
      { $unwind: '$hashtags' },
      { $group: { _id: '$hashtags', count: { $sum: 1 }, latestPost: { $max: '$createdAt' } } },
      { $sort: { count: -1 } },
      { $limit: Math.max(1, Number(limit) || 10) },
      { $project: { _id: 0, hashtag: '$_id', count: 1, latestPost: 1 } }
    ]).allowDiskUse(true);

    trendingCache.data = result;
    trendingCache.ts = now;
    return result;
  } catch (err) {
    logger.error('getTrendingHashtags failed', err);
    throw err;
  }
};

/**
 * Get posts by hashtag (paginated)
 */
export const getPostsByHashtag = async (hashtag, page = 1, limit = 20) => {
  const tag = String(hashtag || '').toLowerCase().replace('#', '').trim();
  if (!tag) return { posts: [], total: 0, page: 1, pages: 0, hashtag: '' };

  const { skip, limit: safeLimit } = paginate(page, limit);

  try {
    const posts = await Post.find({ hashtags: tag })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate('author', 'username avatarColor clan')
      .lean()
      .exec();

    const total = await Post.countDocuments({ hashtags: tag });

    return {
      posts,
      total,
      page: Math.max(1, Number(page) || 1),
      pages: Math.ceil(total / safeLimit) || 0,
      hashtag: tag
    };
  } catch (err) {
    logger.error(`getPostsByHashtag failed for #${tag}`, err);
    throw err;
  }
};

/**
 * Get hashtag statistics
 */
export const getHashtagStats = async (hashtag) => {
  const tag = String(hashtag || '').toLowerCase().replace('#', '').trim();
  if (!tag) return null;

  try {
    const timeThreshold = new Date(Date.now() - TRENDING_HOURS * 60 * 60 * 1000);

    const [totalPosts, recentPosts, firstPost] = await Promise.all([
      Post.countDocuments({ hashtags: tag }),
      Post.countDocuments({ hashtags: tag, createdAt: { $gte: timeThreshold } }),
      Post.findOne({ hashtags: tag }).sort({ createdAt: 1 }).select('createdAt').lean()
    ]);

    return {
      hashtag: tag,
      totalPosts,
      recentPosts,
      firstUsed: firstPost?.createdAt || null,
      isTrending: recentPosts >= 5
    };
  } catch (err) {
    logger.error(`getHashtagStats failed for #${tag}`, err);
    throw err;
  }
};

/**
 * Search hashtags (autocomplete)
 * - Note: expensive on large collections. Consider maintaining a dedicated Hashtag collection for production.
 */
export const searchHashtags = async (query, limit = 10) => {
  const q = String(query || '').toLowerCase().replace('#', '').trim();
  if (!q || q.length < 2) return [];

  try {
    const regex = new RegExp(escapeRegex(q), 'i');

    const result = await Post.aggregate([
      { $unwind: '$hashtags' },
      { $match: { hashtags: { $regex: regex } } },
      { $group: { _id: '$hashtags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: Math.max(1, Number(limit) || 10) },
      { $project: { _id: 0, hashtag: '$_id', count: 1 } }
    ]).allowDiskUse(true);

    return result;
  } catch (err) {
    logger.error(`searchHashtags failed for query "${q}"`, err);
    throw err;
  }
};

export default {
  getTrendingHashtags,
  getPostsByHashtag,
  getHashtagStats,
  searchHashtags
};

/*
Notes & Recommendations:
- Add these indexes in `models/Post.js` for better performance:
  PostSchema.index({ hashtags: 1 });               // multikey index for hashtag lookups
  PostSchema.index({ createdAt: -1 });            // recent queries
  PostSchema.index({ hashtags: 1, createdAt: -1 }); // combined for recent hashtag queries

- For high scale, consider maintaining a separate `Hashtag` collection updated on post create/update/delete.
*/