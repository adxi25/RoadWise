# RoadWise — Final Dataset Recompilation & Integrity Audit Report

**Task:** Task 5.2 Step 4 — WS_V2.0 Recovery Integration, Recompilation & Final Integrity Audit  
**Date:** November 11, 2026  
**Status:** **COMPLETE & 100% VERIFIED (ALL GATES & INTEGRITY CHECKS PASSED)**

---

## 1. Phase 1 — Verification of the Two Remaining Gaps

Both pre-recompilation verification gates were independently executed with explicit assertions before altering any compiled data:

| Gate | Check Scope | Result | Evidence & Metrics |
|:---|:---|:---:|:---|
| **Gap A: Exp A & C External Duplicates** | All 141 recovered images vs. 395 existing WS_V2.0 images in Exp A and Exp C manifests | **PASS** | • Zero filename collisions.<br>• Exp A and Exp C have identical WS_V2.0 membership.<br>• 20 compatible pairs detected ($\text{dHash} \le 2$), all within identical splits.<br>• **0 cross-split leakage conflicts** (`assert len(conflicts_a) == 0` and `assert len(conflicts_c) == 0`). |
| **Gap B: Guard 2 Leakage Verification** | 6 proposed Guard 2 images (`_000642`, `_000643`, `_000644`, `_000649`, `_000650`, `_000651`) vs. existing Train, Val, Test, and Guard 2 | **PASS** | • vs. Existing Train: **0 pairs**<br>• vs. Existing Validation: **0 pairs**<br>• vs. Existing Test: **0 pairs**<br>• vs. Existing Guard 2: 6 intra-guard cluster pairs.<br>• Confirmed as a strictly isolated temporal buffer between Val (ends frame 641) and Test (starts frame 658). |

---

## 2. Phase 2 — Applied Recovery Assignments

All 141 recovered WS_V2.0 images were converted with the resolution-independent annotation converter ([`src/preprocessing/annotation_converter.py`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/src/preprocessing/annotation_converter.py)) using actual image dimensions (114 at 1920×1080, 27 at 1479×508) and candidate box threshold ($0.02$):

| Disposition | Recovered Images | Valid D20 Boxes | Destination & Action Taken |
|:---|:---:|:---:|:---|
| **Train** | **54** | **152** | Added to `crack_experiment_a_3class/train` and `crack_experiment_c_2class/train`. |
| **Guard 2 Interval** | **6** | **12** | Added to [`attain_sequence_splitting_log.json`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/reports/dataset_audit/attain_sequence_splitting_log.json) only; excluded from all splits. |
| **Test** | **55** | **213** | Added to `crack_experiment_a_3class/test` and `crack_experiment_c_2class/test`. |
| **Option B Benchmark** | **26** | **102** | Stored separately in [`data/processed/benchmarks/ws2_post803_benchmark/`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/data/processed/benchmarks/ws2_post803_benchmark/). |
| **Validation** | **0** | **0** | **Completely unchanged & 100% frozen.** |
| **Total** | **141** | **479** | **100% of recovered images and boxes accounted for.** |

---

## 3. Final Rebuilt Dataset Counts

### 3.1 Experiment A (3-class: D00, D10, D20)

`data/processed/crack_experiment_a_3class/`

| Split | Images | Labels | D00 (Longitudinal) | D10 (Transverse) | D20 (Alligator) | Total Boxes | Change vs Pre-Recovery |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Train** | **3,939** | 3,939 | 2,051 | 1,897 | 3,627 | **7,575** | +54 images, +152 boxes |
| **Val** | **513** | 513 | 277 | 316 | 406 | **999** | +0 images, +0 boxes (frozen) |
| **Test** | **522** | 522 | 240 | 318 | 361 | **919** | +55 images, +213 boxes |
| **Total** | **4,974** | **4,974** | **2,568** | **2,531** | **4,394** | **9,493** | **+109 images, +365 boxes** |

> [!NOTE]
> **Resolution of D20 Test Imbalance:** In the pre-recovery dataset, D20 test had only 148 boxes vs D00's 240 and D10's 318. With the recovery of 55 valid test images, D20 test boxes increased to **361 boxes**, establishing balanced statistical power across all three defect classes.

### 3.2 Experiment C (2-class: D00, D20)

`data/processed/crack_experiment_c_2class/`

