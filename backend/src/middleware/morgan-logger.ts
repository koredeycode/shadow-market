/**
 * Morgan HTTP Request Logger Middleware
 *
 * Integrates Morgan with Winston logger for consistent logging
 */

import morgan from 'morgan';
import { morganStream } from '../utils/logger.js';

/**
 * Custom Morgan token for response time in milliseconds
 */
morgan.token('response-time-ms', (req, res) => {
  const responseTime = res.getHeader('X-Response-Time');
  return responseTime ? `${responseTime}ms` : '-';
});

/**
 * Custom Morgan format that includes:
 * - HTTP method
 * - URL
 * - Status code
 * - Response time
 * - Content length
 * - Remote IP address
 * - User agent (optional)
 */
const morganFormat =
  process.env.NODE_ENV === 'production'
    ? ':remote-addr - :method :url HTTP/:http-version :status :res[content-length] - :response-time ms ":user-agent"'
    : ':method :url :status :res[content-length] - :response-time ms';

/**
 * Morgan middleware configured to use Winston logger
 */
export const httpLogger = morgan(morganFormat, {
  stream: morganStream,
  skip: (req, res) => {
    // Skip logging health check endpoints
    return req.url === '/health' || req.url === '/ping';
  },
});

/**
 * Response time middleware
 * Tracks request duration without setting headers (handled by Morgan)
 */
export const responseTimeMiddleware = (req: any, res: any, next: any) => {
  const start = Date.now();

  // Store start time for Morgan to use
  req._startTime = start;

  next();
};
