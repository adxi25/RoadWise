"""
05_evaluate.py — Compare baseline vs fine-tuned candidate.

Usage (with ground-truth labels):
  python 05_evaluate.py \
      --baseline_model   /path/to/models/best.pt \
      --candidate_model  /path/to/runs/roadwise_600_finetune/weights/best.pt \
      --dataset_yaml     /path/to/datasets/roadwise_pothole/dataset.yaml \
      --split            test \
      --output_dir       results/comparison

Usage (no labels — qualitative only):
  python 05_evaluate.py \
      --baseline_model   /path/to/models/best.pt \
      --candidate_model  /path/to/runs/roadwise_600_finetune/weights/best.pt \
      --image_dir        /path/to/Pothole_Image_Data \
      --output_dir       results/comparison

The script never fabricates metrics. If no ground truth is available,
only inference statistics are reported.
"""

import argparse
import csv
import json
import logging
import time
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("evaluate")

ROADWISE_CLASSES = {0: "D00", 1: "D10", 2: "D20", 3: "D40"}
CLASS_COLORS = {0: (83, 168, 52), 1: (4, 188, 251), 2: (53, 67, 234), 3: (244, 133, 66)}
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}

BASELINE_METRICS = {
    "precision": 0.5056,
    "recall": 0.3856,
    "mAP50": 0.3744,
    "mAP50_95": 0.1591,
    "dataset": "India validation set (original RoadWise)",
}


def run_yolo_val(model_path: Path, dataset_yaml: Path, split: str, imgsz: int, conf: float):
    """Run ultralytics YOLO val and return metrics dict."""
    from ultralytics import YOLO
    model = YOLO(str(model_path))
    metrics = model.val(
        data=str(dataset_yaml),
        split=split,
        imgsz=imgsz,
        conf=conf,
        iou=0.50,
        plots=True,
        verbose=True,
    )
    result = {
        "precision": round(float(metrics.box.mp), 4),
        "recall":    round(float(metrics.box.mr), 4),
        "mAP50":     round(float(metrics.box.map50), 4),
        "mAP50_95":  round(float(metrics.box.map), 4),
    }
    try:
        per_class_ap = [round(float(v), 4) for v in metrics.box.ap50]
        per_class_recall = [round(float(v), 4) for v in metrics.box.r]
        result["per_class_ap50"] = {
            ROADWISE_CLASSES.get(i, str(i)): v for i, v in enumerate(per_class_ap)
        }
        result["per_class_recall"] = {
            ROADWISE_CLASSES.get(i, str(i)): v for i, v in enumerate(per_class_recall)
        }
    except Exception:
        pass
    return result


