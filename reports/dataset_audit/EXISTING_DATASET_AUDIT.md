# RoadWise — Task 4.1: Existing Dataset Forensic Audit Report

**Date:** 2026-11-08  
**Audit Mode:** READ-ONLY Forensic Investigation  
**Auditor:** RoadWise ML Engineering Agent  
**Status:** COMPLETE (All accessible dataset sources inspected and quantified)

---

## 1. Executive Summary & Forensic Inventory

This audit comprehensively examines every dataset resource accessible to the RoadWise project on this system. It verifies raw source files, Pascal VOC XML annotations, converted YOLO splits, external candidate archives, and historical MacBook experiment artifacts.

### Summary Table of Audited Dataset Sources

| Dataset Source | Storage Location | Images | Annotation Type | Target 4-Class BBs | Status / Historical Decision |
|---|---|---|---|---|---|
| **RDD2022 India (Raw Train)** | `data/raw/RDD2022/India/train/` | 7,706 | Pascal VOC XML (7,706 files) | 6,831 (8,203 total incl. unmapped) | **Active Primary Baseline** |
| **RDD2022 India (Raw Test)** | `data/raw/RDD2022/India/test/` | 1,959 | None (Competition Blind Test) | 0 | Held out (Blind test set) |
| **Processed YOLO Dataset** | `data/processed/yolo/` | 7,706 | YOLO `.txt` (7,706 files) | 6,831 | **Active Training / Validation / Test** |
| **Pothole Image Collection** | `C:\Users\aquad\Downloads\new dataset.zip` | 618 (610 unique) | None in archive (Raw imagery) | 0 ground truth (Pseudo-labeled on Mac) | Historical MacBook pseudo-label source |
| **Road-damage v3 (Extra)** | `C:\Users\aquad\OneDrive\Desktop\RoadWise_Extra_Dataset` | 1,263 (421 source x 3) | YOLO `.txt` (5 classes) | 2,605 | Rejected (Augmentation leakage & distortion) |
| **CRDDC Japan v7 (RDD Extra)** | `C:\Users\aquad\OneDrive\Desktop\RoadWise_RDD_Extra` | 3,506 | YOLO `.txt` (7 classes) | 3,506 | Rejected (Domain shift & label issues) |

---

## 2. RDD2022 India Dataset Audit

### 2.1 File Counts & Annotation Correspondence
- **Raw Training Images:** 7,706 images (`.jpg` format) in `data/raw/RDD2022/India/train/images/`.
- **Raw Test Images:** 1,959 images (`.jpg` format) in `data/raw/RDD2022/India/test/images/`.
- **XML Annotation Files:** 7,706 files in `data/raw/RDD2022/India/train/annotations/xmls/`.
- **Image-to-Annotation Correspondence:** Exactly 1:1.
  - Missing XMLs for train images: **0**
  - Orphan XMLs without train images: **0**
  - XML Parse Errors: **0**

### 2.2 Image Integrity & Geometric Characteristics
- **Corrupt or Unreadable Images:** **0** (All 7,706 images successfully verified via PIL).
- **Exact Duplicate Images:** **0** (SHA-256 collision check across all 7,706 train images yielded 0 duplicates).
- **Canvas Dimensions & Aspect Ratio:**
  - $100\%$ of images sampled have a uniform resolution of **$720 \times 720$ pixels** (1:1 square aspect ratio).
  - 3-channel RGB color.

### 2.3 Bounding Box & Annotation Integrity
- **Total Bounding Box Annotations:** **8,203**
- **Degenerate Bounding Boxes:** **0** (No boxes where $x_{\min} \ge x_{\max}$ or $y_{\min} \ge y_{\max}$).
- **Out-of-Bounds Bounding Boxes:** **0** (All boxes lie strictly within $[0, 720] \times [0, 720]$).
- **Images Containing No Defects (Negative Background Images):** **3,921** ($50.88\%$ of train set).
- **Images Containing Defects:** **3,785** ($49.12\%$ of train set).
- **Multi-Class Defect Images:** **1,493** images contain bounding boxes from more than one defect class.

### 2.4 Complete Raw Class Distribution in RDD2022 India

The raw XML annotations contain 10 distinct class labels. Only 4 correspond to the RoadWise defect taxonomy:

