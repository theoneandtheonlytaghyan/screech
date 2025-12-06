/**
 * Identity Generator Service
 * Generates anonymous usernames and assigns clans
 */

import { ADJECTIVES, NOUNS, CLANS, AVATAR_COLORS, USERNAME_MAX_LENGTH } from '../config/constants.js';
import { randomBetween, generateRandomStringInsecure } from '../utils/helpers.js';

const NUM_SUFFIX_LENGTH = 4; // e.g. #1234
const SUFFIX_OVERHEAD = 1 + NUM_SUFFIX_LENGTH; // '#' + digits

const pickRandom = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error('Source array is empty or invalid for identity generation');
  }
  return arr[randomBetween(0, arr.length - 1)];
};

const padNumber = (n, length) => String(n).padStart(length, '0');

export const generateUsername = () => {
  const adjective = pickRandom(ADJECTIVES);
  const noun = pickRandom(NOUNS);

  // Build base (no separator)
  const rawBase = `${adjective}${noun}`;

  // Enforce username max length if provided
  const maxLen = typeof USERNAME_MAX_LENGTH === 'number' ? USERNAME_MAX_LENGTH : 20;
  const allowedBaseLen = Math.max(1, maxLen - SUFFIX_OVERHEAD);

  let base = rawBase;
  if (base.length > allowedBaseLen) {
    base = base.slice(0, allowedBaseLen);
  }

  // Suffix number
  const number = randomBetween(0, Math.pow(10, NUM_SUFFIX_LENGTH) - 1);
  const suffix = padNumber(number, NUM_SUFFIX_LENGTH);

  const username = `${base}#${suffix}`;

  // Fallback in the very unlikely event username is empty
  if (!username || username.length === 0) {
    // generate a short random fallback
    return `${generateRandomStringInsecure(Math.min(8, maxLen - SUFFIX_OVERHEAD))}#${padNumber(randomBetween(0, 9999), 4)}`;
  }

  return username;
};

export const assignClan = () => {
  const clan = pickRandom(CLANS);
  // Return a shallow copy so downstream code can modify user-specific props safely.
  // If you prefer immutability, return `clan` directly (and deep-freeze CLANS).
  return { ...clan };
};

export const generateAvatarColor = () => {
  return pickRandom(AVATAR_COLORS);
};

export const generateIdentity = () => {
  return {
    username: generateUsername(),
    clan: assignClan(),
    avatarColor: generateAvatarColor()
  };
};

export const regenerateIdentity = (options = {}) => {
  const newIdentity = generateIdentity();

  if (options.keepClan && options.currentClan) {
    newIdentity.clan = options.currentClan;
  }

  return newIdentity;
};