"use client";

import { useRef, useMemo, useCallback } from "react";
import { useTimeRange } from "@/hooks/useTimeRange";
import { OBD2DataPoint } from "@/types";

const NUM_SEGMENTS = 240;

function speedToColor(speed: number | undefined, alpha: number): string {
  const s = speed ?? 0;
  if (s < 30) return `rgba(16, 185, 129, ${alpha})`;  // emerald
  if (s < 80) return `rgba(245, 158, 11, ${alpha})`;  // amber
  return `rgba(224, 32, 44, ${alpha})`;               // red
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface TimelineSliderProps {
  timeSeries: OBD2DataPoint[];
  onHomeClick?: () => void;
}

export function TimelineSlider({ timeSeries, onHomeClick }: TimelineSliderProps) {
  const { timeRange, setTimeRange, resetTimeRange, isRangeActive } = useTimeRange();

  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<"left" | "right" | "range" | null>(null);
  const dragStartXRef = useRef(0);
  const dragStartFracsRef = useRef({ left: 0, right: 1 });
  const rafRef = useRef<number | null>(null);

  const minTime = timeSeries.length > 0 ? timeSeries[0].timestamp : 0;
  const maxTime = timeSeries.length > 0 ? timeSeries[timeSeries.length - 1].timestamp : 0;
  const totalDuration = maxTime - minTime;

  // Fractional positions [0, 1]
  const leftFrac = isRangeActive ? (timeRange.start! - minTime) / totalDuration : 0;
  const rightFrac = isRangeActive ? (timeRange.end! - minTime) / totalDuration : 1;

  // Build speed heatmap using bucket approach — O(n + NUM_SEGMENTS)
  const segments = useMemo(() => {
    if (timeSeries.length === 0 || totalDuration <= 0) return [];

    const buckets = Array.from({ length: NUM_SEGMENTS }, () => ({ sum: 0, count: 0 }));

    for (const d of timeSeries) {
      const idx = Math.min(
        NUM_SEGMENTS - 1,
        Math.floor(((d.timestamp - minTime) / totalDuration) * NUM_SEGMENTS)
      );
      if (idx >= 0) {
        buckets[idx].sum += d.vehicleSpeed ?? 0;
        buckets[idx].count++;
      }
    }

    return buckets.map((bucket, i) => {
      const avgSpeed = bucket.count > 0 ? bucket.sum / bucket.count : undefined;
      const segFrac = i / NUM_SEGMENTS;
      const inRange = !isRangeActive || (segFrac >= leftFrac && segFrac <= rightFrac);
      return speedToColor(avgSpeed, inRange ? 1 : 0.25);
    });
  }, [timeSeries, totalDuration, minTime, isRangeActive, leftFrac, rightFrac]);

  const fracToTime = useCallback(
    (frac: number) => minTime + frac * totalDuration,
    [minTime, totalDuration]
  );

  const updateRange = useCallback(
    (newLeft: number, newRight: number) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const l = Math.max(0, Math.min(newLeft, newRight - 0.005));
        const r = Math.min(1, Math.max(newRight, l + 0.005));
        if (l <= 0.001 && r >= 0.999) {
          resetTimeRange();
        } else {
          setTimeRange({ start: fracToTime(l), end: fracToTime(r), source: "slider" });
        }
      });
    },
    [fracToTime, resetTimeRange, setTimeRange]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, side: "left" | "right" | "range") => {
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      draggingRef.current = side;
      dragStartXRef.current = e.clientX;
      dragStartFracsRef.current = { left: leftFrac, right: rightFrac };
    },
    [leftFrac, rightFrac]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = draggingRef.current;
      if (!drag) return;
      const track = trackRef.current;
      if (!track) return;

      const rect = track.getBoundingClientRect();
      const dx = (e.clientX - dragStartXRef.current) / rect.width;
      const { left: sl, right: sr } = dragStartFracsRef.current;

      if (drag === "left") {
        updateRange(sl + dx, sr);
      } else if (drag === "right") {
        updateRange(sl, sr + dx);
      } else {
        // Move the whole window
        const width = sr - sl;
        let nl = sl + dx;
        let nr = sr + dx;
        if (nl < 0) { nl = 0; nr = width; }
        if (nr > 1) { nr = 1; nl = 1 - width; }
        updateRange(nl, nr);
      }
    },
    [updateRange]
  );

  const handlePointerUp = useCallback(() => {
    draggingRef.current = null;
  }, []);

  if (timeSeries.length === 0) return null;

  const displayedLeft = isRangeActive ? timeRange.start! - minTime : 0;
  const displayedRight = isRangeActive ? timeRange.end! - minTime : totalDuration;

  return (
    <div className="sticky bottom-0 z-50 border-t border-glass-edge bg-sapphire-950/85 backdrop-blur-md safe-area-pad">
      <div className="mx-auto w-full max-w-5xl px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Left time label */}
          <span className="font-mono text-[10px] text-sapphire-400 shrink-0 w-9 text-right tabular-nums">
            {formatElapsed(displayedLeft)}
          </span>

          {/* Track */}
          <div
            ref={trackRef}
            className="relative flex-1 h-11 select-none"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {/* Speed heatmap bar */}
            <div
              className="absolute left-0 right-0 rounded-full overflow-hidden"
              style={{ top: "50%", transform: "translateY(-50%)", height: 8 }}
            >
              {segments.map((color, i) => (
                <div
                  key={i}
                  style={{ position: "absolute", left: `${(i / NUM_SEGMENTS) * 100}%`, width: `${100 / NUM_SEGMENTS}%`, top: 0, bottom: 0, backgroundColor: color }}
                />
              ))}
            </div>

            {/* Selected range overlay */}
            {isRangeActive && (
              <div
                className="absolute pointer-events-none rounded-full"
                style={{
                  left: `${leftFrac * 100}%`,
                  width: `${(rightFrac - leftFrac) * 100}%`,
                  top: "50%",
                  transform: "translateY(-50%)",
                  height: 8,
                  background: "rgba(54, 112, 198, 0.2)",
                  boxShadow: "0 0 0 1px rgba(54, 112, 198, 0.5)",
                }}
              />
            )}

            {/* Draggable range area */}
            {isRangeActive && (
              <div
                className="absolute cursor-grab active:cursor-grabbing touch-none"
                style={{
                  left: `${leftFrac * 100}%`,
                  width: `${(rightFrac - leftFrac) * 100}%`,
                  top: 0,
                  bottom: 0,
                }}
                onPointerDown={(e) => handlePointerDown(e, "range")}
              />
            )}

            {/* Left handle — 44px hit area */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 flex items-center justify-center cursor-ew-resize touch-none"
              style={{ left: `${leftFrac * 100}%` }}
              onPointerDown={(e) => handlePointerDown(e, "left")}
            >
              <div className="w-2.5 h-6 rounded-full bg-sapphire-400 border-2 border-sapphire-100 shadow-lg transition-colors" />
            </div>

            {/* Right handle — 44px hit area */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 flex items-center justify-center cursor-ew-resize touch-none"
              style={{ left: `${rightFrac * 100}%` }}
              onPointerDown={(e) => handlePointerDown(e, "right")}
            >
              <div className="w-2.5 h-6 rounded-full bg-sapphire-400 border-2 border-sapphire-100 shadow-lg transition-colors" />
            </div>
          </div>

          {/* Right time label */}
          <span className="font-mono text-[10px] text-sapphire-400 shrink-0 w-9 tabular-nums">
            {formatElapsed(displayedRight)}
          </span>

          {/* Reset button */}
          <button
            type="button"
            onClick={resetTimeRange}
            disabled={!isRangeActive}
            className={[
              "shrink-0 text-[10px] font-medium px-2.5 py-1 rounded border transition-colors",
              isRangeActive
                ? "border-subaru-red/40 text-subaru-red hover:border-subaru-red/60"
                : "border-sapphire-800 text-sapphire-700 cursor-default",
            ].join(" ")}
          >
            Reset
          </button>

          {/* Home button */}
          {onHomeClick && (
            <button
              type="button"
              onClick={onHomeClick}
              aria-label="Return to landing"
              className="shrink-0 p-1.5 rounded border border-sapphire-700/40 text-sapphire-400 hover:text-sapphire-200 hover:border-sapphire-600/40 transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
