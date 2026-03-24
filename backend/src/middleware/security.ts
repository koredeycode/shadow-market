import cors from 'cors';
import helmet from 'helmet';
import { config } from '../config';

/**
 * Security middlewares configuration for production
 */

/**
 * Helmet configuration - security headers
 */
export const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Inline scripts for React
      styleSrc: ["'self'", "'unsafe-inline'"], // Inline styles for MUI
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", config.corsOrigin],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"], // Prevent clickjacking
      upgradeInsecureRequests: [],
    },
  },

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 63072000, // 2 years
    includeSubDomains: true,
    preload: true,
  },

  // Prevent MIME type sniffing
  noSniff: true,

  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // X-Frame-Options (fallback for old browsers)
  frameguard: {
    action: 'deny',
  },

  // Remove X-Powered-By header
  hidePoweredBy: true,

  // Cross-Origin policies
  crossOriginEmbedderPolicy: false, // Allow embedding
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
});

/**
 * CORS configuration
 */
export const corsConfig = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // In development, allow all origins
    if (config.nodeEnv === 'development') {
      return callback(null, true);
    }

    // In production, check against whitelist
    const allowedOrigins = config.corsOrigin.split(',').map((o) => o.trim());

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'X-Cache'],
  maxAge: 86400, // 24 hours
});

/**
 * Additional security headers middleware
 */
export const additionalSecurityHeaders = (req: any, res: any, next: any) => {
  // Prevent caching of sensitive endpoints
  if (req.path.includes('/api/users') || req.path.includes('/api/positions')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  // Permissions Policy (formerly Feature Policy)
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()',
  );

  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-XSS-Protection (legacy, but doesn't hurt)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  next();
};

/**
 * Request sanitization middleware
 */
export const sanitizeRequest = (req: any, res: any, next: any) => {
  // Remove null bytes from all request parameters
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.replace(/\0/g, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);

  next();
};
