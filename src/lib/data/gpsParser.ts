import { GPSDataPoint } from "@/types";
import { splitOBD2Line } from "./obd2Parser";

/**
 * Parse GPS data from OBD2 CSV text.
 * Reads LATITUDE (index 4), LONGITUDE (index 5) columns plus
 * Altitude (GPS) and Speed (GPS) PID rows.
 * Returns deduplicated GPSDataPoints bucketed by ~1 second.
 */
export function parseGPSData(csvText: string): GPSDataPoint[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  // Validate header has lat/lon columns
  const headers = splitOBD2Line(lines[0]).map((h) => h.toUpperCase());
  const latIdx = headers.findIndex((h) => h.includes("LATITUDE"));
  const lonIdx = headers.findIndex((h) => h.includes("LONGTITUDE") || h.includes("LONGITUDE"));
  const secIdx = headers.indexOf("SECONDS");
  const pidIdx = headers.indexOf("PID");
  const valIdx = headers.indexOf("VALUE");

  if (latIdx === -1 || lonIdx === -1 || secIdx === -1) return [];

  // First pass: collect raw lat/lon per timestamp bucket
  const buckets = new Map<number, { lat: number; lon: number; count: number }>();
  // Second pass data: altitude and GPS speed from PID rows
  const altitudes = new Map<number, number>();
  const gpsSpeeds = new Map<number, number>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = splitOBD2Line(line);
    const timestamp = parseFloat(fields[secIdx]);
    if (isNaN(timestamp)) continue;

    const bucket = Math.floor(timestamp);

    // Extract lat/lon
    const lat = parseFloat(fields[latIdx]);
    const lon = parseFloat(fields[lonIdx]);
    if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0 &&
        lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      const existing = buckets.get(bucket);
      if (existing) {
        existing.lat += lat;
        existing.lon += lon;
        existing.count += 1;
      } else {
        buckets.set(bucket, { lat, lon, count: 1 });
      }
    }

    // Extract altitude and GPS speed from PID rows
    if (pidIdx !== -1 && valIdx !== -1) {
      const pid = fields[pidIdx];
      const value = parseFloat(fields[valIdx]);
      if (!isNaN(value)) {
        if (pid === "Altitude (GPS)") {
          altitudes.set(bucket, value);
        } else if (pid === "Speed (GPS)") {
          gpsSpeeds.set(bucket, value);
        }
      }
    }
  }

  // Build GPSDataPoint array
  const points: GPSDataPoint[] = [];
  const sortedBuckets = Array.from(buckets.entries()).sort(([a], [b]) => a - b);

  for (const [timestamp, { lat, lon, count }] of sortedBuckets) {
    const point: GPSDataPoint = {
      timestamp,
      lat: lat / count,
      lon: lon / count,
    };
    const alt = altitudes.get(timestamp);
    if (alt !== undefined) point.altitude = alt;
    const speed = gpsSpeeds.get(timestamp);
    if (speed !== undefined) point.gpsSpeed = speed;
    points.push(point);
  }

  return points;
}
