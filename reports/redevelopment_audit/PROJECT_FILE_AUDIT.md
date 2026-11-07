# RoadWise — Project File Audit
**Generated:** 2026-11-07  
**Auditor:** Antigravity (read-only inspection)

**Classification Key:**
- **CAT 1** — Active and required (do not touch)
- **CAT 2** — Required for future ML training (preserve)
- **CAT 3** — Useful documentation or experiment records
- **CAT 4** — Duplicate versions
- **CAT 5** — Obsolete or unused candidates (safe to archive)
- **CAT 6** — Unknown (requires manual verification)

---

## 1. Core Application Files (CAT 1)

| File | Description |
|---|---|
| `api/main.py` | FastAPI backend — imports `run_inspection`, `load_model`, `create_tables` |
| `api/__init__.py` | Package init |
| `src/pipeline/inspection_pipeline.py` | Main Mode 1 pipeline — currently MODIFIED (uncommitted) |
| `src/detection/predict.py` | YOLO inference — loads `models/best.pt` |
| `src/scoring/health_score.py` | Condition scoring — currently MODIFIED (uncommitted) |
| `src/scoring/risk_score.py` | Risk + priority scoring |
| `src/database/database.py` | SQLite schema, CRUD operations |
| `models/best.pt` | Only deployed model checkpoint |
| `models/README.md` | Model documentation — currently MODIFIED (uncommitted) |
| `data/roadwise.db` | Live SQLite database (all inspection records) |
| `requirements.txt` | Python dependencies |
| `frontend/src/App.jsx` | Main React app shell |
| `frontend/src/main.jsx` | React entry point |
| `frontend/src/Pages/LandingPage.jsx` | Landing page — currently MODIFIED (uncommitted) |
| `frontend/src/Pages/AuthorityDashboard.jsx` | Mode 2 dashboard page |
| `frontend/src/components/ContextForm.jsx` | Inspection context form |
| `frontend/src/components/InspectionResults.jsx` | Results display |
| `frontend/src/components/ImageUploader.jsx` | Image upload widget |
| `frontend/src/components/Dashboard/GeographicMap.jsx` | Leaflet map |
| `frontend/src/components/Dashboard/InspectionDetailModal.jsx` | Inspection detail modal |
| `frontend/src/components/Dashboard/MetricCards.jsx` | Dashboard KPI cards |
| `frontend/src/components/Dashboard/RankingTable.jsx` | Ranking table |
| `frontend/src/components/LoadingOverlay.jsx` | Loading state |
| `frontend/src/components/Navbar.jsx` | Nav bar |
| `frontend/src/components/PriorityBadge.jsx` | Priority badge |
| `frontend/src/components/ScoreGauge.jsx` | Score gauge |
| `frontend/src/api/client.js` | API client |
| `frontend/src/App.css` | App styles |
| `frontend/src/index.css` | Base styles |
| `frontend/index.html` | HTML entry |
| `frontend/package.json` | Node package config |
| `frontend/vite.config.js` | Vite config |
| `frontend/tailwind.config.js` | Tailwind config |
| `frontend/postcss.config.js` | PostCSS config |
| `frontend/dist/` | Built frontend assets (served by API) |
| `frontend/node_modules/` | Node dependencies (not committed) |
| `venv/` | Python virtual environment (not committed) |
| `.gitignore` | Git ignore rules |

---

## 2. ML Training Infrastructure (CAT 2)

| File | Description |
|---|---|
| `data/raw/RDD2022/India/` | Source dataset — 7,706 labelled + 1,959 test images in Pascal VOC XML |
| `data/processed/yolo/` | Extracted YOLO-format dataset — 7,706 images across train/val/test |
| `ml-pipeline/01_dataset_audit.py` | Dataset integrity checker |
| `ml-pipeline/02_baseline_inference.py` | Baseline evaluation script |
| `ml-pipeline/03_prepare_dataset.py` | VOC-to-YOLO + train/val/test splitter |
| `ml-pipeline/04_train.py` | First fine-tuning script (v1) |
| `ml-pipeline/05_evaluate.py` | Evaluation and comparison script |
| `ml-pipeline/06_train_v2.py` | Second fine-tuning script (v2 — produced `best.pt`) |
| `ml-pipeline/dataset.yaml` | ML pipeline dataset config template |
| `ml-pipeline/requirements.txt` | ML-only requirements |
| `src/preprocessing/voc_to_yolo.py` | VOC XML → YOLO TXT converter |
| `src/preprocessing/eda_rdd2022.py` | RDD2022 EDA script |

---

## 3. Documentation and Experiment Records (CAT 3)

