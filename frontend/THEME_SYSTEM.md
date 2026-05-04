# Theme System Documentation

## Overview

The Crash Game Frontend implements a comprehensive theme system that provides:

- **WCAG AA Compliant Colors**: All color combinations meet accessibility standards
- **Dark/Light Mode Support**: Seamless switching between themes
- **Persistent Preferences**: Theme choices saved in localStorage
- **System Theme Detection**: Automatic detection of user's system preference
- **Cross-Tab Synchronization**: Theme changes sync across browser tabs
- **Developer Tools**: Utilities for validating theme usage

## Architecture

### Core Components

1. **ThemeProvider** - Manages theme state and system integration
2. **useTheme** - Hook for theme switching functionality
3. **useThemeUtils** - Advanced theme utilities and helpers
4. **Theme Configuration** - Centralized color and style definitions
5. **Color Contrast Utilities** - WCAG compliance validation
6. **Theme Validator** - Development tools for theme validation

### File Structure

```
src/
├── components/
│   └── providers/
│       └── ThemeProvider.tsx          # Main theme provider
├── hooks/
│   ├── useTheme.ts                    # Basic theme hook
│   └── useThemeUtils.ts               # Advanced theme utilities
├── config/
│   └── theme.ts                       # Theme configuration
├── utils/
│   ├── colorContrast.ts               # WCAG compliance utilities
│   └── themeValidator.ts              # Development validation tools
└── styles/
    ├── globals.css                    # Global styles with theme support
    └── theme.css                      # Theme-specific CSS variables
```

## Usage

### Basic Theme Switching

```tsx
import { useUIStore } from '@store/uiStore';

function ThemeToggleButton() {
  const { theme, setTheme } = useUIStore();
  
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
  
  return (
    <button onClick={toggleTheme}>
      Switch to {theme === 'light' ? 'dark' : 'light'} mode
    </button>
  );
}
```

### Using Theme Colors

```tsx
import { useThemeUtils } from '@hooks/useThemeUtils';

function MyComponent() {
  const { colors, getMultiplierClass, isDark } = useThemeUtils();
  
  return (
    <div 
      style={{ 
        backgroundColor: colors.bg.primary,
        color: colors.text.primary 
      }}
    >
      <span className={getMultiplierClass(5.5)}>
        5.50x
      </span>
    </div>
  );
}
```

### CSS Custom Properties

```css
.my-component {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.my-button {
  @apply btn-theme-primary;
}
```

### Tailwind Utility Classes

```tsx
function MyCard() {
  return (
    <div className="bg-theme-primary text-theme-primary border-theme rounded-lg shadow-theme-md">
      <h2 className="text-theme-secondary">Card Title</h2>
      <p className="text-theme-muted">Card content</p>
    </div>
  );
}
```

## Color System

### WCAG AA Compliance

All color combinations in the theme system meet WCAG AA standards (4.5:1 contrast ratio minimum):

- **Primary Text**: 21:1 contrast ratio on primary background
- **Secondary Text**: 7.25:1 contrast ratio on primary background
- **Muted Text**: 5.74:1 contrast ratio on primary background
- **Interactive Elements**: All buttons meet 4.5:1 minimum with white text

### Color Categories

#### Background Colors
- `bg.primary` - Main background color
- `bg.secondary` - Secondary background (cards, panels)
- `bg.tertiary` - Tertiary background (subtle sections)
- `bg.elevated` - Elevated surfaces with shadows

#### Text Colors
- `text.primary` - Primary text (headings, important content)
- `text.secondary` - Secondary text (descriptions, labels)
- `text.muted` - Muted text (hints, placeholders)
- `text.inverse` - Inverse text for dark backgrounds

#### Interactive Colors
- `interactive.primary` - Primary buttons and links
- `interactive.secondary` - Secondary buttons
- `interactive.danger` - Destructive actions
- `interactive.success` - Success actions
- `interactive.warning` - Warning actions

#### Game-Specific Colors
- `game.multiplierLow` - Low multipliers (1.00x - 2.00x)
- `game.multiplierMedium` - Medium multipliers (2.00x - 10.00x)
- `game.multiplierHigh` - High multipliers (10.00x+)
- `game.crash` - Crash indication
- `game.live` - Live round indicator

## Theme Features

### Automatic System Detection

The theme system automatically detects the user's system preference:

```typescript
// Detects system preference on first load
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const systemTheme = prefersDark ? 'dark' : 'light';
```

### Persistent Storage

Theme preferences are automatically saved to localStorage:

```typescript
// Automatically saves theme preference
setTheme('dark'); // Saves to localStorage

// Automatically loads on page refresh
const savedTheme = localStorage.getItem('theme');
```

### Cross-Tab Synchronization

Theme changes are synchronized across browser tabs:

```typescript
// Listens for storage events
window.addEventListener('storage', (e) => {
  if (e.key === 'theme' && e.newValue) {
    setTheme(e.newValue);
  }
});
```

### Mobile Browser Support

The theme system updates mobile browser UI colors:

```typescript
// Updates mobile browser theme color
const metaThemeColor = document.querySelector('meta[name="theme-color"]');
metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f172a' : '#ffffff');
```

## Development Tools

### Color Contrast Validation

```typescript
import { validateColorCombination } from '@utils/colorContrast';

const result = validateColorCombination('#000000', '#ffffff');
console.log(result); // { isValid: true, ratio: 21, recommendation: undefined }
```

