# Model Experiments — RoadWise

This document records all model training experiments conducted for the RoadWise road-damage detection system. It covers architecture choices, dataset splits, hyperparameters, per-class metrics, error analyses, and next-step decision criteria.

> [!IMPORTANT]
> **Metric discipline:** Validation metrics are measured on the validation split during training. Test metrics are measured on the held-out test split after training completes. These are never interchangeable. All tables clearly label which split is being reported.

---

## Table of Contents

1. [Experiment History Overview](#1-experiment-history-overview)
2. [Production Model — roadwise_v2 (Original Pothole Model)](#2-production-model--roadwise_v2-original-pothole-model)
3. [Experiment A — 3-Class Crack Detection](#3-experiment-a--3-class-crack-detection)
4. [D20 Error Analysis](#4-d20-error-analysis)
5. [Experiment C — 2-Class D00+D20 (Planned)](#5-experiment-c--2-class-d00d20-planned)
6. [Cross-Experiment Comparison](#6-cross-experiment-comparison)
7. [Limitations and Caveats](#7-limitations-and-caveats)
8. [Decision Criteria for Next Steps](#8-decision-criteria-for-next-steps)

---

## 1. Experiment History Overview

| ID | Model | Classes | Dataset | Epochs | Best Epoch | Val mAP50 | Test mAP50 | Status |
|---|---|---|---|---|---|---|---|---|
| `roadwise_v2` | YOLOv8s fine-tuned | 4 (D00, D10, D20, D40) | RDD2022 (pothole-focused) | 83 | 53 | ~67.65% | — | ✅ **Production** |
| Exp A | YOLOv8s pretrained | 3 (D00, D10, D20) | McMaster + Attain OS/WS | 98 (of 100) | 68 | 62.0% | 52.77% | ✅ Trained, not integrated |
| Exp C | YOLOv8s pretrained | 2 (D00, D20) | McMaster + Attain OS/WS | 100 (planned) | — | — | — | ⏳ **Not yet run** |

> [!NOTE]
> `roadwise_v2` is the active production checkpoint used by the RoadWise backend (`models/best.pt`). Experiment A is a research checkpoint stored on Google Drive. Experiment C has a prepared notebook and dataset but has not been trained.

---

## 2. Production Model — roadwise_v2 (Original Pothole Model)

### 2.1 Configuration

| Parameter | Value |
|---|---|
| Architecture | YOLOv8s (fine-tuned) |
| Dataset config | `datasets/roadwise_pothole/dataset.yaml` |
| Dataset source | RDD2022 (pothole-focused subset) |
| Device | Apple MPS (Mac) |
| Total epochs run | 83 |
| Best epoch | 53 |
| Batch size | 8 |
| Image size | 1280 px |
| Checkpoint path | `models/best.pt` (6.06 MB, Oct 21 2026) |
| Training artifacts | `training_artifacts/` (`args.yaml`, `results.csv`, `plots/`) |

### 2.2 Class Mapping

| Class ID | Label | Damage Type |
|---|---|---|
| 0 | D00 | Longitudinal crack |
| 1 | D10 | Transverse crack |
| 2 | D20 | Alligator / fatigue crack |
| 3 | D40 | Pothole |

### 2.3 Validation Metrics (Best Checkpoint — Epoch 53)

| Metric | Value |
|---|---|
| Precision | 66.4% |
| Recall | 61.8% |
| mAP50 | ~67.65% |

> [!NOTE]
> Per-class breakdown for `roadwise_v2` was not separately recorded at the time of training. The aggregate figures are sourced from the project README.

### 2.4 Pre-Fine-Tuning Baseline (Historical Reference)

These metrics reflect the base YOLOv8s model evaluated on the RoadWise dataset **before** fine-tuning. They serve as a lower bound to quantify fine-tuning gains.

| Metric | Pre-Fine-Tuning |
|---|---|
| Precision | 0.418 |
| Recall | 0.395 |
| mAP50 | 0.372 |
| mAP50-95 | 0.159 |

Fine-tuning improved mAP50 from **37.2% → 67.65%** — a gain of ~30.5 percentage points.

---

## 3. Experiment A — 3-Class Crack Detection

### 3.1 Motivation

`roadwise_v2` was trained primarily on a pothole-centric dataset. Experiment A investigates whether a dedicated crack-focused dataset with updated class definitions (excluding D40 potholes) produces better crack detection, particularly for D00 (longitudinal) and D10 (transverse).

### 3.2 Configuration

| Parameter | Value |
|---|---|
| Architecture | YOLOv8s (pretrained `yolov8s.pt`) |
| Dataset sources | McMaster + Attain OS_V1 + WS_V1 + WS_V2 |
| Number of classes | 3 |
| GPU | Google Colab T4 |
| Training duration | ~1.79 hours |
| Epochs configured | 100 |
| Epochs run | 98 (early stopping triggered) |
| Best epoch | 68 |
| Early stopping patience | 30 |
| Batch size | 16 |
| Image size | 640 px |
| Optimizer | AdamW |
| `fliplr` augmentation | 0.0 (disabled — crack orientation is semantically meaningful) |
| Primary checkpoint | Google Drive: `RoadWise_Training/yolov8s_3class_final_run_20261110_212046/weights/best.pt` |
| Versioned backup | Google Drive: `RoadWise_Training/yolov8s_3class_final_run_20261111_091219/` |
| Integration status | **NOT yet integrated into local backend** |

### 3.3 Class Mapping

| Class ID | Label | Damage Type |
|---|---|---|
| 0 | longitudinal_crack | D00 — cracks running parallel to road direction |
| 1 | transverse_crack | D10 — cracks running perpendicular to road direction |
| 2 | alligator_crack | D20 — interconnected / fatigue cracking |

### 3.4 Dataset Split Summary

| Split | Images | Total Boxes | D00 Boxes | D10 Boxes | D20 Boxes |
|---|---|---|---|---|---|
| Train | 3,939 | 7,575 | 2,051 | 1,897 | 3,627 |
| Validation | 513 | 999 | 277 | 316 | 406 |
| Test | 522 | 919 | 240 | 318 | 361 |
| **Total** | **4,974** | **9,493** | **2,568** | **2,531** | **4,394** |

> [!NOTE]
> D20 (alligator crack) is the most abundant class by annotation count, yet it proves the hardest to detect — see [Section 4](#4-d20-error-analysis).

### 3.5 Validation Metrics — Epoch 68 (Best)

> These metrics are from the **validation split** evaluated during training.

#### Overall (All Classes)

| Metric | Value |
|---|---|
| Precision | 0.727 |
| Recall | 0.580 |
| mAP50 | 0.620 |
| mAP50-95 | 0.315 |

#### Per-Class Breakdown

| Class | Precision | Recall | mAP50 | mAP50-95 |
|---|---|---|---|---|
| D00 — Longitudinal crack | 0.716 | 0.726 | 0.777 | 0.383 |
| D10 — Transverse crack | 0.802 | 0.770 | 0.788 | 0.411 |
| D20 — Alligator crack | 0.662 | 0.244 | 0.295 | 0.150 |

**Key observation:** D10 (transverse) is the strongest class. D20 recall on the validation set is only 24.4%, flagging a systematic detection failure that cannot be attributed to class confusion alone.

### 3.6 Held-Out Test Metrics

> These metrics are from the **test split** evaluated **after** training concluded. They represent the unbiased estimate of generalization performance.

#### Overall (All Classes)

| Metric | Value |
|---|---|
| Precision | 0.6061 |
| Recall | 0.5036 |
| mAP50 | 0.5277 |
| mAP50-95 | 0.2695 |

#### Per-Class Breakdown

| Class | Precision | Recall | mAP50 | mAP50-95 |
|---|---|---|---|---|
| D00 — Longitudinal crack | 0.649 | 0.625 | 0.6249 | 0.3057 |
| D10 — Transverse crack | 0.800 | 0.739 | 0.8021 | 0.4248 |
| D20 — Alligator crack | 0.370 | 0.147 | 0.1563 | 0.0779 |

> [!WARNING]
> There is a significant **validation-to-test gap for D20**: mAP50 drops from 0.295 (val) to 0.156 (test), and recall from 24.4% to 14.7%. This indicates the model did not learn generalizable D20 features and partially overfit the validation distribution.

### 3.7 Val vs. Test Gap Summary

| Class | Val mAP50 | Test mAP50 | Drop |
|---|---|---|---|
| D00 | 0.777 | 0.6249 | −15.2 pp |
| D10 | 0.788 | 0.8021 | +1.4 pp ✅ |
| D20 | 0.295 | 0.1563 | **−13.9 pp** ⚠️ |
| Overall | 0.620 | 0.5277 | −9.2 pp |

---

## 4. D20 Error Analysis

This analysis was performed post-training on the held-out test set using the Experiment A checkpoint, run on Google Colab.

**Scope:** 361 D20 ground-truth bounding boxes across 522 test images.

### 4.1 Multi-Threshold Results

The model was evaluated across combinations of confidence thresholds (0.10 / 0.25 / 0.50) and IoU thresholds (0.50 / 0.75) to separate detection failures from localization failures.

| Conf | IoU | TP | FN | FP | Confused→D00 | Confused→D10 | Recall | Precision |
|---|---|---|---|---|---|---|---|---|
| 0.10 | 0.50 | 91 | 270 | 459 | 1 | 2 | 0.252 | 0.166 |
| 0.10 | 0.75 | 36 | 325 | 514 | 1 | 1 | 0.100 | 0.066 |
| 0.25 | 0.50 | 69 | 292 | 179 | 1 | 0 | 0.191 | 0.278 |
| 0.25 | 0.75 | 31 | 330 | 217 | 1 | 0 | 0.086 | 0.125 |
| 0.50 | 0.50 | 46 | 315 | 55 | 1 | 0 | 0.127 | 0.455 |
| 0.50 | 0.75 | 25 | 336 | 76 | 1 | 0 | 0.069 | 0.248 |

**Columns:**
- **TP** — true positives (correctly detected D20 boxes)
- **FN** — false negatives (missed D20 boxes)
- **FP** — false positives (non-D20 boxes incorrectly predicted as D20)
- **Confused→D00/D10** — D20 ground-truth boxes matched to a prediction of a different class

### 4.2 Root Cause Analysis

Root causes are ranked by strength of evidence from the multi-threshold data above.

| Rank | Root Cause | Evidence |
|---|---|---|
| 1 | **Model has not learned D20 features** | Maximum recall across all thresholds is only 25.2% (at conf=0.10, IoU=0.50), meaning even with the most permissive settings, 75% of D20 objects are missed outright |
| 2 | **Poor spatial localization** | TP ratio at IoU=0.75 vs. IoU=0.50 is only ~0.40 (e.g., 36/91 at conf=0.10), meaning many "detections" are poorly placed |
| 3 | **NMS suppression in clustered regions** | 54 test images contain 2–15 D20 boxes in close proximity; standard NMS may suppress valid overlapping detections |
| 4 | **Annotation style inconsistency** | The dataset merges McMaster and Attain annotations, which differ in box tightness and granularity, adding label noise |
| 5 | **Class confusion (minimal)** | Only 1–2 confusion events out of 361 ground-truth D20 boxes across all threshold settings — **this is not the primary problem** |

### 4.3 D20 Geometry Analysis

Understanding the physical scale of D20 annotations helps explain why the model struggles.

| Property | Value |
|---|---|
| Mean bounding-box area | 28,453 px² |
| Std deviation of area | 31,719 px² |
| Aspect ratio (median) | 1.39 (nearly square — bi-directional cracking) |
| Large scale (≥ 96² px) | 74.2% of D20 boxes |
| Medium scale | 25.8% of D20 boxes |
| Small scale (< 32² px) | 0% |

> [!NOTE]
> D20 boxes are predominantly large-scale and have high area variance (σ ≈ 112% of the mean). Despite being large, the model fails to detect them — suggesting the issue is **feature representation**, not object scale. At imgsz=640, 74% of D20 objects are well within the receptive field of YOLOv8's large-object detection head.

---

## 5. Experiment C — 2-Class D00+D20 (Completed)

### 5.1 Motivation

Experiment A showed that D10 (transverse crack) is well-detected (test mAP50 = 0.80) but D20 (alligator crack) is severely underperforming (test mAP50 = 0.156). One hypothesis was that the presence of D10 creates competition in feature space that disadvantages D20 representation. Experiment C tested this by removing D10 entirely.

### 5.2 Configuration

| Parameter | Value |
|---|---|
| Architecture | YOLOv8s (pretrained `yolov8s.pt`) |
| Number of classes | 2 (`0: longitudinal_crack`, `1: alligator_crack`) |
| Epochs | 100 configured; 98 completed |
| Batch size | 16 |
| Image size | 640 px |
| Optimizer | AdamW |
| `fliplr` | 0.0 |
| Early stopping patience | 30 (Best validation at Epoch 54) |
| Hardware / Time | Colab T4 GPU (1.39 hours) |
| Local Checkpoint | `models/experiment_c_best.pt` (107 MB unstripped, verified) |
| Results CSV | `scratch/experiment_c_results.csv` |

### 5.3 Class Mapping

| Class ID | Label | Damage Type |
|---|---|---|
| 0 | longitudinal_crack | D00 |
| 1 | alligator_crack | D20 |

### 5.4 Dataset Split (D10 Images Excluded)

| Split | Images | Total Boxes | D00 Boxes | D20 Boxes |
|---|---|---|---|---|
| Train | 2,918 | 5,678 | 2,051 | 3,627 |
| Validation | 339 | 683 | 277 | 406 |
| Test | 335 | 601 | 240 | 361 |

### 5.5 Official Evaluation Results

**Best Validation Metrics (Epoch 54 on 339 validation images):**
- Precision: **0.6680**
- Recall: **0.5263**
- mAP@50: **0.5554 (55.54%)**
- mAP@50-95: **0.2691**

**Official Held-Out Test Set Metrics (335 test images, 601 ground-truth instances):**

| Class | Precision | Recall | mAP@50 | mAP@50-95 | Status |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Overall (2-Class)** | **0.4489** | **0.4556** | **0.4191** | **0.2043** | Evaluated on held-out test split |
| **D00 (Longitudinal)** | **0.6293** | **0.7333** | **0.6749** | **0.3332** | **Massive Gain (+10.8% R, +5.0% mAP)** |
| **D20 (Alligator)** | **0.2685** | **0.1779** | **0.1633** | **0.0754** | **+21.0% Relative Recall Gain** |

---

## 6. Cross-Experiment Comparison

### 6.1 Head-to-Head: Experiment A vs. Experiment C

| Evaluation Metric | Experiment A (3-Class) | Experiment C (2-Class) | Delta / Change | Interpretation |
|---|:---:|:---:|:---:|---|
| **Classes Evaluated** | D00, D10, D20 | D00, D20 | D10 excluded | Cleaner feature space |
| **Test Set Image Count** | 522 | 335 | −187 | Dedicated test split |
| **D00 Recall** | 0.6250 (62.5%) | **0.7333 (73.3%)** | **+0.1083 (+10.8 pp)** | Dramatic gain without transverse confusion |
| **D00 mAP@50** | 0.6249 (62.5%) | **0.6749 (67.5%)** | **+0.0500 (+5.0 pp)** | Cleaner regression on linear fissures |
| **D20 Recall** | 0.1470 (14.7%) | **0.1779 (17.8%)** | **+0.0309 (+21.0% rel.)** | Positive gain, confirms reduced competition |
| **D20 mAP@50** | 0.1563 (15.6%) | **0.1633 (16.3%)** | **+0.0070 (+0.7 pp)** | Modest precision gain |

### 6.2 Test mAP50 by Class Across All Models

| Class | roadwise_v2 | Experiment A | Experiment C |
|---|---|---|---|
| D00 — Longitudinal crack | — (combined) | 0.6249 | **0.6749** 🏆 |
| D10 — Transverse crack | — (combined) | **0.8021** 🏆 | N/A (excluded) |
| D20 — Alligator crack | — (combined) | 0.1563 | **0.1633** (Recall: 17.8% vs 14.7%) 🏆 |
| D40 — Pothole | ~67.65% (all classes) | N/A | N/A |

### 6.3 Architecture & Training Conditions

| Property | roadwise_v2 | Experiment A | Experiment C |
|---|---|---|---|
| Base model | YOLOv8s | YOLOv8s | YOLOv8s |
| imgsz | 1280 | 640 | 640 |
| Batch | 8 | 16 | 16 |
| Device | Apple MPS | Colab T4 | Colab T4 |
| Dataset | RDD2022 | McMaster + Attain | McMaster + Attain |
| Classes | 4 | 3 | 2 |
| Epochs to best | 53 | 68 | 54 (Total 98) |

---

## 7. Limitations and Caveats

### 7.1 roadwise_v2

- No per-class test-set breakdown was recorded; aggregate mAP50 is sourced from the README.
- Trained at imgsz=1280, which is not directly comparable with Experiment A (imgsz=640).
- Dataset is RDD2022 pothole-centric — crack class distribution may differ from McMaster/Attain.

### 7.2 Experiment A

- **D20 is severely underperforming.** A test mAP50 of 0.156 and recall of 14.7% make D20 detection unreliable for production use.
- Checkpoint is on **Google Drive only**; it has **not been integrated into the local backend**. Any deployment requires manual checkpoint transfer.
- `fliplr=0.0` is correct for cracks (flipping longitudinal ↔ transverse is semantically wrong), but it reduces augmentation diversity.
- The val-to-test drop for D00 (15.2 pp) may indicate mild overfitting or a distribution shift between val and test subsets of the Attain data.
- imgsz=640 may be insufficient for very fine crack texture; `roadwise_v2` used 1280.

### 7.3 Experiment C

- Results are entirely unknown — the experiment has not been run.
- Removing D10 reduces the training set from 3,939 to 2,918 images (−26%), which could hurt overall generalization.
- If D20 recall does not improve, it confirms the problem is in feature representation or annotation quality, not class interference.
- Identical hyperparameters to Experiment A are intentional to isolate the effect of removing D10.

### 7.4 D20 Error Analysis

- The analysis was run on the same test split used for Experiment A evaluation; it is not an independent dataset.
- NMS suppression was not independently controlled — the analysis assumes standard NMS settings from YOLO inference defaults.
- Annotation inconsistency between McMaster and Attain is a qualitative observation and was not formally quantified.

---

## 8. Decision Criteria for Next Steps

After Experiment C completes, use the following criteria to decide the next action.

### 8.1 Experiment C D20 Recall Decision Tree

| D20 Test Recall | Interpretation | Recommended Action |
|---|---|---|
| **> 50%** | Strong improvement — removing D10 meaningfully helped D20 | Proceed with Soft-NMS tuning; experiment with imgsz=800 |
| **30% – 50%** | Moderate improvement — partial class-interference effect | Targeted fixes: data cleaning, focal loss tuning, mosaic augmentation |
| **< 30%** | Minimal improvement — D10 exclusion did not help D20 | Deeper intervention: re-annotate D20, add D20-specific augmentation, or use a separate D20 detector |

### 8.2 D20 Improvement Roadmap (Prioritized)

1. **Run Experiment C** — eliminate class-interference hypothesis first (cheapest test)
2. **Annotation audit** — manually review a sample of D20 FN images to check for labelling errors between McMaster and Attain sources
3. **Soft-NMS** — replace standard NMS with Soft-NMS if recall improvement is confirmed but clustering suppression is suspected
4. **imgsz=800** — increase resolution if localization remains poor after other fixes (TP ratio at IoU=0.75 stays < 0.50)
5. **D20-specific data augmentation** — random crops centred on D20 boxes, contrast jitter for asphalt textures
6. **Separate binary D20 detector** — last resort if multi-class learning consistently fails to represent D20

### 8.3 Integration Decision Criteria

Experiment A (or a successor) should be integrated into the local backend **only when**:

- [ ] All three classes achieve test mAP50 ≥ 0.50
- [ ] D20 test recall ≥ 30% at confidence=0.25, IoU=0.50
- [ ] Checkpoint transferred from Google Drive to `models/` and validated locally
- [ ] `datasets/roadwise_crack/dataset.yaml` created to match the new class mapping
- [ ] Backend inference script updated with the new class-ID-to-label mapping

---

*Document last updated: November 2026. Maintained by the RoadWise ML team.*
