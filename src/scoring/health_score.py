"""
RoadWise - Road Condition Score (project-defined)

Turns YOLO detections from ONE image into a condition score from 0 to 100.
    100 = no detected damage     0 = very heavy detected damage

IMPORTANT
- Every weight and constant below is a RoadWise project-defined choice. It is NOT an official
  government or research-paper formula, and the score is NOT a physical measurement.
- Box size is relative to the image (0-1). It is a visual indicator, not real-world size.
- YOLO confidence is model certainty, not damage severity. Here it only scales how much a
  detection counts.

Each detection must be a dict with: class_code, confidence, width, height, x_center, y_center
(the same keys the database uses; box values are normalised 0-1).
"""
import math

# ---- Project-defined settings (tune these using validation data, then document the final values) ----

# How serious each damage class is, relative to the others (project judgement:
# potholes are an immediate hazard; alligator cracking suggests wider surface failure; single cracks matter less).
CLASS_WEIGHT = {"D40": 1.00, "D20": 0.80, "D00": 0.50, "D10": 0.50}

# "Large box" reference per class = 90th percentile of relative box area among the model's detections
# on the validation set (results/metrics/val_detection_summary.csv). D10 had only 1 detection,
# so its value is a placeholder.
AREA_REF = {"D40": 0.101, "D20": 0.235, "D00": 0.070, "D10": 0.070}

MIN_CONFIDENCE = 0.25   # detections below this are ignored
SIZE_FLOOR = 0.40       # even a small box counts at least this much of full size
K = 2.0                 # curve steepness: bigger K = score falls more slowly


def _overlap_fraction(a, b):
    """Share of box a's area that lies inside box b. Boxes are (x_center, y_center, w, h)."""
    ax1, ay1, ax2, ay2 = a[0] - a[2] / 2, a[1] - a[3] / 2, a[0] + a[2] / 2, a[1] + a[3] / 2
    bx1, by1, bx2, by2 = b[0] - b[2] / 2, b[1] - b[3] / 2, b[0] + b[2] / 2, b[1] + b[3] / 2
    iw = max(0.0, min(ax2, bx2) - max(ax1, bx1))
    ih = max(0.0, min(ay2, by2) - max(ay1, by1))
    area_a = max(a[2] * a[3], 1e-9)
    return (iw * ih) / area_a


def detection_severity(det):
    """Raw severity of one detection (before overlap discount)."""
    code = det["class_code"]
    weight = CLASS_WEIGHT.get(code, 0.0)
    rel_area = det["width"] * det["height"]
    size_factor = min(1.0, max(SIZE_FLOOR, rel_area / AREA_REF.get(code, 0.07)))
    return weight * det["confidence"] * size_factor


def calculate_condition(detections):
    """Condition score for one image.

    Overlapping boxes of the SAME class are discounted so duplicate detections of the same
    damage are not counted several times: the strongest detection is counted first, and each
    later one is reduced by the share of its box already covered by an earlier one of the same
    class. Boxes of different classes are not discounted against each other (for example a pothole
    inside a large alligator-crack box still counts).
    """
    kept = [d for d in detections
            if d["confidence"] >= MIN_CONFIDENCE and d["class_code"] in CLASS_WEIGHT]
    kept.sort(key=detection_severity, reverse=True)

    accepted = []  # (class_code, box)
    damage_load = 0.0
    for d in kept:
        box = (d["x_center"], d["y_center"], d["width"], d["height"])
        covered = max((_overlap_fraction(box, b) for code, b in accepted if code == d["class_code"]),
                      default=0.0)
        damage_load += detection_severity(d) * (1.0 - covered)
        accepted.append((d["class_code"], box))

    condition = 100.0 * math.exp(-damage_load / K)
    return {
        "damage_load": round(damage_load, 4),
        "condition_score": round(condition, 2),
        "health_score": round(condition, 2),   # same value; name used by risk_score.py
        "detections_used": len(kept),
    }


if __name__ == "__main__":
    # Test detections for checking the code ONLY. They are not model results.
    test = [
        {"class_code": "D40", "confidence": 0.60, "x_center": 0.3, "y_center": 0.8, "width": 0.25, "height": 0.2},
        {"class_code": "D20", "confidence": 0.50, "x_center": 0.5, "y_center": 0.75, "width": 0.9, "height": 0.3},
    ]
    print("RoadWise condition score test (fake detections)")
    print(calculate_condition(test))
    print("No detections:", calculate_condition([]))