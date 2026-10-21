# RoadWise ML Model Training & Validation Report

## 1. Executive Summary & Observations Addressed

### Q1: Why does `args.yaml` say `epochs: 100` while `results.csv` has 83 rows?
- **Root Cause**: **Early Stopping Mechanism**.
- In `args.yaml`, `epochs: 100` is the maximum epoch ceiling, and `patience: 30` is the early stopping threshold.
- The model reached its peak performance at **Epoch 53** (validation mAP@50 = **67.65%**, Precision = **66.4%**, Recall = **61.8%**).
- Ultralytics YOLOv8 monitored validation metrics for 30 consecutive epochs without sufficient improvement (53 + 30 = 83).
- At Epoch 83, early stopping halted training automatically to prevent overfitting. The weights from the best checkpoint (Epoch 53) were saved as `models/best.pt`.

### Q2: Dataset Generation and Config (`03_prepare_dataset.py`)
- The dataset was preprocessed and split using `ml-pipeline/03_prepare_dataset.py`.
- It created train, val, and test splits with annotations mapped to the 4 road damage classes:
  - `D00`: Longitudinal Crack
  - `D10`: Transverse Crack
  - `D20`: Alligator Crack
  - `D40`: Pothole
- The dataset configuration is provided in `ml-pipeline/dataset.yaml` and `training_artifacts/data.yaml`.

### Q3: ML Pipeline Scripts
The end-to-end pipeline scripts are located in `ml-pipeline/`:
- `01_dataset_audit.py`: Validates image formats, dimensions, label syntax, and duplicate checks.
- `02_baseline_inference.py`: Evaluates pre-trained baseline model benchmarks.
- `03_prepare_dataset.py`: Organizes dataset into train/val/test splits with pseudo-label support.
- `04_train.py`: Initial fine-tuning script.
- `05_evaluate.py`: Generates comparative metrics and evaluation reports.
- `06_train_v2.py`: Second-generation fine-tuning script with high-resolution input (`imgsz=1280`), AdamW optimizer, layer freezing (`freeze=10`), and tuned augmentations.

---

## 2. Performance Metrics & Curves

The visual training outputs are stored in `training_artifacts/plots/`:
- **Confusion Matrix**: `training_artifacts/plots/confusion_matrix.png` & `confusion_matrix_normalized.png`
- **Precision-Recall Curve**: `training_artifacts/plots/BoxPR_curve.png`
- **F1 Score Curve**: `training_artifacts/plots/BoxF1_curve.png`
- **Precision / Recall Curves**: `training_artifacts/plots/BoxP_curve.png`, `training_artifacts/plots/BoxR_curve.png`
- **Training Progression**: `training_artifacts/plots/results.png`
- **Validation Batches (Predictions vs Ground Truth)**:
  - `val_batch0_labels.jpg` vs `val_batch0_pred.jpg`
  - `val_batch1_labels.jpg` vs `val_batch1_pred.jpg`
  - `val_batch2_labels.jpg` vs `val_batch2_pred.jpg`

---

## 3. Automated Tests

Backend API and inference tests are located in `tests/test_backend.py`.
To run tests:
```bash
pytest tests/test_backend.py -v
```

---

## 4. Key Hyperparameters (`training_artifacts/args.yaml`)

| Parameter | Value | Description |
|---|---|---|
| Model Architecture | `yolov8s.pt` | YOLOv8 Small backbone |
| Image Size (`imgsz`) | `1280` | High-resolution input for crack & pothole detail |
| Optimizer | `AdamW` | Decoupled weight decay optimizer |
| Learning Rate (`lr0`) | `0.0001` | Fine-tuning base learning rate |
| Weight Decay | `0.0005` | L2 regularization |
| Freeze Layers | `10` | First 10 backbone layers frozen |
| Patience | `30` | Early stopping trigger |
| Batch Size | `8` | Training batch size |
