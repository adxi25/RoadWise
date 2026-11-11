# RoadWise — Comprehensive Faculty Viva & Technical Code Guide
**Target Audience:** Final Year B.Tech CSE Project Evaluation / Technical Viva  
**Project Name:** RoadWise (Autonomous Road Distress Detection, Condition Telemetry & Maintenance Prioritization)  
**Last Updated:** 2026-11-11  

---

## 1. Project High-Level Pitch (How to Introduce the Project in 60 Seconds)

> *"Good morning, Professors. Our project is **RoadWise**, an end-to-end AI-powered road condition assessment and civic maintenance-prioritization system.*
>
> *Traditional road inspections require manual visual surveys, which are slow, subjective, expensive, and difficult to scale across thousands of kilometers of municipal or highway networks.*
>
> *RoadWise solves this through two integrated operating modes:*
> 1. **Mode 1 (AI Road Inspection):** *An inspector or citizen uploads a road image with road context (road type, traffic volume, location sensitivity like school/hospital zones). Our computer vision model (YOLOv8) detects surface defects—such as longitudinal, transverse, or alligator cracks and potholes. The pipeline then applies an exponential physical condition decay formula, followed by a context-multiplied risk model that assigns an actionable maintenance priority: CRITICAL, HIGH, MEDIUM, or LOW.*
> 2. **Mode 2 (Authority Maintenance Dashboard):** *Municipal decision-makers can view all historical inspections across a geographical Leaflet map and filterable data tables, answering the core municipal question: **'Out of all inspected roads, which roads require repair first?'***
>
> *The entire system is implemented using React and Vite on the frontend, FastAPI for high-throughput asynchronous backend orchestration, PyTorch and Ultralytics YOLOv8 for object detection, and SQLite with full relational integrity and indexing for local, zero-daemon data persistence."*

---

## 2. Technology Stack & Technical Justifications (Why We Chose Each Tool)

When faculty ask: *"Why did you use technology X instead of Y?"*, use these precise engineering arguments:

| Technology | Role | Faculty Question: "Why this over alternatives?" |
|---|---|---|
| **YOLOv8s (Ultralytics)** | Computer Vision / Object Detection | **Q: Why YOLOv8 over Faster R-CNN or SSD?**<br>A: YOLOv8 is a single-stage anchor-free detector. Unlike two-stage detectors (Faster R-CNN) that generate region proposals first, YOLO processes the image in a single forward pass, providing high frame rates (30–80 ms per frame on CPU/GPU) suitable for real-time mobile/dashcam inspection. It outperforms YOLOv5 and SSD in mean Average Precision (mAP) via its C2f backbone and decoupled head. |
| **FastAPI** | REST API Backend | **Q: Why FastAPI over Flask or Django?**<br>A: FastAPI is built on Starlette and Pydantic, supporting native Python `async/await` concurrency. It performs validation automatically using Python type hints, auto-generates OpenAPI (Swagger) documentation, and is significantly faster than Flask while avoiding the heavyweight monolith overhead of Django. |
| **React 19 + Vite** | Frontend Framework & Build Tool | **Q: Why Vite + React?**<br>A: Vite utilizes native ES modules (ESM) in modern browsers and esbuild for instant Hot Module Replacement (HMR) and optimized rollup production bundles. React's declarative component architecture allows clean state management between inspection uploading and interactive dashboard analytics. |
| **SQLite (with WAL & Foreign Keys)** | Relational Persistence | **Q: Why SQLite instead of PostgreSQL or MySQL?**<br>A: SQLite is a self-contained, serverless, zero-configuration database that resides in a single file (`data/roadwise.db`). For an edge or municipal prototype, it eliminates external server daemon management while offering full ACID compliance, B-Tree indexes, and cascade foreign key constraints via `PRAGMA foreign_keys = ON`. |
| **Leaflet.js** | GIS / Map Visualization | **Q: Why Leaflet over Google Maps API?**<br>A: Leaflet is open-source, lightweight (40 KB), has zero API key costs or rate limits, and uses OpenStreetMap tile servers with custom SVG interactive markers color-coded by maintenance priority. |

