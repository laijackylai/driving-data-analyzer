"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { CategoryPanel } from "@/components/features/CategoryPanel";
import { Card, CardContent } from "@/components/ui/Card";
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
  DataSource,
  CobbAnalysisResult,
  CobbMetadata,
} from "@/types";
import { formatDuration } from "@/lib/utils";
import { useCountUp } from "@/hooks/useCountUp";
import { TimeRangeProvider } from "@/hooks/useTimeRange";
import { useActiveSection } from "@/hooks/useActiveSection";
import { TimelineSlider } from "@/components/features/TimelineSlider";
import { LandingView } from "@/components/features/LandingView";
import { DotLoader } from "@/components/features/DotLoader";
import { PixelizeEffect } from "@/components/features/PixelizeEffect";

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
import { CobbBoostTab } from "@/components/features/tabs/CobbBoostTab";
import { CobbKnockTab } from "@/components/features/tabs/CobbKnockTab";
import { CobbAFRTab } from "@/components/features/tabs/CobbAFRTab";
import { CobbWastegateTab } from "@/components/features/tabs/CobbWastegateTab";
import { CobbInjectorTab } from "@/components/features/tabs/CobbInjectorTab";
import { CobbAVCSTab } from "@/components/features/tabs/CobbAVCSTab";

// ── View state machine ──

type ViewState = "landing" | "analyzing" | "dashboard";

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

// scroll-margin-top to account for sticky tab bar (~52px)
const SCROLL_MARGIN = "scroll-mt-14";

// Categories that only appear in OBD2 mode (hidden for COBB files)
const OBD2_ONLY_CATS = new Set([
  "engine", "fuel", "transmission", "power", "drivingBehavior",
  "abs", "awd", "electrical", "airIntake",
]);

// Categories that only appear in COBB mode (hidden for OBD2 files)
const COBB_ONLY_CATS = new Set([
  "cobbBoost", "cobbKnock", "cobbAFR", "cobbWastegate", "cobbInjector", "cobbAVCS",
]);