### Theme Usage Validation

```typescript
import { validateThemeUsage } from '@utils/themeValidator';

const validation = validateThemeUsage(
  'light',
  '#0f172a', // text color
  '#ffffff', // background color
  'MyComponent'
);

console.log(validation);
// {
//   isValid: true,
//   issues: [],
//   suggestions: []
// }
```

### Component Accessibility Check

```typescript
import { validateComponentAccessibility } from '@utils/themeValidator';

const accessibility = validateComponentAccessibility(
  'light',
  {
    text: '#0f172a',
    background: '#ffffff',
    border: '#e2e8f0',
    focus: '#3b82f6'
  },
  'Button'
);

console.log(accessibility);
// {
//   isAccessible: true,
//   issues: [],
//   recommendations: [],
//   score: 100
// }
```

## Animations and Transitions

### Theme Transitions

All theme changes include smooth transitions:

```css
*,
*::before,
*::after {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}
```

### Game-Specific Animations

```css
/* Multiplier glow effect */
.animate-multiplier-glow {
  animation: multiplierGlow 2s ease-in-out infinite;
}

/* Crash animation */
.animate-crash {
  animation: crash 1s ease-out;
}

/* Cash out pulse */
.animate-cash-out-pulse {
  animation: cashOutPulse 1s ease-in-out infinite;
}
```

## Accessibility Features

### High Contrast Mode Support

```css
@media (prefers-contrast: high) {
  :root {
    --color-border: #000000;
    --color-text-secondary: #000000;
  }
  
  .dark {
    --color-border: #ffffff;
    --color-text-secondary: #ffffff;
  }
}
```

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  * {
    transition-duration: 0ms !important;
    animation-duration: 0ms !important;
  }
}
```

### Focus Management

```css
:focus-visible {
  outline: 2px solid var(--color-interactive-primary);
  outline-offset: 2px;
}
```

## Best Practices

### 1. Always Use Theme Colors

```tsx
// ✅ Good - Uses theme colors
<div className="bg-theme-primary text-theme-primary">

// ❌ Bad - Hardcoded colors
<div className="bg-white text-black">
```

### 2. Validate Color Combinations

```tsx
// ✅ Good - Validate in development
if (process.env.NODE_ENV === 'development') {
  logThemeValidation('light', 'MyComponent', {
    text: '#0f172a',
    background: '#ffffff'
  });
}
```

### 3. Use Semantic Color Names

```tsx
// ✅ Good - Semantic naming
<button className="btn-theme-danger">Delete</button>

// ❌ Bad - Color-based naming
<button className="btn-red">Delete</button>
```

### 4. Test Both Themes

```tsx
// ✅ Good - Test both themes
describe('MyComponent', () => {
  it('should render correctly in light theme', () => {
    // Test light theme
  });
  
  it('should render correctly in dark theme', () => {
    // Test dark theme
  });
});
```

## Testing

### Unit Tests

```typescript
// Test theme color compliance
describe('Theme Colors', () => {
  it('should meet WCAG AA standards', () => {
    const results = validateThemeContrast();
    expect(results.light['primaryText/primaryBg']).toBe(true);
    expect(results.dark['primaryText/primaryBg']).toBe(true);
  });
});
```

### Integration Tests

```typescript
// Test theme switching
describe('Theme Integration', () => {
  it('should switch themes correctly', () => {
    const { result } = renderHook(() => useUIStore());
    
    act(() => {
      result.current.setTheme('dark');
    });
    
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
```

## Performance Considerations

### CSS Custom Properties

Using CSS custom properties allows for efficient theme switching without re-rendering components:

```css
/* Theme changes only update CSS variables */
:root {
  --color-bg-primary: #ffffff;
}

.dark {
  --color-bg-primary: #0f172a;
}
```

### Memoization

Theme utilities are memoized to prevent unnecessary recalculations:

```typescript
const getMultiplierColor = useMemo(() => {
  return (multiplier: number) => {
    // Calculation logic
  };
}, []);
```

## Browser Support

The theme system supports all modern browsers:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Fallbacks

For older browsers, the system provides graceful fallbacks:

```typescript
// Fallback for older browsers without addEventListener
if (mediaQuery.addEventListener) {
  mediaQuery.addEventListener('change', handler);
} else {
  mediaQuery.addListener(handler);
}
```

## Troubleshooting

### Common Issues

1. **Theme not persisting**: Check localStorage permissions
2. **Colors not updating**: Ensure ThemeProvider wraps your app
3. **Poor contrast**: Use theme validation utilities
4. **Flashing on load**: Add FOUC prevention styles

### Debug Mode

Enable debug logging in development:

```typescript
if (process.env.NODE_ENV === 'development') {
  logThemeValidation(theme, 'ComponentName', colors);
}
```

## Migration Guide

### From Hardcoded Colors

1. Replace hardcoded colors with theme colors
2. Use theme utility classes
3. Validate color combinations
4. Test both light and dark themes

### Adding New Colors

1. Add to theme configuration
2. Update CSS custom properties
3. Add validation tests
4. Document usage examples

## Contributing

When adding new theme features:

1. Ensure WCAG AA compliance
2. Add comprehensive tests
3. Update documentation
4. Validate across all themes
5. Test on multiple devices