---

## 3. Architecture & Data Flow (Step-by-Step Code Walkthrough)

### Mode 1 — Road Inspection Data Journey
```
[User Browser / Client]
       │  (Uploads road photo + selects Road Type, Traffic, Location Sensitivity)
       ▼
1. POST /api/inspections/inspect (multipart/form-data)
       │  (api/main.py validates HTTP request and passes bytes to pipeline)
       ▼
2. src/pipeline/inspection_pipeline.py: run_inspection()
       ├── Step A: validate_image_bytes() -> Pillow checks magic bytes, bounds, max size (20 MB)
       ├── Step B: extract_gps_from_exif() -> Parses EXIF GPS IFD tags (DMS to decimal degrees)
       ├── Step C: Save original image -> data/uploads/{report_id}.jpg
       ├── Step D: src/detection/predict.py: detect() -> YOLOv8 forward pass
       │             - Letterbox resize to 640x640
       │             - Decoupled detection head -> Box coordinates & Class logits
       │             - NMS (Non-Maximum Suppression) filters redundant boxes
       │             - results_to_detections() -> normalized dicts (0.0 to 1.0)
       ├── Step E: Save annotated image -> results/predictions/{report_id}_annotated.jpg
       ├── Step F: src/scoring/health_score.py: calculate_condition()
       │             - Evaluates defect visual area and class severity
       │             - Same-class overlap discounting
       │             - Exponential decay: Condition = 100 * exp(-Damage_Load / 2.0)
       ├── Step G: src/scoring/risk_score.py: analyze_risk()
       │             - DamageLevel = (100 - Condition) / 40 * 100
       │             - ContextFactor = 0.3*Road + 0.3*Traffic + 0.4*Sensitivity
       │             - RiskScore = DamageLevel * (0.6 + 1.0 * ContextFactor)
       │             - Maps score to: CRITICAL, HIGH, MEDIUM, LOW
       └── Step H: src/database/database.py: save_inspection()
                     - Atomic SQLite transaction inserts parent 'inspections' and child 'detections'
       ▼
3. HTTP 201 Created JSON response sent to client -> UI renders gauges, priority badge, and annotated image.
```

### Mode 2 — Authority Dashboard Data Journey
```
[User opens Dashboard]
       │
       ▼
1. frontend/src/Pages/AuthorityDashboard.jsx calls Promise.all([getInspections(), getDashboardStats()])
       │
       ├── GET /api/inspections -> queries SQLite:
       │     SELECT i.*, COUNT(d.id) AS detection_count
       │     FROM inspections i LEFT JOIN detections d ON i.id = d.inspection_id
       │     GROUP BY i.id ORDER BY i.risk_score DESC;
       │
       └── GET /api/dashboard/stats -> single-pass aggregate query:
             SELECT COUNT(*), SUM(CASE WHEN priority='CRITICAL'...), AVG(condition_score), AVG(risk_score)...
             FROM inspections;
       │
       ▼
2. Components render synchronized telemetry:
       - <MetricCards />: Displays Total Fleet Inspections, Critical Count, Average Health
       - <GeographicMap />: Interactive Leaflet markers color-coded by priority (Red, Orange, Yellow, Green)
       - <RankingTable />: Risk-sorted data table with live filters (City, Road Type, Priority)
       - <InspectionDetailModal />: Deep-dive view showing bounding boxes and damage deduction breakdown
```

---

## 4. Key Source Code Locations & Viva File Guide

When faculty say: *"Open the file where you do X and explain it line by line"*, navigate here immediately:

