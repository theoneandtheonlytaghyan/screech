/**
 * Database Configuration
 * Handles MongoDB connection using Mongoose
 */

import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

if (!process.env.MONGODB_URI) {
  logger.error('MONGODB_URI is not defined. Set it in your environment.');
  process.exit(1);
}

const gracefulShutdown = async (signal) => {
  try {
    logger.info(`Received ${signal}. Closing MongoDB connection...`);
    await mongoose.connection.close();
    logger.info('MongoDB connection closed.');
    if (signal === 'SIGUSR2') {
      // For nodemon restarts: re-emit to allow restart
      process.kill(process.pid, 'SIGUSR2');
    } else {
      process.exit(0);
    }
  } catch (err) {
    logger.error('Error during MongoDB graceful shutdown', err);
    process.exit(1);
  }
};

const connectDatabase = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    // Graceful shutdown handlers
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));

    return conn;
  } catch (error) {
    logger.error('Database connection failed', error);
    process.exit(1);
  }
};

export default connectDatabase;