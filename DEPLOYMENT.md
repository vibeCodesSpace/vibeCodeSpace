# VibeCode Deployment Guide

## Quick Start

1. **Environment Setup**

```bash
# Required API keys
export OPENAI_API_KEY="your-openai-key"
export ANTHROPIC_API_KEY="your-anthropic-key"  # Optional
export GEMINI_API_KEY="your-gemini-key"        # Optional

# Database (PostgreSQL)
export DATABASE_URL="postgresql://user:pass@host:5432/vibecode"
```

2. **Installation**

```bash
npm install
npm run db:push  # Setup database
npm run build    # Build for production
npm run start    # Start server
```

3. **Development**

```bash
npm run dev      # Start dev server with hot reload
```

## Production Deployment

### Docker Deployment

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

### Railway/Render Deployment

- Set environment variables in dashboard
- Connect GitHub repository
- Auto-deploy on push to main

### Self-Hosting

- Requires Node.js 20+ and PostgreSQL 16+
- Configure reverse proxy (nginx/traefik) for custom domains
- Set up SSL certificates for HTTPS

## API Endpoints

### AI Generation

- `POST /api/ai/generate-site` - Generate website from prompt
- `POST /api/ai/generate-component` - Generate single component
- `POST /api/ai/process-resume` - Process resume file upload
- `GET /api/ai/providers` - Get available AI providers

### Site Management

- `POST /api/sites` - Create new site
- `GET /api/sites/user/:userId` - Get user's sites
- `PUT /api/sites/:siteId` - Update site
- `POST /api/sites/:siteId/publish` - Publish site
- `GET /sites/:subdomain` - Serve published site

### Authentication

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

## Environment Variables

```bash
# Required
OPENAI_API_KEY=          # OpenAI API key
DATABASE_URL=            # PostgreSQL connection string
NODE_ENV=production      # Environment mode

# Optional
ANTHROPIC_API_KEY=       # Anthropic Claude API key
GEMINI_API_KEY=          # Google Gemini API key
PORT=5000               # Server port (default: 5000)
```

## Monitoring & Analytics

- Server logs via console output
- Database query performance via Drizzle ORM
- Site view tracking in metadata
- Error handling with structured responses

## Security Considerations

- Input validation with Zod schemas
- SQL injection prevention via parameterized queries
- File upload size limits (5MB)
- Rate limiting recommended for production
- HTTPS required for API key security
