"""
RoadWise - Inference and Model Prediction Adapter (Mode 1 & Batch Inference)

MODULE RESPONSIBILITY:
----------------------
This module acts as the isolated object detection inference layer for the RoadWise application.
It wraps Ultralytics YOLOv8 to:
  1. Load and cache the trained PyTorch checkpoint (models/best.pt).
  2. Execute computer vision inference on incoming road surface imagery.
  3. Map arbitrary raw class outputs (D-codes or historical English names) into
     canonical RoadWise defect representations ({D00, D10, D20, D40}).
  4. Format bounding boxes into normalized relative coordinates (0.0 to 1.0)
     ready for ingestion by SQLite and the condition scoring engine.

CALLED BY:
----------
- src/pipeline/inspection_pipeline.py (during Mode 1 citizen/inspector uploads)
- src/detection/batch_detect.py (during offline/evaluation runs)
- api/main.py (health check endpoint tests model loadability)

DATA FLOW:
----------
Input:  image file path (str or Path), confidence threshold (float), image size (int)
Output: Tuple:
        - List of detection dicts: [{class_code, class_name, confidence, x_center, y_center, width, height}, ...]
        - Annotated BGR OpenCV image numpy array (result.plot())
"""
import argparse
import os
from pathlib import Path

# Ensure Ultralytics operates offline without hanging on telemetry or update network checks
os.environ.setdefault("YOLO_OFFLINE", "True")
os.environ.setdefault("ULTRALYTICS_SETTINGS_SYNC", "False")

# Base directory anchor (resolves to RoadWise repository root)
BASE_DIR = Path(__file__).resolve().parents[2]

# Dual-Model Architecture Paths:
# 1. Pothole Specialist: Fine-tuned YOLOv8s on RDD2022/India (detects D40 Potholes at high confidence)
POTHOLE_MODEL = BASE_DIR / "models" / "pothole_best.pt"
# Backward-compatibility fallback if pothole_best.pt is referenced as best.pt
if not POTHOLE_MODEL.exists() and (BASE_DIR / "models" / "best.pt").exists():
    POTHOLE_MODEL = BASE_DIR / "models" / "best.pt"

# 2. Crack Specialist: Experiment C 2-Class YOLOv8s (detects D00 Linear & D20 Alligator Cracks)
CRACK_MODEL = BASE_DIR / "models" / "experiment_c_best.pt"

# Active default model reference
DEFAULT_MODEL = POTHOLE_MODEL

# Optimal confidence threshold calibrated for the fine-tuned roadwise_v2 model.
# Set to 0.10 to ensure subtle pavement fissures and shadowed pothole cavities are captured.
DEFAULT_CONF = 0.10

# Default inference canvas dimension: 0 indicates Multi-Scale Feature Fusion (640px + 1280px NMS).
DEFAULT_IMGSZ = 0

# Canonical Class Code Normalization Mapping:
# Handles both newer model output names (D00, D10, etc.) and legacy English labels.
CLASS_CODE = {
    # New fine-tuned model class names (RDD D-codes)
    "D00": "D00",
    "D10": "D10",
    "D20": "D20",
    "D40": "D40",
    # Legacy model class names (English) — retained for backward compatibility
    "longitudinal_crack": "D00",
    "transverse_crack": "D10",
    "alligator_crack": "D20",
    "pothole": "D40",
}

# Human-readable labels mapped to canonical D-codes for UI badges and database reports
CLASS_LABEL = {
    "D00": "Linear Crack",
    "D10": "Linear Crack (Transverse)",
    "D20": "Alligator Crack",
    "D40": "Pothole",
}

# Global in-memory model cache dictionary {str(model_path): YOLO_instance}.
# Ensures the heavy PyTorch weights are loaded into GPU/CPU memory once and reused across API calls.
_model_cache = {}


