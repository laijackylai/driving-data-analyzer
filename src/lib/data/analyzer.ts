import { DrivingDataPoint, DrivingSession, AnalysisResult } from "@/types";
import { isValidDataPoint } from "./validators";

/**
 * Split a CSV line respecting quoted fields
 */
function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Parse CSV data to driving data points
 */
export function parseCSV(csvText: string): DrivingDataPoint[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) {
    throw new Error("CSV file is empty or invalid");
  }

  const headers = splitCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
  const dataPoints: DrivingDataPoint[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i]);
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
      const validPoints = data.filter(isValidDataPoint);
      return validPoints;
    }

    // Check if it's a session object
    if (data.dataPoints && Array.isArray(data.dataPoints)) {
      data.dataPoints = data.dataPoints.filter(isValidDataPoint);
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
  const maxSpeed = speeds.reduce((max, s) => (s > max ? s : max), -Infinity);

  // Detect harsh braking events (deceleration > 4 m/s² or brake force > 0.7)
  let harshBrakingEvents = 0;
  for (const point of dataPoints) {
    if (point.acceleration !== undefined && point.acceleration < -4) {
      harshBrakingEvents++;
    }
    if (point.braking !== undefined && point.braking > 0.7) {
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
