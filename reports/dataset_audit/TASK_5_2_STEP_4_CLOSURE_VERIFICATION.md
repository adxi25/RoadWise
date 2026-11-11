# TASK 5.2 STEP 4 — CLOSURE VERIFICATION AND AUDIT REPORT

**Project:** RoadWise — AI-Powered Road Inspection System  
**Task:** 5.2 Step 4 — Candidate Compilation Closure Verification  
**Date:** 2026-11-10  
**Auditor:** Antigravity (independent automated verification & forensic audit)  
**Evaluated Assets:**  
- `data/processed/crack_experiment_a_3class/` (5,052 images, 10,108 bounding boxes)  
- `data/processed/crack_experiment_c_2class/` (3,669 images, 7,576 bounding boxes)  
- `data/processed/investigation_cohort/` (18 images, 32 bounding boxes)  
- `reports/dataset_audit/dataset_manifest_step4.json`  
- `reports/dataset_audit/step_4_candidate_affected_boxes.csv`  
**Status:** COMPLETE — Formal closure verification report with PASS / FAIL / NEEDS REVIEW verdicts  

---

## 1. Executive Summary & Verification Scorecard

An independent, read-only audit was conducted on the candidate datasets compiled in Task 5.2 Step 4. All raw archives (`McMaster.zip`, `Attain.zip`), baseline RDD2022 splits (`data/processed/yolo/`), and the active model (`models/best.pt`) remain 100% unmodified.

### Master Verification Scorecard

| Section | Verification Item | Verdict | Key Finding |
|---|---|:---:|---|
| **§2** | **Step 3C Questionable Samples (18)** | **PASS** | 18 / 18 strictly quarantined in `investigation_cohort/`. 0 leaked into Exp A or C. |
| **§2** | **Step 3C Unable Samples (5)** | **NEEDS REVIEW** | Entered candidate splits (1 test, 4 train). Must be moved to quarantine before training. |
| **§2** | **Step 3C Pending Samples (2)** | **NEEDS REVIEW** | Samples #59 (D10) and #166 (D20) currently reside in candidate train splits awaiting decision. |
| **§3** | **Candidate Box Filter (< 0.02)** | **PASS** | 643 boxes logged in CSV. Raw annotations preserved in ZIPs. Target crack retention > 99.6%. |
| **§4** | **Exact Duplicate Removal** | **PASS** | 4 Attain WS v1.0 duplicate pairs purged (0 present in candidates). Zero cross-dataset duplicates. |
| **§4** | **Near-Duplicate Leakage (McMaster)** | **PASS** | Scene ID grouping (`NNNN`) prevents all spatial and perceptual tile leakage across splits. |
| **§4** | **Near-Duplicate Leakage (Attain)** | **NEEDS REVIEW** | Image-level hashing scattered consecutive video frames across train and val. Sequence grouping needed. |
| **§5** | **Scene Split Integrity (McMaster)** | **PASS** | 371 scenes partitioned atomically. Zero scene overlap (0 train ∩ val, 0 train ∩ test). |
| **§6** | **Dataset Integrity (Exp A & C)** | **PASS** | 100% paired (5,052 & 3,669 pairs). 0 out-of-range coords. 0 invalid classes. 0 non-target contamination. |
| **Overall** | **Readiness to Advance to Step 5** | **NEEDS REVIEW** | **Conditionally Ready.** Geometrically sound, but requires resolving the 7 non-correct samples and Attain sequence grouping before training. |

---

## 2. Audit of Step 3C Human-Review Sample Statuses

Every sample from `TASK_5_2_STEP_3C_HUMAN_REVIEW_UPDATED.csv` was audited against the compiled candidate splits:

### 2.1 The 18 Questionable Samples — VERDICT: PASS ✅
- **Requirement:** Must remain strictly quarantined; must not enter training, validation, or test.
- **Measured Result:**
  - **In `investigation_cohort/images/`:** **18 / 18 (100%)**
  - **In `crack_experiment_a_3class/`:** **0 / 18 (0.00%)**
  - **In `crack_experiment_c_2class/`:** **0 / 18 (0.00%)**
