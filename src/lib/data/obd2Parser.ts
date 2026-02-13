import { OBD2Reading, OBD2DataPoint } from "@/types";
import { PID_MAP } from "./pidConstants";

/**
 * Split a semicolon-delimited OBD2 CSV line, respecting quoted fields.
 * Handles trailing semicolons (common in OBD2 CSV exports).
 */
function splitOBD2Line(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ";" && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  // Push last field if non-empty (handles trailing semicolon)
  const trimmed = current.trim();
  if (trimmed) {
    result.push(trimmed);
  }

  return result;
}

/**
 * Parse raw OBD2 CSV text into an array of OBD2Reading objects (long-form).
 * Validates the header row and skips invalid data rows.
 */
export function parseOBD2CSV(csvText: string): OBD2Reading[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) {
    throw new Error("OBD2 CSV file is empty or has no data rows");
  }

  // Parse and validate header
  const headers = splitOBD2Line(lines[0]).map((h) => h.toUpperCase());
  const expectedHeaders = ["SECONDS", "PID", "VALUE", "UNITS"];

  for (const expected of expectedHeaders) {
    if (!headers.includes(expected)) {
      throw new Error(
        `Invalid OBD2 CSV header. Expected columns: SECONDS, PID, VALUE, UNITS. Got: ${headers.join(", ")}`
      );
    }
  }

  const secondsIdx = headers.indexOf("SECONDS");
  const pidIdx = headers.indexOf("PID");
  const valueIdx = headers.indexOf("VALUE");
  const unitsIdx = headers.indexOf("UNITS");

  const readings: OBD2Reading[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = splitOBD2Line(line);

    const timestampStr = fields[secondsIdx];
    const pid = fields[pidIdx];
    const valueStr = fields[valueIdx];
    const units = fields[unitsIdx] || "";

    // Parse timestamp
    const timestamp = parseFloat(timestampStr);
    if (isNaN(timestamp)) {
      continue; // Skip rows with invalid timestamps
    }

    // Parse value — empty string or non-numeric becomes null
    let value: number | null = null;
    if (valueStr !== undefined && valueStr !== "") {
      const parsed = parseFloat(valueStr);
      if (!isNaN(parsed)) {
        value = parsed;
      }
    }

    if (pid) {
      readings.push({ timestamp, pid, value, units });
    }
  }

  return readings;
}

/**
 * Normalize a raw PID name to its camelCase field name using PID_MAP.
 * Returns null if the PID is not recognized.
 */
export function normalizePIDName(pid: string): string | null {
  const mapping = PID_MAP[pid];
  return mapping ? mapping.field : null;
}

/**
 * Pivot long-form OBD2 readings into wide-form data points.
 * Groups readings by 1-second timestamp buckets and averages
 * duplicate PID readings within each bucket.
 */
export function pivotToTimeSeries(readings: OBD2Reading[]): OBD2DataPoint[] {
  if (readings.length === 0) return [];

  // Group by 1-second bucket
  const buckets = new Map<
    number,
    Map<string, { sum: number; count: number }>
  >();

  for (const reading of readings) {
    const bucket = Math.floor(reading.timestamp);
    const field = normalizePIDName(reading.pid);

    if (!field || reading.value === null) continue;

    if (!buckets.has(bucket)) {
      buckets.set(bucket, new Map());
    }

    const pidMap = buckets.get(bucket)!;
    if (!pidMap.has(field)) {
      pidMap.set(field, { sum: 0, count: 0 });
    }

    const entry = pidMap.get(field)!;
    entry.sum += reading.value;
    entry.count += 1;
  }

  // Convert buckets to OBD2DataPoint array
  const dataPoints: OBD2DataPoint[] = [];

  // Sort by timestamp
  const sortedBuckets = Array.from(buckets.entries()).sort(
    ([a], [b]) => a - b
  );

  for (const [timestamp, pidMap] of sortedBuckets) {
    const point: OBD2DataPoint = { timestamp };

    for (const [field, { sum, count }] of pidMap.entries()) {
      const avg = Math.round((sum / count) * 100) / 100;
      (point as unknown as Record<string, number>)[field] = avg;
    }

    dataPoints.push(point);
  }

  return dataPoints;
}

/**
 * Main entry point: parse an OBD2 CSV file and return pivoted data points.
 */
export function parseOBD2File(csvText: string): OBD2DataPoint[] {
  const readings = parseOBD2CSV(csvText);

  if (readings.length === 0) {
    throw new Error("No valid OBD2 readings found in file");
  }

  const dataPoints = pivotToTimeSeries(readings);

  if (dataPoints.length === 0) {
    throw new Error(
      "No recognized PID data found. Ensure the file contains known OBD2 parameters."
    );
  }

  return dataPoints;
}
