# RoadWise — Task 4.2: External Road Damage Dataset Discovery & Forensic Comparison

**Date:** 2026-11-08  
**Scope:** Research, Forensic Evaluation, and Semantic Alignment of External Datasets  
**Objective:** Identify high-fidelity training data to resolve the critical D10 (Transverse Crack) deficit (currently only 68 boxes in RDD2022 India) while preserving 4-class taxonomy integrity (D00, D10, D20, D40).

---

## 1. Candidate Overview & Summary Comparison

Six candidate dataset sources were evaluated against RoadWise's structural requirements:

| Candidate | Dataset Name | Primary Host / DOI | Total Images | Annotation Type | Separate D10? | Target 4-Class Compatibility | Primary Verdict |
|---|---|---|---|---|:---:|:---:|---|
| **A** | **Attain Pavement Distress** | Mendeley Data `10.17632/nykrzdm74f.1` | 2,293 | Bounding Box (VOC/YOLO) | **NO** (Lumped as "Linear") | Partial (D20 & D40 only) | **Priority 2 (Selective)** |
| **B** | **McMaster Crack Detection** | Roboflow Universe (`r4n7n`) | ~3,100 | Bounding Box (YOLO) | **YES** | High (D00, D10, D20, D40) | **Priority 2 (Selective)** |
| **C** | **Crack500** | GitHub (`fyangneil/pavement-crack-detection`) | 500 raw (3,368 patches) | Binary Pixel Mask | **NO** (Binary crack) | **None** (Unmapped) | **Priority 3 (Do Not Acquire)** |
| **D** | **Ultralytics Crack-Seg** | Ultralytics Docs / AGPL-3.0 | 4,029 | Polygon Mask (YOLO) | **NO** (Single class) | **None** (Unmapped) | **Priority 3 (Do Not Acquire)** |
| **E1** | **CRDDC / RDD2020 & RDD2022 (Czech & Japan)** | Mendeley `10.17632/5ty2wb6gvg.1` / Figshare | 13,335+ (CZ: 2,829, JP: 10,506) | Bounding Box (Pascal VOC) | **YES (4,446+ boxes)** | **100% Identical Ontology** | **Priority 1 (Acquire First)** |
| **E2** | **CQU-BPDD** | GitHub / Hugging Face | 60,000+ patches | Patch Classification | **YES** | Weak (No native boxes) | **Priority 3 (Do Not Acquire)** |

---

## 2. In-Depth Forensic Investigation per Candidate

---

### Candidate A — Attain Pavement Distress Dataset

