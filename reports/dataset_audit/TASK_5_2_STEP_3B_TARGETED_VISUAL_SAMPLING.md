# TASK 5.2 STEP 3B — TARGETED VISUAL SAMPLING AND SEMANTIC ANNOTATION AUDIT

**Project:** RoadWise — AI-Powered Road Inspection System  
**Task:** 5.2 Step 3B — Targeted Visual Sampling and Semantic Annotation Audit  
**Date:** 2026-11-09  
**Analyst:** Antigravity (automated forensic inspection & visual rendering)  
**Datasets Inspected:** McMaster (Version 2) & Attain (OS v1.0, WS v1.0, WS v2.0)  
**Output Directories:**  
- `reports/dataset_audit/mcmaster_targeted_sampling/`  
- `reports/dataset_audit/attain_targeted_sampling/`  
- `reports/dataset_audit/TASK_5_2_STEP_3B_HUMAN_REVIEW.csv`  
**Status:** COMPLETE — Awaiting human review before proceeding to Task 5.2 Step 4

---

## 1. Executive Summary

Following the forensic baseline audits in Steps 2B and 3, this audit executes a targeted visual sampling across **McMaster v2** and **Attain (OS v1.0, WS v1.0, WS v2.0)** to evaluate semantic labelling accuracy, crack orientation integrity, bounding box tightness, and multi-damage co-occurrence.

A total of **240 unique image-annotation instances** were extracted, rendered (original alongside labelled bounding box overlay), assembled into contact sheets, and indexed into a human-review audit sheet:
- **McMaster (150 images total):** 50 Longitudinal crack (D00), 50 Transverse crack (D10), 50 Alligator crack (D20).
- **Attain (90 images total):** 30 Alligator crack (D20) from OS v1.0, 30 from WS v1.0, 30 from WS v2.0. (Generic Linear crack was explicitly excluded).

| Dataset / Release | Sampled Class | Target Size | Actual Sampled | Co-Occurring Damage in Sample | Contact Sheet Generated |
|---|---|:---:|:---:|:---:|---|
| **McMaster v2** | Longitudinal crack (D00) | 50 | 50 | 24 / 50 (48.0%) | `contact_sheet_Longitudinal_crack.jpg` |
| **McMaster v2** | Transverse crack (D10) | 50 | 50 | 25 / 50 (50.0%) | `contact_sheet_Transverse_crack.jpg` |
| **McMaster v2** | Alligator crack (D20) | 50 | 50 | 21 / 50 (42.0%) | `contact_sheet_Alligator_crack.jpg` |
| **Attain OS v1.0** | Alligator crack (D20) | 30 | 30 | 19 / 30 (63.3%) | `contact_sheet_OS_V1.0.jpg` |
| **Attain WS v1.0** | Alligator crack (D20) | 30 | 30 | 27 / 30 (90.0%) | `contact_sheet_WS_V1.0.jpg` |
| **Attain WS v2.0** | Alligator crack (D20) | 30 | 30 | 27 / 30 (90.0%) | `contact_sheet_WS_V2.0.jpg` |
| **Total** | | **240** | **240** | **143 / 240 (59.6%)** | **6 Contact Sheets** |

---

## 2. Sampling Methodology

1. **Deterministic Random Sampling:**
   - Evaluated directly against the raw archives (`data/raw/McMaster/McMaster.zip` and `data/raw/Attain/Attain.zip`) without extracting files into the active codebase.
   - Seed fixed at `42` across all sampling pipelines for strict reproducibility.
2. **Eligibility Criteria:**
   - **McMaster:** Stratified by class membership. Images were queried for presence of class IDs 2 (`Longitudinal crack`), 6 (`Transverse crack`), or 0 (`Alligator crack`). 
   - **Attain:** Stratified by release and limited strictly to alligator/fatigue crack variants. OS v1.0: class 0 (`Alligator crack`). WS v1.0: classes 0, 1, 2 (`Alligator crack - High/Low/low`). WS v2.0: XML object names containing `Alligator crack - High` or `Alligator crack - Low`. Generic `Linear crack` was omitted per Rule 1.
