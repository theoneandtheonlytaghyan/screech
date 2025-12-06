/**
 * Frontend Helper Utilities
 * Common helper functions
 */

import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

/**
 * Format date to relative time (e.g., "5m ago", "2h ago")
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted relative time
 */
export const timeAgo = (date) => {
  if (!date) return 'just now';
  
  try {
    const dateObj = new Date(date);
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    return 'just now';
  }
};

/**
 * Format date for messages (shows time for today, date for older)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date/time
 */
export const formatMessageTime = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = new Date(date);
    
    if (isToday(dateObj)) {
      return format(dateObj, 'h:mm a');
    }
    
    if (isYesterday(dateObj)) {
      return `Yesterday ${format(dateObj, 'h:mm a')}`;
    }
    
    return format(dateObj, 'MMM d, h:mm a');
  } catch (error) {
    return '';
  }
};

/**
 * Format full date
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  try {
    return format(new Date(date), 'MMMM d, yyyy');
  } catch (error) {
    return '';
  }
};

/**
 * Format number with K/M suffix
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export const formatNumber = (num) => {
  if (!num) return '0';
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  
  return num.toString();
};

/**
 * Extract hashtags from text
 * @param {string} text - Text to extract from
 * @returns {string[]} Array of hashtags
 */
export const extractHashtags = (text) => {
  if (!text) return [];
  
  const regex = /#(\w+)/g;
  const matches = text.match(regex);
  
  if (!matches) return [];
  
  return [...new Set(matches.map(tag => tag.slice(1).toLowerCase()))];
};

/**
 * Parse text and convert hashtags to links
 * @param {string} text - Text to parse
 * @returns {string} HTML string with linked hashtags
 */
export const parseHashtags = (text) => {
  if (!text) return '';
  
  return text.replace(
    /#(\w+)/g,
    '<a href="/hashtag/$1" class="hashtag">#$1</a>'
  );
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  
  return text.slice(0, maxLength).trim() + '...';
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result
 */
export const validatePassword = (password) => {
  const result = {
    isValid: true,
    errors: []
  };
  
  if (password.length < 6) {
    result.isValid = false;
    result.errors.push('Password must be at least 6 characters');
  }
  
  if (!/\d/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one number');
  }
  
  return result;
};

/**
 * Generate random color
 * @returns {string} Hex color code
 */
export const generateRandomColor = () => {
  const colors = [
    '#8B7355', '#D2B48C', '#A0826D', '#C19A6B',
    '#967969', '#B8956A', '#6B8E23', '#708090'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Get initials from username
 * @param {string} username - Username
 * @returns {string} Initials (max 2 characters)
 */
export const getInitials = (username) => {
  if (!username) return '?';
  
  const parts = username.replace(/#\d+$/, '').split(/(?=[A-Z])/);
  
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  
  return username.slice(0, 2).toUpperCase();
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
};

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Check if element is in viewport
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} Is in viewport
 */
export const isInViewport = (element) => {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

/**
 * Scroll to top of page
 * @param {boolean} smooth - Use smooth scrolling
 */
export const scrollToTop = (smooth = true) => {
  window.scrollTo({
    top: 0,
    behavior: smooth ? 'smooth' : 'auto'
  });
};

/**
 * Get error message from API error
 * @param {Error} error - Error object
 * @returns {string} Error message
 */
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'Something went wrong. Please try again.';
};