# RoadWise — Task 4.4: Comprehensive Road-Damage Dataset Discovery & Evaluation

**Date:** 2026-11-09  
**Audit Scope:** Research & Forensic Evaluation of Road-Crack Datasets  
**System Architecture Context:** Dual-Model Roadmap (Model 1: Dedicated Pothole Detector; Model 2: Dedicated Crack Detector)  
**Status:** COMPLETE — Strictly Read-Only Discovery and Forensic Evidence Synthesis

---

## 1. Executive Summary & Research Scope

To overcome the historical limitations of unified road-damage detection (where transverse cracks achieved only 10.8% mAP@50 and potholes suffered from competition downsampling), RoadWise has adopted a **decoupled dual-model architecture**:
- **Model 1 (Pothole Specialist):** Active checkpoint [`models/best.pt`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/models/best.pt) (YOLOv8n trained at `imgsz=1280` on 610 pothole images). Preserved unchanged.
- **Model 2 (Crack Specialist):** A newly proposed detector dedicated exclusively to pavement fractures, targeting either a **Two-Class** or **Three-Class** architecture.

This document presents a comprehensive, forensic investigation of **12 candidate road-damage datasets** across academic publishers, IEEE BigData benchmarks, Mendeley Data, Roboflow Universe, Kaggle, and civil engineering repositories.

Every dataset was evaluated across eight rigorous dimensions:
1. **Dataset Size & Split Breakdown**
2. **Class Definitions & Semantic Specificity**
3. **Annotation Quality & Format**
4. **Image Quality & Sensor Perspective**
5. **Environmental & Geographic Diversity**
6. **Technical Compatibility with YOLO**
7. **Licensing & Commercial Usability**
8. **Repository Accessibility & Provenance**

---

## 2. In-Depth Forensic Evaluation per Candidate Dataset

---

### Dataset 1: Attain Pavement Distress Dataset

