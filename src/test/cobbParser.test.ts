import { describe, it, expect } from "vitest";
import { parseCobbFile, extractCobbMetadata } from "@/lib/data/cobbParser";

// All numeric values use ASCII hyphen-minus (-), not Unicode minus (U+2212).
const COBB_WITH_AP_INFO = `Time (sec),RPM (RPM),Vehicle Speed (mph),Boost (psi),Battery Volts (V),Coolant Temp (C),AC Compressor Sw (on/off),"AP Info:[AP3-SUB-006 v1.7.5.0-25910][2023 USDM WRX MT][Reflash: Stage1 93 v310.ptm]"
0.000,1098,10,-10.67,14.30,94,off,0
0.021,1089,10,-10.60,14.22,94,on,0
`;

const COBB_TWO_ROWS = `Time (sec),RPM (RPM),Vehicle Speed (mph),Boost (psi),Coolant Temp (C)
0.000,1098,10,-10.67,94
1.000,2500,30,5.5,95
`;

describe("parseCobbFile", () => {
  it("returns OBD2DataPoints with timestamp from Time (sec)", () => {
    const { dataPoints } = parseCobbFile(COBB_TWO_ROWS);
    expect(dataPoints[0].timestamp).toBe(0);
    expect(dataPoints[1].timestamp).toBe(1);
  });

  it("maps RPM column to engineRpm field", () => {
    const { dataPoints } = parseCobbFile(COBB_TWO_ROWS);
    expect(dataPoints[0].engineRpm).toBe(1098);
  });

  it("converts Vehicle Speed from mph to km/h", () => {
    const { dataPoints } = parseCobbFile(COBB_TWO_ROWS);
    // 10 mph × 1.60934 = 16.09
    expect(dataPoints[0].vehicleSpeed).toBeCloseTo(16.09, 1);
  });

  it("maps Boost column to boostPsi field", () => {
    const { dataPoints } = parseCobbFile(COBB_TWO_ROWS);
    expect(dataPoints[0].boostPsi).toBe(-10.67);
    expect(dataPoints[1].boostPsi).toBe(5.5);
  });

  it("maps Coolant Temp to coolantTemp field", () => {
    const { dataPoints } = parseCobbFile(COBB_TWO_ROWS);
    expect(dataPoints[0].coolantTemp).toBe(94);
  });

  it("converts AC Compressor Sw 'off'→0 and 'on'→1", () => {
    const { dataPoints } = parseCobbFile(COBB_WITH_AP_INFO);
    expect(dataPoints[0].acCompressorSw).toBe(0); // "off"
    expect(dataPoints[1].acCompressorSw).toBe(1); // "on"
  });

  it("extracts AP Info metadata through parseCobbFile", () => {
    const { metadata } = parseCobbFile(COBB_WITH_AP_INFO);
    expect(metadata.apVersion).toBe("AP3-SUB-006 v1.7.5.0-25910");
    expect(metadata.vehicle).toBe("2023 USDM WRX MT");
    expect(metadata.tune).toBe("Reflash: Stage1 93 v310.ptm");
  });

  it("skips unknown columns silently", () => {
    const csv = `Time (sec),RPM (RPM),Unknown Column
0.000,1098,999
`;
    const { dataPoints } = parseCobbFile(csv);
    expect(dataPoints[0].engineRpm).toBe(1098);
    expect((dataPoints[0] as Record<string, unknown>)["Unknown Column"]).toBeUndefined();
  });

  it("throws if first column is not Time (sec)", () => {
    const bad = `Seconds,RPM (RPM)
0.000,1098
`;
    expect(() => parseCobbFile(bad)).toThrow();
  });

  it("throws if fewer than 2 rows", () => {
    expect(() => parseCobbFile(`Time (sec),RPM (RPM)`)).toThrow();
  });
});

describe("extractCobbMetadata", () => {
  it("extracts AP version, vehicle, and tune from AP Info column header", () => {
    const header = `AP Info:[AP3-SUB-006 v1.7.5.0-25910][2023 USDM WRX MT][Reflash: Stage1 93 v310.ptm]`;
    const meta = extractCobbMetadata(header);
    expect(meta.apVersion).toBe("AP3-SUB-006 v1.7.5.0-25910");
    expect(meta.vehicle).toBe("2023 USDM WRX MT");
    expect(meta.tune).toBe("Reflash: Stage1 93 v310.ptm");
  });

  it("returns empty object for non-AP Info string", () => {
    const meta = extractCobbMetadata("some other column");
    expect(meta).toEqual({});
  });
});
