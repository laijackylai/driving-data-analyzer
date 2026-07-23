import { describe, it, expect } from "vitest";
import { detectWOTPulls } from "../wotDetection";
import { OBD2DataPoint } from "@/types";

function makePoint(ts: number, rpm: number, throttle: number, speed?: number): OBD2DataPoint {
  return { timestamp: ts, engineRpm: rpm, throttlePosition: throttle, vehicleSpeed: speed } as OBD2DataPoint;
}

describe("detectWOTPulls", () => {
  it("detects a clean WOT pull", () => {
    // 3 seconds from 2500 to 6000 RPM at 95% throttle
    const points: OBD2DataPoint[] = [];
    for (let i = 0; i <= 30; i++) {
      const rpm = 2500 + (3500 * i / 30);
      points.push(makePoint(100 + i * 0.1, rpm, 95, 60 + i));
    }
    const pulls = detectWOTPulls(points, "throttlePosition");
    expect(pulls.length).toBe(1);
    expect(pulls[0].startIndex).toBe(0);
    expect(pulls[0].endIndex).toBe(30);
  });

  it("skips partial pulls not reaching redline", () => {
    // Create data where redline is high (from non-WOT points) but WOT pull
    // only reaches mid-range RPM, so it doesn't qualify
    const points: OBD2DataPoint[] = [];
    // Non-WOT points at high RPM to set redline high (7000 RPM → redline 6800)
    for (let i = 0; i < 10; i++) {
      points.push(makePoint(90 + i * 0.1, 7000, 30));
    }
    // WOT pull that only reaches 3500 RPM — well below redline of 6800
    for (let i = 0; i <= 20; i++) {
      points.push(makePoint(100 + i * 0.1, 2500 + (1000 * i / 20), 95));
    }
    const pulls = detectWOTPulls(points, "throttlePosition");
    expect(pulls.length).toBe(0);
  });

  it("returns empty for no WOT data", () => {
    const points = [makePoint(100, 2000, 30), makePoint(101, 2100, 35)];
    const pulls = detectWOTPulls(points, "throttlePosition");
    expect(pulls.length).toBe(0);
  });
});
