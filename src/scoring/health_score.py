"""
RoadWise - Pavement Condition Score Engine (Physical Degradation Index)

MATHEMATICAL FORMULATION & VIVA EXPLANATION:
--------------------------------------------
This module translates YOLOv8 bounding box detections into a single continuous physical
condition index ranging strictly from 0.00 to 100.00:
    100.00 = Pristine road surface (zero detected damage)
      0.00 = Extremely deteriorated / impassable road failure

MATHEMATICAL FORMULA:
---------------------
    Condition Score = 100.0 * exp( - Damage_Load / K )

Where:
    1. K = 2.0 (Exponential Decay Scale Constant):
       Controls the slope/steepness of score degradation. A larger K makes the score fall
       more gradually, while a smaller K penalizes defects aggressively.
    2. Damage_Load = Sum of effective severities across all non-duplicate detections:
       Damage_Load = SUM [ Severity(det_i) * (1.0 - Max_Overlap(det_i, accepted_same_class)) ]
    3. Severity(det) = CLASS_WEIGHT[code] * confidence * Size_Factor
    4. Size_Factor = min( 1.0, max( SIZE_FLOOR, (width * height) / AREA_REF[code] ) )
       - Normalizes bounding box visual area against empirical 90th-percentile defect size.
       - Clamped between SIZE_FLOOR (0.40) and 1.00 so small defects still contribute meaningful load.

DUPLICATE & OVERLAP DISCOUNTING:
--------------------------------
If multiple overlapping bounding boxes of the SAME damage class are detected on the same physical
crack or pothole (common with multi-scale YOLO predictions), subsequent boxes are discounted by the
fraction of their area that is already enclosed within an earlier, higher-confidence detection.
Different classes (e.g., a pothole inside an alligator crack network) do NOT discount each other.

IMPORTANT ENGINEERING CAVEATS (FOR TECHNICAL VIVA):
---------------------------------------------------
- This is a project-defined mathematical triage index, NOT an ASTM D6433 Pavement Condition Index (PCI).
- Bounding box area is 2D pixel area normalized (0-1), not physical metric square meters (unless camera
  intrinsics and mounting angles are calibrated).
- If the computer vision model misses a defect (false negative), the road receives a higher score than reality.
"""
import math

# ===========================================================================
# 1. EMPIRICAL PROJECT CONFIGURATION & WEIGHTS
# ===========================================================================

# Relative structural severity weights per defect taxonomy.
# Potholes (D40) cause immediate structural puncture and wheel rim damage (Weight: 1.00).
# Alligator cracking (D20) denotes foundational base/subgrade fatigue failure (Weight: 0.80).
# Single linear fissures (D00 Longitudinal, D10 Transverse) allow water ingress but less immediate hazard (Weight: 0.50).
CLASS_WEIGHT = {
    "D40": 1.00,  # Pothole
    "D20": 0.80,  # Alligator Crack (Fatigue cracking)
    "D00": 0.50,  # Longitudinal Crack (Wheelpath parallel)
    "D10": 0.50   # Transverse Crack (Cross-perpendicular)
}

# Empirical 90th-percentile relative bounding box area (width * height) from the RDD validation set.
# Used to scale defect visual impact so large fissures count more than tiny artifacts.
# (D10 had rare validation representation, so 0.070 is assigned as baseline reference).
AREA_REF = {
    "D40": 0.101,  # Pothole reference area (10.1% of image canvas)
    "D20": 0.235,  # Alligator crack reference area (23.5% of canvas)
    "D00": 0.070,  # Longitudinal crack reference area (7.0% of canvas)
    "D10": 0.070   # Transverse crack reference area
}

# Default noise rejection threshold: detections below 0.10 confidence are filtered out.
MIN_CONFIDENCE = 0.10

# Minimum severity multiplier floor for any valid detection, even if miniscule in area.
SIZE_FLOOR = 0.40

# Exponential curve steepness parameter.
K = 2.0


# ===========================================================================
# 2. OVERLAP GEOMETRY CALCULATION
# ===========================================================================

def _overlap_fraction(a, b):
    """
    Calculate the fraction of box `a`'s area that is contained inside box `b`.

    WHY IT IS REQUIRED:
    -------------------
    When YOLO detects the same pothole or crack multiple times with slightly shifted boxes,
    simply summing their severities artificially deflates the road health score.

    HOW IT WORKS:
    -------------
    Boxes are in normalized format: (x_center, y_center, width, height).
    1. Converts center-based coordinates to corner bounding coordinates: (x1, y1, x2, y2).
    2. Calculates intersection width: max(0, min(ax2, bx2) - max(ax1, bx1)).
    3. Calculates intersection height: max(0, min(ay2, by2) - max(ay1, by1)).
    4. Divides intersection area by box `a`'s area.

    RETURNS:
    --------
    float: 0.0 (no intersection) to 1.0 (box `a` completely enclosed in box `b`).
    """
    ax1, ay1, ax2, ay2 = a[0] - a[2] / 2, a[1] - a[3] / 2, a[0] + a[2] / 2, a[1] + a[3] / 2
    bx1, by1, bx2, by2 = b[0] - b[2] / 2, b[1] - b[3] / 2, b[0] + b[2] / 2, b[1] + b[3] / 2
    iw = max(0.0, min(ax2, bx2) - max(ax1, bx1))
    ih = max(0.0, min(ay2, by2) - max(ay1, by1))
    area_a = max(a[2] * a[3], 1e-9)
    return (iw * ih) / area_a


