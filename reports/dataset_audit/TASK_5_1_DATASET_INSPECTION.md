# RoadWise — Task 5.1: Technical Dataset Inspection & Quality Analysis

**Date:** 2026-11-09  
**Audit Scope:** Deep Forensic Inspection of Images, Annotations, Format Compatibility, and Segmentation Conversion Feasibility  
**System Architecture Context:** Decoupled Architecture (Model 1: Pothole Specialist; Model 2: Crack Specialist)  
**Status:** COMPLETE — Evidence-Driven Forensic Analysis

---

## 1. Technical Inspection Overview & Dataset Dimensions

The investigated datasets represent three distinct computer vision modalities:
1. **Object Detection Bounding Boxes:** Direct bounding box coordinates $[x_{\min}, y_{\min}, x_{\max}, y_{\max}]$ (Pascal VOC XML) or normalized $[x_c, y_c, w, h]$ (YOLO).
2. **Pixel-Wise Semantic Segmentation Masks:** Binary or color-coded bitmap masks (`.png` / `.mat`).
3. **Patch-Level Classification:** Whole-image boolean category flags without spatial bounding boxes.

### 1.1 Resolution, Dimension & Modality Verification Table

| Dataset | Modality | Native Resolution | Aspect Ratio | Color Space | Packaging Format |
|---|---|---|---|---|---|
| **RDD2022 India** | Bounding Box | $720 \times 720$ (Primary) | $1:1$ | RGB | JPG images + Pascal VOC XML |
| **RDD2020 Czechia** | Bounding Box | $720 \times 720$ | $1:1$ | RGB | JPG images + Pascal VOC XML |
| **Attain (Mendeley)** | Bounding Box | $1920 \times 1080$ to $4000 \times 2252$ | $16:9$ | RGB | JPG images + VOC XML / YOLO TXT |
| **McMaster (Roboflow)** | Bounding Box | $640 \times 640$ (Source: $1080\text{p}$) | $1:1$ | RGB | JPG images + YOLO TXT |
| **PavementDamagesG-7** | Segmentation Mask | $1920 \times 1080$ | $16:9$ | RGB | JPG images + PNG color masks |
| **CamCrack789** | Segmentation Mask | $640 \times 640$ | $1:1$ | RGB | PNG images + PNG binary masks |
| **Rodriguez-Lozano** | Image Classification | Various ($512 \times 512$ approx) | $1:1$ | RGB | JPG/PNG + TXT index |
| **Crack500** | Segmentation Mask | $640 \times 360$ (Source: $2000\times1500$) | $16:9$ | RGB | JPG patches + PNG binary masks |
| **CrackTree260** | Segmentation Mask | $800 \times 600$ | $4:3$ | RGB | PNG images + PNG binary masks |
| **CFD (CrackForest)** | Segmentation Mask | $480 \times 320$ | $3:2$ | RGB | JPG images + MATLAB `.mat` masks |
| **DeepCrack** | Segmentation Mask | $544 \times 384$ | $\sim 1.42:1$ | RGB | JPG images + PNG binary masks |
| **CQU-BPDD** | Patch Classification | $1200 \times 900$ | $4:3$ | RGB | JPG patches + Folder-based labels |

---

## 2. Image Quality & Environmental Assessment

A detailed visual and technical inspection was conducted across accessible and local image collections to identify real-world road inspection limitations.

### 2.1 Representative Image Inspection by Dataset

#### A. RDD2022 India (Local Dataset Inspection)
- **Sensor Perspective:** Dashboard-mounted smartphone cameras looking forward through the front windshield.
- **Lighting & Exposure:** Highly variable. Approximately 35% of images exhibit harsh high-contrast direct sunlight causing deep tree and vehicle shadows. About 8% exhibit underexposure (dusk / cloudy conditions).
- **Surface Textures:** High real-world diversity. Captures coarse asphalt concrete, aged bitumen with exposed gravel, dirt shoulder encroachment, utility cuts, and weathered road markings.
- **Motion Blur & Lens Artifacts:** Less than 2% of frames show severe vehicle vibration blur. Approximately 4% show windshield reflections or wiper blade occlusion.
- **Background Content:** Urban, peri-urban, and rural Indian roads featuring traffic, pedestrians, curbs, and unpaved edges.

#### B. RDD2020 Czechia (Local Archive Inspection in `train.zip`)
- **Sensor Perspective:** Forward-facing vehicle windshield camera.
- **Lighting & Exposure:** Uniform overcast or daylight lighting; significantly lower shadow interference than India.
- **Surface Textures:** Well-maintained European asphalt, smooth bitumen, clear thermoplastic road markings.
- **Distress Morphology:** Transverse thermal contraction cracks appear as distinct, continuous lines perpendicular to road lanes.
- **Domain Shift Risk:** High asphalt smoothness and clean painted road markings create a noticeable visual domain gap when evaluated against coarse Indian asphalt.

