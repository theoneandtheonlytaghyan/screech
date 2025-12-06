/**
 * Global Error Handler Middleware
 * Centralized error handling with safe production responses and structured logging.
 */

import { randomUUID } from 'crypto';
import { logger } from '../utils/logger.js';

export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;
    this.errorId = randomUUID();
    Error.captureStackTrace(this, this.constructor);
  }
}

/* Mongoose / JWT specific error handlers (return an AppError) */
const handleCastErrorDB = (err) => {
  const path = err.path || 'id';
  const value = err.value ?? 'invalid';
  const message = `Invalid ${path}: ${String(value)}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  // Try to extract key/value robustly
  let field = 'field';
  let value = '';
  if (err.keyValue && typeof err.keyValue === 'object') {
    field = Object.keys(err.keyValue)[0];
    value = err.keyValue[field];
  } else if (typeof err.message === 'string') {
    // fallback parsing for older drivers or messages
    const match = err.message.match(/index:\s+([^\s]+)\s+dup key:\s+\{ : "?(.*?)"? \}/i);
    if (match) {
      field = match[1];
      value = match[2];
    }
  }
  const message = `${field} '${value}' already exists. Please use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = [];
  if (err.errors && typeof err.errors === 'object') {
    for (const key of Object.keys(err.errors)) {
      const e = err.errors[key];
      if (e && e.message) errors.push(e.message);
    }
  }
  const message = errors.length ? `Invalid input data. ${errors.join('. ')}` : 'Invalid input data.';
  return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token. Please log in again.', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired. Please log in again.', 401);

/* Utility to send response */
const sendErrorResponse = (res, err, isDev = false) => {
  // Ensure statusCode
  const statusCode = err.statusCode && Number.isFinite(err.statusCode) ? err.statusCode : 500;
  const payloadBase = {
    success: false,
    status: err.status || (String(statusCode).startsWith('4') ? 'fail' : 'error'),
    message: err.isOperational ? err.message : 'Something went wrong!',
    errorId: err.errorId || randomUUID()
  };

  if (isDev) {
    // In development include stack and raw error
    return res.status(statusCode).json({
      ...payloadBase,
      stack: err.stack,
      error: {
        name: err.name,
        message: err.message
      }
    });
  }

  // Production: only include details for operational errors, otherwise generic + errorId
  return res.status(statusCode).json(payloadBase);
};

/* Global error middleware */
export const errorHandler = (err, req, res, next) => {
  // If headers already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Normalize minimal fields
  err = err || {};
  err.statusCode = err.statusCode || 500;
  err.status = err.status || (String(err.statusCode).startsWith('4') ? 'fail' : 'error');
  if (!err.errorId) err.errorId = randomUUID();

  // Log full error with context (always)
  try {
    const meta = {
      errorId: err.errorId,
      statusCode: err.statusCode,
      url: req?.originalUrl,
      method: req?.method,
      params: req?.params,
      query: req?.query,
      body: req?.body && typeof req.body === 'object' ? { ...req.body } : req?.body
    };
    logger.error(err.message || 'Unhandled error', { err, meta });
  } catch (logErr) {
    // Best effort logging; don't crash
    // eslint-disable-next-line no-console
    console.error('Failed to log error', logErr);
  }

  const isDev = process.env.NODE_ENV === 'development';

  // Convert known error types to AppError (production-friendly)
  if (!isDev) {
    // Use original err properties to detect types
    if (err.name === 'CastError') err = handleCastErrorDB(err);
    else if (err.code === 11000 || (err.code && Number(err.code) === 11000)) err = handleDuplicateFieldsDB(err);
    else if (err.name === 'ValidationError') err = handleValidationErrorDB(err);
    else if (err.name === 'JsonWebTokenError') err = handleJWTError();
    else if (err.name === 'TokenExpiredError') err = handleJWTExpiredError();
  }

  // Finally send safe response
  return sendErrorResponse(res, err, isDev);
};

/* Not Found handler */
export const notFound = (req, res, next) => {
  const err = new AppError(`Route ${req.originalUrl} not found`, 404);
  return next(err);
};

/* Async wrapper */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default {
  AppError,
  errorHandler,
  notFound,
  asyncHandler
};