| Raw Class Label | Semantic Meaning | RoadWise Target ID | Bounding Box Count | Image Count | % of All Boxes |
|---|---|---|---|---|---|
| **D00** | Longitudinal Crack | 0 (`longitudinal_crack`) | **1,555** | 1,109 | 18.96% |
| **D10** | Transverse Crack | 1 (`transverse_crack`) | **68** | 60 | **0.83% (CRITICAL DEFICIT)** |
| **D20** | Alligator Crack | 2 (`alligator_crack`) | **2,021** | 1,758 | 24.64% |
| **D40** | Pothole | 3 (`pothole`) | **3,187** | 1,530 | 38.85% |
| *Subtotal (Target 4 Classes)* | | | **6,831** | **3,223** | **83.27%** |
| **D44** | Crosswalk Blur | Dropped | 1,062 | 869 | 12.95% |
| **D01** | Longitudinal Repair/Patch | Dropped | 179 | 118 | 2.18% |
| **D43** | White Line Blur | Dropped | 57 | 57 | 0.70% |
| **D11** | Transverse Repair/Patch | Dropped | 45 | 36 | 0.55% |
| **D50** | Manhole / Utility Cover | Dropped | 28 | 28 | 0.34% |
| **D0w0** | Annotation Typo for D00 | Dropped (`India_006129.xml`) | 1 | 1 | 0.01% |
| *Subtotal (Unmapped Classes)* | | | **1,372** | **993** | **16.73%** |
| **TOTAL** | | | **8,203** | **3,785** | **100.00%** |

---

## 3. Existing Processed YOLO Dataset Audit (`data/processed/yolo/`)

### 3.1 Architecture & Split Configuration
- Configuration File: `data/processed/yolo/data.yaml`
  - `nc: 4`
  - `names: [longitudinal_crack, transverse_crack, alligator_crack, pothole]`
- Converted via: `src/preprocessing/voc_to_yolo.py` from the 7,706 RDD2022 India train images.
- Partitioning: Seed-controlled 70% Train / 15% Validation / 15% Test.

### 3.2 Split Breakdown & Bounding Box Counts

| Metric | Train Split | Validation Split | Test Split | Total Processed |
|---|---|---|---|---|
| **Total Images** | 5,394 | 1,155 | 1,157 | **7,706** |
| **Total Label Files (`.txt`)** | 5,394 | 1,155 | 1,157 | **7,706** |
| **Missing / Orphan Labels** | 0 / 0 | 0 / 0 | 0 / 0 | **0 / 0** |
| **Empty Label Files (Background)** | 3,138 (58.18%) | 672 (58.18%) | 673 (58.17%) | **4,483 (58.17%)** |
| **Positive Images ( $\ge 1$ Box)** | 2,256 (41.82%) | 483 (41.82%) | 484 (41.83%) | **3,223 (41.83%)** |
| **Class 0 (Longitudinal Crack) BBs** | 1,085 (775 imgs) | 243 (167 imgs) | 227 (167 imgs) | **1,555 (1,109 imgs)** |
| **Class 1 (Transverse Crack) BBs** | **48 (42 imgs)** | **10 (9 imgs)** | **10 (9 imgs)** | **68 (60 imgs)** |
| **Class 2 (Alligator Crack) BBs** | 1,412 (1,231 imgs) | 300 (262 imgs) | 309 (265 imgs) | **2,021 (1,758 imgs)** |
| **Class 3 (Pothole) BBs** | 2,250 (1,067 imgs) | 482 (237 imgs) | 455 (226 imgs) | **3,187 (1,530 imgs)** |
| **Total Bounding Boxes** | **4,795** | **1,035** | **1,001** | **6,831** |

### 3.3 Data Integrity & Quality Checks
1. **Mathematical Conservation:** $4,795 + 1,035 + 1,001 = 6,831$ bounding boxes. Exactly $100.00\%$ of the target 4-class boxes from raw RDD2022 India were converted without a single loss or addition.
2. **Background Expansion:** While raw RDD2022 had 3,921 defect-free images, the processed YOLO dataset has 4,483 empty label files. The difference of $562$ images corresponds to images whose only annotations were dropped unmapped classes (D44, D01, D43, D11, D50). These appropriately function as negative background samples in YOLO.
3. **Coordinate Validity:** Zero normalized coordinates outside $[0.0, 1.0]$. Zero malformed rows.
4. **Data Leakage & Cross-Split Isolation:**
   - Cross-split stem collisions: **0** (No image appears in more than one split).
   - RDD2022 Test Set contamination: **0** (None of the 1,959 raw test images appear in processed YOLO).

---

## 4. Audit of the Pothole-Focused Dataset (~610 Images)

