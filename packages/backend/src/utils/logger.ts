/**
 * Centralized Logging System using Winston
 *
 * Features:
 * - Daily log rotation
 * - Environment-aware formatting (pretty in dev, JSON in prod)
 * - Multiple log levels: error, warn, info, http, debug
 * - Integration with Morgan for HTTP logging
 */

import path from 'path';
import util from 'util';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, errors, printf, colorize, json, metadata } = winston.format;

// Get environment
const isDevelopment = process.env.NODE_ENV !== 'production';
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

/**
 * Custom format for development (colorized, pretty-printed)
 */
const developmentFormat = printf(({ level, message, timestamp, service, ...meta }) => {
  // Format timestamp nicely
  const ts = `\x1b[90m${timestamp}\x1b[0m`;

  // Service name
  const svc = `\x1b[36m[${service}]\x1b[0m`;

  // Build message
  let msg = `${ts} ${svc} ${level}: ${message}`;

  // Add metadata if present (pretty print with colors)
  const metaKeys = Object.keys(meta).filter(key => key !== 'metadata');
  if (metaKeys.length > 0) {
    const metaObj = metaKeys.reduce((acc, key) => ({ ...acc, [key]: meta[key] }), {});
    msg += `\n${util.inspect(metaObj, { colors: true, depth: 3, compact: false })}`;
  } else if (meta.metadata && Object.keys(meta.metadata).length > 0) {
    msg += `\n${util.inspect(meta.metadata, { colors: true, depth: 3, compact: false })}`;
  }

  return msg;
});

/**
 * Custom format for production (JSON)
 */
const productionFormat = combine(
  errors({ stack: true }),
  metadata({ fillExcept: ['message', 'level', 'timestamp', 'service'] }),
  json()
);

/**
 * Create Winston logger instance
 */
const logger = winston.createLogger({
  level: logLevel,
  defaultMeta: { service: 'shadow-market-api' },
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true })),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: isDevelopment ? combine(colorize(), developmentFormat) : productionFormat,
    }),

    // Error log file (daily rotation)
    new DailyRotateFile({
      filename: path.join('logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d', // Keep logs for 30 days
      maxSize: '20m', // Rotate when file reaches 20MB
      format: productionFormat,
    }),

    // Combined log file (daily rotation)
    new DailyRotateFile({
      filename: path.join('logs', 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d', // Keep logs for 14 days
      maxSize: '20m',
      format: productionFormat,
    }),

    // HTTP log file (for request logs)
    new DailyRotateFile({
      filename: path.join('logs', 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      maxFiles: '7d', // Keep HTTP logs for 7 days
      maxSize: '50m',
      format: productionFormat,
    }),
  ],

  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join('logs', 'exceptions.log'),
      format: productionFormat,
    }),
  ],

  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join('logs', 'rejections.log'),
      format: productionFormat,
    }),
  ],
});

/**
 * Stream for Morgan HTTP logger integration
 */
export const morganStream = {
  write: (message: string) => {
    // Remove trailing newline that Morgan adds
    logger.http(message.trim());
  },
};

// Create logs directory if it doesn't exist
import { mkdir } from 'fs/promises';
mkdir(path.join(process.cwd(), 'logs'), { recursive: true }).catch(() => {});

export default logger;
