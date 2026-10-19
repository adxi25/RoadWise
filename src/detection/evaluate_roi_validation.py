
from pathlib import Path
import sys
import pandas as pd
import cv2

BASE = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BASE / "src"))

from detection.predict import detect
from detection.roi_detect import detect_roi, deduplicate_detections, DEFAULT_ROI

IMAGES = BASE / "data/processed/yolo/images/val"
LABELS = BASE / "data/processed/yolo/labels/val"
OUT = BASE / "results/metrics/roi_full_validation.csv"
CONF = 0.25
IOU_MATCH = 0.50

def iou(a, b):
    ax1, ay1 = a["x_center"] - a["width"]/2, a["y_center"] - a["height"]/2
    ax2, ay2 = a["x_center"] + a["width"]/2, a["y_center"] + a["height"]/2
    bx1, by1 = b["x_center"] - b["width"]/2, b["y_center"] - b["height"]/2
    bx2, by2 = b["x_center"] + b["width"]/2, b["y_center"] + b["height"]/2
    iw = max(0, min(ax2, bx2) - max(ax1, bx1))
    ih = max(0, min(ay2, by2) - max(ay1, by1))
    inter = iw * ih
    union = a["width"]*a["height"] + b["width"]*b["height"] - inter
    return inter / union if union > 0 else 0

def ground_truth(path):
    result = []
    label = LABELS / f"{path.stem}.txt"
    if not label.exists():
        raise FileNotFoundError(f"Missing label: {label}")
    for line in label.read_text().splitlines():
        p = line.split()
        if len(p) >= 5:
            result.append({
                "class_id": int(p[0]),
                "x_center": float(p[1]),
                "y_center": float(p[2]),
                "width": float(p[3]),
                "height": float(p[4]),
            })
    return result

def score(predictions, truths):
    # Greedy one-to-one matching at IoU >= 0.50, same class only.
    candidates = []
    for pi, pred in enumerate(predictions):
        for ti, truth in enumerate(truths):
            if pred["class_id"] == truth["class_id"]:
                overlap = iou(pred, truth)
                if overlap >= IOU_MATCH:
                    candidates.append((overlap, pi, ti))
    candidates.sort(reverse=True)

    matched_p, matched_t = set(), set()
    for _, pi, ti in candidates:
        if pi not in matched_p and ti not in matched_t:
            matched_p.add(pi)
            matched_t.add(ti)

    tp = len(matched_p)
    return tp, len(predictions) - tp, len(truths) - tp

def main():
    images = sorted(
        p for p in IMAGES.iterdir()
        if p.suffix.lower() in {".jpg", ".jpeg", ".png"}
    )
    if not images:
        raise FileNotFoundError(f"No validation images in {IMAGES}")

    totals = {
        "Full 640": [0, 0, 0],
        "ROI 640": [0, 0, 0],
        "Combined": [0, 0, 0],
    }

    for index, path in enumerate(images, 1):
        truths = ground_truth(path)

        baseline, _ = detect(path, conf=CONF, imgsz=640)
        roi_dets, _ = detect_roi(
            path, conf=CONF, imgsz=640, roi=DEFAULT_ROI
        )
        combined = deduplicate_detections(
            baseline + roi_dets, iou_threshold=0.45
        )

        methods = {
            "Full 640": baseline,
            "ROI 640": roi_dets,
            "Combined": combined,
        }

        for name, dets in methods.items():
            predictions = [
                {
                    "class_id": {"D00": 0, "D10": 1, "D20": 2, "D40": 3}.get(
                        d["class_code"], -1
                    ),
                    "x_center": d["x_center"],
                    "y_center": d["y_center"],
                    "width": d["width"],
                    "height": d["height"],
                }
                for d in dets
                if d.get("class_code") in {"D00", "D10", "D20", "D40"}
            ]
            tp, fp, fn = score(predictions, truths)
            for j, value in enumerate((tp, fp, fn)):
                totals[name][j] += value

        if index % 50 == 0 or index == len(images):
            print(f"Processed {index}/{len(images)} images")

    rows = []
    for name, (tp, fp, fn) in totals.items():
        precision = tp / (tp + fp) if tp + fp else 0
        recall = tp / (tp + fn) if tp + fn else 0
        f1 = (
            2 * precision * recall / (precision + recall)
            if precision + recall else 0
        )
        rows.append({
            "Method": name, "TP": tp, "FP": fp, "FN": fn,
            "Precision": precision, "Recall": recall, "F1": f1,
            "IoU threshold": IOU_MATCH, "Confidence threshold": CONF,
        })

    report = pd.DataFrame(rows)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    report.to_csv(OUT, index=False)
    print("\nFULL VALIDATION ROI COMPARISON")
    print(report.to_string(index=False))
    print(f"\nSaved report: {OUT}")
    print("These are fixed-threshold precision/recall/F1 metrics, not mAP.")

if __name__ == "__main__":
    main()
