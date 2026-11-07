# RoadWise — Comprehensive Viva Voce Preparation Guide

> **Target Examination:** BTech Computer Science & Engineering Final Year Technical Viva  
> **Subject Focus:** Machine Learning, Computer Vision, Full-Stack Web Systems, Database Architecture  
> **Prepared For:** RoadWise Project Defense  

---

## SECTION 1 — Computer Vision, YOLO & Deep Learning Architecture

### Q1.1: What is YOLO, and how does YOLOv8 differ from two-stage detectors like Faster R-CNN?
**Answer:**
YOLO (*You Only Look Once*) is an end-to-end, single-stage object detection architecture.
- **Two-Stage Detectors (e.g., Faster R-CNN):**
  1. *Stage 1 (Region Proposal Network - RPN):* Proposes thousands of candidate bounding boxes where objects might exist.
  2. *Stage 2 (Classification & Regression Head):* RoI-pools features from candidate boxes and classifies each while refining coordinates.
  - *Trade-off:* High precision, but slow inference (5–10 FPS), making real-time deployment impractical.
- **Single-Stage Detectors (YOLOv8):**
  Frames object detection as a direct spatial regression problem. In a single forward pass through the neural network, the input image is divided into a spatial grid, predicting bounding boxes and class probabilities simultaneously.
  - *Trade-off:* Inference speeds exceeding 40–100 FPS on GPU with competitive mAP.

### Q1.2: What are the key architectural advancements of YOLOv8 compared to YOLOv5 and YOLOv7?
**Answer:**
1. **Anchor-Free Detection Head:**
   Previous YOLO models relied on pre-defined *anchor boxes* (k-means clustered aspect ratios). If an object differed significantly from anchor templates, detection failed. YOLOv8 predicts bounding box offsets directly from cell centers, improving detection of irregular, elongated road cracks.
2. **C2f Module (Cross-Stage Partial with Fast Bottlenecks):**
   Replaces YOLOv5's C3 module. Combines high-level semantic features with low-level spatial features via dense gradient flow paths, improving feature representation with fewer parameters.
3. **Decoupled Head:**
   Separates classification (predicting defect category) and bounding box regression (predicting coordinates) into distinct convolutional branches. This resolves the feature conflict where classification requires translation-invariant features while localization requires translation-sensitive features.
4. **Task-Aligned Assigner (TAL):**
   Dynamically aligns classification scores and localization quality during loss computation rather than using rigid IoU thresholds.

### Q1.3: Explain the mathematical calculation of Intersection over Union (IoU).
**Answer:**
Intersection over Union (IoU) measures the spatial overlap between a predicted bounding box ($B_p$) and a ground-truth bounding box ($B_g$):

$$\text{IoU} = \frac{\text{Area}(B_p \cap B_g)}{\text{Area}(B_p \cup B_g)} = \frac{\text{Area of Overlap}}{\text{Area}(B_p) + \text{Area}(B_g) - \text{Area of Overlap}}$$

- **Range:** $0.0 \le \text{IoU} \le 1.0$.
  - $\text{IoU} = 0$: Completely disjoint boxes.
  - $\text{IoU} \ge 0.5$: Traditional threshold for counting a detection as a True Positive (TP).
  - $\text{IoU} = 1.0$: Perfect geometric alignment.

### Q1.4: How does Non-Maximum Suppression (NMS) eliminate redundant bounding boxes?
**Answer:**
Deep object detectors predict multiple overlapping bounding boxes around the same defect. NMS filters them down to a single optimal box:
1. **Confidence Filtering:** Discard all candidate boxes whose prediction confidence is below $\text{conf\_threshold}$ (e.g., 0.25).
2. **Sorting:** Sort remaining candidate boxes in descending order of confidence score.
3. **Iterative Suppression:**
   - Select the box $B_{\text{max}}$ with the highest confidence score and save it to final output.
   - Compute the IoU between $B_{\text{max}}$ and every other candidate box $B_i$.
   - If $\text{IoU}(B_{\text{max}}, B_i) > \text{IOU\_THRESHOLD}$ (e.g., 0.45), suppress (discard) $B_i$ because it represents the same physical defect.
4. **Repeat:** Repeat for all remaining unsuppressed boxes until the candidate list is empty.

### Q1.5: Explain Mean Average Precision (mAP@50 and mAP@50-95).
**Answer:**
- **Precision:** $\frac{TP}{TP + FP}$ (Fraction of detected defects that are real).
- **Recall:** $\frac{TP}{TP + FN}$ (Fraction of actual ground-truth defects successfully detected).
- **Average Precision (AP):** Area under the Precision-Recall curve for a specific class:
  $$\text{AP} = \int_{0}^{1} p(r) \, dr$$
