import { DataSource, SourceDetector } from "@/types";

const detectors: SourceDetector[] = [
  {
    source: "obd2",
    priority: 10,
    detect(csvText: string): boolean {
      const firstLine = csvText.split("\n")[0] ?? "";
      const upper = firstLine.toUpperCase();
      return (
        firstLine.includes(";") &&
        upper.includes("SECONDS") &&
        upper.includes("PID") &&
        upper.includes("VALUE")
      );
    },
  },
  {
    source: "cobb",
    priority: 10,
    detect(csvText: string): boolean {
      const firstLine = csvText.split("\n")[0] ?? "";
      return (
        firstLine.includes(",") &&
        firstLine.trim().startsWith("Time (sec)")
      );
    },
  },
];

/**
 * Detect the data source format from CSV text.
 * Runs all registered detectors in priority order; returns first match.
 * Returns 'unknown' if no detector matches.
 */
export function detectDataSource(csvText: string): DataSource {
  if (!csvText.trim()) return "unknown";

  const sorted = [...detectors].sort((a, b) => b.priority - a.priority);
  for (const detector of sorted) {
    if (detector.detect(csvText)) return detector.source;
  }
  return "unknown";
}

/**
 * Register a new source detector (for future data sources).
 */
export function registerDetector(detector: SourceDetector): void {
  detectors.push(detector);
}
