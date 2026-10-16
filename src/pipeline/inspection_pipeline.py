"""
RoadWise - Mode 1 Inspection Pipeline

Complete pipeline:

    Uploaded image
        ↓
    Image validation
        ↓
    GPS extraction from EXIF (if available)
        ↓
    YOLO inference
        ↓
    Condition score
        ↓
    Risk score + priority
        ↓
    Recommendation + explanation
        ↓
    Save original + annotated image
        ↓
    Save complete inspection + detections to SQLite

The UI should call only `run_inspection()`.

Important:
- Scoring formulas remain project-defined.
- GPS is optional because many uploaded images will not contain EXIF GPS.
- Missing GPS does NOT stop an inspection.
- The database remains the source of truth for Mode 2.
"""

from __future__ import annotations

import io
import sys
import uuid
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Any

from PIL import Image, ImageOps


# ============================================================
# 1. PROJECT PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[2]
SRC_DIR = BASE_DIR / "src"

if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))


# ============================================================
# 2. ROADWISE MODULES
# ============================================================

from detection.predict import detect
from scoring.health_score import calculate_condition
from scoring.risk_score import analyze_risk

from database.database import (
    create_tables,
    save_inspection,
)


# ============================================================
# 3. STORAGE DIRECTORIES
# ============================================================

UPLOAD_DIR = BASE_DIR / "data" / "uploads"
ANNOTATED_DIR = BASE_DIR / "results" / "predictions"


# ============================================================
# 4. SUPPORTED IMAGE SETTINGS
# ============================================================

SUPPORTED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
}

MAX_IMAGE_SIZE_MB = 20

DEFAULT_CONFIDENCE = 0.25
DEFAULT_IMGSZ = 640


# ============================================================
# 5. BASIC VALIDATION HELPERS
# ============================================================

def validate_image_bytes(image_bytes: bytes) -> dict[str, Any]:
    """
    Validate an uploaded image before sending it to YOLO.

    Returns metadata about the image.

    Raises:
        ValueError: if the image is invalid or unsupported.
    """

    if not image_bytes:
        raise ValueError("The uploaded image is empty.")

    size_mb = len(image_bytes) / (1024 * 1024)

    if size_mb > MAX_IMAGE_SIZE_MB:
        raise ValueError(
            f"Image is too large ({size_mb:.1f} MB). "
            f"Maximum allowed size is {MAX_IMAGE_SIZE_MB} MB."
        )

    try:
        with Image.open(io.BytesIO(image_bytes)) as image:
            image.verify()

        # Re-open after verify because verify() invalidates the image object.
        with Image.open(io.BytesIO(image_bytes)) as image:
            width, height = image.size
            image_format = image.format
            mode = image.mode

    except Exception as exc:
        raise ValueError(
            "The uploaded file is not a valid image."
        ) from exc

    if width < 320 or height < 240:
        raise ValueError(
            f"Image resolution is too small ({width}x{height}). "
            "Please upload a clearer road image."
        )

    return {
        "width": width,
        "height": height,
        "format": image_format,
        "mode": mode,
        "size_mb": round(size_mb, 2),
        "aspect_ratio": round(width / height, 3),
    }


# ============================================================
# 6. GPS / EXIF EXTRACTION
# ============================================================

def _rational_to_float(value: Any) -> float:
    """
    Convert Pillow EXIF rational values into float.
    """

    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _dms_to_decimal(values: Any) -> float:
    """
    Convert EXIF degrees/minutes/seconds to decimal degrees.
    """

    if not values or len(values) != 3:
        raise ValueError("Invalid GPS coordinate.")

    degrees = _rational_to_float(values[0])
    minutes = _rational_to_float(values[1])
    seconds = _rational_to_float(values[2])

    return degrees + (minutes / 60.0) + (seconds / 3600.0)