def load_model(model_path=DEFAULT_MODEL):
    """
    Load and cache the YOLOv8 model instance.

    WHY IT IS REQUIRED:
    -------------------
    Loading a PyTorch neural network checkpoint from disk takes 1.5–3.0 seconds and consumes
    significant memory. Caching the model object ensures subsequent inference requests
    execute in low latency (30–80ms).

    HOW IT WORKS:
    -------------
    1. Checks if string representation of `model_path` exists in the `_model_cache` dict.
    2. If missing, verifies file existence, imports `ultralytics.YOLO`, and instantiates it.
    3. Returns the memoized model instance.

    PARAMETERS:
    -----------
    model_path : str or Path
        Filesystem path to the .pt checkpoint. Defaults to `models/best.pt`.

    RETURNS:
    --------
    ultralytics.YOLO: The initialized, runnable YOLO object detector.
    """
    from ultralytics import YOLO  # Lazy import to keep module import overhead minimal

    # Normalize model path to a string key for dictionary memoization lookup
    key = str(model_path)

    # Cache lookup: check if model has already been deserialized into memory
    if key not in _model_cache:
        # Defensive check: ensure checkpoint file physically exists on disk before invoking PyTorch
        if not Path(model_path).exists():
            raise FileNotFoundError(f"Model file not found: {model_path}")

        # Instantiate Ultralytics YOLO class:
        # Under the hood, this loads the PyTorch state_dict, instantiates the YOLOv8s architecture,
        # sets the weights to evaluation mode (eval()), and prepares tensor memory on available compute device.
        _model_cache[key] = YOLO(str(model_path))

    return _model_cache[key]


def results_to_detections(result):
    """
    Transform raw Ultralytics Results tensor boxes into structured RoadWise detection dicts.

    WHY IT IS REQUIRED:
    -------------------
    Ultralytics outputs raw PyTorch tensors containing pixel coordinates and integer class IDs.
    The downstream scoring engine and SQLite database require normalized (0.0 to 1.0)
    relative coordinates, standard float confidences, and canonical D-code strings.

    HOW IT WORKS:
    -------------
    Iterates over detected boxes using `xywhn` (normalized x_center, y_center, width, height):
    - `cls`: class index converted to string label via `result.names`.
    - `conf`: detection confidence probability (0.0 to 1.0).
    - `xywhn`: normalized geometry independent of actual image resolution.

    PARAMETERS:
    -----------
    result : ultralytics.engine.results.Results
        The raw inference container returned by YOLO.predict()[0].

    RETURNS:
    --------
    list[dict]: List of detection dictionaries formatted for database insertion and scoring:
        {
            "class_code": str,      # e.g., 'D40'
            "class_name": str,      # e.g., 'Pothole'
            "confidence": float,    # e.g., 0.8924
            "x_center": float,      # 0.0 to 1.0
            "y_center": float,      # 0.0 to 1.0
            "width": float,         # relative box width
            "height": float         # relative box height
        }
    """
    detections = []

    # Extract class dictionary from model results (e.g. {0: 'D00', 1: 'D10', 2: 'D20', 3: 'D40'})
    names = result.names

    # result.boxes contains bounding box tensors filtered by confidence and NMS.
    # Convert GPU/CPU tensors to native Python lists for rapid zero-overhead iteration:
    # - result.boxes.cls: tensor of detected class indices
    # - result.boxes.conf: tensor of confidence probabilities [0.0, 1.0]
    # - result.boxes.xywhn: tensor of normalized coordinates [x_center, y_center, width, height]
    for cls, conf, xywhn in zip(result.boxes.cls.tolist(),
                                result.boxes.conf.tolist(),
                                result.boxes.xywhn.tolist()):
        # Map integer class index to raw model class name string
        name = names[int(cls)]

        # Standardize name to canonical D-code (e.g., 'pothole' -> 'D40', 'D40' -> 'D40')
        code = CLASS_CODE.get(name, "UNK")

        # Build normalized detection object:
        # Bounding boxes are stored as floats rounded to 5 decimal places.
        # At 1080p, 0.00001 represents ~0.019 pixels, providing sub-pixel coordinate precision.
        detections.append({
            "class_code": code,
            "class_name": CLASS_LABEL.get(code, name),
            "confidence": round(float(conf), 4),
            "x_center": round(xywhn[0], 5),
            "y_center": round(xywhn[1], 5),
            "width": round(xywhn[2], 5),
            "height": round(xywhn[3], 5),
        })

    return detections


