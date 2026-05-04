# Environment Variables Documentation

This document provides comprehensive information about all environment variables used in the Crash Game Frontend application.

## 📋 Overview

The application uses environment variables for configuration management across different deployment environments. Vite automatically loads environment variables from `.env` files and makes them available to the application when prefixed with `VITE_`.

## 🔧 Environment Files

### File Priority (Vite Loading Order)

1. `.env.local` (loaded in all environments, ignored by git)
2. `.env.[mode].local` (loaded in specific mode, ignored by git)
3. `.env.[mode]` (loaded in specific mode)
4. `.env` (loaded in all environments)

### Supported Modes

- **development**: Local development environment
- **production**: Production deployment environment
- **test**: Testing environment (used by Vitest)

## 📝 Variable Reference

### Required Variables

#### API Configuration

| Variable | Description | Example | Notes |
|----------|-------------|---------|-------|
| `VITE_API_URL` | Game Service API base URL | `http://localhost:4001` | Must not end with trailing slash |
| `VITE_WALLET_API_URL` | Wallet Service API base URL | `http://localhost:3001` | Must not end with trailing slash |
| `VITE_WS_URL` | WebSocket server URL | `ws://localhost:4001/games/ws` | Use `ws://` for dev, `wss://` for prod |

#### Authentication Configuration

| Variable | Description | Example | Notes |
|----------|-------------|---------|-------|
| `VITE_KEYCLOAK_URL` | Keycloak server base URL | `http://localhost:8080` | Must not end with trailing slash |
| `VITE_KEYCLOAK_REALM` | Keycloak realm name | `crash-game` | Must match backend configuration |
| `VITE_KEYCLOAK_CLIENT_ID` | Keycloak client ID | `crash-game-frontend` | Must match Keycloak client settings |

### Optional Variables

#### Application Configuration

| Variable | Description | Default | Options | Notes |
|----------|-------------|---------|---------|-------|
| `VITE_LOG_LEVEL` | Application logging level | `info` | `debug`, `info`, `warn`, `error` | Controls console output verbosity |
| `VITE_APP_TITLE` | Application title | `Crash Game` | Any string | Used in browser title and meta tags |
| `VITE_APP_DESCRIPTION` | Application description | `Real-time crash game` | Any string | Used in meta tags |

#### Feature Flags

| Variable | Description | Default | Options | Notes |
|----------|-------------|---------|---------|-------|
| `VITE_ENABLE_SOUND` | Enable sound effects | `true` | `true`, `false` | Can be overridden by user preference |
| `VITE_ENABLE_ANIMATIONS` | Enable UI animations | `true` | `true`, `false` | Improves performance when disabled |
| `VITE_ENABLE_PWA` | Enable Progressive Web App features | `false` | `true`, `false` | Requires service worker setup |

#### Development & Debugging

| Variable | Description | Default | Options | Notes |
|----------|-------------|---------|---------|-------|
| `VITE_DEBUG_MODE` | Enable debug features | `false` | `true`, `false` | Shows debug panels and logs |
| `VITE_MOCK_API` | Use mock API responses | `false` | `true`, `false` | For development without backend |
| `VITE_DISABLE_WEBSOCKET` | Disable WebSocket connection | `false` | `true`, `false` | For testing without real-time updates |

#### Performance & Monitoring

| Variable | Description | Default | Options | Notes |
|----------|-------------|---------|---------|-------|
| `VITE_SENTRY_DSN` | Sentry error tracking DSN | `""` | Sentry DSN string | Leave empty to disable Sentry |
| `VITE_ANALYTICS_ID` | Google Analytics tracking ID | `""` | GA tracking ID | Leave empty to disable analytics |
| `VITE_PERFORMANCE_MONITORING` | Enable performance monitoring | `false` | `true`, `false` | Collects performance metrics |

## 🌍 Environment-Specific Configurations

### Development Environment (`.env.development`)

