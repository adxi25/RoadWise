# RoadWise — Model Verification 1: Windows Checkpoint & Training History Audit

**Date:** 2026-11-08  
**Audit Type:** Read-Only Forensic Checkpoint & Lineage Verification  
**Auditor:** RoadWise Senior ML / Backend Engineering Agent  
**Status:** COMPLETE — Verified with Direct Mathematical and Checkpoint Artifact Evidence

---

## 1. Active Checkpoint Identity & Architecture

The active checkpoint loaded by the RoadWise application was inspected directly using Python and the installed Ultralytics runtime.

| Attribute | Verified Value | Inspection Method |
|---|---|---|
| **Absolute Checkpoint Path** | `C:\Users\aquad\OneDrive\Desktop\RoadWise\models\best.pt` | File system resolution |
| **File Size** | **6,359,530 bytes** (~6.06 MB) | `os.stat` |
| **SHA-256 Hash** | `f01701f0dad28b5232fb1a68f9103e579ad956bd8593ae833f9ea2b7165d350f` | Python `hashlib.sha256` |
| **Task** | `detect` (2D Object Detection Bounding Boxes) | Ultralytics `YOLO.task` |
| **Model Class / Architecture** | `DetectionModel` (YOLOv8 Nano backbone & head) | PyTorch `torch.nn.Module` inspect |
| **Backbone Scaling Factors** | `depth_multiple: 0.33`, `width_multiple: 0.25` | `model.yaml` in checkpoint |
| **Total Parameters** | **3,011,628** (~3.01 Million) | PyTorch parameter enumeration |
| **Trainable Parameters** | 0 (Weights deserialized in evaluation mode) | PyTorch parameter inspection |
| **Number of Classes** | **4 Classes** | `len(model.names)` |
| **Exact Class Mapping** | `{0: 'D00', 1: 'D10', 2: 'D20', 3: 'D40'}` | Ultralytics `model.names` |
| **Checkpoint Creation Date** | `2026-10-21T16:33:18.458705+05:30` | Checkpoint internal metadata |
| **Ultralytics Version** | `8.4.183` | Checkpoint internal metadata |
| **Training Run Name** | `roadwise_v2` (Project: `runs`) | Checkpoint `train_args['name']` |
| **Training Device** | `mps` (Apple Silicon Metal Performance Shaders) | Checkpoint `train_args['device']` |

---

## 2. Application Model Path & Loading Flow

The application wiring was traced across `src/detection/predict.py`, `src/pipeline/inspection_pipeline.py`, and `api/main.py`:

1. **`src/detection/predict.py`:**
   - Defines `DEFAULT_MODEL = BASE_DIR / "models" / "best.pt"`.
   - Function `load_model(model_path=DEFAULT_MODEL)` initializes the model via Ultralytics `YOLO(str(model_path))` and caches it in global memory `_model_cache`.
2. **`src/pipeline/inspection_pipeline.py`:**
   - Function `run_inspection(..., model_path=None)` allows passing a custom path. When `model_path is None`, it defaults directly to calling `detect()`, which loads `models/best.pt`.
3. **`api/main.py`:**
   - Defines `MODEL_PATH = BASE_DIR / "models" / "best.pt"`.
   - On startup / health check (`GET /api/health`), explicitly tests `load_model(MODEL_PATH)`.
   - In inspection execution (`POST /api/inspections/inspect`), explicitly passes `model_path=MODEL_PATH` into `run_inspection()`.
4. **Conclusion:** The application **actively and exclusively loads `models/best.pt`**. The path defaults to `models/best.pt` in core logic and is configurable via function arguments.

---

## 3. Available Model Artifacts on the System

A targeted search of `models/`, `runs/`, `ml-pipeline/`, `training_artifacts/`, and external desktop/download locations identified the following artifacts:

