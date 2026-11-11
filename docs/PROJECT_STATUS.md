# RoadWise — Project Status
**Last Updated:** 2026-11-12  
**Maintained by:** Keep this file updated after every major task.

---

## A. Overall Project Status

| Field | Value |
|---|---|
| **Stage** | Production-Ready Dual-Model System — backend, frontend, scoring, database, and unified dual-inference fully operational. |
| **Working right now** | Mode 1 inspection, Mode 2 dashboard, scoring, map, database — all functional using Dual-Model inference (`models/pothole_best.pt` + `models/experiment_c_best.pt`). |
| **Current focus** | End-to-end user testing & viva defense readiness. |

---

## B. Completed Tasks

### Dataset Preparation ✅
- VOC→YOLO annotation converter written (`src/preprocessing/annotation_converter.py`)
- 17/17 unit tests passing (`tests/test_annotation_converter.py`)
- Hardcoded 640×640 conversion bug fixed — actual image dimensions used via PIL
- Experiment A dataset compiled: **4,974 images, 9,493 bounding boxes** (3 classes: D00/D10/D20)
- Experiment C dataset compiled: **3,592 images, 6,962 bounding boxes** (2 classes: D00/D20)
- Raw pothole dataset audited and confirmed: **618 images, 610 unique scenes** (`data/raw/pothole_image_data/Pothole_Image_Data/`)
- Both datasets archived as ZIP files (`data/processed/`)
- Benchmark isolation: 26 WS_V2.0 images isolated in `data/processed/benchmarks/`
- 45 guard interval images excluded from all splits

### ML Experiments & Training ✅
- **Experiment A** (3-class YOLOv8s): Trained on Google Colab T4, 98 epochs, test mAP50=52.77%
- **D20 error analysis**: Colab notebook run on Experiment A checkpoint; multi-threshold TP/FN/FP error analysis completed
- **Experiment C** (2-class YOLOv8s: D00 + D20):
  - Trained on Google Colab T4 (98 epochs, 1.39 hours, best val mAP50=55.54% at epoch 54)
  - Evaluated on 335 held-out test images: **D00 recall surged to 73.33% (+10.8% absolute gain vs Exp A)**, D20 recall rose to 17.79% (+21% relative gain)
  - Checkpoint downloaded and deployed locally as `models/experiment_c_best.pt` (107 MB)

### Dual-Model Architecture & Integration ✅
- **Dual-Model Inference** implemented in `src/detection/predict.py`:
  - Pothole Specialist (`models/pothole_best.pt`) handles D40 potholes
  - Crack Specialist (`models/experiment_c_best.pt`) handles D00 Linear & D20 Alligator cracks
  - Unified multi-color bounding box annotation rendered via OpenCV (Red: Pothole, Orange: Alligator, Cyan: Linear)
- **API Health Check**: Updated `api/main.py`'s `health_check()` endpoint to verify dual-model availability and diagnostics
- **Offline Reliability**: Environment variables configured to prevent Ultralytics telemetry blocking in isolated environments

### Backend & Scoring ✅
- FastAPI with 5 endpoints: `GET /api/health`, `POST /api/inspections/inspect`, `GET /api/inspections`, `GET /api/inspections/{id}`, `GET /api/dashboard/stats`
- Condition score: exponential decay `100 * exp(-damage_load / 2.0)` with overlap discounting
- Risk score: multiplicative model `damage_level * context_multiplier`
- Unit testing: **31/31 automated tests passing** across `tests/test_annotation_converter.py`, `tests/test_roadwise_pipeline.py`, and `tests/test_scoring.py`

### Documentation ✅
- `docs/PROJECT_STATUS.md` — project status and external artifacts
- `docs/CODEBASE_MAP.md` — file-by-file implementation map
- `docs/SYSTEM_ARCHITECTURE.md` — full architecture with diagrams
- `docs/MODEL_EXPERIMENTS.md` — complete ML experiment history
- `docs/SCORING_METHODOLOGY.md` — formulas, examples, methodology
- `docs/VIVA_CODE_GUIDE.md` — faculty viva preparation guide with key defenses

---

## C. Pending & Follow-up Tasks

### Optional Enhancements
- [ ] Export inspection reports (PDF format)
- [ ] Clean-road negative evaluation (measure false positive rate on pristine roads)
- [ ] Frontend cosmetic badge alignment for dual-model tags

---

## E. Machine Learning Experiment Status

