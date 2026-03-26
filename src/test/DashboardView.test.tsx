import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { DashboardView } from "@/components/features/DashboardView";

// Mock fetch for API calls and demo file
const mockFetch = vi.fn();
global.fetch = mockFetch;

// html-to-image is not runnable in jsdom — return a stable data URL for both
// the landing capture (handleFileSelect) and the dashboard capture (revealing useEffect)
vi.mock("html-to-image", () => ({
  toPng: vi.fn().mockResolvedValue("data:image/png;base64,FAKE"),
}));

// jsdom doesn't implement IntersectionObserver — stub it out with a class
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(_callback: IntersectionObserverCallback) {}
}
vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

// Mock child components to isolate state machine testing
vi.mock("@/components/features/LandingView", () => ({
  LandingView: ({ onFileSelect }: { onFileSelect: (f: File) => void }) => (
    <div data-testid="landing-view">
      <button onClick={() => onFileSelect(new File(["csv"], "test.csv", { type: "text/csv" }))}>
        mock-upload
      </button>
    </div>
  ),
}));

vi.mock("@/components/features/DotLoader", () => ({
  DotLoader: () => <div data-testid="dot-loader" />,
}));

// PixelizeEffect: phase="in" is passive (no callback), phase="out" auto-completes immediately
vi.mock("@/components/features/PixelizeEffect", () => ({
  PixelizeEffect: ({
    targetSnapshotUrl,
    onComplete,
  }: {
    snapshotUrl: string;
    targetSnapshotUrl?: string | null;
    onComplete?: () => void;
  }) => {
    // Auto-trigger completion when dashboard snapshot arrives (phase "out")
    if (targetSnapshotUrl && onComplete) {
      setTimeout(onComplete, 0);
    }
    return <div data-testid={targetSnapshotUrl ? "pixelize-effect-out" : "pixelize-effect-in"} />;
  },
}));

// Minimal mock result matching actual OBD2AnalysisResult + ExtendedAnalysisResponse shapes
const makeMockResult = (overrides?: object) => ({
  result: {
    sessionId: "test-session",
    startTime: 1000,
    endTime: 1060,
    dataPointCount: 100,
    safetyScore: 85,
    timestamp: new Date().toISOString(),
    motion: {
      avgSpeed: 50,
      maxSpeed: 100,
      totalDistance: 5,
      durationSeconds: 60,
      durationMinutes: 1,
      harshBrakingEvents: 0,
      rapidAccelerationEvents: 0,
      avgAcceleration: null,
      maxAcceleration: null,
    },
    engine: {
      avgRpm: null, maxRpm: null, avgLoad: null, maxLoad: null,
      avgCoolantTemp: null, maxCoolantTemp: null, avgOilTemp: null,
      maxOilTemp: null, avgTimingAdvance: null, avgKnockCorrection: null,
    },
    fuel: {
      avgFuelConsumption: null, avgFuelConsumptionTotal: null,
      avgInstantFuelRate: null, maxInstantFuelRate: null,
      totalFuelUsed: null, totalFuelCost: null,
      avgShortTermFuelTrim: null, avgLongTermFuelTrim: null, avgFuelAirRatio: null,
    },
    transmission: {
      avgCvtTemp: null, maxCvtTemp: null, avgGearRatio: null,
      avgPrimaryPulleySpeed: null, avgSecondaryPulleySpeed: null,
      avgTurbineSpeed: null, avgLockUpDutyRatio: null,
    },
    power: { avgPowerFuel: null, maxPowerFuel: null, avgPowerMaf: null, maxPowerMaf: null },
    abs: {
      avgFrontLeftWheelSpeed: null, avgFrontRightWheelSpeed: null,
      avgRearLeftWheelSpeed: null, avgRearRightWheelSpeed: null,
      maxSteeringAngle: null, avgSteeringAngle: null,
    },
    awd: { avgSolenoidActualCurrent: null, maxSolenoidActualCurrent: null, avgSolenoidSetCurrent: null },
    electrical: { avgBatteryVoltage: null, minBatteryVoltage: null, maxBatteryVoltage: null },
    airIntake: {
      avgMafAirFlow: null, maxMafAirFlow: null, avgBoost: null, maxBoost: null,
      avgIntakeTemp: null, avgThrottlePosition: null, maxThrottlePosition: null, avgManifoldPressure: null,
    },
    ...overrides,
  },
  timeSeries: [] as object[],
  gps: [],
  derived: {
    wheelSpeedDiffs: [],
    cvtEffectiveRatio: [],
    fuelBySpeedBucket: [],
    engineZones: [],
    awdEngagementEvents: [],
    fuelDistanceSeries: [],
  },
  thresholds: {
    engineRpm: { normal: [0, 6000], warning: [6000, 7000], danger: [7000, 10000] },
    coolantTemp: { normal: [70, 100], warning: [100, 110], danger: [110, 130] },
    oilTemp: { normal: [70, 120], warning: [120, 140], danger: [140, 160] },
    cvtTemp: { normal: [0, 130], warning: [130, 150], danger: [150, 200] },
    batteryVoltage: { normal: [12, 15], warning: [11, 12], danger: [0, 11] },
    calculatedBoost: { normal: [0, 15], warning: [15, 20], danger: [20, 30] },
    knockCorrection: { normal: [-5, 5], warning: [-10, -5], danger: [-15, -10] },
    shortTermFuelTrim: { normal: [-10, 10], warning: [10, 20], danger: [20, 30] },
    longTermFuelTrim: { normal: [-10, 10], warning: [10, 20], danger: [20, 30] },
    mafAirFlowRate: { normal: [0, 200], warning: [200, 250], danger: [250, 300] },
  },
});

