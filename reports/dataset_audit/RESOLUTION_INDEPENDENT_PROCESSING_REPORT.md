# RoadWise — Resolution-Independent Dataset Processing & WS_V2.0 Recovery Investigation

## 1. Executive Summary

In response to the 640×640 bounding-box clipping bug identified in `step4_final_recompilation.py`, we designed, implemented, and verified a permanent, reusable, resolution-independent dataset processing module for RoadWise.

The new module:
1. Dynamically inspects native image dimensions directly from file/buffer headers without hardcoded assumptions.
2. Cross-checks image dimensions against annotation metadata (`<size>` in Pascal VOC XML) and flags discrepancies.
3. Performs mathematically correct coordinate normalization, defensive edge clipping, coordinate validation, and threshold filtering.
4. Preserves original image resolutions to allow YOLOv8 runtime letterboxing (`imgsz`) to operate as configured.

Using this module, all **141 previously excluded Attain WS_V2.0 images** were inspected. **100% of them (479 valid D20 crack bounding boxes)** are valid. A sequence-level and near-duplicate leakage analysis was conducted, yielding zero cross-split leaks. Proposed split assignments are detailed below for project lead approval before any changes are made to compiled datasets.

---

## 2. Files Changed & Added

| File | Status | Description |
|:---|:---:|:---|
| [`src/preprocessing/annotation_converter.py`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/src/preprocessing/annotation_converter.py) | **NEW** | Core reusable resolution-independent converter supporting Pascal VOC, YOLO, and Polygon formats with dimension cross-checking and geometry validation. |
| [`src/preprocessing/__init__.py`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/src/preprocessing/__init__.py) | **NEW** | Package exports for the preprocessing module. |
| [`tests/test_annotation_converter.py`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/tests/test_annotation_converter.py) | **NEW** | Comprehensive unit test suite (17 tests covering square, landscape, portrait, boundary clipping, inverted boxes, zero-area, thresholding, and metadata mismatch). |
| `scratch/run_recovery_investigation.py` | **NEW** | Forensic recovery and near-duplicate leakage verification script for the 141 WS_V2.0 images. |
| `scratch/recovery_investigation_141.json` | **NEW** | Full machine-readable audit catalog of all 141 images, dimensions, hashes, and boxes. |

---

## 3. Automated Validation & Test Suite

The unit test suite was executed using `pytest` (`venv/Scripts/python.exe -m pytest tests/test_annotation_converter.py -v`):
- **Total Tests:** 17
- **Passed:** 17 (100%)
- **Execution Time:** 0.28s

### Test Coverage Highlights:
- **Aspect Ratio & Orientations:** Verified square (640×640, ratio 1.0), ultrawide landscape (1479×508, ratio 2.91), Full HD landscape (1920×1080, ratio 1.78), and portrait (1080×1920, ratio 0.56).
- **Coordinate Transformation Math:** Confirmed that boxes with $x_{min} > 640$ (e.g. $[700, 1100]$ on a 1479-wide image) are converted to exact normalized coordinates ($x_c = 900/1479, w = 400/1479$) rather than being clipped to negative width.
- **Edge Boundary Clipping:** Confirmed defensive clamping to $[0, W]$ and $[0, H]$ when annotations slightly overshoot frame edges ($[-15, 1930] \rightarrow [0, 1920]$).
- **Defensive Error Handling:** Confirmed rejection of inverted coordinates ($x_{min} > x_{max}$), zero-area degenerate boxes, and completely out-of-bounds coordinates.
- **Metadata Dimension Mismatch:** Confirmed that if XML metadata claims 640×640 but actual image is 1920×1080, the converter flags `dimension_mismatch = True` while accurately using the verified image dimensions (1920×1080) for normalization.

---

## 4. Recovery Investigation: 141 Excluded Attain WS_V2.0 Images

### 4.1 Image Dimension & Conversion Audit
All 141 images were loaded directly from `data/raw/Attain/Attain.zip` and converted with target class remapping (`Alligator crack` $\rightarrow$ class 2) and candidate box threshold ($0.02$):

| Metric | Result | Notes |
|:---|:---:|:---|
| **Total Excluded Images Processed** | **141** | Exactly matches the count identified in reconciliation. |
| **1920×1080 (Full HD Landscape)** | **114 images (80.9%)** | Average 3.8 D20 boxes per image. |
| **1479×508 (Ultrawide Landscape)** | **27 images (19.1%)** | Average 1.7 D20 boxes per image. |
| **640×640 (Square)** | **0 images** | Confirms 640×640 images were never affected by the bug. |
| **Dimension Mismatches (Actual vs XML)** | **0** | XML `<size>` width/height matched actual dimensions in 100% of images. |
| **Conversion Status: VALID_TARGET_OBJECTS** | **141 images (100%)** | Zero images failed conversion or were empty. |
| **Total Valid D20 Boxes Recovered** | **479 boxes** | High-quality alligator crack annotations. |
| **Boundary-Clipped Boxes** | **0** | All 479 boxes were cleanly within image boundaries. |
| **Filtered Candidate Boxes (<0.02)** | **2 boxes** | Filtered by candidate dimension rule (preserved in audit log). |
| **Genuinely Invalid Boxes** | **0** | Zero inverted, corrupted, or zero-area boxes. |

