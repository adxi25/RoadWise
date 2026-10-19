"""
RoadWise - Experimental Road Region-of-Interest (ROI) Detection

Purpose:
    Provide an experimental road-focused detection mode that focuses image
    resolution on the road surface (particularly near-to-mid road areas)
    while keeping the standard full-image inference as the verified baseline.

Design & Assumptions:
    1. Road Scene Geometry:
       In typical vehicle dashcam and handheld road inspection photography,
       the upper 30-40% of the frame consists of sky, trees, buildings, and
       the distant horizon where pavement defects do not occur.
       Focusing inference on the road band [ymin=0.35, ymax=1.00] provides higher
       effective pixel density per road defect without changing model weights.

    2. Defensive Bottom Handling:
       Vehicle hoods/dashboards sometimes intrude in the lowest 5-10% of
       dashcam images. The ROI supports an optional bottom cutoff (e.g. ymax=0.95),
       but does not assume all images contain dashboards.

    3. Exact Coordinate Transformation:
       Detections made on the crop are converted back to full-image normalized
       coordinates:
           x_full = xmin + x_crop * (xmax - xmin)
           y_full = ymin + y_crop * (ymax - ymin)
           w_full = w_crop * (xmax - xmin)
           h_full = h_crop * (ymax - ymin)

    4. Duplicate Prevention (IoU Deduplication):
       When combining full-image and ROI detections, duplicate detections of the
       same defect are suppressed via Non-Maximum Suppression (IoU >= 0.45).

    5. Non-Destructive / Experimental:
       Full-image inference remains the production default. ROI inference is
       opt-in and evaluated side-by-side.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any, Sequence

import cv2
import numpy as np
from PIL import Image

BASE_DIR = Path(__file__).resolve().parents[2]
SRC_DIR = BASE_DIR / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

DEFAULT_MODEL = BASE_DIR / "models" / "best.pt"
DEFAULT_CONF = 0.25
DEFAULT_IMGSZ = 640

CLASS_CODE = {
    "longitudinal_crack": "D00",
    "transverse_crack": "D10",
    "alligator_crack": "D20",
    "pothole": "D40",
}

# Default defensible road crop: skip top 35% (sky/horizon), keep down to road base
DEFAULT_ROI = {
    "ymin": 0.35,
    "xmin": 0.0,
    "ymax": 1.0,
    "xmax": 1.0,
}

# Color palette for classes (BGR for OpenCV)
CLASS_COLORS = {
    "D40": (34, 34, 225),    # Crimson / Red for Pothole
    "D20": (20, 100, 230),   # Amber-Orange for Alligator Crack
    "D10": (20, 180, 240),   # Amber-Yellow for Transverse Crack
    "D00": (120, 180, 20),   # Forest-Green/Teal for Longitudinal Crack
    "UNK": (150, 150, 150),
}


def load_model(model_path=DEFAULT_MODEL):
    """Reuse cached YOLO model from predict.py."""
    from detection.predict import load_model as _load_model
    return _load_model(model_path)


def transform_box_to_full(box_crop: dict[str, Any], roi: dict[str, float]) -> dict[str, Any]:
    """
    Transform a crop-normalized bounding box back into full-image normalized coordinates.

    Parameters:
        box_crop: dict containing x_center, y_center, width, height (0-1 relative to crop)
        roi: dict with xmin, ymin, xmax, ymax (0-1 relative to full image)
    """
    roi_w = roi["xmax"] - roi["xmin"]
    roi_h = roi["ymax"] - roi["ymin"]

    full_box = dict(box_crop)
    full_box["x_center"] = round(roi["xmin"] + box_crop["x_center"] * roi_w, 5)
    full_box["y_center"] = round(roi["ymin"] + box_crop["y_center"] * roi_h, 5)
    full_box["width"] = round(box_crop["width"] * roi_w, 5)
    full_box["height"] = round(box_crop["height"] * roi_h, 5)
    return full_box


def calculate_iou(boxA: dict[str, Any], boxB: dict[str, Any]) -> float:
    """
    Compute Intersection over Union (IoU) between two boxes in normalized (x_center, y_center, w, h).
    """
    ax1 = boxA["x_center"] - boxA["width"] / 2.0
    ay1 = boxA["y_center"] - boxA["height"] / 2.0
    ax2 = boxA["x_center"] + boxA["width"] / 2.0
    ay2 = boxA["y_center"] + boxA["height"] / 2.0

    bx1 = boxB["x_center"] - boxB["width"] / 2.0
    by1 = boxB["y_center"] - boxB["height"] / 2.0
    bx2 = boxB["x_center"] + boxB["width"] / 2.0
    by2 = boxB["y_center"] + boxB["height"] / 2.0

    inter_x1 = max(ax1, bx1)
    inter_y1 = max(ay1, by1)
    inter_x2 = min(ax2, bx2)
    inter_y2 = min(ay2, by2)

    inter_w = max(0.0, inter_x2 - inter_x1)
    inter_h = max(0.0, inter_y2 - inter_y1)
    inter_area = inter_w * inter_h

    area_a = boxA["width"] * boxA["height"]
    area_b = boxB["width"] * boxB["height"]
    union_area = area_a + area_b - inter_area

    if union_area <= 0:
        return 0.0
    return inter_area / union_area


def deduplicate_detections(detections: list[dict[str, Any]], iou_threshold: float = 0.45) -> list[dict[str, Any]]:
    """
    Perform Non-Maximum Suppression (NMS) on a list of detections of the same or compatible classes.
    Preserves highest confidence detection when IoU exceeds iou_threshold.
    """
    if not detections:
        return []

    # Sort descending by confidence
    sorted_dets = sorted(detections, key=lambda d: d.get("confidence", 0.0), reverse=True)
    kept: list[dict[str, Any]] = []

    for det in sorted_dets:
        overlap = False
        for k in kept:
            # Check overlap if same class or high general overlap
            if det["class_code"] == k["class_code"] or det.get("class_name") == k.get("class_name"):
                if calculate_iou(det, k) >= iou_threshold:
                    overlap = True
                    break
        if not overlap:
            kept.append(det)

    return kept


def draw_detections_on_image(
    image_bgr: np.ndarray,
    detections: list[dict[str, Any]],
    roi: dict[str, float] | None = None,
    title: str = "",
) -> np.ndarray:
    """
    Draw transformed bounding boxes and optional ROI guide rectangle onto the full image.
    """
    annotated = image_bgr.copy()
    img_h, img_w = annotated.shape[:2]

    # Draw ROI guide border if specified
    if roi:
        rx1 = int(roi["xmin"] * img_w)
        ry1 = int(roi["ymin"] * img_h)
        rx2 = int(roi["xmax"] * img_w)
        ry2 = int(roi["ymax"] * img_h)
        cv2.rectangle(annotated, (rx1, ry1), (rx2, ry2), (180, 180, 180), 1, cv2.LINE_AA)
        cv2.putText(
            annotated,
            "ROI Search Area",
            (rx1 + 6, ry1 + 18),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (180, 180, 180),
            1,
            cv2.LINE_AA,
        )

    # Draw detection boxes
    for det in detections:
        color = CLASS_COLORS.get(det["class_code"], (0, 255, 255))
        xc = det["x_center"] * img_w
        yc = det["y_center"] * img_h
        w = det["width"] * img_w
        h = det["height"] * img_h

        x1 = max(0, int(xc - w / 2.0))
        y1 = max(0, int(yc - h / 2.0))
        x2 = min(img_w - 1, int(xc + w / 2.0))
        y2 = min(img_h - 1, int(yc + h / 2.0))

        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2, cv2.LINE_AA)

        source_tag = f" [{det['source']}]" if "source" in det else ""
        label = f"{det['class_code']} {det['confidence']:.2f}{source_tag}"

        # Label background
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.45
        thickness = 1
        (label_w, label_h), baseline = cv2.getTextSize(label, font, font_scale, thickness)
        label_y1 = max(0, y1 - label_h - 4)
        cv2.rectangle(annotated, (x1, label_y1), (x1 + label_w + 4, label_y1 + label_h + 4), color, -1)
        cv2.putText(annotated, label, (x1 + 2, label_y1 + label_h + 1), font, font_scale, (255, 255, 255), thickness, cv2.LINE_AA)

    # Title header
    if title:
        cv2.putText(
            annotated,
            f"{title} (Detections: {len(detections)})",
            (12, 28),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2,
            cv2.LINE_AA,
        )
        cv2.putText(
            annotated,
            f"{title} (Detections: {len(detections)})",
            (12, 28),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (20, 20, 20),
            1,
            cv2.LINE_AA,
        )

    return annotated


def detect_roi(
    image_path: str | Path,
    conf: float = DEFAULT_CONF,
    model_path: str | Path = DEFAULT_MODEL,
    imgsz: int = DEFAULT_IMGSZ,
    roi: dict[str, float] | None = None,
) -> tuple[list[dict[str, Any]], np.ndarray]:
    """
    Run YOLO detection on the specified Road Region of Interest (ROI) and project
    bounding boxes back to full-image coordinates.

    Returns:
        (detections_transformed, annotated_full_image)
    """
    from detection.predict import results_to_detections

    image_path = Path(image_path)
    if not image_path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    roi = roi or DEFAULT_ROI
    img_bgr = cv2.imread(str(image_path))
    if img_bgr is None:
        raise ValueError(f"Could not read image: {image_path}")

    h, w = img_bgr.shape[:2]
    ymin_px = int(roi["ymin"] * h)
    ymax_px = int(roi["ymax"] * h)
    xmin_px = int(roi["xmin"] * w)
    xmax_px = int(roi["xmax"] * w)

    # Extract crop
    crop_bgr = img_bgr[ymin_px:ymax_px, xmin_px:xmax_px]
    if crop_bgr.size == 0:
        raise ValueError(f"Invalid ROI crop bounds: {roi}")

    # Predict on crop
    model = load_model(model_path)
    result = model.predict(
        source=crop_bgr,
        conf=conf,
        imgsz=imgsz,
        verbose=False,
    )[0]

    raw_crop_dets = results_to_detections(result)

    # Transform to full coordinates and mark source
    transformed_dets = []
    for d in raw_crop_dets:
        td = transform_box_to_full(d, roi)
        td["source"] = "ROI"
        transformed_dets.append(td)

    annotated = draw_detections_on_image(img_bgr, transformed_dets, roi=roi, title="Road-Focused ROI Inference")
    return transformed_dets, annotated


def compare_image_inference(
    image_path: str | Path,
    conf: float = DEFAULT_CONF,
    model_path: str | Path = DEFAULT_MODEL,
    imgsz: int = DEFAULT_IMGSZ,
    roi: dict[str, float] | None = None,
    output_dir: str | Path | None = None,
) -> dict[str, Any]:
    """
    Run side-by-side comparison between:
      1. Baseline full-image inference at 640px
      2. Baseline full-image inference at larger size (e.g. 960px)
      3. Experimental road-focused ROI inference at 640px
      4. Combined deduplicated inference (Full + ROI)

    Returns comprehensive report and saves annotated comparisons.
    """
    from detection.predict import detect as baseline_detect

    image_path = Path(image_path)
    img_bgr = cv2.imread(str(image_path))
    if img_bgr is None:
        raise ValueError(f"Failed to read image at: {image_path}")

    # 1. Full-image baseline at 640
    base_640_dets, _ = baseline_detect(image_path, conf=conf, model_path=model_path, imgsz=640)
    for d in base_640_dets:
        d["source"] = "Full640"
    ann_base_640 = draw_detections_on_image(img_bgr, base_640_dets, title="Baseline Full Image (640px)")

    # 2. Full-image baseline at 960
    base_960_dets, _ = baseline_detect(image_path, conf=conf, model_path=model_path, imgsz=960)
    for d in base_960_dets:
        d["source"] = "Full960"
    ann_base_960 = draw_detections_on_image(img_bgr, base_960_dets, title="Baseline Full Image (960px)")

    # 3. Experimental ROI at 640
    roi_dets, ann_roi = detect_roi(image_path, conf=conf, model_path=model_path, imgsz=640, roi=roi)

    # 4. Combined (Full 640 + ROI with IoU deduplication)
    combined_raw = base_640_dets + roi_dets
    combined_deduped = deduplicate_detections(combined_raw, iou_threshold=0.45)
    ann_combined = draw_detections_on_image(img_bgr, combined_deduped, roi=roi or DEFAULT_ROI, title="Combined Deduplicated (Full+ROI)")

    # Save comparison images if output directory provided
    saved_paths = {}
    if output_dir:
        out_dir = Path(output_dir)
        out_dir.mkdir(parents=True, exist_ok=True)
        stem = image_path.stem

        p_base640 = out_dir / f"{stem}_baseline_640.jpg"
        p_base960 = out_dir / f"{stem}_baseline_960.jpg"
        p_roi = out_dir / f"{stem}_roi_640.jpg"
        p_comb = out_dir / f"{stem}_combined.jpg"

        cv2.imwrite(str(p_base640), ann_base_640)
        cv2.imwrite(str(p_base960), ann_base_960)
        cv2.imwrite(str(p_roi), ann_roi)
        cv2.imwrite(str(p_comb), ann_combined)

        saved_paths = {
            "baseline_640": str(p_base640),
            "baseline_960": str(p_base960),
            "roi_640": str(p_roi),
            "combined": str(p_comb),
        }

    return {
        "image": image_path.name,
        "baseline_640": {
            "count": len(base_640_dets),
            "detections": base_640_dets,
        },
        "baseline_960": {
            "count": len(base_960_dets),
            "detections": base_960_dets,
        },
        "roi_640": {
            "count": len(roi_dets),
            "detections": roi_dets,
        },
        "combined": {
            "count": len(combined_deduped),
            "detections": combined_deduped,
        },
        "saved_paths": saved_paths,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate Baseline vs Road-Focused ROI Detection.")
    parser.add_argument("--image", required=True, help="Path to input road image.")
    parser.add_argument("--conf", type=float, default=DEFAULT_CONF, help="Confidence threshold.")
    parser.add_argument("--imgsz", type=int, default=DEFAULT_IMGSZ, help="Inference resolution.")
    parser.add_argument("--out-dir", default=str(BASE_DIR / "results" / "predictions" / "comparison"), help="Output directory for annotated comparisons.")
    args = parser.parse_args()

    res = compare_image_inference(
        image_path=args.image,
        conf=args.conf,
        imgsz=args.imgsz,
        output_dir=args.out_dir,
    )

    print("\n" + "=" * 65)
    print(f"ROADWISE INFERENCE COMPARISON: {res['image']}")
    print("=" * 65)
    print(f"1. Baseline Full Image (640px) : {res['baseline_640']['count']} detections")
    for d in res['baseline_640']['detections']:
        print(f"   - {d['class_code']} ({d['class_name']}) conf={d['confidence']:.2f} box=({d['width']:.2f}x{d['height']:.2f})")

    print(f"\n2. Baseline Full Image (960px) : {res['baseline_960']['count']} detections")
    for d in res['baseline_960']['detections']:
        print(f"   - {d['class_code']} ({d['class_name']}) conf={d['confidence']:.2f} box=({d['width']:.2f}x{d['height']:.2f})")

    print(f"\n3. Road-Focused ROI (640px)   : {res['roi_640']['count']} detections")
    for d in res['roi_640']['detections']:
        print(f"   - {d['class_code']} ({d['class_name']}) conf={d['confidence']:.2f} box=({d['width']:.2f}x{d['height']:.2f})")

    print(f"\n4. Combined Deduplicated       : {res['combined']['count']} detections")
    for d in res['combined']['detections']:
        src = d.get('source', '')
        print(f"   - {d['class_code']} ({d['class_name']}) conf={d['confidence']:.2f} from {src}")

    print("\nSaved annotated comparisons to:")
    for k, p in res["saved_paths"].items():
        print(f"   {k:<14}: {p}")
    print("=" * 65)