### 4.1 Archive Identification & Forensic Discovery
- **Discovered Location:** `C:\Users\aquad\Downloads\new dataset.zip` (39.8 MB).
- **Extracted Directory Name in Zip:** `pothole_image_data/Pothole_Image_Data/`
- **Total Image Files:** **618** images (`1.jpg` through `680.jpg` with gaps).
- **Corrupt / Unreadable Images:** **0** (All 618 pass PIL decode and verification).
- **Annotation Files in Archive:** **ZERO** (No `.xml`, `.txt`, `.json`, or `.csv` files exist in the archive).

### 4.2 Exact Duplicates & Unique Image Count
SHA-256 byte hashing identified exactly **8 exact duplicate image pairs**:

| Duplicate Image A | Duplicate Image B | Image Resolution | Status |
|---|---|---|---|
| `pothole_image_data/Pothole_Image_Data/184.jpg` | `156.jpg` | 640 x 480 | Exact SHA-256 duplicate |
| `pothole_image_data/Pothole_Image_Data/263.jpg` | `206.jpg` | 800 x 600 | Exact SHA-256 duplicate |
| `pothole_image_data/Pothole_Image_Data/346.jpg` | `301.jpg` | 759 x 422 | Exact SHA-256 duplicate |
| `pothole_image_data/Pothole_Image_Data/406.jpg` | `292.jpg` | 400 x 300 | Exact SHA-256 duplicate |
| `pothole_image_data/Pothole_Image_Data/495.jpg` | `317.jpg` | 800 x 600 | Exact SHA-256 duplicate |
| `pothole_image_data/Pothole_Image_Data/503.jpg` | `327.jpg` | 800 x 600 | Exact SHA-256 duplicate |
| `pothole_image_data/Pothole_Image_Data/560.jpg` | `332.jpg` | 800 x 600 | Exact SHA-256 duplicate |
| `pothole_image_data/Pothole_Image_Data/562.jpg` | `335.jpg` | 800 x 600 | Exact SHA-256 duplicate |

- **Total Original Files:** 618
- **Duplicate Images:** 8
- **True Unique Image Count:** **610** (Matches user specification of approximately 610 unique images).

### 4.3 Image Resolution & Aspect Ratio Distribution
Unlike RDD2022's uniform $720 \times 720$, this dataset is highly diverse and uncontrolled:
- Top resolutions:
  - $800 \times 600$ (4:3 aspect ratio): 18 images
  - $400 \times 300$ (4:3): 12 images
  - $1280 \times 720$ (16:9 widescreen): 12 images
  - $640 \times 360$ (16:9): 10 images
  - $759 \times 422$ (~16:9): 10 images
  - $640 \times 480$ (4:3): 9 images
  - $534 \times 401$ (4:3): 8 images
  - $1024 \times 683$ (3:2): 7 images
  - Over 400 other distinct resolutions ranging from $150 \times 150$ up to $4032 \times 3024$.

### 4.4 Pseudo-Labeling History & Verification Status
1. **Origin of Labels:** The raw images contain no human ground truth annotations.
2. **MacBook Pipeline Execution:** On the developer's MacBook, `ml-pipeline/03_prepare_dataset.py` was invoked with `--pseudo_label_model models/best.pt --pseudo_conf 0.30`.
3. **Label Status:** Any labels generated for this dataset are **machine-generated pseudo-labels** synthesized by the baseline YOLOv8 model. They have not been human-reviewed or verified.
4. **Current Repository Availability:** The generated pseudo-label `.txt` files were stored on the MacBook at `/Users/aditya/RoadWise/roadwise-ml-test-bench/datasets/roadwise_pothole` and were not transferred to this Windows machine. Only the raw `new dataset.zip` (618 images, 610 unique) is physically present on this system.

---

## 5. Other Candidate Datasets Found on Desktop

| Dataset Name | Source / Path | Images | Classes | Evaluation & Disposition |
|---|---|---|---|---|
| **RoadWise_Extra_Dataset** | Desktop / Roboflow v3 (`road-damage-uyvns`) | 1,263 | 5 (`crack`, `damage`, `pothole`, `pothole_water`, `pothole_water_m`) | **Rejected:** Only 421 base images with 3x synthetic augmentation (Gaussian blur, flip, salt-pepper). Resized to $416 \times 416$ stretched. Non-standard taxonomy incompatible with RoadWise D00-D40. |
| **RoadWise_RDD_Extra** | Desktop / Roboflow v7 (CRDDC Japan) | 3,506 | 7 (`D00`, `D10`, `D20`, `D40`, `D43`, `D44`, `D50`) | **Rejected in earlier Colab experiments:** Single box per image. Strong domain shift (Japanese road surface, markings, camera mounting) that degraded validation mAP on Indian roads in historical experiments. |

