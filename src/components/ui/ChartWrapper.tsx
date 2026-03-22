"use client";

import { useRef, useEffect, useState, ReactNode } from "react";
import { cn } from "@/lib/utils";

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
  const [chartReady, setChartReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect when the chart has rendered by observing for Plotly or Leaflet elements.
  // Children are always rendered so dynamic imports can mount; the skeleton overlays
  // them until content appears.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isReady = () =>
      !!container.querySelector(".js-plotly-plot, .leaflet-container");

    if (isReady()) {
      setChartReady(true);
      return;
    }

    const observer = new MutationObserver(() => {
      if (isReady()) {
        setChartReady(true);
        observer.disconnect();
      }
    });
    observer.observe(container, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  const showSkeleton = loading || !chartReady;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative rounded-2xl border border-glass-edge",
        "bg-pearl-gradient backdrop-blur-md",
        "shadow-sapphire-sm",
        className
      )}
    >
      {/* Header */}
      <div className="relative z-20 flex items-center gap-2 px-4 pt-3 pb-1">
        <h3 className="text-sm font-medium text-sapphire-200 font-body">
          {title}
        </h3>
        {tooltipContent}
      </div>

      {/* Chart area — children always render so dynamic imports can mount */}
      <div style={{ height }} className="relative z-10 overflow-hidden rounded-b-2xl">
        {children}
        {showSkeleton && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="w-full h-full bg-sapphire-900/30 animate-pulse rounded-b-2xl">
              <div className="absolute bottom-8 left-12 right-4 h-px bg-sapphire-800/50" />
              <div className="absolute top-4 bottom-8 left-12 w-px bg-sapphire-800/50" />
              <div className="absolute inset-0 overflow-hidden">
                <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-sapphire-700/10 to-transparent animate-progress-shimmer" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