```env
# API Endpoints - Local Development
VITE_API_URL=http://localhost:4001
VITE_WALLET_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:4001/games/ws

# Keycloak - Local Development
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=crash-game
VITE_KEYCLOAK_CLIENT_ID=crash-game-frontend

# Application Settings
VITE_LOG_LEVEL=debug
VITE_DEBUG_MODE=true
VITE_ENABLE_SOUND=true
VITE_ENABLE_ANIMATIONS=true

# Development Features
VITE_MOCK_API=false
VITE_DISABLE_WEBSOCKET=false
VITE_PERFORMANCE_MONITORING=true

# Monitoring (Optional)
VITE_SENTRY_DSN=
VITE_ANALYTICS_ID=
```

### Production Environment (`.env.production`)

```env
# API Endpoints - Production
VITE_API_URL=https://api.crash-game.com
VITE_WALLET_API_URL=https://wallet-api.crash-game.com
VITE_WS_URL=wss://api.crash-game.com/games/ws

# Keycloak - Production
VITE_KEYCLOAK_URL=https://auth.crash-game.com
VITE_KEYCLOAK_REALM=crash-game
VITE_KEYCLOAK_CLIENT_ID=crash-game-frontend

# Application Settings
VITE_LOG_LEVEL=error
VITE_DEBUG_MODE=false
VITE_ENABLE_SOUND=true
VITE_ENABLE_ANIMATIONS=true
VITE_ENABLE_PWA=true

# Performance
VITE_PERFORMANCE_MONITORING=true

# Monitoring
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_ANALYTICS_ID=GA_MEASUREMENT_ID
```

### Testing Environment (`.env.test`)

```env
# API Endpoints - Test Environment
VITE_API_URL=http://localhost:4001
VITE_WALLET_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:4001/games/ws

# Keycloak - Test Environment
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=crash-game-test
VITE_KEYCLOAK_CLIENT_ID=crash-game-frontend-test

# Test Settings
VITE_LOG_LEVEL=warn
VITE_DEBUG_MODE=false
VITE_ENABLE_SOUND=false
VITE_ENABLE_ANIMATIONS=false
VITE_MOCK_API=true
VITE_DISABLE_WEBSOCKET=true
VITE_PERFORMANCE_MONITORING=false

# Disable Monitoring in Tests
VITE_SENTRY_DSN=
VITE_ANALYTICS_ID=
```

## 🔒 Security Considerations

### Sensitive Information

⚠️ **Important**: Never store sensitive information in environment variables that are prefixed with `VITE_`. These variables are embedded in the client-side bundle and are visible to users.

#### ❌ Do NOT store:
- API keys or secrets
- Database credentials
- Private keys
- Internal service URLs
- Sensitive configuration data

#### ✅ Safe to store:
- Public API endpoints
- Feature flags
- UI configuration
- Public service URLs
- Non-sensitive application settings

### Best Practices

1. **Use different values per environment**: Never use production values in development
2. **Validate required variables**: Application should fail fast if required variables are missing
3. **Document all variables**: Keep this documentation updated
4. **Use type-safe access**: Create typed interfaces for environment variables
5. **Audit regularly**: Review environment variables for security issues

## 🛠️ Implementation Details

### Type-Safe Environment Variables

Create a typed interface for environment variables:

```typescript
// src/types/env.ts
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WALLET_API_URL: string;
  readonly VITE_KEYCLOAK_URL: string;
  readonly VITE_KEYCLOAK_REALM: string;
  readonly VITE_KEYCLOAK_CLIENT_ID: string;
  readonly VITE_WS_URL: string;
  readonly VITE_LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
  readonly VITE_DEBUG_MODE?: string;
  readonly VITE_ENABLE_SOUND?: string;
  readonly VITE_ENABLE_ANIMATIONS?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_ANALYTICS_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### Environment Variable Validation

```typescript
// src/config/env.ts
export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_URL,
    walletUrl: import.meta.env.VITE_WALLET_API_URL,
    wsUrl: import.meta.env.VITE_WS_URL,
  },
  keycloak: {
    url: import.meta.env.VITE_KEYCLOAK_URL,
    realm: import.meta.env.VITE_KEYCLOAK_REALM,
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
  },
  app: {
    logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
    debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
    enableSound: import.meta.env.VITE_ENABLE_SOUND !== 'false',
    enableAnimations: import.meta.env.VITE_ENABLE_ANIMATIONS !== 'false',
  },
  monitoring: {
    sentryDsn: import.meta.env.VITE_SENTRY_DSN,
    analyticsId: import.meta.env.VITE_ANALYTICS_ID,
  },
};

