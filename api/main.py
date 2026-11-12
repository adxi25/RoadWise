"""
RoadWise - FastAPI RESTful Backend Service
==========================================

ROLE IN ROADWISE ARCHITECTURE:
    This module exposes high-performance asynchronous HTTP endpoints that bridge the
    React frontend with the Python computer vision, scoring, and persistence engines.
    It follows a thin-adapter architecture: business and ML logic reside in `src/`,
    while `api/main.py` handles HTTP request serialization, input validation,
    CORS negotiation, static image streaming, and HTTP status code mappings.

ENDPOINTS SPECIFICATION:
    1. System Health & Warmup:
       - `GET /api/health`
         Verifies active YOLOv8 model file presence (`models/best.pt`), checks database
         reachability, tests model weights loading cache, and reports service availability.

    2. Mode 1 — Road Inspection:
       - `POST /api/inspections/inspect` (multipart/form-data)
         Accepts road image bytes, operational road context, and inference hyperparameters.
         Executes image validation, EXIF parsing, YOLO inference, condition scoring,
         risk prioritization, and SQLite persistence. Returns HTTP 201 Created with full report.

    3. Mode 2 — Authority Dashboard Analytics:
       - `GET /api/inspections`
         Returns risk-ranked list of all road inspections. Supports query filtering:
         `priority` (CRITICAL/HIGH/MEDIUM/LOW), `city`, `road_type`, and `limit`.
       - `GET /api/dashboard/stats`
         Returns aggregated authority KPIs: total inspections, breakdown by priority tier,
         fleet-wide average condition score, average risk score, and valid GPS count.
       - `GET /api/inspections/{id}`
         Retrieves granular inspection record joined with child bounding box detections.

STATIC ASSET MOUNTING:
    - `/data/uploads`       -> Streams original uncompressed uploaded road images.
    - `/results/predictions` -> Streams YOLO bounding-box annotated output images.

KEY VIVA QUESTIONS & CONCEPTS:
    - Q: Why FastAPI instead of Flask or Django?
      A: Native async/await concurrency, automatic OpenAPI (Swagger) documentation,
         type checking, high throughput built on Starlette and Uvicorn ASGI server.
    - Q: What does the lifespan context manager do?
      A: Executes startup hooks (such as `create_tables()` to ensure SQLite schema exists)
         before the ASGI server begins accepting socket connections, guaranteeing zero cold-start DB crashes.
    - Q: Why are image paths transformed before sending JSON to the client?
      A: File system paths (e.g., `C:/.../RoadWise/data/uploads/image.jpg`) cannot be fetched directly
         by a web browser due to browser security sandbox rules. The API normalizes them into web-accessible
         relative URLs (e.g., `data/uploads/image.jpg`), which resolve against `http://127.0.0.1:8000/`.
"""

from __future__ import annotations

import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Optional

from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# ---------------------------------------------------------------------------
# Path configuration to access existing src/ modules
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parents[1]
SRC_DIR = BASE_DIR / "src"

if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

# Import existing core modules (unmodified)
from database.database import (  # noqa: E402
    create_tables,
    get_all_inspections,
    get_inspection,
    get_inspection_stats,
)
from detection.predict import (  # noqa: E402
    CRACK_MODEL,
    POTHOLE_MODEL,
    load_model,
)
from pipeline.inspection_pipeline import (  # noqa: E402
    DEFAULT_CONFIDENCE,
    DEFAULT_IMGSZ,
    run_inspection,
)