| What Faculty Ask to See | Exact File to Open | Key Function / Class |
|---|---|---|
| **API Entry Point & Endpoints** | [`api/main.py`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/api/main.py) | `inspect_road()`, `list_inspections()`, `dashboard_stats()` |
| **Complete Inspection Pipeline** | [`src/pipeline/inspection_pipeline.py`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/src/pipeline/inspection_pipeline.py) | `run_inspection()`, `validate_image_bytes()` |
| **YOLO Model Inference** | [`src/detection/predict.py`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/src/detection/predict.py) | `load_model()`, `detect()`, `results_to_detections()` |
| **Physical Condition Calculation** | [`src/scoring/health_score.py`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/src/scoring/health_score.py) | `calculate_condition()`, `detection_severity()`, `_overlap_fraction()` |
| **Risk & Priority Multiplier** | [`src/scoring/risk_score.py`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/src/scoring/risk_score.py) | `analyze_risk()`, `calculate_damage_level()`, `calculate_context_factor()` |
| **Database Schema & Transactions** | [`src/database/database.py`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/src/database/database.py) | `create_tables()`, `save_inspection()`, `get_all_inspections()` |
| **VOC to YOLO Dataset Converter** | [`src/preprocessing/annotation_converter.py`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/src/preprocessing/annotation_converter.py) | `convert_voc_to_yolo()`, `parse_voc_xml()` |
| **Frontend Root & State Machine** | [`frontend/src/App.jsx`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/frontend/src/App.jsx) | `useState('landing' | 'inspect' | 'dashboard')` |
| **Mode 1 Inspection UI** | [`frontend/src/Pages/LandingPage.jsx`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/frontend/src/Pages/LandingPage.jsx) | Form handlers, `InspectionResults` integration |
| **Mode 2 Authority Dashboard** | [`frontend/src/Pages/AuthorityDashboard.jsx`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/frontend/src/Pages/AuthorityDashboard.jsx) | `Promise.all` fetching, filter states, modal toggle |
| **Interactive Map Component** | [`frontend/src/components/Dashboard/GeographicMap.jsx`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/frontend/src/components/Dashboard/GeographicMap.jsx) | Leaflet map container, custom marker creation |

---

## 5. Machine Learning Viva (Core Concepts & Defending the Model)

### 5.1 Object Detection Foundations
- **Q: What is the difference between Object Classification, Detection, and Segmentation?**
  - *Classification:* Predicts what is in the image (e.g., "damaged road" vs "clean road").
  - *Detection (RoadWise):* Predicts **what** defect is present, **where** it is (bounding box coordinates: $x, y, w, h$), and a **confidence score**.
  - *Segmentation:* Predicts pixel-by-pixel masks of the defects. We chose detection because bounding box regression is computationally lighter and sufficient for area estimation.
- **Q: What is IoU (Intersection over Union)?**
  - $\text{IoU} = \frac{\text{Area of Overlap}}{\text{Area of Union}}$ between the predicted bounding box and ground-truth bounding box. An $\text{IoU} \ge 0.50$ is conventionally considered a True Positive.
- **Q: What is mAP@50 and mAP@50-95?**
  - *Precision:* $\frac{TP}{TP + FP}$ (Out of all defects detected, how many were real?).
  - *Recall:* $\frac{TP}{TP + FN}$ (Out of all real defects on the road, how many did the model find?).
  - *mAP@50:* Mean Average Precision computed across all classes at a single IoU threshold of $0.50$.
  - *mAP@50-95:* Average of mAP across 10 IoU thresholds from $0.50$ to $0.95$ in increments of $0.05$. It measures how tightly the bounding box fits the defect.

### 5.2 Defending Experiment A Metrics
- **Q: What were the results of Experiment A?**
  - On the held-out test set (522 images, 919 instances):
    - **Overall mAP@50:** $52.77\%$ (Precision: $60.61\%$, Recall: $50.36\%$).
    - **D10 (Transverse Crack):** mAP@50 = **$80.21\%$**, Recall = **$73.9\%$** (Strongest class).
    - **D00 (Longitudinal Crack):** mAP@50 = **$62.49\%$**, Recall = **$62.5\%$** (Solid performance).
    - **D20 (Alligator Crack):** mAP@50 = **$15.63\%$**, Recall = **$14.7\%$** (Weakest class).

