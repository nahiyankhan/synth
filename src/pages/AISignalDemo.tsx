import { useState } from "react";
import { AISignal, type AISignalState } from "@/components/AISignal";

const STATES: AISignalState[] = [
  "idle",
  "thinking",
  "processing",
  "streaming",
  "success",
  "error",
];

export function AISignalDemo() {
  const [currentState, setCurrentState] = useState<AISignalState>("thinking");
  const [size, setSize] = useState(200);

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">AI Signal Component</h1>

        {/* Main demo area */}
        <div className="flex flex-col items-center gap-8 mb-12">
          <div
            className="flex items-center justify-center rounded-2xl bg-neutral-900 border border-neutral-800"
            style={{ width: size + 100, height: size + 100 }}
          >
            <AISignal state={currentState} size={size} />
          </div>

          <div className="text-center">
            <p className="text-neutral-400 text-sm mb-2">Current State</p>
            <p className="text-2xl font-mono">{currentState}</p>
          </div>
        </div>

        {/* State buttons */}
        <div className="mb-8">
          <p className="text-neutral-400 text-sm mb-3">States</p>
          <div className="flex flex-wrap gap-2">
            {STATES.map((state) => (
              <button
                key={state}
                onClick={() => setCurrentState(state)}
                className={`px-4 py-2 rounded-lg font-mono text-sm transition-colors ${
                  currentState === state
                    ? "bg-white text-black"
                    : "bg-neutral-800 hover:bg-neutral-700"
                }`}
              >
                {state}
              </button>
            ))}
          </div>
        </div>

        {/* Size slider */}
        <div className="mb-8">
          <p className="text-neutral-400 text-sm mb-3">Size: {size}px</p>
          <input
            type="range"
            min={60}
            max={400}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full max-w-xs"
          />
        </div>

        {/* Grid of all states */}
        <div className="mb-8">
          <p className="text-neutral-400 text-sm mb-3">All States</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {STATES.map((state) => (
              <div
                key={state}
                className="flex flex-col items-center gap-3 p-6 rounded-xl bg-neutral-900 border border-neutral-800"
              >
                <AISignal state={state} size={80} />
                <p className="text-sm font-mono text-neutral-400">{state}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Usage example */}
        <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800">
          <p className="text-neutral-400 text-sm mb-3">Usage</p>
          <pre className="text-sm font-mono text-green-400 overflow-x-auto">
{`import { AISignal } from "@/components/AISignal";

// Basic usage
<AISignal state="thinking" />

// With custom size
<AISignal state="processing" size={120} />

// States: idle | thinking | processing | streaming | success | error`}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default AISignalDemo;
