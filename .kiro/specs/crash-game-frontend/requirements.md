# Crash Game Frontend - Requirements Document

## 1. Overview

The Crash Game Frontend is a real-time, interactive web application that allows players to participate in crash game rounds. Players place bets, watch a multiplier increase in real-time, and decide when to cash out before the multiplier crashes. The frontend must provide a seamless, responsive, and engaging user experience across all devices.

**Technology Stack**: React 18 + TypeScript + Vite + TailwindCSS + WebSocket

**Target Users**: Players aged 18+, casual and experienced gamblers

**Deployment**: Vercel/Netlify with CDN

---

## 2. Functional Requirements

### 2.1 User Authentication & Account Management

**REQ-2.1.1**: THE System SHALL provide a login page that redirects users to Keycloak for OAuth2 authentication.

- **Acceptance Criteria**:
  - Login button redirects to Keycloak login page
  - After successful authentication, user is redirected back to dashboard
  - JWT token is stored securely in httpOnly cookie
  - User information (playerId, email) is displayed in header

**REQ-2.1.2**: THE System SHALL display the current user's wallet balance prominently on all pages.

- **Acceptance Criteria**:
  - Balance is displayed in header with currency symbol (R$)
  - Balance updates in real-time when bets are placed or cashed out
  - Balance is formatted with thousand separators (e.g., R$ 1.234,56)
  - Balance is fetched from GET /wallets/me endpoint

**REQ-2.1.3**: THE System SHALL provide a logout functionality that clears authentication tokens.

- **Acceptance Criteria**:
  - Logout button is visible in header
  - Clicking logout clears JWT token and redirects to login page
  - User session is terminated on backend

**REQ-2.1.4**: THE System SHALL display user profile information (email, account creation date, total bets placed).

- **Acceptance Criteria**:
  - Profile page accessible from header menu
  - Shows email from JWT token
  - Shows account statistics (total bets, total wagered, total won)
  - Statistics are fetched from backend API

### 2.2 Game Interface & Real-time Display

**REQ-2.2.1**: THE System SHALL display a real-time multiplier that starts at 1.00x and increases exponentially during the RUNNING phase.

- **Acceptance Criteria**:
  - Multiplier is displayed in large, easy-to-read font (minimum 48px)
  - Multiplier updates at least 60 times per second (60 FPS)
  - Multiplier is formatted with 2 decimal places (e.g., 1.23x, 45.67x)
  - Multiplier color changes based on value (green for low, yellow for medium, red for high)

**REQ-2.2.2**: WHEN a round enters RUNNING phase, THE System SHALL display a visual indicator showing the round is active.

- **Acceptance Criteria**:
  - "LIVE" badge appears in top-right of game area
  - Badge pulses or animates to indicate active round
  - Badge disappears when round crashes

**REQ-2.2.3**: WHEN a round crashes, THE System SHALL display the crash point prominently and show a crash animation.

- **Acceptance Criteria**:
  - Crash point is displayed in red with "CRASHED" label
  - Screen flashes or shakes to indicate crash
  - Multiplier stops updating
  - Crash animation lasts 1-2 seconds

**REQ-2.2.4**: THE System SHALL display a list of recent rounds with crash points and timestamps.

- **Acceptance Criteria**:
  - Recent rounds list shows last 10 rounds
  - Each round shows: round ID, crash point, timestamp, number of players
  - List is scrollable and updates in real-time
  - Clicking a round shows detailed statistics

**REQ-2.2.5**: THE System SHALL display live player activity (number of active bets, total wagered in current round).

- **Acceptance Criteria**:
  - Shows "X players betting" in current round
  - Shows total amount wagered in current round
  - Updates in real-time as players place/cash out bets
  - Shows top 5 players by bet amount (optional)

### 2.3 Betting System

**REQ-2.3.1**: THE System SHALL provide a bet placement form with amount input and validation.

- **Acceptance Criteria**:
  - Input field accepts numeric values only
  - Minimum bet: R$ 1.00 (100 centavos)
  - Maximum bet: R$ 1.000,00 (100000 centavos)
  - Input shows error if amount is outside range
  - Input shows error if amount exceeds wallet balance