def extract_gps(image_bytes: bytes) -> tuple[float | None, float | None]:
    """
    Extract latitude and longitude from image EXIF GPS metadata.

    Returns:
        (latitude, longitude)

    Returns:
        (None, None) when GPS is unavailable.
    """

    try:
        with Image.open(io.BytesIO(image_bytes)) as image:

            exif = image.getexif()

            if not exif:
                return None, None

            # GPSInfo EXIF tag
            gps_info = exif.get_ifd(0x8825)

            if not gps_info:
                return None, None

            # GPS tags:
            # 1 = latitude reference
            # 2 = latitude
            # 3 = longitude reference
            # 4 = longitude
            latitude_values = gps_info.get(2)
            longitude_values = gps_info.get(4)

            if not latitude_values or not longitude_values:
                return None, None

            latitude = _dms_to_decimal(latitude_values)
            longitude = _dms_to_decimal(longitude_values)

            latitude_ref = gps_info.get(1)
            longitude_ref = gps_info.get(3)

            if isinstance(latitude_ref, bytes):
                latitude_ref = latitude_ref.decode(
                    "utf-8",
                    errors="ignore"
                )

            if isinstance(longitude_ref, bytes):
                longitude_ref = longitude_ref.decode(
                    "utf-8",
                    errors="ignore"
                )

            if str(latitude_ref).upper() == "S":
                latitude = -latitude

            if str(longitude_ref).upper() == "W":
                longitude = -longitude

            # Basic geographic validity check
            if not -90 <= latitude <= 90:
                return None, None

            if not -180 <= longitude <= 180:
                return None, None

            return (
                round(latitude, 6),
                round(longitude, 6),
            )

    except Exception:
        # GPS is optional. A malformed EXIF block should never
        # prevent the road inspection itself from running.
        return None, None


# ============================================================
# 7. CONTEXT VALIDATION
# ============================================================

def _clean_text(value: Any) -> str | None:
    """
    Clean optional user-entered text.
    """

    if value is None:
        return None

    value = str(value).strip()

    return value if value else None


def _clean_coordinate(
    value: Any,
    minimum: float,
    maximum: float,
) -> float | None:
    """
    Validate an optional latitude/longitude value.
    """

    if value is None or value == "":
        return None

    try:
        number = float(value)
    except (TypeError, ValueError):
        raise ValueError("Latitude/longitude must be numeric.")

    if not minimum <= number <= maximum:
        raise ValueError(
            f"Coordinate {number} is outside the valid geographic range."
        )

    return round(number, 6)


def normalize_context(context: dict[str, Any]) -> dict[str, Any]:
    """
    Normalize and validate the context supplied by Mode 1 UI.

    Required:
        road_type
        traffic_level
        location_sensitivity

    Optional:
        latitude
        longitude
        state
        city
        area
    """

    if not isinstance(context, dict):
        raise ValueError("Inspection context must be a dictionary.")

    road_type = _clean_text(context.get("road_type"))
    traffic_level = _clean_text(context.get("traffic_level"))
    location_sensitivity = _clean_text(
        context.get("location_sensitivity")
    )

    if not road_type:
        raise ValueError("Road type is required.")

    if not traffic_level:
        raise ValueError("Traffic/usage level is required.")

    if not location_sensitivity:
        raise ValueError("Location sensitivity is required.")

    latitude = _clean_coordinate(
        context.get("latitude"),
        -90,
        90,
    )

    longitude = _clean_coordinate(
        context.get("longitude"),
        -180,
        180,
    )

    # Never keep only one coordinate.
    if (latitude is None) != (longitude is None):
        latitude = None
        longitude = None

    return {
        "latitude": latitude,
        "longitude": longitude,
        "state": _clean_text(context.get("state")),
        "city": _clean_text(context.get("city")),
        "area": _clean_text(context.get("area")),
        "road_type": road_type,
        "traffic_level": traffic_level,
        "location_sensitivity": location_sensitivity,
    }


# ============================================================
# 8. REPORT ID
# ============================================================