- **mAP@50:** Mean of the AP across all 4 defect classes evaluated at a fixed $\text{IoU} = 0.50$.
- **mAP@50-95:** The rigorous COCO benchmark metric. It averages mAP across 10 IoU thresholds from 0.50 to 0.95 in steps of 0.05 ($0.50, 0.55, \dots, 0.95$). It heavily penalizes inaccurate bounding box localization.

### Q1.6: Why did the RoadWise ML pipeline adopt `imgsz=1280` during fine-tuning?
**Answer:**
In road surface photography, road defects occupy an exceptionally small fraction of total pixels:
- The Exploratory Data Analysis (`eda_rdd2022.py`) proved that relative bounding box area ($\frac{\text{box\_area}}{\text{image\_area}}$) for potholes and cracks is frequently **less than 1.0%** of the frame.
- At default resolution (`imgsz=640`), after the convolutional backbone applies five downsampling strides (total stride 32), an 8-pixel hairline crack is compressed into less than a quarter of a feature cell, causing feature extinction.
- Doubling resolution to `imgsz=1280` provides **four times the spatial pixel density**, preserving high-frequency edge textures and small pothole boundaries in deep feature maps.

### Q1.7: Why did we freeze the first 10 layers (`freeze=10`) during fine-tuning?
**Answer:**
Freezing is a fundamental transfer learning technique:
- The first 10 layers of YOLOv8 constitute the feature extraction backbone. These layers learn general low-level visual features: oriented edges, color transitions, and asphalt textures.
- During early epochs of fine-tuning, large gradient backpropagation into the backbone can destabilize pre-trained representations (known as **catastrophic forgetting**).
- By setting `freeze=10`, backbone weights remain locked while only the feature pyramid neck and detection head adapt to road distress patterns.

---

## SECTION 2 — Mathematical Scoring Models & Formulas

### Q2.1: Why does RoadWise compute both a Condition Score AND a Risk Score?
**Answer:**
- **Condition Score (Physical Health):** Measures *objective physical degradation* (how damaged is the asphalt?). It is independent of where the road is located. A 1-meter pothole produces the same condition score regardless of location.
- **Risk Score (Civil Urgency):** Measures *public safety hazard and economic risk*. A 1-meter pothole on a high-speed expressway or outside an emergency hospital ward presents catastrophic risk; the same pothole on a remote, deserted dirt track presents low risk.
- Separating these metrics ensures engineers can distinguish between surface physical decay and urgent repair priority.

### Q2.2: Explain the mathematical formulation of the Road Condition Score in `health_score.py`.
**Answer:**
The road condition score uses an **exponential damage decay model**:
$$S_{\text{condition}} = 100.0 \times \exp\left( -\frac{\text{Damage\_Load}}{K} \right), \quad K = 2.0$$

Where:
1. **Exponential Decay ($K = 2.0$):**
   - Natural asymptotic boundaries: As damage increases toward infinity, the score approaches $0.00$ without requiring artificial hard clamping.
   - For a pristine road ($\text{Damage\_Load} = 0$), $S_{\text{condition}} = 100.0 \times e^0 = 100.00$.
2. **Individual Detection Severity:**
   $$\text{Severity}(d_i) = \text{CLASS\_WEIGHT}[c] \times \text{confidence}_i \times \text{Size\_Factor}_i$$
   - $\text{CLASS\_WEIGHT}$: Potholes (D40) = 1.00, Alligator Cracks (D20) = 0.80, Cracks (D00, D10) = 0.50.
   - $\text{Size\_Factor}_i = \min\left(1.0, \max\left(0.40, \frac{\text{width}_i \times \text{height}_i}{\text{AREA\_REF}[c]}\right)\right)$ normalizes against 90th-percentile defect area with a 40% floor.
3. **Duplicate & Multi-Scale Overlap Discounting:**
   If multiple overlapping bounding boxes of the **same class** detect the same physical defect, subsequent boxes are discounted by the maximum fraction of their area already covered:
   $$\text{Damage\_Load} = \sum_{i} \text{Severity}(d_i) \times (1.0 - \text{Covered}_i)$$
   Different defect classes (e.g., a pothole inside an alligator crack network) do not discount each other.

