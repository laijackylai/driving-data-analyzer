"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MetricTooltipContent } from "@/types";

interface MetricTooltipProps {
  content: MetricTooltipContent;
  className?: string;
}

export function MetricTooltip({ content, className }: MetricTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className={cn("relative inline-flex", className)}>
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-sapphire-400 hover:text-sapphire-200 transition-colors p-0.5 rounded-full"
        aria-label="Metric information"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2",
            "w-72 sm:w-80 p-3 rounded-xl",
            "bg-sapphire-900/95 backdrop-blur-lg",
            "border border-glass-edge",
            "shadow-sapphire-lg",
            "text-xs leading-relaxed",
            "animate-fade-in"
          )}
        >
          <div className="space-y-2">
            <p className="text-sky-300 font-medium">{content.axis}</p>
            <div className="space-y-1">
              <p className="text-sapphire-200">
                <span className="text-accent-emerald-400 font-medium">Normal: </span>
                {content.values[0]}
              </p>
              <p className="text-sapphire-200">
                <span className="text-subaru-red font-medium">Warning: </span>
                {content.values[1]}
              </p>
            </div>
            <p className="text-amber-300/90 italic">{content.interpretation}</p>
          </div>
          {/* Arrow */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-sapphire-900/95 border-l border-t border-glass-edge" />
        </div>
      )}
    </div>
  );
}
