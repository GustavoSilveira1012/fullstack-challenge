# Crash Game Frontend

A real-time, interactive web application for the Crash Game built with React 18, TypeScript, Vite, and TailwindCSS.

## 🎯 Overview

The Crash Game Frontend provides an engaging, real-time gambling experience where players place bets and watch a multiplier increase exponentially. Players must decide when to cash out before the multiplier "crashes" to secure their winnings. The application features secure authentication, real-time updates via WebSocket, and a fully responsive design optimized for all devices.

## ✨ Features

- 🎮 **Real-time Gameplay**: 60 FPS multiplier updates with smooth animations
- 💰 **Betting System**: Place bets, cash out, and track winnings in real-time
- 🔐 **Secure Authentication**: Keycloak OAuth2 integration with JWT tokens
- 📊 **Statistics & History**: Comprehensive player statistics and bet history
- 🎨 **Dual Themes**: Dark/Light theme support with system preference detection
- 📱 **Responsive Design**: Optimized for mobile, tablet, and desktop devices
- ♿ **Accessibility**: WCAG 2.1 AA compliance with keyboard navigation and screen reader support
- 🚀 **Performance**: Code splitting, lazy loading, and production optimizations
- 🔊 **Sound Effects**: Optional audio feedback for game events
- 🛡️ **Security**: Input sanitization, CSRF protection, and secure token handling

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript (strict mode)
- **Build Tool**: Vite with HMR and production optimizations
- **Styling**: TailwindCSS with custom theme system
- **State Management**: Zustand for efficient global state
- **HTTP Client**: Axios with interceptors and error handling
- **Real-time**: Native WebSocket with automatic reconnection
- **Testing**: Vitest + React Testing Library + Property-based testing
- **Security**: DOMPurify for input sanitization
- **Icons**: Lucide React for consistent iconography

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher (or yarn 1.22.0+)
- **Git**: For version control

### Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd fullstack-challenge/frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   # Copy example environment files
   cp .env.example .env.development
   cp .env.example .env.production
   
   # Edit .env.development with your local configuration
   nano .env.development
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to `http://localhost:5173`

### Development Workflow

1. **Start backend services** (required for full functionality):
   ```bash
   # From the project root
   cd ../
   docker-compose up -d
   ```

2. **Start the frontend development server**:
   ```bash
   npm run dev
   ```

3. **Run tests** (in a separate terminal):
   ```bash
   npm run test
   ```

4. **Check code quality**:
   ```bash
   npm run lint
   ```

### Building for Production

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Preview the production build**:
   ```bash
   npm run preview
   ```

3. **Analyze bundle size** (optional):
   ```bash
   npm run build:analyze
   ```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── common/         # Reusable UI components (Button, Input, Card, etc.)
