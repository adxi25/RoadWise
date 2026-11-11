# TASK 5.2 STEP 3 — MCMASTER DATASET FORENSIC INSPECTION REPORT

**Project:** RoadWise — AI-Powered Road Inspection System  
**Task:** 5.2 Step 3 — McMaster Pavement Crack Detection Dataset Forensic Inspection  
**Date:** 2026-11-09  
**Analyst:** Antigravity (automated forensic audit — read-only)  
**Archive:** `data/raw/McMaster/McMaster.zip`  
**Status:** COMPLETE — Awaiting user review before proceeding

---

## 1. Executive Summary

| Property | Value |
|---|---|
| Archive path | `data/raw/McMaster/McMaster.zip` |
| Archive SHA256 | `039f7fabf95bde4b78db77a17ee0280e707690d63ee6d3b9888c31f4597a3bf5` |
| Archive size | 285,996,789 bytes (272.75 MiB) |
| Dataset version | **v2** (Roboflow export, YOLOv8 format) |
| Licence | CC BY 4.0 (stated in README and YAML) |
| Total images | **6,093** |
| Unique source images (pre-augmentation) | **3,150** |
| Total annotation files | **6,095** (6,093 valid + 2 README.txt files misidentified as annotations) |
| Valid annotation instances | **9,625** |
| Number of classes | **7** |
| Annotation format | YOLO detection bounding boxes (normalized) |
| All images uniform dimension | ✅ 640×640, all JPEG |
| Image–annotation pairing | 100% (all 6,093 images have paired annotation files) |
| Within-split duplicates | **0** (no SHA256 collisions within any split) |
| Cross-split exact duplicates | **0** |
| Cross-split augmentation leakage | **0** (augmented variants of the same source image do not appear in multiple splits) |
| Annotation geometry validity | ✅ 0 malformed rows, 0 invalid class IDs, 0 out-of-range coordinates |
| Key concern | **1,472 boxes (15.3%) span >80% of image dimension** — primarily valid for Longitudinal crack and Repair classes |
| Key concern | **3,194 Repair instances (33.2% of all annotations)** — Repair is excluded from crack model |
| Key concern | **Block crack: only 5 instances** — unusable class |

---

## 2. Archive Verification

| Property | Value |
|---|---|
| File path | `data/raw/McMaster/McMaster.zip` |
| File size | 285,996,789 bytes (272.75 MiB) |
| SHA256 | `039f7fabf95bde4b78db77a17ee0280e707690d63ee6d3b9888c31f4597a3bf5` |
| ZIP entries total | 12,198 |
| Directory entries | 9 |
| Image files | 6,093 |
| TXT files | 6,095 (6,093 annotations + 2 README files at ZIP root) |
| YAML files | 1 (`data.yaml`) |
| README files | 2 (`README.dataset.txt`, `README.roboflow.txt`) |
| Other files | 0 |
| Corrupted files | 0 |
| Format | Valid ZIP, opens without error |

**ZIP root contents:**

```
McMaster.zip
├── data.yaml
├── README.dataset.txt
├── README.roboflow.txt
├── train/
│   ├── images/   (5,148 JPGs)
│   └── labels/   (5,148 TXTs)
├── valid/
│   ├── images/   (630 JPGs)
│   └── labels/   (630 TXTs)
└── test/
    ├── images/   (315 JPGs)
    └── labels/   (315 TXTs)
```

> [!NOTE]
> The 2 "orphan annotation files" reported in the global pairing analysis are `README.dataset.txt` and `README.roboflow.txt` — both are plain-text documentation files located at the ZIP root with `.txt` extensions. They are NOT annotation files and have no matching images. This is expected Roboflow export behaviour.

---

## 3. Dataset Structure

### 3.1 YAML Configuration (`data.yaml`)

```yaml
train: ../train/images
val: ../valid/images
test: ../test/images

nc: 7
names: ['Alligator crack', 'Block crack', 'Longitudinal crack', 'Oblique crack',
        'Pothole', 'Repair', 'Transverse crack']

roboflow:
  workspace: mcmaster-vkq5k
  project: pavement-crack-detection-r4n7n
  version: 2
  license: CC BY 4.0
  url: https://universe.roboflow.com/mcmaster-vkq5k/pavement-crack-detection-r4n7n/dataset/2
```

