import { OBD2Reading } from "@/types";
import { PID_MAP } from "./pidConstants";

/**
 * Type guard: validate that an object is a valid OBD2Reading.
 */
export function isValidOBD2Reading(data: unknown): data is OBD2Reading {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.timestamp === "number" &&
    !isNaN(obj.timestamp) &&
    typeof obj.pid === "string" &&
    obj.pid.length > 0 &&
    (typeof obj.value === "number" || obj.value === null) &&
    typeof obj.units === "string"
  );
}

/**
 * Validate that CSV headers contain the required OBD2 columns.
 * Expected: SECONDS, PID, VALUE, UNITS
 */
export function validateOBD2Headers(headers: string[]): boolean {
  const normalized = headers.map((h) => h.toUpperCase().trim());
  const required = ["SECONDS", "PID", "VALUE", "UNITS"];
  return required.every((r) => normalized.includes(r));
}

/**
 * Check if a PID name is recognized in our PID_MAP.
 */
export function isKnownPID(pid: string): boolean {
  return pid in PID_MAP;
}

/**
 * Validate file format. Only CSV is supported for OBD2 data.
 */
export function validateFileFormat(filename: string): "csv" | null {
  const extension = filename.split(".").pop()?.toLowerCase();
  if (extension === "csv") return "csv";
  return null;
}