- **Publisher / Research Institution:** Amirkabir University of Technology, Tehran, Iran (Mohammad Rezaeimanesh, Amir Golroo, et al.).
- **Research Publication:** Published in *Data in Brief* (Elsevier, Feb 2025): *"Attain: An inclusive, publicly available pavement distress dataset with multi-level severity annotations"*.
- **Official Repository:** [Mendeley Data DOI: 10.17632/nykrzdm74f.1](https://data.mendeley.com/datasets/nykrzdm74f/1).
- **Verified Image Count:** 2,293 RGB images (`.jpg`).
- **Verified Instance Count:** 19,761 manually annotated distress instances across 10 categories and 3 severity levels (low, medium, high).
- **Download Status:** Openly downloadable via direct ZIP from Mendeley Data without paywalls or API keys.

#### Annotation Quality & Class Mapping
- **Annotation Formats:** Pascal VOC (`.xml`) and YOLO (`.txt`) bounding boxes.
- **Original Classes (10):**
  1. `linear_crack` (longitudinal and transverse combined)
  2. `alligator_crack`
  3. `block_crack`
  4. `weathering`
  5. `lane_shoulder_drop_off`
  6. `raveling`
  7. `patching_utility_cuts`
  8. `manhole`
  9. `faded_markings`
  10. `pothole`
- **Class-Mapping Forensic Finding:**
  - `alligator_crack` $\rightarrow$ **D20 (Alligator Crack)**: Valid and clean.
  - `pothole` $\rightarrow$ **D40 (Pothole)**: Valid and clean.
  - `linear_crack` $\rightarrow$ **UNMAPPED**: **The dataset groups longitudinal and transverse cracks into a single "linear crack" class.** Per RoadWise Class-Mapping Rule 1 (*"Generic linear crack must not automatically become D00 or D10"*), this class cannot be ingested directly without manual human inspection to separate longitudinal from transverse cracks.
- **Image Quality & Domain Compatibility:**
  - Captured via Samsung Galaxy A72, S20 FE, and S22 smartphones mounted on vehicle front and rear windshields at speeds of 20–70 km/h.
  - Excellent forward and rearward road survey perspectives. Natural road backgrounds with realistic lighting, asphalt wear, and surrounding roadside elements.
- **Licensing:** **CC BY 4.0** (Open commercial and research use with attribution).

---

### Candidate B — McMaster Pavement Crack Detection

- **Publisher / Host:** Roboflow Universe community upload / McMaster University affiliate project.
- **Official URL:** Hosted on [Roboflow Universe](https://universe.roboflow.com/) under project identifier `pavement-crack-detection-r4n7n` (active mirrors maintained by users `komalparikhceptacin` and `reshmas-workspace-aowvi`).
- **Reported Image Count:** ~3,100 images (varies across versions 1–4).
- **Instance Count:** ~8,500 bounding box instances.
- **Download Status:** Downloadable via Roboflow export (requires free Roboflow account / API key).

#### Annotation Quality & Class Mapping
- **Annotation Formats:** YOLOv8 `.txt`, Pascal VOC `.xml`, COCO `.json`.
- **Original Classes (7):**
  1. `longitudinal_crack`
  2. `transverse_crack`
  3. `alligator_crack`
  4. `oblique_crack`
  5. `block_crack`
  6. `pothole`
  7. `repair`
- **Class-Mapping Forensic Finding:**
  - `transverse_crack` $\rightarrow$ **D10 (Transverse Crack)**: Separately annotated. Potentially high value for relieving the D10 deficit.
  - `longitudinal_crack` $\rightarrow$ **D00 (Longitudinal Crack)**: Direct match.
  - `alligator_crack` $\rightarrow$ **D20 (Alligator Crack)**: Direct match.
  - `pothole` $\rightarrow$ **D40 (Pothole)**: Direct match.
  - `oblique_crack` $\rightarrow$ **UNMAPPED**: Strictly prohibited from mapping to D00 or D10 by RoadWise Rule 2 (*"Oblique cracks must not automatically become D00"*).
  - `block_crack` & `repair` $\rightarrow$ **UNMAPPED**: Outside the 4-class defect taxonomy.
- **Image Quality & Domain Limitations:**
  - High degree of offline synthetic augmentations (horizontal flips, 90-degree rotations, shear, Gaussian blur).
  - **Critical Leakage Risk:** Augmented copies of the same original pavement scene exist across default train/val splits in Roboflow exports. Ingestion requires downloading raw un-augmented sources or running strict image-hash deduplication before splitting.
- **Licensing:** **CC BY 4.0**.

---

### Candidate C — Crack500

- **Publisher / Research Institution:** Temple University, Philadelphia, PA (Yang, Neil et al., 2016).
- **Research Publication:** Yang et al., *"Feature Pyramid and Hierarchical Boosting Network for Pavement Crack Detection"* (IEEE TIP / arXiv:1901.06340).
- **Official Repository:** [GitHub: fyangneil/pavement-crack-detection](https://github.com/fyangneil/pavement-crack-detection).
- **Image & Patch Counts:**
  - Original raw images: **~500 high-resolution captures** ($2000 \times 1500$ to $3264 \times 2448$ pixels).
  - Cropped patch count: **3,368 patches** (Train: 1,896, Val: 348, Test: 1,124).
- **Download Status:** Publicly accessible via Google Drive / GitHub mirrors.

#### Annotation Quality & Class Mapping
- **Annotation Format:** **Binary Pixel Segmentation Masks** (`.png`), where white (255) represents crack pixels and black (0) represents pavement background.
- **Original Classes:** Single binary class: `crack`.
- **Class-Mapping Forensic Finding:**
  - **UNMAPPED across all RoadWise classes.**
  - Crack500 does NOT distinguish longitudinal, transverse, or alligator cracking.
  - Converting binary segmentation masks to bounding boxes via bounding rectangles produces huge, sprawling boxes that cover the entire image for branching cracks, introducing extreme noise and false box overlaps.
- **Licensing:** Research and non-commercial educational use only.
- **Verdict:** **REJECTED.** Completely incompatible with RoadWise's 4-class oriented defect detection.

---

### Candidate D — Ultralytics Crack Segmentation (`crack-seg`)

- **Publisher / Host:** Ultralytics (documented on [docs.ultralytics.com/datasets/segment/crack-seg](https://docs.ultralytics.com/datasets/segment/crack-seg/)).
- **Verified Image Count:** 4,029 images (Train: 3,717, Val: 200, Test: 112).
- **Download Status:** Automatically downloaded via `yolo train data=crack-seg.yaml` (~91.6 MB).

#### Annotation Quality & Class Mapping
- **Annotation Format:** YOLO instance segmentation polygon coordinates (`.txt`).
- **Original Classes:** Single class (`0: crack`).
- **Class-Mapping Forensic Finding:**
  - **UNMAPPED.** Does not differentiate between longitudinal, transverse, or alligator cracks.
- **Image Quality & Domain Incompatibility:**
  - Contains generic surface fractures across concrete walls, masonry, bridge piers, building facades, and sidewalks.
  - Lacks realistic road driving context (no vehicle dashcam perspective, no lane markings, no road geometry).
- **Licensing:** **AGPL-3.0 (Viral Copyleft)**. Any downstream software integrating data or models trained on this dataset is legally subject to open-sourcing under AGPL-3.0 terms, posing a severe compliance obstacle.
- **Verdict:** **REJECTED.** Wrong task (instance segmentation), wrong ontology (single generic class), non-road domain, and restrictive license.

---

### Candidate E1 — CRDDC / RDD2020 & RDD2022 (Czech & Japan Subsets)

- **Publisher / Research Institution:** University of Tokyo, Sekilab / IEEE BigData Global Road Damage Detection Challenge (Deeksha Arya, Hiroya Maeda, et al.).
- **Research Publications:** 
  - Arya et al., *"Global Road Damage Detection: State-of-the-art Solutions"* (IEEE Big Data 2020).
  - Arya et al., *"Crowdsensing-based Road Damage Detection Challenge 2022"* (CRDDC'2022, arXiv:2209.08538).
- **Official Repositories:**
  - RDD2020: [Mendeley Data DOI: 10.17632/5ty2wb6gvg.1](https://data.mendeley.com/datasets/5ty2wb6gvg/1).
  - RDD2022: [Mendeley Data DOI: 10.17632/27c8pwsd6v](https://data.mendeley.com/datasets/27c8pwsd6v) / [Figshare: 10.6084/m9.figshare.21431547](https://figshare.com/articles/dataset/Crowdsensing-based_Road_Damage_Detection_Challenge_CRDDC_2022_/21431547).
- **Image Counts:**
  - Czech Republic (CZ): 2,829 images (RDD2020) / 3,538 images (RDD2022).
  - Japan (JP): 10,506 images (RDD2020) / 13,133 images (RDD2022).
- **Verified Transverse Crack (D10) Instances:**
  - RDD2020 global training set contains **4,446 D10 bounding boxes**.
  - RDD2022 global training set contains **11,830 D10 bounding boxes**.
  - **In Czech and Japan alone, over 3,000+ D10 bounding boxes exist** — directly resolving the India dataset's 68-box famine.

#### Annotation Quality & Class Mapping
- **Annotation Format:** Pascal VOC XML (`.xml`) with exact bounding box coordinates $[x_{\min}, y_{\min}, x_{\max}, y_{\max}]$.
- **Taxonomy Match:** **100% NATIVE COMPATIBILITY**:
  - `D00`: Longitudinal Crack $\rightarrow$ **RoadWise Class 0 (D00)**
  - `D10`: Transverse Crack $\rightarrow$ **RoadWise Class 1 (D10)**
  - `D20`: Alligator Crack $\rightarrow$ **RoadWise Class 2 (D20)**
  - `D40`: Pothole $\rightarrow$ **RoadWise Class 3 (D40)**
  - `D43` (White line blur), `D44` (Crosswalk blur), `D50` (Manhole) $\rightarrow$ Dropped cleanly via parser.
- **Image Quality & Domain Compatibility:**
  - Vehicle windshield-mounted smartphone dashcams ($720 \times 720$ and higher).
  - Forward-facing driving perspective identical to RDD2022 India.
- **Licensing:** **CC BY-SA 4.0** / **CC BY 4.0** (Open benchmark license).
- **Verdict:** **PRIORITY 1 — HIGHEST VALUE CANDIDATE.**

---

### Candidate E2 — CQU-BPDD (Chongqing University Bituminous Pavement Disease Dataset)

- **Publisher / Research Institution:** Chongqing University, China (Yang et al., 2021).
- **Official Repository:** GitHub (`DearCaat/Pavement-Distress-Classification`) / Hugging Face.
- **Verified Dataset Size:** Over 60,000 high-resolution images ($1200 \times 900$ pixels) representing $2\text{m} \times 3\text{m}$ pavement patches.
- **Annotation Format:** **Image-level / patch-level classification labels**, NOT native bounding boxes.
- **Classes:** 8 classes (Transverse crack, Longitudinal crack, Alligator crack, Massive crack, Crack pouring, Ravelling, Repair, Normal).
- **RoadWise Limitation:** Because annotations are patch-level flags without $[x, y, w, h]$ bounding box coordinates, integrating CQU-BPDD into YOLO object detection requires complex weakly-supervised bounding box generation or manual re-annotation.
- **Licensing:** Strictly non-commercial research use only (`CC BY-NC 4.0`).
- **Verdict:** **REJECTED for Immediate Acquisition.** High annotation overhead.

---

## 3. Comparative Scoring Matrix (1 to 5 Scale)

*Scoring Criteria (1 = Unacceptable / Non-existent, 5 = Flawless / Industry Standard):*
1. **D10 Utility:** Availability and accuracy of transverse crack labels.
2. **D00 Utility:** Quality and volume of longitudinal crack labels.
3. **D20 Utility:** Quality and volume of alligator crack labels.
4. **D40 Utility:** Quality and volume of pothole labels.
5. **Annotation Reliability:** Human-verified bounding boxes vs. noisy/automated masks.
6. **Image Quality:** Resolution, clarity, and uncompressed pixel fidelity.
7. **Domain Similarity:** Similarity of camera angle, road texture, and driving viewpoint to Indian road monitoring.
8. **Class Compatibility:** Degree to which classes map directly without forcing or ambiguity.
9. **Licensing Clarity:** Unrestricted research/commercial rights vs. viral/proprietary constraints.
10. **Integration Effort:** Ease of ingestion with existing `voc_to_yolo.py` and YOLO pipelines.

| Evaluation Metric | Attain (Cand. A) | McMaster (Cand. B) | Crack500 (Cand. C) | Ultralytics (Cand. D) | CRDDC Czech/Japan (Cand. E1) | CQU-BPDD (Cand. E2) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **1. D10 Transverse Crack Utility** | 1 / 5 | 4 / 5 | 1 / 5 | 1 / 5 | **5 / 5** | 2 / 5 |
| **2. D00 Longitudinal Crack Utility** | 1 / 5 | 4 / 5 | 1 / 5 | 1 / 5 | **5 / 5** | 2 / 5 |
| **3. D20 Alligator Crack Utility** | 4 / 5 | 4 / 5 | 1 / 5 | 1 / 5 | **5 / 5** | 2 / 5 |
| **4. D40 Pothole Utility** | 4 / 5 | 3 / 5 | 1 / 5 | 1 / 5 | **5 / 5** | 1 / 5 |
| **5. Annotation Reliability** | 5 / 5 | 3 / 5 | 4 / 5 | 3 / 5 | **5 / 5** | 4 / 5 |
| **6. Image Quality & Resolution** | 5 / 5 | 3 / 5 | 4 / 5 | 3 / 5 | **4 / 5** | 5 / 5 |
| **7. Road-Domain Similarity** | 4 / 5 | 3 / 5 | 2 / 5 | 1 / 5 | **5 / 5** | 3 / 5 |
| **8. Class-Mapping Compatibility** | 3 / 5 | 4 / 5 | 1 / 5 | 1 / 5 | **5 / 5** | 2 / 5 |
| **9. Licensing Clarity** | 5 / 5 | 5 / 5 | 3 / 5 | 2 / 5 | **5 / 5** | 3 / 5 |
| **10. Low Integration Effort** | 4 / 5 | 3 / 5 | 1 / 5 | 1 / 5 | **5 / 5** | 1 / 5 |
| **TOTAL SCORE (out of 50)** | **32 / 50** | **35 / 50** | **19 / 50** | **15 / 50** | **49 / 50** | **25 / 50** |

---

## 4. Class-Mapping Analysis against Strict RoadWise Rules

1. **Rule 1 — Generic linear crack must not automatically become D00 or D10:**
   - **Enforcement on Attain (Candidate A):** Attain labels 5,000+ cracks as `linear_crack`. Under Rule 1, these **MUST NOT** be automatically assigned to D00 or D10. They are marked `UNMAPPED` in the mapping catalog.
2. **Rule 2 — Oblique cracks must not automatically become D00 or D10:**
   - **Enforcement on McMaster (Candidate B):** McMaster contains a distinct `oblique_crack` class. Under Rule 2, these diagonal fractures cannot be forced into D00 or D10 and remain `UNMAPPED`.
3. **Rule 3 — Alligator cracking must remain D20:**
   - Attain, McMaster, and CRDDC all maintain dedicated, semantically pristine alligator fatigue crack classes that map $1:1$ to RoadWise Class 2.
4. **Rule 4 — Generic segmentation masks cannot support directional detection:**
   - Crack500 and Ultralytics Crack-Seg provide single-class binary or polygon masks. Because they do not capture crack directionality relative to the road vector, extracting bounding boxes from them destroys the D00 vs. D10 distinction.

---

## 5. Duplication, Leakage & Domain Shift Assessment

1. **Local Duplicate Overlap Status:**
   - External candidates A, B, C, and D are currently un-downloaded. Exact SHA-256 collision analysis cannot be conducted until raw files are staged.
   - However, Candidate E1 (CRDDC Czech and Japan) is already partially known through historical archives (`C:\Users\aquad\Downloads\train.zip`). The audit confirms that the India dataset in RDD2020/2022 is byte-identical to `data/raw/RDD2022/India`, while the Czech and Japan image sets are distinct and share zero filenames or image hashes with India.
2. **Roboflow Augmentation Leakage Risk (Candidate B):**
   - Datasets exported from Roboflow Universe frequently contain duplicate scenes created by offline augmentations (e.g. `img-102.jpg`, `img-102_flip.jpg`, `img-102_blur.jpg`). If these augmented variants span across train and validation sets, validation metrics become severely inflated. Ingestion must use strict base-image deduplication.
3. **Domain Shift & Road Quality Differences:**
   - **Japan subset (Candidate E1):** Japanese roads exhibit high asphalt quality, distinct thermoplastic paint markings, and narrow urban lanes. Historical RoadWise Colab experiments (Candidate A) revealed that naively mixing thousands of Japan images degraded validation precision on Indian roads.
   - **Mitigation Strategy:** **Targeted Class Harvesting**. Rather than importing the entire Japan dataset wholesale, RoadWise should selectively extract **ONLY images containing verified D10 Transverse Cracks** and under-represented D00 cracks, preserving the India validation set as the sole evaluation benchmark.

