"""
RoadWise - Detection Methods Comparison & Evaluation

Compares full-image baseline against experimental road-focused ROI detection
across representative real-world road inspection images.

Methods compared:
  1. Baseline Full Image (640px) - Production baseline
  2. Baseline Full Image (960px) - High-resolution full canvas
  3. Experimental Road-Focused ROI (640px) - Pavement band [ymin=0.35, ymax=1.00]
  4. Combined Deduplicated (Full 640 + ROI) - NMS IoU >= 0.45

Usage:
  python src/detection/evaluate_detection_methods.py
"""


from __future__ import annotations

import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
SRC_DIR = BASE_DIR / "src"

if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

import pandas as pd
from detection.roi_detect import compare_image_inference

EVAL_IMAGES = [
    BASE_DIR / "data" / "test_images" / "India_000045.jpg",
    BASE_DIR / "data" / "processed" / "yolo" / "images" / "val" / "India_000071.jpg",
    BASE_DIR / "data" / "processed" / "yolo" / "images" / "val" / "India_000078.jpg",
    BASE_DIR / "data" / "processed" / "yolo" / "images" / "val" / "India_000200.jpg",
    BASE_DIR / "data" / "processed" / "yolo" / "images" / "val" / "India_000298.jpg",
]

LABEL_DIR = BASE_DIR / "data" / "processed" / "yolo" / "labels" / "val"
ID2CODE = {0: "D00", 1: "D10", 2: "D20", 3: "D40"}
IOU_THRESHOLD = 0.50


def load_ground_truth(image_path: Path) -> list[dict]:
    label_path = LABEL_DIR / f"{image_path.stem}.txt"

    if not label_path.exists():
        return []

    ground_truth = []

    for line in label_path.read_text().splitlines():
        parts = line.split()
        if len(parts) != 5:
            continue

        class_id = int(parts[0])
        x_center, y_center, width, height = map(float, parts[1:])

        ground_truth.append({
            "class_code": ID2CODE.get(class_id, "UNK"),
            "x_center": x_center,
            "y_center": y_center,
            "width": width,
            "height": height,
        })

    return ground_truth


def box_iou(a: dict, b: dict) -> float:
    ax1 = a["x_center"] - a["width"] / 2
    ay1 = a["y_center"] - a["height"] / 2
    ax2 = a["x_center"] + a["width"] / 2
    ay2 = a["y_center"] + a["height"] / 2

    bx1 = b["x_center"] - b["width"] / 2
    by1 = b["y_center"] - b["height"] / 2
    bx2 = b["x_center"] + b["width"] / 2
    by2 = b["y_center"] + b["height"] / 2

    ix1, iy1 = max(ax1, bx1), max(ay1, by1)
    ix2, iy2 = min(ax2, bx2), min(ay2, by2)

    intersection = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)
    area_a = max(0.0, ax2 - ax1) * max(0.0, ay2 - ay1)
    area_b = max(0.0, bx2 - bx1) * max(0.0, by2 - by1)
    union = area_a + area_b - intersection

    return intersection / union if union > 0 else 0.0


def evaluate_detections(predictions: list[dict], ground_truth: list[dict]) -> dict:
    # Greedy one-to-one matching: same class and IoU >= threshold.
    candidates = []

    for pred_index, pred in enumerate(predictions):
        for gt_index, gt in enumerate(ground_truth):
            if pred.get("class_code") != gt["class_code"]:
                continue

            iou = box_iou(pred, gt)

            if iou >= IOU_THRESHOLD:
                candidates.append((iou, pred_index, gt_index))

    candidates.sort(reverse=True)

    matched_predictions = set()
    matched_ground_truth = set()

    for _, pred_index, gt_index in candidates:
        if pred_index in matched_predictions or gt_index in matched_ground_truth:
            continue

        matched_predictions.add(pred_index)
        matched_ground_truth.add(gt_index)

    tp = len(matched_predictions)
    fp = len(predictions) - tp
    fn = len(ground_truth) - tp

    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = (
        2 * precision * recall / (precision + recall)
        if precision + recall
        else 0.0
    )

    return {
        "TP": tp,
        "FP": fp,
        "FN": fn,
        "Precision": precision,
        "Recall": recall,
        "F1": f1,
    }


def run_evaluation():
    methods = {
        "Full 640": "baseline_640",
        "Full 960": "baseline_960",
        "ROI 640": "roi_640",
        "Combined": "combined",
    }

    image_rows = []
    totals = {
        method: {"TP": 0, "FP": 0, "FN": 0}
        for method in methods
    }

    out_dir = BASE_DIR / "results" / "predictions" / "comparison"
    out_dir.mkdir(parents=True, exist_ok=True)

    for image_path in EVAL_IMAGES:
        if not image_path.exists():
            print(f"[SKIP] Image not found: {image_path}")
            continue

        label_path = LABEL_DIR / f"{image_path.stem}.txt"

        if not label_path.exists():
            print(f"[SKIP] No ground-truth label file for {image_path.name}")
            continue

        ground_truth = load_ground_truth(image_path)

        result = compare_image_inference(
            image_path,
            conf=0.25,
            output_dir=out_dir,
        )

        for method, result_key in methods.items():
            predictions = result[result_key]["detections"]
            metrics = evaluate_detections(predictions, ground_truth)

            for key in ("TP", "FP", "FN"):
                totals[method][key] += metrics[key]

            image_rows.append({
                "Image": image_path.name,
                "Method": method,
                "Ground Truth Boxes": len(ground_truth),
                "Predictions": len(predictions),
                **metrics,
            })

    if not image_rows:
        print("No labeled images were evaluated. Check image and label paths.")
        return

    report_dir = BASE_DIR / "results" / "metrics"
    report_dir.mkdir(parents=True, exist_ok=True)

    detail_df = pd.DataFrame(image_rows)
    detail_path = report_dir / "roi_detection_metrics_by_image.csv"
    detail_df.to_csv(detail_path, index=False)

    summary_rows = []

    for method, counts in totals.items():
        tp, fp, fn = counts["TP"], counts["FP"], counts["FN"]

        precision = tp / (tp + fp) if tp + fp else 0.0
        recall = tp / (tp + fn) if tp + fn else 0.0
        f1 = (
            2 * precision * recall / (precision + recall)
            if precision + recall
            else 0.0
        )

        summary_rows.append({
            "Method": method,
            "TP": tp,
            "FP": fp,
            "FN": fn,
            "Precision": round(precision, 4),
            "Recall": round(recall, 4),
            "F1": round(f1, 4),
        })

    summary_df = pd.DataFrame(summary_rows)
    summary_path = report_dir / "roi_detection_metrics_summary.csv"
    summary_df.to_csv(summary_path, index=False)

    print("\nPER-IMAGE RESULTS")
    print(detail_df.to_string(index=False))

    print("\nAGGREGATE RESULTS")
    print(summary_df.to_string(index=False))

    print(f"\nDetailed metrics: {detail_path}")
    print(f"Summary metrics:  {summary_path}")
    print(f"Annotated images: {out_dir}")
    print(
        "\nNote: metrics are meaningful only where labels accurately represent "
        "the image. India_000045.jpg is excluded if its matching validation "
        "label file is missing."
    )


if __name__ == "__main__":
    run_evaluation()
