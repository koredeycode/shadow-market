# Backend Logging System

## Overview

The Shadow Market backend uses a production-ready centralized logging system built with **Winston** and **Morgan** for comprehensive request/error tracking and debugging.

## Features

✅ **Winston Logger** - Industry-standard logging framework
✅ **Daily Log Rotation** - Automatic file rotation with configurable retention
✅ **Environment-Aware Formatting** - Colorized for development, JSON for production
✅ **HTTP Request Logging** - Morgan middleware integrated with Winston
✅ **Sensitive Data Masking** - Automatically masks passwords, tokens, API keys
✅ **Structured Logging** - JSON-based metadata for easy parsing
✅ **Log Levels** - `error`, `warn`, `info`, `http`, `debug`
✅ **Global Error Handling** - Uncaught exceptions and unhandled rejections

## Configuration

### Environment Variables

```bash
# Set log level (default: debug in dev, info in prod)
LOG_LEVEL=debug

# Node environment affects log format
NODE_ENV=development  # Colorized, pretty-print
NODE_ENV=production   # JSON format
```

### Log Levels (Priority Order)

1. **error** - Critical errors that need immediate attention
2. **warn** - Warning messages (non-critical issues)
3. **info** - General information (startup, shutdown, key events)
4. **http** - HTTP request logs from Morgan
5. **debug** - Detailed debugging information

Setting `LOG_LEVEL=info` will show `error`, `warn`, `info`, and `http` logs (but not `debug`).

## Log Files

Logs are stored in `backend/logs/` with automatic rotation:

```
logs/
├── error/              # Error logs only
│   └── error-2024-01-15.log
├── combined/           # All logs
│   └── combined-2024-01-15.log
└── http/               # HTTP request logs
    └── http-2024-01-15.log
```

### Retention Policy

- **Error logs**: 30 days
- **Combined logs**: 14 days
- **HTTP logs**: 7 days
- **Max file size**: 20MB (rotates when exceeded)

**Note**: `logs/` directory is git-ignored by default.

## Usage

### Import Logger

```typescript
import logger from './utils/logger.js';
```

### Basic Logging

```typescript
// Error logging
logger.error('Database connection failed', { error: err });

// Warning
logger.warn('API rate limit approaching', { usage: 95 });

// Info
logger.info('Server started', { port: 3000 });

// Debug
logger.debug('Processing request', { requestId: '123' });
```

### Logging with Context

Always include relevant metadata as a second parameter:

```typescript
logger.info('User login successful', {
  userId: user.id,
  username: user.username,
  ip: req.ip,
  timestamp: new Date(),
});

logger.error('Payment processing failed', {
  userId,
  amount,
  error: error.message,
  stack: error.stack,
});
```

### Sensitive Data Masking

The logger automatically masks sensitive fields in logged data:

```typescript
logger.info('User created', {
  username: 'alice',
  password: 'secret123', // Will be masked as '***REDACTED***'
  email: 'alice@example.com',
  apiKey: 'sk_live_abc123', // Will be masked
});

// Output:
// {
//   username: 'alice',
//   password: '***REDACTED***',
//   email: 'alice@example.com',
//   apiKey: '***REDACTED***'
// }
```

**Masked Fields** (case-insensitive):

- `password`, `passwd`, `pwd`
- `secret`, `apiKey`, `api_key`
- `token`, `accessToken`, `refreshToken`, `authToken`
- `authorization`, `auth`
- `privateKey`, `private_key`
- `encryptedSeed`, `seed`, `mnemonic`
- Credit card patterns (16 digits)
- SSN patterns (XXX-XX-XXXX)

### HTTP Request Logging

Morgan middleware is automatically configured in `app.ts`:

```typescript
import { httpLogger, responseTimeMiddleware } from './middleware/morgan-logger.js';

app.use(responseTimeMiddleware); // Adds X-Response-Time header
app.use(httpLogger); // Logs all HTTP requests
```

**HTTP Log Format:**

```
POST /api/markets 201 123.45.67.89 52ms "Mozilla/5.0..."
```

**Health checks are automatically skipped** (`/health`, `/ping`).

### Error Logging Best Practices

**In Error Handler:**

```typescript
// Full stack trace for 500 errors
logger.error('Internal server error', {
  error: error.message,
  stack: error.stack,
  method: req.method,
  path: req.path,
  userId: req.user?.id,
  body: maskSensitiveData(req.body),
});

// Message only for operational errors (400-499)
logger.warn('Bad request', {
  error: error.message,
  method: req.method,
  path: req.path,
});
```

**In Services:**

```typescript
try {
  await db.insert(markets).values(data);
  logger.info('Market created', { marketId, creatorId });
} catch (error) {
  logger.error('Failed to create market', { marketId, error });
  throw error;
}
```

