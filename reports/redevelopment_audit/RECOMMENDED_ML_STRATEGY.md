# RoadWise — Recommended ML Strategy
**Generated:** 2026-11-07  
**Auditor:** Antigravity (read-only recommendation)

---

## 1. Current State Summary

| Fact | Evidence |
|---|---|
| `models/best.pt` is a 4-class YOLOv8s fine-tuned on RDD2022 India | Checkpoint metadata, `training_artifacts/data.yaml` |
| Training: 83 epochs (best at epoch 53), mAP@50 ≈ 67.65% | `training_artifacts/results.csv`, `models/README.md` |
| D10 (Transverse Crack) has only 1 detection in validation — effectively absent | `results/metrics/val_detection_summary.csv` |
| D40 dominates the dataset (3,187 / 6,831 total instances = 46.6%) | `results/metrics/yolo_split_summary.json` |
| D00 (1,555), D20 (2,021) have moderate representation | Same |
| Imbalance ratio: 46.87× (D40 vs D10) | `results/metrics/eda_summary_India.json` |
| Full-frame validation: Precision 0.56, Recall 0.45, F1 0.50 | `results/metrics/roi_full_validation.csv` |
| Application expects 4 classes, handles gracefully if fewer are detected | Code audit |
| External pothole-only dataset (~620 images) is **not present** | File audit |

---

## 2. Option A — Train One Four-Class Model from Scratch / Fine-Tune

**Description:** Use the existing RDD2022 India data (or augmented data) to train a fresh four-class YOLOv8 model that reliably detects all four damage types.

### Pros
- Single model, single inference call, low deployment complexity.
- Consistent class probabilities and confidence scores.
- The existing pipeline (`predict.py`, `health_score.py`) already handles all four classes.
- RDD2022 India is already downloaded, converted to YOLO format, and split.

### Cons
- **D10 is severely underrepresented (68 instances).** Training on this data again will produce the same D10 failure unless new D10 data is sourced.
- mAP@50 at 67% is moderate for a production system — the main bottleneck is dataset quality, not architecture.
- Fine-tuning from the current checkpoint risks overfitting to RDD2022 India's visual domain.

### Assessment
Viable **only if** additional D10 data is sourced (from other RDD2022 countries or public crack datasets). Without that, re-training produces a structurally similar model with the same D10 gap.

---

## 3. Option B — Two-Model Ensemble (Crack Model + Pothole Model)

**Description:** Train a 3-class crack detector (D00/D10/D20) on crack-focused datasets and retain (or further fine-tune) the existing model for D40 potholes. Merge predictions at inference time.

### Pros
- Could use separate, better-balanced crack datasets (e.g., CrackForest, CRACK500, DeepCrack) for the crack sub-model.
- Allows independent model updates without coupling all classes.
- Could improve D10 specifically if crack-focused training data is obtained.