### 5.3 Defending the D20 (Alligator Crack) Weakness
> [!IMPORTANT]
> **Faculty will likely target D20.** Never hide this weakness. Present it as an engineering diagnostic:

- **Faculty: "Why is your D20 recall only 14.7%?"**
  - *"We performed a dedicated empirical error analysis on all 361 D20 ground-truth objects in the test set. We identified three primary root causes:*
    1. **Visual Area & Scale Variance:** *D20 bounding box area standard deviation is $31,719\text{ px}^2$ (nearly double D00 and D10), with areas spanning from $1,950\text{ px}^2$ to $199,563\text{ px}^2$ (almost half the frame). This extreme scale variance causes feature representations to oscillate wildly across YOLO's P3, P4, and P5 feature pyramid levels.*
    2. **Clustering & NMS Mutual Suppression:** *In 54 test images, annotators drew between 2 and 15 overlapping boxes over continuous fatigue crack meshes. When YOLO predicts overlapping boxes, standard Non-Maximum Suppression (IoU = 0.70) suppresses nearby valid detections as duplicates.*
    3. **Not Class Confusion:** *Crucially, our diagnostic proved that class confusion is NOT the culprit—only 1–2 D20 objects were confused as D00 or D10. The failure is feature regression and localization.*
    4. **Architectural Response:** *To address this, we formulated **Experiment C** (2-class model: D00 + D20) to eliminate transverse competition and study whether a dedicated network improves fatigue crack recall."*

### 5.4 Checkpoint Provenance: `best.pt` vs `last.pt`
- **Q: Why do you evaluate with `best.pt` instead of `last.pt`?**
  - `last.pt` represents the weights from the final epoch (e.g., epoch 98). Neural networks often experience slight overfitting or learning rate decay oscillations in final epochs. `best.pt` corresponds to the epoch that achieved the maximum validation fitness score (epoch 68 in Exp A), ensuring optimal generalization.

---

## 6. Scoring Engine Viva (Condition & Risk Mathematics)

### 6.1 Condition Score Viva
- **Q: Write down the condition scoring formula and explain the variables.**
  $$\text{Condition Score} = 100 \times e^{-\frac{\text{Damage\_Load}}{K}}$$
  - $K = 2.0$: Exponential decay scale factor.
  - $\text{Damage\_Load} = \sum \text{effective}(det_i)$.
  - $\text{Severity}(det) = \text{CLASS\_WEIGHT} \times \text{confidence} \times \text{Size\_Factor}$.
  - $\text{Size\_Factor} = \min\left(1.0, \max\left(0.40, \frac{\text{width} \times \text{height}}{\text{AREA\_REF}}\right)\right)$.
- **Q: Why exponential decay instead of a linear deduction?**
  - A linear deduction ($100 - \sum \text{deductions}$) can drop below zero or penalize trivial defects too harshly. The exponential decay model is asymptotically bounded between $0.0$ and $100.0$, models the law of diminishing marginal damage, and guarantees that a completely clean road evaluates to exactly $100 \times e^0 = 100.0$.
- **Q: How do you handle multiple overlapping detections on the same defect?**
  - We implemented greedy duplicate discounting in `health_score.py:_overlap_fraction()`. Detections of the **same class** are sorted by severity. Subsequent overlapping boxes have their effective damage multiplied by $(1.0 - \text{overlap\_fraction})$. Different classes (e.g., a pothole inside an alligator network) do not discount each other.

