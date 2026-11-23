# RoadWise — Autonomous Road Distress Detection, Health Telemetry & Municipal Maintenance-Prioritization Platform

[![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.115-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%20%7C%20TailwindCSS-61DAFB.svg)](https://react.dev/)
[![YOLOv8](https://img.shields.io/badge/Computer%20Vision-Decoupled%20Dual--Model%20YOLOv8s-FF6F00.svg)](https://ultralytics.com/)
[![Database](https://img.shields.io/badge/Storage-SQLite%20WAL%20%2B%20Spatial%20Indexing-003B57.svg)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **RoadWise** is an enterprise-grade civic infrastructure intelligence platform that transforms raw smartphone, dashcam, and survey imagery into actionable municipal maintenance telemetry. Featuring a **Decoupled Dual-Model Computer Vision architecture**, an **Exponential Pavement Condition Index (PCI)** scoring engine, **Context-Calibrated Risk Triage**, **150m Haversine Corridor Clustering**, and a **React 19 Authority Command Dashboard**, RoadWise bridges the divide between computer vision detection and municipal public works execution.

---

## Academic Project Details & Capstone Team

* **Institution**: Bennett University, Greater Noida
* **Department**: Department of Computer Science and Engineering, School of Engineering and Applied Sciences
* **Project Title**: *RoadWise: Automated Road Distress Detection and Health Scoring*
* **Official Project Report Deliverable**: [`docs/Roadwise_Project_Report.docx`](docs/Roadwise_Project_Report.docx)

### Project Contributors (Team RoadWise)
| Name | Enrollment Number | Role & Focus |
|---|---|---|
| **Aditya** | `S25CSEU0806` | Computer Vision, Dual-Model Fusion & Spatial Pipelines |
| **Khushal Aggarwal** | `S25CSEU0812` | Full-Stack REST API Gateway, Relational Schema & Telemetry |
| **Mahi Gupta** | `S25CSEU0833` | Mathematical Scoring Engines, GIS Cartography & UX |

---

## Table of Contents
1. [Core Innovations & Engineering Breakthroughs](#core-innovations--engineering-breakthroughs)
2. [7-Stage End-to-End System Workflow](#7-stage-end-to-end-system-workflow)
3. [Decoupled Dual-Model Computer Vision Architecture](#decoupled-dual-model-computer-vision-architecture)
4. [Mathematical Scoring & Triage Engine](#mathematical-scoring--triage-engine)
   - [Pavement Condition Score (PCI Formulation)](#1-pavement-condition-score-physical-degradation)
   - [Context-Calibrated Maintenance Risk Triage](#2-context-calibrated-maintenance-risk-triage)
   - [The Clean Road Zero-Risk Invariant](#3-the-clean-road-zero-risk-invariant)
5. [Relational Persistence & 150m Corridor Clustering](#relational-persistence--150m-corridor-clustering)
6. [Authority Command Dashboard & GIS Telemetry](#authority-command-dashboard--gis-telemetry)
7. [Empirical Evaluation & Benchmark Metrics](#empirical-evaluation--benchmark-metrics)
8. [System Architecture & Directory Catalog](#system-architecture--directory-catalog)
9. [Quickstart & Installation Guide](#quickstart--installation-guide)
10. [RESTful API Gateway Reference](#restful-api-gateway-reference)
11. [License](#license)

---

## Core Innovations & Engineering Breakthroughs

Traditional municipal road condition assessment suffers from slow visual inspections, subjective contractor evaluations, and context-blind dispatch. RoadWise introduces four foundational engineering breakthroughs:

1. **Decoupled Dual-Model Specialist Heads**: Resolves the severe deep-learning feature competition between 3D volumetric shadow depressions (potholes) and 2D high-frequency planar fissures (hairline cracks). Instead of forcing a single backbone to compromise, RoadWise deploys isolated specialized YOLOv8s heads fused via Multi-Scale Non-Maximum Suppression (NMS).
2. **Multi-Scale Spatial Fusion ($640\text{px} + 1280\text{px}$)**: Macro-defects are captured at $640\text{px}$ while fine, thin hairline cracks are captured at $1280\text{px}$, merging predictions via an IoU $0.45$ deduplication stage.
3. **Multiplicative Context-Calibrated Triage**: Eliminates false positive municipal alarms by ensuring environmental multipliers (road class, traffic volume, trauma hospital proximity) *amplify* detected damage rather than synthesizing risk on undamaged roads.
4. **150m Spatial Corridor Clustering**: Groups geographically proximate citizen reports using the Haversine spherical distance metric, transforming isolated complaints into unified municipal work orders.

---

## 7-Stage End-to-End System Workflow

```
[1. Citizen / Inspector Ingestion]
   │ - Drag-and-drop road photo upload (CitizenReportPage.jsx)
   │ - Browser GPS pin drop (Leaflet map coordinates)
   │ - OSM Nominatim API reverse geocodes Ward/City
   │ - Operational context selection (Road Type, Traffic, Sensitive Facility)
   ▼
[2. REST API Gateway & Sanitization]
   │ - POST /api/inspections/inspect endpoint (api/main.py)
   │ - Magic-bytes validation & image boundary verification
   │ - Raw asset persistence: data/uploads/{report_id}.jpg
   ▼
[3. Decoupled Dual-Model Multi-Scale Fusion]
   │ - Head 1: models/pothole_best.pt  ──> Detects D40 Potholes
   │ - Head 2: models/experiment_c_best.pt ──> Detects D00 Linear & D20 Alligator Cracks
   │ - 640px Macroscopic pass + 1280px Fine hairline fissure pass
   │ - IoU 0.45 Multi-Scale NMS fusion & OpenCV annotation
   ▼
[4. Physical Condition Scoring (PCI)]
   │ - Formula: Condition = 100 * exp(-Damage_Load / 2.0)
   │ - Size Factor: min(1.0, max(0.40, sqrt(Area / Area_Ref)))
   │ - Intra-class overlap discounted by 40% (no double penalty)
   ▼
[5. Context-Calibrated Risk Triage]
   │ - Damage Level = min(100, (100 - Condition) / 40 * 100)
   │ - Context Factor = 0.30*Road + 0.30*Traffic + 0.40*Facility (0.6x to 1.6x)
   │ - Final Risk = Damage Level * Context Factor
   │ - Priority assignment: CRITICAL (>=75), HIGH (50-74.9), MEDIUM (25-49.9), LOW (<25)
   ▼
[6. ACID SQLite Persistence & 150m Corridor Clustering]
   │ - Atomic transaction: parent 'inspections' + child 'detections'
   │ - 150m Haversine algorithm clusters co-located road distress reports
   ▼
[7. Authority Command Dashboard & Dispatch]
   │ - Interactive Leaflet GIS map with Red/Orange/Yellow/Green markers
   │ - Priority ranking table with live Ward and status filtering
   │ - Single-click contractor work order CSV export (/export-csv)
   │ - Closed-loop maintenance lifecycle (PENDING -> IN_PROGRESS -> REPAIRED)
```

---

## Decoupled Dual-Model Computer Vision Architecture

In standard single-backbone object detectors, deep convolutional neural networks suffer from **gradient competition** when tasked with simultaneously detecting surface-level 2D micro-fissures and 3D volumetric depressions:

$$\mathcal{L}_{\text{total}} = \mathcal{L}_{\text{pothole}}(\text{depth shadows}) + \mathcal{L}_{\text{crack}}(\text{planar edges})$$

Under single-model training, the high contrast and clear interior boundaries of potholes dominate feature extraction gradients, leading to severe crack recall drop-offs. RoadWise resolves this through **Decoupled Asynchronous Specialization**:

```
                              Incoming Pavement Image
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
       [Pothole Specialist Head]                   [Crack Specialist Head]
       Path: models/pothole_best.pt                Path: models/experiment_c_best.pt
       Weights: 6.3 MB (YOLOv8s)                   Weights: 111.8 MB (YOLOv8s)
       Dataset: Pavement Pothole Benchmark         Dataset: RDD2022 Benchmark
       Detects: D40 Potholes                       Detects: D00 Linear & D20 Alligator
                   │                                           │
                   └─────────────────────┬─────────────────────┘
                                         ▼
                        [Multi-Scale Fusion Layer]
                   640px Macro Pass + 1280px High-Res Pass
                   IoU 0.45 Non-Maximum Suppression (NMS)
                                         │
                                         ▼
                     Unified Detections & Annotated Output
```

### Defect Class Taxonomy
* **`D40` — Pothole**: Sharp structural asphalt cavity with pronounced interior shadow contrast. Poses severe vehicle rim puncture and safety rollover hazards (Class Weight: `1.00`).
* **`D20` — Alligator (Fatigue) Cracking**: Interconnected polygonal mesh fissures denoting foundational sub-base fatigue and moisture infiltration (Class Weight: `0.80`).
* **`D00` — Linear Crack**: Longitudinal and transverse joint fissures parallel or perpendicular to traffic flow (Class Weight: `0.50`). *Note: Transverse fissures (`D10`) are merged into `D00` due to extreme class imbalance in training data (68 instances).*

---

## Mathematical Scoring & Triage Engine

The RoadWise telemetry engine translates raw detection geometry into civil engineering metrics.

### 1. Pavement Condition Score (Physical Degradation)

The physical road condition is computed via a non-linear exponential decay formula mapping structural distress to an index from **$100.00$ (pristine surface)** down to **$0.00$ (total structural failure)**:

$$\text{Condition Score} = 100.0 \times \exp\left( -\frac{\text{Damage Load}}{K} \right)$$

Where:
* **Steepness Scale Factor ($K = 2.0$)**: Calibrated so moderate road distress drops the score into actionable repair ranges while avoiding premature saturation.
* **Damage Load**: The cumulative sum of non-redundant defect severities:
  $$\text{Damage Load} = \sum_{i=1}^{N} \left[ \text{Severity}(d_i) \times (1.0 - \text{Overlap Discount}_i) \right]$$
* **Defect Severity**:
  $$\text{Severity}(d_i) = W(c_i) \times \left(0.5 + 0.5 \times \text{conf}_i\right) \times S(\text{area}_i, c_i)$$
* **Sublinear Size Scaling ($S$)**: Normalizes bounding box area against the 90th-percentile benchmark reference area:
  $$S(\text{area}_i, c_i) = \min\left(1.0, \, \max\left(0.40, \, \sqrt{\frac{\text{area}_i}{\text{AREA\_REF}(c_i)}}\right)\right)$$
  $$\text{AREA\_REF} = \{\text{D40}: 0.101, \, \text{D20}: 0.235, \, \text{D00}: 0.070\}$$
* **Intra-Class Overlap Discounting**: If two boxes of the *same class* overlap, the secondary detection is discounted by $40\%$ of its intersection area to prevent double-penalizing multi-box captures of a single defect.

---

### 2. Context-Calibrated Maintenance Risk Triage

Physical pavement distress cannot be prioritized purely by geometry; a deep pothole on a 100 km/h expressway or outside a trauma center requires faster municipal dispatch than one on an unpaved village lane.

$$\text{Risk Score} = \min\left(100.0, \, \text{Damage Level} \times \text{Context Multiplier}\right)$$

#### Step A: Stretched Damage Level
Because single-frame condition scores rarely drop below 30 without complete camera occlusion, damage is scaled against a reference threshold ($\text{DAMAGE\_REF} = 40.0$):
$$\text{Damage} = 100.0 - \text{Condition Score}$$
$$\text{Damage Level} = \min\left(100.0, \, \frac{\text{Damage}}{\text{DAMAGE\_REF}} \times 100.0\right)$$

#### Step B: Socio-Traffic Context Factor ($\in [0.0, 1.0]$)
$$\text{Context Factor} = \frac{0.30 \times S_{\text{road}} + 0.30 \times S_{\text{traffic}} + 0.40 \times S_{\text{facility}}}{100.0}$$

| Parameter | High Weight ($100$) | Medium Weight ($55 - 80$) | Low Weight ($10 - 40$) |
|---|---|---|---|
| **Road Type ($S_{\text{road}}$)** | National Highway / Expressway ($100$) | Main Arterial ($80$) | Residential ($40$), Village Lane ($25$) |
| **Traffic Density ($S_{\text{traffic}}$)** | Very High ($100$) | High ($80$), Medium ($55$) | Low ($30$), Very Low ($10$) |
| **Sensitive Facility ($S_{\text{facility}}$)** | Hospital / Trauma Center ($100$) | School Zone ($85$), Market ($65$) | None ($0$) |

#### Step C: Context Multiplier
$$\text{Context Multiplier} = 0.60 + 1.00 \times \text{Context Factor} \quad (\text{Range: } [0.60\times, \, 1.60\times])$$

#### Step D: Actionable Priority Tiers
* **`CRITICAL`** ($\text{Risk Score} \ge 75$): Immediate emergency road crew dispatch required within 24 hours.
* **`HIGH`** ($50 \le \text{Risk Score} < 75$): Maintenance required within 72 hours.
* **`MEDIUM`** ($25 \le \text{Risk Score} < 50$): Routine maintenance backlog.
* **`LOW`** ($\text{Risk Score} < 25$): Minor distress; passive monitoring.

---

### 3. The Clean Road Zero-Risk Invariant

A major flaw in naive additive risk models is that undamaged roads in sensitive locations trigger false emergency alerts:
$$\text{Additive Model (Flawed): } \text{Risk} = 0.5 \times (100 - \text{Condition}) + 0.5 \times \text{Context} \implies \text{Risk} = 50.0 \text{ (HIGH) for pristine hospital roads!}$$

RoadWise's multiplicative formulation mathematically guarantees the **Clean Road Zero-Risk Invariant**:
$$\text{Condition} = 100.00 \implies \text{Damage} = 0.00 \implies \text{Damage Level} = 0.00 \implies \mathbf{Risk = 0.00 \text{ (LOW)}}$$
Context acts strictly as an **amplifier of real detected physical damage**, never as a creator of phantom hazards.

---

## Relational Persistence & 150m Corridor Clustering

RoadWise utilizes an embedded ACID-compliant SQLite engine configured with **Write-Ahead Logging (WAL)** for concurrent non-blocking reads and writes:

```sql
-- Core Inspections Table
CREATE TABLE IF NOT EXISTS inspections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id TEXT UNIQUE NOT NULL,             -- Unique UUID tag (e.g. RW-20261122-123456-ABCD)
    image_path TEXT,                            -- Path to uploaded original photograph
    annotated_image_path TEXT,                  -- Path to rendered OpenCV bounding box image
    latitude REAL,                              -- Browser/EXIF GPS Latitude
    longitude REAL,                             -- Browser/EXIF GPS Longitude
    ward TEXT,                                  -- Municipal Ward resolved via OSM Nominatim
    city TEXT,                                  -- Municipality / City
    road_type TEXT,                             -- Highway, Arterial, Residential, etc.
    traffic_level TEXT,                         -- Very High, High, Medium, Low, Very Low
    location_sensitivity TEXT,                  -- Hospital, School, Market, None
    condition_score REAL,                       -- Physical Condition Score (0.0 to 100.0)
    risk_score REAL,                            -- Final Context-Calibrated Risk (0.0 to 100.0)
    priority TEXT,                              -- CRITICAL | HIGH | MEDIUM | LOW
    status TEXT DEFAULT 'PENDING',              -- PENDING | IN_PROGRESS | REPAIRED | REJECTED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Child Bounding Box Detections Table
CREATE TABLE IF NOT EXISTS detections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inspection_id INTEGER NOT NULL,             -- Foreign Key referencing inspections(id)
    class_code TEXT NOT NULL,                   -- D00, D20, D40
    class_name TEXT NOT NULL,                   -- Linear Crack, Alligator Crack, Pothole
    confidence REAL NOT NULL,                   -- PyTorch inference confidence
    x_center REAL, y_center REAL,               -- Normalized relative bounding box coordinates
    width REAL, height REAL,
    FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE
);
```

### 150m Haversine Corridor Clustering
When municipal road crews mobilize asphalt patching trucks, repairing isolated potholes individually is economically inefficient. RoadWise implements spatial corridor clustering via the **Haversine formula**:

$$d = 2R \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)} \right)$$

Where $R = 6,371,000\text{ m}$. Any inspection within $150\text{ m}$ of an existing report along the same street segment is automatically linked into a **Corridor Maintenance Cluster**, allowing authorities to dispatch a single contractor work order for the entire stretch.

---

## Authority Command Dashboard & GIS Telemetry

The frontend is implemented in **React 19** using **Vite**, **Tailwind CSS**, and **Leaflet.js**:

* **Interactive GIS Heatmap**: Displays all geolocated road hazards across the municipal boundary, using color-coded vector pins:
  * 🔴 **Red**: `CRITICAL` Priority ($\text{Risk} \ge 75$)
  * 🟠 **Orange**: `HIGH` Priority ($50 \le \text{Risk} < 75$)
  * 🟡 **Yellow**: `MEDIUM` Priority ($25 \le \text{Risk} < 50$)
  * 🟢 **Green**: `LOW` Priority ($\text{Risk} < 25$)
* **Fleet KPI Telemetry Cards**: Real-time municipal metrics summarizing total reports, critical alerts, average road health index, and average risk score.
* **Ward & Priority Filtering**: Sort and filter inspections by administrative ward, damage severity, or current repair status.
* **Single-Click Contractor Work Order CSV Export**: Generates standardized repair manifests containing GPS coordinates, defect counts, road classifications, and contractor priority rankings.
* **Closed-Loop Status Workflow**: Authority engineers can transition work orders through `PENDING` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `REPAIRED` $\rightarrow$ `REJECTED`.

---

## Empirical Evaluation & Benchmark Metrics

The RoadWise architecture was rigorously benchmarked across 83 training epochs on the **RDD2022 (India Subset)** benchmark and external pavement pothole datasets:

| Metric / Dimension | Baseline (Monolithic 4-Class YOLOv8s) | Experiment C (Crack Specialist YOLOv8s) | Live Decoupled Dual-Model Fusion |
|---|:---:|:---:|:---:|
| **Overall Defect Recall** | 38.6% | 51.4% | **63.1% (+24.5% surge)** |
| **Overall Precision** | 48.2% | 54.8% | **59.6%** |
| **Mean Average Precision (mAP@50)** | 42.1% | 49.3% | **53.8%** |
| **Pothole (`D40`) Detection** | High Confidence | N/A (Excluded) | **High Confidence (6.3 MB Head)** |
| **Linear Crack (`D00`) Detection** | Low Recall (<30%) | Moderate Recall | **Multi-Scale 1280px NMS Active** |
| **Alligator Crack (`D20`) Detection**| Slower Convergence | Optimized Recall | **Active Area Feature Capture** |
| **CPU Inference Latency** | 340 ms | 680 ms | **1266.6 ms (~1.26s on standard CPU)** |
| **GPU Inference Latency** | 22 ms | 38 ms | **~52 ms (Batch-optimized)** |

---

## System Architecture & Directory Catalog

```
RoadWise/
├── api/
│   ├── __init__.py                     # API package marker
│   └── main.py                         # FastAPI REST gateway, CORS, static routes, and endpoints
├── data/
│   ├── roadwise.db                     # Production SQLite database (WAL mode, foreign keys)
│   └── uploads/                        # Persistent storage for original uploaded road imagery
├── docs/
│   └── Roadwise_Project_Report.docx    # Official university project report deliverable
├── frontend/
│   ├── package.json                    # React 19, Vite, Tailwind CSS, Leaflet, Lucide-React
│   ├── vite.config.js                  # Vite configuration & backend proxy
│   └── src/
│       ├── App.jsx                     # Top-level application routing
│       ├── api/
│       │   └── client.js               # Axios API client adapter with error interceptors
│       ├── components/
│       │   ├── ContextForm.jsx         # Telemetry input form with GPS pin-drop & OSM Nominatim
│       │   ├── ImageUploader.jsx       # Drag-and-drop road photo uploader
│       │   ├── InspectionResults.jsx   # Telemetry results screen with dual-gauge visualizations
│       │   ├── ScoreGauge.jsx          # Circular SVG score gauge
│       │   └── Dashboard/
│       │       ├── GeographicMap.jsx   # Interactive Leaflet GIS map with color-coded markers
│       │       ├── MetricCards.jsx     # Authority KPI summary cards
│       │       └── RankingTable.jsx    # Priority-sorted inspection table with CSV export
│       └── Pages/
│           ├── CitizenReportPage.jsx   # Citizen / field inspector reporting portal
│           └── AuthorityDashboard.jsx  # Municipal decision-support command dashboard
├── models/
│   ├── pothole_best.pt                 # 6.3 MB Pothole Specialist Head (YOLOv8s)
│   └── experiment_c_best.pt            # 111.8 MB Crack Specialist Head (D00 + D20)
├── results/
│   ├── metrics/                        # EDA summaries, class distributions, and confusion matrices
│   └── predictions/                    # Output directory for OpenCV bounding-box annotated images
├── src/
│   ├── database/
│   │   └── database.py                 # SQLite helper, table creation, spatial 150m clustering
│   ├── detection/
│   │   ├── predict.py                  # Dual-model inference driver & Multi-Scale NMS fusion
│   │   └── batch_detect.py             # CLI batch processor for offline evaluation
│   ├── pipeline/
│   │   └── inspection_pipeline.py      # Master orchestrator connecting input -> CV -> scoring -> DB
│   └── scoring/
│       ├── health_score.py             # Physical Pavement Condition Index (PCI) engine
│       ├── risk_score.py               # Context-calibrated risk and priority triage engine
│       └── validate_scoring.py         # Pytest test harness verifying scoring invariants
├── tests/                              # Complete test suite (32 passing pytest invariant tests)
└── requirements.txt                    # Python dependencies
```

---

## Quickstart & Installation Guide

### Prerequisites
* **Python**: 3.10, 3.11, or 3.12
* **Node.js**: v18.0.0 or higher
* **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/adxi25/RoadWise.git
cd RoadWise
```

### 2. Backend Environment Setup
```bash
# Create and activate Python virtual environment
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# Linux / macOS:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cd ..
```

### 4. Running the Complete System Locally

**Terminal 1 — Start the FastAPI Backend:**
```bash
# From project root with venv activated:
python -m uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 — Start the React 19 Frontend:**
```bash
# From frontend/ directory:
cd frontend
npm run dev
```

* **Citizen Reporting Portal**: [http://localhost:5173/](http://localhost:5173/)
* **Authority Command Dashboard**: [http://localhost:5173/dashboard](http://localhost:5173/dashboard)
* **Backend API Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **Backend Health Check**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

### 5. Running the Test Suite
```bash
# Execute all 32 unit tests and scoring invariants
pytest -v
```

---

## RESTful API Gateway Reference

| HTTP Method | Route | Description |
|---|---|---|
| `GET` | `/api/health` | System health check, database status, and dual-model loading verification |
| `POST` | `/api/inspections/inspect` | Multipart ingestion: processes road image, runs dual-model inference, computes PCI & Risk, saves record |
| `GET` | `/api/inspections` | Retrieves paginated inspections with filters for `priority`, `city`, and `road_type` |
| `GET` | `/api/inspections/{id}` | Granular inspection details joined with child defect bounding boxes |
| `GET` | `/api/dashboard/stats` | Aggregated authority KPIs (Total, Critical, High, Avg Condition, Avg Risk) |
| `GET` | `/api/reports/track/{tracking_id}` | Public tracking endpoint for citizen submissions |
| `PATCH`| `/api/inspections/{id}/status` | Updates maintenance lifecycle status (`PENDING`, `IN_PROGRESS`, `REPAIRED`) |
| `GET` | `/api/inspections/nearby` | 150m Haversine spatial corridor clustering endpoint |
| `GET` | `/data/uploads/{filename}` | Static file stream for original uploaded road photos |
| `GET` | `/results/predictions/{filename}`| Static file stream for OpenCV annotated output photos |

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.  
Developed by **Team RoadWise** at **Bennett University** for civic road distress detection, automated condition telemetry, and municipal maintenance prioritization.