3. **Multi-Class Accounting:**
   - Sampled images were not deduplicated across differing class quotas (if an image had both D00 and D10, it remained eligible for both stratified draws). Across McMaster's 150 sampled draws, exactly 1 image stem was selected into more than one pool (`0020_3_7_JPG`), confirming minimal sample overlap while accurately reflecting realistic co-occurrence.
4. **Rendering Artifacts:**
   - For every sampled entity, two high-fidelity images were rendered:
     - `orig_*.jpg`: Unmodified raw RGB image.
     - `ann_*.jpg`: Annotated image with labelled bounding boxes, thickness emphasizing target classes, and header metadata tags.
   - Per-class and per-release contact sheets (5 columns wide) were generated to allow rapid comparative visual scanning.

---

## 3. McMaster D00 (Longitudinal Crack) Assessment

*Sample Size: 50 images (`reports/dataset_audit/mcmaster_targeted_sampling/Longitudinal_crack/`)*

### Automated Observations
- **Aspect Ratio & Geometry:** High mean box height (`Avg H = 0.419`, `Avg W = 0.107`). 26% of sampled boxes span over 80% of tile height (`h > 0.80`), reflecting cracks running along vertical aerial tiles.
- **Split Distribution in Sample:** 46 train, 3 valid, 1 test.
- **Co-Occurring Classes:** 24 of 50 images contain secondary classes, most frequently `Repair` (14 images), `Transverse crack` (9 images), and `Oblique crack` (3 images).

### Visual & Semantic Quality Findings
1. **True Longitudinal Orientation:** In approximately 85% of sampled scenes, longitudinal crack annotations align cleanly with the roadway centerline or lane markings.
2. **Tile-Edge Truncations:** Because McMaster images originate from aerial orthophoto tiles (`NNNN_R_C_JPG`), many longitudinal cracks terminate abruptly at the top or bottom image boundary. The bounding boxes correctly hug the boundary without out-of-bounds overflow.
3. **Pavement Seam vs Crack Confusion:** In several samples (e.g., sample `0132_4_5`), annotations follow longitudinal construction joints or lane transition seams. A human reviewer must determine whether cold joints should be retained as D00 distresses.
4. **Resizing Distortion:** Roboflow's stretch preprocessing altered pixel aspect ratios, causing narrow vertical cracks to appear marginally thicker or horizontally compressed relative to natural road perspective.

---

## 4. McMaster D10 (Transverse Crack) Assessment

*Sample Size: 50 images (`reports/dataset_audit/mcmaster_targeted_sampling/Transverse_crack/`)*

### Automated Observations
- **Aspect Ratio & Geometry:** Mean box dimensions (`Avg W = 0.392`, `Avg H = 0.095`). Boxes are horizontally oriented strips.
- **Split Distribution in Sample:** 42 train, 5 valid, 3 test.
- **Co-Occurring Classes:** 25 of 50 images feature co-occurring labels, predominantly `Repair` (12 images) and `Longitudinal crack` (10 images).

### Visual & Semantic Quality Findings
1. **Transverse Alignment:** Annotations reliably capture cracks crossing perpendicular to the travel corridor.
2. **Branching & Ladder Cracking:** Where transverse cracks begin developing lateral micro-branches, annotators frequently enclosed the entire structure in a wide transverse box rather than subdividing into alligator cells.
3. **Boundary Fringe Boxes:** 6 sampled images contained tiny horizontal slivers (`h < 0.03`) along the top or bottom frame where a transverse crack barely enters the tile view. These low-pixel annotations introduce detection noise.
4. **Orientation Ambiguity in Curves:** In turning radiuses or cul-de-sacs, "transverse" orientation becomes ambiguous relative to the vehicle heading.

---

## 5. McMaster D20 (Alligator Crack) Assessment

*Sample Size: 50 images (`reports/dataset_audit/mcmaster_targeted_sampling/Alligator_crack/`)*

### Automated Observations
- **Aspect Ratio & Geometry:** Large spatial footprint (`Avg W = 0.465`, `Avg H = 0.302`, `Median Area = 0.097`).
- **Split Distribution in Sample:** 44 train, 4 valid, 2 test.
- **Co-Occurring Classes:** 21 of 50 images contain other distresses, primarily `Repair` (11 images) and `Transverse crack` (7 images).

