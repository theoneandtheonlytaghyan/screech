/**
 * Clan Routes
 * Handles clan endpoints
 */

import express from 'express';
import {
  getAllClans,
  getClanLeaderboard,
  getClanByName,
  getClanMembersList,
  getClanStats,
  getWeeklyRankings,
  getMyClan
} from '../controllers/clanController.js';
import { protect } from '../middleware/auth.js';
import { validatePagination } from '../middleware/validator.js';

const router = express.Router();

/**
 * @route   GET /api/clans
 * @desc    Get all clans with rankings
 * @access  Public
 */
router.get('/', getAllClans);

/**
 * @route   GET /api/clans/leaderboard
 * @desc    Get top clans leaderboard
 * @access  Public
 */
router.get('/leaderboard', getClanLeaderboard);

/**
 * @route   GET /api/clans/rankings/weekly
 * @desc    Get weekly clan rankings
 * @access  Public
 */
router.get('/rankings/weekly', getWeeklyRankings);

/**
 * @route   GET /api/clans/me
 * @desc    Get my clan info
 * @access  Private
 */
router.get('/me', protect, getMyClan);

/**
 * @route   GET /api/clans/:name
 * @desc    Get clan by name
 * @access  Public
 */
router.get('/:name', getClanByName);

/**
 * @route   GET /api/clans/:name/members
 * @desc    Get clan members
 * @access  Public
 */
router.get('/:name/members', validatePagination, getClanMembersList);

/**
 * @route   GET /api/clans/:name/stats
 * @desc    Get clan statistics
 * @access  Public
 */
router.get('/:name/stats', getClanStats);

export default router;