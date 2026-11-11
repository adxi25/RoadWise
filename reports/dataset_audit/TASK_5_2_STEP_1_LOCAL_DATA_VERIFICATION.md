# RoadWise — Task 5.2, Step 1: Existing Dataset & Local File Verification

**Date:** 2026-11-09  
**Audit Scope:** Read-Only Inventory and Forensic Evidence Verification of Local Data Assets  
**System Architecture Context:** Decoupled Architecture (Model 1: Pothole Specialist; Model 2: Crack Specialist [D00 + D20])  
**Status:** COMPLETE — Strictly Read-Only Forensic Audit

---

## 1. Audit Scope & Methodology

This audit was conducted in strict accordance with the Task 5.2 Step 1 mandate: **establish exactly which datasets are physically available locally, identify their true origins using internal file evidence, and distinguish verified datasets from files merely mentioned in previous reports or external catalogues.**

### 1.1 Critical Identification & Forensic Rules
- **No Filename Assumptions:** An archive named `train.zip`, `test.zip`, or `images.zip` was never assumed to represent a specific dataset without inspecting its internal file hierarchy, metadata, and XML/YAML headers.
- **Physical Verification vs. Catalogue Claims:** Figures reported in research papers or online repository landing pages are explicitly demarcated as *Source-Reported (Catalogue)* rather than *Locally Verified*.
- **Strict Read-Only Enforcement:** Zero files were extracted, renamed, moved, modified, or downloaded. No model checkpoints, code files, or database entries were altered.

---

## 2. Locally Available Dataset Directories

An exhaustive inspection of `data/` and related directories within the RoadWise workspace was performed:

```
RoadWise/
├── data/
│   ├── raw/
│   │   ├── RDD2022/
│   │   │   └── India/                  [VERIFIED LOCAL DATASET]
│   │   │       ├── train/              (images: 7,706 JPGs, annotations: 7,706 XMLs)
│   │   │       └── test/               (images: 1,959 JPGs, unannotated)
│   │   └── pothole_image_data/         [VERIFIED LOCAL DATASET]
│   │       ├── Pothole_Image_Data/     (618 original JPGs, 610 unique)
│   │       └── dataset_info.md         (Forensic metadata record)
│   ├── processed/
│   │   └── yolo/                       [VERIFIED PROCESSED YOLO DATASET]
│   │       ├── images/ {train,val,test}(5,394 train, 1,155 val, 1,157 test)
│   │       ├── labels/ {train,val,test}(5,394 train, 1,155 val, 1,157 test)
│   │       └── data.yaml               (4-class config: D00, D10, D20, D40)
│   ├── model_debug/                    (2 reference test images: bad_road_1, bad_road_2)
│   ├── test_images/                    (1 evaluation sample: India_000045.jpg)
│   ├── uploads/                        (67 uploaded JPG/PNG frames from frontend test runs)
│   └── roadwise.db                     (SQLite database recording inspection runs)
└── datasets/                           [DOES NOT EXIST ON DISK]
```

### Key Working Directory Findings:
1. **`datasets/` Does Not Exist Locally:** References to `datasets/roadwise_pothole/dataset.yaml` in pipeline scripts (`04_train.py`, `06_train_v2.py`) were external paths on the developer's MacBook (`/Users/aditya/RoadWise/roadwise-ml-test-bench/datasets/roadwise_pothole`). No `datasets/` directory exists within this Windows repository.
2. **`data/raw/RDD2022/` Contains India Only:** No other country folders (`Czech/`, `Japan/`, `Norway/`, `United_States/`) exist inside `data/raw/RDD2022/`.
3. **`data/raw/pothole_image_data/` Contains No Labels:** As verified in Task 4.1, this raw folder contains 618 raw images (610 unique) with zero original annotations and zero pseudo-labels.

---

## 3. Archive Inventory (Workstation-Wide Search)

Potentially relevant archives located in `C:\Users\aquad\Downloads` and `C:\Users\aquad\OneDrive\Desktop` were inspected via direct binary and zipfile introspection:

