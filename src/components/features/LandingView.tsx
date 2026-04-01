"use client";

import { useState, useRef, useCallback, DragEvent, ChangeEvent } from "react";
import { cn } from "@/lib/utils";
import { LandingViewProps } from "@/types";

const EXAMPLE_CSV_PATH = "/examples/example-drive.csv";
const EXAMPLE_CSV_NAME = "example-drive.csv";
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".csv"];

export function LandingView({ onFileSelect }: LandingViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCountRef = useRef(0);

  const validateFile = (file: File): boolean => {
    if (file.size > MAX_SIZE_BYTES) {
      setError(`File size exceeds ${MAX_SIZE_MB}MB limit`);
      return false;
    }
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setError(`Only ${ACCEPTED_EXTENSIONS.join(", ")} files are accepted`);
      return false;
    }
    setError(null);
    return true;
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (validateFile(files[0])) {
        onFileSelect(files[0]);
      }
    }
  };

  const handleDemoClick = useCallback(async () => {
    setIsLoadingDemo(true);
    setError(null);
    try {
      const response = await fetch(EXAMPLE_CSV_PATH);
      if (!response.ok) throw new Error("Failed to load example file");
      const blob = await response.blob();
      const file = new File([blob], EXAMPLE_CSV_NAME, { type: "text/csv" });
      onFileSelect(file);
    } catch {
      setError("Failed to load example data");
    } finally {
      setIsLoadingDemo(false);
    }
  }, [onFileSelect]);

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    dragCountRef.current++;
    if (dragCountRef.current === 1) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    dragCountRef.current--;
    if (dragCountRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    dragCountRef.current = 0;
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      if (validateFile(files[0])) {
        onFileSelect(files[0]);
      }
    }
  };

  return (
    <div
      className="h-screen overflow-hidden relative flex flex-col p-6 sm:p-8"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <span className="font-brand text-3xl sm:text-4xl font-black text-sapphire-100 tracking-tight">
          OBD2Charts
        </span>
        <div
          data-testid="logo-placeholder"
          className="w-10 h-10 rounded-full bg-sapphire-800 border border-glass-edge flex items-center justify-center"
        >
          <span className="text-xs text-sapphire-500">?</span>
        </div>
      </div>

      {/* Center content — slightly above center */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-[10vh]">
        {/* Upload button — icon only, glass card style */}
        <button
          type="button"
          onClick={handleUploadClick}
          aria-label="Upload CSV file"
          className={cn(
            "glass-card w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] rounded-2xl",
            "flex items-center justify-center",
            "transition-all duration-200",
            "hover:scale-105 hover:border-glass-edge-hover hover:shadow-glow-sapphire",
            "active:scale-[0.97]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sapphire-500/50"
          )}
        >
          <svg
            aria-hidden="true"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-sapphire-300"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </button>

        {/* Demo button */}
        <button
          type="button"
          onClick={handleDemoClick}
          disabled={isLoadingDemo}
          className="mt-3 text-xs font-medium text-sapphire-500 hover:text-sapphire-300 hover:underline transition-colors disabled:opacity-40"
        >
          {isLoadingDemo ? "Loading\u2026" : "Demo"}
        </button>

        {/* Error message */}
        {error && (
          <p className="mt-3 text-xs font-medium text-accent-red-400">{error}</p>
        )}
      </div>

      {/* Bottom-right description */}
      <div className="self-end max-w-xs sm:max-w-sm text-right sm:text-right text-left w-full sm:w-auto">
        <p className="text-xs text-sapphire-500 leading-relaxed">
          Analyze your driving data from OBD2 sensors. Upload a CSV export to
          explore engine performance, fuel efficiency, transmission behavior,
          power output, driving dynamics, braking, AWD, electrical systems, and
          air intake — all visualized in one dashboard.
        </p>
      </div>

      {/* Full-page drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-sapphire-950/80 backdrop-blur-sm flex items-center justify-center">
          <div className="border-2 border-dashed border-sapphire-500/50 rounded-2xl m-6 flex-1 h-[calc(100%-48px)] flex flex-col items-center justify-center gap-4">
            <svg
              aria-hidden="true"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-sapphire-400"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="text-sm text-sapphire-300 font-medium">
              Drop CSV file here
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
