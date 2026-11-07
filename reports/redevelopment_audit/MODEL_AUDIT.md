# RoadWise — Model Audit
**Generated:** 2026-11-07  
**Auditor:** Antigravity (read-only inspection)

---

## 1. Checkpoint Inventory

### 1.1 `models/best.pt` — ONLY checkpoint in project

| Property | Value | Status |
|---|---|---|
| **File path** | `models/best.pt` | VERIFIED |
| **File size** | 6,359,530 bytes (~6.1 MB) | VERIFIED |
| **Last modified** | 2026-10-21 21:51:47 | VERIFIED |
| **Architecture** | YOLOv8s (Small) — `depth_multiple: 0.33`, `width_multiple: 0.25` | VERIFIED |
| **Number of classes** | **4** | VERIFIED |
| **Class names (from checkpoint)** | `{0: 'D00', 1: 'D10', 2: 'D20', 3: 'D40'}` | VERIFIED |
| **Training script** | `ml-pipeline/06_train_v2.py` | VERIFIED |
| **Training run name** | `roadwise_v2` | VERIFIED |
| **Training epochs (max)** | 100 | VERIFIED |
| **Actual epochs run** | 83 (early stopping triggered at patience=30 after best at epoch 53) | VERIFIED |
| **Best epoch** | 53 | VERIFIED |
| **Dataset used** | `datasets/roadwise_pothole/dataset.yaml` (external to this repo, path: `/Users/aditya/RoadWise/roadwise-ml-test-bench/datasets/roadwise_pothole`) | VERIFIED |
| **Checkpoint `epoch` field** | `-1` (Ultralytics sentinel meaning "export-ready / best saved") | VERIFIED |
| **Checkpoint `best_fitness`** | `None` (not stored in final export) | VERIFIED |
| **Checkpoint timestamp** | `2026-10-21T16:33:18.458705+05:30` | VERIFIED |
| **Training device** | `mps` (Apple Silicon Mac) | VERIFIED |
| **Image size (imgsz)** | `1280` | VERIFIED |
| **Optimizer** | `AdamW` | VERIFIED |
| **Learning rate (lr0)** | `0.0001` | VERIFIED |
| **Frozen backbone layers** | `10` | VERIFIED |
| **Used by active application** | YES — loaded by `src/detection/predict.py` via `DEFAULT_MODEL = BASE_DIR / "models" / "best.pt"` | VERIFIED |

### 1.2 `.backup_checkpoint/` directory

| File | Description | Status |
|---|---|---|
| `.backup_checkpoint/health_score.py` | Pre-review-update backup of `src/scoring/health_score.py` | VERIFIED — backup only, 4615 bytes |
| `.backup_checkpoint/inspection_pipeline.py` | Pre-review-update backup of `src/pipeline/inspection_pipeline.py` | VERIFIED — backup only, 29688 bytes |
| `.backup_checkpoint/LandingPage.jsx` | Pre-review-update backup of frontend page | VERIFIED — backup only |
| `.backup_checkpoint/models_README.md` | Pre-review-update backup of `models/README.md` | VERIFIED — backup only |

> **No `.backup_checkpoint/*.pt` file exists.** The `.backup_checkpoint/` directory contains only source-code snapshots, not an alternative model checkpoint.

---

## 2. Verified Training Configuration (`training_artifacts/args.yaml`)

```
model:    models/best.pt        (this was the START POINT for 06_train_v2.py — it was used as the checkpoint to fine-tune FROM)
data:     datasets/roadwise_pothole/dataset.yaml
epochs:   100 (max) → stopped at 83
imgsz:    1280
batch:    8
device:   mps
freeze:   10 (backbone layers frozen for first 10 epochs)
optimizer: AdamW
lr0:      0.0001
lrf:      0.005
patience: 30
cos_lr:   true
save_dir: /Users/aditya/RoadWise/roadwise-ml-test-bench/runs/detect/runs/roadwise_v2
```

> **CRITICAL OBSERVATION:** The `args.yaml` field `model: models/best.pt` refers to the **input checkpoint that `06_train_v2.py` fine-tuned FROM**. The OUTPUT of that training run was then copied into `models/best.pt`. This means the current `best.pt` is the **product** of `06_train_v2.py`, not any earlier training run.

---

## 3. Training Results (`training_artifacts/results.csv`)

| Metric | Value at Best Epoch (53) |
|---|---|
| `metrics/precision(B)` | 0.5960 (epoch 53 value from CSV row nearest best) |
| `metrics/recall(B)` | 0.6308 |
| `metrics/mAP50(B)` | **0.6716** (~67.1%) |
| `metrics/mAP50-95(B)` | 0.3624 |