### 6.2 Risk Score Viva (Version 1 vs Version 2)
- **Q: Why did you change from an Additive Risk Model (V1) to a Multiplicative Risk Model (V2)?**
  - *V1 Flaw:* $\text{Risk} = 0.5 \times (100 - \text{Condition}) + 0.5 \times \text{Context}$. On a brand-new road (Condition = 100) located in front of a school (Context = 100), the risk score evaluated to $50.0$ (HIGH priority), causing civic false alarms for undamaged roads.
  - *V2 Solution:* $\text{Risk} = \text{DamageLevel} \times \text{ContextMultiplier}$.
    Here, context acts as an **amplifier** of physical damage. If Condition = 100, DamageLevel = 0, so Risk is mathematically guaranteed to be $0.0$ (LOW priority).
- **Q: What are the context multiplier bounds?**
  - Multiplier ranges between $0.6$ (rural/local road, calm traffic, no sensitive institutions: discounts urgency by 40%) and $1.6$ (national highway or school/hospital zone: escalates urgency by 60%).

---

## 7. Backend & Database Viva (FastAPI & SQLite Deep Dive)

- **Q: What happens during FastAPI startup?**
  - In `api/main.py`, we use an `@asynccontextmanager` lifespan handler. Before accepting any network requests, it triggers `create_tables()` in `database.py`. This guarantees tables and secondary B-Tree indexes exist, preventing zero cold-start database exceptions.
- **Q: Explain your database schema and indexing strategy.**
  - We maintain two normalized tables:
    1. `inspections`: Stores parent audit records (UUID `report_id`, GPS coordinates, operational context, condition/risk scores, priority tier, image paths).
    2. `detections`: Stores child bounding boxes (`inspection_id` foreign key with `ON DELETE CASCADE`, class code, confidence, normalized box dimensions).
  - *Indexes:* B-Tree secondary indexes on `priority`, `state`, `city`, `(latitude, longitude)`, and `inspection_id`. This prevents full table scans during dashboard filtering and spatial queries.
- **Q: Why do you enforce `PRAGMA foreign_keys = ON`?**
  - By default, SQLite disables foreign key enforcement for backward compatibility. Enabling it on every database connection guarantees referential integrity and ensures deleting an inspection automatically cascades to clean up its associated child detection records.
- **Q: How do you prevent partial database writes if the server crashes?**
  - In `database.py:save_inspection()`, all parent and child insertions occur within a single atomic database transaction (`with connection:`). If an error occurs midway, SQLite issues a rollback so corrupted partial records are never committed.

---

## 8. 15 Tough Viva Questions & Model Answers

### Q1: "Is your condition score an official Pavement Condition Index (PCI)?"
**Answer:** No. ASTM D6433 standard PCI requires calibrated 3D profilometer measurements, crack width measurements in millimeters, and precise physical square footage per sample unit. RoadWise is a rapid-triage visual index calculated from 2D camera images using normalized pixel areas and deep learning heuristics.

### Q2: "What happens if the YOLO model misses a crack entirely (False Negative)?"
**Answer:** Because the condition formula calculates damage from detected bounding boxes, a False Negative results in an overestimated condition score (the road appears healthier than it is). This is why model recall—especially on structural failures like D20—is critical, and why we designed Experiment C to optimize recall.

### Q3: "Why is GPS extraction optional in the pipeline?"
**Answer:** Many smartphones and messaging apps (such as WhatsApp) strip EXIF metadata for user privacy or file compression. If GPS extraction were mandatory, image uploads without EXIF tags would crash the inspection. RoadWise attempts EXIF parsing, but allows manual user coordinate entry in the form.

### Q4: "What if two annotators annotated the same crack differently in your training data?"
**Answer:** This was one of our key findings in the dataset audit. McMaster datasets tended to annotate tight local crack segments, whereas Attain datasets drew large encompassment boxes. This contradictory loss signal penalizes the bounding box regression head. In our VOC-to-YOLO conversion pipeline, we enforce strict dimension cross-checks and coordinate clipping to minimize training noise.

### Q5: "Why did you set fliplr=0.0 during training?"
**Answer:** Our source datasets (especially McMaster) already contained pre-augmented flipped copies. Applying `fliplr=0.5` inside Ultralytics would have resulted in double-flipping artifacts, distorting crack orientation statistics.