**REQ-2.3.2**: THE System SHALL provide quick bet buttons for common amounts (1x, 2x, 5x last bet, custom amounts).

- **Acceptance Criteria**:
  - Quick buttons show: "1x", "2x", "5x", "Max"
  - "1x" button repeats last bet amount
  - "2x" button doubles last bet amount
  - "5x" button multiplies last bet by 5
  - "Max" button sets bet to maximum allowed
  - Buttons are disabled if wallet balance is insufficient

**REQ-2.3.3**: WHEN a player clicks "Place Bet", THE System SHALL send a POST request to /games/bet endpoint and show confirmation.

- **Acceptance Criteria**:
  - Bet button is disabled during BETTING phase only
  - Clicking "Place Bet" sends POST /games/bet with amount
  - Success response shows "Bet placed: R$ X.XX"
  - Error response shows specific error message (insufficient balance, betting phase closed, etc.)
  - Bet confirmation shows bet ID and amount

**REQ-2.3.4**: IF a player attempts to place a bet with insufficient balance, THE System SHALL display an error message and prevent the bet.

- **Acceptance Criteria**:
  - Error message: "Insufficient balance. You have R$ X.XX, but need R$ Y.YY"
  - Bet is not placed
  - Wallet balance is not modified
  - Error message disappears after 5 seconds or when user dismisses it

**REQ-2.3.5**: THE System SHALL display the player's current bet status (amount, potential payout at current multiplier).

- **Acceptance Criteria**:
  - Shows "Bet: R$ X.XX" in bet status area
  - Shows "Potential payout: R$ Y.YY" (calculated as bet * current multiplier)
  - Potential payout updates in real-time as multiplier increases
  - Status is cleared when round crashes or player cashes out

### 2.4 Cash Out Functionality

**REQ-2.4.1**: WHEN a round is in RUNNING phase and player has an active bet, THE System SHALL display a prominent "CASH OUT" button.

- **Acceptance Criteria**:
  - Button is large and easy to click (minimum 60px height)
  - Button is bright green or contrasting color
  - Button shows current payout amount (e.g., "CASH OUT: R$ 123.45")
  - Button is disabled during BETTING phase
  - Button is disabled if player has no active bet

**REQ-2.4.2**: WHEN a player clicks "CASH OUT", THE System SHALL send a POST request to /games/bet/cashout endpoint.

- **Acceptance Criteria**:
  - Clicking button sends POST /games/bet/cashout
  - Button is disabled immediately after click (prevent double-click)
  - Success response shows "Cashed out at X.XXx for R$ Y.YY"
  - Error response shows specific error message
  - Wallet balance updates immediately

**REQ-2.4.3**: IF a player does not cash out before the round crashes, THE System SHALL display "Bet Lost" message.

- **Acceptance Criteria**:
  - Message appears in red when round crashes
  - Message shows "Bet Lost at X.XXx"
  - Wallet balance is not modified (bet was already deducted)
  - Message disappears after 3 seconds or when user dismisses it

**REQ-2.4.4**: THE System SHALL display a history of the player's recent cash outs with multiplier and payout amount.

- **Acceptance Criteria**:
  - Shows last 10 cash outs
  - Each entry shows: multiplier, payout amount, timestamp
  - Shows win/loss indicator (green for win, red for loss)
  - List is scrollable and updates in real-time

### 2.5 Real-time Updates via WebSocket

**REQ-2.5.1**: THE System SHALL establish a WebSocket connection to receive real-time multiplier updates.

- **Acceptance Criteria**:
  - WebSocket connection is established on page load
  - Connection is to /games/ws endpoint
  - Connection includes JWT token in headers
  - Connection is automatically reconnected if dropped
  - Reconnection attempts use exponential backoff (1s, 2s, 4s, 8s, max 30s)

**REQ-2.5.2**: WHEN a multiplier update is received via WebSocket, THE System SHALL update the display immediately.

- **Acceptance Criteria**:
  - Multiplier updates at least 60 times per second
  - Updates are smooth with no visible jitter
  - Potential payout is recalculated in real-time
  - Display remains responsive during updates

**REQ-2.5.3**: WHEN a round state changes (BETTING → RUNNING → CRASHED), THE System SHALL update the UI accordingly.

