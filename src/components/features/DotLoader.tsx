"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DotLoaderProps {
  className?: string;
}

const LABELS = [
  "Analyzing",
  "Processing",
  "Parsing",
  "Computing",
  "Crunching data",
  "Reading sensors",
  "Calibrating",
];

export function DotLoader({ className }: DotLoaderProps) {
  const [labelIndex, setLabelIndex] = useState(0);
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const id = setInterval(() => {
      setLabelIndex((i) => (i + 1) % LABELS.length);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setDotCount((n) => (n % 3) + 1);
    }, 400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <p className="text-2xl text-white font-black" style={{ fontFamily: 'var(--font-doto)' }}>
        {LABELS[labelIndex]}
      </p>
      <div className="flex items-center" style={{ fontFamily: 'var(--font-doto)' }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <span
            key={i}
            data-testid="dot"
            className={cn(
              "text-2xl text-white font-black transition-opacity duration-200",
              i < dotCount ? "opacity-100" : "opacity-0"
            )}
          >.</span>
        ))}
      </div>
    </div>
  );
}
