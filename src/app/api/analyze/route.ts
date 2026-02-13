import { NextRequest, NextResponse } from "next/server";
import { parseCSV, parseJSON, createAnalysisResult } from "@/lib/data/analyzer";
import { validateFileFormat } from "@/lib/data/validators";
import { DrivingDataPoint } from "@/types";

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

    // Validate file format
    const format = validateFileFormat(file.name);
    if (!format) {
      return NextResponse.json(
        { error: "Invalid file format. Only CSV and JSON are supported." },
        { status: 400 }
      );
    }

    // Read file content
    const fileContent = await file.text();

    // Parse data based on format
    let dataPoints: DrivingDataPoint[] = [];

    if (format === "csv") {
      dataPoints = parseCSV(fileContent);
    } else if (format === "json") {
      const parsed = parseJSON(fileContent);
      if (Array.isArray(parsed)) {
        dataPoints = parsed;
      } else {
        dataPoints = parsed.dataPoints;
      }
    }

    if (dataPoints.length === 0) {
      return NextResponse.json(
        { error: "No valid data points found in file" },
        { status: 400 }
      );
    }

    // Generate session ID
    const sessionId = `session-${Date.now()}`;

    // Analyze data
    const analysisResult = createAnalysisResult(sessionId, dataPoints);

    return NextResponse.json({
      success: true,
      result: analysisResult,
      dataPointsCount: dataPoints.length,
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
