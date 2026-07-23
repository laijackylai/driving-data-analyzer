# Graph Design Decisions

Tracking all decisions made during brainstorming for the new graphs feature.

## Context

- **Two data sources**: OBD2 (NA FB25 CVT) and COBB Accessport (Turbo FA24 6MT)
- **Goals**: Performance tuning (A), Diagnostic/health monitoring (C), Track/spirited driving analysis (D)
- **Most important feature**: Estimated HP/torque graph

---

## HP / Torque Estimation

### Methods

| Method | OBD2 (FB25) | COBB (FA24) | Notes |
|--------|:-----------:|:-----------:|-------|
| Acceleration-based (wheel power) | yes | yes | Needs curb weight (user input field) |
| MAF-based (engine HP) | yes | yes | More reliable on NA; BSFC assumption needed |
| COBB ECU torque (`reqTorqueNm`) | no | yes | Free data, ECU's own estimate |

- Use **all available methods per source** and cross-reference
- Acceleration-based is primary (most dyno-like)

### UX: Curb Weight Input

- User enters vehicle curb weight in **kg** via input field
- Acceleration-based HP/torque graphs render once weight is entered
- No hardcoded weights

### Chart Style

- **Primary**: Classic dyno chart — HP and Torque vs RPM (dual Y-axis) — style A
- **Secondary**: Per-pull overlay toggle — select individual WOT pulls to compare — style B
- **Skipped**: Scatter cloud (style C) — too noisy, existing scatter charts cover this

### Output: Wheel HP + Engine Torque

- **Wheel HP**: gear-independent, shown directly
- **Engine torque**: derived by dividing wheel torque by gear ratio
  - COBB: uses `gearPosition` + provided gear ratios
  - OBD2: uses `actualGearRatio` from CVT data

### WRX Gear Ratios (FA24 6MT)

| Gear | Ratio (:1) |
|------|-----------|
| 1st | 3.46 |
| 2nd | 1.95 |
| 3rd | 1.37 |
| 4th | 1.03 |
| 5th | 0.82 |
| 6th | 0.67 |
| Reverse | 3.64 |
| Final Drive | 4.11 |

### WOT Pull Detection

- **Threshold**: throttle/accel position >= 90% (COBB: `accelPosition`, OBD2: `throttlePosition`)
- **RPM sweep**: must span from ~2000 RPM to near-redline
- **Redline**: auto-detected as `max(RPM in dataset) - 200`
- **Minimum duration**: ~2-3 seconds
- **Monotonic RPM**: RPM must be continuously increasing (with noise tolerance)
- **Skip**: pulls with gear shifts mid-pull (RPM drops then climbs)
- **Skip**: partial pulls that don't reach near-redline
- **No configurable slider** — fixed threshold, keep it simple

### Data Processing

- **Smoothing**: 3-5 point moving average on acceleration data before computing power
- **Aero drag**: NOT corrected for — noted in metric tooltip as "uncorrected"
- **CVT note**: tooltip mentions CVT pulls may look different (ECU holds RPM at efficient points)

---

## Category Decisions

### Category 1: Engine / RPM / Load

**Fields**: engineRpm, engineLoad, coolantTemp, oilTemp, timingAdvance, knockCorrection

**Derivable values**:
- Engine load zones (eco/normal/sport) — already computed
- % time in each zone
- RPM distribution
- Thermal delta: oilTemp - coolantTemp

**Combined raw time-series** (3 charts replacing 6 individual ones):
1. **RPM + Load + Throttle** — RPM on left axis, load/throttle (%) on right axis
2. **Coolant + Oil temp** — both °C on same axis
3. **Timing Advance + Knock Correction** — both degrees, same axis (cause/effect visible)

**Insight graphs** (4 charts):
4. RPM vs Load scatter (colored by coolant temp) — operating envelope
5. Thermal delta timeline (oil - coolant with load overlay)
6. Timing Advance vs RPM scatter — reveals knock-prone RPM zones
7. Coolant temp stability — variance at operating temp, catches thermostat/cooling issues

### Category 2: Air Intake / Boost

**Fields**: mafRate (OBD2) / mafV (COBB), intakeAirTemp / intakeAirTempF, throttlePosition / accelPosition, manifoldAbsPressure / manifoldAbsPressPsi, barometricPressure / baroPressurePsi, boostPsi (COBB), targetBoostFinalRelPsi (COBB), tdBoostErrorPsi (COBB)

**Combined raw time-series** (2 charts):
1. **MAF + Throttle + Manifold Pressure** — MAF on left axis, throttle % and manifold pressure on right (both sources)
2. **Boost + Target Boost + Boost Error** — actual vs target on left axis, error on right (COBB only)

