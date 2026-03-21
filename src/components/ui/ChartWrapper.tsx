"use client";

import { useRef, useEffect, useState, ReactNode } from "react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => null, // ChartWrapper handles its own loading state
});

export { Plot };

interface ChartWrapperProps {
  title: string;
  height?: number;
  children: ReactNode;
  className?: string;
  loading?: boolean;
  tooltipContent?: ReactNode;
}

export function ChartWrapper({
  title,
  height = 350,
  children,
  className,
  loading = false,
  tooltipContent,
}: ChartWrapperProps) {
  const [plotlyReady, setPlotlyReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect Plotly readiness by checking for the dynamically imported module.
  // The Plot component renders null via loading prop until ready,
  // so we observe the container for actual chart content via MutationObserver.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // Check if Plotly has already rendered (e.g., cached module)
    if (container.querySelector(".js-plotly-plot")) {
      setPlotlyReady(true);
      return;
    }
    const observer = new MutationObserver(() => {
      if (container.querySelector(".js-plotly-plot")) {
        setPlotlyReady(true);
        observer.disconnect();
      }
    });
    observer.observe(container, { childList: true, subtree: true });
    // Fallback: if Plotly loads but no chart is rendered yet (empty data),
    // resolve after the dynamic import by checking window
    const checkInterval = setInterval(() => {
      if (typeof window !== "undefined" && "Plotly" in window) {
        setPlotlyReady(true);
        clearInterval(checkInterval);
      }
    }, 200);
    return () => { observer.disconnect(); clearInterval(checkInterval); };
  }, []);

  const showSkeleton = loading || !plotlyReady;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative rounded-2xl border border-glass-edge",
        "bg-pearl-gradient backdrop-blur-md",
        "shadow-sapphire-sm",
        "overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <h3 className="text-sm font-medium text-sapphire-200 font-body">
          {title}
        </h3>
        {tooltipContent}
      </div>

      {/* Chart area */}
      <div style={{ height }} className="relative">
        {showSkeleton ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full bg-sapphire-900/30 animate-pulse rounded-b-2xl">
              {/* Faint axis hints */}
              <div className="absolute bottom-8 left-12 right-4 h-px bg-sapphire-800/50" />
              <div className="absolute top-4 bottom-8 left-12 w-px bg-sapphire-800/50" />
              {/* Shimmer overlay */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-sapphire-700/10 to-transparent animate-progress-shimmer" />
              </div>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