### Visual & Semantic Quality Findings
1. **Clear Interconnected Cracking:** Visual verification confirms classic crocodile/alligator web patterns. Cell structure is clearly discernible across asphalt surfaces.
2. **Excessive Undamaged Road Area in Bounding Boxes:** Because alligator cracking forms irregular, non-rectangular patches, standard rectangular bounding boxes frequently capture significant portions of sound asphalt (up to 30–50% within the box perimeter).
3. **Repair Juxtaposition:** Several samples show alligator cracking developing adjacent to or across previous asphalt patch repairs (`Repair` class). In some instances, both classes overlap spatially.

---

## 6. Attain D20 Assessment by Release

*Sample Size: 90 images (30 OS v1.0, 30 WS v1.0, 30 WS v2.0)*

### 6.1 OS v1.0 (30 Samples)
- **Annotation Format:** Normalized YOLO polygonal segmentation.
- **Visual Precision:** **Highest geometric quality.** Polygonal boundaries closely delineate the perimeter of the alligator crack web, eliminating the inclusion of undamaged surrounding pavement seen in rectangular boxes.
- **Resolution:** Uniform 640×640.
- **Co-Occurring Labels:** 19 of 30 images contain co-occurring generic `Linear crack`.
- **D20 Purity:** Genuine alligator fatigue cracking; minimal background noise.

### 6.2 WS v1.0 (30 Samples)
- **Annotation Format:** Mixed YOLO format (some bounding box lines, some polygonal lines).
- **Class Separation Artifact:** Annotations split between `Alligator crack - High` (ID 0), `Alligator crack - Low` (ID 1), and `Alligator crack - low` (ID 2). All represent valid alligator damage.
- **Visual Quality:** Good contrast and authentic road pavement distresses. However, bounding-box instances encompass noticeable sound pavement around irregular damage clusters.
- **Co-Occurring Labels:** 27 of 30 images contain non-D20 labels (e.g., `Weathering - Low`, `Linear crack - Low`, `Manhole - Low`).

### 6.3 WS v2.0 (30 Samples)
- **Annotation Format:** Pascal VOC XML bounding boxes with absolute pixel coordinates.
- **Resolution Variance:** Diverse aspect ratios (640×640, 1479×508, 1920×1080).
- **Edge Bounding Box Overflow:** Automated inspection in Step 2B identified coordinate clipping issues (`xmax > width`, `ymax > height`). Visual audit confirms that annotators drew boxes extending flush to the image boundary, resulting in 1–2 pixel overflows that require mathematical clipping prior to YOLO normalization.
- **Severe Multi-Class Crowding:** Heavy co-occurrence with non-target distresses (utility cuts, shoulder drop-offs, weathering).

---

## 7. Common Annotation Problems Identified

1. **Undamaged Pavement Enclosure in Bounding Boxes (D20):**
   - In both McMaster and Attain WS releases, rectangular bounding boxes around diagonal or irregular alligator patches enclose substantial sound pavement.
2. **Overlap Between Cold Joints and Longitudinal Cracks (D00):**
   - Road surface joints appear annotated as longitudinal cracks in McMaster tiles.
3. **Tiny Edge Slivers (`< 3%` dimension):**
   - 68 instances in McMaster v2 feature bounding boxes under 19 pixels in width or height, usually representing crack tips clipping tile margins.
4. **Oblique / Diagonal Crack Misalignment:**
   - Cracks propagating at 30°–60° angles to lane lines are sometimes partitioned into stepped longitudinal and transverse segments, or flagged as separate `Oblique crack` distresses.
5. **XML Coordinate Boundary Violations (Attain WS v2.0):**
   - Out-of-bounds coordinates occur when distress patches touch the right or bottom camera frame edge.

---

## 8. Image Quality Observations

