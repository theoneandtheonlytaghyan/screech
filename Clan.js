/**
 * Clan Model
 * Defines the schema for clans (persistent storage for clan meta + stats)
 */

import mongoose from 'mongoose';
import { CLANS } from '../config/constants.js';
import { logger } from '../utils/logger.js';

const clanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: CLANS.map(c => c.name),
    trim: true
  },
  emoji: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  stats: {
    totalMembers: { type: Number, default: 0 },
    totalPosts: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
    totalComments: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 }
  },
  rank: {
    type: Number,
    default: 0,
    index: true
  },
  weeklyStats: {
    posts: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    resetAt: { type: Date, default: Date.now }
  }
}, {
  timestamps: true
});

// Indexes
clanSchema.index({ name: 1 }, { unique: true });
clanSchema.index({ 'stats.totalPoints': -1 });
clanSchema.index({ rank: 1 });

// Format for JSON response
clanSchema.methods.toJSON = function() {
  const clan = this.toObject();
  delete clan.__v;
  return clan;
};

// Update clan stats (instance method - keeps single-document consistency)
clanSchema.methods.updateStats = async function(action, value = 1) {
  switch (action) {
    case 'member_join':
      this.stats.totalMembers += value;
      break;
    case 'member_leave':
      this.stats.totalMembers = Math.max(0, this.stats.totalMembers - value);
      break;
    case 'post':
      this.stats.totalPosts += value;
      this.weeklyStats.posts += value;
      break;
    case 'like':
      this.stats.totalLikes += value;
      this.weeklyStats.likes += value;
      break;
    case 'comment':
      this.stats.totalComments += value;
      this.weeklyStats.comments += value;
      break;
    case 'points':
      this.stats.totalPoints += value;
      this.weeklyStats.points += value;
      break;
    default:
      break;
  }

  await this.save();
  return this;
};

// Reset weekly stats (instance)
clanSchema.methods.resetWeeklyStats = async function() {
  this.weeklyStats = {
    posts: 0,
    likes: 0,
    comments: 0,
    points: 0,
    resetAt: new Date()
  };
  await this.save();
  return this;
};

// Static method to initialize all clans (upsert existing entries)
clanSchema.statics.initializeClans = async function() {
  try {
    const ops = CLANS.map(clan => ({
      updateOne: {
        filter: { name: clan.name },
        update: {
          $setOnInsert: {
            name: clan.name,
            emoji: clan.emoji,
            color: clan.color,
            description: clan.description,
            stats: {
              totalMembers: 0,
              totalPosts: 0,
              totalLikes: 0,
              totalComments: 0,
              totalPoints: 0
            },
            weeklyStats: {
              posts: 0,
              likes: 0,
              comments: 0,
              points: 0,
              resetAt: new Date()
            }
          }
        },
        upsert: true
      }
    }));

    if (ops.length === 0) return;

    const res = await this.bulkWrite(ops, { ordered: false });
    logger.info('Clans initialized or verified', { result: res.result || res });
    return res;
  } catch (err) {
    logger.error('initializeClans failed', err);
    throw err;
  }
};

// Static method to get all clans ranked (lean)
clanSchema.statics.getRankings = async function() {
  try {
    const clans = await this.find({})
      .sort({ 'stats.totalPoints': -1 })
      .lean()
      .exec();
    return clans;
  } catch (err) {
    logger.error('getRankings failed', err);
    throw err;
  }
};

// Static method to update all clan rankings efficiently using bulkWrite
clanSchema.statics.updateRankings = async function() {
  try {
    // Get clans ordered by points
    const ordered = await this.find({}, { _id: 1, 'stats.totalPoints': 1 })
      .sort({ 'stats.totalPoints': -1 })
      .lean()
      .exec();

    if (!ordered || ordered.length === 0) return [];

    const ops = ordered.map((c, i) => ({
      updateOne: {
        filter: { _id: c._id },
        update: { $set: { rank: i + 1 } }
      }
    }));

    const result = await this.bulkWrite(ops, { ordered: false });
    logger.info('updateRankings applied', { matched: result.matchedCount || result.nMatched });
    return result;
  } catch (err) {
    logger.error('updateRankings failed', err);
    throw err;
  }
};

// Static method to reset all weekly stats in one operation
clanSchema.statics.resetAllWeeklyStats = async function() {
  try {
    const res = await this.updateMany(
      {},
      {
        $set: {
          'weeklyStats.posts': 0,
          'weeklyStats.likes': 0,
          'weeklyStats.comments': 0,
          'weeklyStats.points': 0,
          'weeklyStats.resetAt': new Date()
        }
      }
    );
    logger.info('resetAllWeeklyStats applied', { modifiedCount: res.modifiedCount || res.nModified });
    return res;
  } catch (err) {
    logger.error('resetAllWeeklyStats failed', err);
    throw err;
  }
};

// Static method to get top clans (lean)
clanSchema.statics.getTopClans = async function(limit = 5) {
  try {
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 5));
    return this.find({})
      .sort({ 'stats.totalPoints': -1 })
      .limit(safeLimit)
      .lean()
      .exec();
  } catch (err) {
    logger.error('getTopClans failed', err);
    throw err;
  }
};

// Case-insensitive clan lookup by name
clanSchema.statics.getClanByName = async function(name) {
  if (!name) return null;
  try {
    return this.findOne({ name: { $regex: new RegExp(`^${String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }).exec();
  } catch (err) {
    logger.error('getClanByName failed', err);
    throw err;
  }
};

const Clan = mongoose.model('Clan', clanSchema);

export default Clan;