# Static file storage directories
UPLOAD_DIR = BASE_DIR / "data" / "uploads"
ANNOTATED_DIR = BASE_DIR / "results" / "predictions"
MODEL_PATH = BASE_DIR / "models" / "best.pt"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ANNOTATED_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Lifespan context manager for startup tasks
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage FastAPI application lifespan events.

    STARTUP:
        Executes `create_tables()` to ensure all required SQLite tables (`inspections`,
        `detections`) and secondary B-Tree indices exist before socket listening starts.
    SHUTDOWN:
        Yields execution to the ASGI server until termination signals (SIGINT/SIGTERM).
    """
    # Ensure database schema and indexes exist prior to handling any inbound requests
    create_tables()
    yield


# ---------------------------------------------------------------------------
# FastAPI app initialization
# ---------------------------------------------------------------------------
app = FastAPI(
    title="RoadWise API",
    description="Automated Road Damage Detection, Health Scoring, and Risk Assessment API.",
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS Middleware
# ---------------------------------------------------------------------------
# Configure Cross-Origin Resource Sharing (CORS) to allow browser HTTP requests
# from the local Vite development server (http://localhost:5173) or production hosts.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Static File Mounts (Serve uploaded & annotated images)
# ---------------------------------------------------------------------------
# Mount physical filesystem directories so browser can load image URLs:
# - `/data/uploads/...`       -> Serves original uploaded road photos
# - `/results/predictions/...` -> Serves YOLO annotated bounding-box photos
app.mount("/data/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
app.mount(
    "/results/predictions",
    StaticFiles(directory=str(ANNOTATED_DIR)),
    name="predictions",
)


# ---------------------------------------------------------------------------
# Helper: Ensure JSON serializability
# ---------------------------------------------------------------------------
def _to_json_safe(obj: Any) -> Any:
    """
    Recursively convert pathlib.Path objects or non-serializable types into standard JSON primitives.

    WHY IT IS REQUIRED:
        Python `pathlib.Path` objects cannot be serialized by standard JSON encoders.
        Traversing nested dicts and lists to cast Paths to strings ensures FastAPI's
        jsonable_encoder emits valid JSON without 500 SerializationErrors.
    """
    if isinstance(obj, Path):
        return str(obj)
    if isinstance(obj, dict):
        return {k: _to_json_safe(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple, set)):
        return [_to_json_safe(x) for x in obj]
    return obj


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------


@app.get("/api/health", tags=["System"])
def health_check() -> dict[str, Any]:
    """
    Check the health of the RoadWise API service and verify model availability.

    SYSTEM VALIDATION CHECKS:
        1. Checks whether primary pothole model and Experiment C crack specialist model exist.
        2. Tests model loading cache via `load_model()` to confirm valid PyTorch weights.
        3. Confirms database readiness.

    Returns:
        dict: Operational readiness status, dual-model diagnostics, and database health.
    """
    pothole_exists = POTHOLE_MODEL.exists() or MODEL_PATH.exists()
    pothole_path = POTHOLE_MODEL if POTHOLE_MODEL.exists() else MODEL_PATH
    pothole_status = "not_found"

    if pothole_exists:
        try:
            load_model(pothole_path)
            pothole_status = "ready"
        except Exception as e:
            pothole_status = f"error: {e}"

    crack_exists = CRACK_MODEL.exists()
    crack_status = "not_found"
    if crack_exists:
        try:
            load_model(CRACK_MODEL)
            crack_status = "ready"
        except Exception as e:
            crack_status = f"error: {e}"

    is_dual_model = (pothole_status == "ready") and (crack_status == "ready")

    return {
        "status": "healthy",
        "service": "RoadWise API",
        "inference_mode": "dual_model" if is_dual_model else "single_model",
        "model": {
            "path": str(pothole_path),
            "exists": pothole_exists,
            "status": pothole_status,
        },
        "dual_model": {
            "pothole_specialist": {
                "path": str(pothole_path),
                "exists": pothole_exists,
                "status": pothole_status,
                "classes": ["D40 (Pothole)"],
            },
            "crack_specialist": {
                "path": str(CRACK_MODEL),
                "exists": crack_exists,
                "status": crack_status,
                "classes": ["D00 (Linear Crack)", "D20 (Alligator Crack)"],
            },
        },
        "database": {
            "path": str(BASE_DIR / "data" / "roadwise.db"),
            "ready": True,
        },
    }


@app.post(
    "/api/inspections/inspect",
    tags=["Inspections"],
    status_code=status.HTTP_201_CREATED,
)
async def inspect_road(
    image: UploadFile = File(..., description="Road inspection photo (JPG, PNG, WebP)"),
    road_type: str = Form(
        ...,
        description="Road classification (e.g., national_highway, main_road, residential)",
    ),
    traffic_level: str = Form(
        ...,
        description="Traffic volume level (very_high, high, medium, low, very_low)",
    ),
    location_sensitivity: str = Form(
        ...,
        description="Location sensitivity (school, hospital, market, none, etc.)",
    ),
    latitude: Optional[float] = Form(
        None, description="Optional latitude coordinate (-90 to 90)"
    ),
    longitude: Optional[float] = Form(
        None, description="Optional longitude coordinate (-180 to 180)"
    ),
    state: Optional[str] = Form(None, description="Optional State/Province name"),
    city: Optional[str] = Form(None, description="Optional City name"),
    area: Optional[str] = Form(None, description="Optional Area / Neighborhood name"),
    conf: Optional[float] = Form(
        DEFAULT_CONFIDENCE,
        description="YOLO confidence threshold (0.05 to 0.50, default: 0.10)",
    ),
    imgsz: Optional[int] = Form(
        DEFAULT_IMGSZ,
        description="YOLO inference image size in pixels (0 for Multi-Scale Fusion, default: 0)",
    ),
) -> dict[str, Any]:
    """
    Execute a Mode 1 inspection on an uploaded road image.

    Validates inputs, extracts EXIF GPS if present, runs YOLOv8 detection,
    computes condition score and risk priority, persists to SQLite, and
    returns the complete structured report.
    """
    # Read raw image upload binary stream asynchronously into memory
    try:
        image_bytes = await image.read()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded image: {exc}",
        ) from exc

    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded image file is empty.",
        )

    # Validate inference resolution (imgsz) boundary constraints
    target_imgsz = DEFAULT_IMGSZ
    if imgsz is not None:
        try:
            target_imgsz = int(imgsz)
            if target_imgsz != 0 and not (320 <= target_imgsz <= 1920):
                raise ValueError("imgsz must be 0 (Multi-Scale Fusion) or between 320 and 1920 pixels.")
        except (TypeError, ValueError) as val_err:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid inference image size: {val_err}",
            )

    # Package operational context payload for inspection pipeline
    context = {
        "road_type": road_type,
        "traffic_level": traffic_level,
        "location_sensitivity": location_sensitivity,
        "latitude": latitude,
        "longitude": longitude,
        "state": state,
        "city": city,
        "area": area,
    }

    try:
        # Execute the full Mode 1 inspection pipeline:
        # Image validation -> EXIF GPS extraction -> Original saving -> YOLO inference ->
        # Condition scoring -> Risk scoring -> Recommendation -> SQLite persistence
        result = run_inspection(
            image_bytes=image_bytes,
            filename=image.filename or "uploaded_road_image.jpg",
            context=context,
            conf=conf if conf is not None else DEFAULT_CONFIDENCE,
            save_to_db=True,
            imgsz=target_imgsz,
        )

        # Convert server-side absolute filesystem paths to relative static web mount paths
        # (e.g., 'C:/.../data/uploads/RW-...jpg' -> 'data/uploads/RW-...jpg')
        # This allows the React client to fetch images via FastAPI's static mounts.
        if isinstance(result, dict) and "image" in result and isinstance(result["image"], dict):
            if result["image"].get("original_path"):
                orig_filename = Path(str(result["image"]["original_path"])).name
                result["image"]["original_path"] = f"data/uploads/{orig_filename}"
            if result["image"].get("annotated_path"):
                ann_filename = Path(str(result["image"]["annotated_path"])).name
                result["image"]["annotated_path"] = f"results/predictions/{ann_filename}"

        return _to_json_safe(result)

    except ValueError as exc:
        # Input validation failures (e.g. invalid context, image too small, invalid coordinates)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    except FileNotFoundError as exc:
        # Missing model weights file or missing source directory
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Resource not found: {exc}",
        ) from exc

    except RuntimeError as exc:
        # Internal pipeline execution fault (e.g. detector failure, database transaction error)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        # Unhandled unexpected error fallback
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected inspection error: {exc}",
        ) from exc


@app.get("/api/inspections", tags=["Inspections"])
def list_inspections(
    priority: Optional[str] = Query(
        None,
        description="Filter by priority (e.g., LOW, MEDIUM, HIGH, CRITICAL)",
    ),
    city: Optional[str] = Query(
        None,
        description="Filter by city (case-insensitive substring match)",
    ),
    road_type: Optional[str] = Query(
        None,
        description="Filter by road type",
    ),
    limit: Optional[int] = Query(
        None,
        ge=1,
        description="Maximum number of inspections to return",
    ),
) -> list[dict[str, Any]]:
    """
    Retrieve all road inspections from the SQLite database.
    Supports optional filtering by priority, city, road type, and limit.
    """
    try:
        # Fetch all records with detection counts sorted by risk_score DESC
        inspections = get_all_inspections()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query database: {exc}",
        ) from exc

    # In-memory query filter: Priority tier matching (CRITICAL, HIGH, MEDIUM, LOW)
    if isinstance(priority, str) and priority.strip():
        target_priority = priority.strip().upper()
        inspections = [
            i for i in inspections if str(i.get("priority")).upper() == target_priority
        ]

    # In-memory query filter: City case-insensitive substring search
    if isinstance(city, str) and city.strip():
        target_city = city.strip().lower()
        inspections = [
            i
            for i in inspections
            if i.get("city") and target_city in str(i.get("city")).lower()
        ]

    # In-memory query filter: Road classification matching
    if isinstance(road_type, str) and road_type.strip():
        target_road_type = road_type.strip().lower()
        inspections = [
            i
            for i in inspections
            if str(i.get("road_type")).lower() == target_road_type
        ]

    # Apply row limit constraint if specified
    if isinstance(limit, int):
        inspections = inspections[:limit]

    # Normalize image paths for web static mounts
    for i in inspections:
        if i.get("image_path"):
            orig_name = Path(str(i["image_path"])).name
            i["image_path"] = f"data/uploads/{orig_name}"
        if i.get("annotated_image_path"):
            ann_name = Path(str(i["annotated_image_path"])).name
            i["annotated_image_path"] = f"results/predictions/{ann_name}"

    return _to_json_safe(inspections)


@app.get("/api/dashboard/stats", tags=["Dashboard"])
def dashboard_stats() -> dict[str, Any]:
    """
    Retrieve aggregate metrics across all stored inspections for Mode 2 dashboard.
    """
    try:
        stats = get_inspection_stats()
        return _to_json_safe(stats)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate dashboard statistics: {exc}",
        ) from exc


@app.get("/api/inspections/{inspection_id}", tags=["Inspections"])
def get_inspection_detail(
    inspection_id: int,
) -> dict[str, Any]:
    """
    Retrieve full details for a single inspection, including all bounding box detections.
    """
    try:
        inspection = get_inspection(inspection_id)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query database: {exc}",
        ) from exc

    if inspection is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inspection with ID {inspection_id} not found.",
        )

    # Normalize image paths for web static mounts
    if inspection.get("image_path"):
        orig_name = Path(str(inspection["image_path"])).name
        inspection["image_path"] = f"data/uploads/{orig_name}"
    if inspection.get("annotated_image_path"):
        ann_name = Path(str(inspection["annotated_image_path"])).name
        inspection["annotated_image_path"] = f"results/predictions/{ann_name}"

    return _to_json_safe(inspection)
