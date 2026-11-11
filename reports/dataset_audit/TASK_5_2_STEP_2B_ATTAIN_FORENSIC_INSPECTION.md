# TASK 5.2 STEP 2B — ATTAIN DATASET FORENSIC INSPECTION REPORT

**Project:** RoadWise — AI-Powered Road Inspection System  
**Task:** 5.2 Step 2B — Attain Pavement Distress Dataset Forensic Inspection  
**Date:** 2026-11-09  
**Analyst:** Antigravity (automated forensic audit — read-only)  
**Archive:** `data/raw/Attain/Attain.zip`  
**Status:** COMPLETE — Awaiting user review before proceeding

---

## 0. Executive Summary

| Item | Value |
|---|---|
| Archive size | 155,000,978 bytes (~147.8 MiB) |
| Total ZIP entries | 4,589 |
| Three releases present | ✅ OS v1.0, WS v1.0, WS v2.0 |
| Total image files (all releases) | 2,293 |
| Total annotation files (all releases) | 2,293 |
| Pairing completeness | 100% — every image has a paired annotation file |
| Cross-release image duplicates | **0** (releases are fully disjoint) |
| Within-release duplicates | **WS v1.0 only: 4 duplicate image pairs (8 images, 4 unique)** |
| Total unique images (after dedup) | **2,289** |

**Critical finding for RoadWise:** `linear_crack` / `Linear crack` is a **semantically ambiguous, mixed-direction class** in ALL three releases. No orientation metadata (longitudinal vs transverse) exists anywhere in the archive. This class **MUST NOT** be automatically mapped to D00 (longitudinal only) under Rule 1.

---

## 1. Archive Integrity and Top-Level Structure

### 1.1 Archive Verification

| Property | Value |
|---|---|
| File path | `data/raw/Attain/Attain.zip` |
| File size | 155,000,978 bytes |
| Last modified | 2026-11-09 02:45:30 |
| ZIP structure | Valid — opens without error |
| Total entries (files + dirs) | 4,589 |
| Top-level folder | `Attain/` (single root, then `Attain/Attain/`) |

### 1.2 Top-Level Release Structure

```
Attain/
└── Attain/
    ├── Attain_SMP_OS_V1.0/
    │   ├── Attain_SMP_OS_V1.0_data.yaml
    │   ├── Images/     (637 JPGs)
    │   └── Labels/     (637 TXT files)
    ├── Attain_SMP_WS_V1.0/
    │   ├── Attain_SMP_WS_V1.0_data.yaml
    │   ├── Images/     (809 JPGs)
    │   └── Labels/     (809 TXT files)
    └── Attain_SMP_WS_V2.0/
        ├── Attain_SMP_WS_V2.0_data.yaml
        ├── Images/     (847 JPGs)
        └── Labels/     (847 XML files)
```

> [!NOTE]
> There are no README, LICENSE, or other documentation files inside the ZIP archive. Only three YAML config files serve as metadata. Attribution references the Attain Lab website (`https://attain.aut.ac.ir/Datasets`) and copyright `© 2025 Attain Lab`.

---

## 2. Per-Release Statistics

### 2.1 Release Summary Table

| Property | OS v1.0 | WS v1.0 | WS v2.0 |
|---|---|---|---|
| **Full name** | Attain_SMP_OS_V1.0 | Attain_SMP_WS_V1.0 | Attain_SMP_WS_V2.0 |
| **Image files** | 637 | 809 | 847 |
| **Annotation format** | YOLO TXT | YOLO TXT | Pascal VOC XML |
| **Annotation files** | 637 | 809 | 847 |
| **Image–annotation pairing** | 100% | 100% | 100% |
| **Empty annotation files** | **103** | **14** | **7** |
| **Annotated images** | 534 | 795 | 840 |
| **Total annotation instances** | **918** | **7,133** | **11,710** |
| **Number of classes (nc)** | 2 | 16 | 17 |
| **Image dimensions** | 640×640 (all) | 640×640 (all) | Mixed (see §4) |
| **Annotation geometry** | Polygon (norm.) | Mixed polygon + bbox (norm.) | Bounding box (pixel) |
| **Within-release duplicates** | 0 | **4 pairs** | 0 |
| **Unique images** | 637 | 805 | 847 |

