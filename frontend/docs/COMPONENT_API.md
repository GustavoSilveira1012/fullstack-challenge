# Component API Documentation

This document provides comprehensive API documentation for all React components in the Crash Game Frontend application.

## 📋 Overview

The component library is organized into three main categories:
- **Common Components**: Reusable UI components
- **Game Components**: Game-specific functionality components
- **Layout Components**: Application layout and navigation components

All components are built with TypeScript, follow accessibility standards, and include comprehensive prop validation.

## 🧩 Common Components

### Button

A versatile button component with multiple variants, sizes, and states.

#### Props

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}
```

#### Usage

```tsx
import { Button } from '@/components/common';

// Basic usage
<Button onClick={handleClick}>Click me</Button>

// With variants and sizes
<Button variant="primary" size="lg">Primary Large</Button>
<Button variant="danger" size="sm">Delete</Button>

// With loading state
<Button loading disabled>Processing...</Button>

// With icon
<Button icon={<PlusIcon />} iconPosition="left">
  Add Item
</Button>

// Full width
<Button fullWidth variant="success">
  Submit Form
</Button>
```

#### Accessibility

- Supports keyboard navigation (Enter, Space)
- Proper ARIA attributes for screen readers
- Focus management and visible focus indicators
- Loading state announced to screen readers

---

### Input

A flexible input component with validation, error handling, and multiple types.

#### Props

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  variant?: 'outlined' | 'filled';
}
```

#### Usage

```tsx
import { Input } from '@/components/common';

// Basic usage
<Input 
  label="Email" 
  type="email" 
  placeholder="Enter your email"
  required
/>

// With error state
<Input 
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
  value={password}
  onChange={handlePasswordChange}
/>

// With icons
<Input 
  label="Search"
  startIcon={<SearchIcon />}
  placeholder="Search games..."
/>

// Number input with validation
<Input 
  label="Bet Amount"
  type="number"
  min={1}
  max={1000}
  step={0.01}
  helperText="Minimum bet: R$ 1.00"
/>
```

#### Accessibility

- Proper label association with `htmlFor` and `id`
- Error messages linked via `aria-describedby`
- Required fields marked with `aria-required`
- Invalid state indicated with `aria-invalid`

---

### Card

A container component for grouping related content with consistent styling.

#### Props

```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}
```

#### Usage

```tsx
import { Card } from '@/components/common';

// Basic card
<Card>
  <h3>Card Title</h3>
  <p>Card content goes here.</p>
</Card>

// Elevated card with custom padding
<Card variant="elevated" padding="lg">
  <div>Enhanced card content</div>
</Card>

// Outlined card
<Card variant="outlined" className="hover:shadow-lg">
  Interactive card content
</Card>
```

---

### Modal

An accessible modal dialog component with backdrop, animations, and focus management.

#### Props

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  children: React.ReactNode;
}
```

#### Usage

```tsx
import { Modal } from '@/components/common';

const [isOpen, setIsOpen] = useState(false);

<Modal 
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  size="md"
>
  <p>Are you sure you want to proceed?</p>
  <div className="flex gap-2 mt-4">
    <Button onClick={() => setIsOpen(false)}>Cancel</Button>
    <Button variant="danger" onClick={handleConfirm}>Confirm</Button>
  </div>
</Modal>
```

#### Accessibility

- Focus trap within modal content
- Focus restoration when closed
- ESC key to close (configurable)
- Backdrop click to close (configurable)
- Proper ARIA attributes (`role="dialog"`, `aria-modal="true"`)

---

### Badge

A small component for displaying status, counts, or labels.

#### Props

```typescript
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}
```

#### Usage

```tsx
import { Badge } from '@/components/common';

// Status badges
<Badge variant="success">Active</Badge>
<Badge variant="danger">Crashed</Badge>
<Badge variant="warning">Pending</Badge>

// Count badge
<Badge variant="primary" size="sm">5</Badge>