## Integration Points

### Files Updated

1. **`utils/logger.ts`** - Core Winston logger configuration
2. **`middleware/morgan-logger.ts`** - HTTP request logging middleware
3. **`middleware/error-handler.ts`** - Global error handler with logging
4. **`app.ts`** - Logging middleware integration
5. **`index.ts`** - Server startup/shutdown logging
6. **`websocket.ts`** - WebSocket connection logging
7. **`services/*.ts`** - Service-level logging
8. **`db/*.ts`** - Database operation logging

### Replaced Console Statements

All `console.log`, `console.error`, `console.warn` statements have been replaced with structured logger calls except for:

- `db/seed.ts` (development utility script - acceptable)

## Development vs Production

### Development Mode

```bash
NODE_ENV=development LOG_LEVEL=debug pnpm dev
```

**Output:**

- Colorized console logs with emojis
- Pretty-printed timestamps
- Debug-level verbosity
- Human-readable format

**Example:**

```
2024-01-15 10:30:45 [info]: Server started { port: 3000, env: 'development' }
2024-01-15 10:30:46 [debug]: WebSocket client connected { socketId: 'abc123' }
```

### Production Mode

```bash
NODE_ENV=production LOG_LEVEL=info pnpm start
```

**Output:**

- JSON formatted logs (easy to parse with log aggregators)
- Info-level by default (less noise)
- Timestamp in ISO format
- Structured metadata

**Example:**

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "message": "Server started",
  "port": 3000,
  "env": "production"
}
```

## Monitoring & Analysis

### Viewing Logs

```bash
# Tail all logs
tail -f logs/combined/combined-*.log

# Tail errors only
tail -f logs/error/error-*.log

# Tail HTTP requests
tail -f logs/http/http-*.log

# Search for specific errors
grep "Database connection failed" logs/error/*.log

# Filter by log level
grep '"level":"error"' logs/combined/*.log | jq .
```

### Log Aggregation (Production)

In production, ship logs to centralized logging services:

**Options:**

- **Datadog** - Use `winston-datadog` transport
- **Elasticsearch** - Use `winston-elasticsearch` transport
- **Loggly** - Use `winston-loggly-bulk` transport
- **AWS CloudWatch** - Use `winston-cloudwatch` transport

**Example (CloudWatch):**

```typescript
import CloudWatchTransport from 'winston-cloudwatch';

logger.add(
  new CloudWatchTransport({
    logGroupName: 'shadow-market-backend',
    logStreamName: `${process.env.NODE_ENV}-${Date.now()}`,
    awsRegion: 'us-east-1',
  })
);
```

## Testing Logs

Run the backend and check logs are generated:

```bash
# Start server
pnpm dev

# Make some requests
curl http://localhost:3000/health
curl http://localhost:3000/api/markets

# Check logs
ls -lh logs/combined/
cat logs/http/http-$(date +%Y-%m-%d).log
```

## Troubleshooting

### Logs not appearing in files?

1. Check `logs/` directory exists: `mkdir -p logs/{error,combined,http}`
2. Verify file permissions: `chmod 755 logs/`
3. Check `LOG_LEVEL` environment variable

### Too much noise in development?

```bash
# Reduce verbosity
LOG_LEVEL=info pnpm dev

# Only errors
LOG_LEVEL=error pnpm dev
```

### Cannot read log files?

```bash
# Fix permissions
chmod 644 logs/**/*.log
```

## Best Practices

✅ **DO:**

- Include relevant context (IDs, usernames, not passwords)
- Use appropriate log levels
- Log at service boundaries (entry/exit points)
- Include error stack traces for debugging
- Use structured logging (objects, not strings)

❌ **DON'T:**

- Log sensitive data (passwords, tokens, seeds)
- Log in tight loops (use sampling)
- Use `console.log` (always use logger)
- Log excessive debug info in production
- Hard-code log messages (use variables for dynamic data)

## Performance Considerations

- **Async Writing**: Logs are written asynchronously (non-blocking)
- **File Rotation**: Automatic rotation prevents disk space issues
- **Sampling**: In high-traffic scenarios, consider sampling debug logs
- **Production**: Use `info` level to reduce I/O overhead

## Future Enhancements

- [ ] Structured error codes for easier filtering
- [ ] Request ID tracking across services
- [ ] Performance metrics (request duration histograms)
- [ ] Alert notifications for critical errors (Slack, PagerDuty)
- [ ] Log retention policies based on compliance requirements
- [ ] Correlation IDs for distributed tracing

---

**Last Updated:** January 2024  
**Maintained By:** Backend Team  
**Questions?** See Winston docs: https://github.com/winstonjs/winston
