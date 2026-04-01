import { OBD2DataPoint, CobbMetadata, CobbParseResult } from "@/types";
import {
  COBB_COLUMN_MAP,
  COBB_AP_INFO_PATTERN,
  COBB_STRING_COLUMNS,
  COBB_STRING_COLUMN_FIELDS,
} from "@/lib/data/cobbColumnMap";

/**
 * Normalize a COBB CSV header: replace all non-ASCII characters with \ufffd.
 * COBB CSVs may be saved with broken encoding where ° becomes the UTF-8
 * replacement character \ufffd. Normalize to \ufffd for consistent map lookup.
 */
function normalizeHeader(h: string): string {
  // eslint-disable-next-line no-control-regex
  return h.replace(/[^\x00-\x7F]/g, "\ufffd");
}

/**
 * Extract CobbMetadata from an AP Info column header string.
 * Format: "AP Info:[apVersion][vehicle][tune]"
 */
export function extractCobbMetadata(apInfoHeader: string): CobbMetadata {
  if (!COBB_AP_INFO_PATTERN.test(apInfoHeader)) return {};
  const matches = apInfoHeader.match(/\[([^\]]+)\]/g);
  if (!matches) return {};
  return {
    apVersion: matches[0]?.slice(1, -1),
    vehicle: matches[1]?.slice(1, -1),
    tune: matches[2]?.slice(1, -1),
  };
}

/**
 * Parse COBB Accessport wide-form CSV into OBD2DataPoint array.
 * Each row becomes one data point; columns are mapped via COBB_COLUMN_MAP.
 * Vehicle Speed is converted from mph to km/h.
 * AC Compressor Sw "on"/"off" strings are converted to 1/0.
 * Header degree symbols are normalized to \ufffd before lookup.
 */
export function parseCobbFile(csvText: string): CobbParseResult {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) {
    throw new Error("COBB CSV file is empty or has no data rows");
  }

  // Parse headers — COBB uses comma delimiter, may have quoted fields
  const rawHeaders = parseCobbLine(lines[0]);

  if (!rawHeaders[0]?.trim().startsWith("Time (sec)")) {
    throw new Error(
      `Invalid COBB CSV: first column must be "Time (sec)", got "${rawHeaders[0]}"`
    );
  }

  // Find AP Info column index and extract metadata
  const apInfoIdx = rawHeaders.findIndex((h) => COBB_AP_INFO_PATTERN.test(h.trim()));
  const metadata: CobbMetadata =
    apInfoIdx >= 0 ? extractCobbMetadata(rawHeaders[apInfoIdx].trim()) : {};

  // Build index → field mapping (skip Time (sec) at 0, skip AP Info)
  // Normalize headers for degree-symbol encoding before map lookup
  const numericMappings: Array<{ index: number; field: string; transform?: (v: number) => number }> = [];
  const stringMappings: Array<{ index: number; field: string; valueMap: Record<string, number> }> = [];

  for (let i = 1; i < rawHeaders.length; i++) {
    if (i === apInfoIdx) continue;
    const rawHeader = rawHeaders[i].trim();
    const normHeader = normalizeHeader(rawHeader);

    // Check string-value columns first (e.g. AC Compressor Sw "on"/"off")
    const stringValueMap = COBB_STRING_COLUMNS[rawHeader] ?? COBB_STRING_COLUMNS[normHeader];
    const stringField = COBB_STRING_COLUMN_FIELDS[rawHeader] ?? COBB_STRING_COLUMN_FIELDS[normHeader];
    if (stringValueMap && stringField) {
      stringMappings.push({ index: i, field: stringField, valueMap: stringValueMap });
      continue;
    }

    // Regular numeric columns — try normalized header, then raw
    const mapping = COBB_COLUMN_MAP[normHeader] ?? COBB_COLUMN_MAP[rawHeader];
    if (mapping) {
      numericMappings.push({ index: i, field: mapping.field, transform: mapping.transform });
    }
  }

  const dataPoints: OBD2DataPoint[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = parseCobbLine(line);
    const timestampStr = fields[0]?.trim();
    const timestamp = parseFloat(timestampStr ?? "");
    if (isNaN(timestamp)) continue;

    const point: OBD2DataPoint = { timestamp };

    for (const { index, field, transform } of numericMappings) {
      const raw = fields[index]?.trim();
      if (!raw || raw === "") continue;
      const parsed = parseFloat(raw);
      if (isNaN(parsed)) continue;
      const value = transform ? transform(parsed) : parsed;
      (point as unknown as Record<string, number>)[field] = value;
    }

    for (const { index, field, valueMap } of stringMappings) {
      const raw = fields[index]?.trim().toLowerCase();
      if (raw !== undefined && raw in valueMap) {
        (point as unknown as Record<string, number>)[field] = valueMap[raw];
      }
    }

    dataPoints.push(point);
  }

  if (dataPoints.length === 0) {
    throw new Error("No valid data rows found in COBB CSV");
  }

  return { dataPoints, metadata };
}

/**
 * Split a comma-delimited COBB CSV line respecting quoted fields.
 */
function parseCobbLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
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