| File | Description |
|---|---|
| `training_artifacts/args.yaml` | Complete hyperparameters for `roadwise_v2` training run |
| `training_artifacts/data.yaml` | Dataset YAML used in training |
| `training_artifacts/results.csv` | 83-epoch training curves |
| `training_artifacts/PROJECT_REPORT.md` | Training run analysis and Q&A |
| `training_artifacts/plots/*.png/jpg` | Training curves, confusion matrix, val batch previews |
| `results/metrics/yolo_split_summary.json` | Dataset split summary with class counts |
| `results/metrics/eda_summary_India.json` | RDD2022 India EDA summary |
| `results/metrics/annotations_India.csv` | Full annotation table |
| `results/metrics/images_India.csv` | Image metadata table |
| `results/metrics/bbox_stats_India.csv` | Bounding box statistics |
| `results/metrics/val_detection_summary.csv` | Per-class detection stats on val set |
| `results/metrics/val_detections.csv` | Per-image detection details |
| `results/metrics/val_scoring_check.csv` | Scoring validation data |
| `results/metrics/roi_full_validation.csv` | ROI vs full-frame validation comparison |
| `results/metrics/roi_baseline_comparison.csv` | Baseline vs candidate comparison |
| `results/metrics/roi_detection_metrics_by_image.csv` | Per-image ROI metrics |
| `results/metrics/roi_detection_metrics_summary.csv` | Summary ROI metrics |
| `results/metrics/full_validation_resolution_comparison.csv` | 640 vs 960 comparison |
| `results/metrics/ultralytics/full_640/` | Ultralytics val output at 640px |
| `results/metrics/ultralytics/full_960/` | Ultralytics val output at 960px |
| `results/metrics/problems_India.txt` | Flagged problem images (empty) |
| `results/calib_data.yaml` | Calibration dataset YAML |
| `results/figures/*.png` | EDA figures (class distribution, bbox stats, etc.) |
| `results/predictions/comparison/` | Baseline vs ROI visual comparisons |
| `README.md` | Root project README (untracked) |
| `tests/test_roadwise_pipeline.py` | Integration test suite (untracked) |

---

## 4. Duplicate Versions (CAT 4)

| Item | Original | Duplicate | Notes |
|---|---|---|---|
| `data/processed/yolo.zip` | `data/processed/yolo/` (extracted) | `data/processed/yolo.zip` (419 MB archive) | Archive is redundant if extracted directory is intact |
| `.backup_checkpoint/health_score.py` | `src/scoring/health_score.py` (modified) | `.backup_checkpoint/` copy | Backup of an older version; useful reference but duplicated content |
| `.backup_checkpoint/inspection_pipeline.py` | `src/pipeline/inspection_pipeline.py` (modified) | `.backup_checkpoint/` copy | Same as above |
| `.backup_checkpoint/LandingPage.jsx` | `frontend/src/Pages/LandingPage.jsx` (modified) | `.backup_checkpoint/` copy | Same as above |
| `.backup_checkpoint/models_README.md` | `models/README.md` (modified) | `.backup_checkpoint/` copy | Same as above |
| `frontend/src/assets/hero_road_annotated.jpg` | Current version | `frontend/src/assets/hero_road_annotated.png` | Same image in two formats; PNG is untracked |
| `frontend/src/assets/hero.png` | — | Unused (not referenced in LandingPage.jsx) | Likely an old asset |
| `frontend/src/assets/hero_road.jpg` | — | Not referenced in current LandingPage.jsx | Likely superseded by `hero_road_annotated.jpg` |
| `frontend/dist/` | Build output | Duplicates `frontend/src/` compiled content | Standard build artifact |

---

## 5. Obsolete or Unused Candidates (CAT 5)

| File | Reason | Confidence |
|---|---|---|
| `frontend/src/assets/hero.png` | Not imported in any current JSX file | HIGH |
| `frontend/src/assets/hero_road.jpg` | Not imported in `LandingPage.jsx` or other JSX (replaced by annotated version) | HIGH |
| `frontend/src/assets/react.svg` | Vite template leftover, not used in app | HIGH |
| `frontend/src/assets/vite.svg` | Vite template leftover, not used in app | HIGH |
| `frontend/src/components/DashboardPlaceholder.jsx` | 228-byte placeholder, not routed in `App.jsx` | HIGH |
| `data/model_debug/bad_road_1.jpg` | Debug test image, not referenced by any code | HIGH |
| `data/model_debug/bad_road_2.jpg` | Debug test image, not referenced by any code | HIGH |
| `data/test_images/India_000045.jpg` | Used only for comparison experiment; no code reference | MEDIUM |
| `data/processed/roadwise/` | Empty directory, no content | HIGH |
| `data/local_test/` | Empty directory, no content | HIGH |
| `src/analysis/` | Empty directory, no content | HIGH |
| `src/gis/` | Empty directory, no content | HIGH |
| `app/` | Empty directory, no content | HIGH |
| `notebooks/` | Empty directory, no content | HIGH |
| `runs/detect/val/` | Empty directory (Ultralytics output for a val run, no files) | HIGH |
| `.pytest_cache/` | Auto-generated pytest cache, not committed | HIGH |
| `api/__pycache__/` | Python bytecode cache | HIGH |
| `src/*/__pycache__/` | Python bytecode cache | HIGH |
| `tests/__pycache__/` | Python bytecode cache | HIGH |

---

## 6. Unknown — Requires Manual Verification (CAT 6)

| File | Question |
|---|---|
| `data/uploads/*.jpg/webp/png` | These are real inspection uploads from live use. Some may be personal or sensitive. Should they be in the project root? |
| `results/predictions/*.jpg` | Live annotated inspection images. Same question. |
| `frontend/src/assets/hero_road_annotated.png` | Untracked PNG; is it intentionally different from the `.jpg`? |
| `ml-pipeline/04_train.py` | Was this script ever actually run to completion and produce a checkpoint? No checkpoint from it exists in the project. LIKELY unused after `06_train_v2.py` was developed. |
| `.backup_checkpoint/` | Is the diff between backup and current a deliberate improvement or an accidental regression? Should be reviewed before the backup copies are discarded. |

---

## 7. Summary Count

| Category | Count |
|---|---|
| CAT 1 — Active and required | ~40 files |
| CAT 2 — Required for future ML training | ~12 files, ~9700 images |
| CAT 3 — Documentation / experiment records | ~25 files |
| CAT 4 — Duplicate versions | ~8 items |
| CAT 5 — Obsolete/unused candidates | ~15 files, 4 empty directories |
| CAT 6 — Unknown | ~6 items |

