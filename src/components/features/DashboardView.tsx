"use client";

import { useState } from "react";
import { FileUpload } from "@/components/features/FileUpload";
import { CategoryPanel } from "@/components/features/CategoryPanel";
import { Card, CardContent } from "@/components/ui/Card";
import { SafetyGauge } from "@/components/ui/SafetyGauge";
import {
  CategoryIcon,
  CATEGORY_LABELS,
  CATEGORY_SHORT_LABELS,
  CATEGORY_ORDER,
} from "@/components/ui/CategoryIcon";
import {
  OBD2AnalysisResult,
  OBD2DataPoint,
  GPSDataPoint,
  DerivedMetrics,
  ThresholdConfig,
  ExtendedAnalysisResponse,
  CategoryMetricsType,
} from "@/types";
import { formatDuration } from "@/lib/utils";
import { useCountUp } from "@/hooks/useCountUp";
import { TimeRangeProvider } from "@/hooks/useTimeRange";
import { useActiveSection } from "@/hooks/useActiveSection";
import { TimelineSlider } from "@/components/features/TimelineSlider";

// Tab components
import { OverviewTab } from "@/components/features/tabs/OverviewTab";
import { EngineTab } from "@/components/features/tabs/EngineTab";
import { FuelTab } from "@/components/features/tabs/FuelTab";
import { TransmissionTab } from "@/components/features/tabs/TransmissionTab";
import { PowerTab } from "@/components/features/tabs/PowerTab";
import { DrivingBehaviorTab } from "@/components/features/tabs/DrivingBehaviorTab";
import { ABSTab } from "@/components/features/tabs/ABSTab";
import { AWDTab } from "@/components/features/tabs/AWDTab";
import { ElectricalTab } from "@/components/features/tabs/ElectricalTab";
import { AirIntakeTab } from "@/components/features/tabs/AirIntakeTab";

// RESULT_KEY_MAP maps category keys to OBD2AnalysisResult keys for CategoryPanel
const RESULT_KEY_MAP: Partial<Record<(typeof CATEGORY_ORDER)[number], keyof OBD2AnalysisResult>> = {
  engine: "engine",
  fuel: "fuel",
  transmission: "transmission",
  power: "power",
  abs: "abs",
  awd: "awd",
  electrical: "electrical",
  airIntake: "airIntake",
};

// Categories that appear in the summary grid (have CategoryPanel data)
const SUMMARY_CATEGORIES = ["engine", "fuel", "transmission", "power", "abs", "awd", "electrical", "airIntake"] as const;

// Section IDs in scroll order — matches CATEGORY_ORDER
const SECTION_IDS = CATEGORY_ORDER as readonly string[];

// scroll-margin-top to account for sticky tab bar (~52px)
const SCROLL_MARGIN = "scroll-mt-14";

