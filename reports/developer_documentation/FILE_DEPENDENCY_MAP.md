# RoadWise — File Dependency Map & Complete Source Inventory

> **Document Version:** 1.0.0  
> **Scope:** Full Source Repository Topology, Caller/Callee Graph, Inter-Module Contracts  

---

## 1. Master Source File Inventory & Documentation Status

| File Path | Role & Primary Responsibility | Primary Callers (Inbound) | Primary Callees (Outbound) | External Libraries | Documentation Status |
|---|---|---|---|---|---|
| `api/main.py` | FastAPI REST API adapter; endpoints, static mounts, CORS, lifespan startup | React Frontend (`client.js`), Swagger Docs (`/docs`), cURL | `inspection_pipeline.py`, `database.py`, `predict.py` | `fastapi`, `starlette`, `pydantic`, `uvicorn` | `DOCUMENTED` |
| `src/detection/predict.py` | YOLOv8 object detection inference engine, weight caching, letterbox, NMS, visualization | `inspection_pipeline.py`, `api/main.py` | None | `ultralytics`, `torch`, `cv2` (OpenCV), `numpy` | `DOCUMENTED` |
| `src/scoring/health_score.py` | Road condition scoring engine (0-100); area penalties, defect counts, severity bands | `inspection_pipeline.py` | None | Pure Python math | `DOCUMENTED` |
| `src/scoring/risk_score.py` | Multiplicative risk scoring (0-100) & maintenance priority bands (CRITICAL to LOW) | `inspection_pipeline.py` | None | Pure Python math | `DOCUMENTED` |
| `src/pipeline/inspection_pipeline.py` | Mode 1 end-to-end inspection orchestrator; validation, EXIF GPS, detector, scoring, DB save | `api/main.py`, CLI execution | `predict.py`, `health_score.py`, `risk_score.py`, `database.py` | `PIL` (Pillow), `uuid`, `datetime` | `DOCUMENTED` |
| `src/database/database.py` | SQLite3 database schema, table creation, foreign keys, transactions, KPI queries | `inspection_pipeline.py`, `api/main.py` | SQLite3 file engine (`data/roadwise.db`) | `sqlite3`, `pathlib` | `DOCUMENTED` |
| `src/preprocessing/voc_to_yolo.py` | RDD2022 Pascal VOC XML to YOLO format converter & stratified 70/15/15 dataset splitter | Offline CLI / ML Pipeline | Filesystem I/O | `xml.etree.ElementTree`, `random`, `shutil` | `DOCUMENTED` |
| `src/preprocessing/eda_rdd2022.py` | Exploratory data analysis of RDD2022 India dataset; box geometry, class distribution plots | Offline CLI / Analysis | Matplotlib Agg engine | `pandas`, `numpy`, `matplotlib`, `PIL`, `tqdm` | `DOCUMENTED` |
| `ml-pipeline/01_dataset_audit.py` | Forensic image dataset audit; SHA256 deduplication, PIL verification, label parsing | ML Engineers / CLI | Filesystem I/O | `hashlib`, `PIL`, `logging` | `DOCUMENTED` |
| `ml-pipeline/03_prepare_dataset.py` | Dataset structuring, pseudo-label generation with baseline YOLO, 4-class mapping | ML Engineers / CLI | `ultralytics.YOLO` | `ultralytics`, `random`, `shutil` | `DOCUMENTED` |
| `ml-pipeline/06_train_v2.py` | Advanced YOLOv8 fine-tuning recipe (`imgsz=1280`, `freeze=10`, cosine LR, copy-paste) | ML Training Environment | `ultralytics.YOLO` | `ultralytics`, `torch`, `yaml` | `DOCUMENTED` |
| `frontend/src/api/client.js` | HTTP client adapter; fetch abstraction, static image path normalization, error unpacking | Frontend pages and components | Backend FastAPI endpoints | Native browser `fetch`, `FormData` | `DOCUMENTED` |
| `frontend/src/App.jsx` | Root React component; view routing, Mode 1 upload form state, health polling, GPS guard | `frontend/src/main.jsx` | `LandingPage.jsx`, `AuthorityDashboard.jsx`, `InspectionResults.jsx`, `client.js` | `react`, `lucide-react` | `DOCUMENTED` |
| `frontend/src/Pages/AuthorityDashboard.jsx` | Mode 2 Authority Dashboard container; parallel fetch, KPI aggregation, map/table sync | `frontend/src/App.jsx` | `MetricCards.jsx`, `GeographicMap.jsx`, `RankingTable.jsx`, `InspectionDetailModal.jsx` | `react`, `lucide-react` | `DOCUMENTED` |
| `frontend/src/components/Dashboard/GeographicMap.jsx` | Geospatial GIS visualization; Leaflet map, custom priority SVG pins, flyTo navigation | `AuthorityDashboard.jsx` | Leaflet.js runtime, OpenStreetMap | `leaflet`, `lucide-react` | `DOCUMENTED` |
| `frontend/src/components/Dashboard/RankingTable.jsx` | Decision-support table; memoized filters (priority, road type, city), sorting, pagination | `AuthorityDashboard.jsx` | `AuthorityDashboard.jsx` callbacks | `react`, `lucide-react` | `DOCUMENTED` |
| `frontend/src/Pages/LandingPage.jsx` | Public landing page; hero section, product feature showcase, complaint tracking CTA | `frontend/src/App.jsx` | None | `react`, `lucide-react` | `DOCUMENTED` |
| `frontend/src/components/Navbar.jsx` | Top navigation bar; branding, system health pill indicator, tab switcher | `frontend/src/App.jsx` | `client.js:checkHealth` | `react`, `lucide-react` | `DOCUMENTED` |
| `frontend/src/components/ImageUploader.jsx` | Drag-and-drop file upload zone, client image preview, file validation feedback | `frontend/src/App.jsx` | Browser DOM File API | `react`, `lucide-react` | `DOCUMENTED` |
| `frontend/src/components/ContextForm.jsx` | Operational context inputs: road type, traffic, sensitivity, live geolocation button | `frontend/src/App.jsx` | Browser Geolocation API | `react`, `lucide-react` | `DOCUMENTED` |
| `frontend/src/components/InspectionResults.jsx` | Mode 1 inspection output view; annotated image preview, defect summary, scores | `frontend/src/App.jsx` | `client.js:getImageUrl` | `react`, `lucide-react` | `DOCUMENTED` |
| `frontend/src/components/Dashboard/MetricCards.jsx` | Mode 2 summary KPI cards (Total, Critical, High, Avg Condition, Avg Risk) | `AuthorityDashboard.jsx` | None | `react`, `lucide-react` | `DOCUMENTED` |
| `frontend/src/components/Dashboard/InspectionDetailModal.jsx` | Deep-dive modal dialog for individual inspection; defect coordinates and original photo | `AuthorityDashboard.jsx`, `RankingTable.jsx` | `client.js:getImageUrl` | `react`, `lucide-react` | `DOCUMENTED` |
| `models/README.md` | Active checkpoint specifications, architecture, SHA256 hash, class index mapping | Developer reference | None | Markdown documentation | `DOCUMENTED` |
| `README.md` | Master project repository manual, quickstart guide, dual-mode feature overview | GitHub / Developer root | None | Markdown documentation | `DOCUMENTED` |

