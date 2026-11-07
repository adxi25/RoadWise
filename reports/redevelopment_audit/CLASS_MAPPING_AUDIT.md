# RoadWise — Class Mapping Audit
**Generated:** 2026-11-07  
**Auditor:** Antigravity (read-only inspection)

---

## 1. The Four Canonical RoadWise Classes

| Class ID | D-Code | English Name | Description |
|---|---|---|---|
| 0 | D00 | Longitudinal Crack | Wheelpath-parallel fissures |
| 1 | D10 | Transverse Crack | Cross-perpendicular cracks |
| 2 | D20 | Alligator Crack | Interconnected fatigue cracking |
| 3 | D40 | Pothole | Deep localized cavity |

---

## 2. Class Mapping Trace — Layer by Layer

### 2.1 YOLO Checkpoint (`models/best.pt`)

**Source:** PyTorch `torch.load()` on the checkpoint.

```python
model.names  → {0: 'D00', 1: 'D10', 2: 'D20', 3: 'D40'}
model.nc     → 4
```

Status: **VERIFIED** — 4 classes, D-code names.

---

### 2.2 Active Dataset YAML (`data/processed/yolo/data.yaml`)

```yaml
nc: 4
names:
  0: longitudinal_crack
  1: transverse_crack
  2: alligator_crack
  3: pothole
```

Status: **VERIFIED** — 4 classes, English names. This is the validation/calibration YAML used in `results/calib_data.yaml`.

---

### 2.3 Training Dataset YAML (`training_artifacts/data.yaml`)

```yaml
nc: 4
names:
  0: D00
  1: D10
  2: D20
  3: D40
```

Status: **VERIFIED** — 4 classes, D-code names. Matches checkpoint.

---

### 2.4 ML Pipeline Dataset Config (`ml-pipeline/dataset.yaml`)

```yaml
path: datasets/roadwise_pothole
nc: 4
names:
  0: D00
  1: D10
  2: D20
  3: D40
```

Status: **VERIFIED** — 4 classes, D-code names.

---

### 2.5 Detection Module (`src/detection/predict.py`)

**Lines 23–34:**

```python
CLASS_CODE = {
    # New model class names (D-codes)
    "D00": "D00",
    "D10": "D10",
    "D20": "D20",
    "D40": "D40",
    # Old model class names (english) — kept for backwards compatibility
    "longitudinal_crack": "D00",
    "transverse_crack":   "D10",
    "alligator_crack":    "D20",
    "pothole":            "D40",
}

CLASS_LABEL = {
    "D00": "Longitudinal Crack",
    "D10": "Transverse Crack",
    "D20": "Alligator Crack",
    "D40": "Pothole",
}
```

**Default model path (line 17):**
```python
DEFAULT_MODEL = BASE_DIR / "models" / "best.pt"
```

Status: **VERIFIED** — Handles both D-code and English class names. Maps all four classes. Comment on line 21 says "New fine-tuned model (roadwise_v2) uses D-code names directly."

---

### 2.6 Scoring — Condition Score (`src/scoring/health_score.py`)

**Lines 23–28:**

```python
CLASS_WEIGHT = {"D40": 1.00, "D20": 0.80, "D00": 0.50, "D10": 0.50}
AREA_REF     = {"D40": 0.101, "D20": 0.235, "D00": 0.070, "D10": 0.070}
```

**Line 65:**
```python
kept = [d for d in detections
        if d.get("confidence", 0.0) >= (threshold - 1e-4) and d.get("class_code") in CLASS_WEIGHT]
```

Status: **VERIFIED** — Expects and weights all four D-codes. Any detection with an unrecognised `class_code` is **silently dropped** from scoring (`not in CLASS_WEIGHT`).

---

### 2.7 Scoring — Risk Score (`src/scoring/risk_score.py`)

The risk scoring module takes a `health_score` float (not individual class codes). It is **class-agnostic** beyond what `health_score.py` produces.

Status: **VERIFIED** — No class dependency. No mismatch risk.

---

### 2.8 Database (`src/database/database.py`)

The `detections` table stores:

```sql
class_code TEXT NOT NULL,
class_name TEXT NOT NULL,
```

