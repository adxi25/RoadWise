# RoadWise — Codebase Map
**Last Updated:** 2026-11-11  
**Purpose:** Find any feature or function in the codebase instantly.

> Update this document whenever files, functions, imports, or architecture change.

---

## Quick Navigation — "Where is X?"

| Question | File | Function/Component |
|---|---|---|
| Where does image upload happen? | `frontend/src/components/ImageUploader.jsx` | `ImageUploader` component |
| Where is image validation performed? | `src/pipeline/inspection_pipeline.py` | `validate_image_bytes()` |
| Where is YOLO loaded? | `src/detection/predict.py` | `load_model()` |
| Where does inference happen? | `src/detection/predict.py` | `detect()` |
| Where are bounding boxes generated? | `src/detection/predict.py` | `results_to_detections()` |
| Where is condition scoring implemented? | `src/scoring/health_score.py` | `calculate_condition()` |
| Where is risk scoring implemented? | `src/scoring/risk_score.py` | `analyze_risk()` |
| Where are priority levels assigned? | `src/scoring/risk_score.py` | `get_priority()` |
| Where are inspection records saved? | `src/database/database.py` | `save_inspection()` |
| Where are inspection records retrieved? | `src/database/database.py` | `get_all_inspections()`, `get_inspection()` |
| Where does the dashboard fetch statistics? | `src/database/database.py` | `get_inspection_stats()` |
| Where are map markers created? | `frontend/src/components/Dashboard/GeographicMap.jsx` | `GeographicMap` component |
| Where is filtering implemented? | `api/main.py` + `frontend/.../RankingTable.jsx` | `list_inspections()` + `RankingTable` |
| Where is API error handling? | `api/main.py` | Each endpoint's try/except blocks |
| Where is the inspection orchestrator? | `src/pipeline/inspection_pipeline.py` | `run_inspection()` |
| Where is the database schema defined? | `src/database/database.py` | `create_tables()` |
| Where are class name mappings? | `src/detection/predict.py` | `CLASS_CODE` and `CLASS_LABEL` dicts |
| Where are API routes registered? | `api/main.py` | `@app.get()` / `@app.post()` decorators |

---

## File-by-File Map

### `api/main.py`
| Field | Detail |
|---|---|
| **Responsibility** | FastAPI application entry point; HTTP layer between frontend and backend logic |
| **Why it exists** | Exposes all backend functionality as HTTP endpoints; handles CORS, static files, request parsing |
| **Called by** | Uvicorn ASGI server; `tests/test_roadwise_pipeline.py` (TestClient) |
| **Calls** | `src/pipeline/inspection_pipeline.py:run_inspection()`, `src/database/database.py:*`, `src/detection/predict.py:load_model()` |
| **Important functions** | `inspect_road()` (POST /inspect), `list_inspections()`, `dashboard_stats()`, `get_inspection_detail()`, `health_check()` |
| **Inputs** | HTTP requests (multipart form-data for inspections, query params for filtering) |
| **Outputs** | JSON responses, HTTP status codes, static file streams |
| **Related feature** | All — this is the HTTP gateway |

**Key endpoints:**
```
GET  /api/health                    → model + DB status
POST /api/inspections/inspect       → full inspection pipeline
GET  /api/inspections               → list all (filterable)
GET  /api/inspections/{id}          → single inspection with detections
GET  /api/dashboard/stats           → aggregate KPIs
```

---

### `src/pipeline/inspection_pipeline.py`
| Field | Detail |
|---|---|
| **Responsibility** | End-to-end orchestration of Mode 1 road inspection (11 steps) |
| **Why it exists** | Separates business logic from HTTP layer; can be tested and run independently of API |
| **Called by** | `api/main.py:inspect_road()` |
| **Calls** | `predict.py:detect()`, `health_score.py:calculate_condition()`, `risk_score.py:analyze_risk()`, `database.py:save_inspection()` |
| **Important functions** | `run_inspection()`, `validate_image_bytes()`, `extract_gps_from_exif()`, `build_recommendation()`, `build_pipeline_result()` |
| **Inputs** | `image_bytes` (bytes), `filename` (str), `context` (dict), `conf` (float), `save_to_db` (bool), `imgsz` (int) |
| **Outputs** | Full inspection result dict (scores, detections, paths, location, recommendation) |
| **Related feature** | Mode 1 — Road Inspection |

