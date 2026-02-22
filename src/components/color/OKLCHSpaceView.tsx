/**
 * OKLCHSpaceView - 3D OKLCH Color Space Visualization
 *
 * Interactive 3D visualization of colors in perceptual OKLCH space
 * using Three.js and react-three-fiber.
 */

import React, { useState, useMemo, useRef } from "react";
import { Canvas, useFrame, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Text, Line } from "@react-three/drei";
import * as THREE from "three";
import { StyleGraph } from "@/core/StyleGraph";
import { StyleNode } from "@/types/styleGraph";
import { hexToOKLCH, OKLCHColor } from "@/services/colorScience";
import { shortenTokenName } from "./utils/token-name-utils";
import { FilterBanner } from "@/components/ui/filter-banner";
import { OKLCHDisplay } from "./shared/OKLCHDisplay";
import { ColorDetailPanel } from "./shared/ColorDetailPanel";
import { useResolvedColors } from "./hooks/useResolvedColors";

interface OKLCHSpaceViewProps {
  graph: StyleGraph;
  viewMode: "light" | "dark";
  filteredNodes?: StyleNode[] | null;
  onClearFilter?: () => void;
}

interface ColorPoint {
  node: StyleNode;
  hex: string;
  oklch: OKLCHColor;
  position: [number, number, number];
  isRoot: boolean;
}

// Scale factor for the 3D space
const SCALE = 2;

// Convert OKLCH to 3D cylindrical coordinates
// L = Y axis (0-1 mapped to 0-SCALE)
// C = radius from center (0-0.4 mapped to 0-SCALE)
// H = angle around Y axis (0-360 mapped to 0-2PI)
function oklchTo3D(oklch: OKLCHColor): [number, number, number] {
  const y = oklch.l * SCALE;
  const radius = Math.min(oklch.c, 0.4) * SCALE * 2.5; // Scale chroma for visibility
  const angle = (oklch.h * Math.PI) / 180;

  const x = radius * Math.cos(angle);
  const z = radius * Math.sin(angle);

  return [x, y, z];
}


// Color sphere component
interface ColorSphereProps {
  point: ColorPoint;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: (hovering: boolean) => void;
}

function ColorSphere({
  point,
  isSelected,
  isHovered,
  onSelect,
  onHover,
}: ColorSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const baseScale = point.isRoot ? 0.08 : 0.05;
  const targetScale = isSelected ? baseScale * 1.5 : isHovered ? baseScale * 1.25 : baseScale;

  useFrame(() => {
    if (meshRef.current) {
      // Smooth scale animation
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={point.position}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHover(true);
      }}
      onPointerOut={() => onHover(false)}
    >
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial
        color={point.hex}
        emissive={isSelected || isHovered ? point.hex : "#000000"}
        emissiveIntensity={isSelected ? 0.3 : isHovered ? 0.15 : 0}
        roughness={0.3}
        metalness={0.1}
      />
      {/* Selection ring */}
      {isSelected && (
        <mesh>
          <torusGeometry args={[1.3, 0.05, 16, 32]} />
          <meshBasicMaterial color="#3b82f6" />
        </mesh>
      )}
    </mesh>
  );
}