function DashboardContent({
  result,
  timeSeries,
  gps,
  derived,
  thresholds,
  onHomeClick,
  dataSource,
  cobbResult,
  cobbMetadata,
}: {
  result: OBD2AnalysisResult;
  timeSeries: OBD2DataPoint[];
  gps: GPSDataPoint[];
  derived: DerivedMetrics;
  thresholds: ThresholdConfig;
  onHomeClick: () => void;
  dataSource: DataSource;
  cobbResult: CobbAnalysisResult | null;
  cobbMetadata: CobbMetadata | null;
}) {
  const hasChartData = timeSeries.length > 0;

  const visibleCategories = CATEGORY_ORDER.filter((cat) =>
    dataSource === "cobb" ? !OBD2_ONLY_CATS.has(cat) : !COBB_ONLY_CATS.has(cat)
  );
  const { activeSection, scrollToSection } = useActiveSection(visibleCategories as readonly string[]);

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
              {visibleCategories.map((cat) => {
                const isActive = activeSection === cat;
                return (
                  <button
                    key={cat}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => scrollToSection(cat)}
                    className={[
                      "relative whitespace-nowrap min-h-[40px] px-3 py-2 rounded-lg",
                      "text-base font-black font-brand",
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

        {/* OBD2-only sections — not rendered for COBB files */}
        {dataSource !== "cobb" && (
          <>
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
          </>
        )}

        {/* COBB-only sections — not rendered for OBD2 files */}
        {dataSource === "cobb" && cobbResult && (
          <>
            {/* #cobbBoost */}
            <section id="cobbBoost" className={SCROLL_MARGIN}>
              {hasChartData && (
                <CobbBoostTab timeSeries={timeSeries} stats={cobbResult.boost} />
              )}
            </section>

            {/* #cobbKnock */}
            <section id="cobbKnock" className={SCROLL_MARGIN}>
              {hasChartData && (
                <CobbKnockTab timeSeries={timeSeries} stats={cobbResult.knock} />
              )}
            </section>

            {/* #cobbAFR */}
            <section id="cobbAFR" className={SCROLL_MARGIN}>
              {hasChartData && (
                <CobbAFRTab timeSeries={timeSeries} stats={cobbResult.afr} />
              )}
            </section>

            {/* #cobbWastegate */}
            <section id="cobbWastegate" className={SCROLL_MARGIN}>
              {hasChartData && (
                <CobbWastegateTab timeSeries={timeSeries} stats={cobbResult.wastegate} />
              )}
            </section>

            {/* #cobbInjector */}
            <section id="cobbInjector" className={SCROLL_MARGIN}>
              {hasChartData && (
                <CobbInjectorTab timeSeries={timeSeries} stats={cobbResult.injector} />
              )}
            </section>

            {/* #cobbAVCS */}
            <section id="cobbAVCS" className={SCROLL_MARGIN}>
              {hasChartData && (
                <CobbAVCSTab timeSeries={timeSeries} stats={cobbResult.avcs} />
              )}
            </section>
          </>
        )}

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
  const [showDotLoader, setShowDotLoader] = useState(true);
  const [snapshotUrl, setSnapshotUrl] = useState<string>("/landing-snapshot.png");
  const [dashboardSnapshotUrl, setDashboardSnapshotUrl] = useState<string | null>(null);
  const dashboardCaptureRef = useRef<HTMLDivElement>(null);

  const [result, setResult] = useState<OBD2AnalysisResult | null>(null);
  const [timeSeries, setTimeSeries] = useState<OBD2DataPoint[]>([]);
  const [gps, setGps] = useState<GPSDataPoint[]>([]);
  const [derived, setDerived] = useState<DerivedMetrics | null>(null);
  const [thresholds, setThresholds] = useState<ThresholdConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>("obd2");
  const [cobbResult, setCobbResult] = useState<CobbAnalysisResult | null>(null);
  const [cobbMetadata, setCobbMetadata] = useState<CobbMetadata | null>(null);

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

      const derivedData = data.derived ?? null;
      const thresholdsData = data.thresholds ?? null;

      setResult(data.result);
      setTimeSeries(data.timeSeries ?? []);
      setGps(data.gps ?? []);
      setDerived(derivedData);
      setThresholds(thresholdsData);
      setDataSource(data.dataSource ?? "obd2");
      setCobbResult(data.cobbResult ?? null);
      setCobbMetadata(data.cobbMetadata ?? null);

      if (!derivedData || !thresholdsData) {
        setError("Analysis failed");
        setViewState("landing");
        return;
      }
      // Stay in "analyzing" — the capture useEffect will trigger phase "out" automatically
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setViewState("landing");
    }
  }, []); // empty deps — all deps are stable state setters from useState

  // Capture live DOM snapshot of the landing view before transitioning.
  // html-to-image reads computed styles so it works at any viewport size.
  // Falls back to the static /landing-snapshot.png if capture fails.
  const capturingRef = useRef(false);
  const handleFileSelect = useCallback(async (file: File) => {
    if (!capturingRef.current) {
      capturingRef.current = true;
      try {
        const { toPng } = await import("html-to-image");
        const dataUrl = await toPng(document.documentElement, {
          width: window.innerWidth,
          height: window.innerHeight,
          pixelRatio: 1,
          skipAutoScale: true,
          skipFonts: true,
        });
        setSnapshotUrl(dataUrl);
      } catch {
        // fallback: keep the static snapshot
      }
      capturingRef.current = false;
    }
    setViewState("analyzing");
    analyzeFile(file);
  }, [analyzeFile]);

  const handleBeforeDashboardReveal = useCallback(() => {
    setShowDotLoader(false);
  }, []);

  const handleDashboardReveal = useCallback(() => {
    setViewState("dashboard");
  }, []);

  const handleHomeClick = useCallback(() => {
    setShowDotLoader(true);
    setResult(null);
    setTimeSeries([]);
    setGps([]);
    setDerived(null);
    setThresholds(null);
    setError(null);
    setDashboardSnapshotUrl(null);
    setViewState("landing");
  }, []);

  const hasAllData = result && derived && thresholds;

  // When API returns (hasAllData becomes true while still in "analyzing"),
  // capture the dashboard div rendered behind the PixelizeEffect canvas,
  // then hand it to PixelizeEffect as targetSnapshotUrl to trigger coarse→fine.
  useEffect(() => {
    if (viewState !== "analyzing" || !hasAllData || dashboardSnapshotUrl !== null) return;
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const { toPng } = await import("html-to-image");
        const el = dashboardCaptureRef.current ?? document.documentElement;
        const url = await toPng(el, {
          width: window.innerWidth,
          height: window.innerHeight,
          pixelRatio: 1,
          skipAutoScale: true,
          skipFonts: true,
        });
        if (active) setDashboardSnapshotUrl(url);
      } catch {
        if (active) setDashboardSnapshotUrl(snapshotUrl); // fallback
      }
    }, 50);
    return () => { active = false; clearTimeout(timer); };
  }, [viewState, hasAllData, dashboardSnapshotUrl, snapshotUrl]);

  return (
    <TimeRangeProvider>
      <div className="min-h-screen bg-sapphire-950">
        {viewState === "landing" && (
          <LandingView onFileSelect={handleFileSelect} />
        )}

        {viewState === "analyzing" && (
          <>
            {/* Canvas: fine→coarse on landing snapshot, then coarse→fine on dashboard snapshot */}
            <PixelizeEffect
              snapshotUrl={snapshotUrl}
              targetSnapshotUrl={dashboardSnapshotUrl}
              onBeforeComplete={handleBeforeDashboardReveal}
              onComplete={handleDashboardReveal}
            />
            {/* DotLoader hides 50ms before phase-out completes */}
            {showDotLoader && (
              <div className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-none">
                <DotLoader />
              </div>
            )}
          </>
        )}

        {/* Dashboard content:
            - "analyzing + hasAllData": rendered behind the PixelizeEffect canvas for capture
            - "dashboard": fully visible */}
        {((viewState === "analyzing" && !!hasAllData) || viewState === "dashboard") && result && derived && thresholds && (
          <div ref={dashboardCaptureRef}>
            {/* ── Non-sticky header ── */}
            <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
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
              dataSource={dataSource}
              cobbResult={cobbResult}
              cobbMetadata={cobbMetadata}
            />
          </div>
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
