# RoadWise — Experiment A Training Plan & Colab Execution Report

**Date:** 2026-11-11  
**Experiment:** Experiment A (3-Class Crack Detection: D00, D10, D20)  
**Model Architecture:** YOLOv8s (`yolov8s.pt` pretrained baseline)  
**Execution Environment:** Google Colab (Tesla T4 GPU, CUDA 12.x)  
**Status:** READY FOR EXECUTION ON GOOGLE COLAB  

---

## 1. Executive Summary

Dataset clearance has been officially finalized with zero integrity defects across 4,974 images in `crack_experiment_a_3class`. The training pipeline is fully configured to execute 100-epoch training on Google Colab with GPU acceleration.

All training assets have been generated, packaged, and verified:
1. **Self-Contained Training Notebook:** [`notebooks/RoadWise_Experiment_A_Training.ipynb`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/notebooks/RoadWise_Experiment_A_Training.ipynb)
2. **Packaged Dataset Archive:** [`data/processed/crack_experiment_a_3class.zip`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/data/processed/crack_experiment_a_3class.zip) (255.97 MB)
3. **Audit Verification Report:** [`reports/dataset_audit/FINAL_PRODUCTION_DATASET_VERIFICATION_REPORT.md`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/reports/dataset_audit/FINAL_PRODUCTION_DATASET_VERIFICATION_REPORT.md)

---

## 2. Dataset Composition (Experiment A)

The dataset resolves the previously identified D20 test imbalance by incorporating the 141 recovered Attain WS_V2.0 images (54 Train, 55 Test, 6 Guard 2, 26 Benchmark).

| Split | Images | Labels | D00 (Longitudinal) | D10 (Transverse) | D20 (Alligator) | Total Bounding Boxes |
|:---|---:|---:|---:|---:|---:|---:|
| **Train** | 3,939 | 3,939 | 2,051 | 1,897 | 3,627 | 7,575 |
| **Validation** | 513 | 513 | 277 | 316 | 406 | 999 |
| **Test (Held-Out)** | 522 | 522 | 240 | 318 | 361 | 919 |
| **Total** | **4,974** | **4,974** | **2,568** | **2,531** | **4,394** | **9,493** |

*Key Split Characteristics:*
- **Train Split (3,939 images):** McMaster (3,055) + Attain OS_V1.0 (155) + Attain WS_V1.0 (342) + Attain WS_V2.0 (387).
- **Validation Split (513 images):** 100% byte-identical preservation against pre-rebuild baseline (McMaster 429, Attain WS_V1.0 42, Attain WS_V2.0 42).
- **Test Split (522 images):** Provides balanced representation across all three classes (D00: 240, D10: 318, D20: 361).
- **Isolated Benchmarks:** Held-out WS_V2.0 post-803 frames (26 images, 102 boxes) and RDD2022 India benchmarks remain strictly outside this training run.

---

## 3. Training Configuration & Hyperparameters

| Parameter | Specification | Rational / Constraint |
|:---|:---|:---|
| **Base Architecture** | YOLOv8s (`yolov8s.pt`) | Standard production model matching deployment target |
| **Input Resolution** | $640 \times 640$ pixels (`imgsz=640`) | Native YOLO detection resolution |
| **Epochs** | 100 | Sufficient convergence for road distress detection |
| **Batch Size** | 16 | Optimal throughput for Tesla T4 (16 GB VRAM) |
| **Horizontal Flip Augmentation** | `fliplr=0.0` | **Mandatory:** McMaster dataset already includes curated flipped pairs; enabling `fliplr` would distort sequence orientations |
| **Device** | `0` (CUDA GPU) | Tesla T4 runtime |
| **Early Stopping** | `patience=30` | Prevents overfitting while allowing plateau recovery |
| **Checkpoint Cadence** | `save_period=10` | Checkpoint saved every 10 epochs |
| **Validation Cadence** | `val=True` | Evaluates on validation split every epoch |
| **Workers** | 4 | Parallel dataloading on Colab VM |

---

## 4. Google Colab Execution Instructions

To execute Experiment A training with GPU acceleration on Google Colab:

