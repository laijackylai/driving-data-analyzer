# OBD-2 Data Structure Documentation

## Overview

This document describes the structure of OBD-2 (On-Board Diagnostics) data files used in the driving data analyzer project. The data is exported from OBD-2 readers in CSV format with semicolon delimiters.

## File Format

- **Format**: CSV (Comma-Separated Values) with semicolon (`;`) delimiters
- **Encoding**: UTF-8
- **File Size**: Typically 1-10 MB for a single driving session
- **Record Count**: ~138,000 records per hour of driving
- **Naming Convention**: `YYYY-MM-DD HH-MM-SS.csv`

## CSV Structure

### Header Row
```csv
"SECONDS";"PID";"VALUE";"UNITS";
```

### Data Rows
Each row represents a single sensor reading at a specific timestamp:
```csv
"<timestamp>";"<parameter_name>";"<value>";"<unit>";
```

### Column Definitions

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| SECONDS | Float | Unix timestamp in seconds with microsecond precision | `39367.060656` |
| PID | String | Parameter ID - human-readable sensor/metric name | `"Engine RPM"` |
| VALUE | String/Float | Measured value (numeric or empty string) | `"1212"` or `"0"` |
| UNITS | String | Unit of measurement | `"rpm"`, `"km/h"`, `"℃"`, `"%"` |

## Data Characteristics

### Temporal Properties
- **Non-uniform sampling**: Different PIDs are sampled at different rates
- **Timestamp precision**: Microsecond-level precision (6 decimal places)
- **Time range**: Typically spans 1-2 hours per file
- **Interleaved data**: Multiple PIDs share the same timestamp, but readings are in separate rows

### Value Properties
- **Numeric precision**: Varies by PID (integers to 15+ decimal places)
- **Empty values**: `"0"` is used for both zero values and missing data
- **Sign**: Can be positive or negative (e.g., boost pressure, steering angle)

## Parameter Categories

### 1. Engine Parameters

| PID | Units | Description | Typical Range |
|-----|-------|-------------|---------------|
| Engine RPM | rpm | Engine revolutions per minute | 600-7000 |
| Engine RPM x1000 | rpm | RPM divided by 1000 | 0.6-7.0 |
| Calculated engine load value | % | Engine load percentage | 0-100 |
| Timing advance | ° | Ignition timing advance | -20 to +40 |
| Engine coolant temperature | ℃ | Coolant temperature | 70-110 |
| Engine coolant temperature (A) | ℃ | Coolant temp sensor A | 70-110 |
| Engine coolant temperature (B) | ℃ | Coolant temp sensor B | 70-110 |
| Engine oil temperature | ℃ | Oil temperature | 70-120 |
| Knocking Correction | ° | Knock sensor timing correction | -10 to +10 |
| Learned Ignition Timing | ° | ECU learned timing adjustment | -5 to +5 |
| OCV Duty Left | % | Oil Control Valve duty cycle | 0-100 |

### 2. Air Intake Parameters

| PID | Units | Description | Typical Range |
|-----|-------|-------------|---------------|
| MAF air flow rate | g/sec | Mass air flow rate | 0-100 |
| Intake manifold absolute pressure | kPa | Manifold absolute pressure | 20-100 |
| Calculated boost | bar | Turbo boost pressure | -1.0 to +2.5 |
| Intake air temperature | ℃ | Intake air temperature | 0-50 |
| Barometric pressure | kPa | Atmospheric pressure | 95-105 |
| Relative throttle position | % | Throttle position | 0-100 |

### 3. Fuel System Parameters

