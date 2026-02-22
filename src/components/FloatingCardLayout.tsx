/**
 * FloatingCardLayout - 3D floating card effect inspired by Spotify visualizer
 * 
 * Creates a dynamic, three-dimensional floating layout for cards with:
 * - Subtle 3D transforms and depth
 * - Gentle floating animations
 * - Mouse parallax effects
 * - Smooth transitions
 */

import React, { useEffect, useRef, useState } from "react";

interface FloatingCardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

interface CardPosition {
  x: number;
  y: number;
  z: number;
  rotation: number;
  scale: number;
  animationDelay: number;
  animationDuration: number;
}

export const FloatingCardLayout: React.FC<FloatingCardLayoutProps> = ({
  children,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Track mouse movement for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Normalize to -1 to 1 range
      const x = (e.clientX - centerX) / (rect.width / 2);
      const y = (e.clientY - centerY) / (rect.height / 2);
      
      setMousePosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Generate positions for each card
  const childrenArray = React.Children.toArray(children);
  
  // Create grid-based positions with controlled randomness for a balanced layout
  const cardPositions: CardPosition[] = childrenArray.map((_, index) => {
    const totalCards = childrenArray.length;
    const cols = Math.ceil(Math.sqrt(totalCards * 1.5)); // Wider grid
    const rows = Math.ceil(totalCards / cols);
    
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    // Base grid position (0-1 range)
    const baseX = (col + 0.5) / cols;
    const baseY = (row + 0.5) / rows;
    
    // Add controlled randomness
    const seed = index * 17.3; // Pseudo-random but consistent
    const randomX = (Math.sin(seed) * 0.15); // ±15% offset
    const randomY = (Math.cos(seed * 1.3) * 0.15);
    
    return {
      x: Math.max(0.1, Math.min(0.9, baseX + randomX)), // Keep within bounds
      y: Math.max(0.1, Math.min(0.9, baseY + randomY)),
      z: Math.sin(seed * 2.1) * 100, // Depth variation
      rotation: Math.sin(seed * 3.7) * 5, // Slight rotation ±5deg
      scale: 0.95 + Math.sin(seed * 1.7) * 0.1, // Scale variation 0.85-1.05
      animationDelay: index * 0.08, // Staggered entrance
      animationDuration: 3 + Math.sin(seed) * 1, // 2-4s float duration
    };
  });

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        perspective: "1200px",
        perspectiveOrigin: "50% 50%",
      }}
    >
      {/* Ambient background particles */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => {
            const size = 2 + Math.random() * 4;
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const delay = Math.random() * 10;
            const duration = 20 + Math.random() * 20;
            
            return (
              <div
                key={i}
                className="absolute rounded-full bg-dark-300/20"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  animation: `ambientFloat ${duration}s ease-in-out ${delay}s infinite`,
                }}
              />
            );
          })}
        </div>
      )}

      <div className="relative w-full h-full">
        {childrenArray.map((child, index) => {
          const pos = cardPositions[index];
          
          // Calculate parallax offset based on depth
          const parallaxStrength = pos.z / 100; // Normalized depth
          const parallaxX = isHovering ? mousePosition.x * parallaxStrength * 30 : 0;
          const parallaxY = isHovering ? mousePosition.y * parallaxStrength * 30 : 0;
          
          return (
            <div
              key={index}
              className="absolute"
              style={{
                left: `${pos.x * 100}%`,
                top: `${pos.y * 100}%`,
                transformStyle: "preserve-3d",
                // Ensure cards don't overlap too much
                zIndex: Math.round(100 + pos.z),
              }}
            >
              <div
                className="floating-card"
                style={{
                  transform: `
                    translate(-50%, -50%)
                    translate3d(${parallaxX}px, ${parallaxY}px, ${prefersReducedMotion ? 0 : pos.z}px)
                    rotate(${prefersReducedMotion ? 0 : pos.rotation}deg)
                    scale(${prefersReducedMotion ? 1 : pos.scale})
                  `,
                  transformStyle: "preserve-3d",
                  transition: "transform 0.3s ease-out",
                  animation: prefersReducedMotion ? 'none' : `float ${pos.animationDuration}s ease-in-out ${pos.animationDelay}s infinite`,
                  willChange: "transform",
                }}
              >
                {child}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating animation keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg);
          }
          25% {
            transform: translate3d(5px, -10px, 10px) rotateX(1deg) rotateY(-1deg);
          }
          50% {
            transform: translate3d(-3px, -20px, 5px) rotateX(-0.5deg) rotateY(1deg);
          }
          75% {
            transform: translate3d(-5px, -10px, -5px) rotateX(0.5deg) rotateY(-0.5deg);
          }
        }
        
        @keyframes ambientFloat {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.3;
          }
          33% {
            transform: translate3d(100px, -50px, 0) scale(1.5);
            opacity: 0.5;
          }
          66% {
            transform: translate3d(-80px, 80px, 0) scale(0.8);
            opacity: 0.2;
          }
        }
        
        .floating-card {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          filter: drop-shadow(0 10px 40px rgba(0, 0, 0, 0.1)) drop-shadow(0 5px 15px rgba(0, 0, 0, 0.05));
        }
        
        .floating-card:hover {
          z-index: 1000 !important;
          transition: transform 0.2s ease-out, filter 0.3s ease, z-index 0s;
          filter: drop-shadow(0 20px 60px rgba(0, 0, 0, 0.15)) drop-shadow(0 10px 30px rgba(0, 0, 0, 0.1));
        }
      `}</style>
    </div>
  );
};

