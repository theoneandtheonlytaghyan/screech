/**
 * Logger Utility
 * Centralized logging with timestamps, levels, color when TTY, and error stacks
 */

import util from 'util';

const isTTY = Boolean(process.stdout && process.stdout.isTTY);
const LOG_LEVEL = (process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info')).toLowerCase();
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const getTimestamp = () => new Date().toISOString();

const formatData = (data) => {
  if (!data) return '';
  if (data instanceof Error) return `${data.stack || data.message}`;
  return util.inspect(data, { depth: 4, colors: isTTY });
};

const shouldLog = (level) => LEVELS[level] <= (LEVELS[LOG_LEVEL] ?? LEVELS.info);

export const logger = {
  error: (message, data = null) => {
    if (!shouldLog('error')) return;
    const payload = `[${getTimestamp()}] ERROR: ${message}` + (data ? `\n${formatData(data)}` : '');
    console.error(isTTY ? `${colors.cyan}${payload}${colors.reset}` : payload);
  },

  warn: (message, data = null) => {
    if (!shouldLog('warn')) return;
    const payload = `[${getTimestamp()}] WARN: ${message}` + (data ? `\n${formatData(data)}` : '');
    console.error(isTTY ? `${colors.cyan}${payload}${colors.reset}` : payload);
  },

  info: (message, data = null) => {
    if (!shouldLog('info')) return;
    const payload = `[${getTimestamp()}] INFO: ${message}` + (data ? `\n${formatData(data)}` : '');
    console.log(isTTY ? `${colors.cyan}${payload}${colors.reset}` : payload);
  },

  debug: (message, data = null) => {
    if (!shouldLog('debug')) return;
    const payload = `[${getTimestamp()}] DEBUG: ${message}` + (data ? `\n${formatData(data)}` : '');
    console.log(isTTY ? `${colors.cyan}${payload}${colors.reset}` : payload);
  }
};