│   │   ├── game/           # Game-specific components (MultiplierDisplay, BetForm, etc.)
│   │   ├── layout/         # Layout components (Header, Sidebar, Footer)
│   │   └── providers/      # Context providers and wrappers
│   ├── pages/              # Page components (LoginPage, GamePage, ProfilePage, etc.)
│   ├── hooks/              # Custom React hooks (useAuth, useGame, useWallet, etc.)
│   ├── services/           # API services and external integrations
│   ├── store/              # Zustand stores for state management
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions and helpers
│   ├── styles/             # Global styles and theme configuration
│   └── tests/              # Test utilities and setup
├── public/                 # Static assets
│   ├── sounds/            # Audio files for game events
│   └── images/            # Images and icons
├── dist/                  # Production build output (generated)
├── coverage/              # Test coverage reports (generated)
└── docs/                  # Additional documentation
```

### Key Directories Explained

- **`src/components/`**: Modular, reusable React components organized by purpose
- **`src/hooks/`**: Custom hooks for business logic and state management
- **`src/services/`**: API clients and external service integrations
- **`src/store/`**: Zustand stores for global state (auth, game, wallet, UI)
- **`src/types/`**: TypeScript interfaces and type definitions
- **`src/utils/`**: Pure utility functions for formatting, validation, etc.

## 🔧 Available Scripts

### Development
- **`npm run dev`** - Start development server with HMR
- **`npm run build`** - Build for production
- **`npm run preview`** - Preview production build locally

### Code Quality
- **`npm run lint`** - Run ESLint for code quality checks
- **`npm run lint:fix`** - Auto-fix ESLint issues where possible

### Testing
- **`npm run test`** - Run all tests in watch mode
- **`npm run test:ui`** - Run tests with interactive UI
- **`npm run test:coverage`** - Generate test coverage report
- **`npm run test:e2e`** - Run end-to-end tests (requires backend)

### Performance & Analysis
- **`npm run build:analyze`** - Build with bundle analyzer
- **`npm run perf:lighthouse`** - Run Lighthouse performance audit
- **`npm run perf:bundle-size`** - Analyze bundle size

### Utilities
- **`npm run optimize:images`** - Optimize images for production
- **`npm run compress`** - Compress build assets

## 🌍 Environment Configuration

The application uses environment variables for configuration. Three environment files are supported:

### `.env.development` (Local Development)
```env
# API Endpoints
VITE_API_URL=http://localhost:4001
VITE_WALLET_API_URL=http://localhost:3001
VITE_KEYCLOAK_URL=http://localhost:8080

# Keycloak Configuration
VITE_KEYCLOAK_REALM=crash-game
VITE_KEYCLOAK_CLIENT_ID=crash-game-frontend

# WebSocket
VITE_WS_URL=ws://localhost:4001/games/ws

# Logging
VITE_LOG_LEVEL=debug
```

### `.env.production` (Production Deployment)
```env
# API Endpoints
VITE_API_URL=https://api.crash-game.com
VITE_WALLET_API_URL=https://wallet-api.crash-game.com
VITE_KEYCLOAK_URL=https://auth.crash-game.com

# Keycloak Configuration
VITE_KEYCLOAK_REALM=crash-game
VITE_KEYCLOAK_CLIENT_ID=crash-game-frontend

# WebSocket
VITE_WS_URL=wss://api.crash-game.com/games/ws

# Logging
VITE_LOG_LEVEL=error
```

### Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_URL` | Game Service API base URL | ✅ | - |
| `VITE_WALLET_API_URL` | Wallet Service API base URL | ✅ | - |
| `VITE_KEYCLOAK_URL` | Keycloak server URL | ✅ | - |
| `VITE_KEYCLOAK_REALM` | Keycloak realm name | ✅ | - |
| `VITE_KEYCLOAK_CLIENT_ID` | Keycloak client ID | ✅ | - |
| `VITE_WS_URL` | WebSocket server URL | ✅ | - |
| `VITE_LOG_LEVEL` | Logging level (debug/info/warn/error) | ❌ | `info` |

## 🔌 API Integration

The frontend integrates with multiple backend services:

### Game Service (Port 4001)
- **`POST /games/bet`** - Place a bet in the current round
- **`POST /games/bet/cashout`** - Cash out an active bet
- **`GET /games/rounds/current`** - Get current round information
- **`GET /games/rounds/history`** - Get historical round data
- **`GET /games/bets/me`** - Get player's bet history
- **`GET /games/rounds/:roundId/verify`** - Verify round fairness
- **`WS /games/ws`** - WebSocket for real-time game updates

### Wallet Service (Port 3001)
- **`POST /wallets`** - Create a new wallet for a player
- **`GET /wallets/me`** - Get current wallet balance
- **`GET /health`** - Health check endpoint

### Authentication Flow
1. User clicks "Login" → Redirected to Keycloak
2. Keycloak handles OAuth2 authentication
3. User redirected back with authorization code
4. Frontend exchanges code for JWT token
5. JWT token stored in httpOnly cookie
6. Token included in all API requests via interceptor

