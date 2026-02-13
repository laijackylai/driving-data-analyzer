import { NextRequest, NextResponse } from "next/server";
import { parseOBD2File } from "@/lib/data/obd2Parser";
import { analyzeOBD2Data } from "@/lib/data/obd2Analyzer";
import { validateFileFormat } from "@/lib/data/obd2Validators";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 413 }
      );
    }

    // Validate file format (CSV only for OBD2)
    const format = validateFileFormat(file.name);
    if (!format) {
      return NextResponse.json(
        { error: "Invalid file format. Only OBD2 CSV files (.csv) are supported." },
        { status: 400 }
      );
    }

    // Read file content
    const fileContent = await file.text();

    // Parse OBD2 CSV data (throws if no valid data found)
    const dataPoints = parseOBD2File(fileContent);

    // Analyze data — return full OBD2AnalysisResult for the dashboard
    const result = analyzeOBD2Data(dataPoints);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze OBD2 data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
