import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  isActive: boolean;
  mode: 'listening' | 'speaking' | 'idle';
}

export const Visualizer: React.FC<VisualizerProps> = ({ isActive, mode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);
  const prevModeRef = useRef<typeof mode>(mode);
  const transitionProgress = useRef(1); // 0 = old mode, 1 = new mode

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Enable anti-aliasing for smooth dots
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Set canvas to match container dimensions
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    const animate = () => {
      timeRef.current += 0.016; // ~60fps

      // Handle mode transitions
      if (prevModeRef.current !== mode) {
        transitionProgress.current = 0;
        prevModeRef.current = mode;
      }

      // Smooth transition between modes (easing) - ~500ms transition
      if (transitionProgress.current < 1) {
        transitionProgress.current = Math.min(1, transitionProgress.current + 0.033);
      }

      // Easing function for smooth transitions
      const ease = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const t = ease(transitionProgress.current);

      // Get canvas dimensions
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      if (!isActive) {
        // Draw subtle pulsing center dot when idle
        const pulse = Math.sin(timeRef.current * 1.5) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(120, 113, 108, ${0.3 * pulse})`; // dark-500
        ctx.beginPath();
        ctx.arc(centerX, centerY, 3 * pulse, 0, Math.PI * 2);
        ctx.fill();
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Draw radial halftone dots
      const rings = 10;
      const maxRadius = Math.min(width, height) * 0.45;

      for (let ring = 0; ring < rings; ring++) {
        const radius = (ring / rings) * maxRadius;
        const dotsInRing = Math.max(6, Math.floor(ring * 4));

        for (let i = 0; i < dotsInRing; i++) {
          const angle = (i / dotsInRing) * Math.PI * 2;

          // Position
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;

          // Base dot size with radial falloff (halftone effect)
          const normalizedRadius = radius / maxRadius;
          let dotSize = 1.5 + (1 - normalizedRadius) * 2; // 3.5px center to 1.5px edge

          // Calculate animation multipliers for each mode
          const getModeMultiplier = () => {
            switch (mode) {
              case 'listening':
                const wave = Math.sin(timeRef.current * 1.2 - normalizedRadius * 3) * 0.4 + 0.8;
                return wave * 1.2;

              case 'speaking':
                const wave2 = Math.sin(timeRef.current * 3 - normalizedRadius * 12) * 0.5 + 0.5;
                return 0.7 + wave2 * 1.3;

              case 'idle':
              default:
                const pulse = Math.sin(timeRef.current * 1.5) * 0.1 + 0.9;
                return pulse;
            }
          };

          // Apply animation
          dotSize *= getModeMultiplier();

          // Draw dot with radial fade (opacity decreases toward edges)
          const opacity = 1 - (normalizedRadius * 0.7); // Fade from 1.0 to 0.3

          // Color based on mode
          let color: string;
          if (mode === 'listening') {
            color = `rgba(26, 26, 26, ${opacity})`; // #1A1A1A - dark charcoal
          } else if (mode === 'speaking') {
            color = `rgba(87, 83, 78, ${opacity})`; // #57534E - dark-600
          } else {
            color = `rgba(120, 113, 108, ${opacity * 0.5})`; // dark-500 faded
          }

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', updateSize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, mode]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  );
};