### 2.2 YAML Catalogue vs. Measured Counts

**OS v1.0** — YAML reports 637 images, 198 Alligator, 720 Linear. Measured: 637 images, 198 Alligator, 720 Linear. ✅ **Perfect match.**

**WS v1.0** — YAML class counts:

| Class (YAML) | YAML Count | Measured |
|---|---|---|
| Alligator crack - High | 62 | 62 ✅ |
| Alligator crack - Low | 479 | 479 ✅ |
| Alligator crack - low | 808 | 808 ✅ |
| Block crack - Low | 3 | 3 ✅ |
| Faded marking - High | 33 | 33 ✅ |
| Faded marking - Low | 61 | 61 ✅ |
| Linear crack - High | 372 | 372 ✅ |
| Linear crack - Low | 3,731 | 3,731 ✅ |
| Manhole - High | 20 | 20 ✅ |
| Manhole - Low | 484 | 484 ✅ |
| Patch - Low | 129 | 129 ✅ |
| Pothole - High | 52 | 52 ✅ |
| Pothole - Low | 158 | 158 ✅ |
| Raveling - Low | 20 | 20 ✅ |
| Weathering - High | 95 | 95 ✅ |
| Weathering - Low | 626 | 626 ✅ |
| **TOTAL** | **7,133** | **7,133** ✅ |

**WS v2.0** — YAML class counts:

| Class (YAML) | YAML Count | Measured |
|---|---|---|
| Alligator crack - High | 215 | 215 ✅ |
| Alligator crack - Low | 2,489 | 2,489 ✅ |
| Block crack - High | 14 | 14 ✅ |
| Block crack - Low | 44 | 44 ✅ |
| Faded marking - High | 630 | 630 ✅ |
| Faded marking - Low | 733 | 733 ✅ |
| Lane shoulder drop-off - High | 348 | 348 ✅ |
| Linear crack - High | 702 | 702 ✅ |
| Linear crack - Low | 3,494 | 3,494 ✅ |
| Patch and utility cut- High | 41 | 41 ✅ |
| Patch and utility cut- Low | 705 | 705 ✅ |
| Pothole - High | 58 | 58 ✅ |
| Pothole - Low | 257 | 257 ✅ |
| Raveling - High | 11 | 11 ✅ |
| Raveling - Low | 329 | 329 ✅ |
| Weathering - High | 534 | 534 ✅ |
| Weathering - Low | 1,106 | 1,106 ✅ |
| **TOTAL** | **11,710** | **11,710** ✅ |

> [!IMPORTANT]
> All YAML-reported counts are verified against actual annotation file contents. No discrepancy found in any release.

---

## 3. Image–Annotation Pairing Verification

| Release | Images | Annotations | Images without annotations | Annotations without images |
|---|---|---|---|---|
| OS v1.0 | 637 | 637 | **0** | **0** |
| WS v1.0 | 809 | 809 | **0** | **0** |
| WS v2.0 | 847 | 847 | **0** | **0** |

Pairing verified by stem-matching (filename without extension). All releases are **100% paired**.

**Empty annotation files** (images present but zero annotations inside the file):

| Release | Empty annotation files | Corresponding images |
|---|---|---|
| OS v1.0 | **103** (16.2% of release) | Present — these are negative/background images |
| WS v1.0 | **14** (1.7%) | Present |
| WS v2.0 | **7** (0.8%) | Present |

> [!NOTE]
> Empty annotation files are valid in YOLO-format datasets — they represent negative (background) samples. However, 103 empty files in OS v1.0 (16.2% of the release) is unusually high and warrants attention during dataset preparation.

---

## 4. Image Properties

### 4.1 Dimensions

| Release | Dimension | Count |
|---|---|---|
| OS v1.0 | 640×640 | 637 (100%) |
| WS v1.0 | 640×640 | 809 (100%) |
| WS v2.0 | 1479×508 | 403 (47.6%) |
| WS v2.0 | 1920×1080 | 275 (32.5%) |
| WS v2.0 | 640×640 | 169 (20.0%) |

### 4.2 Format and Color Model