def generate_report_id() -> str:
    """
    Generate a human-readable unique RoadWise report ID.

    Example:
        RW-20261007-180530-A7F2
    """

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    unique_part = uuid.uuid4().hex[:4].upper()

    return f"RW-{timestamp}-{unique_part}"


# ============================================================
# 9. IMAGE STORAGE
# ============================================================

def save_original_image(
    image_bytes: bytes,
    report_id: str,
    filename: str,
) -> Path:
    """
    Save the original uploaded image.

    The original file is preserved rather than replacing it with
    a processed/compressed copy.
    """

    UPLOAD_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    extension = Path(filename).suffix.lower()

    if extension not in SUPPORTED_EXTENSIONS:
        extension = ".jpg"

    output_path = UPLOAD_DIR / f"{report_id}{extension}"

    output_path.write_bytes(image_bytes)

    return output_path


def save_annotated_image(
    annotated,
    report_id: str,
) -> Path:
    """
    Save the YOLO annotated image.

    `predict.py` returns an OpenCV/BGR image.
    Pillow expects RGB, so conversion is performed here.
    """

    ANNOTATED_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    output_path = ANNOTATED_DIR / f"{report_id}_annotated.jpg"

    if annotated is None:
        raise RuntimeError(
            "YOLO did not return an annotated image."
        )

    # BGR → RGB
    rgb_image = annotated[:, :, ::-1]

    Image.fromarray(rgb_image).save(
        output_path,
        format="JPEG",
        quality=95,
    )

    return output_path


# ============================================================
# 10. DETECTION SUMMARY
# ============================================================