// Axis helper component
function AxisHelper() {
  return (
    <group>
      {/* Y axis (Lightness) */}
      <Line
        points={[
          [0, 0, 0],
          [0, SCALE, 0],
        ]}
        color="#888888"
        lineWidth={1}
      />
      <Text
        position={[0, SCALE + 0.15, 0]}
        fontSize={0.1}
        color="#666666"
        anchorX="center"
      >
        L (Lightness)
      </Text>

      {/* Base circle for hue reference */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[SCALE * 0.9, SCALE, 64]} />
        <meshBasicMaterial color="#222222" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* Hue markers */}
      {[0, 60, 120, 180, 240, 300].map((hue) => {
        const angle = (hue * Math.PI) / 180;
        const radius = SCALE;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        const colors = ["#ff0000", "#ffff00", "#00ff00", "#00ffff", "#0000ff", "#ff00ff"];
        const index = hue / 60;

        return (
          <group key={hue}>
            <Line
              points={[
                [0, 0.01, 0],
                [x, 0.01, z],
              ]}
              color="#444444"
              lineWidth={0.5}
            />
            <mesh position={[x * 1.1, 0.01, z * 1.1]}>
              <circleGeometry args={[0.05, 16]} />
              <meshBasicMaterial color={colors[index]} side={THREE.DoubleSide} />
            </mesh>
            <Text
              position={[x * 1.2, 0.01, z * 1.2]}
              fontSize={0.08}
              color="#888888"
              anchorX="center"
              rotation={[-Math.PI / 2, 0, 0]}
            >
              {hue}°
            </Text>
          </group>
        );
      })}

      {/* Lightness markers */}
      {[0, 0.25, 0.5, 0.75, 1].map((l) => (
        <group key={l}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, l * SCALE, 0]}>
            <ringGeometry args={[SCALE * 0.95, SCALE, 32]} />
            <meshBasicMaterial color="#333333" transparent opacity={0.2} side={THREE.DoubleSide} />
          </mesh>
          <Text
            position={[-SCALE - 0.1, l * SCALE, 0]}
            fontSize={0.08}
            color="#888888"
            anchorX="right"
          >
            {(l * 100).toFixed(0)}%
          </Text>
        </group>
      ))}
    </group>
  );
}

// Scene component
interface SceneProps {
  colorPoints: ColorPoint[];
  selectedPoint: ColorPoint | null;
  hoveredPoint: ColorPoint | null;
  onSelectPoint: (point: ColorPoint | null) => void;
  onHoverPoint: (point: ColorPoint | null) => void;
  showConnections: boolean;
}