- **Acceptance Criteria**:
  - Bet placement form is disabled during RUNNING phase
  - Cash out button appears during RUNNING phase
  - Crash animation plays when round crashes
  - UI resets for next round after crash

**REQ-2.5.4**: WHEN a player's wallet balance changes (bet placed, cashed out, deposit), THE System SHALL update the balance display immediately.

- **Acceptance Criteria**:
  - Balance updates without page refresh
  - Update is animated (e.g., color flash or number animation)
  - Update is reflected in header and profile page

### 2.6 Game History & Statistics

**REQ-2.6.1**: THE System SHALL display a detailed history of the player's recent bets with results.

- **Acceptance Criteria**:
  - Shows last 50 bets
  - Each bet shows: round ID, bet amount, multiplier cashed out at (or crash point if lost), payout, timestamp
  - Shows win/loss indicator (green for win, red for loss)
  - List is paginated or infinite-scrollable
  - Clicking a bet shows detailed information

**REQ-2.6.2**: THE System SHALL display player statistics (total bets, total wagered, total won, win rate, average multiplier).

- **Acceptance Criteria**:
  - Statistics are displayed on profile page
  - Shows: total bets placed, total amount wagered, total amount won, win rate (%), average multiplier
  - Statistics are fetched from backend API
  - Statistics update in real-time as new bets are placed

**REQ-2.6.3**: THE System SHALL provide a "Provably Fair" verification page where players can verify round fairness.

- **Acceptance Criteria**:
  - Page accessible from main menu
  - Shows round ID input field
  - Allows player to enter server seed hash and client seed
  - Displays verification result (verified or not verified)
  - Shows crash point calculation details

### 2.7 Responsive Design

**REQ-2.7.1**: THE System SHALL be fully responsive and work on mobile devices (320px width and up).

- **Acceptance Criteria**:
  - Layout adapts to screen size
  - Touch targets are minimum 44px x 44px
  - Text is readable without zooming
  - No horizontal scrolling on mobile
  - Multiplier display is visible and readable on small screens

**REQ-2.7.2**: THE System SHALL be optimized for tablet devices (768px width and up).

- **Acceptance Criteria**:
  - Layout uses tablet-optimized spacing
  - Game area is centered with appropriate margins
  - Sidebar or additional information is visible on tablet

**REQ-2.7.3**: THE System SHALL be optimized for desktop devices (1024px width and up).

- **Acceptance Criteria**:
  - Layout uses full width efficiently
  - Sidebar with game history and statistics is visible
  - Multiple columns for information display

**REQ-2.7.4**: THE System SHALL support dark and light themes.

- **Acceptance Criteria**:
  - Theme toggle button in header
  - Theme preference is saved in localStorage
  - Dark theme uses dark background with light text
  - Light theme uses light background with dark text
  - All colors meet WCAG AA contrast requirements

### 2.8 User Experience & Notifications

**REQ-2.8.1**: THE System SHALL display loading states for all async operations.

- **Acceptance Criteria**:
  - Loading spinner appears while fetching data
  - Buttons show loading state while request is in progress
  - Loading state lasts maximum 5 seconds (timeout)
  - Error message appears if request fails

**REQ-2.8.2**: THE System SHALL display error messages for all error scenarios.

- **Acceptance Criteria**:
  - Error messages are clear and actionable
  - Error messages appear in red or error color
  - Error messages include retry button if applicable
  - Error messages disappear after 5 seconds or when user dismisses

**REQ-2.8.3**: THE System SHALL display success notifications for important actions (bet placed, cashed out, deposit).

- **Acceptance Criteria**:
  - Success messages appear in green or success color
  - Success messages show action details (e.g., "Bet placed: R$ 100.00")
  - Success messages disappear after 3 seconds or when user dismisses
  - Multiple notifications can be displayed simultaneously

**REQ-2.8.4**: THE System SHALL provide smooth animations and transitions throughout the UI.

- **Acceptance Criteria**:
  - Page transitions are smooth (300-500ms)
  - Button clicks have visual feedback (hover, active states)
  - Multiplier updates are smooth (no jitter)
  - Crash animation is visually appealing (1-2 seconds)

