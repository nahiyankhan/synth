import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { AISignal } from "@/components/AISignal";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    navigate("/", { viewTransition: true });
  };

  return (
    <div className="min-h-screen w-full bg-cream-100 flex flex-col overflow-hidden">
      {/* Main content area */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* AISignal visualization with arrow button */}
        <div
          className={`transition-opacity duration-1000 relative ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className="text-cream-400"
            style={{ viewTransitionName: 'ai-signal' }}
          >
            <AISignal state="idle" size={400} showOrbitCircles={false} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={handleContinue}
              className="w-14 h-14 rounded-full bg-cream-800 hover:bg-cream-700 flex items-center justify-center transition-all"
              style={{ viewTransitionName: 'center-action' }}
            >
              <ArrowRight className="w-6 h-6 text-cream-100" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default LoginPage;