- All images are JPEG (`.jpg`), RGB color (confirmed from YAML metadata).
- OS v1.0 and WS v1.0: All uniform 640×640 — consistent square crops, likely derived from original drone/camera footage.
- WS v2.0: Three distinct aspect ratios, suggesting images from different camera types or un-cropped footage.

---

## 5. Annotation Format and Geometry

### 5.1 OS v1.0 — YOLO TXT Polygon Segmentation

- **Format:** YOLO normalized polygon (class_id + N×[x,y] pairs, all values in [0.0, 1.0])
- **All 918 instances use polygon geometry** — no bounding boxes
- **Polygon point count distribution:**

| Points per polygon | Instance count |
|---|---|
| 4 | 3 |
| 5 | 124 |
| 6 | 47 |
| 7 | 68 |
| 8–10 | 228 |
| 11–15 | 199 |
| 16–20 | 108 |
| 21–32 | 51 |

- **Coordinate validity:** All 918 instances pass — 0 out-of-range values (all coordinates strictly in [0.0, 1.0])
- Polygon annotations are highest-quality geometric format for segmentation tasks

### 5.2 WS v1.0 — YOLO TXT Mixed (Polygon + Bounding Box)

- **Format:** YOLO normalized — some rows are bbox (cx, cy, w, h = 4 coords), others are polygon (>4 coords)
- **5,712 bbox rows** (80.1%) and **1,421 polygon rows** (19.9%)

Mixed format breakdown by class:

| Class | Bbox | Polygon | Total |
|---|---|---|---|
| Alligator crack - High | 42 | 20 | 62 |
| Alligator crack - Low | 105 | 374 | 479 |
| Alligator crack - low | 808 | 0 | 808 |
| Linear crack - High | 246 | 126 | 372 |
| Linear crack - Low | 2,976 | 755 | 3,731 |
| Manhole - High | 20 | 0 | 20 |
| Manhole - Low | 484 | 0 | 484 |
| Weathering - High | 95 | 0 | 95 |
| Weathering - Low | 613 | 13 | 626 |
| Pothole - High | 49 | 3 | 52 |
| Pothole - Low | 155 | 3 | 158 |
| Patch - Low | 99 | 30 | 129 |
| Block crack - Low | 0 | 3 | 3 |
| Faded marking - High | 2 | 31 | 33 |
| Faded marking - Low | 0 | 61 | 61 |
| Raveling - Low | 18 | 2 | 20 |

> [!WARNING]
> WS v1.0 uses **inconsistent annotation geometry** — mixing bbox and polygon within the same release. Any YOLO training framework that expects uniform format (OBB vs segmentation vs detect) will require conversion or filtering. This is a data quality defect.

- **Coordinate validity:** All coordinates in [0.0, 1.0] — no out-of-range values.

### 5.3 WS v2.0 — Pascal VOC XML Bounding Box

- **Format:** Pascal VOC XML with absolute pixel coordinates (`xmin`, `ymin`, `xmax`, `ymax`)
- Standard VOC fields present: `<name>`, `<pose>`, `<truncated>`, `<difficult>`, `<occluded>`, `<bndbox>`
- **280 objects also have `<polygon>` elements** (out of 11,710 total)

**Coordinate validity (all 11,710 instances):**

| Issue | Count |
|---|---|
| `ymax > image_height` | 440 |
| `xmax > image_width` | 282 |
| `xmin >= xmax` | 1 |
| **Total invalid bounding boxes** | **707** (6.0% of all instances) |

> [!CAUTION]
> **707 bounding boxes (6.0%) have coordinates that exceed image boundaries.** These are systematic annotation errors, not edge cases. The pattern (xmax slightly exceeding width, ymax slightly exceeding height) suggests the annotator's bounding box was placed at the image edge and the tool allowed values up to and slightly beyond the boundary. These boxes **must be clipped or discarded** during preprocessing. They are present across all three image dimension groups.

**Conversion requirement:** WS v2.0 XML must be converted from absolute pixel coords to YOLO normalized format (cx, cy, w, h) before training. Invalid boxes must be handled (clip to [0, image_dim] or discard).

---

## 6. Class Distribution Analysis