describe("DashboardView state machine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("starts in LANDING state", () => {
    render(<DashboardView />);
    expect(screen.getByTestId("landing-view")).toBeInTheDocument();
  });

  it("does not show dot loader in LANDING state", () => {
    render(<DashboardView />);
    expect(screen.queryByTestId("dot-loader")).not.toBeInTheDocument();
  });

  it("transitions to ANALYZING immediately on file select", async () => {
    const user = userEvent.setup();
    // Mock a pending fetch — never resolves, keeps us in analyzing state
    mockFetch.mockReturnValueOnce(new Promise<never>(() => {}));

    render(<DashboardView />);
    await user.click(screen.getByText("mock-upload"));

    // Dot loader and pixelize-in appear immediately (no intermediate dissolve step)
    expect(screen.getByTestId("dot-loader")).toBeInTheDocument();
    expect(screen.getByTestId("pixelize-effect-in")).toBeInTheDocument();
  });

  it("transitions to DASHBOARD on successful analysis", async () => {
    const user = userEvent.setup();
    const mockResult = makeMockResult();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResult),
    });

    render(<DashboardView />);
    await user.click(screen.getByText("mock-upload"));

    // API resolves → revealing → PixelizeEffect phase="out" auto-completes → dashboard
    await vi.waitFor(() => {
      expect(screen.queryByTestId("landing-view")).not.toBeInTheDocument();
      expect(screen.queryByTestId("dot-loader")).not.toBeInTheDocument();
      expect(screen.queryByTestId("pixelize-effect-out")).not.toBeInTheDocument();
    });
  });

  it("returns to LANDING when error occurs", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Bad file" }),
    });

    render(<DashboardView />);
    await user.click(screen.getByText("mock-upload"));

    await vi.waitFor(() => {
      expect(screen.getByTestId("landing-view")).toBeInTheDocument();
    });
  });

  it("returns to LANDING and shows error when fetch throws (catch branch)", async () => {
    const user = userEvent.setup();
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    render(<DashboardView />);
    await user.click(screen.getByText("mock-upload"));

    await vi.waitFor(() => {
      expect(screen.getByTestId("landing-view")).toBeInTheDocument();
    });
  });

  it("returns to LANDING when fetch throws a non-Error value", async () => {
    const user = userEvent.setup();
    mockFetch.mockRejectedValueOnce("string error");

    render(<DashboardView />);
    await user.click(screen.getByText("mock-upload"));

    await vi.waitFor(() => {
      expect(screen.getByTestId("landing-view")).toBeInTheDocument();
    });
  });

  it("returns to LANDING when home button is clicked from DASHBOARD", async () => {
    const user = userEvent.setup();
    const mockResult = makeMockResult();
    mockResult.timeSeries = [
      { timestamp: 1000, vehicleSpeed: 50 },
      { timestamp: 1060, vehicleSpeed: 60 },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResult),
    });

    render(<DashboardView />);

    // Reach DASHBOARD state
    await user.click(screen.getByText("mock-upload"));
    await vi.waitFor(() => {
      expect(screen.queryByTestId("landing-view")).not.toBeInTheDocument();
      expect(screen.queryByTestId("pixelize-effect-out")).not.toBeInTheDocument();
    });

    // Click the home button on the TimelineSlider
    const homeButton = screen.getByRole("button", { name: /return to landing/i });
    await user.click(homeButton);

    await vi.waitFor(() => {
      expect(screen.getByTestId("landing-view")).toBeInTheDocument();
    });
  });

  it("clicking a tab button in DASHBOARD calls scrollToSection", async () => {
    const user = userEvent.setup();
    const mockResult = makeMockResult();

    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResult),
    });

    render(<DashboardView />);
    await user.click(screen.getByText("mock-upload"));

    await vi.waitFor(() => {
      expect(screen.queryByTestId("dot-loader")).not.toBeInTheDocument();
      expect(screen.queryByTestId("landing-view")).not.toBeInTheDocument();
    });

    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toBeGreaterThan(0);
    await user.click(tabs[0]);
  });

  it("shows error toast when analysis fails and viewState is landing", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Parse error" }),
    });

    render(<DashboardView />);
    await user.click(screen.getByText("mock-upload"));

    await vi.waitFor(() => {
      expect(screen.getByTestId("landing-view")).toBeInTheDocument();
      expect(screen.getByText(/parse error/i)).toBeInTheDocument();
    });
  });

  it("falls back to 'Analysis failed' when error response has no error field (|| branch)", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({}),
    });

    render(<DashboardView />);
    await user.click(screen.getByText("mock-upload"));

    await vi.waitFor(() => {
      expect(screen.getByTestId("landing-view")).toBeInTheDocument();
      expect(screen.getByText(/analysis failed/i)).toBeInTheDocument();
    });
  });

  it("handles null timeSeries/gps/derived/thresholds in API response (?? branches)", async () => {
    const user = userEvent.setup();
    const mockResult = makeMockResult();
    mockResult.result.motion.totalDistance = null;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        result: mockResult.result,
        // timeSeries, gps, derived, thresholds all absent
      }),
    });

    render(<DashboardView />);
    await user.click(screen.getByText("mock-upload"));

    // hasAllData is false → dashboard doesn't show
    await vi.waitFor(() => {
      expect(screen.queryByTestId("dot-loader")).not.toBeInTheDocument();
    });
  });

  it("shows '—' for distance when totalDistance is null in dashboard", async () => {
    const user = userEvent.setup();
    const mockResult = makeMockResult();
    mockResult.result.motion.totalDistance = null;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResult),
    });

    render(<DashboardView />);
    await user.click(screen.getByText("mock-upload"));

    await vi.waitFor(() => {
      expect(screen.queryByTestId("landing-view")).not.toBeInTheDocument();
      expect(screen.queryByTestId("dot-loader")).not.toBeInTheDocument();
    });

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders COBB section heading when dataSource is cobb", async () => {
    const user = userEvent.setup();
    const mockResult = makeMockResult();

    const cobbResult = {
      boost: {
        avgBoostPsi: 10, maxBoostPsi: 18, avgTargetBoostPsi: 16,
        maxTargetBoostPsi: 18, avgBoostErrorPsi: 0.5, maxBoostErrorPsi: 2,
      },
      knock: {
        knockEventCount: 3, avgFeedbackKnock: -0.8, minFeedbackKnock: -2.5,
        avgFineKnockLearn: -0.5, minFineKnockLearn: -1.5, avgDAM: 0.95, minDAM: 0.875,
      },
      afr: {
        avgAFR: 14.7, avgAFRTarget: 14.7, avgAFRDeviation: 0.2,
        maxAFRDeviation: 0.8, avgAFCorrection1: 1.5, avgAFLearning1: 2.0,
      },
      wastegate: {
        avgWastegateActualMm: 12, maxWastegateActualMm: 18,
        avgWastegateTargetMm: 13, avgWastegateErrorMm: -1,
      },
      injector: {
        avgInjDutyCycle: 60, maxInjDutyCycle: 85,
        avgInjPulseWidthMs: 3.5, maxInjPulseWidthMs: 6.0, fuelCutEventCount: 0,
      },
      avcs: {
        avgAvcsExhLeft: 2.5, maxAvcsExhLeft: 5.0,
        avgAvcsInLeft: -14.0, maxAvcsInLeft: -10.0,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        ...mockResult,
        dataSource: "cobb",
        cobbResult,
      }),
    });

    render(<DashboardView />);
    await user.click(screen.getByText("mock-upload"));

    await vi.waitFor(() => {
      expect(screen.queryByTestId("landing-view")).not.toBeInTheDocument();
      expect(screen.queryByTestId("dot-loader")).not.toBeInTheDocument();
    });

    expect(screen.getByText("COBB Accessport")).toBeInTheDocument();
  });

  it("does not render COBB section when dataSource is obd2", async () => {
    const user = userEvent.setup();
    const mockResult = makeMockResult();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        ...mockResult,
        dataSource: "obd2",
      }),
    });

    render(<DashboardView />);
    await user.click(screen.getByText("mock-upload"));

    await vi.waitFor(() => {
      expect(screen.queryByTestId("landing-view")).not.toBeInTheDocument();
    });

    expect(screen.queryByText("COBB Accessport")).not.toBeInTheDocument();
  });
});
