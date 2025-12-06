/**
 * Validator Middleware
 * Input validation using express-validator
 *
 * Improvements:
 * - Stronger password rules for registration
 * - Unicode-aware hashtag validation and sanitization
 * - Non-empty (non-whitespace) content checks
 * - Reusable objectId param validator factory
 * - Errors include location (body/params/query)
 */

import { body, param, query, validationResult } from 'express-validator';
import {
  POST_MAX_LENGTH,
  COMMENT_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
  AVATAR_COLORS
} from '../config/constants.js';

const DEFAULT_USERNAME_MAX = USERNAME_MAX_LENGTH || 32;
const DEFAULT_POST_MAX = POST_MAX_LENGTH || 1000;
const DEFAULT_COMMENT_MAX = COMMENT_MAX_LENGTH || 500;

/* ----------------------- helper: validation result ----------------------- */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      location: err.location,
      field: err.param,
      message: err.msg
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  return next();
};

/* ----------------------- generic validators ----------------------- */

// Creates a param validator for any param name that must be a Mongo ObjectId
export const validateObjectIdParam = (paramName = 'id') => [
  param(paramName)
    .exists().withMessage(`${paramName} is required`).bail()
    .isMongoId().withMessage('Invalid id format'),
  handleValidationErrors
];

/* ----------------------- Auth validators ----------------------- */

// Strong password: min 8, at least one lower, one upper, one digit, one symbol
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;

export const validateRegister = [
  body('email')
    .exists().withMessage('Email is required').bail()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail()
    .trim()
    .toLowerCase(),
  body('username')
    .optional({ nullable: true })
    .trim()
    .isLength({ min: 3, max: DEFAULT_USERNAME_MAX })
    .withMessage(`Username must be between 3 and ${DEFAULT_USERNAME_MAX} characters`)
    .matches(/^[\p{L}\p{N}_-]+$/u)
    .withMessage('Username can contain letters, numbers, underscores or hyphens'),
  body('password')
    .exists().withMessage('Password is required').bail()
    .matches(PASSWORD_REGEX)
    .withMessage('Password must be at least 8 characters and include uppercase, lowercase, number and special character'),
  handleValidationErrors
];

export const validateLogin = [
  body('email')
    .exists().withMessage('Email is required').bail()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail()
    .trim()
    .toLowerCase(),
  body('password')
    .exists().withMessage('Password is required'),
  handleValidationErrors
];

/* ----------------------- Post validators ----------------------- */

export const validateCreatePost = [
  body('content')
    .exists().withMessage('Post content is required').bail()
    .custom(value => typeof value === 'string' && value.trim().length > 0)
    .withMessage('Post content cannot be empty or whitespace')
    .isLength({ max: DEFAULT_POST_MAX })
    .withMessage(`Post cannot exceed ${DEFAULT_POST_MAX} characters`),
  handleValidationErrors
];

export const validateUpdatePost = [
  param('id')
    .exists().withMessage('Post id is required').bail()
    .isMongoId().withMessage('Invalid post ID'),
  body('content')
    .exists().withMessage('Post content is required').bail()
    .custom(value => typeof value === 'string' && value.trim().length > 0)
    .withMessage('Post content cannot be empty or whitespace')
    .isLength({ max: DEFAULT_POST_MAX })
    .withMessage(`Post cannot exceed ${DEFAULT_POST_MAX} characters`),
  handleValidationErrors
];

export const validatePostId = validateObjectIdParam('id');

/* ----------------------- Comment validators ----------------------- */

export const validateCreateComment = [
  body('content')
    .exists().withMessage('Comment content is required').bail()
    .custom(value => typeof value === 'string' && value.trim().length > 0)
    .withMessage('Comment content cannot be empty or whitespace')
    .isLength({ max: DEFAULT_COMMENT_MAX })
    .withMessage(`Comment cannot exceed ${DEFAULT_COMMENT_MAX} characters`),
  body('postId')
    .exists().withMessage('postId is required').bail()
    .isMongoId().withMessage('Invalid post ID'),
  body('parentCommentId')
    .optional()
    .isMongoId().withMessage('Invalid parent comment ID'),
  handleValidationErrors
];

export const validateCommentId = validateObjectIdParam('id');

/* ----------------------- Message validators ----------------------- */

export const validateSendMessage = [
  body('recipientId')
    .exists().withMessage('recipientId is required').bail()
    .isMongoId().withMessage('Invalid recipient ID'),
  body('content')
    .exists().withMessage('Message content is required').bail()
    .custom(value => typeof value === 'string' && value.trim().length > 0)
    .withMessage('Message content cannot be empty or whitespace')
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters'),
  handleValidationErrors
];

export const validateConversationId = validateObjectIdParam('conversationId');

/* ----------------------- User validators ----------------------- */

export const validateUserId = validateObjectIdParam('id');

export const validateUpdateProfile = [
  body('keepClan')
    .optional()
    .isBoolean()
    .withMessage('keepClan must be a boolean'),
  body('displayName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('displayName must be between 1 and 50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('bio cannot exceed 300 characters'),
  body('avatarColor')
    .optional()
    .isIn(Array.isArray(AVATAR_COLORS) ? AVATAR_COLORS : [])
    .withMessage('avatarColor is invalid'),
  handleValidationErrors
];

/* ----------------------- Search validators ----------------------- */

export const validateSearch = [
  query('q')
    .exists().withMessage('Search query is required').bail()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
  query('type')
    .optional()
    .isIn(['posts', 'users', 'hashtags', 'all'])
    .withMessage('Invalid search type'),
  handleValidationErrors
];

/* ----------------------- Pagination validators ----------------------- */

export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt(),
  handleValidationErrors
];

/* ----------------------- Hashtag validators ----------------------- */

// Unicode-aware hashtag: letters/numbers/underscore, no spaces.
// Accepts optional leading '#', sanitizes it away.
export const validateHashtag = [
  param('hashtag')
    .exists().withMessage('Hashtag is required').bail()
    .trim()
    .customSanitizer((val) => String(val).replace(/^#/, ''))
    .isLength({ min: 1, max: 50 }).withMessage('Hashtag must be 1-50 characters')
    .matches(/^[\p{L}\p{N}_]+$/u).withMessage('Hashtag can only contain letters, numbers and underscores'),
  handleValidationErrors
];

/* ----------------------- Notification validators ----------------------- */

export const validateNotificationId = validateObjectIdParam('id');

/* ----------------------- Exports ----------------------- */

export default {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateCreatePost,
  validateUpdatePost,
  validatePostId,
  validateCreateComment,
  validateCommentId,
  validateSendMessage,
  validateConversationId,
  validateUserId,
  validateUpdateProfile,
  validateSearch,
  validatePagination,
  validateHashtag,
  validateNotificationId,
  validateObjectIdParam
};