### Cons
- **Double inference cost** — two YOLO calls per image.
- Requires a prediction-merging layer (NMS across both models' outputs, handling IoU overlap).
- More complex deployment: two checkpoints to manage, load, and version.
- Risk of **conflicting detections** (a crack predicted as D00 by model A and D20 by model B).
- Class confidence scales may differ between models, breaking `health_score.py`'s calibrated weights.
- The existing application is built for a single-model pipeline. Refactoring `predict.py` and `health_score.py` would be required.

### Assessment
Over-engineered for the current project scope. Would introduce real infrastructure complexity without a proven dataset advantage. Only justified if a high-quality dedicated crack dataset is confirmed available.

---

## 4. Option C — Fine-Tune the Existing Four-Class Checkpoint

**Description:** Use `models/best.pt` as the starting point and fine-tune it on augmented or supplemented data, targeting D10 improvement.

### Pros
- The backbone has already learned road-surface feature representations from RDD2022 India.
- Fine-tuning is faster than training from scratch.
- Risk of catastrophic forgetting for D40/D20/D00 is managed by keeping learning rate low and freezing early backbone layers (already done in `06_train_v2.py`).
- Scripts `04_train.py` and `06_train_v2.py` are already written for this workflow.
- Architecture (YOLOv8s) is already deployed; no pipeline changes needed.

### Cons
- **Without new D10 data, fine-tuning will not fix the D10 problem** — it will simply reinforce the existing class distribution bias.
- `best.pt` already represents the best achievable result on the current dataset after 83 epochs; there is diminishing return from more epochs on the same data.

### Assessment
**Best option IF** combined with new training data for D10. Specifically:
- Source D10-rich images from **other RDD2022 country splits** (Czech Republic, Germany, Norway, United States — these have different crack-type distributions).
- Or use a public crack dataset with transverse-crack annotations.
- Then fine-tune `best.pt` with the augmented dataset at a low learning rate.

---

## 5. Recommendation

> **Recommended Strategy: Option A / Option C combined — Fine-tune the existing checkpoint with augmented four-class data.**

### Rationale

| Factor | Weight | Assessment |
|---|---|---|
| Class compatibility | HIGH | Current 4-class head is correctly structured; no remapping needed |
| Dataset quality (current) | MEDIUM | RDD2022 India is clean but D10-deficient |
| Dataset sufficiency (current) | LOW for D10 | 68 D10 instances is insufficient for a reliable detector |
| Model performance (current) | MEDIUM | 67% mAP@50 is acceptable; D10 is the main gap |
| Inference latency | GOOD | Single model, YOLOv8s is fast |
| Deployment complexity | LOW | Existing pipeline unchanged |
| Risk of catastrophic forgetting | MANAGEABLE | Use freeze=10, lr0=0.0001, as in `06_train_v2.py` |

### Recommended Approach

1. **Source additional D10 data** from other RDD2022 country datasets (Czech Republic or Japan have higher D10 representation) OR use the full RDD2022 multi-country dataset.
2. **Re-run `src/preprocessing/voc_to_yolo.py`** on the extended dataset to create a new YOLO split.
3. **Verify class balance** in the new split — target at least 500 D10 instances.
4. **Fine-tune `models/best.pt`** using `ml-pipeline/06_train_v2.py` with:
   - Frozen backbone for first 10 epochs (`freeze=10`)
   - Low initial learning rate (`lr0=0.0001`)
   - `cls` loss weight raised (`cls=1.0`) to push harder on class differentiation
   - Longer patience (`patience=40`) since improvement on D10 may be slow
5. **Evaluate** on the new val split using `ml-pipeline/05_evaluate.py`.
6. **Gate deployment** on D10 validation metrics — accept only if D10 precision ≥ 0.4.

---

## 6. What NOT to Do

| Action | Reason |
|---|---|
| Do NOT use the ~620-image pothole dataset alone for training | It is unavailable; and even if found, it would only reinforce D40 at the expense of other classes |
| Do NOT train a pothole-only model and deploy it as 4-class | The application UI claims 4-class detection; a D40-only model would silently miss cracks |
| Do NOT remove D10 from the class head | The scoring formula has D10 as a registered class; removing it requires coordinated changes across health_score.py, predict.py, and the frontend |
| Do NOT adopt Option B (dual model) | Unjustified complexity without a confirmed crack-specific dataset |

---

## 7. Priority Order of Next ML Actions

1. **[Audit]** Run this audit (DONE).
2. **[Data]** Check which other RDD2022 countries are available or downloadable. Specifically check Czech, Norway, Japan for D10 richness.
3. **[Data]** Re-run `src/preprocessing/voc_to_yolo.py` on the multi-country union dataset.
4. **[Verify]** Run `ml-pipeline/01_dataset_audit.py` on the new split to check for corrupt images and label errors.
5. **[Train]** Run `ml-pipeline/06_train_v2.py` with updated dataset path and adjusted hyperparameters.
6. **[Evaluate]** Run `ml-pipeline/05_evaluate.py` comparing new checkpoint vs current `best.pt`.
7. **[Deploy]** Only replace `models/best.pt` if the new model is verified better on D10 without regression on D40/D20/D00.
8. **[Git]** Commit the uncommitted changes and new audit reports before training begins.