// Custom styling
<Badge className="animate-pulse">Live</Badge>
```

---

### Loading

A loading spinner component with customizable size and message.

#### Props

```typescript
interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  overlay?: boolean;
  className?: string;
}
```

#### Usage

```tsx
import { Loading } from '@/components/common';

// Basic spinner
<Loading />

// With message
<Loading message="Loading game data..." />

// Full screen overlay
<Loading overlay message="Connecting to server..." />

// Custom size
<Loading size="lg" />
```

---

## 🎮 Game Components

### MultiplierDisplay

Displays the current game multiplier with real-time updates and visual effects.

#### Props

```typescript
interface MultiplierDisplayProps {
  multiplier: number;
  isActive: boolean;
  crashed?: boolean;
  className?: string;
}
```

#### Usage

```tsx
import { MultiplierDisplay } from '@/components/game';

<MultiplierDisplay 
  multiplier={2.45}
  isActive={true}
  crashed={false}
/>
```

#### Features

- Real-time multiplier updates (60 FPS)
- Color coding based on multiplier value
- Crash animation when round ends
- Accessibility announcements for screen readers

---

### BetForm

A form component for placing bets with amount input and quick bet buttons.

#### Props

```typescript
interface BetFormProps {
  onPlaceBet: (amount: number) => void;
  balance: number;
  lastBetAmount?: number;
  disabled?: boolean;
  loading?: boolean;
  minBet?: number;
  maxBet?: number;
}
```

#### Usage

```tsx
import { BetForm } from '@/components/game';

<BetForm 
  onPlaceBet={handlePlaceBet}
  balance={1000}
  lastBetAmount={50}
  minBet={1}
  maxBet={1000}
  disabled={gameState === 'RUNNING'}
/>
```

#### Features

- Input validation (min/max amounts, balance check)
- Quick bet buttons (1x, 2x, 5x, Max)
- Real-time balance validation
- Error handling and user feedback

---

### CashOutButton

A prominent button for cashing out active bets with payout display.

#### Props

```typescript
interface CashOutButtonProps {
  onCashOut: () => void;
  potentialPayout: number;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}
```

#### Usage

```tsx
import { CashOutButton } from '@/components/game';

<CashOutButton 
  onCashOut={handleCashOut}
  potentialPayout={245.50}
  disabled={!hasActiveBet}
  loading={cashingOut}
/>
```

#### Features

- Large, accessible button design
- Real-time payout calculation display
- Loading states during cash out
- Keyboard navigation support

---

### GameHistory

Displays a list of recent game rounds with crash points and statistics.

#### Props

```typescript
interface GameHistoryProps {
  rounds: Round[];
  loading?: boolean;
  onRoundClick?: (round: Round) => void;
  maxItems?: number;
  className?: string;
}
```

#### Usage

```tsx
import { GameHistory } from '@/components/game';

<GameHistory 
  rounds={recentRounds}
  loading={loadingHistory}
  onRoundClick={handleRoundClick}
  maxItems={10}
/>
```

#### Features

- Scrollable list of recent rounds
- Click to view round details
- Loading states and empty states
- Real-time updates

---

### PlayerStats

Displays player statistics including total bets, winnings, and win rate.

#### Props

```typescript
interface PlayerStatsProps {
  stats: {
    totalBets: number;
    totalWagered: number;
    totalWon: number;
    winRate: number;
    averageMultiplier: number;
  };
  loading?: boolean;
  className?: string;
}
```

#### Usage

```tsx
import { PlayerStats } from '@/components/game';

<PlayerStats 
  stats={{
    totalBets: 150,
    totalWagered: 5000,
    totalWon: 4750,
    winRate: 0.65,
    averageMultiplier: 2.1
  }}
  loading={false}