def summarize_detections(
    detections: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    Create a compact human-readable summary of detections.
    """

    if not detections:
        return {
            "count": 0,
            "classes": {},
            "highest_confidence": 0.0,
            "average_confidence": 0.0,
        }

    class_counts = Counter(
        d.get("class_name", "unknown")
        for d in detections
    )

    confidences = [
        float(d.get("confidence", 0.0))
        for d in detections
    ]

    return {
        "count": len(detections),
        "classes": dict(class_counts),
        "highest_confidence": round(
            max(confidences),
            3,
        ),
        "average_confidence": round(
            sum(confidences) / len(confidences),
            3,
        ),
    }


# ============================================================
# 11. RECOMMENDATION ENGINE
# ============================================================

def build_recommendation(
    priority: str,
    detections: list[dict[str, Any]],
    risk_result: dict[str, Any],
) -> str:
    """
    Generate a simple actionable recommendation.

    This is a project-level recommendation, not an engineering
    maintenance prescription.
    """

    priority_actions = {
        "CRITICAL": (
            "Immediate field inspection is recommended and "
            "maintenance should be prioritized."
        ),
        "HIGH": (
            "Schedule a field inspection soon and prioritize "
            "maintenance planning."
        ),
        "MEDIUM": (
            "Schedule follow-up inspection and monitor the "
            "road condition."
        ),
        "LOW": (
            "No immediate maintenance priority is indicated "
            "by this inspection; continue monitoring."
        ),
    }

    action = priority_actions.get(
        priority,
        "Further inspection is recommended."
    )

    if not detections:
        return (
            f"{action} "
            "No road damage was detected in this image. "
            "This does not guarantee that the road is undamaged."
        )

    summary = summarize_detections(detections)

    class_text = ", ".join(
        f"{count} {name.replace('_', ' ')}"
        for name, count in summary["classes"].items()
    )

    return (
        f"{action} "
        f"Detected damage: {class_text}. "
        f"Highest detection confidence: "
        f"{summary['highest_confidence']:.2f}."
    )


# ============================================================
# 12. PIPELINE RESULT
# ============================================================

def build_pipeline_result(
    report_id: str,
    inspection_id: int | None,
    image_metadata: dict[str, Any],
    original_path: Path,
    annotated_path: Path,
    detections: list[dict[str, Any]],
    condition_result: dict[str, Any],
    risk_result: dict[str, Any],
    recommendation: str,
    context: dict[str, Any],
) -> dict[str, Any]:
    """
    Create the single structured object consumed by Mode 1 UI.
    """

    return {
        "report_id": report_id,
        "inspection_id": inspection_id,

        "image": {
            "original_path": str(original_path),
            "annotated_path": str(annotated_path),
            "metadata": image_metadata,
        },

        "location": {
            "latitude": context.get("latitude"),
            "longitude": context.get("longitude"),
            "state": context.get("state"),
            "city": context.get("city"),
            "area": context.get("area"),
        },

        "context": {
            "road_type": context["road_type"],
            "traffic_level": context["traffic_level"],
            "location_sensitivity": context["location_sensitivity"],
        },

        "detections": detections,
        "detection_summary": summarize_detections(detections),

        "condition": condition_result,

        "risk": risk_result,

        "priority": {
            "level": risk_result["maintenance_priority"],
            "description": risk_result["priority_description"],
        },

        "recommendation": recommendation,

        "created_at": datetime.now().isoformat(
            timespec="seconds"
        ),
    }


# ============================================================
# 13. MAIN MODE 1 PIPELINE
# ============================================================

def run_inspection(
    image_bytes: bytes,
    filename: str,
    context: dict[str, Any],
    conf: float = DEFAULT_CONFIDENCE,
    save_to_db: bool = True,
    model_path: str | Path | None = None,
    imgsz: int = DEFAULT_IMGSZ,
) -> dict[str, Any]:
    """
    Run one complete RoadWise Mode 1 inspection.

    Parameters
    ----------
    image_bytes:
        Raw bytes of uploaded image.

    filename:
        Original uploaded filename.

    context:
        Dictionary containing:
            latitude
            longitude
            state
            city
            area
            road_type
            traffic_level
            location_sensitivity

    conf:
        YOLO confidence threshold.

    save_to_db:
        Whether to persist the inspection.

    model_path:
        Optional custom YOLO model path.

    Returns
    -------
    dict
        Complete result for Mode 1 UI.

    Pipeline
    --------
    validate
        ↓
    GPS extraction
        ↓
    save original
        ↓
    YOLO
        ↓
    condition
        ↓
    risk
        ↓
    recommendation
        ↓
    SQLite
        ↓
    return result
    """

    # --------------------------------------------------------
    # A. Validate confidence threshold
    # --------------------------------------------------------

    try:
        conf = float(conf)
    except (TypeError, ValueError):
        raise ValueError(
            "Detection confidence must be numeric."
        )

    if not 0.05 <= conf <= 0.95:
        raise ValueError(
            "Detection confidence must be between 0.05 and 0.95."
        )

    try:
        imgsz = int(imgsz)
    except (TypeError, ValueError):
        raise ValueError("Inference image size (imgsz) must be an integer.")

    if not 320 <= imgsz <= 1920:
        raise ValueError(
            "Inference image size (imgsz) must be between 320 and 1920 pixels."
        )

    # --------------------------------------------------------
    # B. Validate image
    # --------------------------------------------------------

    image_metadata = validate_image_bytes(image_bytes)

    # --------------------------------------------------------
    # C. Normalize user context
    # --------------------------------------------------------

    normalized_context = normalize_context(context)

    # --------------------------------------------------------
    # D. Try GPS from EXIF
    # --------------------------------------------------------

    exif_latitude, exif_longitude = extract_gps(
        image_bytes
    )

    # User-entered coordinates take priority.
    if (
        normalized_context["latitude"] is None
        and normalized_context["longitude"] is None
        and exif_latitude is not None
        and exif_longitude is not None
    ):
        normalized_context["latitude"] = exif_latitude
        normalized_context["longitude"] = exif_longitude

    # --------------------------------------------------------
    # E. Generate report ID
    # --------------------------------------------------------

    report_id = generate_report_id()

    # --------------------------------------------------------
    # F. Save original image
    # --------------------------------------------------------

    original_path = save_original_image(
        image_bytes=image_bytes,
        report_id=report_id,
        filename=filename,
    )

    # --------------------------------------------------------
    # G. Run YOLO
    # --------------------------------------------------------

    try:

        if model_path is None:

            detections, annotated = detect(
                str(original_path),
                conf=conf,
                imgsz=imgsz,
            )

        else:

            detections, annotated = detect(
                str(original_path),
                conf=conf,
                model_path=model_path,
                imgsz=imgsz,
            )

    except FileNotFoundError:
        raise

    except Exception as exc:
        raise RuntimeError(
            f"Road damage detection failed: {exc}"
        ) from exc

    # --------------------------------------------------------
    # H. Validate detector output
    # --------------------------------------------------------

    if detections is None:
        detections = []

    if not isinstance(detections, list):
        raise RuntimeError(
            "YOLO returned an invalid detection result."
        )

    # --------------------------------------------------------
    # I. Save annotated image
    # --------------------------------------------------------

    annotated_path = save_annotated_image(
        annotated=annotated,
        report_id=report_id,
    )

    # --------------------------------------------------------
    # J. Calculate condition
    # --------------------------------------------------------

    try:

        condition_result = calculate_condition(
            detections
        )

    except Exception as exc:
        raise RuntimeError(
            f"Condition scoring failed: {exc}"
        ) from exc

    # --------------------------------------------------------
    # K. Calculate risk + priority
    # --------------------------------------------------------

    try:

        risk_result = analyze_risk(
            condition_result["condition_score"],
            normalized_context["road_type"],
            normalized_context["traffic_level"],
            normalized_context["location_sensitivity"],
        )

    except Exception as exc:
        raise RuntimeError(
            f"Risk scoring failed: {exc}"
        ) from exc

    # --------------------------------------------------------
    # L. Build recommendation
    # --------------------------------------------------------

    recommendation = build_recommendation(
        priority=risk_result["maintenance_priority"],
        detections=detections,
        risk_result=risk_result,
    )

    # --------------------------------------------------------
    # M. Save to SQLite
    # --------------------------------------------------------

    inspection_id = None

    if save_to_db:

        create_tables()

        inspection_record = {
            "report_id": report_id,

            "image_path": str(
                original_path.relative_to(BASE_DIR)
            ),

            "annotated_image_path": str(
                annotated_path.relative_to(BASE_DIR)
            ),

            "latitude": normalized_context["latitude"],
            "longitude": normalized_context["longitude"],

            "state": normalized_context["state"],
            "city": normalized_context["city"],
            "area": normalized_context["area"],

            "road_type": normalized_context["road_type"],
            "traffic_level": normalized_context["traffic_level"],
            "location_sensitivity": (
                normalized_context["location_sensitivity"]
            ),

            "condition_score": (
                condition_result["condition_score"]
            ),

            "risk_score": risk_result["risk_score"],

            "priority": (
                risk_result["maintenance_priority"]
            ),

            "recommendation": recommendation,

            "pdf_path": None,
        }

        try:

            inspection_id = save_inspection(
                inspection_record,
                detections,
            )

        except Exception as exc:
            raise RuntimeError(
                f"Inspection was analyzed but could not be "
                f"saved to the database: {exc}"
            ) from exc

    # --------------------------------------------------------
    # N. Build final UI-ready result
    # --------------------------------------------------------

    result = build_pipeline_result(
        report_id=report_id,
        inspection_id=inspection_id,
        image_metadata=image_metadata,
        original_path=original_path,
        annotated_path=annotated_path,
        detections=detections,
        condition_result=condition_result,
        risk_result=risk_result,
        recommendation=recommendation,
        context=normalized_context,
    )

    return result


# ============================================================
# 14. COMMAND-LINE TEST
# ============================================================

if __name__ == "__main__":

    import argparse
    import json

    parser = argparse.ArgumentParser(
        description="Run a complete RoadWise Mode 1 inspection."
    )

    parser.add_argument(
        "--image",
        required=True,
        help="Path to a road image.",
    )

    parser.add_argument(
        "--conf",
        type=float,
        default=DEFAULT_CONFIDENCE,
        help="YOLO confidence threshold.",
    )

    parser.add_argument(
        "--imgsz",
        type=int,
        default=DEFAULT_IMGSZ,
        help="YOLO inference image size (default: 640).",
    )

    parser.add_argument(
        "--road-type",
        default="main_road",
        help="Road type.",
    )

    parser.add_argument(
        "--traffic",
        default="medium",
        help="Traffic/usage level.",
    )

    parser.add_argument(
        "--sensitivity",
        default="none",
        help="Location sensitivity.",
    )

    parser.add_argument(
        "--state",
        default=None,
    )

    parser.add_argument(
        "--city",
        default=None,
    )

    parser.add_argument(
        "--area",
        default=None,
    )

    parser.add_argument(
        "--latitude",
        type=float,
        default=None,
    )

    parser.add_argument(
        "--longitude",
        type=float,
        default=None,
    )

    parser.add_argument(
        "--no-db",
        action="store_true",
        help="Run without saving to SQLite.",
    )

    args = parser.parse_args()

    image_path = Path(args.image)

    if not image_path.exists():
        raise SystemExit(
            f"Image not found: {image_path}"
        )

    context = {
        "latitude": args.latitude,
        "longitude": args.longitude,
        "state": args.state,
        "city": args.city,
        "area": args.area,
        "road_type": args.road_type,
        "traffic_level": args.traffic,
        "location_sensitivity": args.sensitivity,
    }

    result = run_inspection(
        image_bytes=image_path.read_bytes(),
        filename=image_path.name,
        context=context,
        conf=args.conf,
        save_to_db=not args.no_db,
        imgsz=args.imgsz,
    )

    print()
    print("=" * 70)
    print("ROADWISE MODE 1 INSPECTION")
    print("=" * 70)

    print(f"Report ID       : {result['report_id']}")
    print(f"Inspection ID   : {result['inspection_id']}")

    print()
    print("IMAGE")
    print(f"Resolution      : "
          f"{result['image']['metadata']['width']}x"
          f"{result['image']['metadata']['height']}")

    print()
    print("LOCATION")
    print(f"Latitude        : {result['location']['latitude']}")
    print(f"Longitude       : {result['location']['longitude']}")
    print(f"State           : {result['location']['state']}")
    print(f"City            : {result['location']['city']}")
    print(f"Area            : {result['location']['area']}")

    print()
    print("DETECTIONS")
    print(f"Total           : {result['detection_summary']['count']}")

    for detection in result["detections"]:
        print(
            f"  - {detection['class_name']}"
            f" ({detection['class_code']})"
            f" confidence={detection['confidence']:.2f}"
        )

    print()
    print("SCORING")
    print(
        f"Condition Score : "
        f"{result['condition']['condition_score']:.2f}"
    )

    print(
        f"Damage Level    : "
        f"{result['risk']['damage_level']:.2f}"
    )

    print(
        f"Context Factor  : "
        f"{result['risk']['context_factor']:.3f}"
    )

    print(
        f"Risk Score      : "
        f"{result['risk']['risk_score']:.2f}"
    )

    print(
        f"Priority        : "
        f"{result['risk']['maintenance_priority']}"
    )

    print()
    print("RECOMMENDATION")
    print(result["recommendation"])

    print()
    print("FILES")
    print(f"Original        : {result['image']['original_path']}")
    print(f"Annotated       : {result['image']['annotated_path']}")

    print()
    print("=" * 70)

    # Machine-readable result for debugging if needed.
    print(
        json.dumps(
            {
                "report_id": result["report_id"],
                "inspection_id": result["inspection_id"],
                "condition_score": result["condition"]["condition_score"],
                "risk_score": result["risk"]["risk_score"],
                "priority": result["risk"]["maintenance_priority"],
                "detections": result["detection_summary"],
            },
            indent=2,
        )
    )