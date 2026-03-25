"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// Heights of the sticky bars — used for rootMargin and getBoundingClientRect checks
const TAB_BAR_HEIGHT = 56;
const TIMELINE_HEIGHT = 64;

export function useActiveSection(sectionIds: readonly string[]) {
  const [activeSection, setActiveSection] = useState<string>(sectionIds[0] ?? "");
  const suppressRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const updateActive = () => {
      if (suppressRef.current) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const elements = sectionIds
          .map((id) => document.getElementById(id))
          .filter((el): el is HTMLElement => el !== null);

        const inView: { id: string; top: number }[] = [];
        for (const el of elements) {
          const rect = el.getBoundingClientRect();
          const bottomClearsTabBar = rect.bottom > TAB_BAR_HEIGHT;
          const topClearsTimeline = rect.top < window.innerHeight - TIMELINE_HEIGHT;
          if (bottomClearsTabBar && topClearsTimeline) {
            inView.push({ id: el.id, top: rect.top });
          }
        }

        if (inView.length === 0) return;

        // Pick the section whose top is closest to (and at or above) the tab bar bottom
        // Prefer sections that have scrolled past the tab bar
        const best = inView.reduce((prev, curr) => {
          const prevDist = prev.top - TAB_BAR_HEIGHT;
          const currDist = curr.top - TAB_BAR_HEIGHT;
          // Both above tab bar bottom: pick the one less negative (closer to tab bar)
          // Both below: pick the one with smaller positive distance
          return Math.abs(currDist) < Math.abs(prevDist) ? curr : prev;
        });

        setActiveSection(best.id);
      }, 100);
    };

    const observer = new IntersectionObserver(updateActive, {
      threshold: 0,
      rootMargin: `-${TAB_BAR_HEIGHT}px 0px -${TIMELINE_HEIGHT}px 0px`,
    });

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    for (const el of elements) {
      observer.observe(el);
    }

    return () => {
      observer.disconnect();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [sectionIds]);

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;

    suppressRef.current = true;
    setActiveSection(id);
    el.scrollIntoView({ behavior: "smooth" });

    // Re-enable observer after scroll animation completes
    setTimeout(() => {
      suppressRef.current = false;
    }, 800);
  }, []);

  return { activeSection, scrollToSection };
}