function DashboardContent({
  result,
  timeSeries,
  gps,
  derived,
  thresholds,
}: {
  result: OBD2AnalysisResult;
  timeSeries: OBD2DataPoint[];
  gps: GPSDataPoint[];
  derived: DerivedMetrics;
  thresholds: ThresholdConfig;
}) {
  const { activeSection, scrollToSection } = useActiveSection(SECTION_IDS);
  const hasChartData = timeSeries.length > 0;

  return (
    <>
      {/* ── Sticky Tab Bar ── */}
      <div className="sticky top-0 z-50 border-b border-glass-edge bg-sapphire-950/85 backdrop-blur-md">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          {/* Fade edges for horizontal overflow */}
          <div className="relative">
            <div
              className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 z-10 bg-gradient-to-r from-sapphire-950/85 to-transparent"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 z-10 bg-gradient-to-l from-sapphire-950/85 to-transparent"
              aria-hidden="true"
            />
            <div
              role="tablist"
              className="flex gap-1 overflow-x-auto px-1 py-2 scrollbar-none"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {CATEGORY_ORDER.map((cat) => {
                const isActive = activeSection === cat;
                return (
                  <button
                    key={cat}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => scrollToSection(cat)}
                    className={[
                      "relative whitespace-nowrap min-h-[40px] px-3 py-2 rounded-lg",
                      "text-sm font-medium font-body",
                      "transition-all duration-200 ease-out",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sapphire-500/50",
                      "flex items-center gap-1.5 shrink-0",
                      isActive
                        ? "bg-sapphire-700/60 text-sapphire-100 shadow-[0_1px_4px_rgba(10,22,40,0.4)] border border-[rgba(54,112,198,0.2)]"
                        : "text-sapphire-400 hover:text-sapphire-200 hover:bg-sapphire-800/40 border border-transparent",
                    ].join(" ")}
                  >
                    <CategoryIcon category={cat} size={15} />
                    <span className="hidden sm:inline">{CATEGORY_LABELS[cat]}</span>
                    <span className="sm:hidden">{CATEGORY_SHORT_LABELS[cat]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── All sections ── */}
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 pb-6">

        {/* #summary — CategoryPanel grid */}
        <section id="summary" className={SCROLL_MARGIN}>
          <div className="py-5 sm:py-6">
            <h2 className="text-xs font-medium uppercase tracking-widest text-sapphire-500 mb-4">
              Category Summary
            </h2>
            <div className="space-y-3">
              {SUMMARY_CATEGORIES.map((cat) => {
                const resultKey = RESULT_KEY_MAP[cat];
                if (!resultKey) return null;
                return (
                  <CategoryPanel
                    key={cat}
                    category={cat}
                    metrics={result[resultKey] as CategoryMetricsType}
                  />
                );
              })}
            </div>
          </div>
        </section>

        {/* #overview */}
        <section id="overview" className={SCROLL_MARGIN}>
          {hasChartData && (
            <OverviewTab timeSeries={timeSeries} gps={gps} />
          )}
        </section>

        {/* #engine */}
        <section id="engine" className={SCROLL_MARGIN}>
          {hasChartData && (
            <EngineTab timeSeries={timeSeries} thresholds={thresholds} />
          )}
        </section>

        {/* #fuel */}
        <section id="fuel" className={SCROLL_MARGIN}>
          {hasChartData && (
            <FuelTab timeSeries={timeSeries} derived={derived} thresholds={thresholds} />
          )}
        </section>

        {/* #transmission */}
        <section id="transmission" className={SCROLL_MARGIN}>
          {hasChartData && (
            <TransmissionTab timeSeries={timeSeries} derived={derived} thresholds={thresholds} />
          )}
        </section>

        {/* #power */}
        <section id="power" className={SCROLL_MARGIN}>
          {hasChartData && <PowerTab timeSeries={timeSeries} />}
        </section>

        {/* #drivingBehavior */}
        <section id="drivingBehavior" className={SCROLL_MARGIN}>
          {hasChartData && <DrivingBehaviorTab timeSeries={timeSeries} />}
        </section>

        {/* #abs */}
        <section id="abs" className={SCROLL_MARGIN}>
          {hasChartData && <ABSTab timeSeries={timeSeries} derived={derived} />}
        </section>

        {/* #awd */}
        <section id="awd" className={SCROLL_MARGIN}>
          {hasChartData && <AWDTab timeSeries={timeSeries} />}
        </section>

        {/* #electrical */}
        <section id="electrical" className={SCROLL_MARGIN}>
          {hasChartData && <ElectricalTab timeSeries={timeSeries} thresholds={thresholds} />}
        </section>

        {/* #airIntake */}
        <section id="airIntake" className={SCROLL_MARGIN}>
          {hasChartData && <AirIntakeTab timeSeries={timeSeries} thresholds={thresholds} />}
        </section>

        {/* Session details — below last section, above timeline */}
        <div className="mt-6">
          <SessionDetailsCard result={result} />
        </div>
      </div>

      {/* ── Timeline Slider (sticky bottom) ── */}
      {hasChartData && <TimelineSlider timeSeries={timeSeries} />}
    </>
  );
}

export function DashboardView() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<OBD2AnalysisResult | null>(null);
  const [timeSeries, setTimeSeries] = useState<OBD2DataPoint[]>([]);
  const [gps, setGps] = useState<GPSDataPoint[]>([]);
  const [derived, setDerived] = useState<DerivedMetrics | null>(null);
  const [thresholds, setThresholds] = useState<ThresholdConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleFileSelect = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setTimeSeries([]);
    setGps([]);
    setDerived(null);
    setThresholds(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data: ExtendedAnalysisResponse & { error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze data");
      }

      setResult(data.result);
      setTimeSeries(data.timeSeries ?? []);
      setGps(data.gps ?? []);
      setDerived(data.derived ?? null);
      setThresholds(data.thresholds ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const hasAllData = result && derived && thresholds;

  return (
    <TimeRangeProvider>
      <div className="min-h-screen bg-sapphire-950">
        {/* ── Non-sticky header ── */}
        <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
          <h1 className="font-display text-lg sm:text-2xl font-bold text-sapphire-100 tracking-tight mb-5 sm:mb-6">
            OBD2 Dashboard
          </h1>

          {/* ── File upload ── */}
          <div className="mb-6 sm:mb-8">
            <FileUpload onFileSelect={handleFileSelect} />
          </div>

          {/* ── Loading state ── */}
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
                    <p className="text-sm font-semibold text-accent-red-400">Analysis Failed</p>
                    <p className="mt-1 text-xs text-sapphire-400 leading-relaxed">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Trip summary header (scrolls away) ── */}
          {result && (
            <div className="space-y-5 sm:space-y-6">
              <div
                className="animate-fade-up opacity-0 flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 px-0.5"
                style={{ animationDelay: "0ms" }}
              >
                <SummaryChip label="Duration" value={formatDuration(result.motion.durationSeconds)} />
                <SummaryChip
                  label="Distance"
                  value={
                    result.motion.totalDistance !== null ? (
                      <>
                        <AnimatedNumber value={result.motion.totalDistance} decimals={1} delay={200} />{" "}
                        km
                      </>
                    ) : "—"
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
                  value={<AnimatedNumber value={result.dataPointCount} delay={400} />}
                />
              </div>

              <div
                className="animate-fade-up opacity-0 flex justify-center py-1 sm:py-2"
                style={{ animationDelay: "150ms" }}
              >
                <SafetyGauge score={result.safetyScore} size={180} strokeWidth={12} />
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
                <h3 className="text-base font-semibold text-sapphire-200 mb-1">No Data Yet</h3>
                <p className="text-sm text-sapphire-500">
                  Upload an OBD2 CSV file to start analyzing your driving data.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Dashboard content (sticky nav + all sections + timeline) ── */}
        {hasAllData && (
          <DashboardContent
            result={result}
            timeSeries={timeSeries}
            gps={gps}
            derived={derived}
            thresholds={thresholds}
          />
        )}

        {/* ── Mobile bottom sheet for session details ── */}
        {sheetOpen && result && (
          <>
            <div
              className="bottom-sheet-backdrop"
              role="button"
              tabIndex={0}
              aria-label="Close session details"
              onClick={() => setSheetOpen(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSheetOpen(false);
                }
              }}
            />
            <div className="bottom-sheet" role="dialog" aria-label="Session details">
              <div className="bottom-sheet-handle" onClick={() => setSheetOpen(false)} />
              <div className="px-5 pb-6">
                <h3 className="font-display text-sm font-semibold text-sapphire-200 mb-4">
                  Session Details
                </h3>
                <div className="space-y-4">
                  <SessionDetailRow label="Session ID" value={result.sessionId} mono />
                  <SessionDetailRow
                    label="Analysis Time"
                    value={new Date(result.timestamp).toLocaleString()}
                  />
                  <SessionDetailRow
                    label="Data Points Analyzed"
                    value={result.dataPointCount.toLocaleString()}
                    mono
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </TimeRangeProvider>
  );
}

// ── Helpers ──

function SummaryChip({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <span className="text-[10px] font-medium uppercase tracking-widest text-sapphire-600">
        {label}
      </span>
      <span className="font-mono text-xs sm:text-sm font-semibold text-sapphire-200">{value}</span>
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
  return <>{decimals > 0 ? animated.toFixed(decimals) : animated.toLocaleString()}</>;
}

function SessionDetailsCard({ result }: { result: OBD2AnalysisResult }) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-sapphire-500 uppercase tracking-wider font-medium">Session ID</span>
            <p className="mt-1 font-mono text-sapphire-300 truncate">{result.sessionId}</p>
          </div>
          <div>
            <span className="text-sapphire-500 uppercase tracking-wider font-medium">Analysis time</span>
            <p className="mt-1 text-sapphire-300">{new Date(result.timestamp).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-sapphire-500 uppercase tracking-wider font-medium">Data points analyzed</span>
            <p className="mt-1 font-mono text-sapphire-300">{result.dataPointCount.toLocaleString()}</p>
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
      <span className={`text-sm text-sapphire-200 truncate ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}