- **Exact Sample IDs Quarantined:** #7, #23, #24, #25, #44, #104, #108, #116, #147, #150, #154, #179, #182, #206, #207, #208, #235, #237.
- **Finding:** Zero leakage. All 18 questionable samples are safely isolated with their 32 bounding boxes and metadata intact.

---

### 2.2 The 5 Unable-to-Determine Samples — VERDICT: NEEDS REVIEW ⚠️
- **Requirement:** Must not silently enter training, validation, or test.
- **Audit Discovery:** During the automated compilation script in Step 4, only the 18 QUESTIONABLE samples were explicitly routed to `investigation_cohort/`. As a consequence, the 5 `UNABLE_TO_DETERMINE` samples were compiled into the candidate datasets based on their source split/hash.

| Sample ID | Dataset | Release | Filename | Candidate Split in Exp A | Candidate Split in Exp C | Reviewer Status | Recommended Handling |
|:---:|---|---|---|:---:|:---:|:---:|---|
| **#139** | McMaster | v2 | `0720_1_3_JPG.rf.3a906de64aac8218555a6880990ad7c8.jpg` | `test` | `test` | UNABLE | Move to `investigation_cohort/` |
| **#149** | McMaster | v2 | `1110_1_4_JPG.rf.8537fd3480fd617a389656ec4fa1506d.jpg` | `train` | `train` | UNABLE | Move to `investigation_cohort/` |
| **#168** | Attain | OS v1.0 | `Attain_SMP_OS_v1_000418.jpg` | `train` | `train` | UNABLE | Move to `investigation_cohort/` |
| **#177** | Attain | OS v1.0 | `Attain_SMP_OS_v1_000517.jpg` | `train` | `train` | UNABLE | Move to `investigation_cohort/` |
| **#230** | Attain | WS v2.0 | `Attain_SMP_WS_v2_000352.jpg` | `train` | `train` | UNABLE | Move to `investigation_cohort/` |

- **Action Required Prior to Training:** Remove these 5 images and their corresponding label files from `crack_experiment_a_3class` and `crack_experiment_c_2class`, and move them into `investigation_cohort/`.

---

### 2.3 The 2 Pending Samples — VERDICT: NEEDS REVIEW ⚠️
- **Requirement:** Must not silently enter training, validation, or test without explicit decision.
- **Audit Discovery:** Like the unable samples, these 2 unreviewed samples entered candidate training splits.

| Sample ID | Dataset | Release | Filename | Candidate Split in Exp A | Candidate Split in Exp C | Visual Ground Truth | Recommended Handling |
|:---:|---|---|---|:---:|:---:|---|---|
| **#59** | McMaster | v2 | `0180_3_7_JPG.rf.fb4c4ef9b7e4feb28d6e2fa2b8260cb6.jpg` | `train` | *(Not in Exp C)* | Authentic transverse crack crossing perpendicular to double yellow lines. | Approve as **CORRECT** or quarantine. |
| **#166** | Attain | OS v1.0 | `Attain_SMP_OS_v1_000598.jpg` | `train` | `train` | Authentic central fatigue web; co-occurring linear crack boxes. | Approve as **CORRECT (D20)** or quarantine. |

- **Action Required Prior to Training:** Project lead can formally approve these two samples as `CORRECT` (based on visual inspection), or instruct them to be quarantined alongside the others.

---

## 3. Verification of Candidate Box Threshold (< 0.02) — VERDICT: PASS ✅

