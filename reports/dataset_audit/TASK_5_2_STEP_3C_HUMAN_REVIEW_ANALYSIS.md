# TASK 5.2 STEP 3C — HUMAN REVIEW ANALYSIS REPORT

**Project:** RoadWise — AI-Powered Road Inspection System  
**Task:** 5.2 Step 3C — Human Review Analysis and Annotation Quality Audit  
**Date:** 2026-11-10  
**Analyst:** Antigravity (automated forensic evaluation of human reviewer decisions)  
**Input Dataset:** `reports/dataset_audit/TASK_5_2_STEP_3C_HUMAN_REVIEW_UPDATED.csv`  
**Summary Dataset:** `reports/dataset_audit/TASK_5_2_STEP_3C_REVIEW_SUMMARY.csv`  
**Status:** COMPLETE & FINALIZED — Awaiting approval on Task 5.2 Step 4 Execution Plan  

---

## 1. Executive Summary

This report delivers a rigorous, data-driven analysis of the manual ground-truth review conducted on **240 targeted candidate samples** across the **McMaster v2** and **Attain (OS v1.0, WS v1.0, WS v2.0)** road damage datasets.

The review was executed using the interactive web-based inspection tool (`review_interface.html`), with reviewer decisions and qualitative comments captured in `TASK_5_2_STEP_3C_HUMAN_REVIEW_UPDATED.csv`.

### Key Headline Findings

1. **High Overall Acceptance Rate (89.58%):**
   - Out of 240 sampled candidate images, **215 were verified as CORRECT (89.58%)**, **18 were flagged as QUESTIONABLE (7.50%)**, **5 were flagged as UNABLE_TO_DETERMINE (2.08%)**, **0 were flagged as INCORRECT (0.00%)**, and **2 remain PENDING (0.83%)**.
   - Among completed reviews (238 samples), the human acceptance rate is **90.34%**.
2. **Class-Wise Quality Hierarchy:**
   - **D10 (Transverse crack) is the cleanest class in the audit (98.00% correct, 0% questionable)**. Annotations exhibit unambiguous perpendicular orientation across lanes.
   - **D00 (Longitudinal crack) demonstrates solid viability (90.00% correct, 10.00% questionable)**. Questionable cases involve paving seams or extremely faint micro-cracks.
   - **D20 (Alligator crack) exhibits the highest ambiguity (86.43% correct, 9.29% questionable, 3.57% unable)** across 140 pooled samples. Reviewer notes pinpoint low-contrast images, confusion with longitudinal cracks, missing secondary annotations, and multi-box fragmentation.
3. **Source-Wise Viability:**
   - **McMaster v2** is confirmed as an effective source for **D00 (Longitudinal, 90.0% correct)** and **D10 (Transverse, 98.0% correct)**, solving the directional crack deficit identified in Task 5.2 Step 2B.
   - **Attain OS v1.0** provides pristine polygonal D20 alligator crack boundaries (83.33% correct), while **WS v1.0 (86.67% correct)** and **WS v2.0 (90.00% correct)** provide substantial alligator volume, provided that format conversions and out-of-bounds coordinate clipping are applied.
4. **Attain Linear Crack Exclusion Maintained:**
   - Visual and forensic evidence confirms that Attain's generic `Linear crack` class combines longitudinal and transverse cracking without directionality. Under Rule 1, it remains strictly excluded from D00 and D10 training sets.

---

## 2. Data-Integrity Checks

Before computing statistical aggregations, automated integrity checks were conducted against `TASK_5_2_STEP_3C_HUMAN_REVIEW_UPDATED.csv`:

