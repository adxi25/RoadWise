# TASK 5.2 STEP 3C — ROAD DAMAGE ANNOTATION POLICY

**Project:** RoadWise — AI-Powered Road Inspection System  
**Task:** 5.2 Step 3C — Annotation Policy Finalization  
**Date:** 2026-11-09  
**Status:** DRAFT FOR HUMAN APPROVAL — Awaiting formal user sign-off before Task 5.2 Step 4  

---

## 1. Purpose & Scope

This document defines the formal annotation standards, semantic boundaries, and filtering policies for the RoadWise crack detection model.

During Tasks 5.2 Step 2B, Step 3, and Step 3B, multiple structural and semantic edge cases were identified across the candidate datasets (McMaster v2 and Attain releases). To ensure the unified crack detection dataset is consistent, robust, and free from training noise, this policy establishes explicit rules governing seven fundamental annotation dilemmas.

---

## 2. Policy Decisions

### Decision 1: Distinguishing Longitudinal Cracks (D00) from Pavement Construction Joints

**The Problem:**
In asphalt paving, adjacent asphalt passes produce cold construction joints (longitudinal seams) that run parallel to the lane line. In McMaster v2 aerial tiles (e.g. sample `0121_6_7_JPG` and `0132_4_5_JPG`), straight longitudinal seams are occasionally annotated as D00 cracks. If trained on healthy construction joints, the model will produce false-positive damage alerts along standard lane boundaries.

**Standard Policy:**
1. **True Longitudinal Crack (D00):** Must exhibit physical structural failure characterized by:
   - Jagged, meandering, non-linear crack propagation.
   - Visible material breakdown, micro-spalling, or edge raveling along the fracture.
   - Propagation anywhere within the lane (wheel path or centerline) without strictly conforming to an artificial straight line.
2. **Construction Joint / Seam (Non-Damage):**
   - Characterized by a perfectly straight, uniform line separating distinct paving lifts or passes.
   - Smooth edges with no asphalt raveling or crack depth.
   - Follows consistent lane or shoulder boundary offsets.
3. **Filtering Action:**
   - Any candidate sample whose annotation traces a healthy, sealed, or undamaged longitudinal construction joint **must be rejected** from the D00 training set.
   - If a construction joint has actively deteriorated (opened with spalling and secondary cracking), it qualifies as a D00 distress.

---

### Decision 2: Determining Longitudinal (D00) vs Transverse (D10) Orientation

**The Problem:**
Cracks propagate in non-ideal geometric angles. Aerial and vehicle camera perspectives, road curvature, and intersection aprons create ambiguity between what is longitudinal and what is transverse.

**Standard Policy:**
Orientation is strictly defined relative to the **primary direction of vehicular travel (the roadway centerline / lane markings)**:

```
          ROADWAY TRAVEL DIRECTION (0°)
                      ▲
                      │   [D00 Longitudinal]
          0° to 30°   │   (Parallel to travel)
                      │
          ────────────┼────────────
                      │   [Oblique / Ambiguous]
         30° to 60°   │   (Excluded from D00 & D10)
                      │
          ────────────┼────────────
                      │   [D10 Transverse]
         60° to 90°   │   (Perpendicular to travel)
                      ▼
```

1. **D00 (Longitudinal):** Angle of main crack axis is **within 0° to 30°** relative to road travel. Aspect ratio typically exhibits `Height > Width` in top-down bird's-eye tiles.
2. **D10 (Transverse):** Angle of main crack axis is **within 60° to 90°** relative to road travel. Aspect ratio typically exhibits `Width > Height`.
3. **Ambiguous Range (30° to 60°):** Cracks in this intermediate zone are classified as diagonal/oblique. **They must not be forced into either D00 or D10.**
4. **Curvature Exception:** In curved sections or roundabouts, the local tangent of the lane line governs the angle calculation.

---

### Decision 3: Policy on Tiny Edge Bounding Boxes (Slivers)

**The Problem:**
In tiled datasets like McMaster v2, 68 bounding boxes have a width or height `< 3%` of the image dimension (< 19 pixels at 640×640). These occur when a crack runs off the edge of a tile, leaving only a few boundary pixels in the neighboring tile.

**Standard Policy:**
1. **Minimum Dimension Threshold:** Any bounding box with **normalized width `< 0.02` OR normalized height `< 0.02`** (< 12.8 pixels at 640×640) will be **filtered out** during dataset preparation.
2. **Rationale:**
   - Feature maps at deeper YOLO convolutional layers (e.g., P4/P5 stride 16 and 32) reduce a 12-pixel box to less than a single cell on the grid.
   - Attempting to regress sub-pixel bounding box loss destabilizes anchor assignment and introduces false gradient spikes.
   - Tiny edge slivers carry negligible semantic crack information and risk training the detector to trigger on boundary artifacts.

---

### Decision 4: Conversion of Polygonal Annotations to Bounding Boxes

**The Problem:**
Attain OS v1.0 and WS v1.0 contain high-precision polygon segmentation annotations (N-point coordinate pairs), whereas McMaster and YOLO detection models require standard bounding box format (`cx, cy, w, h`).