### Q6: "How does the system ensure bounding box coordinates don't break across different image sizes?"
**Answer:** All bounding boxes are stored in normalized YOLO coordinates: $\frac{x_{center}}{W}, \frac{y_{center}}{H}, \frac{\text{width}}{W}, \frac{\text{height}}{H}$, rounded to 5 decimal places. Since all values are in $[0.0, 1.0]$, they scale dynamically to any display canvas or resolution.

### Q7: "Why do you cache the YOLO model in predict.py?"
**Answer:** Deserializing a PyTorch neural network checkpoint from disk into GPU/CPU memory requires 1.5 to 3.0 seconds. By caching the model in a module-level dictionary (`_model_cache`), subsequent inference requests execute in 30–80 milliseconds.

### Q8: "How does the Authority Dashboard handle a slow or failing backend?"
**Answer:** In `AuthorityDashboard.jsx`, we execute `Promise.all([getInspections(), getDashboardStats()])`. If `getDashboardStats()` encounters an error, the frontend automatically falls back to computing aggregate metrics (average health, critical counts) client-side from the raw `inspections` array, preventing UI downtime.

### Q9: "What optimizer did you use during training?"
**Answer:** We used AdamW (Adam with decoupled Weight Decay) with cosine learning rate scheduling (`cos_lr=True`). AdamW mitigates weight decay coupling in traditional Adam, providing superior generalization on heterogeneous crack patterns.

### Q10: "Why did training stop at epoch 98 instead of 100?"
**Answer:** We configured early stopping with `patience=30`. The model achieved its peak validation fitness at epoch 68. After 30 consecutive epochs without validation fitness improvement, Ultralytics triggered early stopping at epoch 98 to prevent overfitting and save compute.

### Q11: "What is the difference between your local models/best.pt and Experiment A's best.pt?"
**Answer:** Our current local `models/best.pt` is an earlier 4-class baseline (`roadwise_v2`, includes Pothole D40) trained on Mac MPS. Experiment A is our newly audited 3-class crack model trained on Google Colab T4 with 4,974 images. We are evaluating Experiment C before deciding which checkpoint to promote to production.

### Q12: "How do you handle Class Imbalance?"
**Answer:** In Experiment A, D20 had 3,627 training boxes while D10 had 1,897 and D00 had 2,051. YOLOv8 uses a Task-Aligned Loss that combines Varifocal/BCE loss for classification with CIoU and Distribution Focal Loss (DFL) for box regression, weighting hard examples automatically.

### Q13: "Can a user manipulate your API with corrupted images?"
**Answer:** No. In `inspection_pipeline.py:validate_image_bytes()`, we execute Pillow's `Image.verify()`, verify file signatures against supported extensions (`.jpg`, `.jpeg`, `.png`, `.webp`), and reject files exceeding 20 MB before passing any data to YOLO or SQLite.

### Q14: "Why do you use relative URLs in the API response instead of absolute disk paths?"
**Answer:** Modern browser security sandboxes block web pages hosted on `http://localhost:5173` from loading local OS filesystem paths (like `C:/Users/.../data/uploads/image.jpg`). The API transforms paths to `/data/uploads/image.jpg`, which the browser fetches safely via FastAPI's `StaticFiles` mount.

### Q15: "What were the results of Experiment C, and why is it preferred over Experiment A?"
**Answer:** Experiment C eliminated transverse crack (D10) competition to evaluate D00 and D20 in a 2-class setup. It achieved **73.33% recall (+10.8% absolute gain) and 67.49% mAP50 (+5.0% absolute gain) on Longitudinal Cracks (D00)**, while boosting D20 alligator recall by **+21% relative gain (14.7% → 17.8%)**. This makes Experiment C the superior crack detector.