def run_qualitative(model_path: Path, images: list, imgsz: int, conf: float,
                    ann_dir: Path, model_label: str) -> list:
    """No labels — collect inference stats only."""
    import cv2
    from ultralytics import YOLO

    model = YOLO(str(model_path))
    rows = []
    for img_path in images:
        t0 = time.perf_counter()
        results = model.predict(source=str(img_path), conf=conf, imgsz=imgsz, verbose=False)
        elapsed_ms = (time.perf_counter() - t0) * 1000

        img_bgr = cv2.imread(str(img_path))
        if img_bgr is None:
            continue

        if results and results[0].boxes is not None:
            for box in results[0].boxes:
                cid = int(box.cls[0].item())
                c = float(box.conf[0].item())
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                cls_name = ROADWISE_CLASSES.get(cid, f"class_{cid}")
                color = CLASS_COLORS.get(cid, (128, 128, 128))
                cv2.rectangle(img_bgr, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
                label = f"{cls_name} {c:.2f}"
                cv2.putText(img_bgr, label, (int(x1), max(int(y1)-6, 12)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,255,255), 1, cv2.LINE_AA)
                rows.append({
                    "filename": img_path.name, "model": model_label,
                    "class_id": cid, "class_name": cls_name,
                    "confidence": round(c, 4),
                    "x1": round(x1,2), "y1": round(y1,2),
                    "x2": round(x2,2), "y2": round(y2,2),
                    "inference_ms": round(elapsed_ms, 2),
                })
            cv2.imwrite(str(ann_dir / f"{model_label}_{img_path.name}"), img_bgr)
        else:
            rows.append({
                "filename": img_path.name, "model": model_label,
                "class_id": -1, "class_name": "no_detection", "confidence": 0,
                "x1": 0, "y1": 0, "x2": 0, "y2": 0,
                "inference_ms": round(elapsed_ms, 2),
            })
    return rows


def print_comparison_table(baseline_m, candidate_m):
    """Print a neat Markdown comparison table."""
    rows = [
        ("Precision",  baseline_m.get("precision", "N/A"), candidate_m.get("precision", "N/A")),
        ("Recall",     baseline_m.get("recall",    "N/A"), candidate_m.get("recall",    "N/A")),
        ("mAP@50",     baseline_m.get("mAP50",     "N/A"), candidate_m.get("mAP50",     "N/A")),
        ("mAP@50-95",  baseline_m.get("mAP50_95",  "N/A"), candidate_m.get("mAP50_95",  "N/A")),
    ]
    print("\n| Metric      | Baseline | Fine-tuned |")
    print("|-------------|----------|------------|")
    for metric, bval, cval in rows:
        def fmt(v):
            return f"{v:.4f}" if isinstance(v, float) else str(v)
        delta = ""
        if isinstance(bval, float) and isinstance(cval, float):
            d = cval - bval
            delta = f"  ({'+' if d>=0 else ''}{d:.4f})"
        print(f"| {metric:<11} | {fmt(bval):<8} | {fmt(cval):<10}{delta}|")
    print()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline_model",  required=True)
    parser.add_argument("--candidate_model", required=True)
    parser.add_argument("--dataset_yaml", default=None,
                        help="YOLO dataset YAML (for ground-truth eval).")
    parser.add_argument("--split", default="test",
                        help="Dataset split to evaluate on (train/val/test).")
    parser.add_argument("--image_dir", default=None,
                        help="Image directory for qualitative eval (no labels).")
    parser.add_argument("--output_dir", default="results/comparison")
    parser.add_argument("--conf", type=float, default=0.25)
    parser.add_argument("--imgsz", type=int, default=640)
    args = parser.parse_args()

    baseline  = Path(args.baseline_model)
    candidate = Path(args.candidate_model)
    output_dir = Path(args.output_dir)
    ann_dir = output_dir / "annotated"
    ann_dir.mkdir(parents=True, exist_ok=True)

    report = {
        "baseline_model": str(baseline),
        "candidate_model": str(candidate),
        "confidence": args.conf,
        "image_size": args.imgsz,
        "baseline_metrics": None,
        "candidate_metrics": None,
        "historical_baseline_metrics": BASELINE_METRICS,
        "recommendation": "",
    }

    if args.dataset_yaml and Path(args.dataset_yaml).exists():
        # ── Ground-truth evaluation ───────────────────────────────────────────
        log.info("Running ground-truth evaluation on split='%s'", args.split)
        log.info("Evaluating BASELINE…")
        baseline_m = run_yolo_val(baseline, Path(args.dataset_yaml), args.split, args.imgsz, args.conf)
        report["baseline_metrics"] = baseline_m

        log.info("Evaluating CANDIDATE…")
        candidate_m = run_yolo_val(candidate, Path(args.dataset_yaml), args.split, args.imgsz, args.conf)
        report["candidate_metrics"] = candidate_m

        print_comparison_table(baseline_m, candidate_m)

        # ── Acceptance criteria ───────────────────────────────────────────────
        map_improved = candidate_m.get("mAP50", 0) > baseline_m.get("mAP50", 0)
        recall_improved = candidate_m.get("recall", 0) > baseline_m.get("recall", 0)
        recommendation = []
        if map_improved and recall_improved:
            recommendation.append("RECOMMEND fine-tuned candidate — both mAP and recall improved.")
        elif map_improved and not recall_improved:
            recommendation.append(
                "CAUTION — mAP improved but recall dropped.  "
                "Check per-class recall; false negatives may have increased."
            )
        elif not map_improved:
            recommendation.append(
                "RETAIN BASELINE — fine-tuned candidate did not outperform baseline on held-out test set."
            )
        report["recommendation"] = " ".join(recommendation)
        log.info("RECOMMENDATION: %s", report["recommendation"])

    elif args.image_dir and Path(args.image_dir).exists():
        # ── Qualitative evaluation (no labels) ────────────────────────────────
        log.warning("No dataset YAML provided — running QUALITATIVE evaluation only.")
        log.warning("Precision/recall/mAP CANNOT be computed without ground-truth annotations.")
        images = sorted([p for p in Path(args.image_dir).rglob("*")
                         if p.suffix.lower() in IMAGE_EXTS])[:100]  # cap at 100

        log.info("Evaluating BASELINE on %d images…", len(images))
        baseline_rows = run_qualitative(baseline, images, args.imgsz, args.conf, ann_dir, "baseline")

        log.info("Evaluating CANDIDATE on %d images…", len(images))
        candidate_rows = run_qualitative(candidate, images, args.imgsz, args.conf, ann_dir, "candidate")

        all_rows = baseline_rows + candidate_rows
        csv_path = output_dir / "qualitative_comparison.csv"
        if all_rows:
            with open(csv_path, "w", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=all_rows[0].keys())
                writer.writeheader()
                writer.writerows(all_rows)
        log.info("Qualitative CSV: %s", csv_path)
        report["note"] = (
            "Ground-truth labels not available — only detection counts reported.  "
            "Do not compare these numbers to precision/recall metrics."
        )
    else:
        log.error("Provide --dataset_yaml (ground-truth) or --image_dir (qualitative).")
        return

    json_path = output_dir / "comparison_report.json"
    with open(json_path, "w") as f:
        json.dump(report, f, indent=2)
    log.info("Comparison report: %s", json_path)


if __name__ == "__main__":
    main()