# ===========================================================================
# 3. INDIVIDUAL DETECTION SEVERITY
# ===========================================================================

def detection_severity(det):
    """
    Compute raw damage impact of a single detection before overlap discounting.

    FORMULA:
    --------
        Severity = CLASS_WEIGHT[code] * confidence * Size_Factor

    Where:
        Size_Factor = min(1.0, max(SIZE_FLOOR, rel_area / AREA_REF[code]))

    VARIABLES:
    ----------
    - `weight`: intrinsic class danger (D40=1.00 down to D00=0.50).
    - `confidence`: model certainty probability (0.0 to 1.0) acts as a linear discount.
    - `size_factor`: ratio of box area to expected 90th percentile defect area.
    """
    code = det["class_code"]
    weight = CLASS_WEIGHT.get(code, 0.0)
    rel_area = det["width"] * det["height"]
    size_factor = min(1.0, max(SIZE_FLOOR, rel_area / AREA_REF.get(code, 0.07)))
    return weight * det["confidence"] * size_factor


# ===========================================================================
# 4. OVERALL IMAGE CONDITION SCORE
# ===========================================================================

def calculate_condition(detections, min_confidence=None):
    """
    Calculate the overall physical Condition Score for an image.

    FLOW:
    -----
    1. Filter detections: keep only recognized classes with confidence >= threshold.
    2. Sort candidate detections in descending order of individual severity.
    3. Greedily accept the highest severity box first.
    4. For each subsequent box of the same class, discount its contribution by the
       maximum overlap fraction with previously accepted boxes of that same class.
    5. Accumulate total `damage_load`.
    6. Apply exponential decay: Condition = 100.0 * exp( - Damage_Load / K ).

    PARAMETERS:
    -----------
    detections : list[dict]
        List of detections containing class_code, confidence, x_center, y_center, width, height.
    min_confidence : float, optional
        Confidence cutoff (defaults to MIN_CONFIDENCE = 0.10 if None).

    RETURNS:
    --------
    dict:
        {
            "damage_load": float,       # Raw accumulated damage metric
            "condition_score": float,   # 0.00 to 100.00
            "health_score": float,      # Alias identical to condition_score
            "detections_used": int      # Count of valid detections included in scoring
        }
    """
    threshold = MIN_CONFIDENCE if min_confidence is None else float(min_confidence)
    kept = [d for d in detections
            if d.get("confidence", 0.0) >= (threshold - 1e-4) and d.get("class_code") in CLASS_WEIGHT]

    # Sort strongest detections first so primary defects anchor the scoring
    kept.sort(key=detection_severity, reverse=True)

    accepted = []  # List of tuples: (class_code, box_tuple)
    damage_load = 0.0

    for d in kept:
        box = (d["x_center"], d["y_center"], d["width"], d["height"])

        # Calculate overlap against existing accepted boxes of the SAME defect type
        covered = max((_overlap_fraction(box, b) for code, b in accepted if code == d["class_code"]),
                      default=0.0)

        # Marginal damage load discounted by already covered area
        effective_contribution = detection_severity(d) * (1.0 - covered)
        damage_load += effective_contribution
        accepted.append((d["class_code"], box))

    # Calculate exponential decay score (clamped naturally between 0.0 and 100.0)
    condition = 100.0 * math.exp(-damage_load / K)

    return {
        "damage_load": round(damage_load, 4),
        "condition_score": round(condition, 2),
        "health_score": round(condition, 2),   # Compatible alias used by risk_score.py
        "detections_used": len(kept),
    }


if __name__ == "__main__":
    # Internal module unit verification check:
    test = [
        {"class_code": "D40", "confidence": 0.60, "x_center": 0.3, "y_center": 0.8, "width": 0.25, "height": 0.2},
        {"class_code": "D20", "confidence": 0.50, "x_center": 0.5, "y_center": 0.75, "width": 0.9, "height": 0.3},
    ]
    print("RoadWise condition score test (synthetic test detections):")
    print(calculate_condition(test))
    print("No detections (pristine pavement):", calculate_condition([]))