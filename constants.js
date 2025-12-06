/**
 * Frontend Constants
 * Centralized configuration values
 */

// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Post Limits
export const POST_MAX_LENGTH = 180;
export const COMMENT_MAX_LENGTH = 280;
export const MESSAGE_MAX_LENGTH = 1000;

// Pagination
export const POSTS_PER_PAGE = 20;
export const COMMENTS_PER_PAGE = 20;
export const MESSAGES_PER_PAGE = 50;
export const NOTIFICATIONS_PER_PAGE = 20;

// Clans
export const CLANS = [
  { name: 'Owl', emoji: '🦉', color: '#8B7355', description: 'Wise and watchful' },
  { name: 'Wolf', emoji: '🐺', color: '#6B7B8C', description: 'Strong and loyal' },
  { name: 'Hawk', emoji: '🦅', color: '#C19A6B', description: 'Swift and precise' },
  { name: 'Fox', emoji: '🦊', color: '#D2691E', description: 'Clever and cunning' },
  { name: 'Bear', emoji: '🐻', color: '#8B4513', description: 'Powerful and protective' },
  { name: 'Raven', emoji: '🐦‍⬛', color: '#2F2F2F', description: 'Mysterious and intelligent' }
];

// Notification Types
export const NOTIFICATION_TYPES = {
  LIKE: 'like',
  COMMENT: 'comment',
  MESSAGE: 'message',
  CLAN_RANK: 'clan_rank',
  SYSTEM: 'system'
};

// Notification Icons
export const NOTIFICATION_ICONS = {
  like: '❤️',
  comment: '💬',
  message: '✉️',
  clan_rank: '🏆',
  system: '🔔'
};

// Level Thresholds
export const LEVEL_THRESHOLDS = [
  { level: 1, points: 0, title: 'Hatchling' },
  { level: 2, points: 100, title: 'Fledgling' },
  { level: 3, points: 500, title: 'Nestling' },
  { level: 4, points: 1000, title: 'Scout' },
  { level: 5, points: 2500, title: 'Hunter' },
  { level: 6, points: 5000, title: 'Guardian' },
  { level: 7, points: 10000, title: 'Elder' },
  { level: 8, points: 25000, title: 'Sage' },
  { level: 9, points: 50000, title: 'Legend' },
  { level: 10, points: 100000, title: 'Mythic' }
];

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  USER_PROFILE: '/user/:id',
  MESSAGES: '/messages',
  CONVERSATION: '/messages/:conversationId',
  NOTIFICATIONS: '/notifications',
  SEARCH: '/search',
  HASHTAG: '/hashtag/:tag',
  CLANS: '/clans',
  CLAN_DETAIL: '/clans/:name',
  SETTINGS: '/settings'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'screech_token',
  USER: 'screech_user',
  THEME: 'screech_theme'
};

// Toast Duration
export const TOAST_DURATION = 3000;

// Debounce Delays
export const DEBOUNCE_DELAY = 300;
export const SEARCH_DEBOUNCE = 500;

// Character Counter Colors
export const getCharCounterColor = (remaining, max) => {
  const percentage = remaining / max;
  if (percentage <= 0.1) return 'text-red-500';
  if (percentage <= 0.2) return 'text-yellow-500';
  return 'text-screech-textMuted';
};

// Get Clan by Name
export const getClanByName = (name) => {
  return CLANS.find(clan => clan.name.toLowerCase() === name?.toLowerCase()) || CLANS[0];
};

// Get Level Title
export const getLevelTitle = (level) => {
  const levelData = LEVEL_THRESHOLDS.find(l => l.level === level);
  return levelData?.title || 'Unknown';
};

// Get Points for Next Level
export const getPointsForNextLevel = (currentLevel, currentPoints) => {
  const nextLevel = LEVEL_THRESHOLDS.find(l => l.level === currentLevel + 1);
  if (!nextLevel) return null;
  return {
    needed: nextLevel.points - currentPoints,
    total: nextLevel.points,
    progress: (currentPoints / nextLevel.points) * 100
  };
};