| Artifact Path | File Size | SHA-256 Hash | Notes / Architecture |
|---|---|---|---|
| `models/best.pt` (Active) | 6.06 MB | `f01701f0dad28b5232fb1a68f9103e579ad956bd8593ae833f9ea2b7165d350f` | Active 4-class YOLOv8n checkpoint |
| `training_artifacts/args.yaml` | 1,470 B | N/A | Complete hyperparameters for `roadwise_v2` |
| `training_artifacts/results.csv` | 13,873 B | N/A | 83-epoch metrics log (peak at epoch 53) |
| `training_artifacts/data.yaml` | 370 B | N/A | Points to `/Users/aditya/.../roadwise_pothole` |
| `training_artifacts/PROJECT_REPORT.md` | 2,752 B | N/A | Validation summary and early stopping documentation |
| `roadwise files for preparing/best.pt` | 21.48 MB | `846fc6e43c2df303d99d0a9363701eea80fe3eab568efc2a24198eb11d90aedd` | Pre-existing 4-class YOLOv8s (11.1M params) |
| `Downloads/best.pt` | 21.48 MB | `846fc6e43c2df303d99d0a9363701eea80fe3eab568efc2a24198eb11d90aedd` | Exact copy of pre-existing YOLOv8s model |
| `RoadWise.zip:RoadWise/models/best.pt` | 21.48 MB | `846fc6e43c2df303d99d0a9363701eea80fe3eab568efc2a24198eb11d90aedd` | Packaged backup of pre-existing YOLOv8s model |
| `RoadWise_Complete_Handoff_Package...` | 21.48 MB | `846fc6e43c2df303d99d0a9363701eea80fe3eab568efc2a24198eb11d90aedd` | Packaged backup of pre-existing YOLOv8s model |

---

## 4. SHA-256 Checkpoint Identity Comparisons

Comparing hashes against the user's historical reference values:

### Comparison 1: Previously Recorded MacBook v2 Checkpoint
- **Historical Reference:** `f01701f0dad28b5232fb1a68f9103e579ad956bd8593ae833f9ea2b7165d350f`
- **Active Windows Model (`models/best.pt`):** `f01701f0dad28b5232fb1a68f9103e579ad956bd8593ae833f9ea2b7165d350f`
- **Verdict:** **EXACT 100% BYTE-IDENTICAL MATCH.** The active Windows model is indisputably the model checkpoint produced by the MacBook `roadwise_v2` training run.

### Comparison 2: Original Baseline Reference
- **Historical Reference:** `ab88f4914b527b54d6a7d0feffd307b49091ea8dd1f4bd2f28e1531b65e33195`
- **Active Windows Model (`models/best.pt`):** `f01701f0dad28b5232fb1a68f9103e579ad956bd8593ae833f9ea2b7165d350f`
- **Verdict:** **MISMATCH.** The active model is not the baseline checkpoint.
- **Physical Availability on Machine:** A recursive hash search across the entire project, `Downloads`, `Desktop`, and all `.zip` archives confirmed that **no file with SHA-256 `ab88f491...` is physically present on this Windows system**.

---

## 5. Rigorous Lineage & Training History Verification

Per audit instructions, we distinguish three separate technical entities:

### 1. Training Initialization Checkpoint: `UNKNOWN`
- **Artifact Evidence:**
  - `training_artifacts/args.yaml` and `ckpt['train_args']['model']` record: `model: models/best.pt`.
  - Script `ml-pipeline/06_train_v2.py` specifies: `parser.add_argument("--baseline_model", default="models/best.pt")` and invokes `model = YOLO(str(baseline))`.
- **Limitation:** The exact file that sat at `models/best.pt` on the MacBook at the moment training was initiated is not recorded by hash. 
- **Architectural Discrepancy:** The pre-existing baseline preserved in all Windows handoff packages (`846fc6e...`) is an **11.1M parameter YOLOv8s** architecture. In contrast, the fine-tuned checkpoint (`f01701f0...`) is a **3.01M parameter YOLOv8n** architecture. Ultralytics cannot transfer weights between different backbone widths (`0.50` vs `0.25`) without dimension mismatch.
- **Verdict:** Because the pre-training checkpoint file is not present on this machine and cannot be proven from metadata alone, its exact identity and lineage from `ab88f491...` is **UNKNOWN**.

### 2. Pseudo-Label Generation Model: `UNKNOWN`
- **Artifact Evidence:**
  - `ml-pipeline/03_prepare_dataset.py` contains: `parser.add_argument("--pseudo_label_model", default=None)`.
  - `training_artifacts/PROJECT_REPORT.md` states: *"The dataset was preprocessed and split using `ml-pipeline/03_prepare_dataset.py`"*.
  - `training_artifacts/data.yaml` states: *"# RoadWise fine-tune dataset — generated by 03_prepare_dataset.py"*.
- **Limitation:** While documentation confirms that a baseline model was used at `conf=0.30` to generate pseudo-labels for the pothole collection on the MacBook, the specific checkpoint file and hash passed to `--pseudo_label_model` was not logged in the committed artifacts.
- **Verdict:** The pseudo-label generator model's exact hash is **UNKNOWN**.

### 3. Final Checkpoint Produced by Training: `VERIFIED`
- The final weights produced by the 83-epoch training run on the MacBook were exported as `best.pt` (`f01701f0dad28b5232fb1a68f9103e579ad956bd8593ae833f9ea2b7165d350f`) and placed in `models/best.pt`.

---

## 6. Model Compatibility with RoadWise Application & Scoring