### 6.1 OS v1.0 — 2 Classes

| Class ID | Class Name | Catalogue Count | Measured Count | Verified |
|---|---|---|---|---|
| 0 | Alligator crack | 198 | **198** | ✅ |
| 1 | Linear crack | 720 | **720** | ✅ |
| — | **TOTAL** | **918** | **918** | ✅ |

### 6.2 WS v1.0 — 16 Classes (severity-labelled)

| Class ID | Class Name | Measured Count |
|---|---|---|
| 0 | Alligator crack - High | 62 |
| 1 | Alligator crack - Low | 479 |
| 2 | Alligator crack - low ⚠️ | 808 |
| 3 | Block crack - Low | 3 |
| 4 | Faded marking - High | 33 |
| 5 | Faded marking - Low | 61 |
| 6 | Linear crack - High | 372 |
| 7 | Linear crack - Low | 3,731 |
| 8 | Manhole - High | 20 |
| 9 | Manhole - Low | 484 |
| 10 | Patch - Low | 129 |
| 11 | Pothole - High | 52 |
| 12 | Pothole - Low | 158 |
| 13 | Raveling - Low | 20 |
| 14 | Weathering - High | 95 |
| 15 | Weathering - Low | 626 |
| — | **TOTAL** | **7,133** |

### 6.3 WS v2.0 — 17 Classes (severity-labelled)

| Class ID | Class Name | Measured Count |
|---|---|---|
| 0 | Alligator crack - High | 215 |
| 1 | Alligator crack - Low | 2,489 |
| 2 | Block crack - High | 14 |
| 3 | Block crack - Low | 44 |
| 4 | Faded marking - High | 630 |
| 5 | Faded marking - Low | 733 |
| 6 | Lane shoulder drop-off - High | 348 |
| 7 | Linear crack - High | 702 |
| 8 | Linear crack - Low | 3,494 |
| 9 | Patch and utility cut- High | 41 |
| 10 | Patch and utility cut- Low | 705 |
| 11 | Pothole - High | 58 |
| 12 | Pothole - Low | 257 |
| 13 | Raveling - High | 11 |
| 14 | Raveling - Low | 329 |
| 15 | Weathering - High | 534 |
| 16 | Weathering - Low | 1,106 |
| — | **TOTAL** | **11,710** |

---

## 7. Linear Crack Investigation (Rule 1 Compliance)

### 7.1 Summary

> [!CAUTION]
> **`Linear crack` is a combined longitudinal + transverse crack class. No directional information is encoded anywhere in the archive. Rule 1 (do not silently map generic linear crack to D00) applies to all three Attain releases.**

### 7.2 Annotation-Level Evidence

**OS v1.0 and WS v1.0 (TXT format):**
- Each row contains only: `class_id` + normalized polygon/bbox coordinates
- No attributes, metadata, comments, or sub-labels exist in TXT files
- No separate files encode orientation
- **Conclusion:** Zero orientation information available from annotations

**WS v2.0 (XML format):**
- Standard Pascal VOC XML fields: `<name>`, `<pose>`, `<truncated>`, `<difficult>`, `<occluded>`, `<bndbox>`
- `<pose>` field value is **always "Unspecified"** — no directional information
- No custom attributes or child elements distinguish longitudinal vs transverse
- **Conclusion:** Zero orientation information available from annotations

### 7.3 Linear Crack Counts Across All Releases

| Release | Linear crack category | Count |
|---|---|---|
| OS v1.0 | Linear crack (combined) | 720 |
| WS v1.0 | Linear crack - High (combined) | 372 |
| WS v1.0 | Linear crack - Low (combined) | 3,731 |
| WS v2.0 | Linear crack - High (combined) | 702 |
| WS v2.0 | Linear crack - Low (combined) | 3,494 |
| **TOTAL** | | **9,019** |

### 7.4 Rule 1 Classification Decision

**Rule 1 verdict: VIOLATED if mapped to D00 without manual review.**

Attain's `Linear crack` encompasses both longitudinal and transverse cracks without separation. Using this data to train a D00-only model would contaminate D00 with transverse examples, degrading model precision. 

