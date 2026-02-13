import { OBD2AnalysisResult, AnalysisResult } from "@/types";

/**
 * Transforms the comprehensive OBD2AnalysisResult into a backward-compatible
 * AnalysisResult format expected by the dashboard.
 *
 * This allows us to maintain the rich OBD2 analysis capabilities while
 * providing a simple interface for the existing dashboard components.
 *
 * @param obd2Result - The comprehensive OBD2 analysis result
 * @returns A simplified AnalysisResult compatible with the dashboard
 */
export function transformOBD2ToAnalysisResult(
  obd2Result: OBD2AnalysisResult
): AnalysisResult {
  const motion = obd2Result.motion;

  return {
    sessionId: obd2Result.sessionId,
    timestamp: obd2Result.timestamp,
    safetyScore: obd2Result.safetyScore,
    metrics: {
      // Field name mappings from OBD2 structure to dashboard expectations
      averageSpeed: motion.avgSpeed,           // avgSpeed → averageSpeed
      maxSpeed: motion.maxSpeed,               // Direct match
      distanceTraveled: motion.totalDistance,  // totalDistance → distanceTraveled
      durationMinutes: motion.durationMinutes, // Direct match
      harshBrakingEvents: motion.harshBrakingEvents, // Direct match
      rapidAccelerationEvents: motion.rapidAccelerationEvents, // Direct match
    },
  };
}
