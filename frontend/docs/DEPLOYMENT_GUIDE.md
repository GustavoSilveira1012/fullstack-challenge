# Deployment Guide

This guide provides comprehensive instructions for deploying the Crash Game Frontend to various platforms and environments.

## 📋 Overview

The Crash Game Frontend can be deployed to multiple platforms:
- **Vercel** (Recommended for production)
- **Netlify** (Alternative option)
- **AWS S3 + CloudFront**
- **Docker containers**
- **Traditional web servers**

## 🚀 Quick Deployment (Vercel)

### Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Git Repository**: Code must be in a Git repository (GitHub, GitLab, Bitbucket)
3. **Environment Variables**: Prepare production environment values

### Step-by-Step Deployment

1. **Connect Repository**:
   ```bash
   # Install Vercel CLI (optional)
   npm install -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy from project directory
   cd frontend/
   vercel
   ```

2. **Configure Environment Variables** in Vercel Dashboard:
   - Go to Project Settings → Environment Variables
   - Add the following variables:

   ```env
   VITE_API_URL=https://your-api-domain.com
   VITE_WALLET_API_URL=https://your-wallet-api-domain.com
   VITE_KEYCLOAK_URL=https://your-keycloak-domain.com
   VITE_KEYCLOAK_REALM=crash-game
   VITE_KEYCLOAK_CLIENT_ID=crash-game-frontend
   VITE_WS_URL=wss://your-api-domain.com/games/ws
   VITE_LOG_LEVEL=error
   VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
   ```

3. **Deploy**:
   - Push to main branch for automatic deployment
   - Or use `vercel --prod` for manual deployment

## 🌐 Alternative Deployment Options

### Netlify Deployment

1. **Connect Repository**:
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your repository

2. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Base directory: `frontend`

3. **Environment Variables**:
   - Go to Site Settings → Environment Variables
   - Add the same variables as Vercel

4. **Deploy**:
   - Automatic deployment on push to main branch

### AWS S3 + CloudFront

1. **Build the Application**:
   ```bash
   npm run build
   ```

2. **Create S3 Bucket**:
   ```bash
   aws s3 mb s3://crash-game-frontend
   aws s3 website s3://crash-game-frontend --index-document index.html --error-document index.html
   ```

3. **Upload Files**:
   ```bash
   aws s3 sync dist/ s3://crash-game-frontend --delete
   ```

4. **Configure CloudFront**:
   - Create CloudFront distribution
   - Set S3 bucket as origin
   - Configure custom error pages for SPA routing

### Docker Deployment