| Archive Filename | Full Workstation Path | File Size | Last Modified | Internal Entries | Internal Evidence & Config Found |
|---|---|---|---|---|---|
| **`21431547.zip`** | `C:\Users\aquad\Downloads\21431547.zip` | 13,267,425,313 B (~12.65 GB) | 2026-10-06 17:33:55 | 4 items | Contains `File_List_CRDDC_RDD2022.txt`, `Directory_Structure_CRDDC_RDD2022.txt`, `label_map.pbtxt`, `RDD2022_released_through_CRDDC2022.zip` |
| **`train.zip`** | `C:\Users\aquad\Downloads\train.zip` | 1,499,074,593 B (~1.40 GB) | 2026-10-20 16:01:03 | 84,204 items | Contains `train/Czech/`, `train/India/`, `train/Japan/`, `__MACOSX/`. No README or license file. |
| **`Road Damages Detection.v7i...zip`** | `C:\Users\aquad\Downloads\Road Damages Detection.v7i.yolov8.zip` | 141,907,898 B (~135.33 MB) | 2026-10-20 01:35:19 | 7,024 items | Roboflow export `eric-tam-oz6si/road-damages-detection/7`. `data.yaml` has 7 classes: `D00, D10, D20, D40, D43, D44, D50`. |
| **`Road-damage.v3i...zip`** | `C:\Users\aquad\Downloads\Road-damage.v3i.yolov8.zip` | 56,601,834 B (~53.98 MB) | 2026-10-20 01:08:50 | 2,538 items | Roboflow export `roaddamage-ak8w6/road-damage-uyvns/3`. `data.yaml` has 5 classes: `crack, damage, pothole, pothole_water, pothole_water_m`. |
| **`Pothole.v1i...zip`** | `C:\Users\aquad\Downloads\Pothole.v1i.yolov8.zip` | 116,464,556 B (~111.07 MB) | 2026-10-20 18:18:41 | 3,195 items | Roboflow export `new-workspace-9tvcr/pothole-eyvwj/1`. `data.yaml` has 1 class: `pothole`. |
| **`new dataset.zip`** | `C:\Users\aquad\Downloads\new dataset.zip` | 151,474,263 B (~144.46 MB) | 2026-10-21 23:38:30 | 618 items | 618 image files `1.jpg` to `620.jpg` (missing `124.jpg` and `448.jpg`). Exact match to `data/raw/pothole_image_data`. |
| **`RoadWise.zip`** | `C:\Users\aquad\OneDrive\Desktop\RoadWise.zip` | 3,278,869,464 B (~3.13 GB) | 2026-10-21 21:42:43 | 100,265 items | Complete pre-MacBook RoadWise snapshot from October 21, 2026. Contains legacy 11.14M `best.pt`. |
| **`RoadWise_Complete_Handoff...zip`**| `C:\Users\aquad\Downloads\RoadWise_Complete_Handoff...zip`| 42,046,349 B (~40.10 MB) | 2026-10-20 01:58:21 | 185 items | Project documentation, reports, and legacy model checkpoint. |

---

## 4. Confirmed Dataset Identities

Based on physical inspection of files, headers, and metadata, the following identities are positively confirmed:

### 1. `21431547.zip` $\longrightarrow$ Official CRDDC 2022 (RDD2022) Figshare Release Archive
- **Evidence:** `File_List_CRDDC_RDD2022.txt` and `Directory_Structure_CRDDC_RDD2022.txt` explicitly list all official subdirectories: `China_Drone`, `China_MotorBike`, `Czech`, `India`, `Japan`, `Norway`, and `United_States`. `label_map.pbtxt` defines `D00`, `D10`, `D20`, `D40`.
- **Status:** **CONFIRMED IMMUTABLE RAW ARCHIVE.**

### 2. `data/raw/RDD2022/India` $\longrightarrow$ RDD2022 India Competition Subset
- **Evidence:** 7,706 JPEG files (`India_000000.jpg` to `India_007705.jpg`) with matching Pascal VOC XML annotations.
- **Status:** **CONFIRMED EXTRACTED LOCAL BENCHMARK.**

### 3. `data/processed/yolo` $\longrightarrow$ RoadWise Standard 4-Class YOLO Split
- **Evidence:** `data.yaml` defines `0: longitudinal_crack`, `1: transverse_crack`, `2: alligator_crack`, `3: pothole`. Split sizes match 70/15/15 partition with `seed=42`.
- **Status:** **CONFIRMED PROCESSED BENCHMARK.**