---

## 2. Inter-Module Dependency & Call Graph

### Mode 1 Call Chain (Synchronous Inspection)
```
[User Action: Submit]
        |
        v
frontend/src/App.jsx:handleAnalyze()
        |
        v
frontend/src/api/client.js:inspectRoad(formData)
        |  (HTTP POST multipart/form-data to /api/inspections/inspect)
        v
api/main.py:inspect_road()
        |
        v
src/pipeline/inspection_pipeline.py:run_inspection()
        |
        +---> src/pipeline/inspection_pipeline.py:validate_image_bytes()
        |
        +---> src/pipeline/inspection_pipeline.py:extract_gps()
        |
        +---> src/pipeline/inspection_pipeline.py:save_original_image() -> data/uploads/
        |
        +---> src/detection/predict.py:detect()
        |          |
        |          +---> src/detection/predict.py:load_model() -> models/best.pt
        |          +---> ultralytics.YOLO.predict()
        |          +---> cv2 drawing (annotated image)
        |
        +---> src/pipeline/inspection_pipeline.py:save_annotated_image() -> results/predictions/
        |
        +---> src/scoring/health_score.py:calculate_condition()
        |
        +---> src/scoring/risk_score.py:analyze_risk()
        |          |
        |          +---> calculate_damage_level()
        |          +---> calculate_context_factor()
        |          +---> calculate_risk_score()
        |          +---> get_priority()
        |
        +---> src/pipeline/inspection_pipeline.py:build_recommendation()
        |
        +---> src/database/database.py:save_inspection()
                   |
                   +---> SQLite INSERT inspections
                   +---> SQLite INSERT detections (for each bounding box)
                   +---> COMMIT
        |
        v
(JSON response serialized with static URL paths)
        |
        v
frontend/src/App.jsx -> <InspectionResults result={data} />
```

