# RoadWise — Scoring Methodology
**Version:** 2.0 (Multiplicative Risk Model)  
**Last Updated:** 2026-11-11  
**Source files:** `src/scoring/health_score.py`, `src/scoring/risk_score.py`

> [!NOTE]
> This document describes the **actual current implementation**. If the code and this document disagree, the code is authoritative. Report discrepancies before changing either.

---

## Overview

RoadWise uses a two-stage scoring pipeline:

1. **Condition Score** — Measures physical road surface degradation (0 to 100)
2. **Risk Score** — Combines condition with road context to estimate maintenance urgency (0 to 100)

These are **project-defined indices**, not standard engineering standards like ASTM D6433 PCI. They are designed to be explainable, bounded, and contextually sensitive.

---

## Stage 1 — Condition Score (`src/scoring/health_score.py`)

### Purpose
Convert YOLO bounding-box detections into a single number representing how damaged the road surface is.

**100 = Pristine road. 0 = Completely deteriorated road.**

### Inputs
- List of detection dicts: `[{class_code, confidence, x_center, y_center, width, height}, ...]`
- Optional `min_confidence` threshold (default: 0.10)

### Step-by-Step Calculation

#### Step 1: Filter Detections
Only keep detections where:
- `confidence ≥ min_confidence` (default 0.10)
- `class_code` is in `{D00, D10, D20, D40}`

```python
MIN_CONFIDENCE = 0.10
kept = [d for d in detections if d["confidence"] >= 0.10 and d["class_code"] in CLASS_WEIGHT]
```

#### Step 2: Sort by Severity (Strongest First)
Prevents weaker duplicate boxes from anchoring the overlap calculation.

```python
kept.sort(key=detection_severity, reverse=True)
```

#### Step 3: Compute Individual Severity

For each detection:

$$\text{Severity}(det) = \text{CLASS\_WEIGHT}[code] \times \text{confidence} \times \text{Size\_Factor}$$

Where:

$$\text{Size\_Factor} = \min\left(1.0,\ \max\left(0.40,\ \frac{w \times h}{\text{AREA\_REF}[code]}\right)\right)$$

**Class weights:**

| Class | Code | Weight | Rationale |
|---|---|---|---|
| Pothole | D40 | 1.00 | Immediate structural hazard, wheel damage |
| Alligator crack | D20 | 0.80 | Base layer fatigue failure |
| Longitudinal crack | D00 | 0.50 | Water ingress, less immediate |
| Transverse crack | D10 | 0.50 | Water ingress, less immediate |

**Area reference values (90th-percentile box area from validation set):**

| Class | AREA_REF | Meaning |
|---|---|---|
| D40 | 0.101 | 10.1% of image canvas |
| D20 | 0.235 | 23.5% of image canvas |
| D00 | 0.070 | 7.0% of image canvas |
| D10 | 0.070 | 7.0% of image canvas |

**SIZE_FLOOR = 0.40**: Even a tiny crack contributes at least 40% of its class weight × confidence.

#### Step 4: Overlap Discounting (Same-Class Duplicate Suppression)

For each detection, calculate how much of its area is already covered by a previously-accepted detection **of the same class**:

$$\text{covered} = \max_{b \in \text{accepted same class}} \frac{\text{Area}(box \cap b)}{\text{Area}(box)}$$

The effective damage contribution of this detection is:

$$\text{effective} = \text{Severity}(det) \times (1 - \text{covered})$$

**Why:** YOLO sometimes predicts the same crack twice with slightly shifted boxes. Without discounting, one crack would count twice in the damage score.

**Key rule:** Only same-class boxes discount each other. A pothole inside an alligator crack zone does NOT discount the alligator crack.

#### Step 5: Accumulate Total Damage Load

$$\text{Damage\_Load} = \sum_{i} \text{effective}(det_i)$$

#### Step 6: Apply Exponential Decay

$$\text{Condition Score} = 100.0 \times e^{-\text{Damage\_Load} / K}$$

Where **K = 2.0** is the exponential decay constant.

**Why exponential?**  
- One severe defect should depress the score significantly, not proportionally
- Multiple defects have diminishing marginal impact (a road with 10 cracks isn't 10× worse than a road with 1 crack — it's already failing)
- Output is naturally bounded: score approaches 0 for extreme damage, 100 for no damage

### Complete Numerical Example

**Scenario:** One pothole (D40, conf=0.60, 25%×20% of image = 0.05 relative area)

