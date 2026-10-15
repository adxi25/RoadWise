"""
RoadWise - inference with the trained YOLO model (best.pt).

Used by Mode 1: photo in -> detections out, in the same format the database expects.

Test from the RoadWise folder:
    python src/detection/predict.py --image path/to/photo.jpg

Output:
  - prints the detections
  - saves the annotated image to results/predictions/<name>_annotated.jpg
"""
import argparse
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
DEFAULT_MODEL = BASE_DIR / "models" / "best.pt"
DEFAULT_CONF = 0.25

CLASS_CODE = {
    "longitudinal_crack": "D00",
    "transverse_crack": "D10",
    "alligator_crack": "D20",
    "pothole": "D40",
}

_model_cache = {}


def load_model(model_path=DEFAULT_MODEL):
    """Load the YOLO model once and reuse it."""
    from ultralytics import YOLO  # imported here so other modules can import this file cheaply
    key = str(model_path)
    if key not in _model_cache:
        if not Path(model_path).exists():
            raise FileNotFoundError(f"Model file not found: {model_path}")
        _model_cache[key] = YOLO(str(model_path))
    return _model_cache[key]


def results_to_detections(result):
    """Convert one ultralytics result into a list of dicts (database format).
    Box values are normalised 0-1 relative to the image (not physical size)."""
    detections = []
    names = result.names
    for cls, conf, xywhn in zip(result.boxes.cls.tolist(),
                                result.boxes.conf.tolist(),
                                result.boxes.xywhn.tolist()):
        name = names[int(cls)]
        detections.append({
            "class_code": CLASS_CODE.get(name, "UNK"),
            "class_name": name,
            "confidence": round(float(conf), 4),
            "x_center": round(xywhn[0], 5),
            "y_center": round(xywhn[1], 5),
            "width": round(xywhn[2], 5),
            "height": round(xywhn[3], 5),
        })
    return detections


def detect(image_path, conf=DEFAULT_CONF, model_path=DEFAULT_MODEL):
    """Run the model on one image.

    Returns:
        detections: list of dicts (class_code, class_name, confidence, x_center, y_center, width, height)
        annotated:  image array (BGR) with boxes drawn, or None
    """
    model = load_model(model_path)
    result = model.predict(source=str(image_path), conf=conf, imgsz=640, verbose=False)[0]
    return results_to_detections(result), result.plot()


def save_annotated(annotated, out_path):
    import cv2
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(out_path), annotated)
    return out_path


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--image", required=True)
    ap.add_argument("--conf", type=float, default=DEFAULT_CONF)
    ap.add_argument("--model", default=str(DEFAULT_MODEL))
    a = ap.parse_args()

    dets, annotated = detect(a.image, conf=a.conf, model_path=a.model)
    out = BASE_DIR / "results" / "predictions" / f"{Path(a.image).stem}_annotated.jpg"
    save_annotated(annotated, out)

    print(f"Detections found: {len(dets)}")
    for d in dets:
        print(f"  {d['class_code']} {d['class_name']:<20} conf={d['confidence']:.2f} "
              f"box(w,h)=({d['width']:.2f},{d['height']:.2f})")
    print(f"Annotated image saved to: {out}")
