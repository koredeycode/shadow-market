# ShadowMarket Deployment Guide

Production deployment guide for ShadowMarket, covering infrastructure setup, deployment procedures, monitoring, and disaster recovery.

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Application Deployment](#application-deployment)
6. [Load Balancer & CDN](#load-balancer--cdn)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup & Recovery](#backup--recovery)
9. [Security Hardening](#security-hardening)
10. [Scaling Strategy](#scaling-strategy)
11. [Troubleshooting](#troubleshooting)

---

## ✅ Pre-Deployment Checklist

### Code Readiness

- [ ] All tests passing (contracts, backend, frontend)
- [ ] Code review completed
- [ ] Security audit performed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version tagged in Git

### Infrastructure Prerequisites

- [ ] Domain name registered
- [ ] SSL certificates obtained
- [ ] Cloud provider account setup
- [ ] Database backups configured
- [ ] Monitoring tools ready
- [ ] CI/CD pipeline configured
- [ ] Disaster recovery plan documented

### Third-Party Services

- [ ] Midnight Network access (testnet/mainnet)
- [ ] Email service (SendGrid/Mailgun)
- [ ] Analytics (Google Analytics/Mixpanel)
- [ ] Error tracking (Sentry)
- [ ] CDN (Cloudflare/AWS CloudFront)

---

## 🏗️ Infrastructure Setup

### Architecture Overview

```
┌─────────────┐
│   Users     │
└──────┬──────┘
       │
┌──────▼──────────────┐
│  Load Balancer      │ ← Nginx/HAProxy
│  + SSL Termination  │
└──────┬──────────────┘
       │
┌──────▼──────────┬──────────────┬─────────────┐
│   Frontend      │   Backend    │   Backend   │
│   (Static)      │   Instance 1 │   Instance 2│
│   Nginx/CDN     │   (PM2)      │   (PM2)     │
└─────────────────┴──────┬───────┴─────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
┌─────────▼───┐  ┌──────▼─────┐  ┌────▼────┐
│ PostgreSQL  │  │   Redis    │  │ Midnight│
│  Primary    │  │  Cluster   │  │ Network │
│  + Replica  │  │            │  │         │
└─────────────┘  └────────────┘  └─────────┘
```

### Recommended Providers

**Cloud Hosting:**
- AWS (recommended for production)
- Google Cloud Platform
- DigitalOcean (good for smaller deployments)
- Azure

**Managed Services:**
- Database: AWS RDS, Google Cloud SQL, or self-hosted
- Redis: AWS ElastiCache, Redis Cloud, or self-hosted
- CDN: Cloudflare, AWS CloudFront
- Monitoring: Datadog, New Relic, Grafana Cloud

### Server Specifications

**Backend Servers** (minimum per instance):
- CPU: 4 vCPUs
- RAM: 8 GB
- Storage: 100 GB SSD
- Network: 1 Gbps

**Database Server**:
- CPU: 8 vCPUs
- RAM: 16 GB
- Storage: 500 GB SSD (with room to grow)
- IOPS: 3000+

**Redis Server**:
- CPU: 2 vCPUs
- RAM: 4 GB
- Storage: 20 GB SSD

---

## ⚙️ Environment Configuration

### Backend Environment Variables

**Create `/etc/shadowmarket/backend.env`**:

```env
# ============================================
# PRODUCTION ENVIRONMENT CONFIGURATION
# ============================================

# Server Configuration
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Database Configuration
DATABASE_URL=postgresql://shadow_user:STRONG_PASSWORD@db-primary.internal:5432/shadow_market_prod
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20
DATABASE_SSL=true

# Database Read Replica (for read operations)
DATABASE_REPLICA_URL=postgresql://shadow_user:STRONG_PASSWORD@db-replica.internal:5432/shadow_market_prod

# Redis Configuration
REDIS_URL=redis://redis-cluster.internal:6379
REDIS_PASSWORD=STRONG_REDIS_PASSWORD
REDIS_TLS=true

# JWT Configuration
JWT_SECRET=GENERATE_WITH_openssl_rand_base64_64
JWT_REFRESH_SECRET=GENERATE_WITH_openssl_rand_base64_64
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Encryption
ENCRYPTION_KEY=GENERATE_WITH_openssl_rand_base64_32
ENCRYPTION_ALGORITHM=aes-256-gcm

# Midnight Network
MIDNIGHT_RPC_URL=https://rpc.midnight.network
MIDNIGHT_NETWORK=mainnet
MARKET_FACTORY_ADDRESS=0x...  # Deploy and update
ORACLE_ADDRESS=0x...          # Deploy and update

# CORS Configuration
CORS_ORIGIN=https://shadowmarket.io
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000   # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_STRICT=true

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE=/var/log/shadowmarket/app.log

# Email (SendGrid example)
EMAIL_FROM=noreply@shadowmarket.io
SENDGRID_API_KEY=SG.xxx

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# Feature Flags
ENABLE_REGISTRATION=true
ENABLE_P2P_WAGERS=true
ENABLE_MARKET_CREATION=true
MAINTENANCE_MODE=false

# Security
HELMET_ENABLED=true
HTTPS_ONLY=true
TRUST_PROXY=true
```

### Frontend Environment Variables

**Create `/etc/shadowmarket/frontend.env`**:

```env
# API Endpoints
VITE_API_URL=https://api.shadowmarket.io
VITE_WS_URL=wss://api.shadowmarket.io

# Midnight Network
VITE_MIDNIGHT_NETWORK=mainnet
VITE_MIDNIGHT_RPC_URL=https://rpc.midnight.network

# Contract Addresses
VITE_MARKET_FACTORY_ADDRESS=0x...
VITE_ORACLE_ADDRESS=0x...

# Feature Flags
VITE_ENABLE_P2P=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_REGISTRATION=true

# Analytics
VITE_GA_ID=G-XXXXXXXXXX
VITE_MIXPANEL_TOKEN=xxx

# Error Tracking
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx

# Environment
VITE_ENV=production
VITE_VERSION=1.0.0
```

### Generate Secrets

```bash
# JWT secrets (64 bytes)
openssl rand -base64 64
openssl rand -base64 64

# Encryption key (32 bytes)
openssl rand -base64 32

# Redis password
openssl rand -base64 24

# Database password
openssl rand -base64 24 | tr -d "=+/" | cut -c1-32
```

**⚠️ SECURITY**: Store secrets in a secret manager (AWS Secrets Manager, HashiCorp Vault, etc.), not in environment files.

---

## 🗄️ Database Setup

### 1. Provision Database

**AWS RDS Example**:
```bash
aws rds create-db-instance \
  --db-instance-identifier shadowmarket-prod \
  --db-instance-class db.r6g.xlarge \
  --engine postgres \
  --engine-version 16.1 \
  --master-username shadow_admin \
  --master-user-password STRONG_PASSWORD \
  --allocated-storage 500 \
  --storage-type gp3 \
  --iops 3000 \
  --backup-retention-period 30 \
  --multi-az \
  --no-publicly-accessible
```

### 2. Create Application User

```sql
-- Connect as admin
psql -h db-primary.internal -U shadow_admin -d postgres

-- Create application user
CREATE USER shadow_user WITH PASSWORD 'STRONG_PASSWORD';
CREATE DATABASE shadow_market_prod OWNER shadow_user;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE shadow_market_prod TO shadow_user;

-- Connect to the app database
\c shadow_market_prod

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO shadow_user;
```

### 3. Run Migrations

```bash
cd backend

# Set DATABASE_URL
export DATABASE_URL="postgresql://shadow_user:PASSWORD@db-primary.internal:5432/shadow_market_prod"

# Run migrations
npm run db:push

# Verify schema
npm run db:studio
```

### 4. Create Indexes

Indexes should be created automatically by migrations, but verify:

```sql
-- Check index creation
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Should see 40+ indexes
```

### 5. Setup Read Replica

**AWS RDS**:
```bash
aws rds create-db-instance-read-replica \
  --db-instance-identifier shadowmarket-prod-replica \
  --source-db-instance-identifier shadowmarket-prod \
  --db-instance-class db.r6g.large
```

**Configure in backend**:
```typescript
// backend/src/db/index.ts
const primaryDb = drizzle(primaryPool, { schema });
const replicaDb = drizzle(replicaPool, { schema });

// Read operations use replica
export const readDb = replicaDb;
export const writeDb = primaryDb;
```

### 6. Database Optimization

```sql
-- Enable auto-vacuum
ALTER TABLE markets SET (autovacuum_enabled = true);
ALTER TABLE wagers SET (autovacuum_enabled = true);
ALTER TABLE positions SET (autovacuum_enabled = true);

-- Update statistics
ANALYZE;

-- Check query performance
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

---

## 🚀 Application Deployment

### Backend Deployment

**1. Build Application**:
```bash
cd backend
npm ci --production
npm run build
```

**2. Create Systemd Service**:

Create `/etc/systemd/system/shadowmarket-backend.service`:
```ini
[Unit]
Description=ShadowMarket Backend API
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=shadowmarket
WorkingDirectory=/opt/shadowmarket/backend
EnvironmentFile=/etc/shadowmarket/backend.env
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=shadowmarket-backend

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/log/shadowmarket

[Install]
WantedBy=multi-user.target
```

**3. Start Service**:
```bash
sudo systemctl daemon-reload
sudo systemctl enable shadowmarket-backend
sudo systemctl start shadowmarket-backend
sudo systemctl status shadowmarket-backend
```

**4. Or Use PM2** (recommended):

```bash
# Install PM2 globally
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'shadowmarket-backend',
    script: './dist/index.js',
    instances: 4,
    exec_mode: 'cluster',
    env_file: '/etc/shadowmarket/backend.env',
    error_file: '/var/log/shadowmarket/backend-error.log',
    out_file: '/var/log/shadowmarket/backend-out.log',
    merge_logs: true,
    max_memory_restart: '1G',
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
  }],
};
EOF

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup systemd
```

**5. Verify Deployment**:
```bash
curl http://localhost:3001/api/health
```

### Frontend Deployment

**1. Build Application**:
```bash
cd frontend

# Load production environment
export $(cat /etc/shadowmarket/frontend.env | xargs)

# Build
npm ci
npm run build

# Output in dist/
```

**2. Deploy to Nginx**:

```bash
# Copy build to web root
sudo cp -r dist/* /var/www/shadowmarket/

# Set permissions
sudo chown -R www-data:www-data /var/www/shadowmarket
```

**3. Configure Nginx**:

Create `/etc/nginx/sites-available/shadowmarket`:
```nginx
# Frontend server
server {
    listen 80;
    listen [::]:80;
    server_name shadowmarket.io www.shadowmarket.io;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name shadowmarket.io www.shadowmarket.io;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/shadowmarket.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/shadowmarket.io/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Root directory
    root /var/www/shadowmarket;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss image/svg+xml;
    gzip_min_length 1000;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket proxy
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**4. Enable Site**:
```bash
sudo ln -s /etc/nginx/sites-available/shadowmarket /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**5. Or Deploy to CDN**:

**Cloudflare Pages**:
```bash
# Install Wrangler
npm install -g wrangler

# Deploy
wrangler pages publish dist
```

**AWS S3 + CloudFront**:
```bash
# Upload to S3
aws s3 sync dist/ s3://shadowmarket-frontend/

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"
```

---

## ⚖️ Load Balancer & CDN

### Load Balancer Setup (HAProxy)

**Install HAProxy**:
```bash
sudo apt install haproxy
```

**Configure** `/etc/haproxy/haproxy.cfg`:
```haproxy
global
    maxconn 4096
    log /dev/log local0
    log /dev/log local1 notice
    chroot /var/lib/haproxy
    stats socket /run/haproxy/admin.sock mode 660 level admin
    stats timeout 30s
    user haproxy
    group haproxy
    daemon

defaults
    log global
    mode http
    option httplog
    option dontlognull
    timeout connect 5000
    timeout client  50000
    timeout server  50000

frontend http-in
    bind *:80
    bind *:443 ssl crt /etc/ssl/shadowmarket/
    redirect scheme https if !{ ssl_fc }
    
    # ACLs
    acl is_api path_beg /api
    acl is_ws path_beg /socket.io
    
    # Route to backends
    use_backend api_backend if is_api
    use_backend ws_backend if is_ws
    default_backend frontend_backend

backend api_backend
    balance roundrobin
    option httpchk GET /api/health
    server api1 10.0.1.10:3001 check
    server api2 10.0.1.11:3001 check
    server api3 10.0.1.12:3001 check

backend ws_backend
    balance leastconn
    option httpchk GET /api/health
    server api1 10.0.1.10:3001 check
    server api2 10.0.1.11:3001 check

backend frontend_backend
    balance roundrobin
    server web1 10.0.2.10:80 check
    server web2 10.0.2.11:80 check

listen stats
    bind *:8404
    stats enable
    stats uri /stats
    stats refresh 10s
    stats auth admin:STRONG_PASSWORD
```

### CDN Setup (Cloudflare)

**1. Add Site to Cloudflare**:
- Go to Cloudflare dashboard
- Click "Add a Site"
- Enter shadowmarket.io
- Update nameservers at registrar

**2. Configure Settings**:
- SSL/TLS → Full (strict)
- Speed → Auto Minify (JS, CSS, HTML)
-Speed → Brotli compression
- Caching → Browser Cache TTL: 1 year
- Page Rules:
  - `shadowmarket.io/` → Cache Level: Standard
  - `shadowmarket.io/api/*` → Cache Level: Bypass

**3. Setup Firewall Rules**:
```
Rate limiting: 100 requests per minute per IP
Block countries: (optional, based on compliance)
Challenge score < 30 (bots)
```

---

## 📊 Monitoring & Logging

### Application Monitoring

**Install Prometheus**:
```bash
# Add Prometheus to backend
npm install prom-client

# Expose metrics endpoint
// backend/src/routes/metrics.ts
import { register } from 'prom-client';

router.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
});
```

**Grafana Dashboard**:
```bash
# Install Grafana
sudo apt install -y grafana

# Start Grafana
sudo systemctl start grafana-server

# Access at http://localhost:3000
# Default login: admin/admin
```

**Import Dashboards**:
- Node.js application metrics
- PostgreSQL performance
- Redis metrics
- System resources (CPU, memory, disk)

### Logging Setup

**Centralized Logging with Elasticsearch**:

**1. Install Filebeat**:
```bash
curl -L -O https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-8.0.0-amd64.deb
sudo dpkg -i filebeat-8.0.0-amd64.deb
```

**2. Configure Filebeat** (`/etc/filebeat/filebeat.yml`):
```yaml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/shadowmarket/*.log
  json.keys_under_root: true
  json.add_error_key: true

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "shadowmarket-logs-%{+yyyy.MM.dd}"

setup.kibana:
  host: "kibana:5601"
```

**3. Start Filebeat**:
```bash
sudo systemctl enable filebeat
sudo systemctl start filebeat
```

### Error Tracking (Sentry)

**Backend Integration**:
```typescript
// backend/src/index.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

**Frontend Integration**:
```typescript
// frontend/src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 0.1,
});
```

### Uptime Monitoring

**UptimeRobot**:
- Monitor https://shadowmarket.io every 5 minutes
- Monitor https://api.shadowmarket.io/health every 5 minutes
- Alert via email/SMS on downtime

---

## 💾 Backup & Recovery

### Database Backups

**Automated Daily Backups**:

Create `/usr/local/bin/backup-database.sh`:
```bash
#!/bin/bash

BACKUP_DIR="/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="shadowmarket_prod_$DATE.sql.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Dump database
pg_dump -h db-primary.internal \
  -U shadow_user \
  shadow_market_prod | gzip > "$BACKUP_DIR/$FILENAME"

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

# Upload to S3
aws s3 cp "$BACKUP_DIR/$FILENAME" \
  "s3://shadowmarket-backups/database/$FILENAME"

echo "Backup completed: $FILENAME"
```

**Schedule with Cron**:
```bash
sudo chmod +x /usr/local/bin/backup-database.sh

# Add to crontab (daily at 2 AM)
0 2 * * * /usr/local/bin/backup-database.sh >> /var/log/backup.log 2>&1
```

### Application Backups

```bash
#!/bin/bash
# Backup application code and configuration

BACKUP_DIR="/backups/app"
DATE=$(date +%Y%m%d_%H%M%S)

tar -czf "$BACKUP_DIR/shadowmarket_app_$DATE.tar.gz" \
  /opt/shadowmarket \
  /etc/shadowmarket \
  /etc/nginx/sites-available/shadowmarket

# Upload to S3
aws s3 cp "$BACKUP_DIR/shadowmarket_app_$DATE.tar.gz" \
  "s3://shadowmarket-backups/app/"
```

### Disaster Recovery Plan

**RTO (Recovery Time Objective)**: 1 hour  
**RPO (Recovery Point Objective)**: 1 hour

**Recovery Steps**:

1. **Database Recovery**:
   ```bash
   # Restore from backup
   gunzip -c backup.sql.gz | psql -h new-db.internal -U shadow_user shadow_market_prod
   ```

2. **Application Recovery**:
   ```bash
   # Extract app backup
   tar -xzf shadowmarket_app.tar.gz -C /

   # Restart services
   pm2 restart all
   ```

3. **DNS Failover**:
   - Update DNS to point to backup infrastructure
   - TTL: 300 seconds (5 minutes)

4. **Verify**:
   ```bash
   # Test health endpoint
   curl https://shadowmarket.io/api/health

   # Check critical functionality
   # - User login
   # - Market browsing
   # - Place bet
   # - View portfolio
   ```

---

## 🔒 Security Hardening

### Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw enable
```

### SSH Hardening

Edit `/etc/ssh/sshd_config`:
```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
Protocol 2
X11Forwarding no
MaxAuthTries 3
```

### SSL/TLS Setup (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d shadowmarket.io -d www.shadowmarket.io

# Auto-renewal (cron)
0 0 * * * certbot renew --quiet
```

### Security Headers

Ensure these headers are set (Nginx or application):
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
```

### Secrets Management

**AWS Secrets Manager**:
```bash
# Store secret
aws secretsmanager create-secret \
  --name shadowmarket/prod/jwt-secret \
  --secret-string "your-jwt-secret"

# Retrieve in application
const secret = await secretsManager.getSecretValue({
  SecretId: 'shadowmarket/prod/jwt-secret'
}).promise();
```

---

## 📈 Scaling Strategy

### Horizontal Scaling

**Add More Backend Instances**:
```bash
# Deploy to new server
ssh backend-4.internal
cd /opt/shadowmarket
git pull
npm install
pm2 start ecosystem.config.js

# Add to load balancer
# (Update HAProxy or AWS ALB configuration)
```

**Auto-Scaling (AWS)**:
```bash
# Create launch template
aws ec2 create-launch-template \
  --launch-template-name shadowmarket-backend \
  --version-description "v1.0" \
  --launch-template-data file://template.json

# Create auto-scaling group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name shadowmarket-backend-asg \
  --launch-template LaunchTemplateName=shadowmarket-backend \
  --min-size 2 \
  --max-size 10 \
  --desired-capacity 4 \
  --target-group-arns arn:aws:elasticloadbalancing:...
```

### Vertical Scaling

**Upgrade Server Resources**:
```bash
# AWS: Modify instance type
aws ec2 modify-instance-attribute \
  --instance-id i-1234567890abcdef0 \
  --instance-type "{\"Value\": \"c6i.4xlarge\"}"

# Restart instance
aws ec2 stop-instances --instance-ids i-1234567890abcdef0
aws ec2 start-instances --instance-ids i-1234567890abcdef0
```

### Database Scaling

**Read Replicas**:
- Route read queries to replicas
- Keep writes to primary

**Sharding** (if needed):
- Shard by user ID or market ID
- Requires significant code changes

**Connection Pooling**:
```typescript
// backend/src/db/index.ts
const pool = new Pool({
  max: 20,        // Maximum connections
  min: 2,         // Minimum connections
  idleTimeoutMillis: 30000,
});
```

### Caching Strategy

**Redis Cache**:
```typescript
// Cache market lists
const markets = await cache.get('markets:active');
if (!markets) {
  markets = await db.query.markets.findMany();
  await cache.set('markets:active', JSON.stringify(markets), 'EX', 300);
}
```

**CDN Caching**:
- Cache static assets (1 year)
- Cache API responses (varies by endpoint)
- Purge cache on updates

---

## 🔧 Troubleshooting

### High CPU Usage

**Diagnose**:
```bash
# Check processes
top
htop

# Check PM2
pm2 monit

# Check slow queries
SELECT * FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

**Solutions**:
- Add more backend instances
- Optimize slow queries
- Implement caching

### High Memory Usage

**Diagnose**:
```bash
# Check memory
free -h

# Check processes
ps aux --sort=-rss | head

# Check heap usage (Node.js)
node --expose-gc --inspect dist/index.js
```

**Solutions**:
- Increase server memory
- Optimize code (memory leaks)
- Reduce PM2 instances

### Database Connection Issues

**Diagnose**:
```bash
# Check connections
SELECT count(*) FROM pg_stat_activity;

# Check idle connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'idle';
```

**Solutions**:
- Increase `max_connections` in PostgreSQL
- Optimize connection pooling
- Add read replicas

### Slow API Responses

**Diagnose**:
```bash
# Check API response times (Prometheus)
rate(http_request_duration_seconds_sum[5m])

# Check database query times
EXPLAIN ANALYZE SELECT ...;
```

**Solutions**:
- Add database indexes
- Implement caching
- Optimize queries
- Add CDN for static content

---

## 📚 Additional Resources

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [PostgreSQL Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)
- [Node.js Production Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Nginx Optimization](https://www.nginx.com/blog/tuning-nginx/)

---

**Version**: 1.0.0  
**Last Updated**: March 24, 2026  
**Questions?**: devops@shadowmarket.io