| PID | Units | Description | Typical Range |
|-----|-------|-------------|---------------|
| Average fuel consumption | L/100km | Current average fuel economy | 0-30 |
| Average fuel consumption (total) | L/100km | Trip average fuel economy | 5-20 |
| Average fuel consumption 10 sec | L/100km | 10-second rolling average | 0-50 |
| Calculated instant fuel rate | L/h | Instantaneous fuel flow | 0-20 |
| Fuel used (total) | L | Total fuel consumed | 0+ |
| Fuel used price | $1.3 | Current fuel cost | 0+ |
| Fuel used price (total) | $1.3 | Total fuel cost | 0+ |
| Fuel economizer | (boolean) | 1=economy mode, 0=normal | 0 or 1 |
| Short term fuel % trim - Bank 1 | % | Short-term fuel adjustment | -20 to +20 |
| Long term fuel % trim - Bank 1 | % | Long-term fuel adjustment | -20 to +20 |
| Commanded Fuel Rail Pressure | kPa | Target fuel rail pressure | 3000-10000 |
| Fuel Rail Pressure | kPa | Actual fuel rail pressure | 3000-10000 |
| Fuel/Air commanded equivalence ratio | (ratio) | Target air-fuel ratio | 0.8-1.2 |
| A/F Sensor #1 | (ratio) | Actual air-fuel ratio | 0.8-1.2 |

### 4. Power Calculations

| PID | Units | Description | Typical Range |
|-----|-------|-------------|---------------|
| Instant engine power (based on fuel consumption) | hp | Calculated horsepower | 0-300 |
| Power from MAF | hp | Power calculated from MAF | 0-300 |

### 5. Vehicle Motion Parameters

| PID | Units | Description | Typical Range |
|-----|-------|-------------|---------------|
| Vehicle speed | km/h | Speed from ECU | 0-200 |
| Vehicle acceleration | g | Acceleration in g-force | -1.0 to +1.0 |
| Average speed | km/h | Average speed | 0-120 |
| Distance travelled | km | Trip distance | 0+ |
| Distance travelled (total) | km | Total distance | 0+ |

### 6. Transmission Parameters

| PID | Units | Description | Typical Range |
|-----|-------|-------------|---------------|
| AT/CVT Temperature v.1 | ℃ | Transmission temperature | 60-110 |
| Actual Gear Ratio | (ratio) | Current gear ratio | 0.5-4.0 |
| Target Gear Ratio | (ratio) | Target gear ratio | 0.5-4.0 |
| Primary Pulley Speed | rpm | CVT primary pulley | 0-7000 |
| Secondary Pulley Speed | rpm | CVT secondary pulley | 0-7000 |
| Turbine Speed | rpm | Torque converter turbine | 0-7000 |
| Lock Up Duty Ratio | % | Torque converter lock-up | 0-100 |

### 7. ABS/Stability System Parameters

| PID | Units | Description | Typical Range |
|-----|-------|-------------|---------------|
| [ABS] Front left wheel speed | km/h | FL wheel speed | 0-200 |
| [ABS] Front right wheel speed | km/h | FR wheel speed | 0-200 |
| [ABS] Rear left wheel speed | km/h | RL wheel speed | 0-200 |
| [ABS] Rear right wheel speed | km/h | RR wheel speed | 0-200 |
| [ABS] Steering angle sensor | ° | Steering wheel angle | -720 to +720 |

### 8. AWD System Parameters

| PID | Units | Description | Typical Range |
|-----|-------|-------------|---------------|
| AWD Solenoid Actual Current | mA | Actual AWD solenoid current | 0-2000 |
| AWD Solenoid Set Current | mA | Target AWD solenoid current | 0-2000 |

### 9. Electrical System Parameters

| PID | Units | Description | Typical Range |
|-----|-------|-------------|---------------|
| Battery Terminal Voltage | V | Battery voltage | 12-15 |

## Data Quality Considerations

### Missing Data
- Some PIDs may have `"0"` values when the sensor is not active
- Calculated fields may show `"0"` when vehicle is stationary
- Example: Wheel speeds are `"0"` when vehicle speed is `"0"`

### Sampling Rates
Different parameters are sampled at different frequencies:
- **High frequency** (~0.1s): Engine RPM, Vehicle Speed, Throttle Position
- **Medium frequency** (~0.5s): MAF, Fuel calculations, Temperatures
- **Low frequency** (~1-5s): Fuel totals, Trip statistics