**Two possible approaches:**
1. **Experiment A (Clean D00/D20):** Exclude all Attain `linear_crack` data. Use only Attain alligator crack data for D20 enrichment.
2. **Experiment B (Attain-inclusive):** Create a third class `linear_crack_generic` or accept the semantic ambiguity and train a merged `crack_direction_unknown` model. This diverges from the two-class D00/D20 architecture.

---

## 8. Alligator Crack Investigation (D20 Suitability)

### 8.1 Summary Table

| Release | Alligator variant | Count | RoadWise D20 mapping |
|---|---|---|---|
| OS v1.0 | Alligator crack | 198 | ✅ Direct — single consolidated class |
| WS v1.0 | Alligator crack - High | 62 | ✅ Merge to D20 |
| WS v1.0 | Alligator crack - Low | 479 | ✅ Merge to D20 |
| WS v1.0 | Alligator crack - low ⚠️ | 808 | ✅ Merge to D20 (after case bug fix) |
| WS v2.0 | Alligator crack - High | 215 | ✅ Merge to D20 |
| WS v2.0 | Alligator crack - Low | 2,489 | ✅ Merge to D20 |
| **TOTAL** | | **4,251** | ✅ All mergeable |

### 8.2 Case Inconsistency Bug in WS v1.0

The YAML and actual annotations both contain two separate class IDs for what is semantically the same class:
- Class ID 1: `"Alligator crack - Low"` (capital L) — 479 instances
- Class ID 2: `"Alligator crack - low"` (lowercase l) — 808 instances

This is a dataset error — not a semantic distinction. When re-mapping for RoadWise, both IDs must be consolidated into a single D20 class. Combined alligator-low count: **1,287 instances**.

### 8.3 D20 Total Available

| Source | D20 instances |
|---|---|
| OS v1.0 | 198 |
| WS v1.0 (all alligator variants, merged) | 1,349 |
| WS v2.0 (all alligator variants, merged) | 2,704 |
| **Attain total D20** | **4,251** |

**All alligator crack variants across all three releases are semantically appropriate for D20 mapping.** Unlike `linear_crack`, there is no ambiguity about alligator crack identity — this is a visually distinct defect type (interconnected cracking in a web pattern) universally defined the same way across pavement engineering standards.

---

## 9. Duplicate Analysis

### 9.1 Within-Release Duplicates

**OS v1.0:** 0 duplicate pairs. All 637 images have distinct SHA256 hashes.

**WS v1.0:** **4 duplicate image pairs** (8 files, 4 unique images):

| SHA256 prefix | Duplicate pair |
|---|---|
| `2584d477f690b2df` | v1_000250.jpg = v1_000251.jpg |
| `3abe01db5e912419` | v1_000591.jpg = v1_000593.jpg |
| `7524e455c9b8b1d8` | v1_000712.jpg = v1_000714.jpg |
| `a288157a14b3276a` | v1_000083.jpg = v1_000085.jpg |

WS v1.0 effective unique images: **805** (of 809 files).

> [!NOTE]
> Notably, duplicate image pairs in WS v1.0 are separated by one index (e.g., 083 and 085). This suggests consecutive frame duplication from a video capture system.

**WS v2.0:** 0 duplicate pairs. All 847 images have distinct SHA256 hashes.

### 9.2 Cross-Release Duplicates

| Comparison | Shared images |
|---|---|
| OS v1.0 ∩ WS v1.0 | **0** |
| OS v1.0 ∩ WS v2.0 | **0** |
| WS v1.0 ∩ WS v2.0 | **0** |
| All three releases | **0** |

**All three releases are completely disjoint image sets.** No cross-release duplicates exist.

**Total unique images across the entire Attain archive:** **2,289**

---

## 10. YAML Configuration Discrepancies

| Release | YAML nc | Actual distinct classes | Match |
|---|---|---|---|
| OS v1.0 | 2 | 2 | ✅ |
| WS v1.0 | 16 | 16 | ✅ |
| WS v2.0 | 17 | 17 | ✅ |

**Train/val/test split paths** in all three YAMLs reference `../train`, `../val`, `../test` — but the archive contains no such subdirectories. There is no train/val/test split in this archive. All images are stored flat in a single `Images/` folder. The YAML paths are **invalid relative to the actual archive structure**.