**11-step pipeline flow:**
```
1. Input validation (Pillow verify, size ≤ 20MB)
2. EXIF GPS parsing (DMS → decimal)
3. Save original image → data/uploads/{report_id}.ext
4. YOLO inference → detections list + annotated BGR array
5. Save annotated image → results/predictions/{report_id}_annotated.jpg
6. Condition scoring → condition_score (0-100)
7. Risk scoring → risk_score, priority
8. Build recommendation text
9. Save to SQLite (atomic transaction)
10. Build and return result dict
```

---

### `src/detection/predict.py`
| Field | Detail |
|---|---|
| **Responsibility** | YOLO model loading, inference, and output normalization |
| **Why it exists** | Isolates all ML inference code; allows model swapping without touching pipeline or scoring |
| **Called by** | `inspection_pipeline.py`, `batch_detect.py`, `api/main.py` (health check) |
| **Calls** | `ultralytics.YOLO` |
| **Important functions** | `load_model()`, `detect()`, `results_to_detections()`, `save_annotated()` |
| **Inputs** | Image file path (str/Path), confidence threshold (float), model path, imgsz (int) |
| **Outputs** | `(List[dict], np.ndarray)` — detection dicts + annotated BGR image |
| **Related feature** | Mode 1 — Detection |

**Detection dict format:**
```python
{
    "class_code": "D40",           # Canonical D-code
    "class_name": "Pothole",       # Human-readable label
    "confidence": 0.7823,          # 0.0 to 1.0
    "x_center": 0.52341,           # Normalized (0-1)
    "y_center": 0.68123,           # Normalized (0-1)
    "width": 0.24512,              # Normalized (0-1)
    "height": 0.18923              # Normalized (0-1)
}
```

**Class normalization maps:**
```python
CLASS_CODE = {
    "D00": "D00", "D10": "D10", "D20": "D20", "D40": "D40",
    "longitudinal_crack": "D00", "transverse_crack": "D10",
    "alligator_crack": "D20", "pothole": "D40"
}
CLASS_LABEL = {
    "D00": "Longitudinal Crack", "D10": "Transverse Crack",
    "D20": "Alligator Crack", "D40": "Pothole"
}
```

**Current model:** `models/best.pt` — 4-class (D00/D10/D20/D40), roadwise_v2, 6.06 MB  
**Default confidence:** 0.15 (in this file) — NOTE: pipeline overrides to 0.25 by default

---

### `src/scoring/health_score.py`
| Field | Detail |
|---|---|
| **Responsibility** | Converts YOLO detections into Condition Score (0–100) |
| **Why it exists** | Provides a single, explainable physical degradation index from raw bounding boxes |
| **Called by** | `inspection_pipeline.py` Step 6 |
| **Calls** | Only Python standard library (`math`) |
| **Important functions** | `calculate_condition()`, `detection_severity()`, `_overlap_fraction()` |
| **Inputs** | `detections: List[dict]`, `min_confidence: float` |
| **Outputs** | `{damage_load, condition_score, health_score, detections_used}` |
| **Related feature** | Mode 1 — Scoring |

**Formula:** `Condition = 100 * exp(-damage_load / 2.0)`  
See `docs/SCORING_METHODOLOGY.md` for full derivation.

---

