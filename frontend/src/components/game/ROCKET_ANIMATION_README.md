# Rocket Animation Component

## Overview
The `RocketAnimation` component provides an engaging visual representation of the game's multiplier progression using an animated rocket that flies upward and explodes when the game crashes.

## Features

### 1. Animated Rocket
- **SVG-based rocket** with detailed design:
  - Blue body with red nose cone
  - Side fins for aerodynamic look
  - Window detail
  - Animated flame trail during flight
- **Wobble animation** for realistic flight effect
- **Position tracking** based on current multiplier

### 2. Graph Background
- **Canvas-based rendering** for smooth performance
- **Grid lines** for reference
- **Exponential curve** showing multiplier progression
- **Color gradient**:
  - Green (low multipliers)
  - Yellow (medium multipliers)
  - Red (high multipliers)
- **Filled area** under the curve for better visualization

### 3. Explosion Effect
- **20 particles** exploding in all directions
- **Multi-layered flash** effect:
  - Orange outer ring
  - Red middle ring
  - Yellow center
- **"💥 BOOM!" text** overlay
- **Smooth particle animations** with varying speeds

## Technical Implementation

### State Management
```typescript
const { roundState, currentMultiplier } = useGameStore();
const [rocketPosition, setRocketPosition] = useState(0);
const [isExploding, setIsExploding] = useState(false);
const [explosionParticles, setExplosionParticles] = useState([]);
```

### Position Calculation
The rocket's vertical position is calculated using a logarithmic scale:
```typescript
const maxMultiplier = 10; // Visual cap
const cappedMultiplier = Math.min(currentMultiplier, maxMultiplier);
const position = ((cappedMultiplier - 1) / (maxMultiplier - 1)) * 80; // 0-80%
```

### Canvas Rendering
The graph is drawn using HTML5 Canvas API with `requestAnimationFrame` for smooth 60fps rendering:
- Grid lines for reference
- Exponential curve based on current multiplier
- Gradient fill under the curve
- Automatic cleanup on unmount

### Explosion Particles
Particles are generated in a circular pattern:
```typescript
const particles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  angle: (Math.PI * 2 * i) / 20,
  speed: 2 + Math.random() * 3,
}));
```

## Usage

```tsx
import { RocketAnimation } from '@components/game/RocketAnimation';

function GameDisplay() {
  return (
    <div className="relative w-full h-full">
      <RocketAnimation />
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |

## Game States

### BETTING
- Rocket hidden
- Canvas cleared
- Position reset to 0

### RUNNING
- Rocket visible and flying upward
- Flame trail animated
- Position updates with multiplier
- Graph line extends
- Wobble animation active

### CRASHED
- Rocket disappears
- Explosion particles spawn
- Flash effects trigger
- "BOOM!" text displays
- Graph line turns red

## Performance Optimizations

1. **requestAnimationFrame**: Ensures smooth 60fps rendering
2. **Canvas caching**: Reuses canvas context
3. **Particle pooling**: Pre-generates particle data
4. **CSS animations**: Uses GPU acceleration
5. **Cleanup**: Properly cancels animation frames on unmount

## Customization

### Rocket Design
Modify the SVG in the component to change the rocket's appearance:
```tsx
<svg width="60" height="60" viewBox="0 0 60 60">
  {/* Customize paths here */}
</svg>
```

### Explosion Colors
Adjust particle colors in the explosion effect:
```tsx
background: `hsl(${Math.random() * 60}, 100%, 50%)`
```

### Animation Speed
The animation speed can be controlled via the `animationSpeed` setting in `uiStore`:
- `slow`: Longer animation durations
- `normal`: Default speed
- `fast`: Shorter animation durations

## Accessibility

- **Visual only**: Does not interfere with screen readers
- **Decorative**: Marked with `aria-hidden` where appropriate
- **Performance**: Optimized to not impact game responsiveness

## Browser Compatibility

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers
- ⚠️ Requires Canvas API support

## Related Components

- `MultiplierDisplay`: Parent component that uses RocketAnimation
- `CrashAnimation`: Alternative crash animation (text-based)
- `GameSimulator`: Testing component for animations

## Animation Keyframes

### Rocket Wobble
```css
@keyframes rocketWobble {
  0%, 100% { transform: rotate(-2deg); }
  50% { transform: rotate(2deg); }
}
```

### Explosion Particle
```css
@keyframes explosionParticle {
  0% { 
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% { 
    transform: translate(var(--particle-distance), 0) scale(0);
    opacity: 0;
  }
}
```

## Future Enhancements

1. **Multiple rocket designs**: Allow users to choose different vehicles (airplane, spaceship, etc.)
2. **Trail customization**: Different flame colors and effects
3. **Sound effects**: Rocket launch and explosion sounds
4. **Particle effects**: More elaborate explosion patterns
5. **Graph customization**: Different graph styles and colors
6. **Performance modes**: Low/medium/high quality settings

## Troubleshooting

### Rocket not visible
- Check that `roundState` is 'RUNNING' or 'CRASHED'
- Verify `currentMultiplier` is greater than 1.0
- Ensure parent container has defined dimensions

### Canvas not rendering
- Check browser console for Canvas API errors
- Verify canvas ref is properly attached
- Ensure component is mounted

### Poor performance
- Reduce particle count in explosion
- Lower canvas resolution
- Disable graph rendering
- Use CSS animations only

## Credits

Designed and implemented as part of the Crash Game frontend improvements to provide an engaging and visually appealing user experience.
