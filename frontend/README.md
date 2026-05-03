# Crash Game Frontend

A real-time, interactive web application for the Crash Game built with React 18, TypeScript, Vite, and TailwindCSS.

## Features

- 🎮 Real-time multiplier display with 60 FPS updates
- 💰 Bet placement and cash-out functionality
- 🔐 Secure authentication with Keycloak OAuth2
- 📊 Player statistics and bet history
- 🎨 Dark/Light theme support
- 📱 Fully responsive design (mobile, tablet, desktop)
- ♿ WCAG 2.1 AA accessibility compliance
- 🚀 Production-optimized build with code splitting

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Testing**: Vitest + React Testing Library
- **Real-time**: WebSocket
- **Security**: DOMPurify for input sanitization

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create environment files:

```bash
cp .env.example .env.development
cp .env.example .env.production
```

3. Update environment variables in `.env.development` with your local API URLs

### Development

Start the development server:

```bash
npm run dev
```

The application will open at `http://localhost:5173`

### Building

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # React components
│   ├── layout/         # Layout components (Header, Sidebar, Footer)
│   ├── game/           # Game-specific components
│   └── common/         # Reusable UI components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── services/           # API and external services
├── store/              # Zustand stores (state management)
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── styles/             # Global styles and theme
└── tests/              # Test setup and utilities
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Generate coverage report

## Environment Variables

See `.env.example` for all available environment variables.

### Development

```
VITE_API_URL=http://localhost:4001
VITE_WALLET_API_URL=http://localhost:3001
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:4001/games/ws
```

### Production

```
VITE_API_URL=https://api.crash-game.com
VITE_WALLET_API_URL=https://wallet-api.crash-game.com
VITE_KEYCLOAK_URL=https://auth.crash-game.com
VITE_WS_URL=wss://api.crash-game.com/games/ws
```

## API Integration

The frontend integrates with two main services:

### Game Service (port 4001)

- `POST /games/bet` - Place a bet
- `POST /games/bet/cashout` - Cash out a bet
- `GET /games/rounds/current` - Get current round
- `GET /games/rounds/history` - Get round history
- `GET /games/bets/me` - Get player's bet history
- `GET /games/rounds/:roundId/verify` - Verify round fairness
- `WS /games/ws` - WebSocket for real-time updates

### Wallet Service (port 3001)

- `POST /wallets` - Create wallet
- `GET /wallets/me` - Get wallet balance

## Authentication

The application uses Keycloak for OAuth2 authentication. Users are redirected to the Keycloak login page and authenticated tokens are stored securely in httpOnly cookies.

## Performance

- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Frame Rate**: 60 FPS during multiplier updates
- **Bundle Size**: Optimized with code splitting

## Accessibility

The application meets WCAG 2.1 AA accessibility standards:

- ✅ Keyboard navigation support
- ✅ Screen reader compatibility
- ✅ Color contrast ratio ≥ 4.5:1
- ✅ Semantic HTML
- ✅ ARIA labels for dynamic content

## Testing

### Unit Tests

```bash
npm run test
```

### Test Coverage

```bash
npm run test:coverage
```

### Test UI

```bash
npm run test:ui
```

## Deployment

### Vercel

1. Connect your Git repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Netlify

1. Connect your Git repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Set environment variables in Netlify dashboard

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Mobile Support

- iOS 12+
- Android 8+

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm run test`
4. Run linter: `npm run lint`
5. Submit a pull request

## License

Proprietary - All rights reserved

## Support

For issues and questions, please contact the development team.
