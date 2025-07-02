# VibeCode Monitoring & Auto-Fix Setup

This document explains the comprehensive monitoring and auto-fixing system for the VibeCode application.

## 🔍 Monitoring Components

### 1. Winston Logging with Slack Integration

- **Location**: `lib/logger.ts`
- **Features**:
  - Console, file, and Slack logging
  - Automatic error notifications to Slack
  - Request/response logging
  - Log rotation (5MB max, 5 files)
  - Structured JSON logging

**Setup**: Add `SLACK_WEBHOOK_URL` to Render environment variables

### 2. Health Check Endpoints

- **Location**: `lib/health.ts`
- **Endpoints**:
  - `/health` - Basic health check (used by Render)
  - `/health/detailed` - Comprehensive health check
  - `/ready` - Readiness check
  - `/live` - Liveness check

**Checks**:

- Database connectivity
- Memory usage monitoring
- Disk space verification
- Application uptime

### 3. Sentry Error Tracking

- **Location**: `lib/sentry.ts`
- **Features**:
  - Real-time error capture
  - Performance monitoring
  - Release tracking
  - User context

**Setup**: Add `SENTRY_DSN` to Render environment variables

### 4. GitHub Actions Automation

- **Location**: `.github/workflows/`

## 🚀 GitHub Actions Workflows

### Auto-Fix Workflow (`.github/workflows/auto-fix.yml`)

**Triggers**: Push, PR, Daily at 2 AM UTC

**Actions**:

- TypeScript compilation check
- Build verification
- Auto-format code with Prettier
- Auto-fix ESLint issues
- Security updates (`npm audit fix`)
- Auto-commit fixes
- Create GitHub issues for build failures

### Health Monitoring (`.github/workflows/monitoring.yml`)

**Triggers**: Every 15 minutes

**Actions**:

- Check application health endpoints
- Notify Slack on failures
- Create incident GitHub issues
- Track application uptime

### Keep-Alive Pinger (`.github/workflows/keep-alive.yml`)

**Triggers**: Every 5 minutes

**Actions**:

- Ping health endpoint to prevent Render sleep
- Log ping results
- Fallback to main URL if health check fails

## 🔧 Environment Variables

Add these to your Render service:

```bash
# Required for Slack notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Required for Sentry error tracking
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Optional: Adjust logging level
LOG_LEVEL=info

# Auto-set by Render
NODE_ENV=production
```

## 🔗 GitHub Secrets

Add these secrets to your GitHub repository:

```bash
# For monitoring workflows
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
APP_URL=https://your-app.onrender.com
```

## 📊 What Gets Monitored

### Application Health

- ✅ HTTP response status
- ✅ Database connectivity
- ✅ Memory usage (alerts >400MB)
- ✅ Disk accessibility
- ✅ Application uptime

### Code Quality

- ✅ TypeScript compilation
- ✅ Build success/failure
- ✅ Code formatting
- ✅ Linting issues
- ✅ Security vulnerabilities

### Performance

- ✅ Request/response times
- ✅ Error rates
- ✅ Memory consumption
- ✅ Application responsiveness

## 🚨 Automatic Responses

### Build Failures

1. **Auto-fix** common issues (formatting, linting)
2. **Auto-update** security vulnerabilities
3. **Create GitHub issue** if build still fails
4. **Slack notification** to team

### Health Check Failures

1. **Immediate Slack alert**
2. **GitHub incident issue** creation
3. **Detailed logging** for debugging
4. **Keep-alive pings** continue

### Error Detection

1. **Sentry capture** with context
2. **Winston logging** to files
3. **Slack notification** for critical errors
4. **Structured error data** for analysis

## 📈 Accessing Monitoring Data

### Logs

- **Local**: `logs/` directory
- **Production**: Render logs dashboard
- **Errors**: Sentry dashboard

### Health Status

- **Basic**: `https://your-app.onrender.com/health`
- **Detailed**: `https://your-app.onrender.com/health/detailed`

### Notifications

- **Slack**: Real-time alerts
- **GitHub Issues**: Incident tracking
- **Sentry**: Error details and performance

## 🔄 Manual Actions

### Test Health Checks

```bash
curl https://your-app.onrender.com/health
curl https://your-app.onrender.com/health/detailed
```

### Trigger Auto-Fix

- Push to main branch, or
- Go to Actions → Auto-Fix → Run workflow

### Test Monitoring

- Go to Actions → Health Monitoring → Run workflow

## 🎯 Benefits

1. **Proactive Issue Detection**: Catch problems before users report them
2. **Automated Recovery**: Many issues self-resolve through auto-fixes
3. **Reduced Downtime**: Keep-alive prevents Render sleeping
4. **Team Awareness**: Slack notifications keep everyone informed
5. **Historical Data**: Logs and Sentry provide insights for optimization
6. **Zero-Config Maintenance**: Once setup, runs automatically

## 🔧 Customization

### Adjust Monitoring Frequency

Edit cron schedules in workflow files:

- `*/5 * * * *` = Every 5 minutes
- `*/15 * * * *` = Every 15 minutes
- `0 2 * * *` = Daily at 2 AM UTC

### Add Custom Health Checks

Edit `lib/health.ts` to add application-specific checks:

```typescript
{
  name: 'custom-service',
  check: async () => {
    // Your custom logic here
    return { status: 'healthy', message: 'Custom check passed' };
  }
}
```

### Modify Alert Thresholds

Edit memory limits, error rates, or response time thresholds in health check logic.

This monitoring system provides comprehensive coverage while remaining lightweight and cost-effective for your application.