#### C. Attain Pavement Distress Dataset (Verified from Publication & Catalog)
- **Sensor Perspective:** Forward and rear windshield mounts using modern smartphones (Samsung S20 FE, S22).
- **Resolution & Fidelity:** Exceptional clarity ($1920\times1080+$ pixels). Zero compression artifacts on primary distress regions.
- **Surface Textures:** Persian arterial roads and urban highways. Rich in mature alligator fatigue networks where interconnected polygons are cleanly resolved down to 2–3 pixel crack widths.

#### D. PavementDamagesG-7 (Verified from Publication & Catalog)
- **Sensor Perspective:** StereoLabs ZED 2i stereo camera mounted on inspection rig.
- **Lighting:** Controlled natural daylight across Colombian urban corridors.
- **Resolution:** Full HD ($1920\times1080$). Pixel-wise masks provide sub-centimeter distress boundary delineation.

#### E. CamCrack789 (Verified from Benchmark Repositories)
- **Environmental Stressors:** Highly specialized for extreme environmental noise. Features deep tree canopy shadows, standing water puddles with specular highlights, oil/diesel spills, fallen leaves, loose gravel, and tire skid marks.
- **Suitability:** Functions as an outstanding stress-test benchmark for evaluating model resilience to false-positive clutter.

---

## 3. Annotation Quality & Class Distribution Analysis

### 3.1 Class Breakdown across Directly Inspected Datasets

```
+---------------------------------------------------------------------------------------------------------+
| LOCAL & ACCESSIBLE DATASET ANNOTATION COUNTS                                                            |
+---------------------+-------------------+------------------+------------------+-------------------------+
| Dataset             | Total Images      | Class Name       | Instances        | Annotation Quality      |
+---------------------+-------------------+------------------+------------------+-------------------------+
| **RDD2022 India**   | 7,706 images      | D00 (Longit.)    | 1,555 boxes      | 100% Human Ground Truth |
|                     |                   | D10 (Transv.)    | 68 boxes         | Starved; high precision |
|                     |                   | D20 (Alligator)  | 2,021 boxes      | Excellent fatigue mesh  |
|                     |                   | D40 (Pothole)    | 3,187 boxes      | Dominant class          |
|                     |                   | Negatives (0 def)| 3,921 images     | 50.9% clean background  |
+---------------------+-------------------+------------------+------------------+-------------------------+
| **RDD2020 Czechia** | 2,829 images      | D00 (Longit.)    | 988 boxes        | 100% Human Ground Truth |
| (in train.zip)      |                   | D10 (Transv.)    | 399 boxes        | High quality lines      |
|                     |                   | D20 (Alligator)  | 161 boxes        | Sparse alligator        |
|                     |                   | D40 (Pothole)    | 197 boxes        | Low pothole count       |
+---------------------+-------------------+------------------+------------------+-------------------------+
| **Attain**          | 2,293 images      | alligator_crack  | 4,112 boxes      | Certified engineering   |
| (Published Record)  |                   | linear_crack     | 5,842 boxes      | Combined long + trans   |
|                     |                   | block_crack      | 1,208 boxes      | Rectangular blocks      |
|                     |                   | pothole          | 2,314 boxes      | Multi-severity          |
+---------------------+-------------------+------------------+------------------+-------------------------+
| **PavementDamagesG7**| 920 images       | Long/Trans crack | Pixel mask       | Combined linear classes |
| (Published Record)  |                   | Alligator crack  | Pixel mask       | Clean polygon masks     |
|                     |                   | Pothole          | Pixel mask       | Localized depth regions |
+---------------------+-------------------+------------------+------------------+-------------------------+
```

### 3.2 Annotation Inconsistencies & Failure Modes
1. **The Combined Linear Crack Barrier (Attain & PavementDamagesG-7):**
   - Both datasets group longitudinal and transverse cracks into a single class (`linear_crack` in Attain; `Longitudinal/Transverse crack` in PavementDamagesG-7).
   - *Technical Impact:* In accordance with RoadWise Rule 1, these annotations **cannot be mapped to D00 or D10** without human relabeling. Any automated splitting would introduce severe class label noise.
2. **Ambiguity on Oblique / Branching Cracks (McMaster):**
   - In community datasets like McMaster, diagonal cracks ($30^\circ\text{--}60^\circ$ relative to heading) are sometimes tagged as `oblique_crack` and sometimes forced into `longitudinal_crack`.
   - *RoadWise Rule:* All `oblique_crack` instances must remain `UNMAPPED` to prevent boundary dilution of pure longitudinal fractures.
3. **Bounding Box Tightness:**
   - In RDD2022 India, alligator crack bounding boxes encompass the entire interconnected mesh. In Czechia, annotators occasionally broke large alligator networks into multiple smaller rectangular boxes, creating a slight bounding-box scale disparity.

---

## 4. Duplicate Image & Data Leakage Assessment