**REQ-2.8.5**: THE System SHALL provide optional sound effects for important events (bet placed, cashed out, crash).

- **Acceptance Criteria**:
  - Sound effects can be toggled on/off
  - Sound preference is saved in localStorage
  - Sounds are short (< 1 second) and non-intrusive
  - Sounds work on all browsers and devices

---

## 3. Non-Functional Requirements

### 3.1 Performance

**REQ-3.1.1**: THE System SHALL load the main page in less than 2 seconds on 4G connection.

- **Acceptance Criteria**:
  - First Contentful Paint (FCP) < 1.5s
  - Largest Contentful Paint (LCP) < 2.5s
  - Cumulative Layout Shift (CLS) < 0.1
  - Time to Interactive (TTI) < 3s

**REQ-3.1.2**: THE System SHALL maintain 60 FPS during multiplier updates.

- **Acceptance Criteria**:
  - No frame drops during multiplier animation
  - CPU usage < 20% during normal operation
  - Memory usage < 100MB on desktop, < 50MB on mobile

**REQ-3.1.3**: THE System SHALL cache static assets (CSS, JS, images) for 1 year.

- **Acceptance Criteria**:
  - Cache-Control headers set to max-age=31536000
  - Assets are versioned (hash in filename)
  - Service Worker caches critical assets

### 3.2 Security

**REQ-3.2.1**: THE System SHALL store JWT tokens securely in httpOnly cookies.

- **Acceptance Criteria**:
  - Tokens are not stored in localStorage
  - Cookies have Secure flag (HTTPS only)
  - Cookies have SameSite=Strict flag
  - Tokens are automatically refreshed before expiration

**REQ-3.2.2**: THE System SHALL validate all user input to prevent XSS attacks.

- **Acceptance Criteria**:
  - All user input is sanitized
  - HTML entities are escaped
  - No eval() or innerHTML used with user input
  - Content Security Policy (CSP) headers are set

**REQ-3.2.3**: THE System SHALL use HTTPS for all communication.

- **Acceptance Criteria**:
  - All API calls use HTTPS
  - WebSocket connection uses WSS (secure WebSocket)
  - HSTS header is set

**REQ-3.2.4**: THE System SHALL implement rate limiting on client side to prevent abuse.

- **Acceptance Criteria**:
  - Bet placement is rate-limited to 1 request per second
  - API calls are rate-limited to prevent spam
  - Rate limit errors are displayed to user

### 3.3 Accessibility

**REQ-3.3.1**: THE System SHALL meet WCAG 2.1 AA accessibility standards.

- **Acceptance Criteria**:
  - All images have alt text
  - All form inputs have labels
  - Color is not the only way to convey information
  - Contrast ratio is at least 4.5:1 for text

**REQ-3.3.2**: THE System SHALL be keyboard navigable.

- **Acceptance Criteria**:
  - All interactive elements are reachable via Tab key
  - Focus indicator is visible
  - Keyboard shortcuts are documented
  - No keyboard traps

**REQ-3.3.3**: THE System SHALL support screen readers.

- **Acceptance Criteria**:
  - ARIA labels are used appropriately
  - Semantic HTML is used
  - Screen reader testing is performed
  - Live regions are used for dynamic content

### 3.4 Reliability

**REQ-3.4.1**: THE System SHALL handle network disconnections gracefully.

- **Acceptance Criteria**:
  - WebSocket reconnection is automatic
  - Offline message is displayed if connection is lost
  - Data is not lost during reconnection
  - User is notified when connection is restored

**REQ-3.4.2**: THE System SHALL handle API errors gracefully.

- **Acceptance Criteria**:
  - All API errors are caught and displayed
  - Retry logic is implemented for transient errors
  - User is not left in an inconsistent state
  - Error logging is sent to monitoring service

**REQ-3.4.3**: THE System SHALL have 99.9% uptime.

- **Acceptance Criteria**:
  - Service is monitored 24/7
  - Alerts are triggered for downtime
  - Incident response time is < 15 minutes

### 3.5 Compatibility

**REQ-3.5.1**: THE System SHALL support all modern browsers (Chrome, Firefox, Safari, Edge).