### Q16: "Why use a Dual-Model Architecture (Pothole Specialist + Crack Specialist) instead of one single unified model?"
**Answer:** Potholes and cracks represent fundamentally distinct physical distress categories:
1. **Morphological Divergence:** Potholes are 3D volumetric surface cavity depressions requiring texture, depth, and shadow gradient features. Cracks are 2D topological line networks requiring edge-continuity and geometric aspect-ratio features.
2. **Feature Competition:** Forcing a single lightweight neural network (YOLOv8s) to share its convolution kernels across both tasks leads to feature suppression (as observed in initial RDD2022 experiments where pothole detection degraded crack recall).
3. **Engineering Modularity:** By decoupling into two specialized models (a fine-tuned Pothole specialist at ~67% mAP and an Experiment C Crack specialist at ~67.5% mAP on linear cracks), each detector operates at peak accuracy. The pipeline merges their bounding boxes seamlessly before passing them to the condition scoring engine.

### Q17: "You previously had 4 classes (D00, D10, D20, D40). Why are you now treating Longitudinal and Transverse cracks as the same category?"
**Answer:** We treat them under a unified **'Linear Crack'** taxonomy based on two solid justifications:
1. **Civil Engineering Standard (Maintenance Action):** According to IRC (Indian Roads Congress) and ASTM D6433 standards, both longitudinal and transverse cracks are single-line surface fissures. They have the exact same maintenance intervention: **Bituminous Crack Sealing / Joint Filling**. In our scoring engine, both have identical damage weights (0.50) and identical reference areas (0.070).
2. **Machine Learning Empirical Finding:** In Experiment A, separating D00 and D10 caused severe directional ambiguity on diagonal, curved, or branching cracks. Merging their supervision space in Experiment C boosted linear crack detection recall from 62.5% to **73.3% (+10.8% absolute gain)**.

### Q18: "Some cracks have significant 3D depth and jagged edges. Does your system account for depth, or consider them potholes? How does crack severity scale?"
**Answer:** Monocular 2D smartphone/dashcam photography cannot measure absolute millimeter physical depth (Z-axis) without expensive LiDAR or stereo cameras. However, RoadWise handles severity through three practical engineering mechanisms:
1. **The Physical Distress Lifecycle:** In pavement mechanics, distress naturally progresses in three distinct stages:
   - *Stage 1 (Hairline / Linear Crack - D00):* Surface fissure $\rightarrow$ Weight: **0.50**.
   - *Stage 2 (Deep Interconnected Fatigue - D20):* When linear cracks deepen under traffic loading, the subgrade fails and forms deep interconnected block patterns (Alligator Cracking) $\rightarrow$ Weight escalates to **0.80**.
   - *Stage 3 (Cavity / Pothole - D40):* When deep fatigue blocks completely dislodge and pop out of the road surface, creating a structural hole $\rightarrow$ Classified as a Pothole with maximum weight: **1.00**.
2. **Visual Area (Size Factor) Proxy:** Deeper and wider cracks invariably exhibit wider surface spalling and larger bounding-box footprints on camera. The scoring engine scales damage dynamically via $\text{Size\_Factor} = \min(1.0, \max(0.40, \frac{\text{area}}{\text{AREA\_REF}}))$, meaning severe, gaping cracks deduct significantly more health than fine hairline cracks.
3. **Citizen Reporting Triage:** In real-world civic crowdsensing, users predominantly report prominent, jarring, or hazardous road damage rather than cosmetic microscopic cracks. The system acts as a rapid triage index to prioritize the most severe complaints for municipal dispatch.