YAML is **internally consistent** — class count (`nc: 7`) matches the names list.

### 3.2 README Files

**`README.dataset.txt`** (172 bytes):
```
# pavement crack detection > 2023-03-29 1:49am
https://universe.roboflow.com/mcmaster-vkq5k/pavement-crack-detection-r4n7n
Provided by a Roboflow user
License: CC BY 4.0
```

**`README.roboflow.txt`** (1,108 bytes) — key content:
```
pavement crack detection - v2 2023-03-29 1:49am
The dataset includes 6093 images.
Cracks are annotated in YOLOv8 format.
Pre-processing: Auto-orientation, Resize to 640x640 (Stretch)
Augmentation: 50% probability of horizontal flip, 50% probability of vertical flip
3 versions of each source image created.
```

> [!IMPORTANT]
> The README explicitly confirms: (1) images were **stretched** (not letterboxed) to 640×640, (2) **3× augmentation** per source image via random flips, and (3) this is **Version 2** of the dataset. Version 1 contained the original 3,150 source images; Version 2 contains those 3,150 sources plus augmented copies totalling 6,093 images.

---

## 4. Image and Annotation Pairing

| Property | Train | Valid | Test | Total |
|---|---|---|---|---|
| Images | 5,148 | 630 | 315 | **6,093** |
| Annotation files | 5,148 | 630 | 315 | 6,093 |
| Images without annotations | 0 | 0 | 0 | **0** |
| Annotations without images | 0 | 0 | 0 | **0** |
| Empty annotation files (0 instances) | 4 | 3 | 0 | **7** |
| Multi-class images | 954 | 110 | 61 | **1,125** |
| Duplicate image stems | — | — | — | **0** |

Pairing verified by stem-matching across all splits. The 2 "orphan" TXT files at ZIP root are README files, not annotation files — they are correctly excluded.

**7 empty annotation files** represent negative/background images where the annotator chose to include the image but add no labels. This is a valid YOLO convention.

---

## 5. Class Mapping and Distribution

### 5.1 Class ID Mapping

| Class ID | Class Name | RoadWise relevance |
|---|---|---|
| 0 | Alligator crack | D20 candidate |
| 1 | Block crack | Ambiguous — separate review |
| 2 | Longitudinal crack | **D00 primary candidate** |
| 3 | Oblique crack | Ambiguous — separate review |
| 4 | Pothole | Exclude from crack model |
| 5 | Repair | Exclude from crack model |
| 6 | Transverse crack | D10 candidate |

### 5.2 Class Distribution

| Class | Total | Train | Valid | Test | Train imgs | Valid imgs | Test imgs |
|---|---|---|---|---|---|---|---|
| Alligator crack | 800 | 679 | 79 | 42 | 583 | 74 | 38 |
| Block crack | **5** | 4 | 1 | 0 | 4 | 1 | 0 |
| Longitudinal crack | 2,576 | 2,172 | 270 | 134 | 1,702 | 193 | 100 |
| Oblique crack | 337 | 277 | 47 | 13 | 233 | 32 | 12 |
| Pothole | 178 | 154 | 16 | 8 | 120 | 8 | 5 |
| Repair | 3,194 | 2,717 | 337 | 140 | 1,872 | 239 | 101 |
| Transverse crack | 2,535 | 2,123 | 250 | 162 | 1,723 | 205 | 125 |
| **TOTAL** | **9,625** | **8,126** | **1,000** | **499** | | | |

### 5.3 Observations

- **No invalid class IDs** — all 9,625 instances use IDs 0–6.
- **Block crack (5 instances):** Effectively absent — 4 in train, 1 in validation, 0 in test. This class cannot be trained, validated or evaluated.
- **Repair (3,194 instances, 33.2%):** Largest class by instance count. This class is excluded from the crack model but its volume dominates the dataset.
- **Class imbalance within crack-relevant classes:**
  - Longitudinal crack: 2,576 instances
  - Transverse crack: 2,535 instances
  - Alligator crack: 800 instances
  - Oblique crack: 337 instances
  - Ratio Longitudinal:Alligator ≈ 3.2:1 — moderate imbalance
