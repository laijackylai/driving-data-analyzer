import { OBD2DataPoint, GPSDataPoint } from "@/types";

/**
 * Largest-Triangle-Three-Buckets (LTTB) downsampling.
 * Reduces an array of points to `threshold` points while preserving visual shape.
 * Generic version that works with any object having a numeric key for x and y.
 */
export function lttb<T>(data: T[], threshold: number, getX: (d: T) => number, getY: (d: T) => number): T[] {
  if (threshold >= data.length || threshold < 3) return [...data];

  const sampled: T[] = [data[0]]; // Always keep first point
  const bucketSize = (data.length - 2) / (threshold - 2);

  let prevIndex = 0;

  for (let i = 0; i < threshold - 2; i++) {
    const bucketStart = Math.floor((i + 1) * bucketSize) + 1;
    const bucketEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, data.length - 1);

    // Calculate average of next bucket for area computation
    const nextBucketStart = Math.floor((i + 2) * bucketSize) + 1;
    const nextBucketEnd = Math.min(Math.floor((i + 3) * bucketSize) + 1, data.length - 1);
    let avgX = 0, avgY = 0, count = 0;
    for (let j = nextBucketStart; j < nextBucketEnd && j < data.length; j++) {
      avgX += getX(data[j]);
      avgY += getY(data[j]);
      count++;
    }
    if (count > 0) { avgX /= count; avgY /= count; }

    // Find point in current bucket with max triangle area
    const prevX = getX(data[prevIndex]);
    const prevY = getY(data[prevIndex]);
    let maxArea = -1;
    let maxIndex = bucketStart;

    for (let j = bucketStart; j < bucketEnd && j < data.length; j++) {
      const area = Math.abs(
        (prevX - avgX) * (getY(data[j]) - prevY) -
        (prevX - getX(data[j])) * (avgY - prevY)
      );
      if (area > maxArea) {
        maxArea = area;
        maxIndex = j;
      }
    }

    sampled.push(data[maxIndex]);
    prevIndex = maxIndex;
  }

  sampled.push(data[data.length - 1]); // Always keep last point
  return sampled;
}

const MAX_POINTS = 5000;

/**
 * Downsample OBD2DataPoint array if it exceeds MAX_POINTS.
 * Uses engineRpm as the Y-axis proxy for visual importance (falls back to vehicleSpeed).
 */
export function downsampleTimeSeries(data: OBD2DataPoint[]): OBD2DataPoint[] {
  if (data.length <= MAX_POINTS) return data;
  return lttb(
    data,
    MAX_POINTS,
    (d) => d.timestamp,
    (d) => d.engineRpm ?? d.vehicleSpeed ?? 0
  );
}

/**
 * Downsample GPSDataPoint array if it exceeds MAX_POINTS.
 */
export function downsampleGPS(data: GPSDataPoint[]): GPSDataPoint[] {
  if (data.length <= MAX_POINTS) return data;
  return lttb(
    data,
    MAX_POINTS,
    (d) => d.timestamp,
    (d) => d.gpsSpeed ?? d.altitude ?? 0
  );
}
