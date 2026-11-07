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
from pathlib import Path

# Base directory anchor (resolves to RoadWise repository root)
BASE_DIR = Path(__file__).resolve().parents[2]

# Active trained model checkpoint path (YOLOv8s fine-tuned on RDD2022/India)
DEFAULT_MODEL = BASE_DIR / "models" / "best.pt"

# Optimal confidence threshold calibrated for the fine-tuned roadwise_v2 model.
# Set to 0.15 to ensure subtle pavement fissures and shadowed pothole cavities are captured.
DEFAULT_CONF = 0.15

# Standard inference canvas dimension (640x640). Configurable up to 1920 in pipeline.
DEFAULT_IMGSZ = 640

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
    "D00": "Longitudinal Crack",
    "D10": "Transverse Crack",
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


def detect(image_path, conf=DEFAULT_CONF, model_path=DEFAULT_MODEL, imgsz=DEFAULT_IMGSZ):
    """
    Execute full YOLOv8 detection pipeline on a single image file.

    WHAT IT DOES:
    -------------
    Loads the cached neural network, processes the image at the requested canvas size,
    extracts bounding boxes, and draws visual annotations.

    PARAMETERS:
    -----------
    image_path : str or Path
        Path to input photo (JPG, PNG, WebP).
    conf : float, optional
        Confidence threshold below which candidate boxes are discarded (default: 0.15).
    model_path : str or Path, optional
        Custom model weights path if evaluating alternative checkpoints.
    imgsz : int, optional
        Inference resolution in pixels (default: 640).

    RETURNS:
    --------
    tuple:
        (detections: list[dict], annotated_bgr: numpy.ndarray)
        - detections: standardized dicts for database and condition scoring.
        - annotated_bgr: OpenCV BGR image matrix with bounding boxes and labels drawn.
    """
    # Defensive parameter sanitization: ensure image resolution is a positive integer
    try:
        imgsz = int(imgsz)
    except (TypeError, ValueError):
        imgsz = DEFAULT_IMGSZ
    if imgsz <= 0:
        imgsz = DEFAULT_IMGSZ

    # Retrieve pre-loaded YOLO model from cache (avoids repeated 2-3s disk reads)
    model = load_model(model_path)

    # Run forward inference:
    # 1. Letterbox resize: Pads and resizes input image to square canvas (e.g. 640x640) while preserving aspect ratio.
    # 2. Color conversion: Converts OpenCV BGR channels to RGB tensor format normalized to [0.0, 1.0].
    # 3. Model forward pass: Convolutions and feature pyramid network compute box coordinates and class logits.
    # 4. Non-Maximum Suppression (NMS): Filters overlapping candidate boxes based on IoU threshold.
    result = model.predict(
        source=str(image_path),
        conf=conf,
        imgsz=imgsz,
        verbose=False
    )[0]

    # Return structured metadata and rendered visualization:
    # - results_to_detections: formats normalized dicts for DB and health_score.py
    # - result.plot(): utilizes OpenCV to render high-contrast bounding boxes, labels, and confidence overlays (BGR format)
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