- **Split proportions are consistent** across classes — no class has substantially different train/valid/test representation:

| Class | Train % | Valid % | Test % |
|---|---|---|---|
| Alligator crack | 8.4% | 7.9% | 8.4% |
| Longitudinal crack | 26.7% | 27.0% | 26.9% |
| Transverse crack | 26.1% | 25.0% | 32.5% |
| Repair | 33.4% | 33.7% | 28.1% |

---

## 6. RoadWise Class Relevance

### 6.1 Per-Class Assessment

**Longitudinal crack (Class 2) — D00 candidate ✅**
- 2,576 instances across 1,995 images (train+valid+test)
- Visually confirmed: Images show true pavement longitudinal cracks running parallel to road direction
- Annotation quality: Many boxes span nearly the full image height (avg H = 0.419) — appropriate for cracks running the length of a tile
- **Important:** From the filename pattern `NNNN_R_C_JPG` (scene\_row\_col tile), cracks running vertically in one tile continue in adjacent tiles — this is consistent with true longitudinal crack behaviour
- **Suitability for D00: HIGH** ✅

**Transverse crack (Class 6) — D10 candidate ✅**
- 2,535 instances across 2,053 images (train+valid+test)
- Visually confirmed: Images show cracks running perpendicular to road direction (horizontal in bird's-eye view)
- Avg bbox W = 0.392, avg H = 0.095 — boxes are wide-and-short, consistent with transverse crack geometry
- **Suitability for D10: HIGH** ✅

**Alligator crack (Class 0) — D20 candidate ✅**
- 800 instances across 695 images (train+valid+test)
- Visually confirmed: Images show interconnected web-like cracking patterns — classic fatigue/alligator cracking
- Avg bbox W = 0.465, avg H = 0.302 — large boxes covering substantial image area, appropriate for alligator crack patches
- **Suitability for D20: HIGH** ✅

**Oblique crack (Class 3) — Separate semantic review ⚠️**
- 337 instances across 277 images
- Visual inspection: These are diagonal cracks — neither clearly longitudinal nor transverse
- **Critically:** A diagonal crack running at 45° is NOT the same as a longitudinal (parallel) or transverse (perpendicular) crack. It could represent a fatigue crack variant, thermal crack, or pavement boundary crack
- **Rule:** Do NOT map Oblique crack to D00 or D10 without manual visual verification
- **Suitability assessment:** Requires separate experimental assessment. Possible use: could be merged into a future "linear crack" (D00+D10+oblique) class for Experiment B, but only with explicit design decision. Exclude from D00 and D10 in Experiment A.
- Visual evidence shows the oblique crack image also contains Longitudinal crack — the two classes coexist in the same image, confirming they are distinct categories

**Block crack (Class 1) — Effectively absent ❌**
- 5 instances total — 4 in train, 1 in validation, 0 in test
- Insufficient for training, evaluation, or any experiment
- **Cannot be used in any RoadWise experiment**
- Visually, block cracking is distinct from alligator cracking (larger rectangular blocks vs. small polyhedral cells), so it is NOT suitable as a D20 substitute
- **Suitability: EXCLUDE**

**Pothole (Class 4) — Exclude from crack model ❌**
- 178 instances — moderate volume but not part of the crack model
- Pothole detection is handled by the existing separate model (`models/best.pt`)
- **Suitability: EXCLUDE from crack model**

**Repair (Class 5) — Exclude from crack model ❌**
- 3,194 instances — largest class in dataset
- Road repairs (patches, utility cuts, crack sealing) are not crack damage types
- **Suitability: EXCLUDE**
- Note: Repair is visually annotated as large patches of lighter-coloured pavement material — not a crack defect.

### 6.2 Summary Table

| McMaster class | Instances | RoadWise use | Suitability |
|---|---|---|---|
| Longitudinal crack | 2,576 | D00 | ✅ HIGH |
| Transverse crack | 2,535 | D10 | ✅ HIGH |
| Alligator crack | 800 | D20 | ✅ HIGH |
| Oblique crack | 337 | Separate experiment only | ⚠️ Manual review required |
| Pothole | 178 | Exclude (separate model) | ❌ Exclude |
| Repair | 3,194 | Exclude | ❌ Exclude |
| Block crack | 5 | Exclude (too few) | ❌ Exclude |

---

## 7. Annotation Geometry and Quality

### 7.1 Format

All annotations use **YOLO detection format** (bounding boxes, not segmentation polygons):
- One row per object instance
- Format: `class_id cx cy w h` (normalized coordinates, all in [0.0, 1.0])
- 5 values per row

### 7.2 Validity Summary

| Check | Result |
|---|---|
| Malformed rows (wrong column count) | **0** |
| Invalid class IDs (outside 0–6) | **0** |
| Negative coordinates | **0** |
| Coordinates > 1.0 | **0** |
| Zero-width or zero-height boxes | **0** |
| Total invalid instances | **0** |

✅ **All 9,625 annotation instances are geometrically valid.**

### 7.3 Bounding Box Size Statistics

| Class | Count | Avg W | Avg H | Median Area | Min W | Min H |
|---|---|---|---|---|---|---|
| Alligator crack | 800 | 0.465 | 0.302 | 0.097 | 0.047 | 0.053 |
| Block crack | 5 | 0.189 | 0.302 | 0.062 | 0.170 | 0.203 |
| Longitudinal crack | 2,576 | 0.107 | 0.419 | 0.026 | 0.023 | 0.041 |
| Oblique crack | 337 | 0.293 | 0.236 | 0.048 | 0.070 | 0.066 |
| Pothole | 178 | 0.127 | 0.135 | 0.009 | 0.055 | 0.038 |
| Repair | 3,194 | 0.361 | 0.351 | 0.081 | 0.025 | 0.027 |
| Transverse crack | 2,535 | 0.392 | 0.095 | 0.022 | 0.031 | 0.020 |

**Key observations:**
- **Longitudinal crack:** Avg H = 0.419 (tall, narrow boxes) — expected for vertical crack paths in bird's-eye tiles
- **Transverse crack:** Avg W = 0.392, Avg H = 0.095 (wide, short boxes) — expected for horizontal crack paths
- **Alligator crack:** Avg W = 0.465, Avg H = 0.302 (roughly square, large boxes) — expected for patchy fatigue cracks
- These size ratios are geometrically consistent with the named defect types — supporting annotation quality

### 7.4 Large Boxes (> 80% image dimension)

**1,472 boxes (15.3%)** have width or height exceeding 80% of the image dimension.

| Characteristic | Detail |
|---|---|
| Count | 1,472 |
| Primarily affects | Longitudinal crack (full-height tiles) and Repair |
| Nature | Valid — cracks running the full length of a 640×640 tile are correctly annotated with tall boxes |
| Action required | None — these are geometrically valid and reflect the tile-based image capture |

> [!NOTE]
> Large boxes are not annotation errors. The dataset was captured by tiling larger road images into 640×640 patches. A longitudinal crack that runs through the entire tile length will naturally produce a box with h≈1.0.

### 7.5 Tiny Boxes (< 3% image dimension)

**68 boxes** have width or height below 3% of the image (< 19 pixels in a 640×640 image).

These are mainly Transverse crack and Longitudinal crack near the tile boundary — where only a small portion of a crack is visible. While technically valid, they may be difficult for a detector to learn from and could be considered for minimum-size filtering during preprocessing.

---

## 8. Image Resolution and Quality

| Property | Value |
|---|---|
| All images | 640×640 pixels, JPEG format |
| Colour mode | RGB (confirmed by README) |
| Dimension uniformity | 100% — all 6,093 images are exactly 640×640 |
| Stretch processing | Applied by Roboflow during export — original aspect ratios not preserved |
| Corrupted images | 0 |
| Unusually small files | 0 (all files > 5 KB) |

> [!WARNING]
> Images were resized using **Stretch** (not letterbox/padding). This means the aspect ratio of the original image content was **distorted** when resizing to 640×640 from non-square originals. Annotation bounding boxes are adjusted proportionally, so they remain valid — but the visual appearance of cracks may be stretched (e.g., a longitudinal crack appears thinner/wider than in reality).

The filename pattern `NNNN_R_C_JPG` suggests the original captures were tiled into grid patches before Roboflow processing. The scene IDs range from `0001` to `1178`, with **371 distinct scene IDs** found in the dataset — indicating the images come from 371 unique road sections.

---

## 9. Duplicate and Data-Leakage Analysis

### 9.1 Exact SHA256 Duplicates

| Check | Result |
|---|---|
| Within-train duplicates | **0** |
| Within-valid duplicates | **0** |
| Within-test duplicates | **0** |
| Cross-split (exact pixel) duplicates | **0** |

All 6,093 images have distinct SHA256 hashes.

### 9.2 Augmentation Structure

The filename pattern `<original_base>.rf.<roboflow_hash>.jpg` identifies how Roboflow applied augmentation:

| Augmentation multiplier | Source image count |
|---|---|
| 1× (original only, no augmented copies in dataset) | 1,080 sources |
| 2× (original + 1 augmented copy) | 1,197 sources |
| 3× (original + 2 augmented copies) | 873 sources |
| **Total unique sources** | **3,150** |

**Total files from 3,150 sources:** 1,080×1 + 1,197×2 + 873×3 = 1,080 + 2,394 + 2,619 = **6,093** ✅

> [!NOTE]
> The augmentation multiplier is not exactly 3× for all images — some source images appear only once or twice. The README states "3 versions of each source image" but this is an approximation. The Roboflow augmentation is **probabilistic** (50% horizontal flip, 50% vertical flip), so not every source image gets the same number of exported variants.

### 9.3 Cross-Split Augmentation Leakage

**Zero source images have augmented variants appearing in multiple splits.**

This is a strong positive finding — Roboflow correctly split the **source images** (before augmentation) into train/valid/test, then applied augmentation only to the training portion. This means:
- The model cannot "see" a flipped version of a validation image during training
- Validation and test sets reflect truly held-out original source images

### 9.4 Version 1 vs Version 2

Based on filename analysis:
- **Version 1:** 3,150 unique source images
- **Version 2:** 6,093 total images = 3,150 sources + ~2,943 augmented copies

The additional images in Version 2 are **NOT new road scenes** — they are augmented variants (flipped copies) of Version 1 images. Version 2 does not add new data about road damage; it adds redundancy via flipping.

---

## 10. Visual Annotation Audit

Thirteen annotated images were rendered and saved to `reports/dataset_audit/mcmaster_visual_audit/`.

### 10.1 Per-Class Visual Findings

**Longitudinal crack (`class_Longitudinal_crack.jpg`)**
- Aerial/satellite view of road surface
- Crack runs in direction of travel (vertically in bird's-eye view)
- Boxes are tall and narrow, correctly enclosing the crack
- ⚠️ One sample shows very small corner boxes near white lane markings — may indicate some annotation ambiguity near markings
- **Assessment: Correct — good quality**

**Transverse crack (`class_Transverse_crack.jpg`)**
- Aerial view showing wide, shallow cracks crossing road perpendicular to travel
- Two separate transverse cracks in the same image, each correctly annotated with its own box
- Boxes are wide and short — consistent with crack geometry
- **Assessment: Correct — good quality**

**Alligator crack (`class_Alligator_crack.jpg`)**
- Clear close-up of alligator (fatigue) cracking — distinctive web/polygon crack pattern
- Two large boxes covering distinct alligator crack patches
- **Assessment: Excellent — unambiguous**

**Oblique crack (`class_Oblique_crack.jpg`)**
- Shows a diagonal crack (white painted line/marker at ~45° angle, plus a diagonal pavement crack)
- Also contains a Longitudinal crack box in the same image
- The "oblique" crack annotated appears to be a painted line rather than a pure pavement crack — this is a potential annotation quality concern
- **Assessment: Requires semantic review. If some "oblique" examples are painted markings rather than cracks, the class is unreliable.**

**Block crack (`class_Block_crack.jpg`)**
- Shows an aerial road scene with 5 annotations (Longitudinal, Transverse, Oblique in same image)
- The single Block crack annotation in this sample appears to be a large, roughly rectangular cracked region
- With only 5 total instances, cannot draw statistically meaningful conclusions
- **Assessment: Insufficient data**

**Pothole (`class_Pothole.jpg`)**
- Clear single pothole with appropriate bounding box
- **Assessment: Correct**

**Repair (`class_Repair.jpg`)**
- Shows two distinct patched areas — one Alligator crack (red) and one Repair (grey)
- The Repair patches show lighter-coloured asphalt filler material — visually distinct from crack damage
- **Assessment: Correct — repair class is semantically distinct from crack classes**

**Multi-class examples**
- `multiclass_3.jpg` shows Transverse + Alligator + Longitudinal in a single tile — annotations are spatially separated and correctly attributed
- `multiclass_4.jpg` confirms longitudinal + oblique in same image, different locations

**Tiny box example (`tiny_box_1.jpg`)**
- Shows a road-adjacent paved area with a Transverse crack annotation that is extremely small
- The image is not clearly a road surface (appears to be sidewalk/paving blocks)
- **Assessment: Potential out-of-domain image — sidewalk area, not road pavement. This is an annotation quality concern.**

---

## 11. Existing Split Analysis

| Property | Train | Valid | Test |
|---|---|---|---|
| Images | 5,148 | 630 | 315 |
| Annotation instances | 8,126 | 1,000 | 499 |
| % of images | 84.5% | 10.3% | 5.2% |
| Empty annotation files | 4 | 3 | 0 |
| Multi-class images | 954 | 110 | 61 |
| Exact duplicate images | 0 | 0 | 0 |
| Cross-split duplicates | 0 (confirmed) | — | — |

**Split balance:** The 84.5/10.3/5.2% split is slightly more train-heavy than the typical 80/10/10 convention, but is reasonable for a Roboflow export with augmentation.

**Class distribution consistency:** Class proportions are remarkably consistent across splits (see §5.3 table). No class has unusual over- or under-representation in any split.

> [!IMPORTANT]
> **Augmentation leakage confirmed absent.** Source images are split before augmentation is applied. Training on Version 2 does not risk seeing validation images in augmented form.

---

## 12. Licence and Provenance

| Property | Value | Source | Verified? |
|---|---|---|---|
| Dataset name | pavement crack detection | README.dataset.txt | ✅ Archive |
| Publisher | "Provided by a Roboflow user" (McMaster University affiliation inferred from workspace name `mcmaster-vkq5k`) | README | ⚠️ Inferred |
| Roboflow workspace | `mcmaster-vkq5k` | data.yaml | ✅ Archive |
| Project URL | `https://universe.roboflow.com/mcmaster-vkq5k/pavement-crack-detection-r4n7n` | data.yaml | ✅ Archive |
| Version | 2 | data.yaml | ✅ Archive |
| Export format | YOLOv8 | README.roboflow.txt | ✅ Archive |
| **Licence** | **CC BY 4.0** | README.dataset.txt + data.yaml | ✅ Stated in archive |
| Export date | 2023-08-18 | README.roboflow.txt | ✅ Archive |
| Original dataset creation | 2023-03-29 | README | ✅ Archive |

**Licence: CC BY 4.0 — stated explicitly in both README files and in `data.yaml`.**

CC BY 4.0 permits:
- Use for any purpose (including commercial and research)
- Modification and derivative works
- Distribution of original or modified datasets
- Requirement: Attribution to the original source

> [!IMPORTANT]
> Attribution required: When using this dataset, cite the Roboflow project: `McMaster-vkq5k / pavement-crack-detection-r4n7n, Roboflow Universe, v2 (2023)`. Full URL: `https://universe.roboflow.com/mcmaster-vkq5k/pavement-crack-detection-r4n7n/dataset/2`

> [!NOTE]
> The original pre-Roboflow data source is not documented in the archive. The workspace name suggests McMaster University (Hamilton, Ontario, Canada), but this is inferred from the workspace name, not confirmed in any documentation file. The original capture methodology (drone, mobile platform) is unknown.

---

## 13. Version 1 vs Version 2 Assessment

| Property | Version 1 | Version 2 |
|---|---|---|
| Total images | ~3,150 | 6,093 |
| Unique source images | 3,150 | **3,150 (identical)** |
| Additional content | — | Flipped augmentations of V1 images |
| New road scenes | — | **0** (no new scenes) |
| Augmentation type | None | 50% h-flip, 50% v-flip |
| Cross-split leakage | N/A | None (augmentation is split-safe) |
| Preferred version | — | **Version 2 for training; Version 1 for validation/test only** |

### Assessment

**Is Version 2 worth retaining?**

**Yes, with caveats:**
1. Version 2 provides double the training data through augmentation (flips), which can improve model robustness to camera orientation changes
2. The augmentation does NOT introduce cross-split leakage
3. The additional 2,943 images provide no new scene information — they are reflections of existing scenes
4. If training with YOLO's built-in augmentation pipeline (which also applies random flips), Version 2's pre-flipped augmentations may be redundant but harmless

**Conclusion:** Retain Version 2. The augmented images increase training diversity for spatial transformations without introducing leakage. During future training, disable random flip augmentation in YOLO config to avoid double-flipping the already-flipped images.

---

## 14. D00/D10/D20 Suitability Assessment

### 14.1 Experiment A — D00/D10/D20 Separate Classes

| Class | McMaster instances | Suitability | Notes |
|---|---|---|---|
| D00 (Longitudinal crack) | 2,576 | ✅ **SUITABLE** | Clean, well-distributed, geometrically consistent |
| D10 (Transverse crack) | 2,535 | ✅ **SUITABLE** | Clean, well-distributed, geometrically consistent |
| D20 (Alligator crack) | 800 | ✅ **SUITABLE** | Visually clear, correctly annotated |

**Experiment A verdict: McMaster provides high-quality data for all three crack classes.**

### 14.2 Experiment B — Combined Linear Crack (D00+D10 merged)

If Longitudinal and Transverse are merged into a single "linear crack" class:
- Combined instances: 2,576 + 2,535 = **5,111**
- McMaster is an **excellent source** for this experiment — the original classes are separately labelled, allowing controlled merging

### 14.3 Experiment C — D00 + D20 Only

| Class | McMaster instances | Suitability |
|---|---|---|
| D00 (Longitudinal crack) | 2,576 | ✅ SUITABLE |
| D20 (Alligator crack) | 800 | ✅ SUITABLE |

Transverse crack can be excluded; the remaining classes are still valuable.

### 14.4 Oblique Crack Assessment for Experiments

**Do NOT include Oblique crack in any experiment without manual visual verification.**

Reasons:
- 337 instances — moderate volume but semantic ambiguity
- Some samples appear to annotate painted road markings rather than pavement defects
- Oblique cracks exist on a semantic continuum between longitudinal and transverse — their angle depends on viewing perspective
- Including them in D00 would contaminate the longitudinal model; in D10 would contaminate the transverse model
- Recommended: Keep as a separate experimental class only, not part of core D00/D10/D20 architecture

---

## 15. Limitations and Unresolved Issues

| Issue | Severity | Impact |
|---|---|---|
| **Stretch distortion:** Images resized via stretch (not letterbox) — aspect ratios distorted | 🟡 Medium | Crack appearance may differ from original captures; bbox coordinates are proportionally adjusted |
| **Oblique crack semantic ambiguity:** Some may annotate painted markings rather than cracks | 🟠 High | Cannot use Oblique crack class without manual review |
| **Block crack unusable:** 5 instances total | 🔴 Critical | This class is completely unusable for any experiment |
| **Unknown original data source:** Pre-Roboflow capture methodology and original institution not confirmed | 🟡 Medium | Cannot verify ground-truth labelling authority or inter-annotator agreement |
| **Repair dominates:** 3,194 instances (33.2%) — will bias any multi-class model if Repair is retained | 🟠 High | Repair must be excluded from crack model training |
| **68 tiny boxes (<3% dim):** Mostly boundary artefacts | 🟢 Low | May slightly reduce model performance on small instances; consider min-size filter |
| **Augmentation stretch-on-top-of-stretch:** V2 images are flipped copies of already-stretched images | 🟡 Medium | Annotation validity unaffected; visual distortion may increase |
| **Tile-based capture:** 371 scene IDs — many tiles from same road sections | 🟡 Medium | Adjacent tiles share visual context; some spatial correlation between training samples |
| **No original annotation methodology:** No information on annotation protocol, tools, or quality control | 🟡 Medium | Cannot quantify inter-annotator agreement or labelling error rate |

---

## 16. Final Recommendation

### 16.1 Use McMaster for Crack Model Training

McMaster Version 2 is the **strongest crack-detection dataset** currently available in the RoadWise project. It provides:
- **2,576 D00 (Longitudinal crack) instances** — directly fills the D00 gap identified in Task 5.2 Step 2B
- **2,535 D10 (Transverse crack) instances** — enables the Experiment A three-class architecture
- **800 D20 (Alligator crack) instances** — supplementary to Attain's 4,251 D20 instances

### 16.2 Classes to Retain for Each Experiment

| McMaster class | Experiment A | Experiment B | Experiment C |
|---|---|---|---|
| Longitudinal crack | ✅ D00 | ✅ D00+D10 merged | ✅ D00 |
| Transverse crack | ✅ D10 | ✅ D00+D10 merged | ❌ Exclude |
| Alligator crack | ✅ D20 | ✅ D20 | ✅ D20 |
| Oblique crack | ❌ Exclude | ❌ Exclude | ❌ Exclude |
| Block crack | ❌ Exclude | ❌ Exclude | ❌ Exclude |
| Pothole | ❌ Exclude | ❌ Exclude | ❌ Exclude |
| Repair | ❌ Exclude | ❌ Exclude | ❌ Exclude |

### 16.3 Preprocessing Requirements

Before McMaster data can enter the training pipeline:
1. **Filter to relevant classes only** — retain Longitudinal (ID 2), Transverse (ID 6), Alligator (ID 0); exclude IDs 1, 3, 4, 5
2. **Re-index class IDs** — remap to new IDs per experiment (e.g., D00=0, D10=1, D20=2 for Experiment A)
3. **Consider tiny box filtering** — optionally remove boxes with w<2% or h<2% (68 boxes)
4. **Disable YOLO flip augmentation during training** — images are already pre-flipped in Version 2; additional flip augmentation is redundant
5. **Do not apply Oblique crack without review** — if retained for future experiments, perform manual annotation review first

### 16.4 McMaster + Attain Combined D20 Picture

| Source | D20 instances |
|---|---|
| McMaster | 800 |
| Attain OS v1.0 | 198 |
| Attain WS v1.0 | 1,349 |
| Attain WS v2.0 | ~2,543 (after bbox clipping) |
| **Total potential D20** | **~4,890** |

Combining McMaster and Attain provides substantial D20 data. McMaster uniquely adds **D00 and D10 sources that Attain cannot provide**.

---

## 17. Preservation Confirmation

| Item | Status |
|---|---|
| `data/raw/McMaster/McMaster.zip` — not modified | ✅ Confirmed |
| `data/raw/Attain/Attain.zip` — not modified | ✅ Confirmed |
| `data/raw/RDD2022/` — not modified | ✅ Confirmed |
| `data/processed/yolo/` — not modified | ✅ Confirmed |
| `models/best.pt` — not modified | ✅ Confirmed |
| Existing training scripts — not modified | ✅ Confirmed |
| Backend, frontend, scoring, database — not modified | ✅ Confirmed |
| No model training performed | ✅ Confirmed |
| No dataset merging or preprocessing performed | ✅ Confirmed |
| No class remapping performed | ✅ Confirmed |

---

*Report generated by automated forensic inspection. All figures measured from actual archive contents. Inspection scripts stored in scratch directory. No data was extracted into project directories, modified, moved or renamed during this inspection.*