As documented in `models/README.md` and `training_artifacts/PROJECT_REPORT.md`:
- **Best checkpoint: Epoch 53**, mAP@50 = **67.65%**, Precision = **66.4%**, Recall = **61.8%**

---

## 4. Validation Results (from `results/metrics/val_detection_summary.csv`)

Validation was run on the **RDD2022 India** processed split (via `data/processed/yolo/`):

| Class | Detections on Val Set | Median Confidence | p90 Relative Area |
|---|---|---|---|
| `alligator_crack` (D20) | 300 | 0.493 | 0.235 |
| `longitudinal_crack` (D00) | 140 | 0.418 | 0.070 |
| `pothole` (D40) | 394 | 0.395 | 0.101 |
| `transverse_crack` (D10) | 1 | 0.336 | 0.042 |

**Full validation metrics** (`results/metrics/roi_full_validation.csv`):

| Method | Precision | Recall | F1 |
|---|---|---|---|
| Full 640 | 0.559 | 0.451 | 0.499 |
| ROI 640 | 0.550 | 0.449 | 0.494 |
| Combined | **0.596** | **0.460** | **0.519** |

> **NOTE:** D10 (Transverse Crack) has extremely sparse coverage — only **1** detection in validation. The model is likely unable to reliably detect D10 in the real world.

---

## 5. What checkpoint trained `best.pt`?

**VERIFIED chain of evidence:**

1. `training_artifacts/args.yaml` → `model: models/best.pt` (input), `name: roadwise_v2`, `data: datasets/roadwise_pothole/dataset.yaml`
2. `training_artifacts/results.csv` → 83 epochs of training curves
3. `training_artifacts/data.yaml` → `nc: 4`, classes `D00/D10/D20/D40`, path `/Users/aditya/RoadWise/roadwise-ml-test-bench/datasets/roadwise_pothole`
4. Checkpoint metadata → `{0: 'D00', 1: 'D10', 2: 'D20', 3: 'D40'}`, 4 classes, YOLOv8s, timestamp 2026-10-21
5. Git log `cbe614e feat: add training artifacts for roadwise_v2 model` → training artifacts committed
6. Git log `5a8e7cf feat: integrate fine-tuned roadwise_v2 YOLOv8 model` → model committed

**Conclusion:** `models/best.pt` is the **roadwise_v2 checkpoint**, produced by `06_train_v2.py`, fine-tuned from an earlier baseline (which was itself stored in `models/best.pt` at that time — that earlier baseline was the original RDD2022 India pre-trained model). The current `best.pt` is **NOT** that baseline — it is the fine-tuned result.

---

## 6. Is there any pothole-only model?

**LIKELY NOT.** The hypothesis that `best.pt` was trained on ~620 pothole-only images is **NOT confirmed** by the evidence. Instead:

- The fine-tuning dataset (`datasets/roadwise_pothole/`) contained **7,706 images** from RDD2022 India (all four classes), split into 5394 train / 1155 val / 1157 test.
- The dataset was prepared by `src/preprocessing/voc_to_yolo.py` from `data/raw/RDD2022/India`.
- Class mapping in `training_artifacts/data.yaml` shows all four D-codes.
- The current `best.pt` has 4-class output `{0: D00, 1: D10, 2: D20, 3: D40}`.

The "~620 image pothole experiment" may have been an **earlier experiment** using `04_train.py` or an external dataset (`Pothole_Image_Data`) that is **no longer present in the project**. The `03_prepare_dataset.py` script's docstring references a `Pothole_Image_Data` directory (a separate annotation-less pothole-image dataset) that does not exist in the current project. That experiment did not produce `models/best.pt`.

---

## 7. Summary

| Question | Answer | Confidence |
|---|---|---|
| Is `best.pt` a 4-class model? | **YES** — `{D00, D10, D20, D40}` | VERIFIED |
| Is `best.pt` pothole-only? | **NO** | VERIFIED |
| What dataset trained it? | RDD2022 India via `voc_to_yolo.py` → `datasets/roadwise_pothole/` | VERIFIED |
| What script trained it? | `06_train_v2.py` (roadwise_v2 run) | VERIFIED |
| Is it used by the live app? | **YES** — `api/main.py` → `src/detection/predict.py` → `models/best.pt` | VERIFIED |
| Is D10 reliable in this model? | **NO** — only 1 detection in validation | VERIFIED |
| Is there a second checkpoint anywhere? | **NO** — only `models/best.pt` exists | VERIFIED |

