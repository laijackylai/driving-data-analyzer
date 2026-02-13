"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpOptions {
  /** Animation duration in ms (default 1200) */
  duration?: number;
  /** Delay before starting in ms (default 0) */
  delay?: number;
  /** Decimal places to preserve during animation (default 0) */
  decimals?: number;
}

/**
 * Animates a number from 0 to the target value with ease-out quart easing.
 * Returns the current animated value.
 */
export function useCountUp(
  target: number,
  { duration = 1200, delay = 0, decimals = 0 }: CountUpOptions = {}
): number {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef(0);
  const startRef = useRef(0);

  useEffect(() => {
    if (target === 0) {
      setCurrent(0);
      return;
    }

    const factor = Math.pow(10, decimals);

    const timeoutId = setTimeout(() => {
      startRef.current = 0;

      const step = (ts: number) => {
        if (!startRef.current) startRef.current = ts;
        const elapsed = ts - startRef.current;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out quart — satisfying deceleration
        const eased = 1 - Math.pow(1 - progress, 4);

        setCurrent(Math.round(eased * target * factor) / factor);

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          setCurrent(target);
        }
      };

      rafRef.current = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, delay, decimals]);

  return current;
}
