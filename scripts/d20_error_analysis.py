"""
RoadWise Experiment A — D20 Alligator Crack Error Analysis Workflow
===================================================================

This module implements a rigorous, evidence-based error analysis of D20 (alligator crack)
detections on the held-out Experiment A test dataset (522 images, 919 ground-truth objects).

Features:
- Mandatory pre-inference verification gates:
  * Checkpoint existence & validation (rejects invalid/unverified checkpoints)
  * Test split image count assertion (exactly 522 images)
  * Ground-truth label count assertion (exactly 919 boxes: D00=240, D10=318, D20=361)
- Model inference at imgsz=640 across multiple confidence thresholds (0.10, 0.25, 0.50)
- Class-aware 1-to-1 greedy IoU bipartite matching (IoU thresholds: 0.50 and 0.75)
- Error categorization:
  * True Positives (TP)
  * False Negatives (FN: missed detections)
  * False Positives (FP: spurious detections)
  * Cross-class Confusion (D20 ground truth matched with D00 or D10 predictions)
  * Low-confidence detections
- Object size & aspect ratio analysis:
  * Small (< 32^2 px), Medium (32^2 to 96^2 px), Large (> 96^2 px)
  * Aspect ratio (w / h) distribution
  * Crowdedness / instance density per image
- Visual error gallery generation with color-coded bounding boxes:
  * Green: Ground Truth
  * Red / Orange / Cyan: Predicted classes with confidence scores
"""

import os
import sys
import json
import argparse
from datetime import datetime
from collections import defaultdict, Counter
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# Class mappings for RoadWise Experiment A (3-class)
CLASS_NAMES = {
    0: "longitudinal_crack",  # D00
    1: "transverse_crack",    # D10
    2: "alligator_crack"      # D20
}

CLASS_SHORT = {
    0: "D00",
    1: "D10",
    2: "D20"
}

# Color palette for visualizations (RGBA / RGB tuples)
COLORS = {
    "gt": (0, 200, 0),         # Green for ground truth
    "d00_pred": (30, 144, 255), # Deep Sky Blue for D00 prediction
    "d10_pred": (255, 165, 0),  # Orange for D10 prediction
    "d20_pred": (220, 20, 60),  # Crimson Red for D20 prediction
}


def box_iou_xyxy(box1, box2):
    """
    Computes Intersection over Union (IoU) between two bounding boxes in xyxy format.
    box: [x1, y1, x2, y2]
    """
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])

    inter_w = max(0.0, x2 - x1)
    inter_h = max(0.0, y2 - y1)
    inter_area = inter_w * inter_h

    area1 = max(0.0, box1[2] - box1[0]) * max(0.0, box1[3] - box1[1])
    area2 = max(0.0, box2[2] - box2[0]) * max(0.0, box2[3] - box2[1])
    union_area = area1 + area2 - inter_area

    if union_area <= 0.0:
        return 0.0
    return inter_area / union_area


def yolo_to_xyxy(box_yolo, img_w, img_h):
    """Converts normalized YOLO [xc, yc, w, h] to pixel [x1, y1, x2, y2]."""
    xc, yc, w, h = box_yolo
    x1 = (xc - w / 2.0) * img_w
    y1 = (yc - h / 2.0) * img_h
    x2 = (xc + w / 2.0) * img_w
    y2 = (yc + h / 2.0) * img_h
    return [max(0.0, x1), max(0.0, y1), min(float(img_w), x2), min(float(img_h), y2)]


