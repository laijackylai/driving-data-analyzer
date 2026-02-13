import { DrivingDataPoint, DrivingSession, AnalysisResult } from "@/types";

/**
 * Parse CSV data to driving data points
 */
export function parseCSV(csvText: string): DrivingDataPoint[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) {
    throw new Error("CSV file is empty or invalid");
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const dataPoints: DrivingDataPoint[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    const point: any = {};

    headers.forEach((header, index) => {
      const value = values[index]?.trim();
      if (value) {
        // Convert numeric fields
        if (["speed", "acceleration", "braking", "steering", "latitude", "longitude"].includes(header)) {
          point[header] = parseFloat(value);
        } else {
          point[header] = value;
        }
      }
    });

    if (point.timestamp && point.speed !== undefined) {
      dataPoints.push(point as DrivingDataPoint);
    }
  }

  return dataPoints;
}

/**
 * Parse JSON data to driving session
 */
export function parseJSON(jsonText: string): DrivingSession | DrivingDataPoint[] {
  try {
    const data = JSON.parse(jsonText);

    // Check if it's an array of data points
    if (Array.isArray(data)) {
      return data as DrivingDataPoint[];
    }

    // Check if it's a session object
    if (data.dataPoints && Array.isArray(data.dataPoints)) {
      return data as DrivingSession;
    }

    throw new Error("Invalid JSON format");
  } catch (error) {
    throw new Error("Failed to parse JSON: " + (error as Error).message);
  }
}

/**
 * Calculate analysis metrics from driving data
 */
export function analyzeData(dataPoints: DrivingDataPoint[]): AnalysisResult["metrics"] {
  if (dataPoints.length === 0) {
    throw new Error("No data points to analyze");
  }

  // Calculate average and max speed
  const speeds = dataPoints.map((p) => p.speed);
  const averageSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  const maxSpeed = Math.max(...speeds);

  // Detect harsh braking events (deceleration > 4 m/s²)
  let harshBrakingEvents = 0;
  for (let i = 1; i < dataPoints.length; i++) {
    const prev = dataPoints[i - 1];
    const curr = dataPoints[i];

    if (prev.acceleration !== undefined && prev.acceleration < -4) {
      harshBrakingEvents++;
    } else if (curr.braking !== undefined && curr.braking > 0.7) {
      harshBrakingEvents++;
    }
  }

  // Detect rapid acceleration events (acceleration > 3 m/s²)
  let rapidAccelerationEvents = 0;
  for (const point of dataPoints) {
    if (point.acceleration !== undefined && point.acceleration > 3) {
      rapidAccelerationEvents++;
    }
  }

  // Calculate distance and duration (approximate)
  const firstPoint = dataPoints[0];
  const lastPoint = dataPoints[dataPoints.length - 1];

  const startTime = new Date(firstPoint.timestamp).getTime();
  const endTime = new Date(lastPoint.timestamp).getTime();
  const durationSeconds = (endTime - startTime) / 1000;

  // Approximate distance (speed * time)
  const distanceTraveled =
    dataPoints.reduce((total, point, index) => {
      if (index === 0) return total;
      const prevPoint = dataPoints[index - 1];
      const timeDiff =
        (new Date(point.timestamp).getTime() -
          new Date(prevPoint.timestamp).getTime()) /
        1000 /
        3600; // hours
      const avgSpeed = (point.speed + prevPoint.speed) / 2; // km/h
      return total + avgSpeed * timeDiff;
    }, 0);

  return {
    averageSpeed: Math.round(averageSpeed * 100) / 100,
    maxSpeed: Math.round(maxSpeed * 100) / 100,
    harshBrakingEvents,
    rapidAccelerationEvents,
    distanceTraveled: Math.round(distanceTraveled * 100) / 100,
    durationMinutes: Math.round(durationSeconds / 60),
  };
}

/**
 * Create a full analysis result
 */
export function createAnalysisResult(
  sessionId: string,
  dataPoints: DrivingDataPoint[]
): AnalysisResult {
  const metrics = analyzeData(dataPoints);

  // Calculate safety score (0-100)
  // Lower harsh braking and rapid acceleration = higher score
  const baseScore = 100;
  const brakingPenalty = Math.min(metrics.harshBrakingEvents * 2, 30);
  const accelerationPenalty = Math.min(metrics.rapidAccelerationEvents * 1.5, 20);
  const speedPenalty = metrics.maxSpeed > 120 ? 10 : 0;

  const safetyScore = Math.max(
    0,
    baseScore - brakingPenalty - accelerationPenalty - speedPenalty
  );

  return {
    sessionId,
    metrics,
    safetyScore: Math.round(safetyScore),
    timestamp: new Date().toISOString(),
  };
}