### Q2.3: What was the structural flaw in Version 1 scoring, and how did Version 2 resolve it?
**Answer:**
- **Version 1 (Additive Model):**
  $$\text{Risk} = (\text{Damage}) \times 0.5 + (\text{ContextScore}) \times 0.5$$
  *The Flaw:* If a newly paved, flawless road ($\text{Damage} = 0$) was located near a school ($\text{ContextScore} = 100$), the resulting Risk Score was:
  $$\text{Risk} = 0 \times 0.5 + 100 \times 0.5 = 50.0 \implies \text{HIGH PRIORITY}$$
  This generated false alarms on undamaged roads.
- **Version 2 (Multiplicative Amplification Model):**
  $$\text{RiskScore} = \text{DamageLevel} \times \text{ContextMultiplier}$$
  *The Fix:* Context now acts as a **multiplier (scaling factor)** on detected damage. If $\text{DamageLevel} = 0$, the Risk Score is mathematically guaranteed to be **0.0 (LOW priority)**, completely eliminating false alarms on undamaged roads.

### Q2.3: Why is damage stretched using `DAMAGE_REF = 40.0`?
**Answer:**
In empirical computer vision inference on road imagery:
- Detectors identify isolated defects (1–3 potholes) in an image frame.
- Because an image captures a broad stretch of asphalt, un-stretched condition scores rarely drop below 35.0 (the 10th percentile on the validation dataset was 70.5).
- If damage was simply $100 - \text{Condition}$, severe real-world potholes would only yield damage scores of 25–30, almost never reaching the CRITICAL threshold ($\ge 75$).
- By setting $\text{DAMAGE\_REF} = 40.0$:
  $$\text{DamageLevel} = \min\left(100.0, \frac{100.0 - \text{Condition}}{40.0} \times 100.0\right)$$
  Any road whose condition drops by 40 points ($\text{Condition} \le 60.0$) scales to a full 100% damage level, ensuring high-risk defects trigger immediate authority attention.

---

## SECTION 3 — FastAPI, Backend Architecture & Python

### Q3.1: Why was FastAPI selected instead of Flask or Django?
**Answer:**
1. **Asynchronous Throughput (ASGI):** Built on Starlette and Uvicorn, supporting native `async`/`await` non-blocking I/O, allowing concurrent requests without blocking worker threads.
2. **Automatic Type Validation (Pydantic):** Automatically validates query parameters, form fields, and JSON payloads at runtime, returning descriptive HTTP 400 errors if types fail.
3. **Automated Interactive Documentation:** Generates interactive OpenAPI (Swagger UI) at `/docs` and ReDoc at `/redoc` with zero external configuration.
4. **Fast Performance:** Benchmarks consistently show FastAPI performing on par with Go and NodeJS.

### Q3.2: What is the purpose of the lifespan context manager in `api/main.py`?
**Answer:**
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()  # Executed once during startup
    yield
    # Cleanup tasks on shutdown (if any)
```
- Replaces legacy `@app.on_event("startup")` decorators.
- Guarantees database tables and B-Tree indexes exist **before** the Uvicorn HTTP server begins accepting socket connections, preventing cold-start 500 crashes.

### Q3.3: How does FastAPI serve original and annotated image files?
**Answer:**
FastAPI uses Starlette's `StaticFiles` mounted directly to physical directories:
```python
app.mount("/data/uploads", StaticFiles(directory="data/uploads"), name="uploads")
app.mount("/results/predictions", StaticFiles(directory="results/predictions"), name="predictions")
```
When a browser requests `http://127.0.0.1:8000/results/predictions/RW-123_annotated.jpg`, `StaticFiles` streams the file from disk using chunked HTTP transfer with standard `Cache-Control` and MIME type headers.

---

## SECTION 4 — SQLite & Relational Persistence Layer

### Q4.1: Why is SQLite suitable for this application?
**Answer:**
- **Zero Configuration:** Serverless, embedded engine running in-process without requiring background daemon processes (like PostgreSQL or MySQL).
- **Single File Storage:** The entire database resides in `data/roadwise.db`, making backups and migrations straightforward.
- **ACID Compliant:** Supports atomic transactions, write-ahead logging (WAL), and relational integrity.

### Q4.2: Why must `PRAGMA foreign_keys = ON` be executed explicitly on every connection?
**Answer:**
For historical backward compatibility with SQLite 2.x, SQLite 3 defaults foreign key enforcement to **OFF**. Unless `PRAGMA foreign_keys = ON` is invoked on each opened connection, foreign key constraints and `ON DELETE CASCADE` actions are completely ignored by the SQLite engine.