## 🎮 Game Flow

### Betting Phase (30 seconds)
1. Players can place bets using the bet form
2. Minimum bet: R$ 1.00 (100 centavos)
3. Maximum bet: R$ 1,000.00 (100,000 centavos)
4. Quick bet buttons available (1x, 2x, 5x last bet, Max)

### Running Phase (Variable duration)
1. Multiplier starts at 1.00x and increases exponentially
2. Players can cash out at any time to secure winnings
3. Payout = Bet Amount × Current Multiplier
4. Real-time updates at 60 FPS via WebSocket

### Crash Phase (Instant)
1. Round ends at random multiplier (crash point)
2. Players who didn't cash out lose their bet
3. New round begins after 5-second countdown

## 📊 Performance Targets

### Core Web Vitals
- **First Contentful Paint (FCP)**: < 1.5 seconds
- **Largest Contentful Paint (LCP)**: < 2.5 seconds
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Time to Interactive (TTI)**: < 3 seconds

### Runtime Performance
- **Frame Rate**: 60 FPS during multiplier updates
- **Memory Usage**: < 100MB on desktop, < 50MB on mobile
- **CPU Usage**: < 20% during normal operation
- **Bundle Size**: < 500KB gzipped

### Caching Strategy
- **Static Assets**: 1 year cache with versioned filenames
- **API Responses**: 5 minutes for static data, no cache for real-time data
- **Service Worker**: Caches critical assets for offline functionality

## ♿ Accessibility

The application meets **WCAG 2.1 AA** accessibility standards:

### Keyboard Navigation

- ✅ All interactive elements accessible via Tab key
- ✅ Logical tab order throughout the application
- ✅ Visible focus indicators on all focusable elements
- ✅ Keyboard shortcuts for common actions
- ✅ No keyboard traps

### Screen Reader Support

- ✅ Semantic HTML structure with proper headings
- ✅ ARIA labels for all interactive elements
- ✅ Live regions for dynamic content updates
- ✅ Alternative text for all images
- ✅ Form labels properly associated with inputs

### Visual Accessibility

- ✅ Color contrast ratio ≥ 4.5:1 for all text
- ✅ Information not conveyed by color alone
- ✅ Scalable text up to 200% without horizontal scrolling
- ✅ High contrast mode support

### Testing Accessibility

```bash
# Run accessibility tests
npm run test:a11y

# Manual testing with screen readers
# - NVDA (Windows)
# - JAWS (Windows)
# - VoiceOver (macOS)
# - Orca (Linux)
```

## 🧪 Testing

### Test Types

- **Unit Tests**: Component and function testing
- **Integration Tests**: API and service integration
- **End-to-End Tests**: Full user workflow testing
- **Property-Based Tests**: Mathematical property verification
- **Accessibility Tests**: WCAG compliance verification

### Running Tests

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in UI mode
npm run test:ui

# Run specific test file
npm run test -- BetForm.test.tsx

# Run tests in watch mode
npm run test:watch
```

### Test Coverage Requirements

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Connect Repository**:
   - Link your Git repository to Vercel
   - Vercel will auto-detect the Vite configuration

2. **Configure Environment Variables**:

   ```bash
   # In Vercel dashboard, add these environment variables:
   VITE_API_URL=https://your-api-domain.com
   VITE_WALLET_API_URL=https://your-wallet-api-domain.com
   VITE_KEYCLOAK_URL=https://your-keycloak-domain.com
   VITE_KEYCLOAK_REALM=crash-game
   VITE_KEYCLOAK_CLIENT_ID=crash-game-frontend
   VITE_WS_URL=wss://your-api-domain.com/games/ws
   VITE_LOG_LEVEL=error
   ```

3. **Deploy**:
   - Push to main branch for automatic deployment
   - Or deploy manually from Vercel dashboard

### Netlify Deployment

1. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18`

2. **Environment Variables**:
   - Add the same environment variables as Vercel