### Q19: "How does operational road context affect inspection outcome? Can you demonstrate with a live case study?"
**Answer:** RoadWise mathematically separates **physical pavement diagnosis** from **socio-economic maintenance triage**:
- **Condition Score (0–100):** Reflects physical damage from computer vision. It is completely independent of where the road is located.
- **Risk Score (0–100):** Multiplies physical damage by traffic volume, road classification, and facility vulnerability ($\text{Risk} = \text{Damage} \times \text{ContextMultiplier}$).
- **Empirical Demonstration (`bad_road_2.jpg` Case Study):**
  - Tested with 4 detections (1 central cavity + 3 alligator cracks):
  - When classified as **Main Road + High Traffic:** Condition was **62.3**, and Risk was elevated to **100.0 (CRITICAL PRIORITY)** because high vehicular exposure on an arterial road turns potholes into immediate collision hazards.
  - When tested as **Rural Village Road + Low Traffic:** Condition remained identical at **62.3** (the physical hole did not shrink), but Risk dropped to **73.5 (HIGH RISK)**.
  - This proves RoadWise prevents municipal budgets from wasting emergency crews on quiet farm tracks while busy city transit corridors are in danger.

### Q20: "Why does the model struggle on bare gravel beds or asphalt peeling, and what happens if an unmodeled distress class appears? How does Overlap Discounting handle it?"
**Answer:**
1. **Taxonomy & Dataset Boundaries:** In standard road damage benchmarks (RDD2022), the ontology is strictly limited to 4 structural distress classes (`D00, D10, D20, D40`). Pavement peeling/stripping (where asphalt washes away into flat loose gravel) is an **unmodeled class** in the training dataset.
2. **Feature Mapping at Low Confidence:** When exposed to stripped asphalt, the neural network maps the jagged broken pavement edges to the closest geometric feature it knows (`D20` Alligator Cracks or `D40` Cavities) at lower confidence ($\sim 0.10$–$0.25$).
3. **Overlap Discounting Defense:** If a dedicated 5th class (e.g. "Surface Stripping / Raveling") were introduced, stripping boxes would naturally overlap with cracks and potholes on the same road section. Our **Overlap Discounting Algorithm** in `src/scoring/health_score.py` prevents artificial double-counting:
   $$\text{Effective\_Severity} = \text{Severity} \times (1.0 - \text{Overlap\_Fraction})$$
   Any subsequent bounding box that overlaps with an already accepted defect has its marginal damage reduced proportionally by the overlapping area, ensuring total damage never exceeds the physical asphalt footprint.

### Q21: "What does the 'Inference Resolution (imgsz)' setting (640px vs 960px vs 1280px) do for the user?"
**Answer:** Modern smartphones and dashcams capture road imagery at high resolutions ($1920 \times 1080$ or $3840 \times 2160$ 4K).
1. **The 640px Trade-off (Standard):** Downscaling a 4K image down to YOLO's native $640 \times 640$ canvas reduces pixels by over $90\%$, which can blur out thin $2\text{px}$ hairline cracks and distant fissures.
2. **High-Resolution Scaling (960px / 1280px):** Selecting $960\text{px}$ or $1280\text{px}$ increases the input receptive canvas by $2.25\times$ to $4\times$. This preserves fine crack continuity and distant road defects.
3. **Latency Balance:** On standard CPU inference, $640\text{px}$ takes $\sim 45\text{ms}$, while $1280\text{px}$ takes $\sim 220\text{ms}$. Exposing `imgsz` empowers users to prioritize real-time speed vs. fine-grained crack inspection.

---

## 9. Viva Examiner Interaction Tips (Student Checklist)

1. **Be Honest About Limitations:** If asked about D20 recall, do not make excuses. Show the diagnostic charts and explain the geometric variance. Examiners respect candidates who understand their model's failure modes.
2. **Open Code Confidently:** Have VS Code open to `api/main.py`, `inspection_pipeline.py`, and `health_score.py`. Know where the formulas live.
3. **Have Live Demonstrations Ready:**
   - Run the backend: `.\venv\Scripts\uvicorn.exe api.main:app --host 127.0.0.1 --port 8000`
   - Run the frontend: `cd frontend; npm run dev`
   - Test an image in Mode 1 and show the inspection appear in the Mode 2 Dashboard.
4. **Refer to the Documentation:** Mention that full mathematical derivations and system schemas are codified in `docs/SCORING_METHODOLOGY.md` and `docs/SYSTEM_ARCHITECTURE.md`.