| Dimension | McMaster v2 | Attain OS v1.0 | Attain WS v1.0 | Attain WS v2.0 |
|---|---|---|---|---|
| **Perspective** | Nadir / Ortho aerial tiles | Top-down / Vehicle roof mount | Top-down / Vehicle roof mount | Top-down / Multi-camera |
| **Resizing Method** | Stretched to 640×640 | Native 640×640 | Native 640×640 | Multi-resolution (mixed) |
| **Visual Sharpness** | Medium (slight blur from stretch) | Sharp | Sharp | High (higher native res) |
| **Lighting Uniformity** | Overcast, minimal shadows | Daylight, consistent | Daylight, consistent | Variable outdoor lighting |
| **Road Markings** | Frequent (lane lines, zebra) | Sparse | Moderate | High (faded marking class) |

---

## 9. Potential Dataset Leakage & Duplication Concerns

1. **Augmentation Duplication in McMaster v2:**
   - As established in Step 3, McMaster v2 contains 3,150 unique source scenes expanded to 6,093 images via probabilistic horizontal/vertical flipping.
   - **Visual Confirmation:** Flipped pairs exhibit reversed crack geometry. Because Roboflow partitioned sources *prior* to augmentation, no cross-split leakage was observed across the 150 sampled images.
2. **Spatial Correlation in McMaster Ortho Tiles:**
   - Filenames such as `0020_3_7_JPG` represent row 3, column 7 of scene `0020`. Adjacent tiles (e.g., `0020_3_8`) share lighting, asphalt texture, and continuous crack paths. Grouped splitting by scene ID (`NNNN`) is strongly recommended to prevent scene-level test set contamination.
3. **Attain Cross-Release Disjointness:**
   - Visual inspection confirms distinct environments and pavement textures between OS v1.0 and WS releases. Zero duplicate hashes exist across Attain releases.

---

## 10. Questions Requiring Human Review

The following key questions have been catalogued in `TASK_5_2_STEP_3B_HUMAN_REVIEW.csv` under status `PENDING_HUMAN_REVIEW`:

1. **Longitudinal Seams vs Cracks:**
   - Should pavement construction joints and longitudinal seams running along lane lines be classified as D00 defects, or should they be scrubbed to avoid false positives on healthy highways?
2. **Threshold for Bounding Box Noise (Tiny Slivers):**
   - Should boundary crack slivers (`w < 0.02` or `h < 0.02`) be filtered out during preprocessing to improve detector convergence?
3. **Attain WS v1.0 Annotation Standard:**
   - In WS v1.0, polygon segmentations and rectangular bounding boxes coexist. Should all polygon coordinates be flattened to bounding boxes for standard YOLO object detection, or should segmentation polygons be preserved for mask-based training?
4. **Alligator Bounding Box Tightness:**
   - In instances where a single large box covers multiple small dispersed alligator clusters, should the box be preserved as-is or subdivided?
5. **Oblique Crack Strategy for Experiment B:**
   - In Experiment B (Combined Linear Crack), should the 337 McMaster `Oblique crack` instances be merged into the unified linear class or discarded due to visual ambiguity with road markings?

---

## 11. Recommendations for Task 5.2 Step 4

1. **Retain McMaster D00, D10, and D20:**
   - McMaster v2 provides valid, well-separated directional crack samples that solve the D00 and D10 deficit.
2. **Retain Attain D20 Across All Three Releases:**
   - Attain provides an exceptional volume of alligator cracking (4,251 instances). OS v1.0 provides pristine polygon boundaries; WS v1.0 and WS v2.0 provide high volume once class casing bugs (`Low` vs `low`) and bounding-box coordinates are clipped.
3. **Discard McMaster `Block crack` (5 instances), `Repair` (3,194 instances), and `Pothole` (178 instances):**
   - These classes introduce severe imbalance or conflict with the separate RoadWise pothole model.
4. **Implement Minimum Dimension Thresholding:**
   - Introduce a filter during dataset preprocessing to eliminate bounding boxes where normalized width or height is `< 0.02` (< 13 pixels).
5. **Grouped Train/Val Splitting by Scene ID for McMaster:**
   - Partition McMaster datasets using the scene prefix (`NNNN`) rather than random image sampling to prevent adjacent tile correlation across splits.

---

*Report generated automatically from forensic image sampling and visual overlays. Raw archives remain unchanged. All visual audit assets and human review tables are staged in `reports/dataset_audit/`.*