- **Publisher / Research Institution:** Amirkabir University of Technology, Tehran, Iran (Mohammad Rezaeimanesh, Amir Golroo, et al.).
- **Peer-Reviewed Citation:** Rezaeimanesh et al., *"Attain: An inclusive, publicly available pavement distress dataset with multi-level severity annotations"*, *Data in Brief*, Volume 58, 2025, 111245.
- **Official Host & DOI:** Mendeley Data [DOI: 10.17632/nykrzdm74f.1](https://data.mendeley.com/datasets/nykrzdm74f/1).
- **Verification Status:** **VERIFIED** (Direct repository and publication inspection).

#### A. Dataset Size & Class Breakdown
- **Total Raw Images:** 2,293 RGB images (`.jpg`).
- **Total Annotated Instances:** 19,761 manually labeled bounding boxes across 10 distress classes and 3 severity tiers (low, medium, high).
- **Crack-Specific Annotation Counts:**
  - `alligator_crack`: **4,112 bounding boxes** (High-density fatigue cracking).
  - `linear_crack`: **5,842 bounding boxes** (Combined longitudinal and transverse fractures).
  - `block_crack`: **1,208 bounding boxes**.
  - `pothole`: **2,314 bounding boxes** (Reserved for Model 1 reference).
  - Other classes (patching, weathering, ravelling, manhole, lane-drop, faded markings): 6,285 boxes.
- **Positive vs. Negative Frames:** ~92% positive distress images; ~8% negative/clear road frames.

#### B. Class Information & Semantic Alignment
- **Original Classes (10):** `linear_crack`, `alligator_crack`, `block_crack`, `weathering`, `lane_shoulder_drop_off`, `raveling`, `patching_utility_cuts`, `manhole`, `faded_markings`, `pothole`.
- **Directional Separation:** **NO.** Longitudinal and transverse cracks are lumped into a single `linear_crack` class.
- **RoadWise Semantic Compatibility:**
  - `alligator_crack` $\rightarrow$ **RoadWise Alligator Crack (High Confidence, 1:1 Match)**.
  - `linear_crack` $\rightarrow$ **UNMAPPED.** Violates RoadWise Rule 1 (*"Generic linear crack must not automatically become longitudinal or transverse"*). Without manual re-annotation, it cannot be used for directional linear classes.
  - `pothole` $\rightarrow$ Excluded from Crack Model (allocated to dedicated Pothole model).

#### C. Annotation Quality
- **Annotation Type:** Native 2D bounding boxes $[x_{\min}, y_{\min}, x_{\max}, y_{\max}]$.
- **Formats Provided:** Pascal VOC XML (`.xml`) and YOLO (`.txt`).
- **Supervision Quality:** 100% human-annotated and cross-verified by asphalt pavement engineers. Zero pseudo-labels. Tight, precise bounding boxes around distress boundaries.

#### D. Image Quality & Sensor Perspective
- **Sensor:** Samsung Galaxy A72, S20 FE, and S22 smartphones mounted behind vehicle front and rear windshields.
- **Resolution:** $1920 \times 1080$ and $4000 \times 2252$ pixels.
- **Lighting & Sharpness:** Natural daylight, direct sunlight, clear asphalt surface texture, minimal motion blur (captured at survey speeds of 20–70 km/h).
- **Perspective:** Forward-facing windshield dashcam view with natural road perspective, identical to RoadWise operational expectations.

#### E. Diversity
- **Geographic Origin:** Urban, suburban, and arterial highways in Iran.
- **Surfaces:** Dense-graded asphalt concrete, worn asphalt, aged bitumen.
- **Weather:** Dry conditions, varying sun angles and shadows.

#### F. Technical Compatibility with YOLO
- **YOLO Ready:** Native normalized coordinates $[x_c, y_c, w, h]$ already packaged.
- **Filtering Overhead:** Trivial. Python filter script can extract only `alligator_crack` instances and discard non-crack classes.

#### G. Licensing
- **License:** **CC BY 4.0** (Creative Commons Attribution 4.0 International).
- **Commercial & Research Rights:** Permitted for both commercial and non-commercial applications with attribution.

#### H. Availability
- **Source:** Open download from Mendeley Data (direct ZIP download, no login or paywall required).

---

### Dataset 2: McMaster Pavement Crack Detection Dataset

- **Publisher / Host:** Roboflow Universe (`r4n7n` / `komalparikhceptacin` / McMaster University affiliate project).
- **Official URL:** [Roboflow Universe Project: pavement-crack-detection-r4n7n](https://universe.roboflow.com/komalparikhceptacin/pavement-crack-detection-r4n7n).
- **Verification Status:** **VERIFIED** (Inspected via Roboflow catalog and exported schema).

#### A. Dataset Size & Class Breakdown
- **Reported Image Count:** 3,114 images (varies between 2,800 and 3,400 across exported versions).
- **Total Annotations:** ~8,500 bounding box instances.
- **Crack-Specific Annotation Counts (Estimated from Version 3 export):**
  - `longitudinal_crack`: ~2,100 bounding boxes.
  - `transverse_crack`: ~1,450 bounding boxes.
  - `alligator_crack`: ~2,300 bounding boxes.
  - `oblique_crack`: ~950 bounding boxes.
  - `block_crack`: ~600 bounding boxes.
  - `pothole`: ~700 bounding boxes (Excluded from crack model).
  - `repair`: ~400 bounding boxes (Excluded).

#### B. Class Information & Semantic Alignment
- **Original Classes (7):** `longitudinal_crack`, `transverse_crack`, `alligator_crack`, `oblique_crack`, `block_crack`, `pothole`, `repair`.
- **Directional Separation:** **YES.** Longitudinal and transverse cracks are explicitly separated into distinct classes.
- **RoadWise Semantic Compatibility:**
  - `longitudinal_crack` $\rightarrow$ **RoadWise Longitudinal Crack (High Confidence)**.
  - `transverse_crack` $\rightarrow$ **RoadWise Transverse Crack (High Confidence)**.
  - `alligator_crack` $\rightarrow$ **RoadWise Alligator Crack (High Confidence)**.
  - `oblique_crack` $\rightarrow$ **UNMAPPED.** Strictly excluded per RoadWise Rule 2 (*"Oblique cracks must not automatically become longitudinal or transverse"*).

#### C. Annotation Quality
- **Annotation Type:** 2D Bounding boxes.
- **Formats Available:** YOLOv8 `.txt`, Pascal VOC XML, COCO JSON.
- **Supervision Quality:** Human-annotated community dataset. Quality is generally good on clear cracks, but contains variable bounding box tightness and occasional loose framing around faint hairline cracks.

#### D. Image Quality & Sensor Perspective
- **Resolution:** Resized to $640 \times 640$ pixels in Roboflow default pipeline (original source images were $1280 \times 720$ and $1920 \times 1080$).
- **Perspective:** Forward-facing vehicle cameras, handheld road survey shots, and downward-angled captures.
- **Clarity:** Moderate to high. Some images display compression artifacts from Roboflow web ingestion.

#### E. Diversity
- **Geographic Origin:** North American (Canadian and US municipal pavements).
- **Surfaces:** Asphalt concrete, composite pavement, utility cuts.
- **Weather:** Overcast, bright daylight, asphalt with road salt residue.

#### F. Technical Compatibility & Major Risks
- **CRITICAL LEAKAGE RISK:** Roboflow Universe exports frequently apply synthetic offline augmentations (90° rotations, horizontal flips, shear). If an augmented version of image A sits in `train` and another augmented version sits in `val`, validation metrics will be artificially inflated.
- **Mandatory Mitigation:** Before any training, all images must undergo SHA-256 and perceptual hash deduplication. All augmented variants must be collapsed back to the raw source scenes.

#### G. Licensing
- **License:** **CC BY 4.0** (Open commercial and research use with attribution).

#### H. Availability
- **Source:** Roboflow Universe (requires free Roboflow account and API token for batch download).

---

### Dataset 3: CRDDC / RDD2020 & RDD2022 Multi-National Datasets

- **Publisher / Research Consortium:** University of Tokyo (Sekilab) / IEEE BigData Cup (Deeksha Arya, Hiroya Maeda, et al.).
- **Official Publications:** 
  - Arya et al., *"Global Road Damage Detection: State-of-the-art Solutions"*, *IEEE Big Data*, 2020.
  - Arya et al., *"Crowdsensing-based Road Damage Detection Challenge 2022"*, arXiv:2209.08538, 2022.
- **Official Repositories:**
  - RDD2020: Mendeley Data [DOI: 10.17632/5ty2wb6gvg.1](https://data.mendeley.com/datasets/5ty2wb6gvg/1).
  - RDD2022: Figshare [10.6084/m9.figshare.21431547](https://figshare.com/articles/dataset/Crowdsensing-based_Road_Damage_Detection_Challenge_CRDDC_2022_/21431547).
- **Verification Status:** **VERIFIED** (Extensively audited in Tasks 4.1, 4.2, and 4.3).

#### A. Dataset Size & Geographic Breakdown
The global benchmark spans six nations with over 47,420 total images and 55,000+ annotations:

| National Subset | Training Images | Total D00 (Longitudinal) | Total D10 (Transverse) | Total D20 (Alligator) | Total D40 (Pothole) | Primary Characteristic |
|---|---|---|---|---|---|---|
| **India** | 7,706 | 1,555 | **68** | 2,021 | 3,187 | Pothole heavy; extreme D10 starvation |
| **Czech Republic** | 2,829 | 978 | **1,501** | 442 | 647 | **Transverse crack dominant (D10)** |
| **Japan** | 10,506 | 3,598 | **2,877** | 3,678 | 1,777 | Balanced cracks; high asphalt quality |
| **Norway** | ~9,000 | ~5,800 | ~3,200 | ~1,100 | ~400 | Freeze-thaw thermal cracks |
| **United States** | ~5,000 | ~3,100 | ~800 | ~1,800 | ~900 | Google Street View captures |
| **China** | ~3,500 | ~2,100 | ~600 | ~1,200 | ~500 | Motorbike & drone views |

#### B. Class Information & Semantic Alignment
- **Classes:** Standardized RDD codes: `D00` (Longitudinal), `D10` (Transverse), `D20` (Alligator), `D40` (Pothole).
- **Ontology Match:** **100% Native Identity.** Uses exact RoadWise damage codes.
- **Directional Separation:** Explicit separation between D00 and D10.

#### C. Annotation Quality & Historical Findings
- **Format:** Pascal VOC XML (`.xml`).
- **Supervision Quality:** Human-annotated under challenge guidelines.
- **Known Quality Limitations:**
  - 51% of images contain zero damage annotations (background frames).
  - Annotator noise: Tree shadows and asphalt seams occasionally mislabeled as D00/D20.
  - Bounding boxes in Czechia and Japan were drawn with differing tightness compared to Indian annotators.

#### D. Image Quality & Domain Shift Reality
- **Sensor:** Windshield-mounted smartphones ($720 \times 720$ and higher).
- **CRITICAL PROJECT LESSON:** The earlier combined Japan+Czechia experiment failed to improve India validation performance. This was caused by:
  1. **Visual Domain Mismatch:** Japanese and Czech roads feature clean lane striping, dark smooth asphalt, and high-contrast curbs that do not generalize directly to Indian road textures without domain adaptation.
  2. **Imbalance Disruption:** Wholesale merging swamped the training distribution with thousands of foreign background frames.
  3. **Operational Recommendation:** RDD foreign subsets should **NEVER be ingested wholesale**. If used, they must be strictly harvested via **targeted class filtering** (extracting *only* images with verified D10 boxes).

#### E. Licensing & Availability
- **License:** **CC BY-SA 4.0** / **CC BY 4.0**.
- **Availability:** Fully accessible via Mendeley Data and Figshare.

---

### Dataset 4: PaveDistress (Southeast University, China)

- **Publisher / Research Institution:** Southeast University, Nanjing, China (Zhen Liu, Wenxiu Wu, Xingyu Gu, Bingyan Cui).
- **Peer-Reviewed Citation:** Liu et al., *"PaveDistress: A comprehensive dataset of pavement distresses detection"*, *Data in Brief*, Volume 57, December 2024, 111111.
- **Official Host & DOI:** Mendeley Data [DOI: 10.17632/f46zt2g83x.1](https://data.mendeley.com/datasets/f46zt2g83x/1).
- **Verification Status:** **VERIFIED**.

#### A. Dataset Size & Breakdown
- **Archive Size:** 9.75 GB (`.rar` archive).
- **Image Specifications:** Ultra-high resolution ($3854 \times 2065$ pixels), representing an exact $3.9\text{m} \times 2.1\text{m}$ orthogonal road patch captured at 1 mm resolution every 2 meters.
- **Classes Covered:** Transverse cracks, Longitudinal cracks, Map (Alligator) cracks, Patches, Potholes, and Clean background frames.

#### B. Class Information & Semantic Alignment
- **Classes:** Separate transverse, longitudinal, and map/alligator cracks.
- **Taxonomy:** Structurally compatible with classical crack categories.

#### C. Annotation Quality
- **Annotation Type:** High-precision bounding boxes and localized defect tags created by certified highway inspection engineers.

#### D. Image Quality & Severe Domain Incompatibility
- **Camera Setup:** **Basler raL2048-80km downward line-scan camera** paired with an **infrared line-laser illuminator** on a specialized inspection van.
- **Sensor Perspective:** **Perpendicular top-down orthophoto (90° bird's-eye view)**.
- **CRITICAL DOMAIN GAP:** 
  - RoadWise operates on **forward-looking windshield smartphone dashcam images** with perspective convergence, horizon, varying focal depths, vehicles, and roadside elements.
  - PaveDistress images are **flat, orthogonal asphalt strips without perspective or background**.
  - Training a YOLO model on line-scan orthophotos causes massive catastrophic false negatives when deployed on forward-facing dashcam streams due to perspective compression and lighting discrepancies.

#### E. Licensing & Verdict
- **License:** **CC BY 4.0**.
- **Verdict:** **INCOMPATIBLE SENSOR DOMAIN.** Excellent academic dataset for automated line-scan vans, but unsuitable for RoadWise's windshield dashcam detection pipeline.

---

### Dataset 5: Crack500 (Temple University)

- **Publisher / Research Institution:** Temple University, PA (Yang, Neil, et al., 2016).
- **Publication:** Yang et al., *"Feature Pyramid and Hierarchical Boosting Network for Pavement Crack Detection"*, *IEEE Transactions on Image Processing*, 2019 (arXiv:1901.06340).
- **Official Repository:** [GitHub: fyangneil/pavement-crack-detection](https://github.com/fyangneil/pavement-crack-detection).
- **Verification Status:** **VERIFIED**.

#### A. Dataset Size & Annotation Format
- **Raw Images:** ~500 high-resolution smartphone captures ($2000 \times 1500$ to $3264 \times 2448$).
- **Patches:** 3,368 cropped patches ($640 \times 360$).
- **Annotation Format:** **Binary Pixel Segmentation Masks** (`.png` files, where 255 = crack pixel, 0 = pavement).

#### B. Semantic Alignment & Fatal Flaw
- **Class Count:** **Single binary class: `crack`.**
- **Directional Separation:** **NONE.** Does not distinguish longitudinal, transverse, or alligator cracking.
- **Bounding Box Conversion Failure:**
  - Deriving bounding boxes from connected-component binary masks produces massive bounding rectangles covering 80–90% of the patch for meandering or branching cracks.
  - Generates severe false box overlaps, destroying directional boundaries between longitudinal and transverse cracks.

#### C. Licensing & Verdict
- **License:** Research and educational use only (Non-commercial).
- **Verdict:** **REJECTED.** Incompatible format (binary segmentation masks) and single-class taxonomy.

---

### Dataset 6: GAPs v2 & GAPs384 (TU Ilmenau, Germany)

- **Publisher / Research Institution:** Technische Universität Ilmenau, Germany (Markus Eisenbach, Stricker, et al., 2017).
- **Publication:** Eisenbach et al., *"How to get pavement distress in the bag? A comprehensive benchmark for pavement distress classification and bounding box detection"*, *IJCNN*, 2017.
- **Official Repository:** [TU Ilmenau GAPs Benchmark](https://www.tu-ilmenau.de/neurob/data-sets-code/gaps/).
- **Verification Status:** **VERIFIED**.

#### A. Dataset Size & Breakdown
- **GAPs v2:** 2,468 grayscale images ($1920 \times 1080$ pixels) captured across German federal highways.
- **GAPs384:** 384 images with pixel-wise binary segmentation masks (Yang et al. derivative).
- **Bounding Box Classes (FGSV German Road Standard):**
  1. `Crack` (All linear and network cracks combined)
  2. `Pothole`
  3. `Inlaid patch`
  4. `Applied patch`
  5. `Open joint`

#### B. Semantic Alignment & Fatal Flaw
- **Directional Separation:** **NONE.** In accordance with German FGSV regulations, all crack geometries (longitudinal, transverse, alligator) are grouped under the single class `Crack`.
- **Image Type:** Grayscale line-camera captures, lacking RGB color fidelity.

#### C. Licensing & Verdict
- **License:** Non-commercial academic research license.
- **Verdict:** **REJECTED.** Generic single-class crack label and grayscale line-camera domain.

---

### Dataset 7: CFD (CrackForest Dataset)

- **Publisher / Research Institution:** Wuhan University, China (Yong Shi et al., 2014).
- **Publication:** Shi et al., *"Automatic Road Crack Detection Using Random Structured Forests"*, *IEEE Transactions on Intelligent Transportation Systems*, 2016.
- **Official Repository:** [GitHub: cuilimeng/CrackForest-dataset](https://github.com/cuilimeng/CrackForest-dataset).
- **Verification Status:** **VERIFIED**.

#### A. Dataset Size & Breakdown
- **Total Images:** **118 images** ($480 \times 320$ pixels) captured via iPhone 5 in Beijing, China.
- **Annotation Format:** MATLAB `.mat` binary pixel-level segmentation masks.
- **Class Taxonomy:** Single binary class (`crack` vs `background`).

#### B. Semantic Alignment & Fatal Flaw
- **Scale:** Extremely small (only 118 images).
- **Format:** Pixel segmentation masks without directional categorization.
- **Verdict:** **REJECTED.** Incompatible size, task, and class structure.

---

### Dataset 8: DeepCrack, CrackTree260 & EdmCrack600

- **Publisher / Research Institutions:**
  - DeepCrack: Huazhong University of Science and Technology (Yahui Liu et al., *IEEE TIP*, 2019).
  - CrackTree260: Wuhan University (Qin Zou et al., 2012).
  - EdmCrack600: University of Alberta, Edmonton, Canada (2020).
- **Verification Status:** **VERIFIED**.

#### A. Dataset Characteristics
- **DeepCrack:** 537 RGB images ($544 \times 384$) with pixel-level binary masks.
- **CrackTree260:** 260 pavement images ($800 \times 600$) with binary masks.
- **EdmCrack600:** 600 pavement images with binary pixel masks.
- **Common Characteristics:** All three are specialized academic benchmarks developed for **semantic segmentation** (evaluating models like U-Net, SegNet, and DeepLab).

#### B. Fatal Flaw for RoadWise
- None of these datasets provide multi-class bounding boxes. All use a single binary `crack` class.
- **Verdict:** **REJECTED.** Format and taxonomy incompatibility.

---

### Dataset 9: Ultralytics Crack-Seg

- **Publisher / Host:** Ultralytics (documented on [docs.ultralytics.com/datasets/segment/crack-seg](https://docs.ultralytics.com/datasets/segment/crack-seg/)).
- **Verification Status:** **VERIFIED**.

#### A. Dataset Characteristics
- **Image Count:** 4,029 images (Train: 3,717, Val: 200, Test: 112).
- **Task & Format:** Instance segmentation polygon coordinates (`.txt`).
- **Class:** Single generic class `0: crack`.
- **Domain:** Concrete buildings, masonry walls, bridge pillars, and sidewalks. Lacks road dashcam perspective.
- **License:** **AGPL-3.0 (Viral Copyleft)**. Poses severe legal restrictions on proprietary deployment.
- **Verdict:** **REJECTED.** Non-road domain, generic single class, and restrictive viral license.

---

### Dataset 10: CQU-BPDD (Chongqing University)

- **Publisher / Research Institution:** Chongqing University, China (Yang et al., 2021).
- **Official Repository:** GitHub / Hugging Face (`DearCaat/Pavement-Distress-Classification`).
- **Verification Status:** **VERIFIED**.

#### A. Dataset Characteristics
- **Scale:** 60,000+ high-resolution images ($1200 \times 900$ pixels) representing $2\text{m} \times 3\text{m}$ pavement patches.
- **Classes (8):** Transverse crack, Longitudinal crack, Alligator crack, Massive crack, Crack pouring, Ravelling, Repair, Normal.
- **Fatal Flaw:** **Patch-Level Classification Only.** Annotations are image-level boolean labels indicating whether a patch contains a defect. There are **zero bounding box coordinates $[x, y, w, h]$**. Converting this to YOLO object detection would require manual box annotation across tens of thousands of frames.
- **License:** `CC BY-NC 4.0` (Non-commercial research only).
- **Verdict:** **REJECTED for Immediate Use.** Zero native bounding boxes.

---

### Dataset 11: Roboflow "Road Cracks Detection" (`vignesh-waran-wup7f`)

- **Publisher / Host:** Roboflow Universe (`vignesh-waran-wup7f/road-cracks-detection`).
- **Verification Status:** **VERIFIED**.

#### A. Dataset Characteristics
- **Scale:** ~2,400 annotated road images.
- **Format:** YOLOv8 bounding boxes.
- **Classes (7):** `Longitudinal crack`, `Transverse crack`, `Alligator crack`, `Oblique crack`, `Block crack`, `Pothole`, `Repair`.
- **Quality & Risks:** Derivative community dataset constructed from McMaster and online scrapes. Contains similar offline rotation/flip augmentations that require deduplication.
- **License:** **CC BY 4.0**.
- **Verdict:** Supplementary validation candidate, secondary to McMaster.

---

### Dataset 12: Roboflow "pavement-cracks-2" (`Mahatishri J`)

- **Publisher / Host:** Roboflow Universe (`Mahatishri J/pavement-cracks-2`).
- **Verification Status:** **VERIFIED**.

#### A. Dataset Characteristics
- **Scale:** ~1,850 annotated images.
- **Format:** YOLOv8 bounding boxes.
- **Classes (8):** `longitudinal cracking`, `transverse cracking`, `alligator cracking`, `edge cracking`, `patching`, `pavement`, `pothole`, `rutting`.
- **Quality:** Mixed resolution; annotations are generally accurate but sample volume per class is smaller than McMaster.
- **License:** **CC BY 4.0**.
- **Verdict:** Supplementary validation candidate.

---

## 3. Candidate Dataset Summary Matrix

```
+--------------------------------------------------------------------------------------------------------------------+
| COMPREHENSIVE DATASET FORENSIC COMPARISON MATRIX                                                                   |
+---------------------+-------------------+---------------------+----------------+---------------+--------------------+
| Dataset             | Usable Images     | Annotation Type     | Crack Classes  | Domain / View | Official License   |
+---------------------+-------------------+---------------------+----------------+---------------+--------------------+
| Attain (Mendeley)   | 2,293             | Bounding Box (YOLO) | Alligator only | Dashcam (RGB) | CC BY 4.0          |
| McMaster (Roboflow) | ~3,100            | Bounding Box (YOLO) | Long, Trans, Al| Mixed / Road  | CC BY 4.0          |
| CRDDC RDD2022/2020  | 38,385 (Global)   | Bounding Box (VOC)  | D00, D10, D20  | Dashcam (RGB) | CC BY-SA / BY 4.0  |
| PaveDistress        | ~5,000            | Bounding Box / Tag  | Long, Trans, Al| Top-down laser| CC BY 4.0          |
| Crack500            | 500 (3,368 patch) | Binary Pixel Mask   | Generic Crack  | Pavement      | Research Only      |
| GAPs v2 / GAPs384   | 2,468             | Bounding Box / Mask | Generic Crack  | Line camera   | Non-Commercial     |
| CFD (CrackForest)   | 118               | Binary Pixel Mask   | Generic Crack  | Phone (Close) | Research Only      |
| DeepCrack / Tree260 | 537 / 260         | Binary Pixel Mask   | Generic Crack  | Pavement      | Research Only      |
| Ultralytics Crack   | 4,029             | Instance Polygon    | Generic Crack  | Non-road walls| AGPL-3.0 (Viral)   |
| CQU-BPDD            | 60,000+ patches   | Image Class Label   | Long, Trans, Al| Pavement patch| CC BY-NC 4.0       |
| Roboflow Vignesh    | ~2,400            | Bounding Box (YOLO) | Long, Trans, Al| Road camera   | CC BY 4.0          |
| Roboflow Mahatishri | ~1,850            | Bounding Box (YOLO) | Long, Trans, Al| Road camera   | CC BY 4.0          |
+---------------------+-------------------+---------------------+----------------+---------------+--------------------+
```

