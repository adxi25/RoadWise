# RoadWise — Task 4.1: Dataset Quality Assessment

**Date:** 2026-11-08  
**Scope:** Qualitative & Quantitative Assessment of Existing Datasets  
**Focus:** Structural Suitability for Unified 4-Class Road Defect Detection

---

## 1. Comparative Quality Matrix

| Quality Dimension | RDD2022 India (Raw / Processed YOLO) | Pothole-610 Collection (`new dataset.zip`) | Roboflow Extra (`RoadWise_Extra_Dataset`) | Roboflow RDD Extra (`RoadWise_RDD_Extra`) |
|---|---|---|---|---|
| **Human Annotation Ground Truth** | High (Competition Verified XMLs) | **None (0% Ground Truth)** | Moderate (Roboflow User Annotations) | Moderate (Roboflow CRDDC Export) |
| **Image Resolution Uniformity** | Perfect ($720 \times 720$ Square, 100%) | Very Low (400+ distinct resolutions) | Distorted ($416 \times 416$ Stretched) | Uniform ($640 \times 640$ Stretched) |
| **Defect Class Taxonomy** | Matches RoadWise (D00, D10, D20, D40) | Unlabeled (Intended purely for D40) | Incompatible (5 generic classes) | 7 classes (Includes non-target D43/D44/D50) |
| **Geographic Relevance** | Primary Target Domain (India) | Unspecified (Mixed Internet Sources) | Unspecified (Global / Mixed) | Domain Shift (Japan Infrastructure) |
| **Negative (Background) Samples** | Strong (58.17% empty label images) | Unknown (No ground truth labels) | 0% (All images have bounding boxes) | 0% (All images have bounding boxes) |
| **Data Leakage Risk** | Zero (Strictly isolated train/val/test) | High if pseudo-labeled naively | Extreme (Augmented copies across splits) | Low (Pre-split by Roboflow) |

---

## 2. In-Depth Class Imbalance Analysis (The RDD2022 India Bottleneck)

The RDD2022 India dataset exhibits severe class imbalance that directly dictates the learning capacity and failure modes of YOLOv8:

```
Bounding Box Representation (Total: 6,831 Target BBs in Train/Val/Test):

D40 (Pothole):           ████████████████████████████████ (3,187 boxes - 46.65%)
D20 (Alligator Crack):   ████████████████████ (2,021 boxes - 29.58%)
D00 (Longitudinal):      ███████████████ (1,555 boxes - 22.76%)
D10 (Transverse Crack):  █ (68 boxes - 0.99%)  <-- SEVERE DEFICIT
```

### Why D10 (Transverse Crack) is the Weakest Class:
1. **Critical Under-Representation:**
   - In the training split of 5,394 images, there are only **48 bounding boxes across 42 images** for D10.
   - In the validation split, there are only **10 bounding boxes across 9 images**.
   - With batch size 8 and 100 epochs, the detector encounters D10 in fewer than 1 out of every 128 batches.
2. **Impact on Gradient Updates:**
   - Classification loss for D10 provides virtually zero gradient signal compared to D40 and D20.
   - The validation sample of 10 boxes is statistically inadequate for calculating a reliable precision-recall curve or mAP@50 (a single false positive or true positive shifts mAP by $\pm 10\%$).
3. **Pavement Engineering Reality:**
   - Transverse cracks run perpendicular to the direction of vehicle travel. In forward-facing vehicle dashcam imagery (such as RDD2022), transverse cracks appear as narrow, horizontal, perspective-compressed lines that rapidly lose contrast due to vehicle motion blur and road perspective foreshortening.
   - By contrast, longitudinal cracks (D00) follow wheelpaths and recede toward the horizon, maintaining visibility across multiple vertical scanlines.

---

## 3. Evaluation of the Pothole-Focused Collection (`new dataset.zip`)

### Strengths:
1. **610 Unique Images:** A non-trivial quantity of diverse road imagery that could theoretically augment the pothole class.
2. **Visual Diversity:** Includes varying camera perspectives (pedestrian handheld, bicycle, high-angle dashcam), varied road textures (concrete, asphalt, rural dirt/gravel patches), and differing lighting conditions (harsh midday glare, overcast, wet pavement).

### Critical Weaknesses & Hazards:
1. **Zero Ground Truth Annotations:**
   - The archive contains no annotations whatsoever.
   - Relying on pseudo-labeling (`models/best.pt`) produces **confirmation bias**: the model can only label what it already knows how to detect. If the model struggles with water-filled potholes or shaded depressions, it will not generate labels for them, reinforcing blind spots.
2. **Single-Class Imbalance Amplification:**
   - Potholes (D40) are **already the dominant class** in RDD2022 India (3,187 boxes, $46.65\%$ of all defect boxes).
   - Adding 610 more pothole images without adding transverse or longitudinal cracks will exacerbate the existing class imbalance, pushing D10 representation down from $0.99\%$ to under $0.7\%$.
3. **Resolution & Aspect Ratio Heterogeneity:**
   - Resolutions vary wildly (from $400 \times 300$ up to $4032 \times 3024$).
   - Downscaling or stretching non-square images into YOLO's default $640 \times 640$ or $1280 \times 1280$ input tensors creates artificial distortion unless careful letterbox padding is used.

---

## 4. Evaluation of Discovered Desktop Datasets

### 4.1 `RoadWise_Extra_Dataset` (Roboflow v3)
- **Defects:**
  - Contains only 421 unique source scenes inflated to 1,263 through synthetic augmentations (horizontal flip, Gaussian blur, salt-and-pepper noise).
  - Pre-resized by Roboflow to $416 \times 416$ (stretched), destroying the high-frequency pixel details necessary for fine crack detection.
  - Class definitions (`crack`, `damage`, `pothole`, `pothole_water`, `pothole_water_m`) conflate longitudinal, transverse, and alligator cracking into a single generic `crack` bucket.
- **Verdict:** Unusable for RoadWise's 4-class taxonomy without destructive re-annotation.

### 4.2 `RoadWise_RDD_Extra` (CRDDC Japan)
- **Defects:**
  - Every single image contains exactly one bounding box ($3,506$ boxes across $3,506$ images), which is artificial and unrepresentative of multi-defect pavement.
  - Severe domain shift: Japanese roads feature high-contrast thermoplastic striping, smooth high-grade asphalt, distinct utility access covers, and right-hand drive perspective.
- **Verdict:** Verified by earlier Colab experimentation (Candidate A) to degrade validation mAP on Indian road evaluation benchmarks.

---

## 5. Strategic Recommendations for Task 4.2 & Training

1. **Do NOT Train on Raw Pseudo-Labels Alone:**
   - Machine-generated pseudo-labels must not be merged into the primary training set without human-in-the-loop audit and correction.
2. **Prioritize Transverse Crack (D10) Acquisition:**
   - Any new dataset acquisition MUST prioritize transverse cracks (D10) and longitudinal cracks (D00) to balance the dominant pothole (D40) and alligator crack (D20) classes.
3. **Maintain RDD2022 India Validation & Test Integrity:**
   - The 1,155-image validation and 1,157-image test splits of `data/processed/yolo/` must remain strictly untouched as the golden benchmark. No outside images may be introduced to validation or test.
4. **Preserve Background Negative Samples:**
   - The $58.17\%$ empty-label background images in `data/processed/yolo/` are vital. Training YOLO without background images leads to high false positive rates (detecting defects on undamaged road markings, shadows, and manhole covers).