- **Filter Traceability:** All 643 filtered boxes are logged line-by-line with bounding coordinates, source filenames, and violation reasons in `reports/dataset_audit/step_4_candidate_affected_boxes.csv`.
- **Raw Recoverability:** Raw dataset ZIP archives remain 100% intact:
  - `data/raw/McMaster/McMaster.zip` (285,996,789 bytes — verified identical)
  - `data/raw/Attain/Attain.zip` (155,000,978 bytes — verified identical)
- **Target Impact:** In target classes, retention is **99.65% for D00**, **99.80% for D10**, and **99.95% for D20**. Only true boundary slivers (< 12.8 px) were dropped.
- **Governance Status:** The 0.02 threshold remains conditionally accepted as a candidate compilation filter. It has not been applied retroactively to raw source files.

---

## 4. Duplicate and Near-Duplicate Handling

### 4.1 Exact SHA256 Duplicates — VERDICT: PASS ✅
- The 4 duplicate image pairs in Attain WS v1.0 were verified:
  - Dropped files: `000085.jpg`, `000250.jpg`, `000593.jpg`, `000714.jpg`.
  - Independent check confirmed **0 instances** of these 4 files exist anywhere in `crack_experiment_a_3class` or `crack_experiment_c_2class`.
- Cross-dataset exact duplicates: **0** between McMaster, Attain, and RDD2022 India.

### 4.2 Near-Duplicate Analysis & Cross-Split Leakage — VERDICT: NEEDS REVIEW ⚠️
An empirical audit evaluated whether perceptual near-duplicates (Hamming distance $\le 2$) cross split boundaries:

1. **McMaster v2 (Near-Duplicates):**
   - **Leakage: 0 (PASS)**. Because McMaster was partitioned strictly by Scene ID (`NNNN`), all adjacent orthophoto tiles and flipped copies from the same road section remain grouped in the same split partition.
2. **Attain Releases (Near-Duplicates):**
   - **Leakage Detected: 40 cross-split pairs in a 500-image sample (NEEDS REVIEW)**.
   - **Root Cause:** In Step 4, Attain splits were assigned via individual image stem hashing (`md5(stem) % 100`). Because Attain consists of high-framerate vehicle video captures, adjacent images (e.g. frame `000120` and `000121`) have sub-centimeter camera displacement. Hashing them individually caused sequential frames to fall into different splits (e.g. frame 120 in train, frame 121 in val).
   - **Remediation for Step 5 Training:** Attain splits must be restructured into **sequential contiguous blocks** (e.g., frames 001–160 train, 161–180 val, 181–200 test) or grouped by video sequence number prior to training to eliminate frame leakage.

---

## 5. McMaster Scene-Level Split Integrity — VERDICT: PASS ✅

An independent regex extraction of Scene ID (`NNNN`) across all image files in `crack_experiment_a_3class` and `crack_experiment_c_2class` verified scene-level isolation:

```
+---------------------------------------------------------------------------------------------------+
| SPLIT INTEGRITY METRIC                  EXPERIMENT A (3-CLASS)         EXPERIMENT C (2-CLASS)     |
+---------------------------------------------------------------------------------------------------+
| Unique Scenes in Train                  249 scenes                     221 scenes                 |
| Unique Scenes in Validation             32 scenes                      25 scenes                  |
| Unique Scenes in Test                   31 scenes                      29 scenes                  |
| Total Active McMaster Scenes            312 scenes                     275 scenes                 |
|---------------------------------------------------------------------------------------------------|
| Scene Overlap: Train ∩ Validation       0 (ZERO LEAKAGE)               0 (ZERO LEAKAGE)           |
| Scene Overlap: Train ∩ Test             0 (ZERO LEAKAGE)               0 (ZERO LEAKAGE)           |
| Scene Overlap: Validation ∩ Test        0 (ZERO LEAKAGE)               0 (ZERO LEAKAGE)           |
| Tile Overlap (Flip Copy Leakage)        0 (ZERO LEAKAGE)               0 (ZERO LEAKAGE)           |
+---------------------------------------------------------------------------------------------------+
```

