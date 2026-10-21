"""
02_baseline_inference.py — Run the baseline model on the new images.

Usage:
  python 02_baseline_inference.py \
      --model_path /path/to/models/best.pt \
      --image_dir  /path/to/Pothole_Image_Data \
      --output_dir results/baseline_inference \
      --conf 0.25

Outputs:
  - Annotated images saved to output_dir/annotated/
  - CSV summary: output_dir/predictions.csv
  - JSON report: output_dir/inference_report.json
"""

import argparse
import csv
import json
import logging
import time
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("baseline_inference")

ROADWISE_CLASSES = {0: "D00", 1: "D10", 2: "D20", 3: "D40"}
CLASS_COLORS = {   # BGR
    0: (83, 168, 52),
    1: (4, 188, 251),
    2: (53, 67, 234),
    3: (244, 133, 66),
}
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def draw_boxes(img, boxes_data):
    """Draw bounding boxes with labels on a BGR numpy image."""
    import cv2
    for det in boxes_data:
        cid = det["class_id"]
        label = f"{det['class_name']} {det['confidence']:.2f}"
        x1, y1, x2, y2 = int(det["x1"]), int(det["y1"]), int(det["x2"]), int(det["y2"])
        color = CLASS_COLORS.get(cid, (128, 128, 128))
        cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
        (tw, th), base = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        ty = max(y1 - 6, th + 6)
        cv2.rectangle(img, (x1, ty - th - base - 2), (x1 + tw + 6, ty + 2), color, -1)
        cv2.putText(img, label, (x1 + 3, ty - base), cv2.FONT_HERSHEY_SIMPLEX, 0.5,
                    (255, 255, 255), 1, cv2.LINE_AA)
    return img


