import { describe, it, expect } from "vitest";
import {
  analyzeCobbBoost,
  analyzeCobbKnock,
  analyzeCobbAFR,
  analyzeCobbWastegate,
  analyzeCobbInjector,
  analyzeCobbAVCS,
  analyzeCobbData,
} from "@/lib/data/cobbAnalyzer";
import { OBD2DataPoint } from "@/types";

function makePoints(overrides: Partial<OBD2DataPoint>[]): OBD2DataPoint[] {
  return overrides.map((o, i) => ({ timestamp: i, ...o }));
}

describe("analyzeCobbBoost", () => {
  it("calculates avg and max boost", () => {
    const points = makePoints([
      { boostPsi: 5.0 },
      { boostPsi: 10.0 },
      { boostPsi: 15.0 },
    ]);
    const result = analyzeCobbBoost(points);
    expect(result.avgBoostPsi).toBeCloseTo(10.0);
    expect(result.maxBoostPsi).toBe(15.0);
  });

  it("returns null for missing boost data", () => {
    const result = analyzeCobbBoost(makePoints([{ engineRpm: 1000 }]));
    expect(result.avgBoostPsi).toBeNull();
    expect(result.maxBoostPsi).toBeNull();
  });
});

describe("analyzeCobbKnock", () => {
  it("counts knock EVENTS by edge transition, not sample count", () => {
    // 2 separate events: one at samples 1-2, another at sample 4
    // (sample 3 at -0.3 is above threshold — resets the event state)
    const points = makePoints([
      { feedbackKnock: 0.0, dam: 1.0 },   // no knock
      { feedbackKnock: -1.5, dam: 0.875 }, // event 1 starts
      { feedbackKnock: -1.2, dam: 0.875 }, // event 1 continues (NOT a new event)
      { feedbackKnock: -0.3, dam: 1.0 },   // above threshold — event 1 ends
      { feedbackKnock: -2.0, dam: 0.75 },  // event 2 starts
    ]);
    const result = analyzeCobbKnock(points);
    expect(result.knockEventCount).toBe(2); // 2 events, not 3 samples
    expect(result.minDAM).toBe(0.75);
  });

  it("returns 0 knock events with clean data", () => {
    const points = makePoints([{ feedbackKnock: 0.0, dam: 1.0 }]);
    const result = analyzeCobbKnock(points);
    expect(result.knockEventCount).toBe(0);
  });
});

describe("analyzeCobbAFR", () => {
  it("calculates AFR deviation from target", () => {
    const points = makePoints([
      { afSens1Ratio: 14.7, clFuelTarget: 14.7 },
      { afSens1Ratio: 15.2, clFuelTarget: 14.7 },
      { afSens1Ratio: 14.1, clFuelTarget: 14.7 },
    ]);
    const result = analyzeCobbAFR(points);
    expect(result.avgAFRDeviation).toBeCloseTo(0.33, 1);
    expect(result.maxAFRDeviation).toBeCloseTo(0.6, 1);
  });
});

describe("analyzeCobbWastegate", () => {
  it("calculates avg and max wastegate position", () => {
    const points = makePoints([
      { wastegateActualPosMm: 10.0, wastegateCommFinalPosMm: 11.0 },
      { wastegateActualPosMm: 12.0, wastegateCommFinalPosMm: 11.5 },
    ]);
    const result = analyzeCobbWastegate(points);
    expect(result.avgWastegateActualMm).toBe(11.0);
    expect(result.maxWastegateActualMm).toBe(12.0);
  });
});

describe("analyzeCobbInjector", () => {
  it("counts fuel cut events", () => {
    const points = makePoints([
      { injDutyCycle: 50, injPulseWidth: 2.0, fuelCut: 0 },
      { injDutyCycle: 0, injPulseWidth: 0, fuelCut: 4 },
      { injDutyCycle: 0, injPulseWidth: 0, fuelCut: 4 },
    ]);
    const result = analyzeCobbInjector(points);
    expect(result.fuelCutEventCount).toBe(2);
    expect(result.maxInjDutyCycle).toBe(50);
  });
});

describe("analyzeCobbAVCS", () => {
  it("calculates avg AVCS positions", () => {
    const points = makePoints([
      { avcsInLeft: -15, avcsExhLeft: 1 },
      { avcsInLeft: -16, avcsExhLeft: 2 },
    ]);
    const result = analyzeCobbAVCS(points);
    expect(result.avgAvcsInLeft).toBe(-15.5);
    expect(result.avgAvcsExhLeft).toBe(1.5);
  });
});

describe("analyzeCobbData", () => {
  it("returns all 6 metric categories", () => {
    const points = makePoints([{ engineRpm: 2000 }]);
    const result = analyzeCobbData(points);
    expect(result).toHaveProperty("boost");
    expect(result).toHaveProperty("knock");
    expect(result).toHaveProperty("afr");
    expect(result).toHaveProperty("wastegate");
    expect(result).toHaveProperty("injector");
    expect(result).toHaveProperty("avcs");
  });
});