def draw_annotations(image_path, detections):
    """
    Renders high-contrast bounding boxes, labels, and confidence tags onto the source image.
    Uses distinct color coding per civil distress type:
      - D40 (Pothole): Bright Red/Crimson
      - D20 (Alligator Crack): Amber / Orange
      - D00 (Linear Crack): Bright Cyan
      - D10 (Transverse Crack): Cyan
    """
    import cv2
    img = cv2.imread(str(image_path))
    if img is None:
        return None

    h, w = img.shape[:2]

    # Color palette (BGR format for OpenCV)
    colors = {
        "D40": (34, 34, 220),   # Red / Crimson for Potholes
        "D20": (0, 140, 255),   # Amber / Orange for Alligator Cracks
        "D00": (220, 200, 0),   # Cyan for Linear / Longitudinal Cracks
        "D10": (200, 180, 0),   # Cyan for Transverse Cracks
    }

    for d in detections:
        code = d.get("class_code", "UNK")
        color = colors.get(code, (0, 255, 0))

        # Denormalize coordinates to pixel values
        xc, yc = d["x_center"] * w, d["y_center"] * h
        bw, bh = d["width"] * w, d["height"] * h
        x1 = max(0, int(xc - bw / 2))
        y1 = max(0, int(yc - bh / 2))
        x2 = min(w - 1, int(xc + bw / 2))
        y2 = min(h - 1, int(yc + bh / 2))

        # Draw primary bounding rectangle
        cv2.rectangle(img, (x1, y1), (x2, y2), color, thickness=2)

        # Draw label header
        label = f"{d.get('class_name', code)} {d.get('confidence', 0.0):.2f}"
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = max(0.42, min(0.65, w / 1100))
        (tw, th), _ = cv2.getTextSize(label, font, font_scale, 1)

        # Draw filled background pill for readability
        tag_y1 = max(0, y1 - th - 8)
        tag_x2 = min(w - 1, x1 + tw + 8)
        cv2.rectangle(img, (x1, tag_y1), (tag_x2, y1), color, -1)

        # White text for dark tags, black for light tags
        text_color = (255, 255, 255) if code in ("D40", "D20") else (0, 0, 0)
        cv2.putText(
            img, label, (x1 + 4, y1 - 4), font, font_scale, text_color, 1, cv2.LINE_AA
        )

    return img


def box_iou(b1, b2):
    """Compute Intersection-over-Union between two normalized bounding boxes [xmin, ymin, xmax, ymax]."""
    x1 = max(b1[0], b2[0])
    y1 = max(b1[1], b2[1])
    x2 = min(b1[2], b2[2])
    y2 = min(b1[3], b2[3])
    inter = max(0.0, x2 - x1) * max(0.0, y2 - y1)
    a1 = (b1[2] - b1[0]) * (b1[3] - b1[1])
    a2 = (b2[2] - b2[0]) * (b2[3] - b2[1])
    union = a1 + a2 - inter
    return inter / union if union > 0 else 0.0


def fuse_multi_scale_detections(dets_640, dets_1280, iou_thresh=0.45):
    """
    Fuse detections from 640px and 1280px passes using Non-Maximum Suppression (NMS).
    Filters micro-clutter from 1280px while preserving fine linear crack fissures.
    """
    filtered_1280 = []
    for d in dets_1280:
        area = d["width"] * d["height"]
        is_linear = d.get("class_code") in ("D00", "D10")
        # Keep if significant area OR if it's a linear crack (hairline fissure)
        if area >= 0.005 or is_linear:
            filtered_1280.append(d)

    combined = sorted(
        dets_640 + filtered_1280,
        key=lambda x: x.get("confidence", 0.0),
        reverse=True,
    )
    kept = []
    for d in combined:
        box_d = [
            d["x_center"] - d["width"] / 2.0,
            d["y_center"] - d["height"] / 2.0,
            d["x_center"] + d["width"] / 2.0,
            d["y_center"] + d["height"] / 2.0,
        ]
        suppressed = False
        for k in kept:
            box_k = [
                k["x_center"] - k["width"] / 2.0,
                k["y_center"] - k["height"] / 2.0,
                k["x_center"] + k["width"] / 2.0,
                k["y_center"] + k["height"] / 2.0,
            ]
            if box_iou(box_d, box_k) > iou_thresh:
                suppressed = True
                break
        if not suppressed:
            kept.append(d)
    return kept


