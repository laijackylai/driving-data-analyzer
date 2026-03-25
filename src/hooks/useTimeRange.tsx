"use client";

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";

export interface TimeRangeState {
  start: number | null;
  end: number | null;
  source: "slider" | "reset";
}

interface TimeRangeContextValue {
  timeRange: TimeRangeState;
  setTimeRange: (range: TimeRangeState) => void;
  resetTimeRange: () => void;
  isRangeActive: boolean;
}

const TimeRangeContext = createContext<TimeRangeContextValue | null>(null);

const INITIAL_STATE: TimeRangeState = { start: null, end: null, source: "reset" };

export function TimeRangeProvider({ children }: { children: ReactNode }) {
  const [timeRange, setTimeRangeState] = useState<TimeRangeState>(INITIAL_STATE);

  const setTimeRange = useCallback((range: TimeRangeState) => {
    setTimeRangeState(range);
  }, []);

  const resetTimeRange = useCallback(() => {
    setTimeRangeState(INITIAL_STATE);
  }, []);

  const isRangeActive = timeRange.start !== null && timeRange.end !== null;

  const value = useMemo(
    () => ({ timeRange, setTimeRange, resetTimeRange, isRangeActive }),
    [timeRange, setTimeRange, resetTimeRange, isRangeActive]
  );

  return (
    <TimeRangeContext.Provider value={value}>
      {children}
    </TimeRangeContext.Provider>
  );
}

export function useTimeRange(): TimeRangeContextValue {
  const context = useContext(TimeRangeContext);
  if (!context) {
    throw new Error("useTimeRange must be used within a TimeRangeProvider");
  }
  return context;
}
