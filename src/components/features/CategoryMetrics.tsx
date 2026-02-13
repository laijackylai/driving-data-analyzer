import { cn } from "@/lib/utils";
import { MetricCard } from "./MetricCard";
import type { CategoryMetricsType } from "@/types";

// ── Types ──

interface MetricDef {
  key: string;
  label: string;
  unit: string;
  description?: string;
}

interface MetricGroup {
  label: string;
  metrics: MetricDef[];
}

// ── Warning thresholds ──
// Values that cross these boundaries get amber/red highlighting

interface WarningRule {
  warn: number;
  danger: number;
  /** "above" = exceeding threshold is bad, "below" = dropping below is bad */
  direction: "above" | "below";
}

const WARNING_THRESHOLDS: Record<string, WarningRule> = {
  // Engine
  maxRpm: { warn: 6000, danger: 7000, direction: "above" },
  maxLoad: { warn: 90, danger: 98, direction: "above" },
  maxCoolantTemp: { warn: 100, danger: 110, direction: "above" },
  maxOilTemp: { warn: 120, danger: 130, direction: "above" },
  avgKnockCorrection: { warn: 5, danger: 10, direction: "above" },
  // Motion
  harshBrakingEvents: { warn: 3, danger: 8, direction: "above" },
  rapidAccelerationEvents: { warn: 3, danger: 8, direction: "above" },
  // Transmission
  maxCvtTemp: { warn: 110, danger: 130, direction: "above" },
  // Electrical
  minBatteryVoltage: { warn: 12.0, danger: 11.5, direction: "below" },
};

function getWarningColor(
  key: string,
  value: number | null
): "green" | "amber" | "red" | "default" {
  if (value === null || value === undefined) return "default";
  const rule = WARNING_THRESHOLDS[key];
  if (!rule) return "default";

  if (rule.direction === "above") {
    if (value >= rule.danger) return "red";
    if (value >= rule.warn) return "amber";
  } else {
    if (value <= rule.danger) return "red";
    if (value <= rule.warn) return "amber";
  }
  return "default";
}

// ── Grouped metric definitions per category ──