def verify_class_mapping(model):
    """Log and return the verified class mapping from the checkpoint."""
    try:
        ckpt_classes = model.names
        log.info("Checkpoint class names: %s", ckpt_classes)
        for cid, canonical in ROADWISE_CLASSES.items():
            ckpt_name = ckpt_classes.get(cid, "MISSING")
            match = "✓" if canonical in ckpt_name or ckpt_name == canonical else "≠"
            log.info("  Class %d: checkpoint='%s'  canonical='%s'  %s",
                     cid, ckpt_name, canonical, match)
        return ckpt_classes
    except Exception as exc:
        log.warning("Could not read model.names: %s — using canonical fallback.", exc)
        return ROADWISE_CLASSES


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model_path", required=True)
    parser.add_argument("--image_dir",  required=True)
    parser.add_argument("--output_dir", default="results/baseline_inference")
    parser.add_argument("--conf",  type=float, default=0.25)
    parser.add_argument("--imgsz", type=int,   default=640)
    args = parser.parse_args()

    model_path = Path(args.model_path)
    image_dir  = Path(args.image_dir)
    output_dir = Path(args.output_dir)

    if not model_path.exists():
        log.error("Model not found: %s", model_path)
        raise SystemExit(1)
    if not image_dir.exists():
        log.error("Image directory not found: %s", image_dir)
        raise SystemExit(1)

    ann_dir = output_dir / "annotated"
    ann_dir.mkdir(parents=True, exist_ok=True)

    # ── Load model ────────────────────────────────────────────────────────────
    log.info("Loading model: %s", model_path)
    from ultralytics import YOLO
    model = YOLO(str(model_path))
    ckpt_classes = verify_class_mapping(model)

    # ── Collect images ────────────────────────────────────────────────────────
    images = sorted([p for p in image_dir.rglob("*") if p.suffix.lower() in IMAGE_EXTS])
    log.info("Found %d images in %s", len(images), image_dir)

    # ── Run inference ─────────────────────────────────────────────────────────
    csv_rows = []
    class_totals = {cid: 0 for cid in ROADWISE_CLASSES}
    images_with_detections = 0
    total_inference_ms = 0.0

    import cv2
    import numpy as np

    for i, img_path in enumerate(images, 1):
        log.info("[%d/%d] %s", i, len(images), img_path.name)

        img_bgr = cv2.imread(str(img_path))
        if img_bgr is None:
            log.warning("  Cannot read image: %s", img_path)
            continue

        t0 = time.perf_counter()
        results = model.predict(source=str(img_path), conf=args.conf, imgsz=args.imgsz, verbose=False)
        elapsed_ms = (time.perf_counter() - t0) * 1000
        total_inference_ms += elapsed_ms

        boxes_data = []
        if results and results[0].boxes is not None:
            for box in results[0].boxes:
                cid = int(box.cls[0].item())
                conf = float(box.conf[0].item())
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                cls_name = ROADWISE_CLASSES.get(cid, f"class_{cid}")
                class_totals[cid] = class_totals.get(cid, 0) + 1
                boxes_data.append({
                    "class_id": cid, "class_name": cls_name, "confidence": conf,
                    "x1": x1, "y1": y1, "x2": x2, "y2": y2,
                })
                csv_rows.append({
                    "filename": img_path.name,
                    "model": "baseline",
                    "class_id": cid,
                    "class_name": cls_name,
                    "confidence": round(conf, 4),
                    "x1": round(x1, 2), "y1": round(y1, 2),
                    "x2": round(x2, 2), "y2": round(y2, 2),
                    "inference_ms": round(elapsed_ms, 2),
                })

        if boxes_data:
            images_with_detections += 1
        else:
            csv_rows.append({
                "filename": img_path.name, "model": "baseline",
                "class_id": -1, "class_name": "no_detection", "confidence": 0,
                "x1": 0, "y1": 0, "x2": 0, "y2": 0,
                "inference_ms": round(elapsed_ms, 2),
            })

        ann = draw_boxes(img_bgr.copy(), boxes_data)
        cv2.imwrite(str(ann_dir / img_path.name), ann)

    # ── Write CSV ─────────────────────────────────────────────────────────────
    csv_path = output_dir / "predictions.csv"
    if csv_rows:
        with open(csv_path, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=csv_rows[0].keys())
            writer.writeheader()
            writer.writerows(csv_rows)

    # ── Write report ──────────────────────────────────────────────────────────
    report = {
        "model_path": str(model_path),
        "image_dir": str(image_dir),
        "confidence_threshold": args.conf,
        "image_size": args.imgsz,
        "total_images": len(images),
        "images_with_detections": images_with_detections,
        "images_without_detections": len(images) - images_with_detections,
        "total_detections": sum(class_totals.values()),
        "class_distribution": {ROADWISE_CLASSES.get(k, str(k)): v for k, v in class_totals.items()},
        "avg_inference_ms": round(total_inference_ms / max(len(images), 1), 2),
        "checkpoint_class_names": {str(k): v for k, v in ckpt_classes.items()},
        "note": (
            "No ground-truth annotations found in this dataset — "
            "precision/recall/mAP cannot be computed.  "
            "Results above are qualitative inference counts only."
        ),
    }

    json_path = output_dir / "inference_report.json"
    with open(json_path, "w") as f:
        json.dump(report, f, indent=2)

    log.info("─" * 60)
    log.info("BASELINE INFERENCE COMPLETE")
    log.info("  Images processed:   %d", len(images))
    log.info("  With detections:    %d", images_with_detections)
    log.info("  Total detections:   %d", sum(class_totals.values()))
    for cid, cnt in sorted(class_totals.items()):
        log.info("    %-6s  %d", ROADWISE_CLASSES.get(cid, str(cid)), cnt)
    log.info("  Avg inference time: %.1f ms", report["avg_inference_ms"])
    log.info("  Annotated images:   %s", ann_dir)
    log.info("  CSV:                %s", csv_path)
    log.info("  JSON report:        %s", json_path)
    log.info("─" * 60)
    log.info("NOTE: %s", report["note"])


if __name__ == "__main__":
    main()
