import {
  OBD2DataPoint,
  CobbAnalysisResult,
  CobbBoostMetrics,
  CobbKnockMetrics,
  CobbAFRMetrics,
  CobbWastegateMetrics,
  CobbInjectorMetrics,
  CobbAVCSMetrics,
} from "@/types";

// ── Utility (mirrors obd2Analyzer.ts) ──

function extractValues(points: OBD2DataPoint[], field: keyof OBD2DataPoint): number[] {
  return points.flatMap((p) => {
    const v = p[field];
    return typeof v === "number" ? [v] : [];
  });
}

function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
}

function max(values: number[]): number | null {
  return values.length === 0 ? null : Math.round(Math.max(...values) * 100) / 100;
}

function min(values: number[]): number | null {
  return values.length === 0 ? null : Math.round(Math.min(...values) * 100) / 100;
}

// ── Category analyzers ──

export function analyzeCobbBoost(points: OBD2DataPoint[]): CobbBoostMetrics {
  const boost = extractValues(points, "boostPsi");
  const target = extractValues(points, "targetBoostFinalRelPsi");
  const error = extractValues(points, "tdBoostErrorPsi");
  return {
    avgBoostPsi: avg(boost),
    maxBoostPsi: max(boost),
    avgTargetBoostPsi: avg(target),
    maxTargetBoostPsi: max(target),
    avgBoostErrorPsi: avg(error),
    maxBoostErrorPsi: max(error),
  };
}

export function analyzeCobbKnock(points: OBD2DataPoint[]): CobbKnockMetrics {
  const fbKnock = extractValues(points, "feedbackKnock");
  const fineKnock = extractValues(points, "fineKnockLearn");
  const damValues = extractValues(points, "dam");

  // Count knock EVENTS by counting leading edges (transitions into knock state).
  // COBB logs at ~50Hz; a sustained knock retard produces many consecutive negative rows.
  // Counting raw samples would inflate the count by 50x compared to actual events.
  const KNOCK_THRESHOLD = -0.5;
  let knockEventCount = 0;
  let inKnockEvent = false;
  for (const v of fbKnock) {
    if (v < KNOCK_THRESHOLD) {
      if (!inKnockEvent) {
        knockEventCount++;
        inKnockEvent = true;
      }
    } else {
      inKnockEvent = false;
    }
  }

  return {
    knockEventCount,
    avgFeedbackKnock: avg(fbKnock),
    minFeedbackKnock: min(fbKnock),
    avgFineKnockLearn: avg(fineKnock),
    minFineKnockLearn: min(fineKnock),
    avgDAM: avg(damValues),
    minDAM: min(damValues),
  };
}

export function analyzeCobbAFR(points: OBD2DataPoint[]): CobbAFRMetrics {
  const afr = extractValues(points, "afSens1Ratio");
  const target = extractValues(points, "clFuelTarget");
  const corr1 = extractValues(points, "afCorrection1");
  const learn1 = extractValues(points, "afLearning1");

  // Compute per-point AFR deviation where both AFR and target exist
  const deviations: number[] = [];
  for (const p of points) {
    const a = p.afSens1Ratio;
    const t = p.clFuelTarget;
    if (typeof a === "number" && typeof t === "number") {
      deviations.push(Math.abs(a - t));
    }
  }

  return {
    avgAFR: avg(afr),
    avgAFRTarget: avg(target),
    avgAFRDeviation: avg(deviations),
    maxAFRDeviation: max(deviations),
    avgAFCorrection1: avg(corr1),
    avgAFLearning1: avg(learn1),
  };
}

export function analyzeCobbWastegate(points: OBD2DataPoint[]): CobbWastegateMetrics {
  const actual = extractValues(points, "wastegateActualPosMm");
  const target = extractValues(points, "wastegateCommFinalPosMm");

  const errors: number[] = [];
  for (const p of points) {
    const a = p.wastegateActualPosMm;
    const t = p.wastegateCommFinalPosMm;
    if (typeof a === "number" && typeof t === "number") {
      errors.push(a - t);
    }
  }

  return {
    avgWastegateActualMm: avg(actual),
    maxWastegateActualMm: max(actual),
    avgWastegateTargetMm: avg(target),
    avgWastegateErrorMm: avg(errors),
  };
}

export function analyzeCobbInjector(points: OBD2DataPoint[]): CobbInjectorMetrics {
  const duty = extractValues(points, "injDutyCycle");
  const pw = extractValues(points, "injPulseWidth");
  const fuelCutEvents = points.filter((p) => typeof p.fuelCut === "number" && p.fuelCut > 0);

  return {
    avgInjDutyCycle: avg(duty),
    maxInjDutyCycle: max(duty),
    avgInjPulseWidthMs: avg(pw),
    maxInjPulseWidthMs: max(pw),
    fuelCutEventCount: fuelCutEvents.length,
  };
}

export function analyzeCobbAVCS(points: OBD2DataPoint[]): CobbAVCSMetrics {
  const exh = extractValues(points, "avcsExhLeft");
  const intake = extractValues(points, "avcsInLeft");

  return {
    avgAvcsExhLeft: avg(exh),
    maxAvcsExhLeft: max(exh),
    avgAvcsInLeft: avg(intake),
    maxAvcsInLeft: max(intake),
  };
}

export function analyzeCobbData(points: OBD2DataPoint[]): CobbAnalysisResult {
  return {
    boost: analyzeCobbBoost(points),
    knock: analyzeCobbKnock(points),
    afr: analyzeCobbAFR(points),
    wastegate: analyzeCobbWastegate(points),
    injector: analyzeCobbInjector(points),
    avcs: analyzeCobbAVCS(points),
  };
}