| Verification Item | Requirement | Measured Result | Status |
|---|---|---|:---:|
| **Total Record Count** | Exactly 240 rows | 240 rows | ✅ PASS |
| **Unique Sample IDs** | Exactly 240 unique IDs (1 to 240) | 240 unique IDs | ✅ PASS |
| **Unique Filenames** | Expected 239 unique (1 multi-class overlap) | 239 unique filenames (`0020_3_7_JPG` sampled in D00 & D10) | ✅ PASS |
| **Review Completion** | All decisions recorded | 238 completed (99.17%), 2 PENDING (0.83%) | ⚠️ DOCUMENTED |
| **Schema Integrity** | 18 defined columns present | 18 columns matched exactly | ✅ PASS |
| **Reviewer Metadata** | Reviewer identification recorded | `reviewer_id` blank across 240 rows; `review_date` set to `2026-11-09` | ⚠️ DOCUMENTED |
| **Field Completeness** | Core columns populated | All core image, release, split, and class columns 100% populated | ✅ PASS |

### Closure Detail: Review of Pending Samples (#59 and #166)

Two samples remained in `PENDING` status upon CSV export:

#### Sample ID #59
- **Dataset:** McMaster v2 | **Split:** train | **Target Class:** Transverse crack (D10)
- **Filename:** `0180_3_7_JPG.rf.fb4c4ef9b7e4feb28d6e2fa2b8260cb6.jpg`
- **Original Image:** `reports/dataset_audit/mcmaster_targeted_sampling/Transverse_crack/orig_009_0180_3_7_JPG.rf.fb4c4ef9b7e4feb28d6e2fa2b8260cb6.jpg`
- **Annotated Overlay:** `reports/dataset_audit/mcmaster_targeted_sampling/Transverse_crack/ann_009_0180_3_7_JPG.rf.fb4c4ef9b7e4feb28d6e2fa2b8260cb6.jpg`
- **Visual Evidence:** The raw image shows an asphalt driving lane with dual solid yellow centerlines running vertically along the right. In the lower-middle lane, an authentic crack cuts horizontally across the lane, precisely perpendicular to the yellow markings. The cyan bounding box labeled `Transverse cra` tightly bounds the defect.
- **Closure Recommendation for User:** **CORRECT**. Authentic transverse crack with accurate bounding box coverage and valid perpendicular orientation.

#### Sample ID #166
- **Dataset:** Attain OS v1.0 | **Split:** N/A | **Target Class:** Alligator crack (D20)
- **Filename:** `Attain_SMP_OS_v1_000598.jpg`
- **Original Image:** `reports/dataset_audit/attain_targeted_sampling/OS_V1.0/orig_016_Attain_SMP_OS_v1_000598.jpg`
- **Annotated Overlay:** `reports/dataset_audit/attain_targeted_sampling/OS_V1.0/ann_016_Attain_SMP_OS_v1_000598.jpg`
- **Visual Evidence:** Top-down/dashboard camera perspective with horizontal letterboxing. The center of the pavement shows a prominent fatigue cracking web. The red box labeled `Alligator crack` cleanly isolates the fatigue cluster. In addition, 4 unclassified linear crack boxes (grey) are present across the joint and lane.
- **Closure Recommendation for User:** **CORRECT (for D20)**. The red alligator crack annotation is semantically valid. The grey boxes reflect Attain's co-occurring generic linear crack class, which will be discarded during D20-only filtering.

*Note: In accordance with project instructions, neither sample has been altered in the CSV; both remain formally recorded as PENDING until approved.*

---

## 3. Overall Human-Review Statistics

Across all 240 audited candidate samples:

```
Total Samples: 240
├── CORRECT:              215  (89.58% of total | 90.34% of completed)
├── QUESTIONABLE:          18  ( 7.50% of total |  7.56% of completed)
├── UNABLE_TO_DETERMINE:    5  ( 2.08% of total |  2.10% of completed)
├── INCORRECT:              0  ( 0.00% of total |  0.00% of completed)
└── PENDING:                2  ( 0.83% of total)
```