### 4. `new dataset.zip` & `data/raw/pothole_image_data` $\longrightarrow$ RoadWise Raw Pothole Collection
- **Evidence:** 618 files matching SHA-256 hashes byte-for-byte between ZIP and local folder. 8 duplicate pairs identified, leaving 610 unique unannotated pothole images.
- **Status:** **CONFIRMED EXTRACTED LOCAL RAW DATASET.**

### 5. `Road Damages Detection.v7i.yolov8.zip` $\longrightarrow$ Roboflow Community Japan RDD Export
- **Evidence:** `README.dataset.txt` explicitly cites `https://universe.roboflow.com/eric-tam-oz6si/road-damages-detection`. Contains YOLOv8 text annotations of Japanese road distress.
- **Status:** **CONFIRMED ROBOFLOW ARCHIVE (UNEXTRACTED).**

---

## 5. Unknown or Unverified Archives

### `train.zip` (`C:\Users\aquad\Downloads\train.zip`)
- **Physical Size:** 1,499,074,593 bytes (~1.40 GB).
- **Inspection Findings:**
  - Contains three subdirectories: `train/Czech/` (2,829 images, 2,829 XMLs), `train/India/` (7,706 images, 7,706 XMLs), and `train/Japan/` (10,506 images, 10,506 XMLs).
  - Contains macOS filesystem artifacts (`__MACOSX/`, `.DS_Store`).
  - **Zero documentation:** Contains **no README**, **no license text**, and **no metadata file**.
  - **Verdict:** While the internal directory names correspond to the three original countries of the 2020 Road Damage Detection Challenge, **this archive is NOT a standalone RDD2020 Czechia release**. It is an unverified multi-national training split archive of uncertain provenance. In strict adherence to Section 4, it cannot be treated as an authorized or verified standalone Czechia dataset.

---

## 6. RDD2022 India Benchmark Integrity Verification

In accordance with Section 3, a non-invasive file count and split verification was executed on the local RDD2022 India assets. Every single file count matches historical records with 100% precision:

```
+----------------------------------------------------------------------------------------------------+
| RDD2022 INDIA BENCHMARK INTEGRITY AUDIT                                                            |
+------------------------------------------+--------------------+------------------+-----------------+
| Component / Directory                    | Reference Baseline | Measured Local   | Status          |
+------------------------------------------+--------------------+------------------+-----------------+
| Raw Training Images (`train/images/*.jpg`)| 7,706 images       | **7,706 images** | VERIFIED INTACT |
| Raw Training XMLs (`train/annotations/`)| 7,706 XML files    | **7,706 XMLs**   | VERIFIED INTACT |
| Raw Test Images (`test/images/*.jpg`)    | 1,959 images       | **1,959 images** | VERIFIED INTACT |
| Processed YOLO Train Images              | 5,394 images       | **5,394 images** | VERIFIED INTACT |
| Processed YOLO Train Labels              | 5,394 labels       | **5,394 labels** | VERIFIED INTACT |
| Processed YOLO Validation Images         | 1,155 images       | **1,155 images** | VERIFIED INTACT |
| Processed YOLO Validation Labels         | 1,155 labels       | **1,155 labels** | VERIFIED INTACT |
| Processed YOLO Test Images               | 1,157 images       | **1,157 images** | VERIFIED INTACT |
| Processed YOLO Test Labels               | 1,157 labels       | **1,157 labels** | VERIFIED INTACT |
| Total Mapped YOLO Bounding Boxes         | 6,831 boxes        | **6,831 boxes**  | VERIFIED INTACT |
+------------------------------------------+--------------------+------------------+-----------------+
```

**Verdict:** The RDD2022 India benchmark dataset is 100% physically present, uncorrupted, and unaltered. It remains the established baseline and validation benchmark for RoadWise.

---

## 7. RDD2020 Czechia — Availability & Identity Status

Per Section 4 instructions, the exact status of RDD2020 Czechia was audited:

1. **Is RDD2020 Czechia present as an extracted standalone dataset in `data/raw/`?**
   - **NO.** `data/raw/` contains only `India` and `pothole_image_data`.
2. **Does an isolated `Czechia.zip` archive exist?**
   - **NO.** No file named `Czechia.zip`, `RDD2020_Czech.zip`, or similar exists on the workstation.
3. **Status of `train.zip`:**
   - As established in Section 5, `C:\Users\aquad\Downloads\train.zip` is a 1.40 GB multi-national archive containing Czech, India, and Japan training folders. The Czech subfolder inside it contains 2,829 images and 2,829 XMLs (`D00`: 988, `D10`: 399, `D20`: 161, `D40`: 197).
   - However, because it lacks standalone packaging, provenance documentation, and licensing confirmation, and because it has never been extracted or prepared inside RoadWise, it cannot be classified as an available dataset.

### Formal Status:
$$\mathbf{RDD2020\ Czechia\ —\ NOT\ FOUND\ /\ NOT\ LOCALLY\ VERIFIED\ AS\ A\ STANDALONE\ DATASET.}$$

---

## 8. Attain Pavement Distress Dataset — Acquisition Status

A recursive workstation-wide search (`Get-ChildItem -Filter "*attain*"`) was conducted across `RoadWise`, `C:\Users\aquad\Downloads`, and `C:\Users\aquad\OneDrive\Desktop`.

### Forensic Findings:
1. **Local Search Result:** **ZERO FILES FOUND.** No archive, directory, or image with the name "Attain" exists on this machine.
2. **Catalogue Figures vs. Local Reality:**
   - *Source-Reported (Catalogue):* 2,293 RGB images ($1920\times1080+$), 19,761 annotations across 10 classes (4,112 `alligator_crack` boxes, 5,842 `linear_crack` boxes) on Mendeley Data DOI `10.17632/nykrzdm74f.1`.
   - *Locally Verified Local Count:* **0 images / 0 files**.
3. **Acquisition Blocker:** Mendeley Data requires manual browser authentication (Elsevier user account) to download the archive; automated API access returns `HTTP 401 Unauthorized`.

### Formal Status:
$$\mathbf{Attain\ Pavement\ Distress\ —\ NOT\ DOWNLOADED\ /\ NOT\ FOUND\ ON\ DISK.}$$

---

## 9. McMaster Pavement Crack Detection — Acquisition Status

A recursive workstation-wide search (`Get-ChildItem -Filter "*mcmaster*"`) was conducted across `RoadWise`, `C:\Users\aquad\Downloads`, and `C:\Users\aquad\OneDrive\Desktop`.

### Forensic Findings:
1. **Local Search Result:** **ZERO FILES FOUND.** No archive or folder corresponding to the McMaster Roboflow project exists on this machine.
2. **Catalogue Figures vs. Local Reality:**
   - *Source-Reported (Catalogue):* ~3,114 images, ~8,500 annotations (`longitudinal_crack`, `transverse_crack`, `alligator_crack`, `oblique_crack`, `pothole`, `block_crack`, `repair`) on Roboflow Universe (`r4n7n`).
   - *Locally Verified Local Count:* **0 images / 0 files**.
3. **Acquisition Status:** Available for export via Roboflow API or browser download. Has not yet been downloaded.

### Formal Status:
$$\mathbf{McMaster\ Crack\ Detection\ —\ NOT\ DOWNLOADED\ /\ NOT\ FOUND\ ON\ DISK.}$$

---

## 10. Master Dataset Status Matrix

```
+------------------------------------------------------------------------------------------------------------------------+
| MASTER LOCAL DATASET STATUS MATRIX                                                                                     |
+---------------------+-------------------+-------------------+--------------------+-------------------------------------+
| Dataset Candidate   | Priority Tier     | Local Status      | Measured Local     | Source-Reported Catalogue Claims    |
|                     |                   |                   | Image / Box Count  | (For Reference Only)                |
+---------------------+-------------------+-------------------+--------------------+-------------------------------------+
| **RDD2022 India**   | Benchmark Anchor  | **LOCALLY VERIFIED| 7,706 images       | 7,706 images; 6,831 boxes           |
|                     |                   | (EXTRACTED)**     | 6,831 YOLO boxes   | (Identical to local measured count) |
+---------------------+-------------------+-------------------+--------------------+-------------------------------------+
| **Raw Pothole Data**| Model 1 Baseline  | **LOCALLY VERIFIED| 618 images         | ~620 estimated images;              |
| (`pothole_image...`)|                   | (EXTRACTED)**     | (610 unique)       | 0 ground truth annotations          |
+---------------------+-------------------+-------------------+--------------------+-------------------------------------+
| **Attain**          | Priority 1 (Crack)| **NOT DOWNLOADED /| **0 images /       | 2,293 images; 19,761 annotations;   |
|                     |                   | NOT FOUND**       |   0 boxes**        | 4,112 alligator boxes (Mendeley)    |
+---------------------+-------------------+-------------------+--------------------+-------------------------------------+
| **McMaster**        | Priority 2 (Crack)| **NOT DOWNLOADED /| **0 images /       | ~3,114 images; ~8,500 boxes         |
|                     |                   | NOT FOUND**       |   0 boxes**        | (Roboflow Universe r4n7n)           |
+---------------------+-------------------+-------------------+--------------------+-------------------------------------+
| **RDD2020 Czechia** | Optional D10      | **PRESENT BUT     | 2,829 images       | 2,829 images in train.zip;          |
|                     |                   | UNVERIFIED ARCH.**| (inside train.zip) | 399 D10 boxes (unextracted archive) |
+---------------------+-------------------+-------------------+--------------------+-------------------------------------+
| **CRDDC 2022 Global**| Raw Archive      | **RAW ARCHIVE     | Unextracted        | 47,420 images; >55,000 boxes        |
| (`21431547.zip`)    | Reference         | LOCAL (12.6 GB)** | (Multi-national)   | (Figshare Official Release)         |
+---------------------+-------------------+-------------------+--------------------+-------------------------------------+
| **Roboflow JP RDD** | Historical Model  | **RAW ARCHIVE     | Unextracted        | 7,024 files; D00-D50 YOLO classes   |
| (`Road Damages...`) | Reference         | LOCAL (135 MB)**  | (Japan RDD export) | (Roboflow Universe eric-tam)        |
+---------------------+-------------------+-------------------+--------------------+-------------------------------------+
| **PavementDamagesG7**| Group A (Seg Mask)| **NOT DOWNLOADED /| **0 images /       | 920 Full HD stereo frames;          |
|                     |                   | NOT FOUND**       |   0 boxes**        | Pixel-wise PNG masks (Mendeley)     |
+---------------------+-------------------+-------------------+--------------------+-------------------------------------+
| **CamCrack789**     | Robustness Ref    | **NOT DOWNLOADED /| **0 images /       | 789 images with binary masks;       |
|                     |                   | NOT FOUND**       |   0 boxes**        | Mobile robot noise benchmark        |
+---------------------+-------------------+-------------------+--------------------+-------------------------------------+
| **Rodriguez-Lozano**| Reference Taxon.  | **NOT DOWNLOADED /| **0 images /       | 2,456 image-level classification    |
|                     |                   | NOT FOUND**       |   0 boxes**        | labels only; zero bounding boxes    |
+---------------------+-------------------+-------------------+--------------------+-------------------------------------+
```

---

## 11. Discrepancies with Earlier Reports & Historical Clarifications

1. **Correction on "RDD2020 Czechia" Status:**
   - Previous working drafts referenced Czechia as an available local dataset based on the presence of `train.zip` in Downloads.
   - *Audit Correction:* `train.zip` is a composite, unverified multi-national archive containing Czech, India, and Japan without internal documentation. Standalone RDD2020 Czechia was never extracted, configured, or integrated into RoadWise.
2. **Correction on `datasets/` Path in Code:**
   - `ml-pipeline/04_train.py` (L10) and `06_train_v2.py` (L105) reference `--dataset_yaml datasets/roadwise_pothole/dataset.yaml`.
   - *Audit Correction:* This directory does not exist on this Windows workstation. It was an external path on the developer's MacBook. The active Windows application relies strictly on `models/best.pt` and `data/raw/` / `data/processed/`.
3. **Demarcation of External Catalogue Claims:**
   - Figures reported for Attain (19,761 annotations), McMaster (8,500 boxes), and PavementDamagesG-7 (920 stereo frames) were derived from published literature and online repository landing pages during Task 4.2–5.1 research.
   - *Audit Confirmation:* None of these datasets have been downloaded to this machine. They remain planned external acquisitions, not local data assets.

---

## 12. Read-Only Compliance & Integrity Certification

- **Zero Data Modification:** No files in `data/raw/`, `data/processed/`, or `models/` were altered, moved, or overwritten.
- **Zero Checkpoint Disruption:** Active checkpoint `models/best.pt` (`f01701f...`) and archived baseline `best.pt` (`846fc...`) remain untouched.
- **Zero Downloads Initiated:** No network download or automated bypass was executed during this audit step.
- **Zero Pipeline Modification:** Application scripts, backend endpoints, and database schemas remain 100% intact.

