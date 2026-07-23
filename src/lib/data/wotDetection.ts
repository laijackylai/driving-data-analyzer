import { OBD2DataPoint } from "@/types";

export interface WOTPull {
  startIndex: number;
  endIndex: number;
  startTime: number;
  endTime: number;
  minRpm: number;
  maxRpm: number;
  gear?: number;
  points: OBD2DataPoint[];
}

const WOT_THRESHOLD = 90;
const MIN_RPM_START = 2000;
const MIN_DURATION_S = 2;
const RPM_NOISE_TOLERANCE = 200;
const REDLINE_MARGIN = 200;

/**
 * Detect WOT pulls from time-series data.
 * @param throttleField - "throttlePosition" for OBD2, "accelPosition" for COBB
 */
export function detectWOTPulls(
  data: OBD2DataPoint[],
  throttleField: "throttlePosition" | "accelPosition" = "throttlePosition",
): WOTPull[] {
  if (data.length < 10) return [];

  let maxRpmSeen = 0;
  for (const d of data) {
    if (typeof d.engineRpm === "number" && d.engineRpm > maxRpmSeen) {
      maxRpmSeen = d.engineRpm;
    }
  }
  const effectiveRedline = maxRpmSeen - REDLINE_MARGIN;
  if (effectiveRedline < 3000) return [];

  const pulls: WOTPull[] = [];
  let pullStart = -1;
  let prevRpm = 0;

  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    const throttle = d[throttleField] as number | undefined;
    const rpm = d.engineRpm;

    if (typeof throttle !== "number" || typeof rpm !== "number") {
      if (pullStart >= 0) {
        finalizePull(data, pullStart, i - 1, effectiveRedline, pulls);
        pullStart = -1;
      }
      continue;
    }

    if (throttle >= WOT_THRESHOLD) {
      if (pullStart < 0) {
        pullStart = i;
        prevRpm = rpm;
      } else {
        if (rpm < prevRpm - RPM_NOISE_TOLERANCE) {
          finalizePull(data, pullStart, i - 1, effectiveRedline, pulls);
          pullStart = i;
          prevRpm = rpm;
        } else {
          prevRpm = Math.max(prevRpm, rpm);
        }
      }
    } else {
      if (pullStart >= 0) {
        finalizePull(data, pullStart, i - 1, effectiveRedline, pulls);
        pullStart = -1;
      }
    }
  }

  if (pullStart >= 0) {
    finalizePull(data, pullStart, data.length - 1, effectiveRedline, pulls);
  }

  return pulls;
}

function finalizePull(
  data: OBD2DataPoint[],
  start: number,
  end: number,
  redline: number,
  pulls: WOTPull[],
) {
  if (end - start < 5) return;

  const startTime = data[start].timestamp;
  const endTime = data[end].timestamp;
  const duration = endTime - startTime;
  if (duration < MIN_DURATION_S) return;

  let minRpm = Infinity, maxRpm = 0;
  for (let i = start; i <= end; i++) {
    const rpm = data[i].engineRpm;
    if (typeof rpm === "number") {
      if (rpm < minRpm) minRpm = rpm;
      if (rpm > maxRpm) maxRpm = rpm;
    }
  }

  if (minRpm > MIN_RPM_START + 1000) return;
  if (maxRpm < redline) return;

  const gearValues: number[] = [];
  for (let i = start; i <= end; i++) {
    const g = data[i].gearPosition ?? data[i].actualGearRatio;
    if (typeof g === "number") gearValues.push(g);
  }
  const gear = gearValues.length > 0
    ? Math.round(gearValues.reduce((a, b) => a + b, 0) / gearValues.length * 10) / 10
    : undefined;

  pulls.push({
    startIndex: start,
    endIndex: end,
    startTime,
    endTime,
    minRpm,
    maxRpm,
    gear,
    points: data.slice(start, end + 1),
  });
}
