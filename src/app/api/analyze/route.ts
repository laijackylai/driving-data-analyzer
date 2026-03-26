import { NextRequest, NextResponse } from "next/server";
import { parseOBD2File } from "@/lib/data/obd2Parser";
import { parseCobbFile } from "@/lib/data/cobbParser";
import { analyzeOBD2Data } from "@/lib/data/obd2Analyzer";
import { analyzeCobbData } from "@/lib/data/cobbAnalyzer";
import { validateFileFormat } from "@/lib/data/obd2Validators";
import { detectDataSource } from "@/lib/data/sourceRegistry";
import { parseGPSData } from "@/lib/data/gpsParser";
import { computeDerivedMetrics } from "@/lib/data/deriveMetrics";
import { downsampleTimeSeries, downsampleGPS } from "@/lib/data/downsample";
import { IMPREZA_RS_THRESHOLDS } from "@/lib/data/thresholds";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 413 }
      );
    }

    const format = validateFileFormat(file.name);
    if (!format) {
      return NextResponse.json(
        { error: "Invalid file format. Only CSV files (.csv) are supported." },
        { status: 400 }
      );
    }

    const fileContent = await file.text();
    const dataSource = detectDataSource(fileContent);

    if (dataSource === "unknown") {
      return NextResponse.json(
        {
          error: "Unrecognized CSV format. Supported formats: OBD2 (semicolon-delimited long-form), COBB Accessport (comma-delimited wide-form).",
        },
        { status: 400 }
      );
    }

    let dataPoints;
    let cobbResult;
    let cobbMetadata;

    if (dataSource === "cobb") {
      const parsed = parseCobbFile(fileContent);
      dataPoints = parsed.dataPoints;
      cobbMetadata = parsed.metadata;
      cobbResult = analyzeCobbData(dataPoints);
    } else {
      dataPoints = parseOBD2File(fileContent);
    }

    // GPS parsing is called for all sources. COBB files have no GPS columns
    // so this returns an empty array — GPS panels will simply not render.
    const gpsData = parseGPSData(fileContent);
    const result = analyzeOBD2Data(dataPoints);
    const derived = computeDerivedMetrics(dataPoints);
    const timeSeries = downsampleTimeSeries(dataPoints);
    const gps = downsampleGPS(gpsData);

    return NextResponse.json({
      success: true,
      result,
      timeSeries,
      gps,
      derived,
      thresholds: IMPREZA_RS_THRESHOLDS,
      dataSource,
      ...(cobbResult && { cobbResult }),
      ...(cobbMetadata && { cobbMetadata }),
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