1. **Create Dockerfile**:
   ```dockerfile
   # Multi-stage build
   FROM node:18-alpine AS builder
   
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   RUN npm run build
   
   # Production stage
   FROM nginx:alpine
   
   # Copy built assets
   COPY --from=builder /app/dist /usr/share/nginx/html
   
   # Copy nginx configuration
   COPY nginx.conf /etc/nginx/nginx.conf
   
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Create nginx.conf**:
   ```nginx
   events {
     worker_connections 1024;
   }
   
   http {
     include /etc/nginx/mime.types;
     default_type application/octet-stream;
     
     gzip on;
     gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
     
     server {
       listen 80;
       server_name localhost;
       root /usr/share/nginx/html;
       index index.html;
       
       # SPA routing
       location / {
         try_files $uri $uri/ /index.html;
       }
       
       # Cache static assets
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
         expires 1y;
         add_header Cache-Control "public, immutable";
       }
       
       # Security headers
       add_header X-Frame-Options "DENY" always;
       add_header X-Content-Type-Options "nosniff" always;
       add_header X-XSS-Protection "1; mode=block" always;
       add_header Referrer-Policy "strict-origin-when-cross-origin" always;
     }
   }
   ```

3. **Build and Run**:
   ```bash
   docker build -t crash-game-frontend .
   docker run -p 80:80 crash-game-frontend
   ```

## 🔧 Environment-Specific Configurations

### Development Environment

```env
# .env.development
VITE_API_URL=http://localhost:4001
VITE_WALLET_API_URL=http://localhost:3001
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=crash-game
VITE_KEYCLOAK_CLIENT_ID=crash-game-frontend
VITE_WS_URL=ws://localhost:4001/games/ws
VITE_LOG_LEVEL=debug
VITE_DEBUG_MODE=true
```

### Staging Environment

```env
# .env.staging
VITE_API_URL=https://api-staging.crash-game.com
VITE_WALLET_API_URL=https://wallet-staging.crash-game.com
VITE_KEYCLOAK_URL=https://auth-staging.crash-game.com
VITE_KEYCLOAK_REALM=crash-game-staging
VITE_KEYCLOAK_CLIENT_ID=crash-game-frontend-staging
VITE_WS_URL=wss://api-staging.crash-game.com/games/ws
VITE_LOG_LEVEL=info
VITE_SENTRY_DSN=https://staging-dsn@sentry.io/project-id
```

### Production Environment

```env
# .env.production
VITE_API_URL=https://api.crash-game.com
VITE_WALLET_API_URL=https://wallet.crash-game.com
VITE_KEYCLOAK_URL=https://auth.crash-game.com
VITE_KEYCLOAK_REALM=crash-game
VITE_KEYCLOAK_CLIENT_ID=crash-game-frontend
VITE_WS_URL=wss://api.crash-game.com/games/ws
VITE_LOG_LEVEL=error
VITE_SENTRY_DSN=https://production-dsn@sentry.io/project-id
VITE_ANALYTICS_ID=GA_MEASUREMENT_ID
```

## 🔒 Security Configuration

### Content Security Policy (CSP)

Configure CSP headers for security:

```javascript
// In vercel.json or netlify.toml
"Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' wss: https:; font-src 'self' https://fonts.gstatic.com;"
```

### HTTPS Configuration

Ensure all deployments use HTTPS:

1. **Vercel**: Automatic HTTPS with custom domains
2. **Netlify**: Automatic HTTPS with Let's Encrypt
3. **AWS**: Configure SSL certificate in CloudFront
4. **Docker**: Use reverse proxy (nginx, Traefik) with SSL

## 📊 Monitoring Setup

### Sentry Configuration

1. **Create Sentry Project**:
   - Go to [sentry.io](https://sentry.io)
   - Create new React project
   - Copy DSN

2. **Configure Environment Variable**:
   ```env
   VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
   ```

3. **Verify Setup**:
   - Deploy application
   - Check Sentry dashboard for events

### Analytics Setup (Optional)

1. **Google Analytics**:
   ```env
   VITE_ANALYTICS_ID=GA_MEASUREMENT_ID
   ```

2. **Custom Analytics**:
   - Implement custom tracking in `src/utils/analytics.ts`
   - Add tracking calls to key user interactions

## 🚀 CI/CD Pipeline

### GitHub Actions (Included)

The project includes a comprehensive CI/CD pipeline:

1. **Code Quality**: ESLint, TypeScript, Prettier
2. **Testing**: Unit, integration, E2E tests
3. **Security**: Dependency audit, Snyk scan
4. **Performance**: Lighthouse audit, bundle analysis
5. **Deployment**: Automatic deployment to staging/production

### Manual Deployment Commands

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Vercel
vercel --prod

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

## 🔍 Health Checks and Monitoring

### Application Health Check

Create a health check endpoint:

```typescript
// src/utils/healthCheck.ts
export const healthCheck = async () => {
  const checks = {
    api: false,
    wallet: false,
    websocket: false,
  };
  
  try {
    // Check API connectivity
    const apiResponse = await fetch(`${import.meta.env.VITE_API_URL}/health`);
    checks.api = apiResponse.ok;
    
    // Check Wallet API
    const walletResponse = await fetch(`${import.meta.env.VITE_WALLET_API_URL}/health`);
    checks.wallet = walletResponse.ok;
    
    // Check WebSocket (basic connectivity)
    const ws = new WebSocket(import.meta.env.VITE_WS_URL);
    checks.websocket = await new Promise((resolve) => {
      ws.onopen = () => resolve(true);
      ws.onerror = () => resolve(false);
      setTimeout(() => resolve(false), 5000);
    });
    
    return checks;
  } catch (error) {
    console.error('Health check failed:', error);
    return checks;
  }
};
```

### Monitoring Dashboard

Set up monitoring for:

1. **Application Performance**:
   - Page load times
   - API response times
   - Error rates

2. **User Experience**:
   - Core Web Vitals
   - User interactions
   - Conversion rates

3. **Infrastructure**:
   - CDN performance
   - Server response times
   - Uptime monitoring

## 🐛 Troubleshooting

### Common Deployment Issues

**Build Fails with Environment Variables**:
```bash
# Check if all required variables are set
npm run build 2>&1 | grep -i "environment"

# Validate environment variables
node -e "console.log(process.env)" | grep VITE_
```

**Routing Issues (404 on Refresh)**:
- Ensure SPA routing is configured
- Check `vercel.json` or `netlify.toml` redirects
- Verify server configuration for history API

**Performance Issues**:
```bash
# Analyze bundle size
npm run build:analyze

# Run Lighthouse audit
npm run perf:lighthouse

# Check for unused dependencies
npx depcheck
```

**CORS Issues**:
- Verify API endpoints allow frontend domain
- Check Keycloak redirect URIs
- Ensure WebSocket connections are allowed

### Rollback Procedures

**Vercel Rollback**:
```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

**Netlify Rollback**:
- Go to Netlify dashboard
- Select site → Deploys
- Click "Publish deploy" on previous version

**Manual Rollback**:
```bash
# Revert to previous commit
git revert HEAD

# Force push (use with caution)
git push origin main --force
```

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [React Deployment Best Practices](https://create-react-app.dev/docs/deployment/)

---

**Last Updated**: December 2024  
**Maintainer**: Crash Game Development Team