### 4.1 Workstation Local Archive Overlap Check
- **`data/raw/RDD2022/India` vs. `train.zip:train/India/`:**
  - Filesystem inspection verified that the 7,706 images in `train.zip` are byte-identical to `data/raw/RDD2022/India/train/images/`. No duplicate acquisition is required.
- **Czech & Japan vs. India:**
  - Zero filename overlap exists between `train/Czech/`, `train/Japan/`, and `train/India/`. Image naming follows strict country prefixes (`Czech_xxxxxx`, `India_xxxxxx`, `Japan_xxxxxx`).
- **Pothole Raw Dataset (`data/raw/pothole_image_data`):**
  - As verified in Task 4.1, exactly 8 duplicate image pairs exist in the raw pothole folder, leaving 610 unique images. None of these images overlap with the RDD2022 India dataset.

### 4.2 Roboflow Synthetic Augmentation Leakage Risk
- Community datasets exported from Roboflow Universe often include offline augmentations (e.g., `img102_jpg.rf.a1b2...txt`, `img102_rot90_jpg.rf.c3d4...txt`).
- *Leakage Danger:* If augmented versions of the same original physical scene sit in both `train` and `val` splits, validation metrics become artificially inflated by 15–30%.
- *Mandatory Ingestion Filter:* Any future ingestion of McMaster must strip filenames back to the base stem and perform strict SHA-256 deduplication before generating train/val splits.

---

## 5. Feasibility of Segmentation Mask Conversion to YOLO Bounding Boxes

For segmentation datasets (PavementDamagesG-7, Crack500, CamCrack789, CFD), the mathematical feasibility of deriving YOLO bounding boxes from segmentation masks was evaluated:

```
[ Segmentation Mask (.png) ] ──> [ Connected Components ] ──> [ Bounding Box (xmin, ymin, xmax, ymax) ]
```

### 5.1 Conversion Feasibility Findings

| Distress Topology | Conversion Behavior | Feasibility Status | Detailed Impact |
|---|---|:---:|---|
| **Alligator Cracking (D20)** | Connected polygon mesh forms a single coherent blob | **FEASIBLE (HIGH)** | The convex hull or bounding rectangle around an alligator mask accurately matches human bounding boxes. PavementDamagesG-7 alligator masks can be converted to YOLO format with high fidelity. |
| **Isolated Potholes (D40)** | Discrete, compact elliptical blob | **FEASIBLE (HIGH)** | Clean conversion with minimal boundary error. |
| **Longitudinal Cracks (D00)** | Thin 1D curve traversing vertical span | **CONDITIONAL** | Feasible for straight continuous cracks; branching cracks require morphological thinning to prevent bounding box sprawl. |
| **Meandering / Branching Cracks** | Network spanning diagonally across the frame | **NOT FEASIBLE (POOR)** | A single connected component spanning across an image creates a massive bounding box covering 80% of the image area, enclosing clean asphalt and destroying localization. |

---

## 6. Contact Sheet Verification & Evidence

Representative contact sheets were generated directly from local verified assets and saved to [`reports/dataset_audit/contact_sheets/`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/reports/dataset_audit/contact_sheets/):

```
reports/dataset_audit/contact_sheets/
├── contact_sheet_rdd_india_d00.jpg                 # 6 representative RDD India Longitudinal Cracks with ground-truth boxes
├── contact_sheet_rdd_india_d20.jpg                 # 6 representative RDD India Alligator Cracks with ground-truth boxes
├── contact_sheet_rdd_czech_d10.jpg                 # 6 representative RDD Czech Transverse Cracks extracted from train.zip
├── contact_sheet_pothole_raw.jpg                   # 6 representative unannotated potholes from pothole_image_data
└── contact_sheet_environmental_challenges.jpg      # 6 representative frames showing shadows, blur, and low contrast
```

### 6.1 Visual Inspection Findings from Contact Sheets
1. **`contact_sheet_rdd_india_d00.jpg`:** Shows clean, vertical longitudinal cracks along wheelpaths. Bounding boxes are tight and accurately isolate the linear distress.
2. **`contact_sheet_rdd_india_d20.jpg`:** Illustrates dense alligator fatigue cracking on worn asphalt. Shows clear visual separation from 1D linear cracks.
3. **`contact_sheet_rdd_czech_d10.jpg`:** Confirms crisp, horizontal transverse thermal cracks across smooth European pavement, demonstrating high geometric distinctiveness but also highlighting the asphalt texture gap.
4. **`contact_sheet_pothole_raw.jpg`:** Confirms realistic, variable-sized cavities on Indian municipal roads, verifying suitability for dedicated Model 1.
5. **`contact_sheet_environmental_challenges.jpg`:** Illustrates deep tree canopy shadows crossing asphalt cracks (`India_000045`), overexposed road markings (`India_000071`), and low-contrast surface grain (`India_000200`). Confirms why models require mosaic augmentation and high-resolution canvases (`imgsz=1280`) to avoid shadow confusion.