| Decision Category | Total Count | % of All Samples (N=240) | % of Completed (N=238) | Interpretation |
|---|:---:|:---:|:---:|---|
| **CORRECT** | **215** | **89.58%** | **90.34%** | Ground-truth damage matches assigned class; suitable for training/eval. |
| **QUESTIONABLE** | **18** | **7.50%** | **7.56%** | Ambiguous boundary, faint contrast, paving seam, or unannotated cluster. |
| **UNABLE_TO_DETERMINE** | **5** | **2.08%** | **2.10%** | Severe blur, extreme low contrast, or occluded pavement texture. |
| **INCORRECT** | **0** | **0.00%** | **0.00%** | Zero outright bogus annotations (e.g. clean road with no defect) identified. |
| **PENDING** | **2** | **0.83%** | — | Unreviewed during manual session (Samples #59 and #166). |

### Methodological Distinction: Sample Acceptance Rate vs Whole-Dataset Quality

> [!IMPORTANT]
> **Extrapolation Warning:** The **89.58% acceptance rate** is derived from a stratified random sample of **N=240 images** across pools totaling over 8,000 candidate images. While this sample provides high statistical confidence that McMaster D10 and D00 and Attain D20 are fundamentally viable, **it does not prove that 100% of the remaining unreviewed images share this quality**. Localized video-capture anomalies, sequence-specific blur, or unreviewed weather conditions may exist in the unreviewed data. Whole-dataset quality will be enforced programmatically in Step 4 via automated filtering rules (e.g. minimum dimensions, clipping, and seam screening).

---

## 4. Dataset-Wise Analysis

The 240 samples were partitioned into 6 distinct forensic evaluation groups:

```
+---------------------------------------------------------------------------------------------------+
|                                 ACCEPTANCE RATE BY SUBSET POOL                                     |
+---------------------------------------------------------------------------------------------------+
| McMaster D10 (Transverse)     [██████████████████████████████████████████████████░]  98.00%       |
| McMaster D00 (Longitudinal)   [██████████████████████████████████████████░░░░░░░░]  90.00%       |
| Attain WS V2.0 (D20)          [██████████████████████████████████████████░░░░░░░░]  90.00%       |
| Attain WS V1.0 (D20)          [████████████████████████████████████████░░░░░░░░░░]  86.67%       |
| McMaster D20 (Alligator)      [████████████████████████████████████████░░░░░░░░░░]  86.00%       |
| Attain OS V1.0 (D20)          [███████████████████████████████████████░░░░░░░░░░░]  83.33%       |
+---------------------------------------------------------------------------------------------------+
```

### 4.1 McMaster Longitudinal Crack (D00)
- **Sample Size:** 50 images
- **Human Decisions:**
  - `CORRECT`: **45 (90.00%)**
  - `QUESTIONABLE`: **5 (10.00%)**
  - `UNABLE_TO_DETERMINE`: **0 (0.00%)**
  - `INCORRECT`: **0 (0.00%)**
  - `PENDING`: **0 (0.00%)**
- **Assessment:** **High quality candidate for D00.** Bounding boxes accurately follow lane directions. Paving seams and tiny slivers represent the only sources of questionability.

### 4.2 McMaster Transverse Crack (D10)
- **Sample Size:** 50 images
- **Human Decisions:**
  - `CORRECT`: **49 (98.00%)**
  - `QUESTIONABLE`: **0 (0.00%)**
  - `UNABLE_TO_DETERMINE`: **0 (0.00%)**
  - `INCORRECT`: **0 (0.00%)**
  - `PENDING`: **1 (2.00%)** (Sample #59)
- **Assessment:** **Highest quality class in the audit.** Provides an exceptionally clean, well-separated baseline for D10.

### 4.3 McMaster Alligator Crack (D20)
- **Sample Size:** 50 images
- **Human Decisions:**
  - `CORRECT`: **43 (86.00%)**
  - `QUESTIONABLE`: **5 (10.00%)**
  - `UNABLE_TO_DETERMINE`: **2 (4.00%)** (Samples #139, #149)
  - `INCORRECT`: **0 (0.00%)**
  - `PENDING`: **0 (0.00%)**
- **Assessment:** Viable for D20 (86% acceptance), but exhibits semantic boundary slippage where linear fractures or low-contrast regions are tagged as fatigue.

### 4.4 Attain OS V1.0 (D20 Alligator Crack)
- **Sample Size:** 30 images
- **Human Decisions:**
  - `CORRECT`: **25 (83.33%)**
  - `QUESTIONABLE`: **2 (6.67%)** (Samples #154, #179)
  - `UNABLE_TO_DETERMINE`: **2 (6.67%)** (Samples #168, #177)
  - `INCORRECT`: **0 (0.00%)**
  - `PENDING`: **1 (3.33%)** (Sample #166)
- **Assessment:** **Superior geometric delineation.** Polygonal segmentations eliminate sound asphalt inclusion. Bounding-box conversion yields clean D20 rectangles.

### 4.5 Attain WS V1.0 (D20 Alligator Crack)
- **Sample Size:** 30 images
- **Human Decisions:**
  - `CORRECT`: **26 (86.67%)**
  - `QUESTIONABLE`: **4 (13.33%)** (Samples #182, #206, #207, #208)
  - `UNABLE_TO_DETERMINE`: **0 (0.00%)**
  - `INCORRECT`: **0 (0.00%)**
  - `PENDING`: **0 (0.00%)**
- **Assessment:** Solid volume source for D20, but requires consolidating the `Low` vs `low` class ID split and standardizing mixed polygon/bbox formatting.

### 4.6 Attain WS V2.0 (D20 Alligator Crack)
- **Sample Size:** 30 images
- **Human Decisions:**
  - `CORRECT`: **27 (90.00%)**
  - `QUESTIONABLE`: **2 (6.67%)** (Samples #235, #237)
  - `UNABLE_TO_DETERMINE`: **1 (3.33%)** (Sample #230)
  - `INCORRECT`: **0 (0.00%)**
  - `PENDING`: **0 (0.00%)**
- **Assessment:** Highest raw acceptance rate among Attain releases (90.00%), reflecting high-resolution imagery. However, must undergo coordinate clipping to resolve image boundary overflows.

---

## 5. Verification of All 13 Reviewer Comments

Every qualitative comment recorded during the human review was extracted and mapped directly to its underlying candidate image:

| Sample ID | Dataset | Release | Class | Decision | Verbatim Reviewer Comment | Forensic Finding & Action |
|:---:|---|---|---|:---:|---|---|
| **#6** | McMaster | v2 | Longitudinal | CORRECT | *"extra class repair can be seen"* | Confirms presence of co-occurring `Repair` class. Verified that Repair is non-target and will be purged. |
| **#7** | McMaster | v2 | Longitudinal | QUESTIONABLE | *"only 2 annotations there are more small cracks"* | Incomplete labeling: minor secondary crack branches left unannotated. |
| **#8** | McMaster | v2 | Longitudinal | CORRECT | *"oblique crack extra not in our project but still correct"* | Co-occurring `Oblique crack` in same tile. Validates D00 box while confirming Oblique exclusion. |
| **#23** | McMaster | v2 | Longitudinal | QUESTIONABLE | *"very unclear image but still finds"* | Low-contrast / dark asphalt texture where crack visual confirmation is borderline. |
| **#25** | McMaster | v2 | Longitudinal | QUESTIONABLE | *"very small cracki think it can be neglect but stil good"* | Edge boundary sliver. Confirms the necessity of the minimum dimension filter. |
| **#104** | McMaster | v2 | Alligator | QUESTIONABLE | *"very unclear i cant seeee any cracks"* | Shadowed asphalt where fatigue micro-fissures cannot be verified by the human eye. |
| **#108** | McMaster | v2 | Alligator | QUESTIONABLE | *"unclear"* | Poor lighting and weathered aggregate surface. |
| **#116** | McMaster | v2 | Alligator | QUESTIONABLE | *"its more like longitudnal crack"* | **Critical finding:** Sidewalk paving section where a linear crack along the path was mislabeled as Alligator. |
| **#147** | McMaster | v2 | Alligator | QUESTIONABLE | *"only 1 annotation , 1 big annotation is left"* | Ground-truth omission: a prominent fatigue patch in the same tile lacked an annotation box. |
| **#154** | Attain | OS v1.0 | Alligator | QUESTIONABLE | *"unclear image but good annotation box but theres also 1 more box but theres no anotation"* | Missing annotation for secondary distress cluster. |
| **#179** | Attain | OS v1.0 | Alligator | QUESTIONABLE | *"not only alligator crack there other annotations are also present but no name of them"* | Reviewer noted presence of Attain's grey generic linear crack annotations. |
| **#183** | Attain | WS v1.0 | Alligator | CORRECT | *"no name for other annotations boxes"* | Confirms presence of co-occurring non-D20 boxes in WS v1.0. |
| **#216** | Attain | WS v2.0 | Alligator | CORRECT | *"multiple annotations for 1 single long crack"* | Multi-box fragmentation: annotators broke a single continuous distress into multiple adjacent boxes. |

---

## 6. Reconciliation of Tiny-Box Filtering Threshold

During Tasks 5.2 Step 3B, Step 3C Guide, and Step 3C Policy, two different numerical cutoffs were referenced:

1. **The Heuristic Screening Cutoff (`< 0.03` / < 19 px):**
   - Used during Step 3B exploratory scripts and referenced in the Review Guide as a visual screening mechanism to surface boundary slivers for human inspection.
2. **The Proposed Policy Rule (`< 0.02` / < 12.8 px):**
   - Formally proposed in `TASK_5_2_STEP_3C_ANNOTATION_POLICY.md` (Decision 3) as the mathematical filtering threshold for dataset preparation.

### Reconciliation Analysis
- Reviewer note on Sample #25 confirmed: *"very small cracki think it can be neglect but stil good"*.
- In a 640×640 image:
  - `0.03` corresponds to **19.2 pixels**.
  - `0.02` corresponds to **12.8 pixels**.
- **Impact Assessment:**
  - Filtering at `< 0.03` would remove **68 boxes** in McMaster v2, some of which are valid crack tips.
  - Filtering at `< 0.02` removes only true sub-patch slivers (< 13 pixels) that cause anchor instability at stride-16/stride-32 convolutional layers, while preserving meaningful crack tips.
- **Closure Decision:** The proposed policy threshold of **normalized width `< 0.02` OR height `< 0.02`** remains the recommended operational rule. The policy document was **not modified automatically**, preserving governance integrity.

---

## 7. Image Perspective Distribution (Close-Up vs Medium-Range vs Full-Road)

> [!NOTE]
> **Dataset-Quality Consideration:** Pavement inspection imagery exists on a continuum of camera distances:
> 1. **Close-Up (0.5m – 1.5m):** Tight pavement patches with high ground-sampling resolution (e.g., Attain vehicle-mounted downward cameras and McMaster 640×640 orthophoto crops).
> 2. **Medium-Range (2.0m – 5.0m):** Pavement area directly in front of the vehicle showing lane markings, surface transitions, and multiple lanes.
> 3. **Full-Road Windshield (5.0m – 20.0m+):** Forward-facing dashcam perspective showing horizon, traffic, curb lines, and lighting changes (e.g., RDD2022 India).

### Qualitative Audit Assessment
- Both McMaster v2 and Attain are heavily weighted toward **close-up pavement crops**.
- **Generalization Risk:** Training a model solely on tight close-up tiles introduces risk when deployed on full-road dashcam video feeds:
  - The model may overfit to high-resolution aggregate texture.
  - The model may struggle with perspective foreshortening and scale variations at 10–15 meters distance.
- **Architectural Requirement for Step 4:**
  - McMaster and Attain will serve as high-density feature providers for D00, D10, and D20.
  - RDD2022 India must be retained as the full-road perspective anchor to preserve real-world dashcam generalization.
  - *No synthetic perspective statistics are claimed or invented.*

---

## 8. Treatment of Questionable Samples (Investigation vs Discard)

Across the 240 samples, **18 were marked QUESTIONABLE**.

### Policy Enforcement
- **Questionable samples are NOT automatically deleted, purged, or discarded.**
- Automatically discarding them would risk discarding valid low-contrast damage (e.g. Sample #23) or minor micro-crack variations.
- **Operational Quarantine Protocol for Step 4:**
  - All 18 questionable samples (and similar candidates identified by automated rules) will be isolated into a designated `investigation_cohort/`.
  - They are excluded from the primary validation and test benchmarks to guarantee benchmark purity.
  - They remain eligible for training inclusion pending targeted verification or seam-detection filtering.

---

## 9. Dataset-Selection Recommendations for Task 5.2 Step 4

| Dataset / Source | Candidate Class | Human Acceptance | Formal Recommendation | Operational Conditions & Required Actions |
|---|---|:---:|:---:|---|
| **McMaster v2** | Longitudinal (D00) | 90.00% | **Retain with Filtering** | • Filter paving seams along lane lines.<br>• Filter tiny edge slivers (`w < 0.02` or `h < 0.02`).<br>• Partition by Scene ID prefix (`NNNN`) to prevent tile leakage. |
| **McMaster v2** | Transverse (D10) | 98.00% | **Retain** | • Cleanest class in project; retain across all splits.<br>• Filter boundary slivers (`h < 0.02`). |
| **McMaster v2** | Alligator (D20) | 86.00% | **Retain with Filtering** | • Exclude low-contrast or ambiguous samples (Samples #104, #108).<br>• Quarantine misclassified linear samples (Sample #116). |
| **McMaster v2** | Repair, Pothole, Block, Oblique | N/A | **Exclude** | • Purge Repair (3,194 boxes), Pothole (178 boxes), Block (5 boxes), and Oblique (337 boxes). |
| **Attain OS v1.0** | Alligator (D20) | 83.33% | **Retain (D20 Only)** | • Convert polygon segmentations to minimum bounding rectangles.<br>• Retain 198 pristine D20 instances.<br>• **Exclude generic Linear crack (720 instances)** per Rule 1. |
| **Attain WS v1.0** | Alligator (D20) | 86.67% | **Retain with Filtering (D20 Only)** | • Consolidate class IDs 0, 1, 2 (`High`, `Low`, `low`) into unified D20.<br>• Convert polygon rows to bounding boxes.<br>• Remove 4 duplicate image pairs.<br>• **Exclude generic Linear crack (4,103 instances)**. |
| **Attain WS v2.0** | Alligator (D20) | 90.00% | **Retain with Filtering (D20 Only)** | • Convert Pascal VOC XML to YOLO normalized format.<br>• **Clip bounding box coordinates** to image boundaries (`0 <= x <= w`, `0 <= y <= h`).<br>• **Exclude generic Linear crack (4,196 instances)**. |
| **Attain (All)** | Generic Linear crack | N/A | **Exclude** | • **Zero orientation metadata exists.** Violates Rule 1 if mapped to D00 or D10.<br>• Total 9,019 linear instances excluded from canonical crack model. |
| **RDD2022 India** | D00, D10, D20, D40 | Baseline | **Retain (Benchmark Anchor)** | • Retain existing processed splits as baseline evaluation reference.<br>• Preserves full-road windshield perspective. |

---

*Report finalized. Raw dataset archives, annotations, and checkpoints remain 100% unmodified.*
