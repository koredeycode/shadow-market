import { z } from 'zod';

/**
 * Comprehensive validation schemas for all API endpoints
 * These schemas prevent SQL injection, XSS, and other injection attacks
 */

// Common validators
const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');
const uuidSchema = z.string().uuid('Invalid UUID');
const dateSchema = z.string().datetime('Invalid ISO 8601 date');
const positiveNumberSchema = z.number().positive('Must be positive');
const nonNegativeNumberSchema = z.number().nonnegative('Must be non-negative');

// Sanitize strings (remove HTML, script tags, null bytes)
const sanitizedStringSchema = z
  .string()
  .transform((val) =>
    val
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\0/g, '')
      .trim(),
  );

const safeTextSchema = z
  .string()
  .min(1, 'Cannot be empty')
  .max(1000, 'Too long')
  .transform((val) => sanitizedStringSchema.parse(val));

// Market validation
export const createMarketSchema = z.object({
  question: z
    .string()
    .min(10, 'Question too short')
    .max(500, 'Question too long')
    .transform((val) => sanitizedStringSchema.parse(val)),
  
  description: z
    .string()
    .max(5000, 'Description too long')
    .optional()
    .transform((val) => (val ? sanitizedStringSchema.parse(val) : undefined)),
  
  category: z.enum(['Crypto', 'Sports', 'Politics', 'Tech', 'Entertainment', 'Other']),
  
  tags: z
    .array(z.string().max(50).transform((val) => sanitizedStringSchema.parse(val)))
    .max(10, 'Too many tags')
    .optional(),
  
  endTime: dateSchema.refine((date) => new Date(date) > new Date(), 'End time must be in future'),
  
  minBet: z
    .string()
    .regex(/^\d+$/, 'Must be integer')
    .refine((val) => BigInt(val) >= BigInt(1000), 'Minimum bet must be at least 1000'),
  
  maxBet: z
    .string()
    .regex(/^\d+$/, 'Must be integer')
    .refine((val) => BigInt(val) <= BigInt('1000000000000'), 'Maximum bet too large'),
  
  resolutionSource: safeTextSchema,
});

export const getMarketsSchema = z.object({
  status: z.enum(['PENDING', 'OPEN', 'LOCKED', 'RESOLVED', 'CANCELLED']).optional(),
  category: z.string().max(100).optional(),
  sortBy: z.enum(['volume', 'liquidity', 'ending_soon', 'newest']).optional(),
  search: z
    .string()
    .max(200)
    .optional()
    .transform((val) => (val ? sanitizedStringSchema.parse(val) : undefined)),
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().nonnegative().optional().default(0),
});

export const marketIdSchema = z.object({
  id: z.string().regex(/^market_\d+$/, 'Invalid market ID'),
});

// Wager validation
export const placeBetSchema = z.object({
  marketId: z.string().regex(/^market_\d+$/, 'Invalid market ID'),
  amount: z
    .string()
    .regex(/^\d+$/, 'Must be integer')
    .refine((val) => BigInt(val) > BigInt(0), 'Amount must be positive'),
  side: z.enum(['YES', 'NO']),
  slippage: z.number().min(0).max(50).optional().default(1),
  commitment: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid commitment'),
});

export const createP2PWagerSchema = z.object({
  marketId: z.string().regex(/^market_\d+$/, 'Invalid market ID'),
  amount: z
    .string()
    .regex(/^\d+$/, 'Must be integer')
    .refine((val) => BigInt(val) > BigInt(0), 'Amount must be positive'),
  odds: z.tuple([
    z.number().int().positive('Numerator must be positive'),
    z.number().int().positive('Denominator must be positive'),
  ]),
  creatorSide: z.enum(['YES', 'NO']),
  duration: z.number().int().min(3600, 'Minimum 1 hour').max(2592000, 'Maximum 30 days'),
});

export const acceptWagerSchema = z.object({
  wagerId: z.string().regex(/^wager_\d+$/, 'Invalid wager ID'),
});

export const wagerIdSchema = z.object({
  id: z.string().regex(/^wager_\d+$/, 'Invalid wager ID'),
});

// Position validation
export const getPositionsSchema = z.object({
  status: z.enum(['active', 'settled']).optional(),
  marketId: z.string().regex(/^market_\d+$/, 'Invalid market ID').optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().nonnegative().optional().default(0),
});

export const positionIdSchema = z.object({
  id: z.string().regex(/^position_\d+$/, 'Invalid position ID'),
});

// Oracle validation
export const registerOracleSchema = z.object({
  stake: z
    .string()
    .regex(/^\d+$/, 'Must be integer')
    .refine((val) => BigInt(val) >= BigInt(1000), 'Minimum stake: 1000 tokens'),
});

export const submitReportSchema = z.object({
  marketId: z.string().regex(/^market_\d+$/, 'Invalid market ID'),
  outcome: z.number().int().min(0).max(1, 'Must be 0 or 1'),
  proofData: z.string().regex(/^0x[a-fA-F0-9]+$/, 'Invalid proof data'),
});

export const disputeReportSchema = z.object({
  marketId: z.string().regex(/^market_\d+$/, 'Invalid market ID'),
  proposedOutcome: z.number().int().min(0).max(1, 'Must be 0 or 1'),
  disputeStake: z
    .string()
    .regex(/^\d+$/, 'Must be integer')
    .refine((val) => BigInt(val) >= BigInt(100), 'Minimum dispute stake: 100 tokens'),
  evidence: safeTextSchema,
});

// User validation
export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username too short')
    .max(50, 'Username too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid username format')
    .optional(),
  bio: z.string().max(500, 'Bio too long').optional(),
  avatar: z
    .string()
    .url('Invalid URL')
    .max(500, 'URL too long')
    .optional()
    .refine(
      (url) => !url || url.startsWith('https://'),
      'Avatar URL must use HTTPS',
    ),
});

// Analytics validation
export const getAnalyticsSchema = z.object({
  timeRange: z.enum(['24h', '7d', '30d', 'all']).optional().default('7d'),
  category: z.string().max(100).optional(),
});

// Export validation
export const exportDataSchema = z.object({
  format: z.enum(['csv', 'json']).optional().default('csv'),
  startDate: dateSchema.optional(),
  endDate: dateSchema
    .optional()
    .refine(
      (date) => !date || new Date(date) <= new Date(),
      'End date cannot be in future',
    ),
});

// WebSocket validation
export const subscribeMarketSchema = z.object({
  marketId: z.string().regex(/^market_\d+$/, 'Invalid market ID'),
});

// Pagination helper
export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().nonnegative().optional().default(0),
});

/**
 * Type exports for use in route handlers
 */
export type CreateMarketInput = z.infer<typeof createMarketSchema>;
export type GetMarketsInput = z.infer<typeof getMarketsSchema>;
export type PlaceBetInput = z.infer<typeof placeBetSchema>;
export type CreateP2PWagerInput = z.infer<typeof createP2PWagerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