---

### 4.2 Sequence-Level & Near-Duplicate Analysis

Frame numbers in Attain WS_V2.0 are sequential recording frame indices (`_000001.jpg` to `_000847.jpg`).
We mapped the 141 images to the established chronological partition zones:

| Partition Zone | Frame Range | Images | Valid D20 Boxes | Near-Duplicate Leakage (dHash $\le$ 2) | Proposed Assignment |
|:---|:---:|:---:|:---:|:---:|:---|
| **Train Zone** | Frames 61–515 | 54 | 152 | 0 cross-split leaks (all pairs within Train) | **Train** |
| **Guard 1 Zone** | Frames 570–587 | 0 | 0 | N/A | — |
| **Val Zone** | Frames 588–641 | 0 | 0 | N/A | — |
| **Guard 2 Zone** | Frames 642–651 | 6 | 12 | 0 cross-split leaks (all pairs within Guard 2) | **Guard Interval (Guard 2)** |
| **Test Zone** | Frames 676–799 | 55 | 213 | 0 cross-split leaks (all pairs within Test) | **Test** |
| **Post-Test Zone** | Frames 810–847 | 26 | 102 | 0 cross-split leaks (0 leaks to Test or Train) | **Decision Required (See Section 6)** |
| **Total** | | **141** | **479** | **0 Cross-Split Leaks** | |

---

## 5. Proposed Dataset Recovery Impact (Experiment A & C)

### If Train (54) + Guard (6) + Test (55) are integrated into current candidate datasets:
1. **Experiment A Train Split:**
   - Attain WS_V2.0 Train images increase from **333 to 387** (+54 images).
   - Valid D20 boxes in Train increase by **+152 boxes** (from 3,475 to 3,627).
2. **Guard Interval:**
   - WS_V2.0 Guard Interval increases from **22 to 28 images** (+6 images in Guard 2: frames 642, 643, 644, 649, 650, 651).
   - Strengthens temporal isolation between Val (ends at frame 641) and Test (starts at frame 658).
3. **Experiment A Test Split (Resolves Known D20 Test Imbalance):**
   - Attain WS_V2.0 Test images increase from **20 to 75 images** (+55 images).
   - Valid D20 test boxes increase by **+213 boxes** (from 148 to 361 boxes).
   - **Critical Benefit:** Resolves the limitation documented in Section 8.2 of the closure report, bringing D20 test representation (361 boxes) to balanced parity with D00 (240 boxes) and D10 (318 boxes).
4. **Validation Split:**
   - Completely untouched (0 images added; remains 100% frozen as an uncompromised evaluation set).

---

## 6. Unresolved Decision: The 26 Post-Test Frames (Frames 810–847)

Frames 810 to 847 contain 26 images with 102 valid D20 boxes beyond the established frame-803 boundary.
Per your instructions, these have **not** been assigned. We present three options for your decision:

- **Option A (Extend Test Split):**
  Assign all 26 frames to the held-out Test split.
  - *Pros:* Frames 810–847 are chronologically after Test (frame 803) with a 6-frame buffer (frames 804–809 are non-D20). Near-duplicate audit confirmed **0 leaks** to frames $\le 803$. Expands test evaluation sample.
  - *Cons:* Slightly shifts test set size (+26 images).
- **Option B (Recommended — Separate Held-Out Generalization Benchmark):**
  Keep all 26 frames completely quarantined/held out in a separate directory (`data/processed/benchmarks/ws2_post803_benchmark/`).
  - *Pros:* Completely pristine, unseen real-world temporal sequence benchmark to evaluate model performance on continuous road stretches after training. Keeps candidate splits strictly bound to the established $\le 803$ domain.
  - *Cons:* Those 26 images do not contribute to standard test mAP metrics.
- **Option C (Guard Interval 3 / Exclude):**
  Exclude all 26 frames into `attain_sequence_splitting_log.json` as an extended post-test guard buffer.

---

## 7. Strict Boundary & Preservation Confirmation

- ✅ **Source Archives Untouched:** `data/raw/McMaster/McMaster.zip` and `data/raw/Attain/Attain.zip` were not modified.
- ✅ **Compiled Datasets Untouched:** `data/processed/crack_experiment_a_3class`, `data/processed/crack_experiment_c_2class`, and `investigation_cohort` were NOT modified.
- ✅ **Model Checkpoints Untouched:** `models/best.pt` (SHA256: `f01701f0dad28b52...`) was not modified.
- ✅ **Training Blocked:** No training jobs or scripts were initiated.

**Awaiting your approval on the proposed split assignments and decision on the 26 post-test frames before proceeding.**