```
CLASS_WEIGHT[D40] = 1.00
confidence = 0.60
rel_area = 0.25 * 0.20 = 0.05
AREA_REF[D40] = 0.101
Size_Factor = min(1.0, max(0.40, 0.05/0.101)) = min(1.0, max(0.40, 0.495)) = 0.495

Severity = 1.00 × 0.60 × 0.495 = 0.297
No previous boxes → covered = 0
effective = 0.297 × (1 - 0) = 0.297

Damage_Load = 0.297
Condition_Score = 100 * exp(-0.297 / 2.0)
               = 100 * exp(-0.1485)
               = 100 * 0.862
               = 86.2
```

**Interpretation:** A single medium-confidence pothole covering ~5% of the image → condition score of ~86 (road is damaged but not severely degraded).

**Zero detections:** `Damage_Load = 0` → `Condition_Score = 100 * exp(0) = 100.0` ✅

### Output Dictionary

```python
{
    "damage_load": 0.297,       # Raw accumulated damage
    "condition_score": 86.2,    # 0.0 to 100.0
    "health_score": 86.2,       # Alias (same value, used by risk_score.py)
    "detections_used": 1        # Count of valid detections included
}
```

---

## Stage 2 — Risk Score (`src/scoring/risk_score.py`)

### Purpose
Translate physical damage into **maintenance urgency** by combining condition with road context.

**Key design decision (V2 multiplicative model):**

**Problem with V1 (additive):**  
`Risk = (100 - Condition) * 0.5 + ContextScore * 0.5`  
A perfectly-paved road near a school got Risk=50 (HIGH) — a false alarm.

**V2 fix (multiplicative):**  
`Risk = DamageLevel × ContextMultiplier`  
If condition = 100 (no damage), damage_level = 0, so risk = 0 regardless of location. ✅

### Inputs
- `health_score`: condition score from Stage 1 (0 to 100)
- `road_type`: string (e.g., "national_highway", "residential")
- `traffic`: string (e.g., "high", "low")
- `location_sensitivity`: string (e.g., "school", "none")

### Step-by-Step Calculation

#### Step 1: Damage Level

$$\text{Damage} = 100 - \text{Condition\_Score}$$

$$\text{Damage\_Level} = \min\left(100,\ \frac{\text{Damage}}{\text{DAMAGE\_REF}} \times 100\right)$$

Where **DAMAGE_REF = 40.0** (a condition score of 60 or below = "severe structural distress" = max urgency).

**Examples:**
| Condition Score | Damage | Damage Level |
|---|---|---|
| 100 (pristine) | 0 | 0 |
| 85 (minor damage) | 15 | 37.5 |
| 60 (severe) | 40 | 100 |
| 35 (critical) | 65 | 100 (capped) |

#### Step 2: Context Factor

$$\text{Context\_Factor} = \frac{0.30 \times \text{RoadTypeScore} + 0.30 \times \text{TrafficScore} + 0.40 \times \text{SensitivityScore}}{100}$$

**Road Type Scores (selected):**

| Road Type | Score |
|---|---|
| national_highway, expressway, emergency_route | 100 |
| state_highway, major_arterial, airport_road | 90 |
| main_road, school_road | 80 |
| hospital_road | 85 |
| commercial_road | 70 |
| residential, local_road, colony_road | 35-40 |
| rural_road | 30 |
| village_road | 25 |
| farm_road | 15 |

**Traffic Scores:**

| Traffic | Score |
|---|---|
| very_high | 100 |
| high | 80 |
| medium | 55 |
| low | 30 |
| very_low | 10 |

**Location Sensitivity Scores:**

| Sensitivity | Score |
|---|---|
| school, hospital, emergency_service | 100 |
| railway_station, airport | 85 |
| bus_terminal | 80 |
| college_university | 80 |
| government_office, public_facility | 70 |
| market, shopping_area | 65 |
| residential_area | 40 |
| none | 0 |
| other | 20 |

#### Step 3: Context Multiplier

$$\text{Multiplier} = \text{MULTIPLIER\_MIN} + (\text{MULTIPLIER\_MAX} - \text{MULTIPLIER\_MIN}) \times \text{Context\_Factor}$$

Where:
- **MULTIPLIER_MIN = 0.6** (least critical context: calm rural road, low traffic, no sensitivity)
- **MULTIPLIER_MAX = 1.6** (most critical context: highway, very high traffic, school/hospital)

