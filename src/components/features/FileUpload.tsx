"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { cn, formatFileSize } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedFormats?: string[];
  maxSizeMB?: number;
}

export function FileUpload({
  onFileSelect,
  acceptedFormats = [".csv"],
  maxSizeMB = 10,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateFile = (file: File): boolean => {
    if (file.size > maxSizeBytes) {
      setError(`File size exceeds ${maxSizeMB}MB limit`);
      return false;
    }

    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!acceptedFormats.includes(fileExtension)) {
      setError(`Only ${acceptedFormats.join(", ")} files are accepted`);
      return false;
    }

    setError(null);
    return true;
  };

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4 sm:p-6">
        <div
          className={cn(
            "relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all duration-200",
            isDragging
              ? "border-sapphire-400 bg-sapphire-800/30 shadow-[inset_0_0_30px_rgba(54,112,198,0.08)]"
              : "border-sapphire-700/40 hover:border-sapphire-600/50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(",")}
            onChange={handleFileInput}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-3 sm:gap-4">
            {/* Upload icon */}
            <div
              className={cn(
                "flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl transition-colors duration-200",
                isDragging
                  ? "bg-sapphire-700/40 text-sapphire-300"
                  : "bg-sapphire-800/40 text-sapphire-500"
              )}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>

            {selectedFile ? (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-sapphire-100 truncate max-w-[260px] sm:max-w-none">
                  {selectedFile.name}
                </p>
                <p className="text-xs font-mono text-sapphire-400">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-medium text-sapphire-200">
                  Drag and drop your file here
                </p>
                <p className="text-xs text-sapphire-500">
                  {acceptedFormats.join(", ")} up to {maxSizeMB}MB
                </p>
              </div>
            )}

            {error && (
              <p className="text-xs font-medium text-accent-red-400">{error}</p>
            )}

            <Button
              onClick={handleButtonClick}
              variant={selectedFile ? "secondary" : "primary"}
              size="md"
              className="min-h-[44px] min-w-[140px]"
            >
              {selectedFile ? "Choose Different File" : "Browse Files"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