### Mode 2 Call Chain (Dashboard & Analytics)
```
[User Action: Open Authority Dashboard]
        |
        v
frontend/src/Pages/AuthorityDashboard.jsx:useEffect()
        |
        +---> frontend/src/api/client.js:getDashboardStats()
        |          |  (HTTP GET /api/dashboard/stats)
        |          v
        |     api/main.py:dashboard_stats()
        |          |
        |          v
        |     src/database/database.py:get_inspection_stats() -> SQLite Aggregation
        |
        +---> frontend/src/api/client.js:getInspections()
                   |  (HTTP GET /api/inspections)
                   v
              api/main.py:list_inspections()
                   |
                   v
              src/database/database.py:get_all_inspections() -> SQLite LEFT JOIN detections
        |
        v
[State Updated: inspections, stats]
        |
        +---> <MetricCards stats={stats} />
        +---> <GeographicMap inspections={inspections} focusInspection={selected} />
        +---> <RankingTable inspections={inspections} onFocusOnMap={panTo} onSelectInspection={openModal} />
        +---> (Optional Click) <InspectionDetailModal inspectionId={id} />
```

---

## 3. Shared Data Contracts & DTOs

### Contract 1: Mode 1 Inspection Result Payload
Returned by `POST /api/inspections/inspect` and stored in frontend state:
```typescript
interface InspectionResult {
  report_id: string;            // e.g. "RW-20261007-180530-A7F2"
  inspection_id: number;        // SQLite autoincrement primary key
  image: {
    original_path: string;      // "data/uploads/RW-...jpg"
    annotated_path: string;     // "results/predictions/RW-..._annotated.jpg"
    metadata: {
      width: number;
      height: number;
      format: string;
      size_mb: number;
    };
  };
  location: {
    latitude: number | null;
    longitude: number | null;
    state: string | null;
    city: string | null;
    area: string | null;
  };
  context: {
    road_type: string;
    traffic_level: string;
    location_sensitivity: string;
  };
  detections: Array<{
    class_id: number;           // 0: D00, 1: D10, 2: D20, 3: D40
    class_code: string;         // "D40"
    class_name: string;         // "pothole"
    confidence: number;         // 0.0 to 1.0
    bbox: [number, number, number, number]; // [xmin, ymin, xmax, ymax] in pixels
    x_center: number;           // normalized 0.0 to 1.0
    y_center: number;
    width: number;
    height: number;
  }>;
  detection_summary: {
    count: number;
    classes: Record<string, number>;
    highest_confidence: number;
    average_confidence: number;
  };
  condition: {
    condition_score: number;    // 0.0 to 100.0
    severity: string;           // "GOOD" | "FAIR" | "POOR" | "CRITICAL"
    total_deductions: number;
    area_deductions: number;
    count_deductions: number;
  };
  risk: {
    damage_level: number;       // 0.0 to 100.0
    context_factor: number;     // 0.0 to 1.0
    risk_score: number;         // 0.0 to 100.0
    maintenance_priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    priority_description: string;
    explanation: string;
  };
  recommendation: string;
  created_at: string;           // ISO timestamp
}
```

### Contract 2: Mode 2 KPI Aggregation Payload
Returned by `GET /api/dashboard/stats`:
```typescript
interface DashboardStats {
  total_inspections: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  avg_condition_score: number;
  avg_risk_score: number;
  valid_gps_count: number;
}
```

---

## 4. Cross-Cutting Engineering Concerns

### 4.1 GPS Coordinate Resolution Hierarchy
To maximize spatial accuracy without failing on missing camera metadata:
1. **User Current Location:** If citizen/inspector clicks "Use My Current Location" in `ContextForm.jsx`, high-accuracy HTML5 browser geolocation coordinates are captured and sent via form payload.
2. **EXIF Fallback:** If coordinates are omitted in the form, `inspection_pipeline.py:extract_gps()` parses EXIF tag `0x8825`.
3. **Graceful Degradation:** If neither is available, coordinates remain `null`. The inspection completes successfully, condition and risk scores are computed, but the record is omitted from `<GeographicMap />` plotting while remaining fully searchable in `<RankingTable />`.

### 4.2 Error Handling & Resilience Policy
- **Image Corruption:** If Pillow cannot parse image headers, `ValueError` is raised, mapped to `HTTP 400 Bad Request` with an explanatory message.
- **Detector Failure:** If YOLO inference encounters a memory or driver fault, `RuntimeError` is raised, mapped to `HTTP 500 Internal Server Error` without crashing the Uvicorn worker process.
- **Database Faults:** Every DB transaction is wrapped in `try...except...finally`. If inserting child detections fails, `connection.rollback()` triggers, preserving database consistency.
- **Frontend Fallbacks:** If the backend dashboard stats endpoint is unavailable, `<AuthorityDashboard />` computes identical KPIs client-side from the inspections list.

