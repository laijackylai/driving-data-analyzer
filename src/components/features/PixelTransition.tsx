"use client";

import { useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";

/** Default grid columns/rows for SSR or when window dimensions are unavailable */
const FALLBACK_COLS = 80;
const FALLBACK_ROWS = 45;

interface PixelTransitionProps {
  active: boolean;
  onComplete: () => void;
  children: React.ReactNode;
  /** Grid cell size in px (default 24 — balances visual fidelity vs DOM node count) */
  cellSize?: number;
  /** Total dissolve duration in ms */
  duration?: number;
  className?: string;
}

export function PixelTransition({
  active,
  onComplete,
  children,
  cellSize = 24,
  duration = 600,
  className,
}: PixelTransitionProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use window dimensions when available and > 0, otherwise fallback.
  // In jsdom, window exists but innerWidth/innerHeight are 0.
  const cols =
    typeof window !== "undefined" && window.innerWidth > 0
      ? Math.ceil(window.innerWidth / cellSize)
      : FALLBACK_COLS;
  const rows =
    typeof window !== "undefined" && window.innerHeight > 0
      ? Math.ceil(window.innerHeight / cellSize)
      : FALLBACK_ROWS;

  const cellDelays = useMemo(() => {
    const total = cols * rows;
    const delays: number[] = [];
    for (let i = 0; i < total; i++) {
      delays.push(Math.random());
    }
    return delays;
  }, [cols, rows]);

  useEffect(() => {
    if (active) {
      timerRef.current = setTimeout(() => {
        onComplete();
      }, duration + 100);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, onComplete, duration]);

  return (
    <div className={cn("relative", className)}>
      {children}
      {active && (
        <div
          className="fixed inset-0 z-[60] pointer-events-none"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
          }}
          aria-hidden="true"
        >
          {cellDelays.map((delay, i) => (
            <div
              key={i}
              data-testid="pixel-cell"
              className="bg-sapphire-950"
              style={{
                opacity: 0,
                animation: `pixel-appear ${duration * 0.4}ms ease-out forwards`,
                animationDelay: `${delay * duration * 0.6}ms`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
