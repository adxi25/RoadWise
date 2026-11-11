# TASK 5.2 STEP 4 — SCENE GROUPING & AUGMENTATION AUDIT REPORT

**Project:** RoadWise — AI-Powered Road Inspection System  
**Task:** 5.2 Step 4 — Empirical Scene Grouping & Flip Augmentation Verification  
**Date:** 2026-11-10  

---

## 1. Executive Summary & Major Forensic Discovery

A deep empirical audit of McMaster v2's filename structure and geographic orthophoto tiling revealed a **critical architectural insight**:

1. **Orthophoto Grid Structure:** The 6,093 images represent **371 unique road scenes (`NNNN`)**, each tiled into a row/column grid (`R_C_JPG`). On average, each scene contains **8.5 distinct spatial tiles**.
2. **Roboflow Split Flaw Uncovered:** In the raw Roboflow export, **298 out of 371 scenes (73.6%) have tiles dispersed across both train and validation or test splits**! While exact pixel copies do not cross splits, *adjacent tiles from the exact same road section* (e.g. tile row 3 col 6 in train, tile row 3 col 7 in test) were scattered across splits. This represents a subtle spatial data leakage in the third-party export.
3. **Step 4 Grouped Split Solution:** To achieve true benchmark purity, **Step 4 will partition by Scene ID (`NNNN`)**, ensuring that 100% of tiles from any given road section are confined strictly to either train, validation, or test.
4. **Augmentation Preservation:** The 3,150 source tiles and their 2,943 flipped copies are fully cataloged. The manifest will explicitly track `is_augmented` and `source_tile_id` so that horizontal/vertical flip variants can be included or excluded in controlled ablation experiments.

---

## 2. Empirical Scene Structure Statistics

- **Total Image Files:** 6,093
- **Total Distinct Road Scenes (`NNNN`):** 371
- **Total Unique Source Tiles (pre-flip):** 3,150
- **Average Tiles per Scene:** 8.49 (Min: 1, Max: 30)
- **Average Total Images per Scene:** 16.42
- **Scenes Leaked Across Splits in Raw Export:** **298 (73.6%)**

### Tile Distribution in Sample Scenes

| Scene ID | Unique Spatial Tiles | Total Flipped Copies | Splits in Raw Export | Leakage Risk in Raw Roboflow |
|:---:|:---:|:---:|:---:|:---:|
| `0001` | 12 | 22 | test, train, valid | **YES (Split across partitions)** |
| `0002` | 13 | 25 | test, train, valid | **YES (Split across partitions)** |
| `0003` | 10 | 17 | test, train, valid | **YES (Split across partitions)** |
| `0004` | 18 | 38 | test, train, valid | **YES (Split across partitions)** |
| `0005` | 22 | 40 | test, train, valid | **YES (Split across partitions)** |
| `0011` | 22 | 37 | test, train, valid | **YES (Split across partitions)** |
| `0020` | 23 | 43 | test, train, valid | **YES (Split across partitions)** |

---

## 3. Roboflow Augmentation Breakdown

The 3,150 unique source tiles received probabilistic flip augmentations during Roboflow export:

- **1x (Original only, un-augmented):** 1,080 source tiles (34.3%)
- **2x (Original + 1 flip variant):** 1,197 source tiles (38.0%)
- **3x (Original + 2 flip variants):** 873 source tiles (27.7%)
- **Total Exported Images:** 6,093

---

## 4. Planned Step 4 Split Protocol

To eliminate spatial leakage:
1. **Grouped Random Split by Scene ID:** The 371 scene IDs will be partitioned using an 80/10/10 ratio (~297 train scenes, ~37 validation scenes, ~37 test scenes) using a fixed seed.
2. **Zero Spatial Contamination:** All rows and columns of any scene (`NNNN_R_C`) will stay together in the same split partition.
3. **Augmentation Tracking:** The provenance field in the manifest will record `source_tile_id`, allowing models to train with or without pre-flipped images.
