import { describe, it, expect } from "vitest";
import { detectDataSource } from "@/lib/data/sourceRegistry";

// Minimal OBD2 CSV (semicolon-delimited, long-form)
const OBD2_CSV = `SECONDS;PID;VALUE;UNITS
0.000;Engine RPM;1234;rpm
0.000;Vehicle Speed;45;km/h
`;

// Minimal COBB CSV (comma-delimited, wide-form)
const COBB_CSV = `Time (sec),RPM (RPM),Boost (psi),Vehicle Speed (mph)
0.000,1098,-10.67,10
0.021,1089,-10.60,10
`;

// COBB CSV without boost (still valid COBB - Time (sec) + comma is enough)
const COBB_NO_BOOST_CSV = `Time (sec),RPM (RPM),Throttle Pos (%),MAF Corr (g/s)
0.000,1098,5.0,4.54
`;

const UNKNOWN_CSV = `foo,bar,baz
1,2,3
`;

const EMPTY = ``;

describe("detectDataSource", () => {
  it("detects OBD2 from semicolon-delimited long-form headers", () => {
    expect(detectDataSource(OBD2_CSV)).toBe("obd2");
  });

  it("detects COBB from Time (sec) + comma delimiter", () => {
    expect(detectDataSource(COBB_CSV)).toBe("cobb");
  });

  it("detects COBB even without Boost column", () => {
    expect(detectDataSource(COBB_NO_BOOST_CSV)).toBe("cobb");
  });

  it("returns unknown for unrecognized format", () => {
    expect(detectDataSource(UNKNOWN_CSV)).toBe("unknown");
  });

  it("returns unknown for empty input", () => {
    expect(detectDataSource(EMPTY)).toBe("unknown");
  });
});