> [!WARNING]
> The YAML `train`/`val`/`test` path references are non-functional. The dataset has **no pre-defined train/val/test split**. Any user of this dataset must create their own split before training.

---

## 11. Licence and Source Attribution

### 11.1 Archive Contents

No `LICENSE`, `README`, `NOTICE`, or similar files exist inside `Attain.zip`. Attribution is limited to what appears in the three YAML files:

```yaml
# copyright: "© 2025 Attain Lab"
# credit: "Dataset created by Attain Lab. For more information, visit the website."
# website: https://attain.aut.ac.ir/Datasets
```

### 11.2 Expected Licence (from Mendeley Data publication)

The archive was obtained from Mendeley Data DOI: `10.17632/nykrzdm74f.1`. Mendeley Data datasets are typically published under **CC BY 4.0** (Creative Commons Attribution 4.0 International), which permits:
- Use, distribution, and adaptation for any purpose (including commercial)
- Requirement: attribution to Attain Lab / cite the Mendeley Data entry

> [!IMPORTANT]
> **Licence status: Unverified from archive contents alone.** The licence must be confirmed by checking the Mendeley Data publication page (DOI: `10.17632/nykrzdm74f.1`). Do not publish or redistribute the dataset until the licence is confirmed.

---

## 12. Per-Release RoadWise Suitability Assessment

### 12.1 OS v1.0 — Suitability: ⭐⭐⭐⭐ HIGH (for D20 only)

| Dimension | Assessment |
|---|---|
| D20 (Alligator crack) | ✅ 198 instances — high-quality polygon annotations |
| D00 (Longitudinal crack) | ❌ Not separable — `Linear crack` is mixed (D00 + D10 combined) |
| Annotation quality | ✅ YOLO polygon segmentation — highest geometric precision |
| Coordinate validity | ✅ All 918 instances valid |
| Empty files | ⚠️ 103/637 (16.2%) — high negative sample rate |
| Image uniformity | ✅ All 640×640 |
| **Usable D20 instances** | **198** |
| **Recommendation** | Use for D20 enrichment. Exclude `linear_crack` from D00 training without manual annotation review. |

### 12.2 WS v1.0 — Suitability: ⭐⭐⭐ MODERATE (D20 usable; D00 excluded under Rule 1)

| Dimension | Assessment |
|---|---|
| D20 (Alligator crack) | ✅ 1,349 instances (all severity variants merged) |
| D00 (Longitudinal crack) | ❌ Rule 1: `Linear crack` is semantically mixed |
| Annotation quality | ⚠️ **Mixed polygon + bbox in same release** — format inconsistency |
| Coordinate validity | ✅ All coordinates in [0,1] |
| Case bug | ⚠️ Two separate class IDs for "Alligator crack - Low" (capitalization error) — requires merge |
| Within-release duplicates | ⚠️ 4 duplicate image pairs — deduplicate before use |
| Empty files | ✅ Low (14/809, 1.7%) |
| Image uniformity | ✅ All 640×640 |
| **Usable D20 instances** | **1,349** (after consolidating "Low"/"low" and dedup) |
| **Recommendation** | Use for D20 enrichment after: (1) merging case-bug classes, (2) deduplication, (3) deciding on bbox vs polygon format for training. Exclude linear crack from D00. |

### 12.3 WS v2.0 — Suitability: ⭐⭐⭐ MODERATE (D20 usable; significant preprocessing required)

| Dimension | Assessment |
|---|---|
| D20 (Alligator crack) | ✅ 2,704 instances (all severity variants merged) |
| D00 (Longitudinal crack) | ❌ Rule 1: `Linear crack` is semantically mixed |
| Annotation format | ⚠️ Pascal VOC XML — requires conversion to YOLO normalized format |
| Coordinate validity | ❌ **707/11,710 bboxes (6.0%) exceed image boundaries** — must clip or discard |
| Image dimensions | ⚠️ Three different aspect ratios (1479×508, 1920×1080, 640×640) — requires preprocessing |
| **Usable D20 instances** | **~2,543** (estimated after removing ~6% invalid boxes and proportional D20 share) |
| **Recommendation** | Highest D20 volume but requires most preprocessing. Prioritize only if WS v1.0 + OS v1.0 D20 is insufficient. Invalid bboxes must be clipped (not silently dropped) to preserve valid portion. |