function Scene({
  colorPoints,
  selectedPoint,
  hoveredPoint,
  onSelectPoint,
  onHoverPoint,
  showConnections,
}: SceneProps) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <directionalLight position={[-5, 5, -5]} intensity={0.4} />

      {/* Axis helper */}
      <AxisHelper />

      {/* Color spheres */}
      {colorPoints.map((point) => (
        <ColorSphere
          key={point.node.id}
          point={point}
          isSelected={selectedPoint?.node.id === point.node.id}
          isHovered={hoveredPoint?.node.id === point.node.id}
          onSelect={() =>
            onSelectPoint(selectedPoint?.node.id === point.node.id ? null : point)
          }
          onHover={(hovering) => onHoverPoint(hovering ? point : null)}
        />
      ))}

      {/* Connection lines when a point is selected */}
      {showConnections && selectedPoint && (
        <group>
          {/* Lines to dependencies */}
          {Array.from(selectedPoint.node.dependencies).map((depId) => {
            const depPoint = colorPoints.find((p) => p.node.id === depId);
            if (!depPoint) return null;
            return (
              <Line
                key={`dep-${depId}`}
                points={[selectedPoint.position, depPoint.position]}
                color="#3b82f6"
                lineWidth={2}
              />
            );
          })}
          {/* Lines to dependents */}
          {Array.from(selectedPoint.node.dependents).map((depId) => {
            const depPoint = colorPoints.find((p) => p.node.id === depId);
            if (!depPoint) return null;
            return (
              <Line
                key={`child-${depId}`}
                points={[selectedPoint.position, depPoint.position]}
                color="#10b981"
                lineWidth={2}
              />
            );
          })}
        </group>
      )}

      {/* Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={1}
        maxDistance={10}
        target={[0, SCALE / 2, 0]}
      />
    </>
  );
}

export const OKLCHSpaceView: React.FC<OKLCHSpaceViewProps> = ({
  graph,
  viewMode,
  filteredNodes,
  onClearFilter,
}) => {
  const [selectedPoint, setSelectedPoint] = useState<ColorPoint | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<ColorPoint | null>(null);
  const [showConnections, setShowConnections] = useState(true);
  const [showLabels, setShowLabels] = useState(false);

  // Get resolved colors using shared hook
  const resolvedColors = useResolvedColors(graph, viewMode, filteredNodes);

  // Build color points with 3D positions
  const colorPoints = useMemo(() => {
    return resolvedColors.map((color) => ({
      ...color,
      position: oklchTo3D(color.oklch),
    }));
  }, [resolvedColors]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: colorPoints.length,
      roots: colorPoints.filter((p) => p.isRoot).length,
    };
  }, [colorPoints]);

  // Empty state
  if (colorPoints.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-dark-900">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-semibold text-white">No colors to display</h3>
          <p className="text-dark-400">Add colors to see them in 3D space</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-dark-950">
      {/* Header */}
      <div className="px-6 py-4 bg-dark-900 border-b border-dark-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">3D OKLCH Color Space</h2>
          <p className="text-sm text-dark-400">
            {stats.total} colors • {stats.roots} primitives
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Toggle buttons */}
          <label className="flex items-center gap-2 text-sm text-dark-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showConnections}
              onChange={(e) => setShowConnections(e.target.checked)}
              className="rounded border-dark-600 bg-dark-800"
            />
            Show connections
          </label>
        </div>
      </div>

      {/* Filter banner */}
      {filteredNodes && (
        <FilterBanner
          count={filteredNodes.length}
          itemLabel="colors"
          variant="dark"
          className="px-6"
          onClear={onClearFilter}
        />
      )}

      {/* 3D Canvas */}
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [3, 2, 3], fov: 50 }}
          style={{ background: "#0a0a0a" }}
        >
          <Scene
            colorPoints={colorPoints}
            selectedPoint={selectedPoint}
            hoveredPoint={hoveredPoint}
            onSelectPoint={setSelectedPoint}
            onHoverPoint={setHoveredPoint}
            showConnections={showConnections}
          />
        </Canvas>

        {/* Hover tooltip */}
        {hoveredPoint && !selectedPoint && (
          <div className="absolute bottom-4 left-4 bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white shadow-lg">
            <div className="font-medium">{shortenTokenName(hoveredPoint.node.name)}</div>
            <div className="text-dark-400 font-mono">{hoveredPoint.hex}</div>
          </div>
        )}
      </div>

      {/* Selected point detail panel */}
      {selectedPoint && (
        <PointDetailPanel
          point={selectedPoint}
          onClose={() => setSelectedPoint(null)}
        />
      )}

      {/* Legend */}
      <div className="px-6 py-3 bg-dark-900 border-t border-dark-800 flex items-center gap-6 text-xs text-dark-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Primitive (larger)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-400" />
          <span>Derived (smaller)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-blue-500" />
          <span>Dependency</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-emerald-500" />
          <span>Dependent</span>
        </div>
        <div className="ml-auto text-dark-500">
          Drag to rotate • Scroll to zoom • Click to select
        </div>
      </div>
    </div>
  );
};

// Detail panel
interface PointDetailPanelProps {
  point: ColorPoint;
  onClose: () => void;
}

const PointDetailPanel: React.FC<PointDetailPanelProps> = ({ point, onClose }) => {
  return (
    <ColorDetailPanel
      color={point.hex}
      title={shortenTokenName(point.node.name)}
      subtitle={point.hex}
      onClose={onClose}
      previewHeight={64}
      width="w-72"
      variant="dark"
      className="absolute bottom-16 right-4 z-10"
    >
      {/* OKLCH values */}
      <OKLCHDisplay oklch={point.oklch} variant="dark" />

      {/* Connections */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-dark-300">
            {point.node.dependencies.size} deps
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-dark-300">
            {point.node.dependents.size} dependents
          </span>
        </div>
      </div>

      {/* Badge */}
      {point.isRoot && (
        <span className="inline-block px-2 py-1 bg-amber-900/50 text-amber-300 text-xs rounded-full">
          Primitive / Root
        </span>
      )}
    </ColorDetailPanel>
  );
};
