import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { TimeRangeProvider, useTimeRange } from "@/hooks/useTimeRange";

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(TimeRangeProvider, null, children);
}

describe("useTimeRange", () => {
  it("starts with no active range", () => {
    const { result } = renderHook(() => useTimeRange(), { wrapper });
    expect(result.current.isRangeActive).toBe(false);
    expect(result.current.timeRange.start).toBeNull();
    expect(result.current.timeRange.end).toBeNull();
    expect(result.current.timeRange.source).toBe("reset");
  });

  it("sets a range via slider source", () => {
    const { result } = renderHook(() => useTimeRange(), { wrapper });

    act(() => {
      result.current.setTimeRange({ start: 1000, end: 2000, source: "slider" });
    });

    expect(result.current.isRangeActive).toBe(true);
    expect(result.current.timeRange.start).toBe(1000);
    expect(result.current.timeRange.end).toBe(2000);
    expect(result.current.timeRange.source).toBe("slider");
  });

  it("isRangeActive is false when only start is set", () => {
    const { result } = renderHook(() => useTimeRange(), { wrapper });

    act(() => {
      result.current.setTimeRange({ start: 1000, end: null, source: "slider" });
    });

    expect(result.current.isRangeActive).toBe(false);
  });

  it("resetTimeRange clears the range", () => {
    const { result } = renderHook(() => useTimeRange(), { wrapper });

    act(() => {
      result.current.setTimeRange({ start: 1000, end: 2000, source: "slider" });
    });

    expect(result.current.isRangeActive).toBe(true);

    act(() => {
      result.current.resetTimeRange();
    });

    expect(result.current.isRangeActive).toBe(false);
    expect(result.current.timeRange.start).toBeNull();
    expect(result.current.timeRange.end).toBeNull();
    expect(result.current.timeRange.source).toBe("reset");
  });

  it("throws when used outside provider", () => {
    // Suppress expected error output
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useTimeRange())).toThrow(
      "useTimeRange must be used within a TimeRangeProvider"
    );
    spy.mockRestore();
  });

  it("source type only accepts slider or reset", () => {
    const { result } = renderHook(() => useTimeRange(), { wrapper });

    act(() => {
      // This should type-check as valid slider source
      result.current.setTimeRange({ start: 100, end: 200, source: "slider" });
    });
    expect(result.current.timeRange.source).toBe("slider");

    act(() => {
      result.current.resetTimeRange();
    });
    expect(result.current.timeRange.source).toBe("reset");
  });
});
