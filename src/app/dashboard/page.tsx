"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { FileUpload } from "@/components/features/FileUpload";
import { CategoryPanel } from "@/components/features/CategoryPanel";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SafetyGauge } from "@/components/ui/SafetyGauge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import {
  CategoryIcon,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
} from "@/components/ui/CategoryIcon";
import { OBD2AnalysisResult } from "@/types";
import { formatDuration } from "@/lib/utils";
import { useCountUp } from "@/hooks/useCountUp";
import { useSwipe } from "@/hooks/useSwipe";

export default function DashboardPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<OBD2AnalysisResult | null>(null);
  const [dataPointsCount, setDataPointsCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORY_ORDER)[number]>("motion");
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleFileSelect = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze data");
      }

      setResult(data.result);
      setDataPointsCount(data.dataPointsCount ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Swipe navigation between category tabs ──
  const navigateCategory = useCallback(
    (direction: "next" | "prev") => {
      const currentIdx = CATEGORY_ORDER.indexOf(activeCategory);
      if (currentIdx === -1) return;
      const nextIdx =
        direction === "next"
          ? Math.min(currentIdx + 1, CATEGORY_ORDER.length - 1)
          : Math.max(currentIdx - 1, 0);
      setActiveCategory(CATEGORY_ORDER[nextIdx]);
    },
    [activeCategory]
  );

  const swipeHandlers = useSwipe({
    onSwipeLeft: () => navigateCategory("next"),
    onSwipeRight: () => navigateCategory("prev"),
  });

  return (
    <div className="min-h-screen bg-sapphire-950 flex flex-col">
      <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-8 flex-1">
        {/* ── Top bar ── */}
        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <h1 className="font-display text-lg sm:text-2xl font-bold text-sapphire-100 tracking-tight">
            OBD2 Dashboard
          </h1>
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="text-sapphire-400 hover:text-sapphire-200 min-h-[44px] min-w-[44px]"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1.5"
              >
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Home</span>
            </Button>
          </Link>
        </div>

        {/* ── File upload ── */}
        <div className="mb-6 sm:mb-8">
          <FileUpload onFileSelect={handleFileSelect} />
        </div>

        {/* ── Loading state with progress shimmer ── */}
        {isAnalyzing && (
          <Card className="mb-6 sm:mb-8">
            <CardContent className="py-14 sm:py-16 flex flex-col items-center gap-4">
              <div className="relative h-12 w-12">
                <div className="absolute inset-0 rounded-full border-2 border-sapphire-800" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-sapphire-400 animate-spin" />
              </div>
              <p className="text-sm text-sapphire-400 font-medium">
                Analyzing driving data&hellip;
              </p>
              <div className="w-48 h-1 rounded-full overflow-hidden bg-sapphire-900/80">
                <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-sapphire-600 via-sapphire-400 to-sapphire-600 animate-progress-shimmer" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Error state ── */}
        {error && (
          <Card className="mb-6 sm:mb-8 border-accent-red-500/30">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0 h-5 w-5 rounded-full bg-accent-red-500/15 flex items-center justify-center">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-accent-red-400"
                  >
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-accent-red-400">
                    Analysis Failed
                  </p>
                  <p className="mt-1 text-xs text-sapphire-400 leading-relaxed">
                    {error}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Analysis results — staggered entrance ── */}
        {result && (
          <div className="space-y-5 sm:space-y-6">
            {/* ── Trip summary header ── */}
            <div
              className="animate-fade-up opacity-0 flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 px-0.5"
              style={{ animationDelay: "0ms" }}
            >
              <SummaryChip
                label="Duration"
                value={formatDuration(result.motion.durationSeconds)}
              />
              <SummaryChip
                label="Distance"
                value={
                  result.motion.totalDistance !== null ? (
                    <>
                      <AnimatedNumber
                        value={result.motion.totalDistance}
                        decimals={1}
                        delay={200}
                      />{" "}
                      km
                    </>
                  ) : (
                    "—"
                  )
                }
              />
              <SummaryChip
                label="Date"
                value={new Date(result.timestamp).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              />
              <SummaryChip
                label="Data pts"
                value={
                  <AnimatedNumber value={dataPointsCount} delay={400} />
                }
              />
            </div>

            {/* ── Safety gauge ── */}
            <div
              className="animate-fade-up opacity-0 flex justify-center py-1 sm:py-2"
              style={{ animationDelay: "150ms" }}
            >
              <SafetyGauge score={result.safetyScore} size={180} strokeWidth={12} />
            </div>

            {/* ── Category tabs + metrics (swipeable) ── */}
            <div
              className="animate-fade-up opacity-0"
              style={{ animationDelay: "300ms" }}
            >
              <Tabs
                value={activeCategory}
                onValueChange={(v) => setActiveCategory(v as (typeof CATEGORY_ORDER)[number])}
                defaultValue="motion"
              >
                <TabsList>
                  {CATEGORY_ORDER.map((cat) => (
                    <TabsTrigger key={cat} value={cat}>
                      <CategoryIcon category={cat} size={16} />
                      <span className="hidden sm:inline">{CATEGORY_LABELS[cat]}</span>
                      <span className="sm:hidden">{shortLabel(cat)}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Swipe zone wrapping all tab content */}
                <div {...swipeHandlers}>
                  {CATEGORY_ORDER.map((cat) => (
                    <TabsContent key={cat} value={cat}>
                      <CategoryPanel
                        category={cat}
                        metrics={result[cat]}
                      />
                    </TabsContent>
                  ))}
                </div>
              </Tabs>
            </div>

            {/* ── Session details — inline on desktop, bottom sheet trigger on mobile ── */}
            <div
              className="animate-fade-up opacity-0"
              style={{ animationDelay: "400ms" }}
            >
              {/* Mobile: compact trigger bar */}
              <button
                type="button"
                className="sm:hidden w-full"
                onClick={() => setSheetOpen(true)}
              >
                <Card>
                  <CardContent className="p-4 flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-sapphire-500">
                      Session Details
                    </span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-sapphire-500"
                    >
                      <path d="M18 15l-6-6-6 6" />
                    </svg>
                  </CardContent>
                </Card>
              </button>

              {/* Desktop: inline footer */}
              <div className="hidden sm:block">
                <SessionDetailsCard result={result} dataPointsCount={dataPointsCount} />
              </div>
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {!isAnalyzing && !result && !error && (
          <Card>
            <CardContent className="py-14 sm:py-16 text-center">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="mx-auto mb-4 text-sapphire-700"
              >
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="M12 6v2" />
                <path d="M16.24 7.76l-1.42 1.42" />
                <path d="M18 12h-2" />
                <path d="M12 12l-3.5 3.5" />
                <circle cx="12" cy="12" r="1" fill="currentColor" />
              </svg>
              <h3 className="text-base font-semibold text-sapphire-200 mb-1">
                No Data Yet
              </h3>
              <p className="text-sm text-sapphire-500">
                Upload an OBD2 CSV file to start analyzing your driving data.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Bottom sheet for session details (mobile) ── */}
      {sheetOpen && result && (
        <>
          <div
            className="bottom-sheet-backdrop"
            onClick={() => setSheetOpen(false)}
          />
          <div className="bottom-sheet" role="dialog" aria-label="Session details">
            <div
              className="bottom-sheet-handle"
              onClick={() => setSheetOpen(false)}
            />
            <div className="px-5 pb-6">
              <h3 className="font-display text-sm font-semibold text-sapphire-200 mb-4">
                Session Details
              </h3>
              <div className="space-y-4">
                <SessionDetailRow
                  label="Session ID"
                  value={result.sessionId}
                  mono
                />
                <SessionDetailRow
                  label="Analysis Time"
                  value={new Date(result.timestamp).toLocaleString()}
                />
                <SessionDetailRow
                  label="Data Points Analyzed"
                  value={dataPointsCount.toLocaleString()}
                  mono
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Helpers ──

function SummaryChip({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <span className="text-[10px] font-medium uppercase tracking-widest text-sapphire-600">
        {label}
      </span>
      <span className="font-mono text-xs sm:text-sm font-semibold text-sapphire-200">
        {value}
      </span>
    </div>
  );
}

function AnimatedNumber({
  value,
  decimals = 0,
  delay = 0,
}: {
  value: number;
  decimals?: number;
  delay?: number;
}) {
  const animated = useCountUp(value, { duration: 1200, delay, decimals });
  return (
    <>
      {decimals > 0
        ? animated.toFixed(decimals)
        : animated.toLocaleString()}
    </>
  );
}

function SessionDetailsCard({
  result,
  dataPointsCount,
}: {
  result: OBD2AnalysisResult;
  dataPointsCount: number;
}) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-sapphire-500 uppercase tracking-wider font-medium">
              Session ID
            </span>
            <p className="mt-1 font-mono text-sapphire-300 truncate">
              {result.sessionId}
            </p>
          </div>
          <div>
            <span className="text-sapphire-500 uppercase tracking-wider font-medium">
              Analysis time
            </span>
            <p className="mt-1 text-sapphire-300">
              {new Date(result.timestamp).toLocaleString()}
            </p>
          </div>
          <div>
            <span className="text-sapphire-500 uppercase tracking-wider font-medium">
              Data points analyzed
            </span>
            <p className="mt-1 font-mono text-sapphire-300">
              {dataPointsCount.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SessionDetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-wider text-sapphire-500">
        {label}
      </span>
      <span
        className={`text-sm text-sapphire-200 truncate ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function shortLabel(cat: string): string {
  const map: Record<string, string> = {
    motion: "Motion",
    engine: "Engine",
    fuel: "Fuel",
    airIntake: "Air",
    power: "Power",
    transmission: "Trans",
    abs: "ABS",
    awd: "AWD",
    electrical: "Elec",
  };
  return map[cat] ?? cat;
}