### `src/scoring/risk_score.py`
| Field | Detail |
|---|---|
| **Responsibility** | Converts condition score + road context into Risk Score, Priority, and explanation |
| **Why it exists** | Roads with same damage are more urgent near hospitals/schools — context amplifies physical damage |
| **Called by** | `inspection_pipeline.py` Step 7 |
| **Calls** | Nothing (pure Python math + dict lookups) |
| **Important functions** | `analyze_risk()`, `calculate_damage_level()`, `calculate_context_factor()`, `calculate_risk_score()`, `get_priority()` |
| **Inputs** | `health_score` (float), `road_type` (str), `traffic` (str), `location_sensitivity` (str) |
| **Outputs** | `{health_score, damage_level, context_factor, risk_score, maintenance_priority, priority_description, explanation}` |
| **Related feature** | Mode 1 — Scoring |

**Key constants:** `MULTIPLIER_MIN=0.6`, `MULTIPLIER_MAX=1.6`, `DAMAGE_REF=40.0`  
**Priority bands:** `CRITICAL=75, HIGH=50, MEDIUM=25`

---

### `src/database/database.py`
| Field | Detail |
|---|---|
| **Responsibility** | All SQLite read and write operations |
| **Why it exists** | Centralizes all DB access; prevents SQL scattered across modules |
| **Called by** | `inspection_pipeline.py` (write), `api/main.py` (read) |
| **Calls** | `sqlite3` standard library |
| **Important functions** | `create_tables()`, `save_inspection()`, `get_inspection()`, `get_all_inspections()`, `get_inspection_stats()` |
| **Inputs** | Inspection result dicts (write); integer IDs (read) |
| **Outputs** | `List[dict]` (inspections) or `dict` (single record or stats) |
| **Related feature** | Mode 1 (write) + Mode 2 (read) |

**Database location:** `data/roadwise.db`  
**Tables:** `inspections` (parent) + `detections` (child, FK with CASCADE DELETE)  
**Indexes:** `priority`, `state`, `city`, `(latitude, longitude)`, `inspection_id`

---

### `frontend/src/api/client.js`
| Field | Detail |
|---|---|
| **Responsibility** | Frontend HTTP client — all API calls go through here |
| **Why it exists** | Centralizes base URL and request logic; prevents hardcoded URLs across components |
| **Called by** | `LandingPage.jsx`, `AuthorityDashboard.jsx` |
| **Calls** | Browser `fetch` API |
| **Important functions** | `inspectRoad()`, `getInspections()`, `getDashboardStats()`, `getInspectionDetail()` |

---

### `frontend/src/Pages/LandingPage.jsx`
| Field | Detail |
|---|---|
| **Responsibility** | Mode 1 UI controller — manages inspection workflow from upload to results |
| **Why it exists** | Main citizen/inspector interface for submitting road inspections |
| **Called by** | `App.jsx` (when mode = 'inspect') |
| **Calls** | `ImageUploader`, `ContextForm`, `InspectionResults`, `api/client.js:inspectRoad()` |
| **State managed** | Current image, form data, loading state, inspection result |
| **Related feature** | Mode 1 — Road Inspection |

---

### `frontend/src/Pages/AuthorityDashboard.jsx`
| Field | Detail |
|---|---|
| **Responsibility** | Mode 2 UI controller — displays aggregated inspection analytics and map |
| **Why it exists** | Authority/municipal decision-maker interface for maintenance prioritization |
| **Called by** | `App.jsx` (when mode = 'dashboard') |
| **Calls** | `MetricCards`, `GeographicMap`, `RankingTable`, `InspectionDetailModal`, `api/client.js:getInspections()`, `getDashboardStats()` |
| **Key pattern** | `Promise.all([getInspections(), getDashboardStats()])` — parallel fetch; derives stats client-side as fallback if API fails |
| **State managed** | inspections list, stats, loading, error, selected inspection, map focus |
| **Related feature** | Mode 2 — Authority Dashboard |

---

### `frontend/src/components/Dashboard/GeographicMap.jsx`
| Field | Detail |
|---|---|
| **Responsibility** | Interactive Leaflet map showing inspection locations with priority-colored pins |
| **Called by** | `AuthorityDashboard.jsx` |
| **Inputs** | `inspections[]` (with lat/long), `focusInspection` (for auto-pan) |
| **Features** | Custom SVG pins (red=CRITICAL, orange=HIGH, yellow=MEDIUM, green=LOW), click to select, auto-zoom |