const CATEGORY_GROUPS: Record<string, MetricGroup[]> = {
  motion: [
    {
      label: "Speed & Distance",
      metrics: [
        { key: "avgSpeed", label: "Average Speed", unit: "km/h" },
        { key: "maxSpeed", label: "Max Speed", unit: "km/h" },
        { key: "totalDistance", label: "Total Distance", unit: "km" },
        { key: "durationMinutes", label: "Duration", unit: "min" },
      ],
    },
    {
      label: "Driving Behavior",
      metrics: [
        { key: "harshBrakingEvents", label: "Harsh Braking", unit: "events" },
        {
          key: "rapidAccelerationEvents",
          label: "Rapid Acceleration",
          unit: "events",
        },
        { key: "avgAcceleration", label: "Avg Acceleration", unit: "g" },
        { key: "maxAcceleration", label: "Max Acceleration", unit: "g" },
      ],
    },
  ],
  engine: [
    {
      label: "Performance",
      metrics: [
        { key: "avgRpm", label: "Average RPM", unit: "rpm" },
        { key: "maxRpm", label: "Max RPM", unit: "rpm" },
        { key: "avgLoad", label: "Avg Engine Load", unit: "%" },
        { key: "maxLoad", label: "Max Engine Load", unit: "%" },
        { key: "avgTimingAdvance", label: "Avg Timing Advance", unit: "\u00b0" },
        {
          key: "avgKnockCorrection",
          label: "Avg Knock Correction",
          unit: "\u00b0",
        },
      ],
    },
    {
      label: "Temperature",
      metrics: [
        { key: "avgCoolantTemp", label: "Avg Coolant Temp", unit: "\u2103" },
        { key: "maxCoolantTemp", label: "Max Coolant Temp", unit: "\u2103" },
        { key: "avgOilTemp", label: "Avg Oil Temp", unit: "\u2103" },
        { key: "maxOilTemp", label: "Max Oil Temp", unit: "\u2103" },
      ],
    },
  ],
  fuel: [
    {
      label: "Consumption",
      metrics: [
        {
          key: "avgFuelConsumption",
          label: "Avg Fuel Consumption",
          unit: "L/100km",
        },
        {
          key: "avgFuelConsumptionTotal",
          label: "Trip Avg Consumption",
          unit: "L/100km",
        },
        {
          key: "avgInstantFuelRate",
          label: "Avg Instant Fuel Rate",
          unit: "L/h",
        },
        {
          key: "maxInstantFuelRate",
          label: "Max Instant Fuel Rate",
          unit: "L/h",
        },
      ],
    },
    {
      label: "Usage & Cost",
      metrics: [
        { key: "totalFuelUsed", label: "Total Fuel Used", unit: "L" },
        { key: "totalFuelCost", label: "Total Fuel Cost", unit: "$" },
      ],
    },
    {
      label: "Fuel Trims",
      metrics: [
        {
          key: "avgShortTermFuelTrim",
          label: "Avg Short Term Trim",
          unit: "%",
        },
        {
          key: "avgLongTermFuelTrim",
          label: "Avg Long Term Trim",
          unit: "%",
        },
        { key: "avgFuelAirRatio", label: "Avg Fuel/Air Ratio", unit: "" },
      ],
    },
  ],
  airIntake: [
    {
      label: "Air Flow",
      metrics: [
        { key: "avgMafAirFlow", label: "Avg MAF Air Flow", unit: "g/sec" },
        { key: "maxMafAirFlow", label: "Max MAF Air Flow", unit: "g/sec" },
        {
          key: "avgManifoldPressure",
          label: "Avg Manifold Pressure",
          unit: "kPa",
        },
      ],
    },
    {
      label: "Boost & Throttle",
      metrics: [
        { key: "avgBoost", label: "Average Boost", unit: "bar" },
        { key: "maxBoost", label: "Max Boost", unit: "bar" },
        {
          key: "avgThrottlePosition",
          label: "Avg Throttle Position",
          unit: "%",
        },
        {
          key: "maxThrottlePosition",
          label: "Max Throttle Position",
          unit: "%",
        },
      ],
    },
    {
      label: "Conditions",
      metrics: [
        { key: "avgIntakeTemp", label: "Avg Intake Temp", unit: "\u2103" },
      ],
    },
  ],
  power: [
    {
      label: "Fuel-Based Estimate",
      metrics: [
        { key: "avgPowerFuel", label: "Average Power", unit: "hp" },
        { key: "maxPowerFuel", label: "Max Power", unit: "hp" },
      ],
    },
    {
      label: "MAF-Based Estimate",
      metrics: [
        { key: "avgPowerMaf", label: "Average Power", unit: "hp" },
        { key: "maxPowerMaf", label: "Max Power", unit: "hp" },
      ],
    },
  ],
  transmission: [
    {
      label: "Temperature",
      metrics: [
        { key: "avgCvtTemp", label: "Avg CVT Temp", unit: "\u2103" },
        { key: "maxCvtTemp", label: "Max CVT Temp", unit: "\u2103" },
      ],
    },
    {
      label: "Ratios",
      metrics: [
        { key: "avgGearRatio", label: "Avg Gear Ratio", unit: "" },
        { key: "avgLockUpDutyRatio", label: "Avg Lock-Up Duty", unit: "%" },
      ],
    },
    {
      label: "Pulley & Turbine Speeds",
      metrics: [
        {
          key: "avgPrimaryPulleySpeed",
          label: "Avg Primary Pulley",
          unit: "rpm",
        },
        {
          key: "avgSecondaryPulleySpeed",
          label: "Avg Secondary Pulley",
          unit: "rpm",
        },
        { key: "avgTurbineSpeed", label: "Avg Turbine Speed", unit: "rpm" },
      ],
    },
  ],
  abs: [
    {
      label: "Wheel Speeds",
      metrics: [
        {
          key: "avgFrontLeftWheelSpeed",
          label: "Front Left",
          unit: "km/h",
        },
        {
          key: "avgFrontRightWheelSpeed",
          label: "Front Right",
          unit: "km/h",
        },
        {
          key: "avgRearLeftWheelSpeed",
          label: "Rear Left",
          unit: "km/h",
        },
        {
          key: "avgRearRightWheelSpeed",
          label: "Rear Right",
          unit: "km/h",
        },
      ],
    },
    {
      label: "Steering",
      metrics: [
        {
          key: "avgSteeringAngle",
          label: "Avg Steering Angle",
          unit: "\u00b0",
        },
        {
          key: "maxSteeringAngle",
          label: "Max Steering Angle",
          unit: "\u00b0",
        },
      ],
    },
  ],
  awd: [
    {
      label: "Solenoid Current",
      metrics: [
        {
          key: "avgSolenoidActualCurrent",
          label: "Avg Actual Current",
          unit: "mA",
        },
        {
          key: "maxSolenoidActualCurrent",
          label: "Max Actual Current",
          unit: "mA",
        },
        {
          key: "avgSolenoidSetCurrent",
          label: "Avg Set Current",
          unit: "mA",
        },
      ],
    },
  ],
  electrical: [
    {
      label: "Battery",
      metrics: [
        { key: "avgBatteryVoltage", label: "Avg Voltage", unit: "V" },
        { key: "minBatteryVoltage", label: "Min Voltage", unit: "V" },
        { key: "maxBatteryVoltage", label: "Max Voltage", unit: "V" },
      ],
    },
  ],
};

// ── Component ──

interface CategoryMetricsProps {
  category: string;
  metrics: CategoryMetricsType;
}

export function CategoryMetrics({ category, metrics }: CategoryMetricsProps) {
  const groups = CATEGORY_GROUPS[category];
  if (!groups) return null;

  const metricsRecord = metrics as unknown as Record<string, number | null>;

  // Filter groups — only show groups that have at least one non-null metric
  const activeGroups = groups
    .map((group) => ({
      ...group,
      metrics: group.metrics.filter((def) => {
        const val = metricsRecord[def.key];
        return val !== null && val !== undefined;
      }),
    }))
    .filter((group) => group.metrics.length > 0);

  if (activeGroups.length === 0) {
    return null; // CategoryPanel handles the empty state
  }

  // Continuous delay index across all groups for staggered animation
  let globalIndex = 0;

  return (
    <div className="space-y-6">
      {activeGroups.map((group) => (
        <div key={group.label}>
          {/* Group header with gradient divider */}
          <div className="flex items-center gap-3 mb-3">
            <span
              className={cn(
                "text-[11px] font-semibold uppercase tracking-[0.15em]",
                "text-sapphire-500"
              )}
            >
              {group.label}
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-sapphire-800/60 to-transparent" />
          </div>

          {/* Metric cards grid — 2-col mobile, 3-col desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
            {group.metrics.map((def) => {
              const value = metricsRecord[def.key];
              const color = getWarningColor(def.key, value);
              const idx = globalIndex++;
              return (
                <MetricCard
                  key={def.key}
                  label={def.label}
                  value={value}
                  unit={def.unit}
                  description={def.description}
                  color={color}
                  delayIndex={idx}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
