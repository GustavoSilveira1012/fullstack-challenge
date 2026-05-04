# Monitoring & Error Tracking Setup

This document provides comprehensive setup instructions for monitoring, error tracking, and performance analysis of the Crash Game Frontend.

## 📋 Overview

The monitoring stack includes:
- **Sentry**: Error tracking and performance monitoring
- **Google Analytics**: User behavior analytics
- **Lighthouse CI**: Performance monitoring
- **Custom Metrics**: Application-specific monitoring
- **Health Checks**: System availability monitoring

## 🚨 Sentry Setup (Error Tracking)

### 1. Create Sentry Project

1. **Sign up** at [sentry.io](https://sentry.io)
2. **Create new project**:
   - Platform: React
   - Project name: `crash-game-frontend`
   - Team: Your organization

3. **Copy DSN** from project settings

### 2. Configure Environment Variables

```env
# Production
VITE_SENTRY_DSN=https://your-production-dsn@sentry.io/project-id

# Staging
VITE_SENTRY_DSN=https://your-staging-dsn@sentry.io/project-id

# Development (optional)
VITE_SENTRY_DSN=https://your-development-dsn@sentry.io/project-id
```

### 3. Sentry Configuration

The Sentry configuration is already implemented in `src/config/sentry.ts`. Key features:

- **Error Tracking**: Automatic error capture and reporting
- **Performance Monitoring**: Transaction tracking for API calls and renders
- **Session Replay**: Visual debugging for production issues
- **User Context**: Track errors by user for better debugging
- **Custom Events**: Application-specific event tracking

### 4. Sentry Integration Examples

```typescript
import { captureException, setSentryUser, addBreadcrumb } from '@/config/sentry';

// Set user context after login
setSentryUser({
  id: user.playerId,
  email: user.email,
  username: user.email,
});

// Capture custom exceptions
try {
  await placeBet(amount);
} catch (error) {
  captureException(error, {
    betAmount: amount,
    userBalance: balance,
    gameState: currentGameState,
  });
  throw error;
}

// Add breadcrumbs for debugging
addBreadcrumb('User placed bet', 'user-action', 'info', {
  amount: betAmount,
  multiplier: currentMultiplier,
});
```

### 5. Sentry Alerts Configuration

Set up alerts in Sentry dashboard:

1. **Error Rate Alert**:
   - Condition: Error rate > 5% over 5 minutes
   - Action: Email + Slack notification

2. **Performance Alert**:
   - Condition: P95 response time > 2 seconds
   - Action: Email notification

3. **New Issue Alert**:
   - Condition: New error type detected
   - Action: Immediate Slack notification

## 📊 Google Analytics Setup

### 1. Create GA4 Property

1. **Go to** [analytics.google.com](https://analytics.google.com)
2. **Create property** for the Crash Game Frontend
3. **Copy Measurement ID** (format: G-XXXXXXXXXX)

### 2. Configure Environment Variable

```env
VITE_ANALYTICS_ID=G-XXXXXXXXXX
```

### 3. Analytics Implementation

Create analytics utility:

```typescript
// src/utils/analytics.ts
import { config } from '@/config/env';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const initAnalytics = () => {
  if (!config.monitoring.analyticsId) return;

  // Load Google Analytics script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${config.monitoring.analyticsId}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', config.monitoring.analyticsId, {
    page_title: 'Crash Game',
    page_location: window.location.href,
  });
};

// Track custom events
export const trackEvent = (
  eventName: string,
  parameters?: Record<string, any>
) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, parameters);
  }
};

// Track page views
export const trackPageView = (pageName: string) => {
  trackEvent('page_view', {
    page_title: pageName,
    page_location: window.location.href,
  });
};

// Game-specific events
export const trackGameEvent = {
  betPlaced: (amount: number) => {
    trackEvent('bet_placed', {
      value: amount,
      currency: 'BRL',
    });
  },
  
  cashOut: (amount: number, multiplier: number) => {
    trackEvent('cash_out', {
      value: amount,
      currency: 'BRL',
      multiplier: multiplier,
    });
  },
  
  gameRoundComplete: (crashPoint: number, playerCount: number) => {
    trackEvent('game_round_complete', {
      crash_point: crashPoint,
      player_count: playerCount,
    });
  },
};
```

### 4. Privacy Compliance

Implement cookie consent:

```typescript
// src/components/CookieConsent.tsx
import { useState, useEffect } from 'react';
import { initAnalytics } from '@/utils/analytics';

export const CookieConsent = () => {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowConsent(true);
    } else if (consent === 'accepted') {
      initAnalytics();
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShowConsent(false);
    initAnalytics();
  };

  const declineCookies = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <p className="text-sm">
          We use cookies to improve your experience and analyze site usage.
        </p>
        <div className="flex gap-2">
          <button onClick={declineCookies} className="px-4 py-2 text-sm border border-gray-600 rounded">
            Decline
          </button>
          <button onClick={acceptCookies} className="px-4 py-2 text-sm bg-blue-600 rounded">
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};
```

## 🚀 Performance Monitoring

### 1. Lighthouse CI Setup

Lighthouse CI is configured in `.github/workflows/frontend-ci.yml` and `lighthouserc.js`.

**Key Metrics Monitored**:
- Performance Score > 90%
- Accessibility Score > 95%
- Best Practices Score > 90%
- SEO Score > 90%
- First Contentful Paint < 1.5s
- Largest Contentful Paint < 2.5s
- Cumulative Layout Shift < 0.1

### 2. Web Vitals Monitoring

Implement Core Web Vitals tracking:

```typescript
// src/utils/webVitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
import { trackEvent } from './analytics';

export const reportWebVitals = () => {
  getCLS((metric) => {
    trackEvent('web_vital', {
      name: 'CLS',
      value: metric.value,
      rating: metric.rating,
    });
  });

  getFID((metric) => {
    trackEvent('web_vital', {
      name: 'FID',
      value: metric.value,
      rating: metric.rating,
    });
  });

  getFCP((metric) => {
    trackEvent('web_vital', {
      name: 'FCP',
      value: metric.value,
      rating: metric.rating,
    });
  });

  getLCP((metric) => {
    trackEvent('web_vital', {
      name: 'LCP',
      value: metric.value,
      rating: metric.rating,
    });
  });

  getTTFB((metric) => {
    trackEvent('web_vital', {
      name: 'TTFB',
      value: metric.value,
      rating: metric.rating,
    });
  });
};

// Initialize in main.tsx
if (import.meta.env.PROD) {
  reportWebVitals();
}
```

### 3. Custom Performance Metrics

Track application-specific performance:

```typescript
// src/utils/performanceMetrics.ts
import { performance } from '@/config/sentry';

export const performanceMetrics = {
  // Track API response times
  trackApiCall: async (url: string, method: string, apiCall: () => Promise<any>) => {
    const measurement = performance.measureApiCall(url, method);
    const startTime = Date.now();
    
    try {
      const result = await apiCall();
      const duration = Date.now() - startTime;
      
      measurement.setTag('status', 'success');
      measurement.finish();
      
      // Track in analytics
      trackEvent('api_call', {
        url,
        method,
        duration,
        status: 'success',
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      measurement.setTag('status', 'error');
      measurement.finish();
      
      trackEvent('api_call', {
        url,
        method,
        duration,
        status: 'error',
      });
      
      throw error;
    }
  },

  // Track component render times
  trackRender: (componentName: string, renderFn: () => void) => {
    const measurement = performance.measureRender(componentName);
    const startTime = performance.now();
    
    renderFn();
    
    const duration = performance.now() - startTime;
    measurement.finish();
    
    if (duration > 16) { // > 1 frame at 60fps
      trackEvent('slow_render', {
        component: componentName,
        duration,
      });
    }
  },

  // Track WebSocket performance
  trackWebSocketEvent: (event: string, handler: () => void) => {
    const measurement = performance.measureWebSocket(event);
    const startTime = performance.now();
    
    handler();
    
    const duration = performance.now() - startTime;
    measurement.finish();
    
    trackEvent('websocket_event', {
      event,
      duration,
    });
  },
};
```

## 🏥 Health Checks

### 1. Application Health Check

```typescript
// src/utils/healthCheck.ts
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    api: boolean;
    wallet: boolean;
    websocket: boolean;
    keycloak: boolean;
  };
  timestamp: number;
}

export const performHealthCheck = async (): Promise<HealthStatus> => {
  const checks = {
    api: false,
    wallet: false,
    websocket: false,
    keycloak: false,
  };

  try {
    // Check Game API
    const apiResponse = await fetch(`${config.api.baseUrl}/health`, {
      method: 'GET',
      timeout: 5000,
    });
    checks.api = apiResponse.ok;

    // Check Wallet API
    const walletResponse = await fetch(`${config.api.walletUrl}/health`, {
      method: 'GET',
      timeout: 5000,
    });
    checks.wallet = walletResponse.ok;

    // Check Keycloak
    const keycloakResponse = await fetch(`${config.keycloak.url}/realms/${config.keycloak.realm}`, {
      method: 'GET',
      timeout: 5000,
    });
    checks.keycloak = keycloakResponse.ok;

    // Check WebSocket (basic connectivity test)
    checks.websocket = await testWebSocketConnection();

  } catch (error) {
    console.error('Health check failed:', error);
  }

  const healthyCount = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;

  let status: HealthStatus['status'];
  if (healthyCount === totalChecks) {
    status = 'healthy';
  } else if (healthyCount >= totalChecks / 2) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }

  return {
    status,
    checks,
    timestamp: Date.now(),
  };
};

const testWebSocketConnection = (): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(config.api.wsUrl);
      
      const timeout = setTimeout(() => {
        ws.close();
        resolve(false);
      }, 5000);

      ws.onopen = () => {
        clearTimeout(timeout);
        ws.close();
        resolve(true);
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
    } catch {
      resolve(false);
    }
  });
};
```

### 2. Automated Health Monitoring

```typescript
// src/utils/healthMonitor.ts
import { performHealthCheck } from './healthCheck';
import { captureEvent } from '@/config/sentry';
import { trackEvent } from './analytics';

class HealthMonitor {
  private interval: NodeJS.Timeout | null = null;
  private lastStatus: string = 'unknown';

  start(intervalMs: number = 60000) { // Check every minute
    this.interval = setInterval(async () => {
      const health = await performHealthCheck();
      
      // Track status changes
      if (health.status !== this.lastStatus) {
        captureEvent(`Health status changed: ${this.lastStatus} -> ${health.status}`, 'warning');
        
        trackEvent('health_status_change', {
          from: this.lastStatus,
          to: health.status,
          checks: health.checks,
        });
        
        this.lastStatus = health.status;
      }

      // Alert on unhealthy status
      if (health.status === 'unhealthy') {
        captureEvent('Application is unhealthy', 'error');
      }
    }, intervalMs);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

export const healthMonitor = new HealthMonitor();

// Start monitoring in production
if (import.meta.env.PROD) {
  healthMonitor.start();
}
```

## 📱 Real-time Monitoring Dashboard

### 1. Custom Monitoring Component

```typescript
// src/components/MonitoringDashboard.tsx (Admin only)
import { useState, useEffect } from 'react';
import { performHealthCheck, HealthStatus } from '@/utils/healthCheck';

export const MonitoringDashboard = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      setLoading(true);
      const status = await performHealthCheck();
      setHealth(status);
      setLoading(false);
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading health status...</div>;
  if (!health) return <div>Unable to load health status</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">System Health</h2>
      
      <div className={`p-4 rounded mb-4 ${
        health.status === 'healthy' ? 'bg-green-100 text-green-800' :
        health.status === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800'
      }`}>
        Status: {health.status.toUpperCase()}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {Object.entries(health.checks).map(([service, isHealthy]) => (
          <div key={service} className="flex items-center justify-between p-3 border rounded">
            <span className="font-medium">{service}</span>
            <span className={`px-2 py-1 rounded text-sm ${
              isHealthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {isHealthy ? 'Healthy' : 'Unhealthy'}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Last checked: {new Date(health.timestamp).toLocaleString()}
      </div>
    </div>
  );
};
```

## 🔔 Alerting Setup

### 1. Slack Integration

Set up Slack webhooks for critical alerts:

```typescript
// src/utils/alerting.ts
const SLACK_WEBHOOK_URL = import.meta.env.VITE_SLACK_WEBHOOK_URL;

export const sendSlackAlert = async (message: string, severity: 'info' | 'warning' | 'error') => {
  if (!SLACK_WEBHOOK_URL) return;

  const color = {
    info: '#36a64f',
    warning: '#ff9500',
    error: '#ff0000',
  }[severity];

  const payload = {
    attachments: [{
      color,
      title: 'Crash Game Frontend Alert',
      text: message,
      timestamp: Math.floor(Date.now() / 1000),
    }],
  };

  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Failed to send Slack alert:', error);
  }
};
```

### 2. Email Alerts

Configure email alerts through Sentry or custom service:

```typescript
// src/utils/emailAlerts.ts
export const sendEmailAlert = async (
  subject: string,
  message: string,
  recipients: string[]
) => {
  // Implement email service integration
  // Could use SendGrid, AWS SES, or other email service
};
```

## 📈 Metrics Collection

### 1. Custom Metrics

Track business-specific metrics:

```typescript
// src/utils/businessMetrics.ts
export const businessMetrics = {
  trackUserEngagement: (action: string, duration: number) => {
    trackEvent('user_engagement', {
      action,
      duration,
      timestamp: Date.now(),
    });
  },

  trackGamePerformance: (roundId: string, playerCount: number, crashPoint: number) => {
    trackEvent('game_performance', {
      round_id: roundId,
      player_count: playerCount,
      crash_point: crashPoint,
    });
  },

  trackErrorRate: (errorType: string, count: number) => {
    trackEvent('error_rate', {
      error_type: errorType,
      count,
      timestamp: Date.now(),
    });
  },
};
```

## 🔧 Monitoring Best Practices

### 1. Performance Budgets

Set performance budgets in `lighthouserc.js`:

```javascript
// Performance thresholds
'categories:performance': ['error', { minScore: 0.9 }],
'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
```

### 2. Error Rate Thresholds

Monitor error rates and alert when thresholds are exceeded:

- **Error Rate > 5%**: Warning alert
- **Error Rate > 10%**: Critical alert
- **New Error Type**: Immediate notification

### 3. Performance Monitoring

Track key performance indicators:

- **API Response Time**: < 500ms average
- **WebSocket Latency**: < 100ms
- **Page Load Time**: < 2 seconds
- **Memory Usage**: < 100MB

## 📚 Additional Resources

- [Sentry React Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Google Analytics 4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [Web Vitals Documentation](https://web.dev/vitals/)
- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)

---

**Last Updated**: December 2024  
**Maintainer**: Crash Game Development Team