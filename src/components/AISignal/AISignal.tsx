import { useEffect, useRef, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import "./AISignal.css";

export type AISignalState =
  | "idle"
  | "thinking"
  | "processing"
  | "streaming"
  | "success"
  | "error";

interface AISignalProps {
  state?: AISignalState;
  size?: number;
  className?: string;
  showOrbitCircles?: boolean;
}

interface OrbitCircle {
  id: string;
  orbitIndex: number;
  angle: number;
  size: number;
  delay: number;
}

// Generate random orbit circles with some controlled randomness
function generateOrbitCircles(state: AISignalState): OrbitCircle[] {
  const circles: OrbitCircle[] = [];

  if (state === "idle") {
    // Minimal - just 2-3 circles on outer orbit
    for (let i = 0; i < 3; i++) {
      circles.push({
        id: `idle-${i}`,
        orbitIndex: 2,
        angle: (i * 120) + (Math.random() * 20 - 10),
        size: 6 + Math.random() * 2,
        delay: Math.random() * 2,
      });
    }
  } else if (state === "thinking") {
    // Medium activity - circles on 2 orbits
    for (let i = 0; i < 4; i++) {
      circles.push({
        id: `think-inner-${i}`,
        orbitIndex: 1,
        angle: (i * 90) + (Math.random() * 15 - 7.5),
        size: 8 + Math.random() * 4,
        delay: Math.random() * 1.5,
      });
    }
    for (let i = 0; i < 5; i++) {
      circles.push({
        id: `think-outer-${i}`,
        orbitIndex: 2,
        angle: (i * 72) + (Math.random() * 20 - 10),
        size: 5 + Math.random() * 3,
        delay: Math.random() * 2,
      });
    }
  } else if (state === "processing") {
    // High activity - all orbits, more circles
    for (let i = 0; i < 3; i++) {
      circles.push({
        id: `proc-core-${i}`,
        orbitIndex: 0,
        angle: (i * 120) + (Math.random() * 30 - 15),
        size: 10 + Math.random() * 4,
        delay: Math.random() * 0.8,
      });
    }
    for (let i = 0; i < 6; i++) {
      circles.push({
        id: `proc-inner-${i}`,
        orbitIndex: 1,
        angle: (i * 60) + (Math.random() * 20 - 10),
        size: 7 + Math.random() * 4,
        delay: Math.random() * 1.2,
      });
    }
    for (let i = 0; i < 8; i++) {
      circles.push({
        id: `proc-outer-${i}`,
        orbitIndex: 2,
        angle: (i * 45) + (Math.random() * 15 - 7.5),
        size: 4 + Math.random() * 4,
        delay: Math.random() * 1.5,
      });
    }
  } else if (state === "streaming") {
    // Rhythmic - evenly spaced for pulse effect
    for (let i = 0; i < 4; i++) {
      circles.push({
        id: `stream-${i}`,
        orbitIndex: 1,
        angle: i * 90,
        size: 8,
        delay: i * 0.25,
      });
    }
  } else if (state === "success") {
    // Expanding bloom
    for (let i = 0; i < 6; i++) {
      circles.push({
        id: `success-${i}`,
        orbitIndex: 2,
        angle: i * 60,
        size: 6,
        delay: i * 0.1,
      });
    }
  } else if (state === "error") {
    // Fewer, scattered
    for (let i = 0; i < 3; i++) {
      circles.push({
        id: `error-${i}`,
        orbitIndex: 1,
        angle: (i * 120) + (Math.random() * 40 - 20),
        size: 8,
        delay: Math.random() * 0.5,
      });
    }
  }

  return circles;
}

// Orbit radii as percentage of container
const ORBIT_RADII = [0.2, 0.35, 0.48];

export function AISignal({
  state = "idle",
  size = 120,
  className,
  showOrbitCircles = true,
}: AISignalProps) {
  const [circles, setCircles] = useState<OrbitCircle[]>([]);
  const regenerateKey = useRef(0);

  // Regenerate circles when state changes
  useEffect(() => {
    regenerateKey.current++;
    setCircles(generateOrbitCircles(state));
  }, [state]);

  const center = size / 2;

  // Calculate rotation speeds based on state
  const getRotationClass = (orbitIndex: number) => {
    const baseClasses = ["orbit-ring"];

    if (state === "idle") {
      return [...baseClasses, "rotate-slow"].join(" ");
    } else if (state === "thinking") {
      return [
        ...baseClasses,
        orbitIndex === 1 ? "rotate-medium" : "rotate-slow-reverse",
      ].join(" ");
    } else if (state === "processing") {
      const speeds = ["rotate-fast", "rotate-medium-reverse", "rotate-fast"];
      return [...baseClasses, speeds[orbitIndex]].join(" ");
    } else if (state === "streaming") {
      return [...baseClasses, "rotate-pulse"].join(" ");
    } else if (state === "success") {
      return [...baseClasses, "rotate-bloom"].join(" ");
    } else if (state === "error") {
      return [...baseClasses, "rotate-shake"].join(" ");
    }

    return baseClasses.join(" ");
  };

  return (
    <div
      className={cn("ai-signal", `ai-signal--${state}`, className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="ai-signal__svg"
      >
        {/* Orbit rings (dashed) */}
        {ORBIT_RADII.map((radius, i) => (
          <circle
            key={`orbit-${i}`}
            cx={center}
            cy={center}
            r={radius * size}
            className={cn("orbit-ring-path", `orbit-ring-path--${i}`)}
            fill="none"
            strokeDasharray={i === 2 ? "4 4" : i === 1 ? "8 4" : "none"}
          />
        ))}

        {/* Orbiting circles grouped by orbit for rotation */}
        {showOrbitCircles && ORBIT_RADII.map((radius, orbitIndex) => {
          const orbitCircles = circles.filter(
            (c) => c.orbitIndex === orbitIndex
          );
          if (orbitCircles.length === 0) return null;

          return (
            <g
              key={`orbit-group-${orbitIndex}`}
              className={getRotationClass(orbitIndex)}
              style={{
                transformOrigin: `${center}px ${center}px`,
              }}
            >
              {orbitCircles.map((circle) => {
                const angleRad = (circle.angle * Math.PI) / 180;
                const orbitRadius = radius * size;
                const x = center + Math.cos(angleRad) * orbitRadius;
                const y = center + Math.sin(angleRad) * orbitRadius;

                return (
                  <circle
                    key={circle.id}
                    cx={x}
                    cy={y}
                    r={circle.size / 2}
                    className="orbit-circle"
                    style={{
                      animationDelay: `${circle.delay}s`,
                    }}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default AISignal;