def detect(image_path, conf=DEFAULT_CONF, model_path=None, imgsz=DEFAULT_IMGSZ):
    """
    Execute full YOLOv8 detection pipeline on a single image file.

    DUAL-MODEL ARCHITECTURE:
    ------------------------
    When `model_path is None` (or 'dual'), RoadWise runs two specialized models:
      1. Pothole Specialist (`models/pothole_best.pt`): Detects D40 Potholes
      2. Crack Specialist (`models/experiment_c_best.pt`): Detects D00 & D20 Cracks
    The detections are seamlessly merged and drawn with distinct colors.

    MULTI-SCALE FUSION MODE:
    ------------------------
    When `imgsz == 0` (or 'fusion'), executes multi-scale inference across 640px
    and 1280px canvases and fuses predictions via NMS.

    SINGLE-MODEL FALLBACK:
    ----------------------
    If a specific `model_path` is passed, runs that model exclusively (backward compatible).
    """
    # Defensive parameter sanitization: check for multi-scale fusion request (imgsz == 0)
    is_fusion = False
    try:
        val = int(imgsz)
        if val == 0:
            is_fusion = True
        else:
            imgsz = val if val > 0 else DEFAULT_IMGSZ
    except (TypeError, ValueError):
        if str(imgsz).lower() in ("0", "fusion", "auto"):
            is_fusion = True
        else:
            imgsz = DEFAULT_IMGSZ

    if is_fusion:
        dets_640, _ = detect(image_path, conf=conf, model_path=model_path, imgsz=640)
        dets_1280, _ = detect(image_path, conf=conf, model_path=model_path, imgsz=1280)
        fused_dets = fuse_multi_scale_detections(dets_640, dets_1280)
        annotated_bgr = draw_annotations(image_path, fused_dets)
        return fused_dets, annotated_bgr

    # Determine execution mode: Dual-Model vs. Single-Model
    is_dual_mode = (
        model_path is None
        or str(model_path).lower() in ("dual", "default")
        or Path(model_path).resolve() == Path(POTHOLE_MODEL).resolve()
        or Path(model_path).resolve() == Path(DEFAULT_MODEL).resolve()
    )

    if is_dual_mode and CRACK_MODEL.exists():
        # ----------------------------------------------------
        # 1. Pothole Specialist Model (RDD2022 Fine-tuned)
        # ----------------------------------------------------
        p_path = POTHOLE_MODEL if POTHOLE_MODEL.exists() else (BASE_DIR / "models" / "best.pt")
        pothole_model = load_model(p_path)
        p_res = pothole_model.predict(
            source=str(image_path),
            conf=conf,
            imgsz=imgsz,
            verbose=False
        )[0]
        # Pothole model only contributes Potholes (D40)
        pothole_dets = [
            d for d in results_to_detections(p_res) if d.get("class_code") == "D40"
        ]

        # ----------------------------------------------------
        # 2. Crack Specialist Model (Experiment C 2-Class)
        # ----------------------------------------------------
        crack_model = load_model(CRACK_MODEL)
        c_res = crack_model.predict(
            source=str(image_path),
            conf=conf,
            imgsz=imgsz,
            verbose=False
        )[0]
        # Crack model contributes D00 (Linear) and D20 (Alligator)
        crack_dets = results_to_detections(c_res)

        # Merge detections from both specialist heads
        all_detections = pothole_dets + crack_dets

        # Render unified OpenCV visualization with distinct color badges
        annotated_bgr = draw_annotations(image_path, all_detections)
        if annotated_bgr is None:
            annotated_bgr = p_res.plot()

        return all_detections, annotated_bgr

    # Single-model fallback
    target_path = model_path if model_path is not None else DEFAULT_MODEL
    model = load_model(target_path)
    result = model.predict(
        source=str(image_path),
        conf=conf,
        imgsz=imgsz,
        verbose=False
    )[0]
    return results_to_detections(result), result.plot()


def save_annotated(annotated, out_path):
    """
    Save an annotated OpenCV BGR numpy image array to disk.
    Creates parent directories automatically if they do not exist.
    """
    import cv2
    out_path = Path(out_path)

    # Ensure destination directory structure exists before writing
    out_path.parent.mkdir(parents=True, exist_ok=True)

    # cv2.imwrite expects BGR array ordering (native output from result.plot()) and writes encoded image file
    cv2.imwrite(str(out_path), annotated)
    return out_path


if __name__ == "__main__":
    # Command line interface for testing prediction directly:
    # python src/detection/predict.py --image data/test_images/India_000045.jpg --conf 0.15
    ap = argparse.ArgumentParser(description="RoadWise YOLOv8 Inference CLI")
    ap.add_argument("--image", required=True, help="Path to input road photo")
    ap.add_argument("--conf", type=float, default=DEFAULT_CONF, help="Detection confidence threshold")
    ap.add_argument("--model", default=str(DEFAULT_MODEL), help="Path to model weights checkpoint")
    ap.add_argument("--imgsz", type=int, default=640, help="Inference image resolution")
    a = ap.parse_args()

    dets, annotated = detect(
        a.image, conf=a.conf, model_path=a.model, imgsz=a.imgsz
    )
    out = BASE_DIR / "results" / "predictions" / f"{Path(a.image).stem}_annotated.jpg"
    save_annotated(annotated, out)

    print(f"Detections found: {len(dets)}")
    for d in dets:
        print(f"  {d['class_code']} {d['class_name']:<20} conf={d['confidence']:.2f} "
              f"box(w,h)=({d['width']:.2f},{d['height']:.2f})")
    print(f"Annotated image saved to: {out}")
