import React, { useState, useEffect } from "react";
import { Word } from "@/components/typography/Word";

export const LoginPage: React.FC = () => {
  const [circleVisible, setCircleVisible] = useState(false);
  const [wordVisible, setWordVisible] = useState(false);

  useEffect(() => {
    // Start circle animation after a brief delay
    const circleTimer = setTimeout(() => {
      setCircleVisible(true);
    }, 100);

    // Start word reveal after circle begins
    const wordTimer = setTimeout(() => {
      setWordVisible(true);
    }, 600);

    return () => {
      clearTimeout(circleTimer);
      clearTimeout(wordTimer);
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-dark-900 flex items-center justify-center overflow-hidden">
      {/* Animated blur circle */}
      <div
        className={`absolute w-[400px] h-[400px] rounded-full transition-all duration-[1500ms] ease-out ${
          circleVisible
            ? "opacity-100 scale-100 blur-[80px]"
            : "opacity-0 scale-50 blur-[120px]"
        }`}
        style={{
          background: "radial-gradient(circle, var(--color-coral-500) 0%, var(--color-coral-600) 40%, transparent 70%)",
        }}
      />

      {/* SYNTH word */}
      <div
        className={`relative z-10 transition-opacity duration-500 ${
          wordVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{
          ["--letter-width" as string]: "110px",
          ["--letter-height" as string]: "96px",
        }}
      >
        <Word
          letters={["s", "y", "n", "t", "h"]}
          autoReveal={wordVisible}
          className="[&_svg]:fill-dark-50"
        />
      </div>
    </div>
  );
};

export default LoginPage;
