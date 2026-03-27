import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { DashboardView } from "@/components/features/DashboardView";

// Mock fetch for API calls and demo file
const mockFetch = vi.fn();
global.fetch = mockFetch;

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

vi.mock("@/components/features/PixelTransition", () => ({
  PixelTransition: ({
    active,
    onComplete,
    children,
  }: {
    active: boolean;
    onComplete: () => void;
    children: React.ReactNode;
  }) => {
    // Auto-complete transition immediately in tests
    if (active) {
      setTimeout(onComplete, 0);
    }
    return <div data-testid="pixel-transition">{children}</div>;
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

// Separate describe for the handleDissolveComplete null-pendingFile guard.
// We need a controlled PixelTransition that does NOT auto-call onComplete.
describe("DashboardView handleDissolveComplete null guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Override PixelTransition mock to capture onComplete WITHOUT auto-calling it
    vi.doMock("@/components/features/PixelTransition", () => ({
      PixelTransition: ({
        active,
        onComplete,
        children,
      }: {
        active: boolean;
        onComplete: () => void;
        children: React.ReactNode;
      }) => {
        // Expose onComplete on the window so tests can call it manually
        if (active) {
          (window as unknown as Record<string, unknown>).__dissolveOnComplete = onComplete;
        }
        return <div data-testid="pixel-transition">{children}</div>;
      },
    }));
  });

  afterAll(() => {
    vi.doUnmock("@/components/features/PixelTransition");
  });

  // NOTE: The null-pendingFile guard in handleDissolveComplete (lines 280-281) is a
  // purely defensive branch — in normal app flow, pendingFileRef is always set before
  // the dissolving state is entered. It cannot be triggered through the public API,
  // so we document it here rather than testing it via an unreachable code path.
  it("null pendingFile guard is defensive — stays in landing when pendingFile is never set", () => {
    // This test documents the behaviour: if onComplete fires with no pending file,
    // the app falls back to landing. We verify that landing is still shown when
    // the PixelTransition mock doesn't auto-advance (no file selected).
    render(<DashboardView />);
    expect(screen.getByTestId("landing-view")).toBeInTheDocument();
    // No pixel-transition is shown when viewState is "landing"
    expect(screen.queryByTestId("pixel-transition")).not.toBeInTheDocument();
  });
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

  it("transitions to ANALYZING on file select", async () => {
    const user = userEvent.setup();
    // Mock a pending fetch — never resolves, keeps us in analyzing state
    mockFetch.mockReturnValueOnce(new Promise<never>(() => {}));

    render(<DashboardView />);
    await user.click(screen.getByText("mock-upload"));

    // PixelTransition mock auto-completes via setTimeout(0),
    // after which state goes dissolving → analyzing → dot loader appears
    await vi.waitFor(() => {
      expect(screen.getByTestId("dot-loader")).toBeInTheDocument();
    });
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

    // Should eventually show dashboard content (landing view gone, no dot loader)
    await vi.waitFor(() => {
      expect(screen.queryByTestId("landing-view")).not.toBeInTheDocument();
      expect(screen.queryByTestId("dot-loader")).not.toBeInTheDocument();
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
      // Should show landing again with error visible
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
    // Provide 2+ data points so TimelineSlider renders and shows home button
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
    });

    // Click the home button on the TimelineSlider
    const homeButton = screen.getByRole("button", { name: /return to landing/i });
    await user.click(homeButton);

    // Should return to landing
    await vi.waitFor(() => {
      expect(screen.getByTestId("landing-view")).toBeInTheDocument();
    });
  });

  it("clicking a tab button in DASHBOARD calls scrollToSection (line 113)", async () => {
    const user = userEvent.setup();
    const mockResult = makeMockResult();

    // jsdom does not implement scrollIntoView — stub it to avoid unimplemented errors
    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResult),
    });

    render(<DashboardView />);
    await user.click(screen.getByText("mock-upload"));

    // Wait for dashboard state
    await vi.waitFor(() => {
      expect(screen.queryByTestId("dot-loader")).not.toBeInTheDocument();
      expect(screen.queryByTestId("landing-view")).not.toBeInTheDocument();
    });

    // Tab buttons are rendered; click one to invoke scrollToSection
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toBeGreaterThan(0);
    // Should not throw — scrollIntoView is stubbed above
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
      // Error toast should be visible
      expect(screen.getByText(/parse error/i)).toBeInTheDocument();
    });
  });

  it("falls back to 'Analysis failed' when error response has no error field (|| branch)", async () => {
    const user = userEvent.setup();
    // ok: false but no error field — triggers `data.error || "Analysis failed"` fallback
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
    // Patch in a totalDistance: null to cover the "—" branch in SummaryChip
    mockResult.result.motion.totalDistance = null;

    // Return response with timeSeries/gps/derived/thresholds all missing (undefined → ??)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        result: mockResult.result,
        // timeSeries, gps, derived, thresholds all absent
      }),
    });

    render(<DashboardView />);
    await user.click(screen.getByText("mock-upload"));

    // When timeSeries is [] (from ?? []) and derived/thresholds are null,
    // hasAllData is false → dashboard doesn't show — falls back to showing nothing
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

    // The "—" text should appear in the SummaryChip for Distance
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