3. **Redirects** (create `public/_redirects`):

   ```text
   /*    /index.html   200
   ```

### Manual Deployment

1. **Build the application**:

   ```bash
   npm run build
   ```

2. **Upload `dist/` folder** to your web server

3. **Configure web server** for SPA routing:
   - Nginx: Configure try_files directive
   - Apache: Use .htaccess with RewriteRule
   - Express: Use history API fallback

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔍 Monitoring & Error Tracking

### Sentry Integration (Recommended)

1. **Install Sentry**:

   ```bash
   npm install @sentry/react @sentry/tracing
   ```

2. **Configure Sentry** (in `src/main.tsx`):

   ```typescript
   import * as Sentry from "@sentry/react";
   
   Sentry.init({
     dsn: "YOUR_SENTRY_DSN",
     environment: import.meta.env.MODE,
     tracesSampleRate: 1.0,
   });
   ```

3. **Error Boundary**:

   ```typescript
   import { ErrorBoundary } from "@sentry/react";
   
   <ErrorBoundary fallback={ErrorFallback}>
     <App />
   </ErrorBoundary>
   ```

### Performance Monitoring

- **Lighthouse CI**: Automated performance audits
- **Web Vitals**: Core Web Vitals tracking
- **Bundle Analyzer**: Bundle size monitoring
- **Sentry Performance**: Real-time performance monitoring

## 🌐 Browser Support

### Desktop Browsers

- **Chrome**: 90+ ✅
- **Firefox**: 88+ ✅
- **Safari**: 14+ ✅
- **Edge**: 90+ ✅

### Mobile Browsers

- **iOS Safari**: 12+ ✅
- **Android Chrome**: 8+ ✅
- **Samsung Internet**: 14+ ✅

### Feature Support

- **WebSocket**: Required for real-time updates
- **ES2020**: Modern JavaScript features
- **CSS Grid**: Layout system
- **Web Audio API**: Sound effects (optional)

## 🔧 Development Tools

### Recommended VS Code Extensions

- **ES7+ React/Redux/React-Native snippets**
- **TypeScript Importer**
- **Tailwind CSS IntelliSense**
- **ESLint**
- **Prettier**
- **Auto Rename Tag**
- **Bracket Pair Colorizer**

### Development Workflow

1. **Feature Branch**: Create from `main`
2. **Development**: Use `npm run dev` for hot reloading
3. **Testing**: Run `npm run test` continuously
4. **Code Quality**: Use `npm run lint` before commits
5. **Pull Request**: Submit for code review
6. **Deployment**: Automatic on merge to `main`

## 🐛 Troubleshooting

### Common Issues

**Build Fails with TypeScript Errors**

```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
npm run build
```

**WebSocket Connection Fails**

- Check if backend services are running
- Verify WebSocket URL in environment variables
- Check browser console for connection errors

**Authentication Redirects Don't Work**

- Verify Keycloak configuration
- Check redirect URIs in Keycloak client settings
- Ensure HTTPS in production

**Performance Issues**

```bash
# Analyze bundle size
npm run build:analyze

# Run performance audit
npm run perf:lighthouse
```

### Getting Help

1. **Check the logs**: Browser console and network tab
2. **Review documentation**: This README and inline code comments
3. **Run diagnostics**: `npm run test` and `npm run lint`
4. **Contact team**: Create an issue or reach out to developers

## 👥 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** with proper tests
4. **Run quality checks**: `npm run lint && npm run test`
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Code Style Guidelines

- Use TypeScript strict mode
- Follow ESLint configuration
- Write comprehensive tests
- Document complex logic
- Use semantic commit messages

## 📄 License

Proprietary - All rights reserved

## 📞 Support

For technical support and questions:

- **Email**: dev-team@crash-game.com
- **Documentation**: See `/docs` folder for detailed guides
- **Issues**: Create GitHub issues for bugs and feature requests

---

**Built with ❤️ by the Crash Game Team**
