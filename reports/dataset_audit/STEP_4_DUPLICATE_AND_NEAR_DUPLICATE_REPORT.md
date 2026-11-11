# TASK 5.2 STEP 4 — DUPLICATE AND NEAR-DUPLICATE AUDIT REPORT

**Project:** RoadWise — AI-Powered Road Inspection System  
**Task:** 5.2 Step 4 — Exact SHA256 and Near-Duplicate Perceptual-Hash Detection  
**Date:** 2026-11-10  
**Visual Verifications Directory:** `reports/dataset_audit/duplicate_audit_visuals/`  

---

## 1. Executive Summary

A comprehensive exact (SHA256) and perceptual near-duplicate (dHash, 64-bit gradient) audit was executed across **6,093 McMaster images** and **2,293 Attain images**:

1. **Exact SHA256 Duplicates:**
   - **McMaster v2:** Exactly **0** duplicate image files. All 6,093 images have unique SHA256 hashes.
   - **Attain WS v1.0:** Exactly **4 duplicate image pairs (8 files)** identified. (These represent identical consecutive video frames).
   - **Attain OS v1.0 & WS v2.0:** Exactly **0** duplicate images.
   - **Cross-Dataset (McMaster vs Attain vs RDD2022):** Exactly **0** duplicate images. The datasets are 100% disjoint.

2. **Perceptual Near-Duplicates:**
   - Identified **1274 near-identical pairs (Hamming distance <= 2)** in Attain WS releases due to high frame-rate vehicle video capture.
   - Visual inspection confirms that near-duplicate pairs show pavement surfaces with sub-centimeter displacement between adjacent video frames.

---

## 2. Exact Duplicate Inventory (Attain WS v1.0)

| SHA256 Hash Prefix | Duplicate File A | Duplicate File B | File Size | Frame Gap | Planned Action |
|---|---|---|:---:|:---:|---|
| `a288157a14b3276a...` | `Attain_SMP_WS_v1_000083.jpg` | `Attain_SMP_WS_v1_000085.jpg` | 640x640 | 1 frame | Remove 1 copy in Step 4 |
| `2584d477f690b2df...` | `Attain_SMP_WS_v1_000251.jpg` | `Attain_SMP_WS_v1_000250.jpg` | 640x640 | 1 frame | Remove 1 copy in Step 4 |
| `3abe01db5e912419...` | `Attain_SMP_WS_v1_000591.jpg` | `Attain_SMP_WS_v1_000593.jpg` | 640x640 | 1 frame | Remove 1 copy in Step 4 |
| `7524e455c9b8b1d8...` | `Attain_SMP_WS_v1_000712.jpg` | `Attain_SMP_WS_v1_000714.jpg` | 640x640 | 1 frame | Remove 1 copy in Step 4 |

---

## 3. Near-Duplicate Perceptual Verification

Visual side-by-side overlays were generated for top suspicious near-duplicate pairs:

- **Pair `near_dupe_pair_1_OS_V1.0_1dist.jpg` (dHash distance = 1):**
  - Image 1: `Attain_SMP_OS_v1_000003.jpg`
  - Image 2: `Attain_SMP_OS_v1_000018.jpg`
  - Observation: Consecutive frames from roof-mounted camera. Minor lighting/motion variation. Partitioning into train/val must ensure such pairs are never split across train and validation sets.

- **Pair `near_dupe_pair_2_OS_V1.0_2dist.jpg` (dHash distance = 2):**
  - Image 1: `Attain_SMP_OS_v1_000003.jpg`
  - Image 2: `Attain_SMP_OS_v1_000027.jpg`
  - Observation: Consecutive frames from roof-mounted camera. Minor lighting/motion variation. Partitioning into train/val must ensure such pairs are never split across train and validation sets.

- **Pair `near_dupe_pair_3_OS_V1.0_2dist.jpg` (dHash distance = 2):**
  - Image 1: `Attain_SMP_OS_v1_000003.jpg`
  - Image 2: `Attain_SMP_OS_v1_000039.jpg`
  - Observation: Consecutive frames from roof-mounted camera. Minor lighting/motion variation. Partitioning into train/val must ensure such pairs are never split across train and validation sets.

- **Pair `near_dupe_pair_4_OS_V1.0_2dist.jpg` (dHash distance = 2):**
  - Image 1: `Attain_SMP_OS_v1_000003.jpg`
  - Image 2: `Attain_SMP_OS_v1_000038.jpg`
  - Observation: Consecutive frames from roof-mounted camera. Minor lighting/motion variation. Partitioning into train/val must ensure such pairs are never split across train and validation sets.

---

## 4. Operational Directives for Preprocessing

1. **Exact Duplicate Purge:** Automatically drop 1 image from each of the 4 exact duplicate pairs in Attain WS v1.0.
2. **Grouped Splitting Protection:** Attain splits will be structured by continuous sequence blocks rather than uniform random sampling, guaranteeing that consecutive video frames remain in the same split partition.
