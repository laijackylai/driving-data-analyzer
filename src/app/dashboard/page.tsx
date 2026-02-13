"use client";

import { useState } from "react";
import Link from "next/link";
import { FileUpload } from "@/components/features/FileUpload";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AnalysisResult } from "@/types";

export default function DashboardPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze data");
      }

      setAnalysisResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSafetyScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Upload and analyze your driving data
            </p>
          </div>
          <Link href="/">
            <Button variant="outline">← Back to Home</Button>
          </Link>
        </div>

        {/* File Upload Section */}
        <div className="mb-8">
          <FileUpload onFileSelect={handleFileSelect} />
        </div>

        {/* Loading State */}
        {isAnalyzing && (
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 dark:text-gray-400">
                  Analyzing your driving data...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="mb-8 border-red-200 dark:border-red-800">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="font-semibold text-red-600 dark:text-red-400">
                    Analysis Failed
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis Results */}
        {analysisResult && (
          <div className="space-y-6">
            {/* Safety Score */}
            <Card>
              <CardHeader>
                <CardTitle>Safety Score</CardTitle>
                <CardDescription>
                  Overall driving safety assessment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div
                      className={`text-6xl font-bold ${getSafetyScoreColor(
                        analysisResult.safetyScore || 0
                      )}`}
                    >
                      {analysisResult.safetyScore}
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                      out of 100
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Average Speed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {analysisResult.metrics.averageSpeed}
                    <span className="text-lg text-gray-500 ml-1">km/h</span>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Max Speed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {analysisResult.metrics.maxSpeed}
                    <span className="text-lg text-gray-500 ml-1">km/h</span>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Distance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {analysisResult.metrics.distanceTraveled}
                    <span className="text-lg text-gray-500 ml-1">km</span>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Duration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {analysisResult.metrics.durationMinutes}
                    <span className="text-lg text-gray-500 ml-1">min</span>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Harsh Braking</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {analysisResult.metrics.harshBrakingEvents}
                    <span className="text-lg text-gray-500 ml-1">events</span>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Rapid Acceleration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {analysisResult.metrics.rapidAccelerationEvents}
                    <span className="text-lg text-gray-500 ml-1">events</span>
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Session Info */}
            <Card>
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">
                      Session ID
                    </dt>
                    <dd className="mt-1 font-mono text-sm">
                      {analysisResult.sessionId}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">
                      Analysis Time
                    </dt>
                    <dd className="mt-1 text-sm">
                      {new Date(analysisResult.timestamp).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!isAnalyzing && !analysisResult && !error && (
          <Card>
            <CardContent className="p-12 text-center">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Data Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Upload a file to start analyzing your driving data
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