### Step 1: Open Notebook in Google Colab
1. Navigate to [Google Colab](https://colab.research.google.com/).
2. Click **Upload** and select `notebooks/RoadWise_Experiment_A_Training.ipynb` from this repository.
3. In Colab, verify the runtime type:
   - Click **Runtime** $\rightarrow$ **Change runtime type**.
   - Hardware accelerator: **T4 GPU**.
   - Click **Save**.

### Step 2: Upload Dataset Archive
Either:
- **Option A (Google Drive - Recommended):** Upload `data/processed/crack_experiment_a_3class.zip` to your Google Drive under `MyDrive/` or `MyDrive/RoadWise_Training/`.
- **Option B (Direct Colab Upload):** Drag and drop `data/processed/crack_experiment_a_3class.zip` directly into the `/content/` directory via the left-hand Colab file browser.

### Step 3: Run the Cells Sequentially
The notebook contains 8 automated steps:
1. **Hardware Verification:** Verifies GPU availability (`torch.cuda.is_available()`) and CUDA version.
2. **Dependency Installation:** Installs Ultralytics, PyYAML, and Pillow.
3. **Mount Google Drive & Strict Versioned Destination:** Mounts `/content/drive` and initializes a non-destructive versioned directory (`yolov8s_3class_final_run_YYYYMMDD_HHMMSS`) persisted in `/content/roadwise_run_destination.txt`. Fallback to any unversioned directory is strictly prohibited; the notebook fails fast with a clear error if the destination is unavailable.
4. **Fast Local Unpacking:** Unpacks `crack_experiment_a_3class.zip` into `/content/crack_experiment_a_3class` for high-speed NVMe I/O during training.
5. **Integrity Check & Colab YAML Generation:** Asserts exact image counts (`Train=3939`, `Val=513`, `Test=522`) and creates `/content/crack_experiment_a_3class/data_colab.yaml`.
6. **Execute Model Training with Atomic Periodic Backup:** Starts a lightweight background daemon thread that periodically mirrors checkpoints (`weights/last.pt`, `weights/best.pt`, `epoch*.pt`) and metrics (`results.csv`, plots) directly to Google Drive every 60s using safe atomic writes (temporary write + `os.replace`) to prevent partially written files. Upon training completion, `stop_and_wait()` blocks execution until the thread terminates and the final sync is physically verified. Test evaluation is strictly gated on this verification.
7. **Held-Out Test Evaluation:** Automatically runs evaluation on the 522 test images using `split='test'` and reports overall and per-class mAP@50 and mAP@50-95.
8. **Non-Destructive Final Sync & Audit:** Automatically synchronizes all final training and test evaluation artifacts to the exact same versioned run directory, audits all preserved files, and verifies physical presence of `weights/best.pt` and `weights/last.pt`.

---

## 5. Post-Training Evaluation & Metric Targets

Upon completion of training, the model will be evaluated on the held-out test split (522 images). Expected metrics will be recorded against the historical baseline:

### Evaluation Metric Table Template

| Class | Historical Baseline mAP@50 | Experiment A Target mAP@50 | Historical Baseline mAP@50-95 | Experiment A Target mAP@50-95 |
|:---|:---:|:---:|:---:|:---:|
| **Overall (All Classes)** | 0.582 | $\ge$ 0.620 | 0.345 | $\ge$ 0.380 |
| **D00 (Longitudinal)** | 0.624 | $\ge$ 0.640 | 0.380 | $\ge$ 0.400 |
| **D10 (Transverse)** | 0.571 | $\ge$ 0.600 | 0.330 | $\ge$ 0.360 |
| **D20 (Alligator)** | 0.551 | $\ge$ 0.620 | 0.325 | $\ge$ 0.380 |

*Expected D20 Improvement:* The addition of 55 high-resolution Attain WS_V2.0 test images and 54 training images with accurate bounding-box dimensions directly corrects the prior D20 recall deficit.

---

## 6. Output Artifacts & Checkpoint Storage

Checkpoints and logs will be organized in Google Drive as follows:
```text
/MyDrive/RoadWise_Training/yolov8s_3class_final_run_YYYYMMDD_HHMMSS/
├── weights/
│   ├── best.pt              # Best model checkpoint by validation mAP@50-95
│   ├── last.pt              # Periodic & final epoch 100 checkpoint (continuously synced)
│   └── epoch10.pt, ...      # Periodic checkpoints every 10 epochs
├── results.csv              # Real-time epoch-by-epoch loss, precision, recall, mAP logs
├── results.png              # Multi-panel training loss and metric trajectories
├── confusion_matrix.png     # Validation confusion matrix
├── confusion_matrix_normalized.png
├── F1_curve.png
├── PR_curve.png
└── P_curve.png
```

To sync the trained checkpoint back to your local repository after training:
1. Download `best.pt` from Google Drive.
2. Save to `models/experiment_a_yolov8s_best.pt`.
3. Update production inference configurations.