| Split | Images | Labels | D00 (Longitudinal) | D20 (Alligator) | Total Boxes | Change vs Pre-Recovery |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Train** | **2,918** | 2,918 | 2,051 | 3,627 | **5,678** | +54 images, +152 boxes |
| **Val** | **339** | 339 | 277 | 406 | **683** | +0 images, +0 boxes (frozen) |
| **Test** | **335** | 335 | 240 | 361 | **601** | +55 images, +213 boxes |
| **Total** | **3,592** | **3,592** | **2,568** | **4,394** | **6,962** | **+109 images, +365 boxes** |

---

## 4. Attain WS_V2.0 Full Universe Reconciliation

Every single one of the **561 raw D20-annotated images** in Attain WS_V2.0 is rigorously accounted for:

$$\text{Raw WS\_V2.0 D20 Images (561)} = \text{Train (387)} + \text{Val (42)} + \text{Test (75)} + \text{Guard (28)} + \text{Option B (26)} + \text{Quarantine (3)}$$

| Component | Image Count | Valid D20 Boxes | Status / Destination |
|:---|:---:|:---:|:---|
| **WS_V2.0 Train Split** | **387** | 1,178 | In Exp A & C `train/` (333 existing + 54 recovered) |
| **WS_V2.0 Validation Split** | **42** | 90 | In Exp A & C `val/` (100% frozen) |
| **WS_V2.0 Test Split** | **75** | 258 | In Exp A & C `test/` (20 existing + 55 recovered) |
| **WS_V2.0 Guard Interval** | **28** | 56 | Logged in `attain_sequence_splitting_log.json` (22 existing + 6 recovered) |
| **WS_V2.0 Option B Benchmark** | **26** | 102 | In `data/processed/benchmarks/ws2_post803_benchmark/` (frames 810–847) |
| **WS_V2.0 Investigation Cohort** | **3** | 6 | In `data/processed/investigation_cohort/` (samples #230, #235, #237) |
| **Total Accounted** | **561** | **1,690** | ✅ **100.0% Exact Match to Raw Dataset** |

---

## 5. Phase 3 — Integrity Audit Results

All 10 required integrity audits passed on the rebuilt datasets prior to finalization:

1. **Image-to-Label Pairing:** 100% match. 4,974 image/label pairs in Exp A; 3,592 image/label pairs in Exp C.
2. **YOLO Coordinate Normalization:** Zero corrupt boxes, zero inverted boxes, zero out-of-bounds coordinates across all 9,493 bounding boxes.
3. **Class ID Integrity:** Exp A class IDs strictly $\in \{0, 1, 2\}$; Exp C class IDs strictly $\in \{0, 1\}$.
4. **Manifest Reconciliation:** Disk counts match manifest records exactly.
5. **Duplicate Filenames:** Zero duplicate filenames across splits.
6. **Zero Leakage:** Complete dHash near-duplicate cross-check across all 504 WS_V2.0 images in splits confirmed **0 cross-split leakage pairs**.
7. **Guard & Benchmark Isolation:** All 45 guard interval images (17 WS1, 28 WS2) and all 26 benchmark images are 100% excluded from training and evaluation splits.
8. **Validation Immutability:** Validation images and label contents are 100% byte-for-byte identical to pre-rebuild state.
9. **Dataset YAML Integrity:** Verified `data.yaml` in Exp A (3 classes) and Exp C (2 classes).
10. **Unit Test Integrity:** All 17 converter unit tests passed in 0.23s (`tests/test_annotation_converter.py`).

---

## 6. Preservation of Core Assets

All critical project assets remain verified and byte-identical:

| Asset | Path | SHA256 Checksum | Status |
|:---|:---|:---|:---:|
| **McMaster Raw Archive** | `data/raw/McMaster/McMaster.zip` | `039f7fabf95bde4b78db77a17ee0280e707690d63ee6d3b9888c31f4597a3bf5` | **Untouched** |
| **Attain Raw Archive** | `data/raw/Attain/Attain.zip` | `92002d05bcfa92a4f2c4e3f1a6f019a9cc6e03446a406dd80527b35eee4520bc` | **Untouched** |
| **Production Model** | `models/best.pt` | `f01701f0dad28b5232fb1a68f9103e579ad956bd8593ae833f9ea2b7165d350f` | **Untouched** |
| **Historical RDD2022** | `data/processed/yolo/` | 7,706 images | **Untouched** |

---

## 7. Unresolved Issues

**None.**
- The 141-image WS_V2.0 recovery is fully implemented, verified, and finalized into the candidate datasets.
- The 26 post-test frames (frames 810–847) are safely quarantined as an independent benchmark (Option B).
- No model training has been started.

**Execution halted. Ready for separate authorization of model training.**