**Standard Policy:**
1. **Target Architecture Alignment:**
   - The primary RoadWise crack model is an **object detection** model (YOLOv8 bounding boxes).
2. **Minimum Bounding Rectangle Conversion:**
   - For all polygonal annotations in Attain OS v1.0 and WS v1.0, compute the enclosing axis-aligned bounding box:
     $$\text{xmin} = \min(x_0, x_1, \dots, x_n), \quad \text{xmax} = \max(x_0, x_1, \dots, x_n)$$
     $$\text{ymin} = \min(y_0, y_1, \dots, y_n), \quad \text{ymax} = \max(y_0, y_1, \dots, y_n)$$
   - Convert to normalized center-width-height:
     $$\text{cx} = \frac{\text{xmin} + \text{xmax}}{2}, \quad \text{cy} = \frac{\text{ymin} + \text{ymax}}{2}$$
     $$w = \text{xmax} - \text{xmin}, \quad h = \text{ymax} - \text{ymin}$$
3. **Preservation Rule:**
   - Raw polygonal source files remain preserved in `data/raw/Attain/`. Converted bounding boxes are emitted exclusively into the processed preparation directories.

---

### Decision 5: Handling Oversized Alligator Crack (D20) Bounding Boxes

**The Problem:**
Visual audit revealed that rectangular bounding boxes around irregular or diagonal alligator crack patches often enclose 30% to 50% sound, undamaged asphalt (e.g. McMaster sample `1113_4_4_JPG`). In other cases, a single massive box spans several detached alligator clusters.

**Standard Policy:**
1. **Cluster Boundary Rule:**
   - A single bounding box is valid for an alligator crack cluster if the interconnected cell network is continuous across the cluster.
2. **Separation Rule (Multi-Cluster):**
   - If two distinct alligator patches are separated by more than **0.15 normalized image width (> 100 pixels)** of sound asphalt, they must not be grouped into a single monolithic box.
3. **Sound Pavement Area Ceiling:**
   - Bounding boxes whose area exceeds `0.70` of the entire image (`area > 0.70`) should be reviewed. If the box simply captures an entire intersection or includes large swaths of undamaged pavement, it must be subdivided or quarantined.

---

### Decision 6: Exclusion of Oblique Cracks from Canonical Architecture

**The Problem:**
McMaster contains 337 annotations labeled `Oblique crack`. Step 3B visual inspection showed that several oblique crack annotations coincided with diagonal painted markings or sidewalk seams. Furthermore, mapping them arbitrarily to D00 or D10 violates RoadWise Core Rules 1 and 2.

**Standard Policy:**
1. **Canonical Experiment A (D00 Longitudinal + D10 Transverse + D20 Alligator):**
   - **Oblique crack is EXCLUDED.**
2. **Experiment C Baseline (D00 + D20):**
   - **Oblique crack is EXCLUDED.**
3. **Experimental Cohort Only (Experiment B):**
   - If an exploratory unified "Linear Crack" model is evaluated in future research, oblique cracks may be considered *only after* manual validation filters out painted road marking artifacts.

---

### Decision 7: Quarantine and Rejection Protocol for Ambiguous / Incorrect Samples

**The Problem:**
Inevitably, some dataset candidates contain incorrect labels, severe blur, or out-of-domain scenes (such as sidewalks or curb pavers).

**Standard Policy:**
1. **Strict Quarantine Protocol:**
   - Samples flagged during human review as **`INCORRECT`** or **`UNABLE_TO_DETERMINE`** will **not be automatically repaired, relabeled, or guessed**.
   - Instead, the entire image and its corresponding annotations will be placed in a `quarantined_samples/` manifest and excluded from training and validation splits.
2. **Questionable Samples Protocol:**
   - Samples marked **`QUESTIONABLE`** will be excluded from the primary validation and test sets (to maintain a pristine evaluation benchmark). They may be retained in training only if approved by the project lead.

---

## 3. Summary of Policy Directives for Task 5.2 Step 4

| Dilemma | Approved Policy Directive |
|---|---|
| **Construction Joint vs D00** | Reject straight unspalled paving seams; retain only genuine meandering fracture D00. |
| **Orientation Cutoffs** | 0°–30° = D00 Longitudinal; 60°–90° = D10 Transverse; 30°–60° = Excluded Oblique. |
| **Tiny Edge Boxes** | Discard bounding boxes with width `< 0.02` or height `< 0.02` (< 13 pixels). |
| **Polygon Conversion** | Compute minimum bounding rectangle for all Attain polygons for YOLO detection. |
| **Oversized D20 Boxes** | Enforce cluster continuity; reject or subdivide boxes enclosing > 50% sound pavement. |
| **Oblique Crack Class** | Exclude all 337 Oblique crack instances from canonical RoadWise datasets. |
| **Ambiguous Samples** | Quarantine and discard; zero tolerance for synthetic or guessed ground truth. |

---

*Policy draft prepared for RoadWise Task 5.2 Step 3C. Requires formal user sign-off prior to dataset compilation in Step 4.*

