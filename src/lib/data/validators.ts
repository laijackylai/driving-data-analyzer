import { DrivingDataPoint, DrivingSession } from "@/types";

/**
 * Validate if a data point has required fields
 */
export function isValidDataPoint(data: any): data is DrivingDataPoint {
  return (
    data &&
    typeof data === "object" &&
    typeof data.timestamp === "string" &&
    typeof data.speed === "number" &&
    data.speed >= 0
  );
}

/**
 * Validate if a driving session has required fields
 */
export function isValidSession(data: any): data is DrivingSession {
  return (
    data &&
    typeof data === "object" &&
    typeof data.id === "string" &&
    typeof data.startTime === "string" &&
    typeof data.endTime === "string" &&
    Array.isArray(data.dataPoints) &&
    data.dataPoints.every(isValidDataPoint)
  );
}

/**
 * Validate CSV headers
 */
export function validateCSVHeaders(headers: string[]): boolean {
  const requiredHeaders = ["timestamp", "speed"];
  return requiredHeaders.every((header) =>
    headers.some((h) => h.toLowerCase() === header.toLowerCase())
  );
}

/**
 * Validate file format
 */
export function validateFileFormat(filename: string): "csv" | "json" | null {
  const extension = filename.split(".").pop()?.toLowerCase();
  if (extension === "csv") return "csv";
  if (extension === "json") return "json";
  return null;
}