/>
```

---

## 🏗️ Layout Components

### Header

The main application header with navigation, user info, and wallet balance.

#### Props

```typescript
interface HeaderProps {
  user?: {
    email: string;
    playerId: string;
  };
  balance?: number;
  onLogout?: () => void;
  onThemeToggle?: () => void;
  theme?: 'light' | 'dark';
}
```

#### Usage

```tsx
import { Header } from '@/components/layout';

<Header 
  user={{ email: 'user@example.com', playerId: '123' }}
  balance={1250.50}
  onLogout={handleLogout}
  onThemeToggle={handleThemeToggle}
  theme="dark"
/>
```

#### Features

- Responsive design (mobile menu)
- User authentication status
- Real-time balance display
- Theme toggle
- Accessibility navigation

---

### Sidebar

A collapsible sidebar for navigation and additional game information.

#### Props

```typescript
interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
  className?: string;
}
```

#### Usage

```tsx
import { Sidebar } from '@/components/layout';

<Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar}>
  <nav>
    <a href="/game">Game</a>
    <a href="/history">History</a>
    <a href="/profile">Profile</a>
  </nav>
</Sidebar>
```

---

### Footer

The application footer with links and information.

#### Props

```typescript
interface FooterProps {
  className?: string;
}
```

#### Usage

```tsx
import { Footer } from '@/components/layout';

<Footer />
```

---

## 🎨 Styling and Theming

### Theme System

All components support the application's theme system with CSS custom properties.

```css
/* Light theme */
:root {
  --color-primary: #3b82f6;
  --color-secondary: #10b981;
  --color-danger: #ef4444;
  --color-background: #ffffff;
  --color-text: #1f2937;
}

/* Dark theme */
.dark {
  --color-primary: #60a5fa;
  --color-secondary: #34d399;
  --color-danger: #f87171;
  --color-background: #1f2937;
  --color-text: #f9fafb;
}
```

### Responsive Design

Components use Tailwind CSS responsive utilities:

```tsx
// Example responsive component
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>
```

### Animation Classes

Common animation classes used across components:

```css
.animate-pulse-slow { animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
.animate-bounce-subtle { animation: bounce 2s infinite; }
.animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
.animate-slide-up { animation: slideUp 0.3s ease-out; }
```

## 🧪 Testing Components

### Unit Testing

Example component test:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/common';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Accessibility Testing

```tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '@/components/common';

expect.extend(toHaveNoViolations);

describe('Button Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<Button>Accessible Button</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## 📚 Best Practices

### Component Development

1. **TypeScript First**: Always define proper TypeScript interfaces
2. **Accessibility**: Include ARIA attributes and keyboard navigation
3. **Performance**: Use React.memo for expensive components
4. **Testing**: Write comprehensive unit and accessibility tests
5. **Documentation**: Document all props and usage examples

### Prop Naming Conventions

- Use descriptive names: `isLoading` instead of `loading`
- Boolean props: Prefix with `is`, `has`, `can`, `should`
- Event handlers: Prefix with `on` (e.g., `onClick`, `onSubmit`)
- Render props: Use `render` prefix (e.g., `renderItem`)

### Component Composition

```tsx
// Good: Composable components
<Card>
  <Card.Header>
    <Card.Title>Game Statistics</Card.Title>
  </Card.Header>
  <Card.Content>
    <PlayerStats stats={playerStats} />
  </Card.Content>
</Card>

// Avoid: Monolithic components with too many props
<GameCard 
  title="Game Statistics"
  showHeader={true}
  headerActions={[]}
  content={<PlayerStats />}
  // ... many more props
/>
```

## 🔧 Development Tools

### Storybook Integration

Components are documented in Storybook for interactive development:

```bash
# Start Storybook
npm run storybook

# Build Storybook
npm run build-storybook
```

### Component Generator

Use the component generator for consistent component structure:

```bash
# Generate new component
npm run generate:component ComponentName

# Generate with tests and stories
npm run generate:component ComponentName --with-tests --with-stories
```

---

**Last Updated**: December 2024  
**Maintainer**: Crash Game Development Team