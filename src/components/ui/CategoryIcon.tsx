import { cn } from "@/lib/utils";

interface CategoryIconProps {
  category: string;
  className?: string;
  size?: number;
}

/**
 * SVG icon set for each of the 9 OBD2 data categories.
 * Designed with a consistent 24×24 viewBox, thin stroke style.
 */
export function CategoryIcon({
  category,
  className,
  size = 20,
}: CategoryIconProps) {
  const iconProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: cn("shrink-0", className),
  };

  switch (category) {
    // Engine — piston/crank
    case "engine":
      return (
        <svg {...iconProps}>
          <rect x="7" y="2" width="10" height="14" rx="2" />
          <line x1="9" y1="6" x2="15" y2="6" />
          <line x1="9" y1="10" x2="15" y2="10" />
          <line x1="12" y1="16" x2="12" y2="22" />
          <circle cx="12" cy="20" r="2" />
        </svg>
      );

    // Air Intake — wind/airflow
    case "airIntake":
      return (
        <svg {...iconProps}>
          <path d="M9.59 4.59A2 2 0 1 1 11 8H2" />
          <path d="M12.59 19.41A2 2 0 1 0 14 16H2" />
          <path d="M17.73 7.73A2.5 2.5 0 1 1 19.5 12H2" />
        </svg>
      );

    // Fuel — fuel drop
    case "fuel":
      return (
        <svg {...iconProps}>
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
      );

    // Power — lightning bolt
    case "power":
      return (
        <svg {...iconProps}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );

    // Motion — speedometer
    case "motion":
      return (
        <svg {...iconProps}>
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="M12 6v2" />
          <path d="M16.24 7.76l-1.42 1.42" />
          <path d="M18 12h-2" />
          <path d="M12 12l-3.5 3.5" />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
        </svg>
      );

    // Transmission — gear
    case "transmission":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v4" />
          <path d="M12 19v4" />
          <path d="M1 12h4" />
          <path d="M19 12h4" />
          <path d="M4.22 4.22l2.83 2.83" />
          <path d="M16.95 16.95l2.83 2.83" />
          <path d="M4.22 19.78l2.83-2.83" />
          <path d="M16.95 7.05l2.83-2.83" />
        </svg>
      );

    // ABS — brake disc
    case "abs":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v4" />
          <path d="M12 18v4" />
          <path d="M2 12h4" />
          <path d="M18 12h4" />
        </svg>
      );

    // AWD — 4 wheels connected
    case "awd":
      return (
        <svg {...iconProps}>
          <rect x="2" y="2" width="6" height="6" rx="1" />
          <rect x="16" y="2" width="6" height="6" rx="1" />
          <rect x="2" y="16" width="6" height="6" rx="1" />
          <rect x="16" y="16" width="6" height="6" rx="1" />
          <line x1="8" y1="5" x2="16" y2="5" />
          <line x1="8" y1="19" x2="16" y2="19" />
          <line x1="5" y1="8" x2="5" y2="16" />
          <line x1="19" y1="8" x2="19" y2="16" />
        </svg>
      );

    // Electrical — battery
    case "electrical":
      return (
        <svg {...iconProps}>
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M7 7V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2" />
          <path d="M13 7V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2" />
          <line x1="7" y1="14" x2="10" y2="14" />
          <line x1="14" y1="12.5" x2="17" y2="12.5" />
          <line x1="15.5" y1="11" x2="15.5" y2="14" />
        </svg>
      );

    default:
      // Fallback — generic data icon
      return (
        <svg {...iconProps}>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
  }
}

/**
 * Map from category key to display label.
 */
export const CATEGORY_LABELS: Record<string, string> = {
  motion: "Motion",
  engine: "Engine",
  fuel: "Fuel",
  airIntake: "Air Intake",
  power: "Power",
  transmission: "Transmission",
  abs: "ABS / Stability",
  awd: "AWD",
  electrical: "Electrical",
};

/**
 * Ordered list of category keys (matches the tab order in the design spec).
 */
export const CATEGORY_ORDER = [
  "motion",
  "engine",
  "fuel",
  "airIntake",
  "power",
  "transmission",
  "abs",
  "awd",
  "electrical",
] as const;
