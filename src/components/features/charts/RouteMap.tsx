"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { GPSDataPoint } from "@/types";
import { useTimeRange } from "@/hooks/useTimeRange";
import { CHART_COLORS } from "@/lib/chartTheme";

// Dynamically import all react-leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Polyline = dynamic(
  () => import("react-leaflet").then((m) => m.Polyline),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then((m) => m.CircleMarker),
  { ssr: false }
);

function FitBounds({ gps }: { gps: GPSDataPoint[] }) {
  const { useMap } = require("react-leaflet");
  const map = useMap();
  useEffect(() => {
    if (gps.length < 2) return;
    const lats = gps.map((p) => p.lat);
    const lons = gps.map((p) => p.lon);
    map.fitBounds([
      [Math.min(...lats), Math.min(...lons)],
      [Math.max(...lats), Math.max(...lons)],
    ], { padding: [20, 20] });
  }, [gps, map]);
  return null;
}

function speedToColor(speed: number | undefined): string {
  const s = speed ?? 0;
  if (s < 30) return CHART_COLORS.emerald;
  if (s < 80) return CHART_COLORS.amber;
  return CHART_COLORS.subaruRed;
}

interface RouteMapProps {
  gps: GPSDataPoint[];
  height?: number;
  className?: string;
}

export function RouteMap({ gps, height = 350, className }: RouteMapProps) {
  const { timeRange, setTimeRange } = useTimeRange();

  const segments = useMemo(() => {
    if (gps.length < 2) return [];
    const result = [];
    for (let i = 0; i < gps.length - 1; i++) {
      const p1 = gps[i];
      const p2 = gps[i + 1];
      const isActive = timeRange.start !== null && timeRange.end !== null;
      const inRange = !isActive ||
        (p1.timestamp >= timeRange.start! && p1.timestamp <= timeRange.end!);
      result.push({
        positions: [[p1.lat, p1.lon], [p2.lat, p2.lon]] as [number, number][],
        color: speedToColor(p1.gpsSpeed),
        opacity: inRange ? 1 : 0.2,
        timestamp: p1.timestamp,
        nextTimestamp: p2.timestamp,
      });
    }
    return result;
  }, [gps, timeRange]);

  if (gps.length === 0) {
    return (
      <div
        style={{ height }}
        className={`flex items-center justify-center rounded-xl border border-glass-edge bg-sapphire-900/20 ${className ?? ""}`}
      >
        <p className="text-sm text-sapphire-500">No GPS data available</p>
      </div>
    );
  }

  const center: [number, number] = [gps[Math.floor(gps.length / 2)].lat, gps[Math.floor(gps.length / 2)].lon];

  return (
    <div style={{ height }} className={`rounded-xl overflow-hidden ${className ?? ""}`}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ width: "100%", height: "100%" }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
        />

        {/* GPS track segments colored by speed */}
        {segments.map((seg, i) => (
          <Polyline
            key={i}
            positions={seg.positions}
            pathOptions={{ color: seg.color, weight: 3, opacity: seg.opacity }}
            eventHandlers={{
              click: () => {
                setTimeRange({
                  start: seg.timestamp,
                  end: seg.nextTimestamp,
                  source: "map",
                });
              },
            }}
          />
        ))}

        {/* Start marker */}
        <CircleMarker
          center={[gps[0].lat, gps[0].lon]}
          radius={8}
          pathOptions={{ color: CHART_COLORS.emerald, fillColor: CHART_COLORS.emerald, fillOpacity: 1 }}
        />

        {/* End marker */}
        <CircleMarker
          center={[gps[gps.length - 1].lat, gps[gps.length - 1].lon]}
          radius={8}
          pathOptions={{ color: CHART_COLORS.subaruRed, fillColor: CHART_COLORS.subaruRed, fillOpacity: 1 }}
        />

        <FitBounds gps={gps} />
      </MapContainer>
    </div>
  );
}
