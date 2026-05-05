/**
 * RocketAnimation Component
 * Displays an animated rocket that flies up during the game and explodes on crash
 * Requirements: 2.2.1, 2.2.3 - Visual multiplier display with crash animation
 */

import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@store/gameStore';

interface RocketAnimationProps {
  className?: string;
}

export const RocketAnimation: React.FC<RocketAnimationProps> = ({ className = '' }) => {
  const { roundState, currentMultiplier } = useGameStore();
  const [rocketPosition, setRocketPosition] = useState(0);
  const [isExploding, setIsExploding] = useState(false);
  const [explosionParticles, setExplosionParticles] = useState<Array<{ id: number; angle: number; speed: number }>>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  // Generate explosion particles
  useEffect(() => {
    if (roundState === 'CRASHED') {
      setIsExploding(true);
      
      // Generate 20 particles in different directions
      const particles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        angle: (Math.PI * 2 * i) / 20,
        speed: 2 + Math.random() * 3,
      }));
      setExplosionParticles(particles);

      // Reset explosion after animation
      const timer = setTimeout(() => {
        setIsExploding(false);
        setExplosionParticles([]);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [roundState]);

  // Animate rocket position based on multiplier
  useEffect(() => {
    if (roundState === 'RUNNING') {
      // Validate currentMultiplier
      const validMultiplier = typeof currentMultiplier === 'number' && 
                              isFinite(currentMultiplier) && 
                              !isNaN(currentMultiplier) 
                              ? currentMultiplier 
                              : 1.0;
      
      // Map multiplier to vertical position (1.00x = 0%, higher = higher position)
      // Use logarithmic scale for better visual effect
      const maxMultiplier = 10; // Cap visual at 10x for reasonable display
      const cappedMultiplier = Math.min(validMultiplier, maxMultiplier);
      const position = ((cappedMultiplier - 1) / (maxMultiplier - 1)) * 80; // 0-80% of container
      setRocketPosition(Math.max(0, position)); // Ensure non-negative
    } else if (roundState === 'BETTING') {
      setRocketPosition(0);
      setIsExploding(false);
    }
  }, [currentMultiplier, roundState]);

  // Draw graph line on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawGraph = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (roundState === 'RUNNING' || roundState === 'CRASHED') {
        // Set canvas size to match display size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        // Draw grid
        ctx.strokeStyle = 'rgba(156, 163, 175, 0.2)';
        ctx.lineWidth = 1;

        // Vertical grid lines
        for (let i = 0; i <= 10; i++) {
          const x = (canvas.width / 10) * i;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }

        // Horizontal grid lines
        for (let i = 0; i <= 10; i++) {
          const y = (canvas.height / 10) * i;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        // Draw graph line
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        if (roundState === 'CRASHED') {
          gradient.addColorStop(0, '#ef4444'); // red-500
          gradient.addColorStop(1, '#dc2626'); // red-600
        } else {
          gradient.addColorStop(0, '#10b981'); // green-500
          gradient.addColorStop(0.5, '#f59e0b'); // yellow-500
          gradient.addColorStop(1, '#ef4444'); // red-500
        }

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw exponential curve
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);

        const points = 100;
        for (let i = 0; i <= points; i++) {
          const x = (canvas.width / points) * i;
          const progress = i / points;
          
          // Exponential curve based on current multiplier
          const maxHeight = canvas.height * (rocketPosition / 100);
          const y = canvas.height - (Math.pow(progress, 0.7) * maxHeight);
          
          ctx.lineTo(x, y);
        }

        ctx.stroke();

        // Fill area under curve with gradient
        const fillGradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        if (roundState === 'CRASHED') {
          fillGradient.addColorStop(0, 'rgba(239, 68, 68, 0.1)');
          fillGradient.addColorStop(1, 'rgba(220, 38, 38, 0.3)');
        } else {
          fillGradient.addColorStop(0, 'rgba(16, 185, 129, 0.1)');
          fillGradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.2)');
          fillGradient.addColorStop(1, 'rgba(239, 68, 68, 0.3)');
        }

        ctx.fillStyle = fillGradient;
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fill();
      }
    };

    drawGraph();
    animationFrameRef.current = requestAnimationFrame(drawGraph);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [roundState, rocketPosition]);

  return (
    <div className={`absolute inset-0 w-full h-full ${className}`}>
      {/* Canvas for graph */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: roundState === 'BETTING' ? 0 : 1 }}
      />

      {/* Rocket */}
      {(roundState === 'RUNNING' || roundState === 'CRASHED') && (
        <div
          className="absolute left-1/2 transform -translate-x-1/2 transition-all duration-100 ease-linear"
          style={{
            bottom: `${rocketPosition}%`,
            opacity: isExploding ? 0 : 1,
          }}
        >
          {/* Rocket SVG */}
          <svg
            width="60"
            height="60"
            viewBox="0 0 60 60"
            className={`${roundState === 'RUNNING' ? 'animate-rocket-wobble' : ''}`}
          >
            {/* Flame trail */}
            {roundState === 'RUNNING' && (
              <g className="animate-pulse">
                <ellipse cx="30" cy="50" rx="8" ry="12" fill="#f59e0b" opacity="0.6" />
                <ellipse cx="30" cy="52" rx="6" ry="8" fill="#ef4444" opacity="0.8" />
                <ellipse cx="30" cy="54" rx="4" ry="6" fill="#fbbf24" opacity="0.9" />
              </g>
            )}
            
            {/* Rocket body */}
            <path
              d="M 30 10 L 35 30 L 35 40 L 30 45 L 25 40 L 25 30 Z"
              fill="#3b82f6"
              stroke="#1e40af"
              strokeWidth="1"
            />
            
            {/* Rocket nose cone */}
            <path
              d="M 30 5 L 35 15 L 25 15 Z"
              fill="#ef4444"
              stroke="#dc2626"
              strokeWidth="1"
            />
            
            {/* Rocket fins */}
            <path d="M 25 35 L 20 45 L 25 40 Z" fill="#1e40af" />
            <path d="M 35 35 L 40 45 L 35 40 Z" fill="#1e40af" />
            
            {/* Window */}
            <circle cx="30" cy="22" r="4" fill="#60a5fa" stroke="#1e40af" strokeWidth="1" />
            
            {/* Details */}
            <line x1="30" y1="30" x2="30" y2="38" stroke="#1e40af" strokeWidth="1" />
          </svg>
        </div>
      )}

      {/* Explosion particles */}
      {isExploding && (
        <div
          className="absolute left-1/2 transform -translate-x-1/2"
          style={{ bottom: `${rocketPosition}%` }}
        >
          {explosionParticles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-3 h-3 rounded-full animate-explosion-particle"
              style={{
                background: `hsl(${Math.random() * 60}, 100%, 50%)`,
                transform: `rotate(${particle.angle}rad) translateX(0)`,
                animation: `explosion-particle 1s ease-out forwards`,
                animationDelay: `${Math.random() * 0.2}s`,
                '--particle-distance': `${particle.speed * 30}px`,
              } as React.CSSProperties}
            />
          ))}
          
          {/* Central explosion flash */}
          <div className="absolute w-20 h-20 -left-10 -top-10 rounded-full bg-orange-500 animate-ping" />
          <div className="absolute w-16 h-16 -left-8 -top-8 rounded-full bg-red-500 animate-pulse" />
          <div className="absolute w-12 h-12 -left-6 -top-6 rounded-full bg-yellow-400 animate-ping" />
        </div>
      )}

      {/* Explosion text */}
      {isExploding && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-6xl font-bold text-red-600 animate-bounce-in drop-shadow-lg">
            💥 BOOM!
          </div>
        </div>
      )}
    </div>
  );
};

export default RocketAnimation;
