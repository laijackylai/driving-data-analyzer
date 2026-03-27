"use client";

import { useState, useRef, useCallback } from "react";
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
  ViewState,
} from "@/types";
import { formatDuration } from "@/lib/utils";
import { useCountUp } from "@/hooks/useCountUp";
import { TimeRangeProvider } from "@/hooks/useTimeRange";
import { useActiveSection } from "@/hooks/useActiveSection";
import { TimelineSlider } from "@/components/features/TimelineSlider";
import { LandingView } from "@/components/features/LandingView";
import { DotLoader } from "@/components/features/DotLoader";
import { PixelTransition } from "@/components/features/PixelTransition";

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
  onHomeClick,
}: {
  result: OBD2AnalysisResult;
  timeSeries: OBD2DataPoint[];
  gps: GPSDataPoint[];
  derived: DerivedMetrics;
  thresholds: ThresholdConfig;
  onHomeClick: () => void;
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
                /* istanbul ignore next — all SUMMARY_CATEGORIES have RESULT_KEY_MAP entries */
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
      {hasChartData && <TimelineSlider timeSeries={timeSeries} onHomeClick={onHomeClick} />}
    </>
  );
}

export function DashboardView() {
  const [viewState, setViewState] = useState<ViewState>("landing");
  const pendingFileRef = useRef<File | null>(null);

  const [result, setResult] = useState<OBD2AnalysisResult | null>(null);
  const [timeSeries, setTimeSeries] = useState<OBD2DataPoint[]>([]);
  const [gps, setGps] = useState<GPSDataPoint[]>([]);
  const [derived, setDerived] = useState<DerivedMetrics | null>(null);
  const [thresholds, setThresholds] = useState<ThresholdConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeFile = useCallback(async (file: File) => {
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data: ExtendedAnalysisResponse & { error?: string } = await response.json();

      if (!response.ok) {
        setError(data.error || "Analysis failed");
        setViewState("landing");
        return;
      }

      setResult(data.result);
      setTimeSeries(data.timeSeries ?? []);
      setGps(data.gps ?? []);
      setDerived(data.derived ?? null);
      setThresholds(data.thresholds ?? null);
      setViewState("dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setViewState("landing");
    }
  }, []); // empty deps — all deps are stable state setters from useState

  const handleFileSelect = (file: File) => {
    pendingFileRef.current = file;
    setViewState("dissolving");
  };

  const handleDissolveComplete = useCallback(() => {
    /* istanbul ignore next — defensive guard; pendingFileRef is always set before dissolving */
    if (!pendingFileRef.current) {
      setViewState("landing");
      return;
    }
    setViewState("analyzing");
    analyzeFile(pendingFileRef.current);
  }, [analyzeFile]);

  const handleHomeClick = useCallback(() => {
    setResult(null);
    setTimeSeries([]);
    setGps([]);
    setDerived(null);
    setThresholds(null);
    setError(null);
    setViewState("landing");
  }, []);

  const hasAllData = result && derived && thresholds;

  return (
    <TimeRangeProvider>
      <div className="min-h-screen bg-sapphire-950">
        {viewState === "landing" && (
          <LandingView onFileSelect={handleFileSelect} />
        )}

        {viewState === "dissolving" && (
          <PixelTransition active={true} onComplete={handleDissolveComplete}>
            <LandingView onFileSelect={handleFileSelect} />
          </PixelTransition>
        )}

        {viewState === "analyzing" && (
          <div className="h-screen flex items-center justify-center">
            <DotLoader />
          </div>
        )}

        {viewState === "dashboard" && hasAllData && (
          <>
            {/* ── Non-sticky header ── */}
            <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
              {/* ── Trip summary header (scrolls away) ── */}
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
            </div>

            {/* ── Dashboard content (sticky nav + all sections + timeline) ── */}
            <DashboardContent
              result={result}
              timeSeries={timeSeries}
              gps={gps}
              derived={derived}
              thresholds={thresholds}
              onHomeClick={handleHomeClick}
            />
          </>
        )}

        {/* Error toast — shown on landing after a failed analysis */}
        {viewState === "landing" && error && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
            <div className="glass-card px-4 py-3 border-accent-red-500/30">
              <p className="text-xs text-accent-red-400">{error}</p>
            </div>
          </div>
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
