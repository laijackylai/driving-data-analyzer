import { MetricTooltipContent } from "@/types";

export const METRIC_TOOLTIPS: Record<string, MetricTooltipContent> = {
  engineRpm: {
    axis: "Y-axis shows engine crankshaft speed in revolutions per minute (RPM).",
    values: [
      "700–800 RPM at idle, 1500–3500 RPM while cruising — the FB25 is most efficient around 2000–2500 RPM.",
      "Sustained >5000 RPM accelerates wear; >6000 RPM approaches the 6200 redline.",
    ],
    interpretation: "Look for smooth RPM transitions — sudden spikes without throttle input may indicate transmission slip.",
  },
  engineLoad: {
    axis: "Y-axis shows how hard the engine is working as a percentage of maximum capacity.",
    values: [
      "15–30% is typical for cruising on flat roads; 40–60% during moderate acceleration.",
      "Sustained >80% without heavy acceleration or hill climbing suggests an issue.",
    ],
    interpretation: "High load at low speed may indicate dragging brakes or low tire pressure.",
  },
  coolantTemp: {
    axis: "Y-axis shows engine coolant temperature in degrees Celsius.",
    values: [
      "80–100°C is normal operating temperature after warm-up.",
      ">108°C indicates overheating — possible low coolant, failed thermostat, or radiator blockage.",
    ],
    interpretation: "A steady climb during a drive suggests cooling system degradation; never reaching 80°C means the thermostat may be stuck open.",
  },
  oilTemp: {
    axis: "Y-axis shows engine oil temperature in degrees Celsius.",
    values: [
      "80–110°C is optimal; oil reaches operating temp slower than coolant.",
      ">125°C means oil is breaking down, risking accelerated engine wear.",
    ],
    interpretation: "Oil temp significantly higher than coolant temp may point to an oil cooler issue or low oil level.",
  },
  timingAdvance: {
    axis: "Y-axis shows spark timing advance in degrees before top dead center (BTDC).",
    values: [
      "5–25° is normal depending on load and RPM — higher advance at light load, lower under heavy load.",
      "Very low or negative values sustained indicate the ECU is retarding timing due to knock.",
    ],
    interpretation: "Sudden drops that correlate with knock correction events mean the engine is detecting detonation.",
  },
  knockCorrection: {
    axis: "Y-axis shows how many degrees the ECU is pulling back ignition timing to prevent knock.",
    values: [
      "0° is ideal — no knock detected.",
      "< -3° is significant knock, possibly from low octane fuel, carbon buildup, or overheating.",
    ],
    interpretation: "Consistent knock at specific RPM ranges suggests carbon buildup; knock only on hot days points to heat-related causes.",
  },
  mafAirFlowRate: {
    axis: "Y-axis shows mass air flow entering the engine in grams per second.",
    values: [
      "2–5 g/s at idle, 15–35 g/s cruising, up to 40 g/s at full throttle for the NA FB25.",
      "Very low readings at higher RPM suggest a dirty or failing MAF sensor.",
    ],
    interpretation: "Air flow should scale proportionally with RPM — flat or erratic readings indicate a sensor issue.",
  },
  calculatedBoost: {
    axis: "Y-axis shows intake pressure relative to atmospheric in bar (negative = vacuum).",
    values: [
      "-0.8 to -0.2 bar is normal — deeper vacuum at idle, closer to 0 at wide-open throttle.",
      "Positive values should never occur on an NA engine and indicate a sensor fault.",
    ],
    interpretation: "Shallow vacuum at idle suggests a vacuum leak; erratic swings may mean an intake gasket leak.",
  },
  intakeAirTemp: {
    axis: "Y-axis shows the temperature of air entering the engine in degrees Celsius.",
    values: [
      "Ambient to ambient +20°C is normal due to engine bay heat soak.",
      ">60°C reduces power significantly and can contribute to engine knock.",
    ],
    interpretation: "Rising temps during stop-and-go indicate heat soak; dropping on the highway shows the ram air effect.",
  },
  intakeManifoldPressure: {
    axis: "Y-axis shows absolute intake manifold pressure in kPa (atmospheric ≈ 101 kPa).",
    values: [
      "20–40 kPa at idle, 60–80 kPa cruising, 90–100 kPa at wide-open throttle.",
      ">50 kPa at idle suggests a vacuum leak.",
    ],
    interpretation: "Pressure should drop at idle and rise with throttle — flat response indicates a clogged intake or leak.",
  },
  throttlePosition: {
    axis: "Y-axis shows throttle plate opening as a percentage (0% closed, 100% wide open).",
    values: [
      "0–5% at idle, 10–25% normal driving, 50–100% hard acceleration.",
      "Never reaching 0% at idle may indicate a sticky throttle body.",
    ],
    interpretation: "Smooth gradients indicate economical driving; frequent sudden spikes show an aggressive driving style.",
  },
  shortTermFuelTrim: {
    axis: "Y-axis shows real-time fuel injection correction as a percentage (+ = adding fuel, − = removing).",
    values: [
      "-5% to +5% is normal — small corrections are expected.",
      "> ±10% means the ECU is making large corrections: positive = lean (vacuum leak, weak fuel pump), negative = rich (leaking injector).",
    ],
    interpretation: "Consistently positive trim indicates a lean condition (check for vacuum leaks); consistently negative suggests rich running.",
  },
  longTermFuelTrim: {
    axis: "Y-axis shows the ECU's learned, persistent fuel correction as a percentage.",
    values: [
      "-5% to +5% is healthy — the engine's fuel delivery is on target.",
      "> ±8% means the engine has a persistent fuel issue the ECU is compensating for.",
    ],
    interpretation: "Gradual drift over time suggests wear-related issues; a sudden jump indicates a new problem like a cracked vacuum hose.",
  },
  fuelAirRatio: {
    axis: "Y-axis shows the fuel/air equivalence ratio (1.0 = stoichiometric 14.7:1 AFR).",
    values: [
      "~1.0 during steady cruise; slightly >1.0 (rich) during hard acceleration is normal.",
      "Sustained >1.05 or <0.95 at steady cruise indicates a fuel delivery imbalance.",
    ],
    interpretation: "Cross-reference with fuel trim data — if both show lean, it confirms a real lean condition.",
  },
  instantFuelRate: {
    axis: "Y-axis shows instantaneous fuel consumption in litres per hour.",
    values: [
      "0.5–1.0 L/h at idle, 3–8 L/h cruising, up to 15+ L/h at full throttle.",
      ">1.5 L/h at idle may indicate a fuel system issue.",
    ],
    interpretation: "Correlate with throttle and speed — high fuel at low throttle suggests efficiency problems.",
  },
  powerFromMaf: {
    axis: "Y-axis shows estimated engine power output in horsepower, calculated from mass air flow.",
    values: [
      "1–5 hp at idle, 20–60 hp cruising, up to 150–180 hp at peak (FB25 rated 182 hp).",
      "Peak power significantly below expected may indicate intake/exhaust restriction or sensor error.",
    ],
    interpretation: "Power should scale with RPM and throttle — flat spots at expected peaks suggest an engine issue.",
  },
  instantPowerFuel: {
    axis: "Y-axis shows estimated engine power output in horsepower, calculated from fuel consumption.",
    values: [
      "Should closely track MAF-based power — 1–5 hp at idle, up to 150–180 hp at peak.",
      "Large divergence from MAF-based power suggests one of the input sensors is inaccurate.",
    ],
    interpretation: "Compare both power traces side by side — consistent divergence points to a sensor calibration issue.",
  },
  vehicleSpeed: {
    axis: "Y-axis shows vehicle speed in km/h as reported by OBD2 wheel speed sensors.",
    values: [
      "Should match GPS speed within ±3 km/h under normal conditions.",
      "Consistent offset from GPS speed suggests non-stock tire size or an ABS sensor fault.",
    ],
    interpretation: "OBD consistently higher than GPS means smaller tires than stock; consistently lower means larger tires.",
  },
  vehicleAcceleration: {
    axis: "X-axis shows acceleration in g-force (1g = 9.8 m/s²); positive = accelerating, negative = braking.",
    values: [
      "-0.2g to +0.2g is smooth driving; up to ±0.4g is spirited but safe.",
      "< -0.4g is harsh braking, > 0.3g is rapid acceleration — both increase wear on tires, brakes, and CVT.",
    ],
    interpretation: "The distribution shape reveals driving style — a tight center cluster is smooth; wide tails mean aggressive driving.",
  },
  cvtTemp: {
    axis: "Y-axis shows CVT transmission fluid temperature in degrees Celsius.",
    values: [
      "60–100°C during normal driving is healthy for the Lineartronic CVT.",
      ">120°C means CVT fluid is breaking down, risking accelerated belt/chain wear.",
    ],
    interpretation: "Climbing temp during sustained hill climbs is expected; temp that won't cool on the highway suggests low fluid or a blocked cooler.",
  },
  actualGearRatio: {
    axis: "Y-axis shows the CVT's operating ratio (actual vs commanded by ECU).",
    values: [
      "Actual should closely track the target ratio with minimal lag.",
      "A large or persistent gap between actual and target indicates CVT belt slip or hydraulic pressure issues.",
    ],
    interpretation: "Sudden ratio changes without throttle input suggest the CVT is hunting; actual not reaching target means possible belt slip.",
  },
  primaryPulleySpeed: {
    axis: "Y-axis shows CVT primary and secondary pulley rotational speeds in RPM.",
    values: [
      "Both should scale smoothly with vehicle speed and engine RPM.",
      "Primary spinning much faster than expected relative to secondary indicates belt slip.",
    ],
    interpretation: "Smooth ratio changes between the two traces indicate healthy CVT operation; sudden discrepancies are a warning sign.",
  },
  lockUpDutyRatio: {
    axis: "Y-axis shows torque converter clutch engagement as a percentage (0% = open, 100% = locked).",
    values: [
      "0% at low speed, transitioning to 60–100% at cruising speed for direct-drive efficiency.",
      "Never reaching high lock-up at highway speed means increased fuel consumption and heat buildup.",
    ],
    interpretation: "Frequent lock/unlock cycling may indicate torque converter shudder — a common CVT issue.",
  },
  turbineSpeed: {
    axis: "Y-axis shows torque converter turbine speed in RPM alongside engine RPM.",
    values: [
      "Turbine should approach engine RPM as lock-up duty increases.",
      "A large sustained gap at highway speed means the converter is not locking up properly.",
    ],
    interpretation: "Watch the gap narrow as lock-up engages — a persistent gap at cruise indicates a torque converter issue.",
  },
  absFrontLeftWheelSpeed: {
    axis: "Y-axis shows individual wheel speeds in km/h from ABS sensors.",
    values: [
      "All four wheels should be within 1–2 km/h of each other during straight-line driving.",
      "One wheel significantly different indicates an ABS sensor fault, tire size mismatch, or dragging brake.",
    ],
    interpretation: "Momentary divergence during cornering is normal; sustained divergence in a straight line is a problem.",
  },
  frontRearDiff: {
    axis: "Y-axis shows the speed difference between average front and rear wheels in km/h.",
    values: [
      "Near zero during normal driving; small positive values during acceleration are expected.",
      "Large sustained differential suggests drivetrain binding or mismatched tire sizes front vs rear.",
    ],
    interpretation: "Spikes during acceleration on slippery surfaces show traction control intervening — correlate with AWD engagement.",
  },
  leftRightDiff: {
    axis: "Y-axis shows the speed difference between average left and right wheels in km/h.",
    values: [
      "Near zero in straight lines; diverges during turns as outer wheels travel further.",
      "Sustained non-zero in straight lines indicates brake dragging, alignment issues, or tire pressure imbalance.",
    ],
    interpretation: "Correlate with steering angle — divergence during turns is normal; divergence without steering input is a problem.",
  },
  steeringAngle: {
    axis: "Y-axis shows steering wheel angle in degrees from the steering angle sensor.",
    values: [
      "This is pure driver input — any value is valid and there are no warning thresholds.",
      "Larger absolute values indicate tighter turns; near zero indicates straight-line driving.",
    ],
    interpretation: "Correlate with wheel speed differentials and AWD engagement to understand vehicle dynamics.",
  },
  awdSolenoidActualCurrent: {
    axis: "Y-axis shows current flowing to the AWD coupling solenoid in milliamps.",
    values: [
      "Low current (50–100 mA) on dry straight roads; higher during cornering, acceleration, or slippery conditions.",
      "Actual significantly different from commanded current suggests a solenoid or wiring issue.",
    ],
    interpretation: "AWD engaging during hard cornering is normal; engaging on dry straight roads may indicate a wheel speed sensor fault.",
  },
  batteryVoltage: {
    axis: "Y-axis shows battery terminal voltage in volts while the engine is running.",
    values: [
      "13.8–14.6V means the alternator is charging properly.",
      "<12.5V means the alternator isn't charging (belt slipping?); >15.0V means a voltage regulator failure risking electronics damage.",
    ],
    interpretation: "Voltage dropping under electrical load suggests a weak alternator; sagging at idle but recovering at RPM points to belt tension.",
  },

  // COBB metrics
  cobbBoost: {
    axis: "Y-axis shows boost pressure in psi — actual (primary) vs ECU target (secondary).",
    values: [
      "Stock FA20DIT targets ~14–18 psi peak; OTS tunes typically 18–22 psi depending on fuel grade.",
      "Actual consistently below target indicates boost leak, wastegate sticking open, or worn turbo.",
    ],
    interpretation: "A persistent gap between actual and target on the same RPM range each pull suggests a hardware issue rather than a tune problem.",
  },
  cobbBoostError: {
    axis: "Y-axis shows the difference between actual and target boost pressure in psi.",
    values: [
      "±1–2 psi transient error is normal during spool — the ECU is still ramping boost.",
      "Sustained >3 psi negative error (underboost) means the turbo isn't hitting target; positive means overboost risk.",
    ],
    interpretation: "Large error spikes at peak RPM suggest the wastegate is slow to respond; check actuator linkage and solenoid duty cycle.",
  },
  cobbBoostScatter: {
    axis: "X-axis = engine RPM; Y-axis = boost pressure (psi); color = throttle position.",
    values: [
      "Boost should rise steeply from ~2500 RPM and plateau through peak power range.",
      "Color gradient should be tight red (high throttle) at peak boost — light colors mean partial throttle pulls.",
    ],
    interpretation: "Scattered points at high RPM with inconsistent boost indicate turbo surge or compressor instability — check inlet piping.",
  },
  cobbAFR: {
    axis: "Y-axis shows air-fuel ratio — actual wideband reading vs closed-loop target.",
    values: [
      "Cruise: ~14.7:1 (stoich); light load: 14–15:1; wide-open throttle: 11.0–11.8:1 for FA20DIT.",
      "Actual leaner than 12.0:1 at WOT is a danger zone — risk of detonation and piston damage.",
    ],
    interpretation: "Actual tracking target closely at WOT confirms the fueling strategy is correct; divergence at peak power RPM warrants immediate investigation.",
  },
  cobbAFCorrection: {
    axis: "Y-axis shows AF Correction 1 (short-term) and AF Learning 1 (long-term) fuel trims as a percentage.",
    values: [
      "±5% is normal adaptive operation — the ECU is fine-tuning the base map.",
      ">±8% means the base map has a systematic error the ECU is compensating for.",
    ],
    interpretation: "Large learning values after a flash suggest the OTS map isn't matched to your injectors or fuel — consider a custom tune.",
  },
  cobbAFRScatter: {
    axis: "X-axis = RPM; Y-axis = actual AFR; color = throttle position.",
    values: [
      "WOT pulls (red) should cluster tightly around the target AFR across the RPM range.",
      "Lean outliers at high RPM and high throttle are the highest-risk points — investigate immediately.",
    ],
    interpretation: "Loose scatter at WOT indicates inconsistent fueling — check for injector deposits, pump duty, or boost-fuel correlation issues.",
  },
  cobbFeedbackKnock: {
    axis: "Y-axis shows real-time knock retard applied by the ECU in degrees.",
    values: [
      "0° is ideal. Occasional –1° to –2° on hard pulls with premium fuel is acceptable.",
      "< –3° sustained means significant knock — check fuel octane, IAT, and boost levels.",
    ],
    interpretation: "Repeated knock at the same RPM point across multiple pulls is a tune issue; random single-pull knock often indicates fuel quality.",
  },
  cobbFineKnockLearn: {
    axis: "Y-axis shows the ECU's learned timing correction stored in the knock learning table.",
    values: [
      "Values close to 0° mean the engine is happy on the current tune and fuel.",
      "Negative values (–1° to –3°) mean the ECU has permanently pulled timing — the tune is too aggressive for current conditions.",
    ],
    interpretation: "Fine knock learn doesn't reset between drives — a degrading trend over time suggests heat soak, fuel degradation, or a developing knock source.",
  },
  cobbDAM: {
    axis: "Y-axis shows the Dynamic Advance Multiplier — a 0–1 scalar the ECU uses to scale ignition timing.",
    values: [
      "1.0 is ideal — full timing as mapped. The ECU is confident no knock is occurring.",
      "< 0.875 means the ECU has reduced timing system-wide due to repeated knock events.",
    ],
    interpretation: "DAM dropping below 1.0 and not recovering suggests persistent knock. Reset DAM only after resolving the root cause — fuel, tune, or hardware.",
  },
  cobbInjDutyCycle: {
    axis: "Y-axis shows fuel injector duty cycle as a percentage (100% = injector open the entire cycle).",
    values: [
      "Port injectors: safe up to ~85%; direct injectors: safe up to ~90% on FA20DIT.",
      ">85% duty cycle at peak power means the injectors are at or over capacity — fueling will go lean under demand.",
    ],
    interpretation: "Duty cycle plateauing while AFR goes lean confirms injectors are maxed out — upgrade injectors or reduce boost.",
  },
  cobbInjPulseWidth: {
    axis: "Y-axis shows how long each injector stays open per cycle in milliseconds.",
    values: [
      "0.5–1.5 ms at idle; 4–8 ms at full load is typical for stock injectors.",
      "Pulse width clamping while fuel demand increases means injectors are saturated.",
    ],
    interpretation: "Cross-reference with duty cycle — pulse width near the cycle duration combined with high duty confirms injector saturation.",
  },
  cobbInjScatter: {
    axis: "X-axis = RPM; Y-axis = injector duty cycle (%); color = throttle position.",
    values: [
      "WOT points should show a smooth duty cycle rise from idle to redline.",
      "Duty cycle plateauing at high RPM WOT while boost is still rising is a fueling bottleneck.",
    ],
    interpretation: "Wide scatter at identical RPM/throttle points suggests variable fuel pressure — check fuel pump health and fuel pressure regulator.",
  },
  cobbWastegate: {
    axis: "Y-axis shows electronic wastegate position in mm — actual valve opening vs commanded target.",
    values: [
      "Actual should closely track commanded within 0.5–1 mm under steady-state conditions.",
      "Persistent gap >2 mm means the actuator is slow or sticking — boost control will be imprecise.",
    ],
    interpretation: "Actual overshooting target during spool-up followed by hunting indicates PID tuning issues in the boost control system.",
  },
  cobbAVCS: {
    axis: "Y-axis shows AVCS (Active Valve Control System) cam timing advance in degrees for intake and exhaust camshafts.",
    values: [
      "Intake advances aggressively (15–30°) at mid-range RPM for torque; exhaust is more conservative.",
      "Cams not reaching target advance suggest a sticking VVT actuator or low oil pressure.",
    ],
    interpretation: "Intake and exhaust cam timing should move in coordinated patterns — erratic or flat traces indicate an AVCS solenoid or oil supply issue.",
  },
};
