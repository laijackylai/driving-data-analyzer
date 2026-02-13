"use client";

import { useRef, useCallback, TouchEvent } from "react";

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  /** Minimum horizontal distance in px to trigger a swipe (default 50) */
  threshold?: number;
  /** Max vertical distance — prevents diagonal/scroll from triggering (default 80) */
  maxVertical?: number;
}

/**
 * Detects horizontal swipe gestures on a touch target.
 * Returns event handlers to spread onto the swipeable element.
 */
export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  maxVertical = 80,
}: UseSwipeOptions) {
  const startX = useRef(0);
  const startY = useRef(0);

  const onTouchStart = useCallback((e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      const deltaX = e.changedTouches[0].clientX - startX.current;
      const deltaY = Math.abs(e.changedTouches[0].clientY - startY.current);

      // Ignore if vertical movement is too large (user is scrolling)
      if (deltaY > maxVertical) return;

      if (deltaX < -threshold) {
        onSwipeLeft?.();
      } else if (deltaX > threshold) {
        onSwipeRight?.();
      }
    },
    [onSwipeLeft, onSwipeRight, threshold, maxVertical]
  );

  return { onTouchStart, onTouchEnd };
}