- **Flip Copies:** 100% of Roboflow flip copies stay strictly grouped with their original parent tiles in the assigned split partition.

---

## 6. Complete Validation of Candidate Datasets — VERDICT: PASS ✅

Independent verification of all label files and images across both candidates:

### 6.1 Experiment A (Canonical 3-Class Detector)
- **data.yaml:** Present and valid (`nc: 3`, names: `['longitudinal_crack', 'transverse_crack', 'alligator_crack']`).
- **Image-Label Pairing:** **5,052 images, 5,052 labels (100% paired)**. Unpaired images: 0. Unpaired labels: 0.
- **Empty Labels:** **0 empty label files**. Every image in the dataset contains at least 1 valid crack annotation.
- **Coordinate Integrity:** **0 out-of-range coordinates**. All coordinates strictly satisfy $0 \le cx, cy \le 1$ and $0 < w, h \le 1$.
- **Invalid Class IDs:** **0**. All 10,108 bounding boxes use IDs 0, 1, or 2.
- **Non-Target Contamination:** **0**. No instances of McMaster `Repair`, `Oblique`, `Pothole`, `Block`, or Attain `Linear crack` exist in any label file.
- **Class Distribution:**
  - `train`: Class 0 (Longitudinal): 2,051 | Class 1 (Transverse): 1,898 | Class 2 (Alligator): 4,038
  - `val`: Class 0 (Longitudinal): 277 | Class 1 (Transverse): 316 | Class 2 (Alligator): 534
  - `test`: Class 0 (Longitudinal): 240 | Class 1 (Transverse): 318 | Class 2 (Alligator): 436

### 6.2 Experiment C (Baseline 2-Class Detector)
- **data.yaml:** Present and valid (`nc: 2`, names: `['longitudinal_crack', 'alligator_crack']`).
- **Image-Label Pairing:** **3,669 images, 3,669 labels (100% paired)**. Unpaired: 0.
- **Empty Labels:** **0 empty label files**.
- **Coordinate Integrity:** **0 out-of-range coordinates**.
- **Invalid Class IDs:** **0**. All 7,576 bounding boxes use IDs 0 or 1.
- **Class Distribution:**
  - `train`: Class 0 (Longitudinal): 2,051 | Class 1 (Alligator): 4,038
  - `val`: Class 0 (Longitudinal): 277 | Class 1 (Alligator): 534
  - `test`: Class 0 (Longitudinal): 240 | Class 1 (Alligator): 436

---

## 7. Unresolved Risks and Actions Required Prior to Training

Before initiating model training in Step 5, the following two specific operational items must be resolved:

1. **Quarantine the 5 Unable Samples:**
   - Remove Samples #139, #149, #168, #177, #230 from `crack_experiment_a_3class` and `crack_experiment_c_2class` and move them into `investigation_cohort/`.
2. **Formally Close the 2 Pending Samples:**
   - Approve Samples #59 and #166 as `CORRECT` based on the visual audit findings in Section 2.3, OR instruct them to be moved into `investigation_cohort/`.
3. **Restructure Attain Splits by Contiguous Sequence Blocks:**
   - Modify the Attain split assignment logic from individual image stem hashing to continuous index blocks (e.g. blocks of 50 consecutive frames) to eliminate video frame near-duplicate leakage between train and val.

---

## 8. Final Closure Recommendation

Both candidate datasets (**Experiment A: 3-Class** and **Experiment C: 2-Class**) are **structurally, geometrically, and semantically verified**. They solve the severe D00 and D10 deficits of the historical RDD2022 baseline while preserving pristine benchmark isolation.

**Advancement Recommendation:** **CONDITIONALLY APPROVED TO ADVANCE TO STEP 5.**  
Upon executing the minor 7-sample quarantine adjustment and Attain sequence-block grouping, both datasets are 100% ready for baseline model training.

---

*Report generated by independent automated verification. Raw archives and model checkpoints remain 100% unmodified.*