---

## 13. Experiment A vs Experiment B Comparison

### Experiment A — Clean D00/D20 (Recommended)

**Strategy:** Use Attain only for D20 (alligator crack) enrichment. Exclude all `linear_crack` data.

| Class | Attain contribution |
|---|---|
| D00 (Longitudinal crack) | ❌ 0 (no clean D00 source in Attain) |
| D20 (Alligator crack) | ✅ Up to **4,251 instances** across all releases |

**Pros:**
- Rule 1 compliant — no contamination of D00 with transverse cracks
- Alligator crack data is clean and directly mappable
- Significantly boosts D20 training data (current RDD2022 baseline: 2,021 D20 boxes)

**Cons:**
- Does not help with D00 at all — D00 enrichment must come from McMaster or manual annotation
- Loses 9,019 linear crack annotations

### Experiment B — Attain-Inclusive (Generic Linear Crack)

**Strategy:** Accept `linear_crack` as a third "generic crack" class in the architecture. Rename it `linear_crack_mixed` or `crack_unclassified`.

| Class | Attain contribution |
|---|---|
| D00 (Longitudinal crack) | ❌ Not separable as pure D00 |
| D20 (Alligator crack) | ✅ 4,251 instances |
| linear_crack_mixed | ⚠️ 9,019 instances (D00 + D10 semantically mixed) |

**Pros:**
- Maximizes use of available annotation data
- 9,019 additional annotated instances

**Cons:**
- Fundamentally changes the two-class crack architecture
- The model would not differentiate D00 from D10 — contrary to project goals
- End-user inspection reports could not distinguish longitudinal from transverse cracks
- Contradicts the established project strategy

---

## 14. Final Recommendations

### 14.1 Architecture Recommendation: Experiment A

**Recommended:** Use Attain exclusively for **D20 alligator crack enrichment**. Do not use `linear_crack` data for any directional crack class without manual re-annotation.

**Rationale:**
1. Rule 1 strictly prohibits mapping generic `linear_crack` to D00 — this would introduce transverse crack examples into the longitudinal training set
2. Alligator crack annotations are clean, unambiguous, and directly mappable to D20
3. The D20 gain is substantial: 4,251 instances from Attain vs. 2,021 from RDD2022 India baseline

### 14.2 Recommended Attain Data for Crack Model Training

| Priority | Release | D20 instances | Key preprocessing steps |
|---|---|---|---|
| 1st | OS v1.0 | 198 | Use as-is (polygons, all valid, uniform 640×640) |
| 2nd | WS v1.0 | 1,349 | Merge "low"/"Low" class IDs; remove 4 duplicate images; decide bbox vs polygon format |
| 3rd | WS v2.0 | ~2,543 | Convert XML to YOLO; clip invalid bboxes; handle multi-resolution images |

**Total projected D20 instances from Attain:** ~4,090 usable (after preprocessing)

### 14.3 Preprocessing Requirements Before Use

Before any Attain data can enter the training pipeline:

1. **OS v1.0:** No structural preprocessing needed. Format conversion from YOLO segmentation to YOLO detection (convert polygon to bbox) if using detection model (not segmentation).
2. **WS v1.0:**
   - Merge class IDs 1 and 2 (`Alligator crack - Low` + `Alligator crack - low`) into a single D20 class
   - Remove 4 duplicate image pairs (keep one of each: 000083, 000250, 000591, 000712)
   - Standardize annotation format: convert polygon rows to bbox (or use segmentation training)
3. **WS v2.0:**
   - Convert Pascal VOC XML to YOLO normalized bbox format
   - Clip bounding box coordinates to image boundaries (`max(0, xmin)`, `min(w, xmax)`, etc.)
   - Handle or discard the 1 instance with `xmin >= xmax`
   - Decide how to handle multi-resolution images (resize all to 640×640 or use rect training)

### 14.4 D00 Gap Remains

Attain provides no clean D00 data. The D00 enrichment strategy must rely on:
- McMaster dataset (if acquired) — reported ~2,100 D00 instances
- RDD2022 India — 1,555 D00 instances (existing baseline)