The class names and IDs of `models/best.pt` were compared against the complete RoadWise runtime stack:

```
+---------------------------------------------------------------------------------------------------+
| PIPELINE COMPATIBILITY FLOW                                                                       |
+---------------------------------------------------------------------------------------------------+
| YOLO Checkpoint Output:        {0: 'D00', 1: 'D10', 2: 'D20', 3: 'D40'}                           |
|                                         ↓                                                         |
| predict.py: CLASS_CODE:        {'D00': 'D00', 'D10': 'D10', 'D20': 'D20', 'D40': 'D40'}           |
| predict.py: CLASS_LABEL:       {'D00': 'Longitudinal Crack', ..., 'D40': 'Pothole'}               |
|                                         ↓                                                         |
| health_score.py: CLASS_WEIGHT: {'D40': 1.00, 'D20': 0.80, 'D00': 0.50, 'D10': 0.50}              |
| health_score.py: AREA_REF:     {'D40': 0.101, 'D20': 0.235, 'D00': 0.070, 'D10': 0.070}          |
|                                         ↓                                                         |
| database.py: TABLE detections: (class_code TEXT, class_name TEXT, confidence REAL, ...)           |
+---------------------------------------------------------------------------------------------------+
```

### Compatibility Findings:
1. **Model Output Alignment:** The model outputs standard RDD codes (`D00`, `D10`, `D20`, `D40`).
2. **Backward Compatibility:** `src/detection/predict.py` contains dual mappings for both legacy English labels (`pothole`, `alligator_crack`) and standard D-codes.
3. **Scoring Engine Alignment:** `health_score.py` and `risk_score.py` look up defect severities strictly using keys `"D00"`, `"D10"`, `"D20"`, `"D40"`. Every key is present and mathematically evaluated.
4. **Database Alignment:** SQLite `detections` table records `class_code` and `class_name` matching the model outputs.
5. **Verdict:** **100% COMPATIBLE.** Zero semantic mismatches, zero fallback drops, and zero indexing errors exist in the execution chain.

---

## 7. What Remains Unknown

1. **Original Baseline Checkpoint:** The physical file corresponding to SHA-256 `ab88f491...` is not on this machine.
2. **Initial Weights for `roadwise_v2`:** Whether `roadwise_v2` was initialized from an earlier 4-class YOLOv8n checkpoint or fine-tuned from a public YOLOv8n base with a new 4-class head cannot be proven without access to the MacBook's local history.
3. **Exact Pseudo-Label Generation Model:** Which checkpoint generated the candidate labels on the MacBook is unrecorded by hash.

---

## 8. Recommended Checkpoint Preservation

1. **Active Production Checkpoint (`models/best.pt`):**
   - **SHA-256:** `f01701f0dad28b5232fb1a68f9103e579ad956bd8593ae833f9ea2b7165d350f`
   - **Status:** **PRESERVE AS ACTIVE MODEL.** It is fully compatible with all frontend, backend, scoring, and database modules. It detects all 4 RoadWise classes.
2. **Archived Baseline Reference (`roadwise files for preparing/best.pt`):**
   - **SHA-256:** `846fc6e43c2df303d99d0a9363701eea80fe3eab568efc2a24198eb11d90aedd`
   - **Status:** **PRESERVE IN BACKUPS AS REFERENCE.** This 11.1M parameter model represents the pre-MacBook baseline trained on the RDD2022 India dataset with English class names.

---

## 9. Evidence-Based Verdict Summary

| Investigation Question | Definitive Answer | Supporting Evidence |
|---|---|---|
| **What does the current Windows model detect?** | **All 4 RoadWise road damage classes** | `m.names`: `{0: 'D00', 1: 'D10', 2: 'D20', 3: 'D40'}` |
| **Is it a four-class or one-class detector?** | **Strictly a FOUR-CLASS detector** | 4 output nodes in `DetectionModel` head; detected 4 classes in validation plots |
| **Does its class mapping match RoadWise?** | **YES (100% Match)** | D00=Longitudinal, D10=Transverse, D20=Alligator, D40=Pothole |
| **Is initialization from original baseline proven?** | **NO (`UNKNOWN`)** | Initialization hash not recorded; architecture (Nano 3.0M) differs from known Small baseline (11.1M) |
| **Does it match known MacBook v2 checkpoint?** | **YES (Exact Match)** | SHA-256 matches `f01701f0...` byte-for-byte; internal metadata confirms `mps` device & `roadwise_v2` |
| **Which checkpoint should remain preserved?** | `models/best.pt` (`f01701f0...`) as active; `846fc6e...` in backups as historical reference | Fully functional production weights matching scoring architecture |

