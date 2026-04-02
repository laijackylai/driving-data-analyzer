"use client";

import { OBD2DataPoint } from "@/types";

interface CobbEngineTabProps {
  timeSeries: OBD2DataPoint[];
}

export function CobbEngineTab({ timeSeries }: CobbEngineTabProps) {
  return (
    <div className="space-y-4 pt-4">
      <p className="text-sapphire-400 text-sm">Engine charts coming soon</p>
    </div>
  );
}