This is an open gap. D00 enrichment from McMaster should be treated as the next dataset acquisition priority.

---

## 15. Data Quality Summary

| Issue | Release(s) | Severity | Impact |
|---|---|---|---|
| `linear_crack` is semantically ambiguous (D00+D10 mixed) | All three | 🔴 Critical | Cannot use for D00 training |
| 707 bounding boxes exceed image boundaries (6.0%) | WS v2.0 | 🟠 High | Must clip before training |
| Mixed polygon + bbox format in same release | WS v1.0 | 🟠 High | Format conversion required |
| Case inconsistency (`Low` vs `low`) in Alligator class | WS v1.0 | 🟡 Medium | Easy to fix by merge at ID level |
| 103 empty annotation files (16.2%) | OS v1.0 | 🟡 Medium | Negative samples — usable but high ratio |
| No train/val/test split defined | All three | 🟡 Medium | Must create split during preparation |
| 4 duplicate image pairs | WS v1.0 | 🟢 Low | Easy to remove by SHA256 |
| Multi-resolution images (3 aspect ratios) | WS v2.0 | 🟡 Medium | Preprocessing required |
| No README/LICENSE file in archive | All three | 🟡 Medium | Licence must be confirmed externally |

---

## 16. YAML Verification Table

| Property | OS v1.0 YAML | Measured | Match |
|---|---|---|---|
| nc | 2 | 2 | ✅ |
| Image count | 637 | 637 | ✅ |
| Alligator crack | 198 | 198 | ✅ |
| Linear crack | 720 | 720 | ✅ |
| Image dimensions | 640×640 | 640×640 | ✅ |

| Property | WS v1.0 YAML | Measured | Match |
|---|---|---|---|
| nc | 16 | 16 | ✅ |
| Image count | 809 | 809 | ✅ |
| Total instances | 7,133 | 7,133 | ✅ |
| Image dimensions | 640×640 | 640×640 | ✅ |

| Property | WS v2.0 YAML | Measured | Match |
|---|---|---|---|
| nc | 17 | 17 | ✅ |
| Image count | 847 | 847 | ✅ |
| Total instances | 11,710 | 11,710 | ✅ |
| Image dimensions | "640×640, 1479×508" | 640×640, 1479×508, 1920×1080 | ⚠️ YAML missing 1920×1080 |

> [!NOTE]
> WS v2.0 YAML reports only two image dimension types but 275 images (32.5% of the release) are 1920×1080. The YAML metadata is **incomplete** regarding image dimensions.

---

## 17. Appendix — Measured Counts Reference

### Total Attain D20 (Alligator Crack) Available for RoadWise

| Release | Class | Count |
|---|---|---|
| OS v1.0 | Alligator crack | 198 |
| WS v1.0 | Alligator crack - High | 62 |
| WS v1.0 | Alligator crack - Low (capital) | 479 |
| WS v1.0 | Alligator crack - low (lowercase) | 808 |
| WS v2.0 | Alligator crack - High | 215 |
| WS v2.0 | Alligator crack - Low | 2,489 |
| **GRAND TOTAL** | | **4,251** |

### Total Attain Linear Crack (EXCLUDED under Rule 1 from D00)

| Release | Class | Count |
|---|---|---|
| OS v1.0 | Linear crack | 720 |
| WS v1.0 | Linear crack - High | 372 |
| WS v1.0 | Linear crack - Low | 3,731 |
| WS v2.0 | Linear crack - High | 702 |
| WS v2.0 | Linear crack - Low | 3,494 |
| **GRAND TOTAL** | | **9,019** |

### Archive Completeness

| Item | Count |
|---|---|
| Total ZIP entries | 4,589 |
| Total images | 2,293 |
| Total annotation files | 2,293 |
| Pairing completeness | 100% |
| Total annotation instances | 19,761 |
| Total unique images (after dedup) | 2,289 |

---

*Report generated by automated forensic inspection. All figures measured from actual archive contents. No data was extracted, modified, or moved during this inspection. The source archive `data/raw/Attain/Attain.zip` remains unchanged.*

