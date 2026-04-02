"use client";

import { OBD2DataPoint } from "@/types";

interface CobbPowerTabProps {
  timeSeries: OBD2DataPoint[];
}

export function CobbPowerTab({ timeSeries }: CobbPowerTabProps) {
  return (
    <div className="space-y-4 pt-4">
      <p className="text-sapphire-400 text-sm">Power charts coming soon</p>
    </div>
  );
}