---

### `frontend/src/components/Dashboard/RankingTable.jsx`
| Field | Detail |
|---|---|
| **Responsibility** | Sortable, filterable table of all inspections |
| **Called by** | `AuthorityDashboard.jsx` |
| **Inputs** | `inspections[]`, filter state |
| **Features** | Filter by priority/road type/city, search, row click → map focus + detail modal |

---

### `frontend/src/components/InspectionResults.jsx`
| Field | Detail |
|---|---|
| **Responsibility** | Displays full inspection report to the user after submission |
| **Called by** | `LandingPage.jsx` |
| **Shows** | Annotated image with bounding boxes, detection list, condition score gauge, risk score gauge, priority badge, recommendation text |

---

## Call Graph — Mode 1 Inspection

```
User clicks "Submit"
  └→ LandingPage.jsx:handleSubmit()
       └→ api/client.js:inspectRoad(formData)
            └→ POST /api/inspections/inspect
                 └→ api/main.py:inspect_road()
                      └→ inspection_pipeline.py:run_inspection()
                           ├→ validate_image_bytes()
                           ├→ extract_gps_from_exif()
                           ├→ predict.py:detect()
                           │    └→ YOLO model inference
                           ├→ health_score.py:calculate_condition()
                           ├→ risk_score.py:analyze_risk()
                           ├→ database.py:save_inspection()
                           └→ build_pipeline_result()
                 └→ JSON response (201 Created)
  └→ InspectionResults.jsx renders scores + annotated image
```

## Call Graph — Mode 2 Dashboard

```
User opens Dashboard
  └→ AuthorityDashboard.jsx:useEffect on mount
       └→ Promise.all([
            api/client.js:getInspections()      → GET /api/inspections
            api/client.js:getDashboardStats()   → GET /api/dashboard/stats
          ])
            ├→ database.py:get_all_inspections()   (LEFT JOIN + ORDER BY risk_score DESC)
            └→ database.py:get_inspection_stats()  (single-pass aggregate query)
  └→ MetricCards.jsx renders KPI numbers
  └→ GeographicMap.jsx renders Leaflet map with pins
  └→ RankingTable.jsx renders filterable table
       └→ row click → InspectionDetailModal.jsx
            └→ api/client.js:getInspectionDetail(id)
                 └→ GET /api/inspections/{id}
                      └→ database.py:get_inspection(id)
```

---

## Files That Are Historical / Not Active in Production

These files exist in the repository but are **not called by any active module**. They are historical experiment scripts.

| File | Why it exists | Status |
|---|---|---|
| `src/detection/audit_rdd_country.py` | Dataset country filtering script | Historical |
| `src/detection/build_extra_dataset.py` | Dataset builder | Historical |
| `src/detection/calibrate_thresholds.py` | Confidence calibration experiment | Historical |
| `src/detection/evaluate_detection_methods.py` | Evaluation experiment | Historical |
| `src/detection/evaluate_full_validation.py` | Validation evaluation | Historical |
| `src/detection/evaluate_roi_validation.py` | ROI experiment | Historical |
| `src/detection/make_candidate_dataset.py` | Candidate dataset builder | Historical |
| `src/detection/roi_detect.py` | ROI detection experiment | Historical |
| `src/preprocessing/voc_to_yolo.py` | Earlier version of annotation_converter | Duplicate |
| `src/preprocessing/eda_rdd2022.py` | Dataset EDA script | Historical |
| `src/scoring/validate_scoring.py` | Manual scoring validation | Historical |
| `scratch/*.py` (10 files) | Dataset verification, notebook generators | One-time use |
| `.backup_checkpoint/` | Manual backup of 3 files | Vestigial |
| `ml-pipeline/*.py` | Earlier training pipeline | Historical |

