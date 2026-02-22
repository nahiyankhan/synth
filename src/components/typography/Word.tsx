import { useEffect, useRef, useCallback } from "react";

// Import letter SVGs as raw strings
import SSvg from "@/assets/letters/s.svg?raw";
import YSvg from "@/assets/letters/y.svg?raw";
import NSvg from "@/assets/letters/n.svg?raw";
import TSvg from "@/assets/letters/t.svg?raw";
import HSvg from "@/assets/letters/h.svg?raw";

import "./Word.css";

export type LetterType = "s" | "y" | "n" | "t" | "h";

const letterMap: Record<LetterType, string> = {
  s: SSvg,
  y: YSvg,
  n: NSvg,
  t: TSvg,
  h: HSvg,
};

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface WordProps {
  letters: LetterType[];
  startIndex?: number;
  wordId?: string;
  autoReveal?: boolean;
  className?: string;
}

export function Word({
  letters,
  startIndex = 0,
  wordId,
  autoReveal = true,
  className = "",
}: WordProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const revealedRef = useRef(false);

  const revealWord = useCallback(() => {
    if (!containerRef.current || revealedRef.current) return;

    const boxes = Array.from(
      containerRef.current.querySelectorAll(".letter-box")
    );
    if (!boxes.length) return;

    const shuffled = shuffleArray(boxes);

    shuffled.forEach((box, i) => {
      const delay = 300 + i * 150 + Math.random() * 100;

      setTimeout(() => {
        box.classList.remove("needs-reveal");
        box.classList.add("revealing");
        setTimeout(() => box.classList.remove("revealing"), 800);
      }, delay);
    });

    revealedRef.current = true;
  }, []);

  const blinkWord = useCallback(() => {
    if (!containerRef.current) return;

    const boxes = Array.from(
      containerRef.current.querySelectorAll(".letter-box")
    );
    if (!boxes.length) return;

    const numToBlink = Math.floor(Math.random() * 3) + 2;
    const shuffled = shuffleArray(boxes).slice(0, numToBlink);

    shuffled.forEach((box) => {
      const delay = Math.random() * 500;

      setTimeout(() => {
        box.classList.add("blinking");
        setTimeout(() => box.classList.remove("blinking"), 1600);
      }, delay);
    });
  }, []);

  useEffect(() => {
    if (autoReveal && !revealedRef.current) {
      revealWord();
    }
  }, [autoReveal, revealWord]);

  // Expose methods for external control
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as any).__revealWord = revealWord;
      (containerRef.current as any).__blinkWord = blinkWord;
    }
  }, [revealWord, blinkWord]);

  const isIntro = !wordId;

  return (
    <div
      ref={containerRef}
      className={`flex gap-1 ${className}`}
      data-word-id={wordId}
    >
      {letters.map((letter, i) => (
        <div
          key={`${letter}-${i}`}
          className={`letter-box shrink-0 w-[var(--letter-width,55px)] h-[var(--letter-height,48px)] max-w-[218px] max-h-[192px] opacity-100 [&>svg]:w-full [&>svg]:h-full [&>svg]:block ${
            wordId ? `letter-box-${wordId}` : ""
          } ${isIntro && !autoReveal ? "needs-reveal" : ""}`}
          data-index={startIndex + i}
          dangerouslySetInnerHTML={{ __html: letterMap[letter] }}
        />
      ))}
    </div>
  );
}

export default Word;