### Existing Production Model — `models/best.pt` (roadwise_v2)
| Field | Value |
|---|---|
| Architecture | YOLOv8s fine-tuned |
| Training data | `datasets/roadwise_pothole/dataset.yaml` (pothole-focused) |
| Device | Apple MPS (Mac) |
| Epochs | 83 (best at epoch 53) |
| Classes | D00 / D10 / D20 / D40 (4-class) |
| Val mAP50 | ~67.65% (from README) |
| Test metrics | Not independently verified |
| Checkpoint | `models/best.pt` (local, 6.06 MB) |
| Status | **Active in production — but older, pothole-biased model** |

### Experiment A — 3-Class Crack YOLOv8s
| Field | Value |
|---|---|
| Classes | D00 (Longitudinal), D10 (Transverse), D20 (Alligator) |
| Train/Val/Test | 3,939 / 513 / 522 images |
| Epochs | 100 configured; stopped at 98; best at epoch 68 |
| GPU | Google Colab T4 |
| Val mAP50 | 62.0% overall (D00=77.7%, D10=78.8%, D20=29.5%) |
| Test mAP50 | 52.77% overall (D00=62.49%, D10=80.21%, D20=15.63%) |
| Test D20 Recall | **14.7%** — major weakness |
| Checkpoint | Google Drive: `RoadWise_Training/yolov8s_3class_final_run_20261110_212046/weights/best.pt` |
| Local copy | **NOT PRESENT** in `models/` |
| Status | Complete; not yet integrated into production backend |

### Experiment A — D20 Error Analysis
| Conf | IoU | TP | FN | FP | Recall | Precision |
|---|---|---|---|---|---|---|
| 0.10 | 0.50 | 91 | 270 | 459 | 0.252 | 0.166 |
| 0.25 | 0.50 | 69 | 292 | 179 | 0.191 | 0.278 |
| 0.50 | 0.50 | 46 | 315 | 55 | 0.127 | 0.455 |

**Key finding:** Class confusion is minimal (1-2 events). Dominant failures: model hasn't learned D20 features + poor localization.

### Experiment C — 2-Class Crack YOLOv8s (Completed & Evaluated)
| Field | Value |
|---|---|
| Classes | D00 (Longitudinal), D20 (Alligator) — D10 excluded |
| Train/Val/Test | 2,918 / 339 / 335 images |
| Boxes | Train: 5,678 (D00=2,051, D20=3,627) |
| Checkpoint | `models/experiment_c_best.pt` (Local, 107 MB, verified) |
| Training Summary | 98 epochs (best val at epoch 54, duration: 1.39 hours) |
| Best Val mAP50 | 0.5554 (Precision: 0.6680, Recall: 0.5263) |
| **Held-Out Test Results** | **Overall mAP50: 0.4191, Precision: 0.4489, Recall: 0.4556** |
| **D00 Test Performance** | **mAP50: 0.6749 (+5.0 pp vs Exp A), Recall: 0.7333 (+10.8 pp vs Exp A)** |
| **D20 Test Performance** | **mAP50: 0.1633 (+0.7 pp vs Exp A), Recall: 0.1779 (+21.0% rel. gain vs Exp A: 14.7%)** |
| Status | ✅ **Fully Trained & Evaluated locally on held-out test split** |

---

## External Artifacts and Storage Locations

| Artifact | Expected Location | Found? | Verified? | Required Action |
|---|---|---|---|---|
| **Experiment A Checkpoint (`best.pt`)** | Google Drive: `RoadWise_Training/yolov8s_3class_final_run_20261110_212046/weights/best.pt` | Found in Google Drive | Verified in Colab logs; not downloaded locally | Keep as 3-class benchmark |
| **Experiment A Backup Checkpoint** | Google Drive: `RoadWise_Training/yolov8s_3class_final_run_20261111_091219/weights/best.pt` | Found in Google Drive | Verified in Colab logs | Remote safety backup |
| **Experiment A Training Plots & Metrics (`results.csv`, `results.png`, `args.yaml`)** | Google Drive: `.../yolov8s_3class_final_run_20261110_212046/` | Found in Google Drive | Verified in `EXPERIMENT_A_TRAINING_REPORT.md` | Preserved in Google Drive |
| **Experiment A Notebook & Report** | Local workspace: `notebooks/RoadWise_Experiment_A_Training.ipynb`, `reports/training/` | Found locally | Verified locally | Preserved in repository |
| **D20 Error Analysis Raw Predictions (`raw_test_predictions.json`, `multi_threshold_matching_results.json`)** | Local: `scratch/d20_analysis_upload/d20_error_analysis/` & Google Drive | Found locally | Verified locally | Fully integrated into `EXPERIMENT_A_D20_ERROR_ANALYSIS.md` |
| **D20 Error Visual Galleries (Correct, Missed, False Positives, Confused)** | Local: `scratch/d20_analysis_upload/d20_error_analysis/visuals/` | Found locally | Verified locally | Galleries available in scratch directory |
| **Experiment C Checkpoint (`experiment_c_best.pt`)** | Local: `models/experiment_c_best.pt` (107 MB) | Found locally | Verified locally (Evaluated on 335 test images) | Ready for model integration decision |
| **Experiment C Results CSV (`experiment_c_results.csv`)** | Local: `scratch/experiment_c_results.csv` | Found locally | Verified locally (98 epochs convergence verified) | Preserved in scratch |
| **Active Production Model (`models/best.pt`)** | Local: `models/best.pt` (6.06 MB) | Found locally | Verified locally (4-class roadwise_v2 model) | Active in local backend; candidate for upgrade |
| **Scoring Modules (`health_score.py`, `risk_score.py`, `validate_scoring.py`)** | Local: `src/scoring/` | Found locally | Verified locally (7/7 unit tests passing) | Active in inspection pipeline |
| **Scoring Verification Data (`val_detections.csv`, `val_scoring_check.csv`)** | Local: `results/metrics/` | Found locally | Verified locally | Preserved as historical benchmark |
| **Scoring Theory Document (`RoadWise_Scoring_Formula_Theory.docx`)** | Shared in earlier ChatGPT chat | Previously shared with ChatGPT but inaccessible to Antigravity | Formulas verified from code and documented in `docs/SCORING_METHODOLOGY.md` | No action needed; methodology fully codified in docs |