No class constraint in schema — accepts any string. The pipeline feeds D-code and human-readable label as set by `predict.py`.

Status: **VERIFIED** — No hardcoded class restriction. Compatible with 4-class model.

---

### 2.9 Backend API (`api/main.py`)

Does not reference class names or IDs directly. Passes raw `run_inspection()` result through to the client. All class handling is upstream in `predict.py` / `health_score.py`.

Status: **VERIFIED** — No class dependency.

---

### 2.10 Frontend — `InspectionResults.jsx`

**Lines 69–74:**

```javascript
const damageClassBadges = {
  D40: { label: 'Pothole',            bg: 'bg-[#FFF1F2] ...' },
  D20: { label: 'Alligator Crack',    bg: 'bg-[#FFF7ED] ...' },
  D10: { label: 'Transverse Crack',   bg: 'bg-[#FFFBEB] ...' },
  D00: { label: 'Longitudinal Crack', bg: 'bg-[#F0FDFA] ...' },
};
```

Status: **VERIFIED** — All four classes have UI badge definitions. The frontend handles any subset returned by the model.

---

### 2.11 Frontend — `LandingPage.jsx`

**Lines 258–301:** Explicitly lists all four defect categories (D40, D20, D10, D00) with descriptions and severity weights.

Status: **VERIFIED** — UI explicitly claims four-class detection capability.

---

## 3. Mismatch Analysis

### 3.1 Is there a class mismatch between model and application?

**NO** — the class mapping is consistent end-to-end:

| Layer | Classes |
|---|---|
| `best.pt` checkpoint | D00, D10, D20, D40 (4-class) |
| `predict.py` mapping | D00, D10, D20, D40 (4-class) |
| `health_score.py` weights | D00, D10, D20, D40 (4-class) |
| Frontend badges | D00, D10, D20, D40 (4-class) |
| Landing page UI | D00, D10, D20, D40 (4-class) |

### 3.2 Does the application incorrectly assume all four classes are always detected?

**NOT in a hard-failure sense.** The pipeline gracefully handles zero detections or partial class detection. However:

- The **frontend and landing page claim 4-class capability** in their UI text.
- The **model is effectively a ~3-class detector in practice**: D10 (Transverse Crack) had only **1 detection** in the entire validation run. The model is unlikely to reliably detect D10 in the wild.
- This is a **performance gap**, not a code-level mismatch. No code will crash. But detections labeled D10 in the database are unreliable.

### 3.3 `CLASS_CODE` backwards-compatibility mapping

`predict.py` retains English-name fallback keys (`"longitudinal_crack"`, `"pothole"`, etc.). This means if an older English-name model were loaded, detections would still be correctly mapped to D-codes. This is a defensive design choice.

---

## 4. Scoring Weight Note

The `health_score.py` comment on line 27 says:
> `# "Large box" reference per class = 90th percentile of relative box area among the model's detections on the validation set (results/metrics/val_detection_summary.csv). D10 had only 1 detection, so its value is a placeholder.`

This is **self-documenting evidence** that the developer was aware of the D10 sparsity problem and manually set a placeholder AREA_REF for D10.

---

## 5. Summary Table

| Component | 4-Class Aware | Consistent with Model | Notes |
|---|---|---|---|
| `models/best.pt` | YES | — | Ground truth |
| `data/processed/yolo/data.yaml` | YES | MINOR — English names vs D-codes | No runtime impact |
| `ml-pipeline/dataset.yaml` | YES | YES | D-codes |
| `src/detection/predict.py` | YES | YES | Dual mapping for compatibility |
| `src/scoring/health_score.py` | YES | YES | D10 AREA_REF is placeholder |
| `src/scoring/risk_score.py` | N/A | YES | Class-agnostic |
| `src/database/database.py` | YES | YES | No class constraint |
| `api/main.py` | YES | YES | No class dependency |
| `frontend/InspectionResults.jsx` | YES | YES | All 4 badges defined |
| `frontend/LandingPage.jsx` | YES | YES | Declares all 4 classes |

**Overall: No class-mapping mismatch. D10 is a performance gap, not a code error.**

