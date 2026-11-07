# RoadWise — GitHub Status Report
**Generated:** 2026-11-07 (22:58 IST)  
**Auditor:** Antigravity (read-only inspection, no fetch performed)

---

## 1. Repository Configuration

| Property | Value | Status |
|---|---|---|
| **Remote name** | `origin` | VERIFIED |
| **Remote URL** | `https://github.com/adxi25/RoadWise.git` | VERIFIED |
| **Current branch** | `main` | VERIFIED |
| **Remote tracking branch** | `origin/main` | VERIFIED |

---

## 2. Local Branch State

| Branch | Commit | Tracking |
|---|---|---|
| `main` *(active)* | `9254dab` | `[origin/main]` |
| `backup-before-review-updates` | `9254dab` | *(no tracking)* |

---

## 3. Latest Local Commit

```
9254dab  docs & pipeline: add ML scripts, training plots, test suite, and project report
```

Git reports `Your branch is up to date with 'origin/main'`. This status is based on the **last known fetch** — no fresh remote comparison was performed during this audit.

> **⚠ IMPORTANT:** The tracking status `up to date with 'origin/main'` reflects the last time `git fetch` or `git pull` was run. Because `git fetch` was NOT run during this audit (per Task instructions), the actual state of the remote is **unverified**. GitHub may or may not match the local `9254dab` commit. A fresh `git fetch --dry-run` or checking the GitHub web UI is needed to confirm.

---

## 4. Full Git Log (all 7 commits)

| Commit | Message |
|---|---|
| `9254dab` | docs & pipeline: add ML scripts, training plots, test suite, and project report |
| `cbe614e` | feat: add training artifacts for roadwise_v2 model |
| `5a8e7cf` | feat: integrate fine-tuned roadwise_v2 YOLOv8 model |
| `e8a48c7` | Add authority dashboard and dataset tooling |
| `4782af3` | Add full validation and experimental ROI evaluation |
| `e5e0dd8` | feat: configurable imgsz + civic UI redesign (15-file change set) |
| `ddd7fca` | Checkpoint before frontend redesign |

---

## 5. Uncommitted Changes (`git status`)

### 5.1 Modified Files (tracked, unstaged)

| File | Description |
|---|---|
| `frontend/src/Pages/LandingPage.jsx` | UI changes since last commit |
| `frontend/src/assets/hero_road_annotated.jpg` | Asset change since last commit |
| `models/README.md` | Documentation update since last commit |
| `src/pipeline/inspection_pipeline.py` | Pipeline code change since last commit |
| `src/scoring/health_score.py` | Scoring formula change since last commit |

> These are the files that have `.backup_checkpoint/` counterparts, confirming this is the "before review update" state.

### 5.2 Untracked Files

| Path | Description |
|---|---|
| `.backup_checkpoint/` | Backup of pre-review-update source files |
| `README.md` | Root README (new, not committed) |
| `data/` | Entire data directory is untracked (matches `.gitignore` pattern for `*.db`, `*.sqlite`) |
| `frontend/src/assets/hero_road_annotated.png` | New PNG asset (untracked) |
| `reports/` | Entire reports directory is untracked |
| `results/` | Entire results directory is untracked (`.gitignore` excludes `results/predictions/`, `results/figures/`, `results/metrics/`) |
| `tests/test_roadwise_pipeline.py` | Test file (untracked) |

---

## 6. `.gitignore` Review

```
venv/
.venv/
**/node_modules/
**/dist/
.env  /  .env.*
__pycache__/
*.py[cod]
*.db / *.sqlite / *.sqlite3
# *.pt  ← COMMENTED OUT
!models/best.pt  ← WHITELISTED
*.pth
.DS_Store
results/predictions/
results/figures/
results/metrics/
```

**Key observations:**
- `models/best.pt` is **explicitly whitelisted** (tracked) despite `*.pt` comment.
- `data/` is NOT explicitly ignored — but `*.db` patterns exclude `data/roadwise.db`. The image subdirectories (`data/raw/`, `data/processed/`, `data/uploads/`) are **untracked but not explicitly gitignored**. This means they will appear as untracked.
- `reports/` has no `.gitignore` entry — it is untracked by default.
- `results/` subdirectory content is ignored via specific patterns.

---

## 7. What Is and Is NOT Tracked by Git

| Item | Tracked? |
|---|---|
| `models/best.pt` | YES (explicitly whitelisted) |
| `src/`, `api/`, `frontend/src/` (source code) | YES |
| `ml-pipeline/*.py` | YES |
| `training_artifacts/` | YES (committed in `cbe614e`) |
| `data/raw/RDD2022/India/` | NO (untracked) |
| `data/processed/yolo/` | NO (untracked) |
| `data/processed/yolo.zip` | NO (untracked) |
| `data/roadwise.db` | NO (`.gitignore: *.db`) |
| `results/metrics/` | NO (`.gitignore`) |
| `results/predictions/` | NO (`.gitignore`) |
| `reports/` | NO (untracked, not in `.gitignore`) |
| `.backup_checkpoint/` | NO (untracked) |
| `tests/test_roadwise_pipeline.py` | NO (untracked) |

---

## 8. Conclusions

| Question | Answer |
|---|---|
| Is GitHub synchronized with local? | **UNVERIFIED** — `git status` says "up to date" based on last fetch; fresh fetch not performed |
| Is the working tree clean? | **NO** — 5 tracked files modified, multiple untracked directories |
| Is anything ahead of origin? | **Unknown** — would require `git fetch` to confirm |
| Does the local `main` match GitHub `main`? | **Unknown** — requires remote comparison |
| Are uncommitted changes at risk? | **YES** — 5 modified files (`LandingPage.jsx`, `hero_road_annotated.jpg`, `models/README.md`, `inspection_pipeline.py`, `health_score.py`) have unsaved working-tree changes |

---

## 9. Recommended Actions (Before Any Development)

1. **Run `git fetch origin`** to update remote tracking info.
2. **Run `git diff HEAD origin/main`** to compare local vs remote.
3. **Decide what to do with the 5 modified files** — commit or revert them.
4. **Consider adding `reports/` to `.gitignore`** or committing the audit reports.
5. **Consider whether `tests/test_roadwise_pipeline.py` should be tracked** (it was excluded from the last commit).