### Precision Variations
- **High precision**: Gear ratios (15 decimal places)
- **Medium precision**: Timestamps (6 decimal places), temperatures (integers)
- **Low precision**: Percentages (1-2 decimal places)

## Example Data Patterns

### Idle State
```csv
"39376.016656";"Engine RPM";"812";"rpm";
"39376.117656";"Vehicle speed";"0";"km/h";
"39376.208656";"Relative throttle position";"2";"%";
"39376.297656";"Timing advance";"4";"°";
```

### Driving State
```csv
"39380.100656";"Engine RPM";"3500";"rpm";
"39380.200656";"Vehicle speed";"80";"km/h";
"39380.300656";"Relative throttle position";"45";"%";
"39380.400656";"MAF air flow rate";"45.2";"g/sec";
```

## Data Processing Recommendations

### Parsing Strategy
1. **Read header**: Skip first row or validate header format
2. **Parse rows**: Split by `;` delimiter, remove surrounding quotes
3. **Type conversion**: Convert SECONDS to float, VALUE to appropriate numeric type
4. **Grouping**: Group by timestamp or by PID depending on analysis needs

### Validation Rules
- Timestamps should be monotonically increasing
- VALUES should be numeric or empty
- UNITS should match expected units for each PID
- Detect anomalies: RPM > 8000, Speed > 250 km/h, negative fuel consumption

### Aggregation Strategies
- **Time-series**: Group by timestamp, pivot PIDs into columns
- **PID-series**: Group by PID, create time-indexed series
- **Resampling**: Downsample to uniform intervals (e.g., 1 second) using interpolation

## Units Reference

| Unit | Meaning | Category |
|------|---------|----------|
| rpm | Revolutions per minute | Rotation speed |
| km/h | Kilometers per hour | Linear speed |
| ℃ | Degrees Celsius | Temperature |
| % | Percent | Percentage |
| ° | Degrees | Angle |
| g | G-force | Acceleration |
| kPa | Kilopascals | Pressure |
| bar | Bar | Pressure |
| L | Liters | Volume |
| L/h | Liters per hour | Flow rate |
| L/100km | Liters per 100 kilometers | Fuel economy |
| g/sec | Grams per second | Mass flow |
| hp | Horsepower | Power |
| V | Volts | Voltage |
| mA | Milliamperes | Current |
| $1.3 | Currency | Cost |

## Known Issues & Edge Cases

### Data Anomalies
1. **Zero confusion**: `"0"` used for both actual zero and missing data
2. **Negative boost**: Naturally aspirated engines show negative boost (-0.5 to -0.8 bar)
3. **Multiple temperature sensors**: Engine coolant has 3 different PIDs (A, B, generic)
4. **Duplicate RPM**: Both "Engine RPM" and "Engine RPM x1000" exist

### Parser Challenges
- Semicolon delimiter inside quoted strings (rare but possible)
- Empty last column in each row (trailing semicolon)
- Mixed precision levels across different PIDs
- Non-standard characters in units (℃ requires UTF-8)

## TypeScript Type Definitions

See `src/types/index.ts` for the current implementation. Key types:

```typescript
interface OBD2DataPoint {
  timestamp: number;      // SECONDS as float
  pid: string;            // PID name
  value: number | null;   // Parsed VALUE
  units: string;          // UNITS
}

interface OBD2TimeSeriesPoint {
  timestamp: number;
  [pid: string]: number | null;  // PIDs as dynamic keys
}
```

## Version History

- **v1.0** (2026-02-12): Initial documentation based on sample file `2026-01-31 10-56-07.csv`

## See Also

- [OBD-II PIDs Wikipedia](https://en.wikipedia.org/wiki/OBD-II_PIDs)
- Project documentation: `/CLAUDE.md`
- Data validation: `src/lib/data/validators.ts`
- Data analysis: `src/lib/data/analyzer.ts`
