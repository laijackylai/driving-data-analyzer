"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useCountUp } from "@/hooks/useCountUp";

interface SafetyGaugeProps {
  score: number; // 0–100
  size?: number; // px, default 200
  strokeWidth?: number; // px, default 12
  className?: string;
}

/**
 * Animated radial gauge for safety score.
 * Uses a 270° arc (¾ circle, opening at the bottom).
 * Gradient stroke transitions from red → amber → green.
 * Arc animates from empty on mount; score counts up from 0.
 */
export function SafetyGauge({
  score,
  size = 200,
  strokeWidth = 12,
  className,
}: SafetyGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));

  // ── Mount state — arc starts empty, fills after first paint ──
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(timer);
  }, []);

  // ── Animated count-up for the score number ──
  const animatedScore = useCountUp(clampedScore, {
    duration: 1400,
    delay: 300,
  });

  // ── SVG geometry ──
  const center = size / 2;
  const radius = (size - strokeWidth) / 2 - 4; // 4px inset for glow room
  const circumference = 2 * Math.PI * radius;

  // 270° arc = 75% of full circle
  const arcLength = circumference * 0.75;
  // How much of the arc to fill
  const filledLength = arcLength * (clampedScore / 100);
  const targetOffset = arcLength - filledLength;

  // Before mount: show nothing filled. After mount: transition to target.
  const currentOffset = mounted ? targetOffset : arcLength;

  // Score color and label
  let scoreColor: string;
  let scoreLabel: string;

  if (clampedScore >= 80) {
    scoreColor = "text-accent-emerald-400";
    scoreLabel = "Excellent";
  } else if (clampedScore >= 60) {
    scoreColor = "text-accent-amber-400";
    scoreLabel = "Fair";
  } else {
    scoreColor = "text-accent-red-400";
    scoreLabel = "Needs Improvement";
  }

  // Gradient ID (unique per instance)
  const gradientId = `gauge-gradient-${size}`;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform rotate-[135deg]"
      >
        <defs>
          {/* Gradient along the arc: red → amber → green */}
          <linearGradient
            id={gradientId}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="40%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>

          {/* Glow filter */}
          <filter id={`${gradientId}-glow`}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(54, 112, 198, 0.1)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
        />

        {/* Filled arc with gradient — animates from 0 to target on mount */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={currentOffset}
          strokeLinecap="round"
          filter={`url(#${gradientId}-glow)`}
          className="transition-[stroke-dashoffset] duration-[1.4s] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "font-mono text-5xl font-bold tracking-tighter",
            scoreColor
          )}
        >
          {animatedScore}
        </span>
        <span className="text-xs font-medium uppercase tracking-widest text-sapphire-400 mt-1">
          {scoreLabel}
        </span>
      </div>
    </div>
  );
}