**Multiplier range: [0.6, 1.6]**  
This means context can amplify damage urgency by up to 60%, or discount it by up to 40%.

#### Step 4: Risk Score

$$\text{Risk\_Score} = \min(100, \max(0, \text{Damage\_Level} \times \text{Multiplier}))$$

#### Step 5: Priority Classification

| Risk Score | Priority |
|---|---|
| ≥ 75 | CRITICAL |
| ≥ 50 | HIGH |
| ≥ 25 | MEDIUM |
| < 25 | LOW |

### Complete Numerical Example

**Scenario:** School road near a hospital with damage (condition_score = 70.0)

```
Condition_Score = 70.0

Step 1 — Damage Level:
  Damage = 100 - 70.0 = 30.0
  Damage_Level = min(100, (30.0 / 40.0) * 100) = min(100, 75.0) = 75.0

Step 2 — Context Factor:
  Road: "school_road" → score = 80
  Traffic: "high" → score = 80
  Sensitivity: "school" → score = 100
  Context_Factor = (0.30×80 + 0.30×80 + 0.40×100) / 100
                 = (24 + 24 + 40) / 100
                 = 88 / 100 = 0.88

Step 3 — Context Multiplier:
  Multiplier = 0.6 + (1.6 - 0.6) × 0.88
             = 0.6 + 1.0 × 0.88
             = 1.48

Step 4 — Risk Score:
  Risk_Score = 75.0 × 1.48 = 111.0 → capped at 100.0

Priority → CRITICAL (≥ 75)
```

**Compare with low-context road (same damage, residential, low traffic):**
```
Context_Factor = (0.30×40 + 0.30×30 + 0.40×0) / 100 = (12+9+0)/100 = 0.21
Multiplier = 0.6 + 1.0 × 0.21 = 0.81
Risk_Score = 75.0 × 0.81 = 60.75 → HIGH
```

**Same physical damage → CRITICAL on school road vs HIGH on residential road.** This is the intended behaviour — the same pothole is more urgent if it's near a school than on a farm road.

---

## Scoring Limitations

> [!WARNING]
> These limitations must be understood and disclosed during any viva or presentation.

1. **This is NOT ASTM D6433 PCI.** RoadWise condition scores are project-defined and not calibrated to real-world engineering measurements.
2. **Missed detections inflate the score.** If YOLO misses a crack (false negative), the road gets a higher condition score than reality. D20 (alligator crack) has 14.7% recall in Experiment A — many alligator cracks are missed, leading to overoptimistic scores on roads with alligator cracking.
3. **Bounding box area ≠ physical area.** The size factor is based on pixel area ratios, not real metric measurements. Without camera calibration data, we cannot convert to square metres.
4. **Context is self-reported.** The user enters road type and traffic level manually — these can be incorrect.
5. **Confidence weighting can be manipulated.** A model with systematically low confidence scores (even on correctly detected defects) will produce lower damage loads and higher condition scores.
6. **K=2.0 is empirically chosen**, not derived from a civil engineering dataset. Different K values would change all score outputs.

---

## Implementation Cross-Reference

| Formula component | Implementation location |
|---|---|
| `CLASS_WEIGHT` dict | [`health_score.py` lines ~35-40](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/src/scoring/health_score.py) |
| `AREA_REF` dict | [`health_score.py` lines ~43-48](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/src/scoring/health_score.py) |
| `_overlap_fraction()` | [`health_score.py`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/src/scoring/health_score.py) |
| `detection_severity()` | [`health_score.py`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/src/scoring/health_score.py) |
| `calculate_condition()` | [`health_score.py`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/src/scoring/health_score.py) |
| Road/traffic/sensitivity lookup tables | [`risk_score.py`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/src/scoring/risk_score.py) |
| `calculate_damage_level()` | [`risk_score.py`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/src/scoring/risk_score.py) |
| `calculate_context_factor()` | [`risk_score.py`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/src/scoring/risk_score.py) |
| `calculate_risk_score()` | [`risk_score.py`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/src/scoring/risk_score.py) |
| `analyze_risk()` | [`risk_score.py`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/src/scoring/risk_score.py) |
| Priority thresholds | `BAND_CRITICAL=75, BAND_HIGH=50, BAND_MEDIUM=25` in `risk_score.py` |
| Called by | `src/pipeline/inspection_pipeline.py` Steps 7 and 8 |

