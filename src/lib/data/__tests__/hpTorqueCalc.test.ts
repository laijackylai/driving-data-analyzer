import { describe, it, expect } from "vitest";
import { computeAccelBasedPower, computeMafBasedPower } from "../hpTorqueCalc";
import { OBD2DataPoint } from "@/types";

describe("computeAccelBasedPower", () => {
  it("computes wheel HP from acceleration and speed", () => {
    // Need >= SMOOTHING_WINDOW (5) points for smoothing to work
    // 1451 kg car accelerating at ~0.2g at ~108 km/h (30 m/s)
    const points: OBD2DataPoint[] = Array.from({ length: 6 }, (_, i) => ({
      timestamp: 100 + i * 0.1,
      engineRpm: 3000 + i * 100,
      vehicleSpeed: 108,
      vehicleAcceleration: 0.204, // in g units (multiplied by 9.81 in impl)
    } as OBD2DataPoint));
    const result = computeAccelBasedPower(points, 1451);
    expect(result.length).toBeGreaterThan(0);
    // P = 1451 * (0.204*9.81) * 30 / 1000 * 1.341 ≈ 117 HP
    expect(result[0].wheelHp).toBeGreaterThan(80);
    expect(result[0].wheelHp).toBeLessThan(160);
  });
});

describe("computeMafBasedPower", () => {
  it("computes engine HP from MAF", () => {
    // 30 g/s MAF: fuelGs=30/14.7=2.04, fuelLbHr=2.04*3600/453.6=16.2, HP=16.2/0.45≈36
    const points: OBD2DataPoint[] = [
      { timestamp: 100, engineRpm: 4000, mafAirFlowRate: 30 } as OBD2DataPoint,
    ];
    const result = computeMafBasedPower(points);
    expect(result.length).toBe(1);
    expect(result[0].engineHp).toBeGreaterThan(30);
    expect(result[0].engineHp).toBeLessThan(50);
  });
});
