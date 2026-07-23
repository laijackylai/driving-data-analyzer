# TR580 CVT & AWD System Research — 2024 Subaru Impreza RS

Research compiled to inform AWD torque split estimation in the driving data analyzer.

---

## 1. AWD System Type

The 2024 Subaru Impreza RS uses the **Active Torque Split (ATS)** AWD system, historically referred to as **ACT-4**. This is the standard AWD system on all CVT-equipped Subaru models (excluding WRX, which uses VTD).

The ATS system drives the front wheels directly and the rear wheels through an **electronically controlled multi-plate transfer clutch (MP-T)** located in the extension housing at the rear of the CVT assembly. The TCM (Transmission Control Module) modulates hydraulic pressure to this clutch pack to vary torque sent rearward.

**Subaru's AWD variants for reference**:

| System | Default Split | Max Rear | Used On |
|--------|:------------:|:--------:|---------|
| **ATS (Active Torque Split)** | **60:40** | **50:50** | **All CVT models (Impreza, Crosstrek, Forester, Outback, Legacy)** |
| VTD (Variable Torque Distribution) | 45:55 | ~65% rear | WRX (CVT Lineartronic) |
| VCD (Viscous Center Differential) | 50:50 fixed | 50:50 | Manual transmission models |
| DCCD (Driver Controlled Center Differential) | 41:59 | Variable | WRX STI |