// Validate required environment variables
const requiredEnvVars = [
  'VITE_API_URL',
  'VITE_WALLET_API_URL',
  'VITE_KEYCLOAK_URL',
  'VITE_KEYCLOAK_REALM',
  'VITE_KEYCLOAK_CLIENT_ID',
  'VITE_WS_URL',
];

for (const envVar of requiredEnvVars) {
  if (!import.meta.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
```

### Runtime Environment Detection

```typescript
// src/utils/environment.ts
export const isDevelopment = import.meta.env.MODE === 'development';
export const isProduction = import.meta.env.MODE === 'production';
export const isTesting = import.meta.env.MODE === 'test';

export const getEnvironmentInfo = () => ({
  mode: import.meta.env.MODE,
  dev: isDevelopment,
  prod: isProduction,
  test: isTesting,
  baseUrl: import.meta.env.BASE_URL,
});
```

## 🚀 Deployment Configuration

### Vercel

Set environment variables in the Vercel dashboard:

1. Go to Project Settings → Environment Variables
2. Add each variable with appropriate values for each environment
3. Set different values for Preview and Production deployments

### Netlify

Set environment variables in the Netlify dashboard:

1. Go to Site Settings → Environment Variables
2. Add each variable with production values
3. Use build hooks for different environments

### Docker

Pass environment variables to Docker containers:

```bash
# Using environment file
docker run --env-file .env.production crash-game-frontend

# Using individual variables
docker run -e VITE_API_URL=https://api.crash-game.com crash-game-frontend
```

### CI/CD Pipelines

Example GitHub Actions configuration:

```yaml
# .github/workflows/deploy.yml
env:
  VITE_API_URL: ${{ secrets.VITE_API_URL }}
  VITE_WALLET_API_URL: ${{ secrets.VITE_WALLET_API_URL }}
  VITE_KEYCLOAK_URL: ${{ secrets.VITE_KEYCLOAK_URL }}
  VITE_KEYCLOAK_REALM: ${{ secrets.VITE_KEYCLOAK_REALM }}
  VITE_KEYCLOAK_CLIENT_ID: ${{ secrets.VITE_KEYCLOAK_CLIENT_ID }}
  VITE_WS_URL: ${{ secrets.VITE_WS_URL }}
```

## 🔍 Troubleshooting

### Common Issues

**Environment variables not loading**
- Ensure variables are prefixed with `VITE_`
- Check file naming (`.env.development`, not `.env.dev`)
- Restart development server after changes

**Variables showing as undefined**
- Verify the variable name spelling
- Check if the variable is set in the correct environment file
- Ensure the file is in the project root directory

**Build fails with missing variables**
- Add validation for required variables
- Check if all required variables are set in production environment
- Verify environment file is being loaded correctly

### Debugging Environment Variables

```typescript
// Add to main.tsx for debugging
if (import.meta.env.VITE_DEBUG_MODE === 'true') {
  console.log('Environment Variables:', {
    mode: import.meta.env.MODE,
    apiUrl: import.meta.env.VITE_API_URL,
    keycloakUrl: import.meta.env.VITE_KEYCLOAK_URL,
    // Add other variables as needed
  });
}
```

## 📚 Additional Resources

- [Vite Environment Variables Documentation](https://vitejs.dev/guide/env-and-mode.html)
- [TypeScript Environment Variables](https://vitejs.dev/guide/env-and-mode.html#typescript)
- [Security Best Practices](https://vitejs.dev/guide/env-and-mode.html#security-notes)

---

**Last Updated**: December 2024  
**Maintainer**: Crash Game Development Team