### Q4.3: Explain the 1-to-N relationship between `inspections` and `detections`.
**Answer:**
- `inspections` is the **Parent table**: Stores road context, overall scores, report IDs, and image paths.
- `detections` is the **Child table**: Stores individual bounding box detections (`class_code`, `confidence`, coordinates).
- The child references the parent via `inspection_id REFERENCES inspections(id) ON DELETE CASCADE`.
- If an inspection is deleted, all corresponding bounding box rows are purged automatically, preventing orphaned records.

### Q4.4: What indices were created, and what performance benefits do they provide?
**Answer:**
Indices created:
- `idx_inspections_priority` on `inspections(priority)`
- `idx_inspections_state` on `inspections(state)`
- `idx_inspections_city` on `inspections(city)`
- `idx_inspections_location` on `inspections(latitude, longitude)`
- `idx_detections_inspection` on `detections(inspection_id)`
**Performance Benefit:**
Without indices, queries filtering by priority or joining detections require **$O(N)$ full table scans**. B-Tree indices organize keys into balanced search trees, reducing search time to **$O(\log N)$**.

---

## SECTION 5 — React, Leaflet & Frontend Architecture

### Q5.1: How does React state management coordinate Mode 1 and Mode 2?
**Answer:**
- In `frontend/src/App.jsx`, top-level state variables control application rendering:
  - `showLanding`: Toggles between the marketing Landing Page and the application.
  - `activeTab`: Switches views between `'inspect'` (Mode 1) and `'dashboard'` (Mode 2).
  - `inspectionResult`: When populated by an API response, conditionally renders `<InspectionResults />`; when cleared via `handleReset()`, returns to the upload workspace.

### Q5.2: Why is `URL.revokeObjectURL()` called inside `handleReset()`?
**Answer:**
When an image is selected, `URL.createObjectURL(file)` generates a DOMString pointing to the file stored in browser memory. Unlike regular JavaScript variables, object URLs are not automatically garbage collected until the document unloads. Calling `URL.revokeObjectURL(previewUrl)` explicitly frees the memory buffer, preventing client-side memory leaks during long inspection sessions.

### Q5.3: How does the Geographic Map prevent invalid coordinates from crashing Leaflet?
**Answer:**
In `GeographicMap.jsx`, all inspection records pass through a strict coordinate validation filter before markers are created:
```javascript
const mappedInspections = inspections.filter(item => {
  const lat = Number(item.latitude);
  const lng = Number(item.longitude);
  return (
    item.latitude !== null &&
    item.longitude !== null &&
    !isNaN(lat) && !isNaN(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180 &&
    !(lat === 0 && lng === 0) // filters out uninitialized default points
  );
});
```

---

## SECTION 6 — Dataset Engineering (RDD2022 India)

### Q6.1: What are the 4 target road damage classes in RoadWise?
**Answer:**
Derived from the international Road Damage Detection (RDD) taxonomy:
1. **D00:** Longitudinal Cracks (parallel to vehicular travel direction, caused by wheel-load fatigue).
2. **D10:** Transverse Cracks (perpendicular to vehicular travel direction, caused by thermal contraction).
3. **D20:** Alligator / Crocodile Cracks (interconnected mesh pattern, indicating structural road-base failure).
4. **D40:** Potholes (bowl-shaped surface depressions caused by water penetration and traffic wear).

### Q6.2: Why are empty label files created for images without defects?
**Answer:**
In object detection datasets, an image without bounding boxes is a **negative background example**.
- If a model is trained *only* on images containing damage, it learns that every patch of road must contain a defect, leading to high False Positive rates (hallucinating cracks on asphalt joints, lane markings, or tree shadows).
- Providing negative examples with empty `.txt` files teaches the neural network what undamaged pavement looks like, penalizing background false alarms during loss computation.

### Q6.3: Why was stratified splitting based on rarest defect implemented?
**Answer:**
In the RDD2022 India dataset, class distribution is highly imbalanced:
- `D40` (potholes) and `D00` (longitudinal cracks) are abundant.
- `D10` (transverse cracks) has very few labeled instances ($\approx 140$ total).
- A standard uniform random split risks placing almost all `D10` instances in the training set and zero in the validation or test sets.
- By sorting images by defect rarity (`['D10', 'D00', 'D20', 'D40']`) and sampling proportionally from each bucket, we ensure that every split (70% train, 15% validation, 15% test) contains adequate representations of rare defect classes.