**Insight graphs** (5 charts):
3. **Boost vs RPM scatter** (COBB only) — colored by gear. Reveals boost curve shape per gear, shows unexpected taper or spikes
4. **Volumetric Efficiency estimate** (both) — VE = (MAF_actual / MAF_theoretical) × 100%, where theoretical = displacement × RPM × air density. Shows breathing efficiency across RPM
5. **IAT heat soak** (both) — IAT vs time, colored by engine load. NA: slow IAT recovery = restricted airflow or heat shielding issue. Turbo: rising IAT with sustained boost = intercooler insufficiency
6. **Boost Error histogram** (COBB only) — distribution of tdBoostErrorPsi. Tight around zero = good tune, skewed = wastegate/turbo issue
7. **MAF vs RPM curve** (both) — should be clean upward sweep. Flattening at high RPM = restrictive air filter/airbox. Good for mod validation (before/after intake swap)

**Availability**: NA gets 4 graphs (#1, 4, 5, 7), Turbo gets all 7

### Category 3: Fuel / AFR

**Fields**: shortTermFuelTrim, longTermFuelTrim, fuelSystemStatus, fuelRate, fuelRailPressure (OBD2) / afrCmdEq, afrLearning1, injDutyCycle (COBB)

**Combined raw time-series** (2 charts):
1. **STFT + LTFT + Fuel Rate** (OBD2) — both trims on left axis (%), fuel rate on right (L/h). Shows if ECU is constantly correcting
2. **AFR Commanded + AFR Learning + Injector Duty Cycle** (COBB) — AFR on left, duty cycle % on right. Fueling control at a glance

**Insight graphs** (6 charts):
3. **Fuel Trim vs RPM scatter** (OBD2) — colored by engine load. Reveals RPM zones where ECU leans/richens. Consistent offset at specific loads = tune opportunity or vacuum leak
4. **AFR Learning heatmap: RPM × Load** (COBB) — shows where ECU has learned to add/subtract fuel. Large corrections in specific cells = tune issue
5. **Fuel Trim stability** (OBD2) — rolling std deviation of STFT over time. Spikes = transient fueling issues (injector clog, sensor lag)
6. **Injector Duty Cycle vs RPM** (COBB) — approaching 80-85% = nearing injector limit. Critical for tuned cars
7. **LTFT drift over session** (OBD2) — LTFT over time. Should be stable within a session; drift = warming O2 sensor, exhaust leak, or failing MAF
8. **AFR vs Boost scatter** (COBB) — colored by RPM. Under boost, AFR should go rich for safety. Lean at high boost = dangerous tune. Most important safety graph for tuned turbo cars

**Availability**: NA gets 4 graphs (#1, 3, 5, 7), Turbo gets 4 graphs (#2, 4, 6, 8)

### Category 4: Power (HP/Torque)

See HP/Torque Estimation section above for methods, WOT detection, and data processing.

**Charts** (6):
1. **Classic dyno chart** (both) — HP and Torque vs RPM, dual Y-axis. Acceleration-based primary, MAF-based cross-reference, COBB ECU torque overlay
2. **Per-pull overlay toggle** (both) — select individual WOT pulls to compare on the same dyno chart. Consistency check, before/after mod comparison
3. **ECU Torque vs Estimated Torque** (COBB only) — cross-reference reqTorqueNm against acceleration-based estimate. Divergence = method issue
4. **Power vs Gear overlay** (both) — separate HP curves per gear. NA CVT should be consistent; manual shows drivetrain loss differences. Big per-gear variance = clutch slip or noise
5. **Peak HP/Torque trend** (both) — peak HP and torque per pull over time within a session. Declining = heat soak. Rising then stable = warming up. First thing tuners check at the track
6. **Power-to-weight ratio vs speed** (both) — HP/kg vs vehicle speed. Shows usable acceleration envelope for track planning

**Availability**: NA gets 5 graphs (#1, 2, 4, 5, 6), Turbo gets all 6

### Category 5: Motion / Driving Behavior (OBD2)

**Fields**: vehicleSpeed, vehicleAcceleration, averageSpeed, distanceTravelled, distanceTravelledTotal, throttlePosition (cross-ref)

**Combined raw time-series** (2 charts):
1. **Speed + Throttle + Acceleration** — speed (km/h) on left axis, throttle (%) and acceleration (g) on right. Full driving behavior at a glance
2. **Distance + Average Speed** — cumulative distance on left axis, rolling average speed on right. Session progression

**Insight graphs** (1 chart):
3. **Throttle-speed lag** — cross-correlation between throttle input and speed change over time. NA CVT should show noticeable lag (CVT ratio hunting). Detects CVT responsiveness issues

**Availability**: OBD2 only (3 charts). COBB lacks vehicleSpeed/vehicleAcceleration

### Category 6: Transmission / CVT (OBD2)

**Fields**: cvtTemp, actualGearRatio, targetGearRatio, primaryPulleySpeed, secondaryPulleySpeed, turbineSpeed, lockUpDutyRatio

**Derivable values**:
- Ratio error: actualGearRatio - targetGearRatio
- Torque converter slip: (1 - turbineSpeed/engineRPM) × 100%

**Combined raw time-series** (2 charts):
1. **Actual vs Target Gear Ratio + CVT Temp** — both ratios on left axis, CVT temp (°C) on right. CVT tracking and thermal state
2. **Pulley Speeds + Lock-Up Duty** — primary/secondary pulley RPM on left, lock-up duty % on right. Mechanical behavior

**Insight graphs** (2 charts):
3. **Ratio error timeline** — (actual - target) over time, colored by throttle position. Persistent error under load = belt slip or worn pulleys
4. **Torque converter slip vs RPM** — (1 - turbineSpeed/engineRPM) × 100% vs RPM, colored by lock-up duty. Near 0% when locked, ~5-15% unlocked. High slip when locked = failing TC

**Availability**: OBD2 only (4 charts). COBB has discrete gearPosition (1-6), no CVT data

### Category 7: ABS / Stability (OBD2)

**Fields**: absFrontLeftWheelSpeed, absFrontRightWheelSpeed, absRearLeftWheelSpeed, absRearRightWheelSpeed, steeringAngle

**Derivable values**:
- Front-rear speed delta: avg(front) - avg(rear) — understeer/oversteer
- Left-right speed delta: avg(left) - avg(right) — alignment/pressure
- Wheel slip ratio: (fastest - slowest) / fastest × 100%

**Combined raw time-series** (1 chart):
1. **4 Wheel Speeds + Steering Angle** — all 4 wheel speeds on left axis, steering angle on right. Complete stability picture

**Insight graphs** (2 charts):
3. **Understeer/oversteer indicator** — front-rear speed delta vs steering angle scatter. Positive delta at large angles = understeer. Negative = oversteer. Classic vehicle dynamics plot
4. **Alignment check** — left-right speed delta at straight-line driving (steering ≈ 0°). Consistent offset = alignment issue, tire pressure imbalance, or dragging brake

**Availability**: OBD2 only (3 charts)

### Category 8: AWD (OBD2)

**Fields**: awdSolenoidActualCurrent, awdSolenoidSetCurrent

**Derivable values**:
- Estimated torque split: sigmoidal mapping from solenoid current → rear torque %. Range ~0–5% (FWD) to 50% (full lock). Default operating point ~40% rear (60:40). Based on TR580 ATS research (see `docs/plan/tr580-awd-research.md`)
- AWD response error: actual - set current

**Combined raw time-series** (1 chart):
1. **Actual vs Set AWD Solenoid Current** — both on same axis (mA), throttle on right. AWD coupling demand vs delivery

**Insight graphs** (3 charts):
2. **Estimated Torque Split timeline** — stacked area: front% / rear% over time. Sigmoidal mapping from solenoid current (0 mA ≈ FWD, 600 mA ≈ 60:40, 1080 mA ≈ 50:50). Tooltip: community-derived estimate, not official Subaru calibration
3. **Rear Torque % vs Throttle scatter** — colored by vehicle speed. Shows when AWD engages most. Flat response = coupling issue
4. **AWD engagement vs CVT temp** — rear torque % vs cvtTemp (°C), colored by throttle. Same current at different ATF temps = different actual torque transfer (clutch friction varies with temp). Engagement drop at high temps = clutch fade

**Availability**: OBD2 only (4 charts)

### Category 9: Electrical (OBD2)

**Fields**: batteryVoltage

**Combined raw time-series** (1 chart):
1. **Battery Voltage** — voltage (V) over time. Shows alternator output and electrical system health

**Availability**: OBD2 only (1 chart)

### Category 10: Knock / Timing (COBB)

**Fields**: feedbackKnock (°), fineKnockLearn (°), dam (Dynamic Advance Multiplier, 0–1), timingAdvance (°)

**Combined raw time-series** (2 charts):
1. **Timing Advance + Feedback Knock + Fine Knock Learn** — timing on left axis, both knock values (°) on right. Cause/effect: knock events → timing pulls
2. **DAM timeline** — DAM (0–1) over time with boost (psi) on right. Should stay at 1.0; sustained drop = tune issue or bad fuel

**Insight graphs** (3 charts):
3. **Feedback Knock vs RPM scatter** — colored by boost. Reveals knock-prone RPM/boost zones. Concentrated knock at specific RPM = needs timing retard in tune
4. **DAM recovery timeline** — after DAM drop, time to recover to 1.0. Slow = persistent issue. Fast = transient (bad fuel, hot day). Plot DAM events with recovery duration
5. **Fine Knock Learn heatmap: RPM × Load** — learned corrections per cell. Large negative values = tune needs adjustment. Primary tuner diagnostic view

**Availability**: COBB only (5 charts)

### Category 11: Wastegate (COBB)

**Fields**: wastegateActualPosMm, wastegateCommPosMm, wastegateCommFinalPosMm, wastegateInitPosFinalMm, tdIntegWgPosCorrMm, tdPropWgPosCorrMm (cross-ref: boostPsi, targetBoostFinalRelPsi, tdBoostErrorPsi, engineRpm, gearPosition)

**Combined raw time-series** (1 chart):
1. **Wastegate Positions + Boost** — actual vs commanded position (mm) on left axis, boost (psi) on right. Full wastegate behavior at a glance

**Insight graphs** (3 charts):
2. **Wastegate error vs boost scatter** — (actual - commanded) mm vs boost psi, colored by RPM. Shows if wastegate tracks well under boost. Large errors at high boost = mechanical issue or tune problem
3. **Wastegate position vs RPM curve** — commanded position vs RPM, colored by gear. Shows wastegate strategy across RPM range. Comparison across gears reveals load-dependent behavior
4. **Boost overshoot detection** — overshoot magnitude (actual boost - target boost when positive) vs wastegate position. Reveals if overshoots correlate with specific wastegate positions = tuning opportunity

**Availability**: COBB only (4 charts)

### Category 12: Injector (COBB)

**Fields**: injDutyCycle, injPulseWidth, injTimingHSoi, fuelCut, fuelPressurePsi, fuelPressureTargetPsi (cross-ref: engineRpm, boostPsi)

**Derivable values**:
- Fuel pressure error: fuelPressurePsi - fuelPressureTargetPsi
- Injector headroom: 100% - injDutyCycle

**Combined raw time-series** (2 charts):
1. **Injector Duty Cycle + Pulse Width + RPM** — duty cycle (%) on left axis, pulse width (ms) and RPM on right. Duty cycle approaching 80–85% = nearing injector limit
2. **Fuel Pressure + Target + Injection Timing** — actual vs target pressure (psi) on left axis, injection timing (°) on right. Pressure tracking and timing strategy

**Insight graphs** (2 charts):
3. **Fuel pressure error vs RPM** — (actual - target) psi vs RPM, colored by injector duty cycle. Negative error at high duty = fuel system can't keep up (pump limitation). Critical safety graph
4. **Injector headroom heatmap: RPM × Boost** — (100% - duty cycle) binned by RPM and boost. Green = plenty of headroom, red = near limit. Quick visual answer to "do I need bigger injectors?"

**Availability**: COBB only (4 charts)

### Category 13: AVCS / Cam Timing (COBB)

**Fields**: avcsExhLeft, avcsInLeft (cross-ref: engineRpm, boostPsi, calculatedLoadGRev, oilTemp)

**Derivable values**:
- Cam overlap: avcsInLeft + avcsExhLeft (combined advance)

**Combined raw time-series** (1 chart):
1. **AVCS Intake + Exhaust Cam Angles + RPM** — both cam angles (°) on left axis, RPM on right. Shows cam phasing strategy across the rev range

**Insight graphs** (2 charts):
2. **Cam angle vs RPM curve** — intake and exhaust cam angles vs RPM, colored by load. Reveals the ECU's cam phasing map. Should show smooth transitions — erratic behavior = AVCS solenoid issue or oil flow problem
3. **AVCS response check** — rate of change of cam angle vs RPM. Slow cam movement at specific RPM zones = sticky AVCS solenoid or oil viscosity issue (oil thinning at high temp → lower hydraulic pressure → sluggish phaser). Compare intake vs exhaust response rates

**Availability**: COBB only (3 charts)

---

## General Decisions

- Focus on **insightful** graphs, not just plotting raw data over time
- New graphs should reveal **relationships, patterns, and derived insights**

### Graph Layout Strategy: Combined Raw + Insight

Each category tab follows this structure:
1. **Combined raw time-series** at the top — group related fields into fewer multi-trace charts (dual Y-axis where units differ) instead of one chart per field
2. **Derived/insight graphs** below — scatter plots, histograms, heatmaps that reveal relationships

**Principle**: Combine fields that are naturally related into one chart. Fewer, denser charts > many sparse ones.
