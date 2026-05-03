# Crash Game Frontend - Technical Design Document

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Pages & Components                       │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │   │
│  │  │   Login     │  │  Dashboard   │  │  Profile   │  │   │
│  │  └─────────────┘  └──────────────┘  └────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         State Management (Zustand)                   │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │   │
│  │  │   Auth   │  │  Wallet  │  │  Game State      │   │   │
│  │  └──────────┘  └──────────┘  └──────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Services & Hooks                             │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │   │
│  │  │ API Client   │  │ WebSocket    │  │ Utilities  │ │   │
│  │  └──────────────┘  └──────────────┘  └────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌──────────────────────┐      ┌──────────────────────┐
│  Game Service        │      │  Wallet Service      │
│  (port 4001)         │      │  (port 3001)         │
│  - POST /games/bet   │      │  - GET /wallets/me   │
│  - POST /cashout     │      │  - POST /wallets     │
│  - GET /rounds/*     │      │  - GET /health       │
│  - WS /games/ws      │      │                      │
└──────────────────────┘      └──────────────────────┘
         │                              │
         └──────────────┬───────────────┘
                        ▼
              ┌──────────────────────┐
              │  PostgreSQL Database │
              │  RabbitMQ Message    │
              │  Broker              │
              └──────────────────────┘
```

### 1.2 Project Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── GamePage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── HistoryPage.tsx
│   │   └── VerifyPage.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── game/
│   │   │   ├── MultiplierDisplay.tsx
│   │   │   ├── BetForm.tsx
│   │   │   ├── CashOutButton.tsx
│   │   │   ├── GameHistory.tsx
│   │   │   └── PlayerStats.tsx
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Notification.tsx
│   │   │   ├── Loading.tsx
│   │   │   └── Badge.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useGame.ts
│   │   ├── useWallet.ts
│   │   ├── useWebSocket.ts
│   │   ├── useNotification.ts
│   │   └── useLocalStorage.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── gameService.ts
│   │   ├── walletService.ts
│   │   ├── webSocketService.ts
│   │   └── authService.ts
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── gameStore.ts
│   │   ├── walletStore.ts
│   │   └── uiStore.ts
│   ├── types/
│   │   ├── auth.ts
│   │   ├── game.ts
│   │   ├── wallet.ts
│   │   └── api.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   ├── calculations.ts
│   │   └── constants.ts
│   ├── styles/
│   │   ├── globals.css
│   │   ├── theme.css
│   │   └── animations.css
│   ├── App.tsx
│   └── main.tsx
├── public/
│   ├── sounds/
│   │   ├── bet-placed.mp3
│   │   ├── cash-out.mp3
│   │   └── crash.mp3
│   └── images/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── package.json
└── README.md
```

---

## 2. Component Architecture

### 2.1 Page Components

#### LoginPage

- Displays Keycloak login button
- Redirects to Keycloak OAuth2 endpoint
- Handles callback and token storage
- Shows loading state during authentication

#### DashboardPage

- Main game interface
- Displays current round with multiplier
- Shows bet form and cash out button
- Displays game history sidebar
- Responsive layout for mobile/tablet/desktop

#### GamePage

- Embedded in Dashboard
- Real-time multiplier display
- Bet placement and cash out controls
- Live player activity
- Round history

#### ProfilePage

- User information (email, account creation date)
- Player statistics (total bets, total wagered, total won, win rate)
- Bet history with pagination
- Theme toggle

#### HistoryPage

- Detailed bet history
- Filters and sorting
- Pagination
- Bet details modal

#### VerifyPage

- Provably fair verification
- Round ID input
- Server seed hash and client seed inputs
- Verification result display

### 2.2 Feature Components

#### MultiplierDisplay

- Large, prominent multiplier display
- Real-time updates (60 FPS)
- Color coding (green → yellow → red)
- Crash animation
- "LIVE" badge during RUNNING phase

#### BetForm

- Amount input field
- Quick bet buttons (1x, 2x, 5x, Max)
- Input validation
- Error messages
- Disabled during RUNNING phase

#### CashOutButton

- Large, prominent button
- Shows current payout amount
- Disabled during BETTING phase
- Disabled if no active bet
- Loading state during request

#### GameHistory

- Recent rounds list
- Crash points and timestamps
- Number of players
- Scrollable
- Real-time updates

#### PlayerStats

- Total bets placed
- Total amount wagered
- Total amount won
- Win rate percentage
- Average multiplier

### 2.3 UI Components

#### Button

- Variants: primary, secondary, danger, success
- Sizes: small, medium, large
- States: normal, hover, active, disabled, loading
- Accessible with proper ARIA labels

#### Input

- Text input with validation
- Number input with min/max
- Error state with message
- Placeholder text
- Accessible labels

#### Card

- Container component
- Padding and border radius
- Shadow effect
- Responsive

#### Modal

- Overlay with backdrop
- Close button
- Accessible (focus trap, ESC to close)
- Animations

#### Notification

- Toast notifications
- Types: success, error, warning, info
- Auto-dismiss after 3-5 seconds
- Stacking support
- Dismissible

#### Loading

- Spinner animation
- Loading text
- Overlay variant
- Accessible

#### Badge

- Small label component
- Variants: primary, success, danger, warning
- Used for status indicators

---

## 3. State Management (Zustand)

### 3.1 Auth Store

```typescript
interface AuthState {
  // State
  isAuthenticated: boolean;
  playerId: string | null;
  email: string | null;
  token: string | null;
  
  // Actions
  login: (token: string, playerId: string, email: string) => void;
  logout: () => void;
  setToken: (token: string) => void;
  refreshToken: () => Promise<void>;
}
```

### 3.2 Game Store

```typescript
interface GameState {
  // State
  currentRound: Round | null;
  currentMultiplier: number;
  roundState: 'BETTING' | 'RUNNING' | 'CRASHED';
  playerBet: Bet | null;
  recentRounds: Round[];
  
  // Actions
  setCurrentRound: (round: Round) => void;
  setMultiplier: (multiplier: number) => void;
  setRoundState: (state: RoundState) => void;
  setPlayerBet: (bet: Bet | null) => void;
  addRecentRound: (round: Round) => void;
  reset: () => void;
}
```

### 3.3 Wallet Store

```typescript
interface WalletState {
  // State
  balance: number;
  lastBetAmount: number;
  
  // Actions
  setBalance: (balance: number) => void;
  setLastBetAmount: (amount: number) => void;
  updateBalance: (delta: number) => void;
}
```

### 3.4 UI Store

```typescript
interface UIState {
  // State
  theme: 'light' | 'dark';
  soundEnabled: boolean;
  notifications: Notification[];
  
  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSound: () => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
}
```

---

## 4. Real-time Communication (WebSocket)

### 4.1 WebSocket Service

```typescript
class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  
  constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
  }
  
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.sendAuth();
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };
        
        this.ws.onerror = (error) => {
          reject(error);
        };
        
        this.ws.onclose = () => {
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }
  
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
        30000
      );
      setTimeout(() => this.connect(), delay);
    }
  }
  
  private sendAuth() {
    this.send({
      type: 'AUTH',
      token: this.token
    });
  }
  
  private handleMessage(message: any) {
    switch (message.type) {
      case 'MULTIPLIER_UPDATE':
        gameStore.setMultiplier(message.multiplier);
        break;
      case 'ROUND_STATE_CHANGE':
        gameStore.setRoundState(message.state);
        break;
      case 'ROUND_CRASHED':
        gameStore.setRoundState('CRASHED');
        playSound('crash');
        break;
      case 'BET_CONFIRMED':
        gameStore.setPlayerBet(message.bet);
        break;
    }
  }
  
  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
```

### 4.2 Message Types

```typescript
// Multiplier Update
{
  type: 'MULTIPLIER_UPDATE',
  multiplier: 1.23,
  timestamp: 1234567890
}

// Round State Change
{
  type: 'ROUND_STATE_CHANGE',
  state: 'RUNNING',
  roundId: 'uuid'
}

// Round Crashed
{
  type: 'ROUND_CRASHED',
  crashPoint: 2.45,
  roundId: 'uuid'
}

// Bet Confirmed
{
  type: 'BET_CONFIRMED',
  bet: {
    id: 'uuid',
    amount: 10000,
    state: 'ACTIVE'
  }
}
```

---

## 5. API Integration

### 5.1 API Client Setup

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 10000,
  withCredentials: true // Include cookies
});

// Request interceptor for JWT
apiClient.interceptors.request.use((config) => {
  const token = authStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, refresh
      await authStore.getState().refreshToken();
      return apiClient.request(error.config);
    }
    throw error;
  }
);

export default apiClient;
```

### 5.2 Game Service Integration

```typescript
class GameService {
  async placeBet(amount: number): Promise<Bet> {
    const response = await apiClient.post('/games/bet', { amount });
    return response.data;
  }
  
  async cashOut(): Promise<CashOutResult> {
    const response = await apiClient.post('/games/bet/cashout');
    return response.data;
  }
  
  async getCurrentRound(): Promise<Round> {
    const response = await apiClient.get('/games/rounds/current');
    return response.data;
  }
  
  async getRoundHistory(page: number, pageSize: number): Promise<RoundHistory> {
    const response = await apiClient.get('/games/rounds/history', {
      params: { page, pageSize }
    });
    return response.data;
  }
  
  async getPlayerBetHistory(page: number, pageSize: number): Promise<BetHistory> {
    const response = await apiClient.get('/games/bets/me', {
      params: { page, pageSize }
    });
    return response.data;
  }
  
  async verifyRound(roundId: string, serverSeedHash: string, clientSeed: string): Promise<VerificationResult> {
    const response = await apiClient.get(`/games/rounds/${roundId}/verify`, {
      params: { serverSeedHash, clientSeed }
    });
    return response.data;
  }
}
```

### 5.3 Wallet Service Integration

```typescript
class WalletService {
  async getBalance(): Promise<number> {
    const response = await apiClient.get('/wallets/me');
    return response.data.balance;
  }
  
  async createWallet(): Promise<Wallet> {
    const response = await apiClient.post('/wallets');
    return response.data;
  }
}
```

---

## 6. Styling & Theme System

### 6.1 TailwindCSS Configuration

```javascript
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        danger: '#EF4444',
        warning: '#F59E0B',
        success: '#10B981',
        crash: '#EF4444',
        multiplier: {
          low: '#10B981',
          medium: '#F59E0B',
          high: '#EF4444'
        }
      },
      fontSize: {
        multiplier: '4rem'
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        crash: 'crash 1s ease-out'
      },
      keyframes: {
        crash: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      }
    }
  },
  plugins: []
};
```

### 6.2 Theme Implementation

```typescript
// useTheme hook
export const useTheme = () => {
  const { theme, setTheme } = useUIStore();
  
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (theme === 'dark') {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  return { theme, setTheme };
};
```

---

## 7. Performance Optimization

### 7.1 Code Splitting

```typescript
// Lazy load pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));

// Use Suspense for loading state
<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/profile" element={<ProfilePage />} />
    <Route path="/history" element={<HistoryPage />} />
  </Routes>
</Suspense>
```

### 7.2 Memoization

```typescript
// Memoize expensive calculations
const potentialPayout = useMemo(() => {
  return playerBet ? playerBet.amount * currentMultiplier : 0;
}, [playerBet, currentMultiplier]);

// Memoize callbacks
const handlePlaceBet = useCallback(async (amount: number) => {
  try {
    const bet = await gameService.placeBet(amount);
    gameStore.setPlayerBet(bet);
    uiStore.addNotification({
      type: 'success',
      message: `Bet placed: R$ ${formatCurrency(amount)}`
    });
  } catch (error) {
    uiStore.addNotification({
      type: 'error',
      message: error.message
    });
  }
}, []);
```

### 7.3 Image Optimization

```typescript
// Use WebP with fallback
<picture>
  <source srcSet="/images/logo.webp" type="image/webp" />
  <img src="/images/logo.png" alt="Logo" />
</picture>

// Lazy load images
<img src="/images/game-bg.jpg" alt="Game Background" loading="lazy" />
```

---

## 8. Security Implementation

### 8.1 JWT Token Handling

```typescript
// Store token in httpOnly cookie (set by backend)
// Never store in localStorage

// Include token in requests via interceptor
apiClient.interceptors.request.use((config) => {
  // Token is automatically included in cookies
  return config;
});
```

### 8.2 Input Sanitization

```typescript
import DOMPurify from 'dompurify';

// Sanitize user input
const sanitizedInput = DOMPurify.sanitize(userInput);

// Never use innerHTML with user input
// Always use textContent or React's built-in escaping
```

### 8.3 CSRF Protection

```typescript
// SameSite cookies are set by backend
// CORS is configured on backend
// No additional client-side CSRF token needed
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

```typescript
// Example: BetForm component test
describe('BetForm', () => {
  it('should validate minimum bet amount', () => {
    const { getByRole } = render(<BetForm />);
    const input = getByRole('textbox');
    
    fireEvent.change(input, { target: { value: '50' } });
    expect(getByText('Minimum bet is R$ 1.00')).toBeInTheDocument();
  });
  
  it('should disable submit if balance is insufficient', () => {
    const { getByRole } = render(<BetForm balance={100} />);
    const input = getByRole('textbox');
    const button = getByRole('button', { name: /place bet/i });
    
    fireEvent.change(input, { target: { value: '200' } });
    expect(button).toBeDisabled();
  });
});
```

### 9.2 Integration Tests

```typescript
// Example: API integration test
describe('GameService', () => {
  it('should place a bet and update wallet', async () => {
    const gameService = new GameService();
    const walletService = new WalletService();
    
    const initialBalance = await walletService.getBalance();
    const bet = await gameService.placeBet(1000);
    const newBalance = await walletService.getBalance();
    
    expect(newBalance).toBe(initialBalance - 1000);
    expect(bet.state).toBe('ACTIVE');
  });
});
```

### 9.3 Property-Based Tests

```typescript
// Example: Multiplier formatting property test
import { fc } from 'fast-check';

describe('formatMultiplier', () => {
  it('should always format multiplier with 2 decimal places', () => {
    fc.assert(
      fc.property(fc.float({ min: 1, max: 1000 }), (multiplier) => {
        const formatted = formatMultiplier(multiplier);
        const match = formatted.match(/^\d+\.\d{2}x$/);
        return match !== null;
      })
    );
  });
});
```

---

## 10. Accessibility Compliance

### 10.1 WCAG 2.1 AA Standards

- All images have alt text
- All form inputs have associated labels
- Color contrast ratio ≥ 4.5:1 for text
- Interactive elements are keyboard accessible
- Focus indicators are visible
- Semantic HTML is used throughout
- ARIA labels for dynamic content

### 10.2 Keyboard Navigation

```typescript
// Example: Keyboard navigation in BetForm
<form onKeyDown={(e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSubmit();
  }
}}>
  <input ref={inputRef} />
  <button type="submit">Place Bet</button>
</form>
```

---

## 11. Error Handling & Logging

### 11.1 Error Boundary

```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
    // Send to error tracking service (Sentry)
    Sentry.captureException(error);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### 11.2 Logging

```typescript
// Structured logging
const logger = {
  info: (message: string, data?: any) => {
    console.log(JSON.stringify({ level: 'info', message, data, timestamp: new Date() }));
  },
  error: (message: string, error?: Error) => {
    console.error(JSON.stringify({ level: 'error', message, error: error?.message, timestamp: new Date() }));
    Sentry.captureException(error);
  }
};
```

---

## 12. Deployment Strategy

### 12.1 Build Process

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### 12.2 Environment Configuration

```
.env.development
VITE_API_URL=http://localhost:4001
VITE_WALLET_API_URL=http://localhost:3001
VITE_KEYCLOAK_URL=http://localhost:8080

.env.production
VITE_API_URL=https://api.crash-game.com
VITE_WALLET_API_URL=https://wallet-api.crash-game.com
VITE_KEYCLOAK_URL=https://auth.crash-game.com
```

### 12.3 Deployment Platforms

**Vercel:**

- Automatic deployments from Git
- Built-in CDN and caching
- Serverless functions for API routes
- Analytics and monitoring

**Netlify:**

- Automatic deployments from Git
- Built-in CDN and caching
- Netlify Functions for serverless
- Form handling and redirects

---

## 13. Correctness Properties (Property-Based Testing)

### Property 1: Multiplier Formatting Consistency

- **Property**: For any multiplier value ≥ 1.00, formatting always produces "X.XXx" format
- **Test**: Generate random multipliers, verify format matches regex `^\d+\.\d{2}x$`

### Property 2: Bet Amount Validation

- **Property**: Invalid amounts (< 100 or > 100000 centavos) are always rejected
- **Test**: Generate random amounts, verify validation result

### Property 3: Balance Update Correctness

- **Property**: Balance after bet placement equals initial balance minus bet amount
- **Test**: Generate random initial balance and bet amount, verify calculation

### Property 4: Quick Bet Calculations

- **Property**: Quick bet buttons (1x, 2x, 5x) always calculate correctly
- **Test**: Generate random last bet amount, verify calculations

### Property 5: WebSocket Reconnection Backoff

- **Property**: Reconnection delays follow exponential backoff (1s, 2s, 4s, 8s, max 30s)
- **Test**: Simulate connection drops, verify delay sequence

### Property 6: Input Sanitization

- **Property**: XSS payloads are always sanitized and rendered as text
- **Test**: Generate XSS payloads, verify they don't execute

### Property 7: Theme Persistence

- **Property**: Theme preference is always persisted and restored correctly
- **Test**: Set theme, reload page, verify theme is restored

### Property 8: Notification Auto-dismiss

- **Property**: Notifications always auto-dismiss after specified duration
- **Test**: Create notification, verify it disappears after timeout

---

## 14. Summary

This design document provides a comprehensive technical blueprint for the Crash Game Frontend. The architecture is built on modern React best practices with:

- **Scalable State Management**: Zustand for efficient global state
- **Real-time Communication**: WebSocket with automatic reconnection
- **Performance Optimized**: Code splitting, memoization, lazy loading
- **Security First**: JWT in httpOnly cookies, input sanitization, CSRF protection
- **Accessible**: WCAG 2.1 AA compliance, keyboard navigation, screen reader support
- **Well-Tested**: Unit, integration, E2E, and property-based tests
- **Production Ready**: Error handling, logging, monitoring, deployment strategy

All components follow React best practices and TypeScript strict mode for type safety and maintainability.