def load_ground_truth(test_lbl_dir, test_img_dir):
    """
    Loads all ground truth annotations for the test dataset.
    Returns: dict mapping image_filename -> list of dicts {class_id, box_yolo, box_xyxy, img_w, img_h}
    """
    gt_data = {}
    label_files = [f for f in os.listdir(test_lbl_dir) if f.endswith('.txt')]

    for lf in sorted(label_files):
        stem = os.path.splitext(lf)[0]
        # Locate corresponding image file (.jpg or .png)
        img_file = None
        for ext in ['.jpg', '.jpeg', '.png', '.JPG']:
            candidate = os.path.join(test_img_dir, stem + ext)
            if os.path.exists(candidate):
                img_file = stem + ext
                break

        if img_file is None:
            raise FileNotFoundError(f"Missing image file for label: {lf}")

        img_path = os.path.join(test_img_dir, img_file)
        with Image.open(img_path) as img:
            img_w, img_h = img.size

        boxes = []
        with open(os.path.join(test_lbl_dir, lf), 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                parts = line.split()
                cls_id = int(parts[0])
                box_yolo = [float(p) for p in parts[1:5]]
                box_xyxy = yolo_to_xyxy(box_yolo, img_w, img_h)
                area_px = (box_xyxy[2] - box_xyxy[0]) * (box_xyxy[3] - box_xyxy[1])
                boxes.append({
                    "class_id": cls_id,
                    "class_name": CLASS_NAMES.get(cls_id, f"class_{cls_id}"),
                    "class_short": CLASS_SHORT.get(cls_id, f"C{cls_id}"),
                    "box_yolo": box_yolo,
                    "box_xyxy": box_xyxy,
                    "area_px": area_px,
                    "aspect_ratio": (box_xyxy[2] - box_xyxy[0]) / max(1.0, (box_xyxy[3] - box_xyxy[1])),
                    "img_w": img_w,
                    "img_h": img_h
                })

        gt_data[img_file] = boxes

    return gt_data


def verify_test_dataset(test_img_dir, test_lbl_dir):
    """
    Mandatory Gate: verifies test dataset integrity.
    Expected: exactly 522 test images and exactly 919 ground-truth objects (D00=240, D10=318, D20=361).
    """
    img_files = [f for f in os.listdir(test_img_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    lbl_files = [f for f in os.listdir(test_lbl_dir) if f.endswith('.txt')]

    if len(img_files) != 522:
        raise ValueError(f"GATE FAILURE: Expected 522 test images, found {len(img_files)} in {test_img_dir}")
    if len(lbl_files) != 522:
        raise ValueError(f"GATE FAILURE: Expected 522 test labels, found {len(lbl_files)} in {test_lbl_dir}")

    gt_data = load_ground_truth(test_lbl_dir, test_img_dir)
    total_boxes = sum(len(b) for b in gt_data.values())
    counts = Counter(b["class_id"] for boxes in gt_data.values() for b in boxes)

    if total_boxes != 919:
        raise ValueError(f"GATE FAILURE: Expected 919 total ground-truth boxes, counted {total_boxes}")
    if counts[0] != 240:
        raise ValueError(f"GATE FAILURE: Expected 240 D00 instances, counted {counts[0]}")
    if counts[1] != 318:
        raise ValueError(f"GATE FAILURE: Expected 318 D10 instances, counted {counts[1]}")
    if counts[2] != 361:
        raise ValueError(f"GATE FAILURE: Expected 361 D20 instances, counted {counts[2]}")

    print(f"✅ Mandatory Dataset Gate Passed: 522 images, 919 instances (D00=240, D10=318, D20=361).")
    return gt_data


def run_inference(model, test_img_dir, conf_thresh=0.10, imgsz=640):
    """
    Runs YOLO inference on all test images.
    Returns: dict mapping img_file -> list of prediction dicts {class_id, conf, box_xyxy, box_yolo}
    """
    predictions = {}
    img_files = sorted([f for f in os.listdir(test_img_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])

    for img_file in img_files:
        img_path = os.path.join(test_img_dir, img_file)
        results = model.predict(source=img_path, conf=conf_thresh, imgsz=imgsz, verbose=False)
        pred_boxes = []

        if len(results) > 0 and results[0].boxes is not None:
            boxes_obj = results[0].boxes
            for i in range(len(boxes_obj)):
                cls_id = int(boxes_obj.cls[i].item())
                conf = float(boxes_obj.conf[i].item())
                xyxy = boxes_obj.xyxy[i].tolist()
                xywhn = boxes_obj.xywhn[i].tolist()
                pred_boxes.append({
                    "class_id": cls_id,
                    "class_name": CLASS_NAMES.get(cls_id, f"class_{cls_id}"),
                    "class_short": CLASS_SHORT.get(cls_id, f"C{cls_id}"),
                    "confidence": conf,
                    "box_xyxy": xyxy,
                    "box_yolo": xywhn
                })

        predictions[img_file] = pred_boxes

    return predictions


def match_predictions_to_gt(gt_boxes, pred_boxes, iou_thresh=0.50):
    """
    Performs one-to-one class-aware and cross-class bipartite matching between GT and predictions.
    
    Returns:
    - matches: list of (gt_idx, pred_idx, iou, is_class_match)
    - unmatched_gt: list of gt_idx (Missed / False Negatives)
    - unmatched_pred: list of pred_idx (Spurious / False Positives)
    """
    if len(gt_boxes) == 0:
        return [], [], list(range(len(pred_boxes)))
    if len(pred_boxes) == 0:
        return [], list(range(len(gt_boxes))), []

    # Compute full IoU matrix
    iou_matrix = np.zeros((len(gt_boxes), len(pred_boxes)), dtype=float)
    for g_idx, g in enumerate(gt_boxes):
        for p_idx, p in enumerate(pred_boxes):
            iou_matrix[g_idx, p_idx] = box_iou_xyxy(g["box_xyxy"], p["box_xyxy"])

    # Greedy 1-to-1 matching prioritizing class matches with highest IoU >= iou_thresh
    matched_gt = set()
    matched_pred = set()
    matches = []

    # Pass 1: True class matches (gt.class_id == pred.class_id) sorted by descending IoU
    candidate_pairs = []
    for g_idx in range(len(gt_boxes)):
        for p_idx in range(len(pred_boxes)):
            if iou_matrix[g_idx, p_idx] >= iou_thresh and gt_boxes[g_idx]["class_id"] == pred_boxes[p_idx]["class_id"]:
                candidate_pairs.append((iou_matrix[g_idx, p_idx], g_idx, p_idx, True))

    candidate_pairs.sort(key=lambda x: x[0], reverse=True)
    for iou, g_idx, p_idx, is_cls in candidate_pairs:
        if g_idx not in matched_gt and p_idx not in matched_pred:
            matched_gt.add(g_idx)
            matched_pred.add(p_idx)
            matches.append({
                "gt_idx": g_idx,
                "pred_idx": p_idx,
                "iou": iou,
                "is_class_match": True,
                "gt_class": gt_boxes[g_idx]["class_id"],
                "pred_class": pred_boxes[p_idx]["class_id"],
                "confidence": pred_boxes[p_idx]["confidence"]
            })

    # Pass 2: Cross-class confusion (gt.class_id != pred.class_id) for remaining unmatched objects with IoU >= iou_thresh
    cross_pairs = []
    for g_idx in range(len(gt_boxes)):
        if g_idx in matched_gt:
            continue
        for p_idx in range(len(pred_boxes)):
            if p_idx in matched_pred:
                continue
            if iou_matrix[g_idx, p_idx] >= iou_thresh:
                cross_pairs.append((iou_matrix[g_idx, p_idx], g_idx, p_idx, False))

    cross_pairs.sort(key=lambda x: x[0], reverse=True)
    for iou, g_idx, p_idx, is_cls in cross_pairs:
        if g_idx not in matched_gt and p_idx not in matched_pred:
            matched_gt.add(g_idx)
            matched_pred.add(p_idx)
            matches.append({
                "gt_idx": g_idx,
                "pred_idx": p_idx,
                "iou": iou,
                "is_class_match": False,
                "gt_class": gt_boxes[g_idx]["class_id"],
                "pred_class": pred_boxes[p_idx]["class_id"],
                "confidence": pred_boxes[p_idx]["confidence"]
            })

    unmatched_gt = [g_idx for g_idx in range(len(gt_boxes)) if g_idx not in matched_gt]
    unmatched_pred = [p_idx for p_idx in range(len(pred_boxes)) if p_idx not in matched_pred]

    return matches, unmatched_gt, unmatched_pred


def perform_full_matching_analysis(gt_data, predictions, conf_thresh=0.25, iou_thresh=0.50):
    """
    Performs comprehensive analysis over all 522 test images at the specified conf and IoU thresholds.
    """
    stats = {
        "conf_threshold": conf_thresh,
        "iou_threshold": iou_thresh,
        "per_class": {
            0: {"gt": 0, "tp": 0, "fn": 0, "fp": 0, "confused_as": Counter()},
            1: {"gt": 0, "tp": 0, "fn": 0, "fp": 0, "confused_as": Counter()},
            2: {"gt": 0, "tp": 0, "fn": 0, "fp": 0, "confused_as": Counter()}
        },
        "d20_details": {
            "total_gt": 0,
            "true_positives": 0,
            "false_negatives_total": 0,
            "missed_no_prediction": 0,
            "confused_as_d00": 0,
            "confused_as_d10": 0,
            "false_positives": 0,
            "d20_size_distribution": {"small": 0, "medium": 0, "large": 0},
            "d20_detected_sizes": {"small": 0, "medium": 0, "large": 0},
            "d20_missed_sizes": {"small": 0, "medium": 0, "large": 0},
        },
        "image_level": {}
    }

    # Count ground truth
    for img_file, boxes in gt_data.items():
        for b in boxes:
            stats["per_class"][b["class_id"]]["gt"] += 1
            if b["class_id"] == 2:
                stats["d20_details"]["total_gt"] += 1
                area = b["area_px"]
                if area < 32 * 32:
                    stats["d20_details"]["d20_size_distribution"]["small"] += 1
                elif area < 96 * 96:
                    stats["d20_details"]["d20_size_distribution"]["medium"] += 1
                else:
                    stats["d20_details"]["d20_size_distribution"]["large"] += 1

    # Process each image
    for img_file, gt_boxes in gt_data.items():
        raw_preds = predictions.get(img_file, [])
        # Filter by confidence
        filt_preds = [p for p in raw_preds if p["confidence"] >= conf_thresh]

        matches, unmatched_gt, unmatched_pred = match_predictions_to_gt(gt_boxes, filt_preds, iou_thresh=iou_thresh)

        # Record matched
        for m in matches:
            gt_cls = m["gt_class"]
            pred_cls = m["pred_class"]
            if m["is_class_match"]:
                stats["per_class"][gt_cls]["tp"] += 1
                if gt_cls == 2:
                    stats["d20_details"]["true_positives"] += 1
                    g_box = gt_boxes[m["gt_idx"]]
                    area = g_box["area_px"]
                    if area < 32 * 32:
                        stats["d20_details"]["d20_detected_sizes"]["small"] += 1
                    elif area < 96 * 96:
                        stats["d20_details"]["d20_detected_sizes"]["medium"] += 1
                    else:
                        stats["d20_details"]["d20_detected_sizes"]["large"] += 1
            else:
                # Class confusion
                stats["per_class"][gt_cls]["confused_as"][pred_cls] += 1
                stats["per_class"][gt_cls]["fn"] += 1
                stats["per_class"][pred_cls]["fp"] += 1
                if gt_cls == 2:
                    stats["d20_details"]["false_negatives_total"] += 1
                    if pred_cls == 0:
                        stats["d20_details"]["confused_as_d00"] += 1
                    elif pred_cls == 1:
                        stats["d20_details"]["confused_as_d10"] += 1

        # Record unmatched GT (pure misses)
        for g_idx in unmatched_gt:
            gt_cls = gt_boxes[g_idx]["class_id"]
            stats["per_class"][gt_cls]["fn"] += 1
            if gt_cls == 2:
                stats["d20_details"]["false_negatives_total"] += 1
                stats["d20_details"]["missed_no_prediction"] += 1
                area = gt_boxes[g_idx]["area_px"]
                if area < 32 * 32:
                    stats["d20_details"]["d20_missed_sizes"]["small"] += 1
                elif area < 96 * 96:
                    stats["d20_details"]["d20_missed_sizes"]["medium"] += 1
                else:
                    stats["d20_details"]["d20_missed_sizes"]["large"] += 1

        # Record unmatched predictions (pure false positives)
        for p_idx in unmatched_pred:
            pred_cls = filt_preds[p_idx]["class_id"]
            stats["per_class"][pred_cls]["fp"] += 1
            if pred_cls == 2:
                stats["d20_details"]["false_positives"] += 1

        stats["image_level"][img_file] = {
            "gt_count": len(gt_boxes),
            "pred_count": len(filt_preds),
            "matches": matches,
            "unmatched_gt": unmatched_gt,
            "unmatched_pred": unmatched_pred
        }

    return stats


def draw_visual_error_sample(img_path, gt_boxes, pred_boxes, output_path, title=""):
    """
    Renders an annotated image showing ground truth and predictions with distinct colors and labels.
    """
    with Image.open(img_path) as img:
        img_rgb = img.convert("RGB")
        draw = ImageDraw.Draw(img_rgb)
        w, h = img_rgb.size

        # Draw Ground Truth in Green (solid outline)
        for g in gt_boxes:
            b = g["box_xyxy"]
            draw.rectangle(b, outline=COLORS["gt"], width=3)
            lbl = f"GT: {g['class_short']}"
            draw.text((b[0] + 4, b[1] + 4), lbl, fill=COLORS["gt"])

        # Draw Predictions in respective colors (dashed or thicker outline)
        for p in pred_boxes:
            b = p["box_xyxy"]
            cls_id = p["class_id"]
            color = COLORS.get(f"{CLASS_SHORT[cls_id].lower()}_pred", (255, 255, 255))
            draw.rectangle(b, outline=color, width=2)
            lbl = f"{CLASS_SHORT[cls_id]} {p['confidence']:.2f}"
            draw.text((b[0] + 4, max(0, b[3] - 16)), lbl, fill=color)

        img_rgb.save(output_path, quality=90)


def generate_error_galleries(gt_data, predictions, out_dir, conf_thresh=0.25, iou_thresh=0.50):
    """
    Generates representative visual galleries for each error category.
    """
    cat_dirs = {
        "correct_d20": os.path.join(out_dir, "visuals", "correct_d20"),
        "missed_d20": os.path.join(out_dir, "visuals", "missed_d20"),
        "confused_d20_as_d00": os.path.join(out_dir, "visuals", "confused_d20_as_d00"),
        "confused_d20_as_d10": os.path.join(out_dir, "visuals", "confused_d20_as_d10"),
        "false_positive_d20": os.path.join(out_dir, "visuals", "false_positive_d20"),
        "low_conf_d20": os.path.join(out_dir, "visuals", "low_conf_d20")
    }
    for d in cat_dirs.values():
        os.makedirs(d, exist_ok=True)

    saved_counts = Counter()

    for img_file, gt_boxes in gt_data.items():
        preds = [p for p in predictions.get(img_file, []) if p["confidence"] >= conf_thresh]
        low_preds = [p for p in predictions.get(img_file, []) if 0.10 <= p["confidence"] < conf_thresh and p["class_id"] == 2]

        matches, unmatched_gt, unmatched_pred = match_predictions_to_gt(gt_boxes, preds, iou_thresh=iou_thresh)

        # 1. Correct D20
        d20_correct = [m for m in matches if m["is_class_match"] and m["gt_class"] == 2]
        if d20_correct and saved_counts["correct_d20"] < 8:
            out_p = os.path.join(cat_dirs["correct_d20"], img_file)
            draw_visual_error_sample(os.path.join("data/processed/crack_experiment_a_3class/test/images", img_file),
                                     gt_boxes, preds, out_p, "Correct D20 Detection")
            saved_counts["correct_d20"] += 1

        # 2. Missed D20 (Completely missed)
        d20_missed = [g_idx for g_idx in unmatched_gt if gt_boxes[g_idx]["class_id"] == 2]
        if d20_missed and saved_counts["missed_d20"] < 8:
            out_p = os.path.join(cat_dirs["missed_d20"], img_file)
            draw_visual_error_sample(os.path.join("data/processed/crack_experiment_a_3class/test/images", img_file),
                                     gt_boxes, preds, out_p, "Missed D20 Detection")
            saved_counts["missed_d20"] += 1

        # 3. Confused D20 as D00
        conf_d00 = [m for m in matches if not m["is_class_match"] and m["gt_class"] == 2 and m["pred_class"] == 0]
        if conf_d00 and saved_counts["confused_d20_as_d00"] < 8:
            out_p = os.path.join(cat_dirs["confused_d20_as_d00"], img_file)
            draw_visual_error_sample(os.path.join("data/processed/crack_experiment_a_3class/test/images", img_file),
                                     gt_boxes, preds, out_p, "D20 Confused with D00")
            saved_counts["confused_d20_as_d00"] += 1

        # 4. Confused D20 as D10
        conf_d10 = [m for m in matches if not m["is_class_match"] and m["gt_class"] == 2 and m["pred_class"] == 1]
        if conf_d10 and saved_counts["confused_d20_as_d10"] < 8:
            out_p = os.path.join(cat_dirs["confused_d20_as_d10"], img_file)
            draw_visual_error_sample(os.path.join("data/processed/crack_experiment_a_3class/test/images", img_file),
                                     gt_boxes, preds, out_p, "D20 Confused with D10")
            saved_counts["confused_d20_as_d10"] += 1

        # 5. False Positive D20
        fp_d20 = [p_idx for p_idx in unmatched_pred if preds[p_idx]["class_id"] == 2]
        if fp_d20 and saved_counts["false_positive_d20"] < 8:
            out_p = os.path.join(cat_dirs["false_positive_d20"], img_file)
            draw_visual_error_sample(os.path.join("data/processed/crack_experiment_a_3class/test/images", img_file),
                                     gt_boxes, preds, out_p, "False Positive D20")
            saved_counts["false_positive_d20"] += 1

        # 6. Low Confidence D20
        if low_preds and saved_counts["low_conf_d20"] < 8:
            out_p = os.path.join(cat_dirs["low_conf_d20"], img_file)
            draw_visual_error_sample(os.path.join("data/processed/crack_experiment_a_3class/test/images", img_file),
                                     gt_boxes, low_preds, out_p, "Low Confidence D20 Detection")
            saved_counts["low_conf_d20"] += 1

    print(f"✅ Generated representative error visuals: {dict(saved_counts)}")


def main():
    parser = argparse.ArgumentParser(description="RoadWise Experiment A D20 Error Analysis")
    parser.add_argument("--checkpoint", type=str, default="models/best.pt", help="Path to best.pt checkpoint")
    parser.add_argument("--test-images", type=str, default="data/processed/crack_experiment_a_3class/test/images")
    parser.add_argument("--test-labels", type=str, default="data/processed/crack_experiment_a_3class/test/labels")
    parser.add_argument("--output-dir", type=str, default="reports/training/d20_error_analysis")
    args = parser.parse_args()

    print("=" * 70)
    print("ROADWISE EXPERIMENT A — D20 ALLIGATOR CRACK ERROR ANALYSIS")
    print("=" * 70)

    # 1. Mandatory Gate Check: Dataset Integrity
    gt_data = verify_test_dataset(args.test_images, args.test_labels)

    # 2. Mandatory Gate Check: Checkpoint Existence & Provenance
    if not os.path.exists(args.checkpoint):
        print(f"\n❌ MANDATORY VERIFICATION GATE FAILURE: Checkpoint not found at: {args.checkpoint}")
        print("Under strict protocol: Execution halted. Do not substitute unverified checkpoints.")
        sys.exit(1)

    print(f"Loading checkpoint: {args.checkpoint}...")
    from ultralytics import YOLO
    model = YOLO(args.checkpoint)

    # 3. Run Inference across all 522 test images at low threshold to capture full confidence spectrum
    print("Running test-set inference (imgsz=640, conf=0.05)...")
    raw_predictions = run_inference(model, args.test_images, conf_thresh=0.05, imgsz=640)

    os.makedirs(args.output_dir, exist_ok=True)

    # Save raw predictions
    raw_pred_file = os.path.join(args.output_dir, "raw_test_predictions.json")
    with open(raw_pred_file, "w", encoding="utf-8") as f:
        json.dump(raw_predictions, f, indent=2)
    print(f"Saved raw predictions to: {raw_pred_file}")

    # 4. Multi-threshold sensitivity analysis (conf: 0.10, 0.25, 0.50 | IoU: 0.50, 0.75)
    multi_results = {}
    for conf in [0.10, 0.25, 0.50]:
        for iou in [0.50, 0.75]:
            tag = f"conf_{conf:.2f}_iou_{iou:.2f}"
            print(f"Evaluating {tag}...")
            res = perform_full_matching_analysis(gt_data, raw_predictions, conf_thresh=conf, iou_thresh=iou)
            multi_results[tag] = {
                "conf": conf,
                "iou": iou,
                "per_class": {k: {sk: (dict(sv) if isinstance(sv, Counter) else sv) for sk, sv in v.items()} for k, v in res["per_class"].items()},
                "d20_details": res["d20_details"]
            }

    multi_res_file = os.path.join(args.output_dir, "multi_threshold_matching_results.json")
    with open(multi_res_file, "w", encoding="utf-8") as f:
        json.dump(multi_results, f, indent=2)
    print(f"Saved multi-threshold analysis to: {multi_res_file}")

    # 5. Generate Visual Error Galleries at standard threshold (conf=0.25, iou=0.50)
    print("Generating visual error galleries...")
    generate_error_galleries(gt_data, raw_predictions, args.output_dir, conf_thresh=0.25, iou_thresh=0.50)

    print("\n✅ Error Analysis Workflow Completed Successfully.")


if __name__ == "__main__":
    main()

