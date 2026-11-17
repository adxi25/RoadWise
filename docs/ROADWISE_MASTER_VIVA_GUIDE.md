# RoadWise — Master Faculty Viva & Technical Code Defense Handbook

> **Project Title:** RoadWise: Autonomous Pavement Distress Detection, Condition Telemetry, and Municipal Maintenance Prioritization  
> **Evaluation Stage:** Final / Capstone Evaluation & Technical Viva  
> **Authors / Team Members:**  
> - **Aditya** (Enrollment No: `s25cseu0806`)  
> - **Khushal Aggarwal** (Enrollment No: `s25cseu0812`)  
> - **Mahi Gupta** (Enrollment No: `s25cseu0833`)  
> **Core Stack:** Ultralytics YOLOv8s Dual-Model Architecture, FastAPI (Python 3.14), React 19 + Vite + Tailwind CSS, SQLite with WAL, Leaflet.js GIS  

---

## Quick Navigation Index

1. [60-Second Project Elevator Pitch](#1-60-second-project-elevator-pitch)
2. [UI-to-Backend Code Map (What You See on Screen → Exact Line in Code)](#2-ui-to-backend-code-map)
3. [Deep-Learning Architecture (Dual-Model, Multi-Scale Fusion, F1 Score)](#3-deep-learning-architecture)
4. [Scoring Mathematics & Algorithms (PCI Decay & Context Risk)](#4-scoring-mathematics--algorithms)
5. [Database, Geospatial & Ward Clustering](#5-database-geospatial--ward-clustering)
6. [Top 25 Viva Questions & Exact Faculty Answers](#6-top-25-viva-questions--exact-faculty-answers)
7. [Repository File Guide (Which File Does What)](#7-repository-file-guide)

---

## 1. 60-Second Project Elevator Pitch

> *"Good morning, Professors. Our project is **RoadWise**, an automated civil infrastructure platform that transforms standard road surface photography into objective pavement condition ratings and prioritized municipal repair queues.*
>
> *Traditional road surveys rely on manual visual logging or expensive laser profilometer vans. This causes severe inspection backlogs, subjective road grading, and reactive rather than predictive maintenance.*
>
> *RoadWise solves this through an integrated two-mode architecture:*
> 1. **Mode 1 (Citizen / Field Inspector AI Pipeline):** *A user captures a road surface photo along with traffic density, road category, and school/hospital proximity. Our backend executes a **Dual-Model YOLOv8s Multi-Scale Fusion** architecture (640px + 1280px NMS pass) to detect structural distress across three classes: Potholes (D40), Alligator fatigue cracking (D20), and Linear fissures (D00). An exponential Pavement Condition Index (PCI) formula calculates surface health (0–100), which is modulated by contextual multipliers to assign an actionable maintenance band: CRITICAL, HIGH, MEDIUM, or LOW.*
> 2. **Mode 2 (Authority Command Dashboard):** *Superintendents access an interactive GIS map and dynamic priority table. Roads are clustered within 150m corridors using the Haversine formula, preventing duplicate dispatching and allowing instant contractor CSV work order exports.*
>
> *The system achieves 32/32 passing integration tests, runs completely offline on edge hardware, and ensures zero runtime hallucination through strict mathematical bounds."*

---

## 2. UI-to-Backend Code Map

When the faculty asks: **"You showed this on the screen—where is the code for it in the backend?"**, open this table:

| UI Screen & Visual Feature | Frontend Component & Line | Backend File & Function | Exact Code Lines | What the Code Does |
|---|---|---|---|---|
| **Landing Page Telemetry Card & Pipeline** | `frontend/src/Pages/LandingPage.jsx` (L15-L85) | `api/main.py` & `src/scoring/health_score.py` | `health_score.py` L125-L155 | Renders interactive 3-stage pipeline (Citizen Ingestion → Dual AI → Dispatch) and sample condition rating |
| **Citizen Photo Upload & Dropzone** | `frontend/src/components/ImageUploader.jsx` (L20-L80) | `src/pipeline/inspection_pipeline.py` | `inspection_pipeline.py` L55-L95 (`validate_image_bytes`) | Validates image MIME type, magic bytes, ensures resolution > 200px, caps size at 20MB |
| **Ward & Location Reverse Geocoding** | `frontend/src/components/ContextForm.jsx` (L404-L415) | OpenStreetMap Nominatim API / `api/main.py` | `ContextForm.jsx` L408 (`data.address.suburb \|\| data.address.neighbourhood`) | Reverse-geocodes GPS coordinates into municipal Ward / Area string stored in database |
| **Road Type, Traffic, Facility Selectors** | `frontend/src/components/ContextForm.jsx` (L180-L280) | `src/scoring/risk_score.py` | `risk_score.py` L45-L85 (`ROAD_TYPE_WEIGHT`, `TRAFFIC_WEIGHT`) | Converts dropdown selections into mathematical weights (e.g., National Highway = 1.0, Hospital = 0.40) |
| **"Start Inspection" Form Submission** | `frontend/src/Pages/CitizenReportPage.jsx` (L110-L165) | `api/main.py` | `main.py` L80-L140 (`@app.post("/analyze")`) | Accepts multipart FormData, triggers end-to-end `run_inspection()`, returns JSON payload |
| **Dual-Model Inference & Box Rendering** | `frontend/src/Pages/CitizenReportPage.jsx` (L210-L245) | `src/detection/predict.py` | `predict.py` L364-L402 (`detect`) | Loads `pothole_best.pt` + `experiment_c_best.pt`, fuses detections, draws color-coded OpenCV boxes |
| **Condition Score Gauge (0–100)** | `frontend/src/components/InspectionResults.jsx` (L60-L110) | `src/scoring/health_score.py` | `health_score.py` L125-L165 (`calculate_condition`) | Computes $100 \times e^{-\frac{\text{Damage Load}}{2.0}}$ with overlap discounting |
| **Context Risk Score & Priority Badge** | `frontend/src/components/InspectionResults.jsx` (L115-L160) | `src/scoring/risk_score.py` | `risk_score.py` L180-L225 (`analyze_risk`) | Computes Multiplicative Context Risk; maps to CRITICAL / HIGH / MEDIUM / LOW bands |
| **Authority Portal Login (`admin123`)** | `frontend/src/App.jsx` (L191-L199) | `frontend/src/App.jsx` | `App.jsx` L192 (`password === "admin123"`) | Client-side session gate providing instant access to municipal management Mode 2 |
| **GIS Pavement Map (Leaflet Pins)** | `frontend/src/components/Dashboard/GeographicMap.jsx` (L45-L120) | `api/main.py` | `main.py` L145-L175 (`@app.get("/reports")`) | Fetches all persisted inspections from SQLite and plots pins color-coded by maintenance priority |
| **150m Corridor Multi-Report Cluster** | `frontend/src/components/Dashboard/RankingTable.jsx` (L180-L210) | `src/database/database.py` | `database.py` L220-L260 (`get_nearby_reports`) | Uses Haversine spherical distance formula ($\le 150\text{m}$) to flag repeated grievances on the same road |
| **Contractor Work Order CSV Export** | `frontend/src/Pages/AuthorityDashboard.jsx` (L130-L160) | `api/main.py` | `main.py` L210-L245 (`@app.get("/export-csv")`) | Generates downloadable CSV containing Report ID, GPS, Ward, Priority, and Defect Breakdown |

---

## 3. Deep-Learning Architecture

### The Dual-Model Specialist Design
RoadWise does **not** rely on a naive, single generalist model. Pavement distresses have completely conflicting aspect ratios:
- **Potholes (D40):** Compact, elliptical, high depth/contrast cavities.
- **Cracks (D00 / D20):** Thin, low-contrast, extended fissures stretching across hundreds of pixels.

```
Incoming Road Image
        │
        ├── Pass 1: models/pothole_best.pt  ──> Filters ONLY D40 Potholes
        │
        └── Pass 2: models/experiment_c_best.pt ──> Filters D00 Linear & D20 Alligator Cracks
        │
        ▼
Multi-Scale NMS Spatial Fusion (predict.py L364)
        │
        ▼
Unified Canonical Detections: [{class_code, confidence, x_center, y_center, width, height}]
```

### Multi-Scale NMS Fusion (640px + 1280px)
- **Where is it in code?** [`src/detection/predict.py`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/src/detection/predict.py#L273-L354)
- **How it works:**
  - `imgsz == 0` (default) triggers two concurrent passes:
    1. Pass at **640×640 px**: Detects broad surface distress without background texture false positives.
    2. Pass at **1280×1280 px**: Preserves fine sub-pixel hairline fissures (D00).
  - `fuse_multi_scale_detections()` applies Non-Maximum Suppression with IoU threshold = 0.45, retaining fine cracks while discarding redundant bounding boxes.

### Why 960px Failed (The Resolution Experiment)
Faculty may ask: *"Why not simply run inference at 960px?"*  
Refer directly to [`results/metrics/full_validation_resolution_comparison.csv`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/results/metrics/full_validation_resolution_comparison.csv):
- **640px:** Precision = **50.56%**, Recall = 38.56%, mAP50 = **0.374**
- **960px:** Precision = **37.34%**, Recall = 30.17%, mAP50 = **0.308**
- **Explanation:** Naive upscaling to 960px introduces high-frequency asphalt noise and shadow edges, resulting in a **13.2% drop in Precision**. Multi-Scale Fusion solves this by only allowing high-confidence hairline fissures from the high-resolution pass.

### The Truth About F1 Score in RoadWise
Faculty question: *"Where is F1 score calculated in your code, and why is it used?"*
- **Accurate Viva Answer:**
  > *"F1 score is **not** calculated at runtime inference. Calculating F1 at inference is mathematically impossible because inference images do not have ground-truth labels.*
  > 
  > *F1 score ($2 \times \frac{P \times R}{P + R}$) was used **strictly during model evaluation and checkpoint selection**. Ultralytics automatically calculates validation F1 at each epoch. We evaluated model checkpoints and selected `experiment_c_best.pt` because its F1 score peaked on the validation split, achieving a **+10.8% recall gain on linear cracks** (from 62.5% to 73.33%).*
  > 
  > *In the live application, the output metric is the **Pavement Condition Index (0–100)** and **Context Risk Score (0–100)**."*
- **Proof File:** Open [`runs/detect/val-2/BoxF1_curve.png`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/runs/detect/val-2/BoxF1_curve.png) or [`training_artifacts/results.csv`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/training_artifacts/results.csv).

---

## 4. Scoring Mathematics & Algorithms

### 1. Pavement Condition Index (PCI) Formula
- **Code:** [`src/scoring/health_score.py`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/src/scoring/health_score.py#L125-L165)
- **Mathematical Form:**
  $$\text{Condition Score} = 100 \times \exp\left(-\frac{\text{Damage Load}}{K}\right)$$
  Where $K = 2.0$ (calibrated civil decay constant).
- **Severity per Bounding Box:**
  $$\text{Severity}_i = W_{\text{class}} \times \left(0.5 + 0.5 \times \text{conf}_i\right) \times \max\left(0.40, \sqrt{\frac{\text{Area}_i}{0.04}}\right)$$
- **Class Weights ($W_{\text{class}}$):**
  - **Pothole (D40):** `1.00` (Direct structural danger to tires and chassis)
  - **Alligator Crack (D20):** `0.80` (Base course structural fatigue failure)
  - **Linear Crack (D00):** `0.50` (Surface level thermal / shrinkage crack)
- **Overlap Discounting:** When multiple boxes of the same defect class overlap (IoU > 0.30), secondary boxes are discounted by $0.40\times$ to prevent penalizing the same defect twice.
- **Clean Road Invariant:** If zero distresses are detected, $\text{Damage Load} = 0 \implies \text{Condition} = 100.00$.

### 2. Context-Calibrated Risk Multiplier
- **Code:** [`src/scoring/risk_score.py`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/src/scoring/risk_score.py#L180-L230)
- **Damage Level:**
  $$\text{Damage Level} = \min\left(100, \frac{100 - \text{Condition}}{40} \times 100\right)$$
  *(A road with condition $\le 60$ hits maximum 100 base damage).*
- **Context Factor ($C$):**
  $$C = 0.30 \times W_{\text{road}} + 0.30 \times W_{\text{traffic}} + 0.40 \times W_{\text{facility}}$$
  - **Road Types:** National Highway (`1.00`), State Highway (`0.80`), Main City (`0.60`), Local Street (`0.40`), Rural (`0.20`).
  - **Traffic Densities:** Very High (`1.00`), High (`0.75`), Medium (`0.50`), Low (`0.25`), Very Low (`0.10`).
  - **Facility Proximity:** Hospital / Emergency (`1.00`), School Zone (`0.85`), Transit Hub (`0.70`), Commercial (`0.40`), Residential (`0.25`), None (`0.00`).
- **Context Multiplier:**
  $$\text{Multiplier} = 0.60 + 1.00 \times C \quad \in [0.60, 1.60]$$
- **Final Risk Score:**
  $$\text{Risk Score} = \text{Damage Level} \times \text{Multiplier} \quad (\text{Clamped } [0, 100])$$
- **Zero-Risk Invariant:** If road is pristine ($\text{Condition} = 100$), $\text{Damage Level} = 0 \implies \text{Risk} = 0.00$ even on a high-speed National Highway near a hospital.
- **Priority Threshold Bands:**
  - $[75, 100]$: **CRITICAL** (Red Badge — Immediate contractor work order)
  - $[50, 75)$: **HIGH** (Orange Badge — Schedule within 7 calendar days)
  - $[25, 50)$: **MEDIUM** (Yellow Badge — Routine maintenance queue)
  - $[0, 25)$: **LOW** (Green Badge — Periodic monitoring)

---

## 5. Database, Geospatial & Ward Clustering

### 1. SQLite Relational Schema
- **File:** [`src/database/database.py`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/src/database/database.py#L30-L115)
- **Table `inspections`:** Stores report metadata (`id`, `timestamp`, `condition_score`, `risk_score`, `priority`, `latitude`, `longitude`, `ward`, `road_type`, `traffic`, `facility`, `status`).
- **Table `detections`:** Normalized 1-to-many child table (`id`, `inspection_id`, `class_code`, `class_name`, `confidence`, `x_center`, `y_center`, `width`, `height`).
- **Foreign Key Cascade:** `PRAGMA foreign_keys = ON;` deleting a report cleanly removes all associated detection records.

### 2. 150m Haversine Corridor Clustering
- **Code:** [`src/database/database.py`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/src/database/database.py#L220-L260)
- **Formula:**
  $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
- **Purpose:** In municipal reporting, multiple citizens frequently photograph the same pothole from different angles within 50–150 meters. The database queries nearby historical inspections ($\le 150\text{m}$) and groups them into a single maintenance corridor, preventing double crew dispatching.

---

## 6. Top 25 Viva Questions & Exact Faculty Answers

### General & Architecture
1. **Q: Why did you choose YOLOv8 over Faster R-CNN?**  
   *A:* Faster R-CNN uses a two-stage Region Proposal Network (RPN) that requires ~150–250ms per frame. YOLOv8 is an anchor-free single-stage detector with a decoupled head that executes in 30–80ms, making it suitable for edge mobile deployment and video dashcams.
2. **Q: What is the benefit of FastAPI over Flask or Django?**  
   *A:* FastAPI supports native Python asynchronous I/O (`async`/`await`), auto-validates payloads via Pydantic schemas, generates OpenAPI documentation automatically, and handles concurrent image uploads without blocking worker threads.
3. **Q: Why SQLite instead of PostgreSQL?**  
   *A:* SQLite is zero-configuration, resides in a single file (`data/roadwise.db`), has zero memory daemon overhead, and provides full ACID compliance with Write-Ahead Logging (WAL) and B-Tree indexes.

### Computer Vision & Datasets
4. **Q: What is the Dual-Model Architecture?**  
   *A:* We use two specialized YOLOv8 models: `pothole_best.pt` exclusively detects D40 Potholes, while `experiment_c_best.pt` detects D00 Linear and D20 Alligator cracks. Their bounding boxes are combined via Multi-Scale NMS in `predict.py` line 364.
5. **Q: Why did you drop the transverse crack (D10) class?**  
   *A:* In dataset exploratory data analysis ([`results/figures/class_distribution.png`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/results/figures/class_distribution.png)), transverse cracks had only 68 instances compared to 3,187 potholes and 2,021 alligator cracks. In validation, transverse crack yielded only 1 single detection ([`results/metrics/val_detection_summary.csv`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/results/metrics/val_detection_summary.csv)). To eliminate severe class imbalance and false negatives, transverse and longitudinal fissures were unified into the single civil class **Linear Crack (D00)**.
6. **Q: How does the system handle high-resolution photos?**  
   *A:* Via Multi-Scale Feature Fusion (`predict.py` L273). The image is processed at both 640px and 1280px. High-resolution 1280px boxes are filtered to only retain hairline linear cracks, and NMS merges the predictions.
7. **Q: Did you evaluate F1 score?**  
   *A:* Yes, during training validation. Ultralytics computed precision-recall curves and F1 curves across all epochs ([`runs/detect/val-2/BoxF1_curve.png`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/runs/detect/val-2/BoxF1_curve.png)). Checkpoint selection was governed by the peak validation F1 score.

### Scoring & Civil Engineering
8. **Q: How is the Pavement Condition Index (PCI) calculated?**  
   *A:* Using exponential decay: $\text{Condition} = 100 \times \exp(-\text{Damage Load} / 2.0)$. Each defect contributes according to its class weight, confidence, and square-root area factor.
9. **Q: Why square root of bounding box area?**  
   *A:* Direct area ($w \times h$) grows quadratically and would cause a single large bounding box to artificially collapse the condition score to 0. A square root ($\sqrt{\text{Area}}$) provides sublinear scaling matching standard civil distress guidelines.
10. **Q: Can a pristine road ever get a high risk score?**  
    *A:* No. By mathematical design (`risk_score.py` L215), $\text{Risk} = \text{Damage Level} \times \text{Multiplier}$. If $\text{Condition} = 100$, $\text{Damage Level} = 0$, guaranteeing $\text{Risk} = 0.00$ regardless of how high traffic or facility sensitivity is.

### UI & Municipal Integration
11. **Q: How does the Authority Dashboard prevent duplicate work orders?**  
    *A:* Using Haversine 150m corridor clustering (`database.py` L220). If multiple reports fall within a 150m corridor, they are linked to the same primary incident.
12. **Q: How is the Ward detected?**  
    *A:* In `ContextForm.jsx` L408, the interactive GPS pin calls OpenStreetMap Nominatim reverse geocoding to resolve latitude/longitude into suburb or municipal ward names automatically.

---

## 7. Repository File Guide

| File / Folder Path | Live App Role | Key Function / Responsibility |
|---|---|---|
| `api/main.py` | 🟢 Backend Entry | Exposes `/analyze`, `/reports`, `/export-csv` endpoints |
| `src/detection/predict.py` | 🟢 Vision Layer | Executes Dual-Model YOLOv8s Multi-Scale NMS Fusion |
| `src/scoring/health_score.py` | 🟢 Civil Math | Calculates exponential Pavement Condition Index (0–100) |
| `src/scoring/risk_score.py` | 🟢 Context Engine | Computes contextual risk score and assigns priority band |
| `src/pipeline/inspection_pipeline.py` | 🟢 Orchestrator | Glues validation, prediction, scoring, and database persistence |
| `src/database/database.py` | 🟢 Storage Layer | SQLite transactions, foreign keys, 150m corridor clustering |
| `models/pothole_best.pt` | 🟢 Neural Weights | Fine-tuned YOLOv8s pothole detection checkpoint |
| `models/experiment_c_best.pt` | 🟢 Neural Weights | 2-class YOLOv8s crack detection checkpoint |
| `frontend/src/` | 🟢 User Interface | React 19 + Tailwind Option B Minimalist Civic Portal |
| `scripts/verify_scoring_phase3.py` | 🟢 Test Utility | Runs 8 automated mathematical scoring validation checks |
| `scripts/evaluate_current_dual_model.py` | 🟢 Benchmark | Evaluates latency, detections, and throughput on real test frames |
| `results/figures/` | 🟢 Visual Proof | Evaluation graphs and class imbalance justification charts |
| `results/metrics/` | 🟢 Benchmark Data | Dual-model latency, resolution comparison, and validation summaries |
| `tests/` | 🟢 Test Suite | 32 comprehensive pytest unit and integration tests (All Passing) |
| `docs/` | 🟢 Academic Docs | Master Viva Guide and Official Project Report |