### Sources
- [Motor Authority — Subaru's 4 AWD Systems](https://www.motorauthority.com/news/1111627_heres-howsubarus-4-all-wheel-drive-systems-work) — "CVT-equipped Subarus (excluding WRX models)" use ATS with a "clutch pack designed to allow for some slip"
- [Subaru Media — 2024 Impreza Press Kit](https://media.subaru.com/newsrelease.do?id=1996&mid=138) — Confirms "revised Subaru Symmetrical All-Wheel Drive system"
- [Quality Subaru — Symmetrical AWD Explained](https://www.qualitysubaru.com/symmetrical-all-wheel-drive-explained.htm)

---

## 2. Torque Split

### Default: 60:40 (front:rear)

Multiple authoritative sources confirm 60:40 as the nominal split under normal driving. The system is front-biased — under zero-load steady-state cruise, minimal torque goes rearward, but the nominal operating split is 60:40.

**The 90:10 figure is incorrect for this system.** That number was associated with older 4EAT automatic transmissions and has been explicitly debunked by forum research. One Subaru Outback forum thread specifically states "the 90/10 figure for the 4EAT had been proven wrong."

### Maximum: 50:50

When the transfer clutch is fully locked (~95–100% duty), the rear driveshaft is coupled 1:1 to the front, producing a 50:50 split. The system **cannot** send more than 50% rearward — there is no rear-biased mechanism in ATS (unlike VTD at 45:55 or DCCD at 41:59).

### Sources
- [Motor Authority](https://www.motorauthority.com/news/1111627_heres-howsubarus-4-all-wheel-drive-systems-work) — ATS uses "60/40 torque split"
- [Subaru Outback Forums — Official Torque Split](https://www.subaruoutback.org/threads/official-subaru-torque-split-information.45751/) — Confirms 60:40 for CVT ATS models
- [Sport Subaru](https://www.sportsubaru.com/why-all-wheel-drive-.htm) — "The active torque-split AWD system usually distributes torque 60:40"
- [Subaru Ascent Forum](https://www.ascentforums.com/threads/how-does-the-ascent-cvt-active-torque-split-awd-work.11461/) — "Torque distribution is adjusted up to a 50:50 split in real time"

---

## 3. Transfer Clutch Mechanism (TR580)

### How it works

1. The TCM sends a **PWM (Pulse Width Modulation) signal** to the AWD Transfer Clutch Duty Solenoid
2. The solenoid is **normally closed** (Gen 2 / TR580 design)
3. As duty cycle increases → solenoid opens → hydraulic pressure to clutch pack increases → more rear torque
4. At 0% duty (solenoid closed): minimal/no pressure → most torque stays front
5. At 95–100% duty (near full open): maximum pressure → clutch nearly fully locked → 50:50

**Important Gen 1 vs Gen 2 difference**:
- **Pre-2008 (4EAT, Gen 1)**: Solenoid was **normally open**. Dead solenoid = full clutch pressure = locked 50:50 (failsafe keeps AWD engaged)
- **Post-2008 (CVT Gen 2 / TR580)**: Solenoid is **normally closed**. Dead solenoid = no clutch pressure = FWD only

### TCM Inputs for AWD Control
- Front and rear wheel speed sensors (slip detection)
- Throttle position / accelerator pedal position
- Steering angle sensor
- Brake application
- Vehicle speed
- Transmission output speed
- Engine ECU data

### Sources
- [GEARS Magazine — Subaru CVT Gen 2 Valve Body](https://gearsmagazine.com/magazine/subaru-cvt-gen-2-valve-body/) — Transfer clutch solenoid is "normally closed, duty cycle controlled; as the duty cycle rises, the pressure increases to the transfer clutch"
- [Sonnax — Subaru Transfer Clutch](https://www.sonnax.com/tech_resources/166-subarus-have-their-own-set-of-problems) — Describes failsafe behavior and clutch operation
- [Subaru Legacy International](https://sl-i.net/FORUM/archive/index.php/t-7663.html) — Solenoid duty cycle behavior

---

## 4. Solenoid Specifications & Current-to-Torque Mapping

### AWD Transfer Clutch Duty Solenoid

| Spec | Value |
|------|-------|
| Type | Normally closed, duty-cycle (PWM) controlled |
| Resistance | 2.0–4.5 Ω |
| Wire colors | Black and orange |
| Normal operating current | Up to ~1.08 A (1080 mA) |
| Malfunction threshold (DTC P0965) | >1.08 A deviation; 1.08–1.6 A indicates fault |
| Forced operation test points | 300 → 500 → 700 mA |

### Pressure vs Duty Cycle (from Subaru Service Manual)

| Condition | Duty | Pressure |
|-----------|:----:|----------|
| N or P range | Any | 0 kPa |
| FWD mode | Any | 0 kPa |
| AWD, D range, normal | ~60% | **400–700 kPa** (58–102 psi) |
| AWD, D range, WOT | 95–100% | **1000–1200 kPa** (145–174 psi) |

### Estimated Current-to-Torque Mapping

**No official Subaru calibration table exists publicly.** The following is derived from service manual pressure data, community research, and the known sigmoidal characteristic of multi-plate wet clutch packs:

| Current (mA) | Approx. Duty | Est. Clutch Pressure | Est. Rear Torque % | Split |
|:------------:|:------------:|:--------------------:|:------------------:|:-----:|
| 0–100 | 0–10% | Minimal (drag only) | ~0–5% | ~100:0 to 95:5 |
| 100–300 | 10–30% | Low engagement | ~5–20% | 95:5 to 80:20 |
| 300–600 | 30–60% | **400–700 kPa** | ~20–40% | 80:20 to 60:40 |
| 600–800 | 60–80% | 700–1000 kPa | ~40–48% | 60:40 to 52:48 |
| 800–1080 | 80–100% | **1000–1200 kPa** | ~48–50% | 52:48 to 50:50 |

**The relationship is approximately sigmoidal (S-curve)**:
- Below ~100 mA: minimal engagement (overcome spring preload)
- 100–800 mA: roughly linear mid-range
- Above ~800 mA: diminishing returns as clutch approaches full lock

### Caveats for Estimation
- These are **community-derived estimates**, not official Subaru engineering data
- ATF temperature affects clutch friction (60–80°C is the service manual test range)
- Clutch pack wear state changes the current-to-torque relationship over time
- Hydraulic pressure is a function of solenoid current after overcoming spring preload — not perfectly linear
- CVT oil pump is engine-driven, so hydraulic system pressure varies with engine RPM

### Sources
- [GEARS Magazine — Subaru CVT Gen 2 Valve Body](https://gearsmagazine.com/magazine/subaru-cvt-gen-2-valve-body/) — Resistance specs for all TR580 solenoids
- [Subaru Crosstrek Service Manual — DTC P0965](https://www.sucross.com/dtc_p0965_pressure_control_solenoid_b_control_circuit_range_performance-1234.html) — "300 > 500 > 700 mA during forced operation" and malfunction threshold
- [Subaru Legacy Service Manual — Transfer Clutch Pressure Test](https://www.sulegacy.com/transfer_clutch_pressure_test_inspection-1284.html) — Pressure values at 60% and 95–100% duty
- [Subaru OEMDTC — Transfer Clutch Diagnostics Newsletter](https://subaru.oemdtc.com/3722/tips_se_dec2021-transfer-clutch-system-diagnostics-consolidated-special-edition-newsletter-subaru) — 600 mA test procedure

---

## 5. TR580 CVT Technical Specifications

| Specification | Value |
|---------------|-------|
| Designation | TR580 (T=Transmission, R=Full-time AWD, 58=pulley center distance cm, 0=CVT) |
| Generation | Gen II Lineartronic |
| Drive type | Chain-driven CVT (steel link chain, not belt) |
| Final drive / differential ratio | **3.70:1** |
| CVT ratio range (low) | 3.70:1 |
| CVT ratio range (high) | 0.55:1 |
| Simulated gears | 8-speed manual mode (RS trim, paddle shifters) |
| Torque capacity | ~250 Nm (~184 lb-ft) input |
| Torque converter | Yes (hydraulic launch device, locks up during driving) |
| CVT fluid | Subaru CVTF-III (2020+ models, green) |
| Total fluid capacity | ~11.9–12.4 L (dry fill); ~4–5.5 qt (drain-and-refill) |
| Size vs Gen I (TR690) | 100 mm shorter, 15% lighter |
| Applications | Impreza, Crosstrek, Forester, Legacy, Outback (NA engines) |

### 2024 Impreza RS Powertrain

| Spec | Value |
|------|-------|
| Engine | 2.5L BOXER (FB25D) |
| Power | 182 hp @ 5,800 RPM |
| Torque | 178 lb-ft (241 Nm) @ 4,400 RPM |
| Transmission | TR580 Lineartronic CVT |
| AWD System | Active Torque Split (ATS) |
| Curb weight | ~3,200 lbs (1,451 kg) |

### Sources
- [Subaru Media — 2024 Impreza](https://media.subaru.com/newsrelease.do?id=1996&mid=138) — Engine specs, "Lineartronic CVT"
- [GEARS Magazine — Lock-Up Solenoids](https://gearsmagazine.com/magazine/subaru-lineartronic-cvt-lock-up-solenoids/) — TR580 is Gen 2, valve body on top
- [TN Powertrain — TR580 Differential Pinion Set](https://tnpowertrain.com/products/subaru-2-5l-lineartronic-cvt-tr580-differential-pinion-set-2019-2021-ratio-3-70) — Differential ratio 3.70
- [Subaru Outback Forums](https://www.subaruoutback.org/threads/high-torque-cvt-vs-normal-cvt.312433/) — TR580 naming convention
- [BobIsTheOilGuy — TR580 Drain and Refill](https://bobistheoilguy.com/forums/threads/subaru-tr580-lineartronic-cvt-drain-and-refill.299539/) — Fluid capacity

---

## 6. Relevant Technical Service Bulletins

### TSB 16-107-17R (Revised)
- **Subject**: CVT Warranty Extension for 2010–2015 models
- **Relevance**: Extends CVT powertrain warranty from 5yr/60k to 10yr/100k miles. Explicitly lists Multi Plate Transfer Clutches (MPT) as a serviceable component
- **Source**: [NHTSA TSB Archive](https://static.nhtsa.gov/odi/tsbs/2017/MC-10125885-9999.pdf)

### TIPS Special Edition — December 2021: Transfer Clutch System Diagnostics
- **Subject**: Consolidated diagnostics for CVT transfer clutch (both TR580 and TR690)
- **Key content**: Transfer clutch pressure test procedures using SSM, 600 mA solenoid test point, WOT pressure checks, fluid temperature requirements (60–80°C / 140–176°F)
- **Source**: [Subaru OEMDTC](https://subaru.oemdtc.com/3722/tips_se_dec2021-transfer-clutch-system-diagnostics-consolidated-special-edition-newsletter-subaru)

### NHTSA TSB MC-10205932-0001 (2021)
- **Subject**: Subaru Service and Technical Support Line Newsletter — CVT solenoid diagnostics
- **Source**: [NHTSA](https://static.nhtsa.gov/odi/tsbs/2021/MC-10205932-0001.pdf)

---

## 7. Other TR580 Solenoids (Reference)

| Solenoid | Resistance | Type |
|----------|:----------:|------|
| AWD Transfer Clutch Duty | 2.0–4.5 Ω | Normally closed, duty |
| Lockup Duty | 10.0–13.5 Ω | Normally closed |
| Primary Up | 10.0–13.5 Ω | Normally closed |
| Primary Down | 10.0–13.5 Ω | Normally closed |
| Secondary Line Pressure | 5–7 Ω | PWM at 2000 Hz |
| Forward/Reverse Linear | 4–6 Ω | PWM |

**Source**: [GEARS Magazine — Subaru CVT Gen 2 Valve Body](https://gearsmagazine.com/magazine/subaru-cvt-gen-2-valve-body/)

---

## 8. Implications for the Analyzer

### Torque Split Estimation Algorithm

Given `awdSolenoidActualCurrent` (mA) from OBD2 data:

1. **Normalize**: `ratio = actualCurrent / maxObservedCurrent` (or use 1080 mA as theoretical max)
2. **Apply sigmoidal mapping** (not linear) for rear torque %:
   - Below ~100 mA threshold: ~0–5% rear (effectively FWD)
   - Linear mid-range 100–800 mA: 5–48% rear
   - Saturation above 800 mA: 48–50% rear
3. **Front% = 100% - rear%**
4. **Display as stacked area chart** (front/rear over time)

### Required Tooltips/Caveats
- "Torque split is estimated from AWD solenoid current using community-derived mapping, not official Subaru calibration data"
- "Actual split varies with ATF temperature, clutch wear, and engine RPM (pump-driven hydraulics)"
- "Default split for ATS system is 60:40 (front:rear); maximum 50:50 under full clutch lock"

### Confidence Assessment

| Claim | Confidence | Basis |
|-------|:----------:|-------|
| ATS system type | HIGH | Multiple official + third-party sources |
| 60:40 default split | HIGH | 4+ independent sources |
| 50:50 max split | HIGH | 3+ sources + mechanical limitation |
| Normally closed solenoid (Gen 2) | HIGH | GEARS Magazine (industry publication) |
| 600 mA = ~60% duty | HIGH | Subaru service manual procedure |
| 1000–1200 kPa at WOT | HIGH | Subaru service manual |
| mA-to-rear-torque-% mapping | MEDIUM | Community-derived, no official table exists |
| Sigmoidal curve shape | MEDIUM | Expected from wet clutch physics, not directly measured |
| TR580 final drive 3.70:1 | HIGH | OEM parts listing |
