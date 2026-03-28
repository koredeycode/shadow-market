# Frontend Security Configuration

## Content Security Policy (CSP)

Implemented in `index.html`:

```html
<meta
  http-equiv="Content-Security-Policy"
  content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' http://localhost:3000 ws://localhost:3000;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
"
/>
```

**Production CSP** (stricter):

```
default-src 'self';
script-src 'self';
style-src 'self';
img-src 'self' https://cdn.shadowmarket.io;
font-src 'self';
connect-src 'self' https://api.shadowmarket.io wss://api.shadowmarket.io;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests;
```

## XSS Prevention

### React Built-in Protection

- JSX auto-escaping
- No `dangerouslySetInnerHTML` usage
- User input sanitized before rendering

### Input Sanitization

All user inputs are validated with Zod schemas before submission:

- Market questions: Max 500 characters, HTML stripped
- Descriptions: Max 5000 characters, HTML stripped
- Usernames: Alphanumeric + underscore/dash only
- Bio: Max 500 characters, HTML stripped

### Output Encoding

- URL parameters: `encodeURIComponent()`
- HTML context: React handles automatically
- JavaScript context: Avoid eval(), Function()

## CSRF Protection

### Strategy: Token-Based (JWT)

- JWT in Authorization header (not cookies)
- No cookie-based authentication
- SameSite policy not needed (no auth cookies)

### API Calls

All API calls use Authorization header:

```typescript
axios.create({
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

## Authentication Security

### Token Storage

- JWT stored in memory (React state)
- Refresh token in httpOnly cookie (backend-managed)
- � Never in localStorage (XSS risk)
- � Never in sessionStorage (XSS risk)

### Wallet Integration

- Private keys never stored
- Lace wallet manages keys
- Transaction review before signing
- User must explicitly approve

### Session Management

- Token expiry: 15 minutes
- Refresh token expiry: 7 days
- Auto-refresh before expiry
- Logout clears all tokens

## Dependency Security

### Package Management

- Lock file committed (pnpm-lock.yaml)
- Exact versions specified
- Regular updates (weekly)
- Automated vulnerability scanning

### Critical Dependencies

Monitor these closely:

- `react` - Core framework
- `react-dom` - DOM rendering
- `react-router-dom` - Routing
- `@tanstack/react-query` - Data fetching
- `axios` - HTTP client
- `socket.io-client` - WebSocket
- `zod` - Validation

### Update Policy

- **Critical vulnerabilities**: Immediate update
- **High severity**: Within 24 hours
- **Medium severity**: Within 7 days
- **Low severity**: Next sprint

## Browser Security

### Required Features

- Modern browser with ES2020 support
- TLS 1.2+ support
- Web Crypto API support
- LocalStorage API

### Recommended Settings

- JavaScript enabled
- Cookies enabled (for refresh tokens)
- Third-party cookies blocked
- Pop-ups blocked
- Browser extensions reviewed

## Data Protection

### Sensitive Data Classification

**Critical** (never store):

- Private keys
- Seed phrases
- Passwords
- API secrets

**Sensitive** (encrypt if stored):

- JWT tokens (memory only)
- User preferences
- Transaction history (server-side)

**Public** (safe to store):

- Wallet addresses
- Market data
- Public statistics

### localStorage Usage

Only non-sensitive data:

- Theme preference
- Language preference
- Recently viewed markets
- UI state (sidebar collapsed, etc.)

### Memory Management

Clear sensitive data:

```typescript
// After logout
wallet.disconnect();
localStorage.removeItem('wallet_address');
sessionStorage.clear();

// Overwrite sensitive variables
let privateData = 'sensitive';
// After use:
privateData = '0'.repeat(privateData.length);
```

## Error Handling

### Error Display

- User-friendly messages
- � No stack traces in production
- � No internal errors exposed
- Generic "Something went wrong"

### Error Logging

Development:

```typescript
console.error('Error:', error);
```

Production:

```typescript
// Send to monitoring service (Sentry, DataDog)
Sentry.captureException(error);
```

## Build Security

### Vite Configuration

```typescript
export default defineConfig({
  build: {
    sourcemap: false, // No source maps in production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log
        drop_debugger: true, // Remove debugger
      },
    },
  },
});
```

### Environment Variables

- Prefix with `VITE_` for exposure
- No secrets in client-side env vars
- API URL configurable per environment

## Third-Party Integrations

### Allowed Domains

- `api.shadowmarket.io` - Backend API
- `cdn.shadowmarket.io` - Static assets
- `fonts.googleapis.com` - Google Fonts (if used)
- `midnight.network` - Midnight Network

### Blocked Domains

- Third-party analytics (privacy reasons)
- Ad networks
- Tracking scripts
- Unknown CDNs

## Monitoring & Alerts

### Client-Side Monitoring

- [ ] Sentry for error tracking
- [ ] LogRocket for session replay
- [ ] Performance monitoring (Core Web Vitals)

### Alert Triggers

- High error rate (>5%)
- Authentication failures spike
- Unusual traffic patterns
- New JavaScript errors

## Incident Response

### Security Breach

1. Identify scope (affected users, data exposed)
2. Contain breach (disable feature, block IPs)
3. Notify users immediately
4. Deploy fix within 4 hours
5. Post-mortem within 7 days

### Vulnerability Disclosure

Email: security@shadowmarket.io
PGP Key: [To be added]

Response time:

- Critical: 4 hours
- High: 24 hours
- Medium: 7 days

## Security Checklist

### Pre-Deployment

- [ ] All dependencies audited
- [ ] No console.log in production build
- [ ] Source maps disabled
- [ ] CSP headers configured
- [ ] HTTPS enforced
- [ ] Security headers set (backend)
- [ ] Error handling tested
- [ ] Authentication flows tested
- [ ] XSS protection verified
- [ ] CSRF protection verified

### Post-Deployment

- [ ] Monitor error rates
- [ ] Check for anomalies
- [ ] Verify all APIs working
- [ ] Test authentication flow
- [ ] Review access logs
- [ ] Check performance metrics

## Resources

- [OWASP SPA Security](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html)
- [React Security Best Practices](https://snyk.io/blog/10-react-security-best-practices/)
- [Web Security Essentials](https://developer.mozilla.org/en-US/docs/Web/Security)

---

**Last Updated**: March 24, 2026
**Next Review**: April 24, 2026