---

## F. Software Status

| Component | Status | Notes |
|---|---|---|
| Backend (FastAPI) | ✅ Working | 5 endpoints, well documented |
| Frontend (React/Vite) | ✅ Working | Both modes functional |
| Database (SQLite) | ✅ Working | 55 inspections, 100 detections |
| API endpoints | ✅ Verified | All 5 endpoints present and correct |
| GIS / Map | ✅ Working | Leaflet with priority-colored pins |
| Scoring | ✅ Working | Condition + risk scores correct |
| Model integration | ⚠️ Old model | Using roadwise_v2, not Experiment A |
| Tests (annotation) | ✅ 17/17 pass | `test_annotation_converter.py` |
| Tests (pipeline) | ⚠️ Outdated | `test_roadwise_pipeline.py` hardcodes old arch |
| Tests (backend) | ⚠️ Outdated | `test_backend.py` tests non-existent endpoints |
| Documentation | ✅ Created | 6 docs created 2026-11-11 |

---

## G. Known Issues and Limitations

1. **Active model is old**: `models/best.pt` = Oct 2026 pothole-biased model; Experiment A checkpoint not integrated
2. **D20 detection weakness**: Even in Experiment A, D20 recall = 14.7%. Experiment C may improve this.
3. **No clean-road negatives**: False positive rate on undamaged road images is not established
4. **No pothole model evaluation**: The Roboflow ~665-image pothole dataset has not been evaluated
5. **Confidence threshold mismatch**: `predict.py` default = 0.15; `inspection_pipeline.py` default = 0.25
6. **Test suite partially outdated**: `test_backend.py` and `test_roadwise_pipeline.py` need rewrites
7. **Git: untracked files**: `notebooks/`, `reports/training/`, `scratch/`, `scripts/`, `tests/` not committed

---

## H. Important Paths and Commands

### Run Backend
```powershell
.\venv\Scripts\uvicorn.exe api.main:app --host 127.0.0.1 --port 8000
```

### Run Frontend
```powershell
cd frontend ; npm.cmd run dev
```

### Run Tests
```powershell
.\venv\Scripts\python.exe -m pytest tests\test_annotation_converter.py -v
```

### Key Model Paths
| Model | Path | Notes |
|---|---|---|
| Active production | `models/best.pt` | Old 4-class roadwise_v2 |
| Experiment A | Google Drive only | Download needed |
| Experiment C | Not trained yet | — |

### Key Dataset Paths
| Dataset | Path |
|---|---|
| Experiment A ZIP | `data/processed/crack_experiment_a_3class.zip` |
| Experiment C ZIP | `data/processed/crack_experiment_c_2class.zip` |
| Database | `data/roadwise.db` |

---

## I. Next Recommended Action

**Run Experiment C on Google Colab.**

1. Upload `data/processed/crack_experiment_c_2class.zip` to Google Drive at `MyDrive/RoadWise_Training/`
2. Upload `notebooks/RoadWise_Experiment_C_Training.ipynb` to Colab
3. Run all cells (~2 hours on T4 GPU)
4. Download results and report D20 recall vs Experiment A baseline (14.7%)

This tells us which model to integrate into production. Everything else waits on this result.

