import { OBD2DataPoint } from "@/types";

export interface PowerPoint {
  timestamp: number;
  rpm: number;
  wheelHp: number;
  wheelTorqueNm: number;
  engineTorqueNm?: number;
  gear?: number;
}

export interface MafPowerPoint {
  timestamp: number;
  rpm: number;
  engineHp: number;
}

const KW_TO_HP = 1.341;
const SMOOTHING_WINDOW = 5;

function smooth(values: number[], window: number): number[] {
  const half = Math.floor(window / 2);
  return values.map((_, i) => {
    let sum = 0, count = 0;
    for (let j = Math.max(0, i - half); j <= Math.min(values.length - 1, i + half); j++) {
      sum += values[j];
      count++;
    }
    return sum / count;
  });
}

/**
 * Acceleration-based wheel power: P = m * a * v
 * Returns wheel HP (not corrected for aero drag).
 */
export function computeAccelBasedPower(
  points: OBD2DataPoint[],
  curbWeightKg: number,
): PowerPoint[] {
  const valid = points.filter((p) =>
    typeof p.engineRpm === "number" &&
    typeof p.vehicleSpeed === "number" &&
    typeof p.vehicleAcceleration === "number"
  );

  if (valid.length < SMOOTHING_WINDOW) return [];

  const accels = valid.map((p) => p.vehicleAcceleration! * 9.81);
  const smoothedAccel = smooth(accels, SMOOTHING_WINDOW);

  const results: PowerPoint[] = [];
  for (let i = 0; i < valid.length; i++) {
    const p = valid[i];
    const speedMs = p.vehicleSpeed! / 3.6;
    const accel = smoothedAccel[i];
    const rpm = p.engineRpm!;

    if (speedMs < 1 || accel <= 0) continue;

    const powerKw = (curbWeightKg * accel * speedMs) / 1000;
    const wheelHp = powerKw * KW_TO_HP;
    const wheelTorqueNm = (powerKw * 1000) / (2 * Math.PI * rpm / 60);

    let engineTorqueNm: number | undefined;
    const gearRatio = p.actualGearRatio ?? p.gearPosition;
    if (typeof gearRatio === "number" && gearRatio > 0) {
      engineTorqueNm = wheelTorqueNm / gearRatio;
    }

    results.push({
      timestamp: p.timestamp,
      rpm,
      wheelHp,
      wheelTorqueNm,
      engineTorqueNm,
      gear: typeof p.gearPosition === "number" ? p.gearPosition
           : typeof p.actualGearRatio === "number" ? p.actualGearRatio
           : undefined,
    });
  }

  return results;
}

/**
 * MAF-based engine power: HP = (MAF * 60 * AFR_stoich) / (BSFC * 453.6)
 */
export function computeMafBasedPower(
  points: OBD2DataPoint[],
  bsfc: number = 0.45,
): MafPowerPoint[] {
  const AFR_STOICH = 14.7;

  return points
    .filter((p) => typeof p.engineRpm === "number" && typeof p.mafAirFlowRate === "number")
    .map((p) => {
      const mafGs = p.mafAirFlowRate!;
      const fuelGs = mafGs / AFR_STOICH;
      const fuelLbHr = fuelGs * 3600 / 453.6;
      const engineHp = fuelLbHr / bsfc;
      return {
        timestamp: p.timestamp,
        rpm: p.engineRpm!,
        engineHp: Math.max(0, engineHp),
      };
    });
}