- **Acceptance Criteria**:
  - Chrome 90+
  - Firefox 88+
  - Safari 14+
  - Edge 90+

**REQ-3.5.2**: THE System SHALL support iOS 12+ and Android 8+.

- **Acceptance Criteria**:
  - App works on iOS Safari 12+
  - App works on Android Chrome 8+
  - Touch events work correctly
  - Orientation changes are handled

---

## 4. User Stories

### 4.1 Authentication & Account

**US-4.1.1**: As a new player, I want to log in with my Keycloak account so that I can access the game.

- **Acceptance Criteria**:
  - I can click "Login" button
  - I am redirected to Keycloak login page
  - After login, I am redirected back to the game
  - My balance is displayed

**US-4.1.2**: As a player, I want to see my wallet balance at all times so that I know how much I can bet.

- **Acceptance Criteria**:
  - Balance is displayed in header
  - Balance updates in real-time
  - Balance is formatted with currency symbol

### 4.2 Gameplay

**US-4.2.1**: As a player, I want to place a bet during the BETTING phase so that I can participate in the round.

- **Acceptance Criteria**:
  - I can enter a bet amount
  - I can click "Place Bet" button
  - My bet is confirmed
  - My balance is deducted

**US-4.2.2**: As a player, I want to cash out my bet at any time during the RUNNING phase so that I can secure my winnings.

- **Acceptance Criteria**:
  - I can see the "CASH OUT" button
  - I can click it to cash out
  - My payout is calculated correctly
  - My balance is updated

**US-4.2.3**: As a player, I want to see the multiplier increase in real-time so that I can decide when to cash out.

- **Acceptance Criteria**:
  - Multiplier is displayed prominently
  - Multiplier updates smoothly
  - Multiplier is easy to read

### 4.3 History & Statistics

**US-4.3.1**: As a player, I want to see my bet history so that I can review my past bets.

- **Acceptance Criteria**:
  - I can view my recent bets
  - Each bet shows amount, multiplier, payout
  - I can see win/loss indicator

**US-4.3.2**: As a player, I want to see my statistics so that I can track my performance.

- **Acceptance Criteria**:
  - I can view my total bets, total wagered, total won
  - I can see my win rate
  - I can see my average multiplier

---

## 5. API Integration Points

### 5.1 Game Service Endpoints

- `POST /games/bet` - Place a bet
- `POST /games/bet/cashout` - Cash out a bet
- `GET /games/rounds/current` - Get current round
- `GET /games/rounds/history` - Get round history
- `GET /games/bets/me` - Get player's bet history
- `GET /games/rounds/:roundId/verify` - Verify round fairness
- `GET /games/health` - Health check
- `WS /games/ws` - WebSocket for real-time updates

### 5.2 Wallet Service Endpoints

- `POST /wallets` - Create wallet
- `GET /wallets/me` - Get wallet balance
- `GET /health` - Health check

### 5.3 Authentication

- Keycloak OAuth2 endpoint for login
- JWT token in Authorization header for API calls

---

## 6. Technical Constraints

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: React Context API or Zustand
- **HTTP Client**: Axios or Fetch API
- **WebSocket**: Native WebSocket API
- **Testing**: Vitest + React Testing Library
- **Deployment**: Vercel or Netlify
- **Node Version**: 18+
- **Package Manager**: npm or yarn

---

## 7. Acceptance Criteria Summary

All requirements must meet the following criteria:

1. **Clarity**: Requirements are written in clear, unambiguous language
2. **Testability**: Requirements can be verified through automated or manual testing
3. **Completeness**: All aspects of the feature are covered
4. **Positive Statements**: Requirements state what the system SHALL do, not what it SHALL NOT do
5. **Traceability**: Each requirement is traceable to user stories and design documents

---

## 8. Success Metrics

- **User Engagement**: 80%+ of users return within 7 days
- **Performance**: Page load time < 2 seconds, 60 FPS during gameplay
- **Reliability**: 99.9% uptime, < 0.1% error rate
- **Accessibility**: WCAG 2.1 AA compliance, 100% keyboard navigable
- **Security**: Zero security vulnerabilities, 100% HTTPS
- **User Satisfaction**: 4.5+ star rating on app stores
