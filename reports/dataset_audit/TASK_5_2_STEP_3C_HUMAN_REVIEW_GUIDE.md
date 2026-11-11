# TASK 5.2 STEP 3C — HUMAN REVIEW WORKFLOW & AUDIT GUIDE

**Project:** RoadWise — AI-Powered Road Inspection System  
**Task:** 5.2 Step 3C — Human Review and Annotation Policy Finalization  
**Date:** 2026-11-09  
**Analyst:** Antigravity (automated workflow preparation & indexing)  
**Status:** READY FOR HUMAN REVIEW — Awaiting human decisions on 240 samples  

---

## 1. Overview & Objective

Following the forensic analysis and targeted rendering in Step 3B, **automated inspections are complete**. Under RoadWise engineering standards, **automated heuristic checks cannot substitute for human ground-truth verification**.

This guide outlines the structured human-review workflow for **240 sampled candidate images** across McMaster v2 and Attain (OS v1.0, WS v1.0, WS v2.0). Its purpose is to record authentic human determinations on whether each sampled annotation is:
- **CORRECT:** Genuine road defect matching the assigned class, correctly oriented, with an acceptable bounding box or polygon.
- **QUESTIONABLE:** Ambiguous feature (e.g. possible construction seam, diagonal crack, or excessive background pavement enclosed).
- **INCORRECT:** Mislabeled defect (e.g. lane paint labeled as crack, transverse labeled as longitudinal, or non-road area).
- **UNABLE_TO_DETERMINE:** Low resolution, occlusion, or visual ambiguity preventing a confident assessment.

---

## 2. Review Infrastructure & Available Tools

Reviewers have access to three complementary inspection tools:

### Tool A: Interactive Web Interface (Recommended)
- **Path:** [`reports/dataset_audit/review_interface.html`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/reports/dataset_audit/review_interface.html)
- **Features:**
  - Side-by-side synchronized view: raw original image vs annotated bounding box overlay.
  - Filterable by dataset subset (McMaster D00, D10, D20; Attain OS v1.0, WS v1.0, WS v2.0) and review status (Pending vs Reviewed).
  - Quick decision buttons and keyboard shortcuts:
    - <kbd>1</kbd>: CORRECT
    - <kbd>2</kbd>: QUESTIONABLE
    - <kbd>3</kbd>: INCORRECT
    - <kbd>4</kbd>: UNABLE TO DETERMINE
    - <kbd>←</kbd> / <kbd>→</kbd>: Previous / Next Sample
  - Direct links to the full 5-column contact sheets for broader context.
  - Automatic progress saving to local storage.
  - **1-Click Export:** Clicking `💾 Export CSV` generates an updated review CSV reflecting all human decisions.

### Tool B: Working Human-Review CSV
- **Path:** [`reports/dataset_audit/TASK_5_2_STEP_3C_HUMAN_REVIEW.csv`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/reports/dataset_audit/TASK_5_2_STEP_3C_HUMAN_REVIEW.csv)
- **Structure:** 240 rows initialized to `PENDING`.
- **Columns for Human Input:**
  - `human_decision`: `PENDING` | `CORRECT` | `QUESTIONABLE` | `INCORRECT` | `UNABLE_TO_DETERMINE`
  - `orientation_correctness`: `CORRECT` | `AMBIGUOUS` | `INCORRECT` | `CONSTRUCTION_SEAM` | `N/A`
  - `bbox_quality`: `TIGHT` | `OVERSIZED` | `UNDERSIZED` | `EDGE_SLIVER` | `CLIPPING_ERROR`
  - `damage_coverage`: `COMPLETE` | `PARTIAL` | `INCLUDES_UNDAMAGED` | `MISLABELED`
  - `human_reviewer_notes`: Freeform reviewer rationale.
  - `reviewer_id`: Initials or username.
  - `review_date`: YYYY-MM-DD.

### Tool C: High-Resolution Contact Sheets
- **McMaster:**
  - [`contact_sheet_Longitudinal_crack.jpg`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/reports/dataset_audit/mcmaster_targeted_sampling/contact_sheet_Longitudinal_crack.jpg) (50 samples)
  - [`contact_sheet_Transverse_crack.jpg`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/reports/dataset_audit/mcmaster_targeted_sampling/contact_sheet_Transverse_crack.jpg) (50 samples)
  - [`contact_sheet_Alligator_crack.jpg`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/reports/dataset_audit/mcmaster_targeted_sampling/contact_sheet_Alligator_crack.jpg) (50 samples)
- **Attain:**
  - [`contact_sheet_OS_V1.0.jpg`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/reports/dataset_audit/attain_targeted_sampling/contact_sheet_OS_V1.0.jpg) (30 samples)
  - [`contact_sheet_WS_V1.0.jpg`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/reports/dataset_audit/attain_targeted_sampling/contact_sheet_WS_V1.0.jpg) (30 samples)
  - [`contact_sheet_WS_V2.0.jpg`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/reports/dataset_audit/attain_targeted_sampling/contact_sheet_WS_V2.0.jpg) (30 samples)

---

## 3. Specific Visual Audit Criteria

Reviewers must apply the following specific criteria when evaluating each class subset:

### 3.1 McMaster D00 — Longitudinal Crack (Samples #1 – #50)
- **Longitudinal Orientation:** Does the crack run approximately parallel (within ~30°) to the roadway direction / lane markings?
- **Construction Seams vs Cracks:** Look closely at straight lines separating pavement passes. Construction seams exhibit smooth, straight edges and often follow lane dividers. Genuine longitudinal cracks are irregular, jagged, and show asphalt matrix breakdown. Flag construction seams as `QUESTIONABLE` or `CONSTRUCTION_SEAM`.
- **Bounding Box Tightness:** Does the box tightly bound the crack? Note: Cracks spanning the entire vertical dimension of a tile are expected and valid.
- **Lane Markings and Shadows:** Ensure white or yellow paint stripes, tire skid marks, or power line shadows are not mistakenly enclosed as cracks.

### 3.2 McMaster D10 — Transverse Crack (Samples #51 – #100)
- **Transverse Orientation:** Does the crack cross the road perpendicular (within ~30° of horizontal) to the direction of vehicle travel?
- **Misclassified Longitudinal:** Check that longitudinal branches or vertical cracks are not falsely labeled as transverse.
- **Tile Boundary Slivers:** Check whether the box is an edge sliver (`h < 0.03` / < 19 pixels) where a crack barely touches the image boundary. Flag as `EDGE_SLIVER`.
- **Ladder Cracking:** Check whether multiple parallel transverse cracks are clustered together or forming early fatigue blocks.

### 3.3 McMaster D20 — Alligator Crack (Samples #101 – #150)
- **Interconnected Web Structure:** Does the region show interconnected fatigue cracking with small polygonal blocks (typically 5–20 cm)?
- **Block Cracking Distinction:** If the blocks are large (e.g. > 30 cm) and rectangular, it is block cracking, not true alligator fatigue cracking.
- **Excessive Sound Asphalt:** Alligator patches are often irregular or diagonal. Check if the rectangular box encloses > 40% undamaged asphalt.
- **Repair Interaction:** Check if the cracking is occurring inside a patched area or adjacent to a patch.

### 3.4 Attain D20 — Alligator Crack Across Releases
- **OS v1.0 (Samples #151 – #180):**
  - Verify polygon accuracy: Does the polygon boundary closely trace the outer perimeter of the alligator cluster?
  - Verify absence of non-damaged road in the polygon.
- **WS v1.0 (Samples #181 – #210):**
  - Evaluate mixed format: Compare polygonal annotations against rectangular bounding boxes.
  - Check whether low-severity fatigue is distinguishable from background texture.
- **WS v2.0 (Samples #211 – #240):**
  - Check XML coordinate alignment: Confirm whether boxes that touch the right or bottom image border clip valid damage or extend beyond image boundaries.
  - Multi-resolution check: Note if damage resolution appears altered across 640×640 vs 1479×508 vs 1920×1080 native images.

---

## 4. Sample Index Breakdown (240 Total Samples)

| Subset ID | Dataset | Release | Class / Target | Sample ID Range | Contact Sheet |
|---|---|---|---|:---:|---|
| **MC_D00** | McMaster | v2 | Longitudinal crack (D00) | #1 – #50 | `contact_sheet_Longitudinal_crack.jpg` |
| **MC_D10** | McMaster | v2 | Transverse crack (D10) | #51 – #100 | `contact_sheet_Transverse_crack.jpg` |
| **MC_D20** | McMaster | v2 | Alligator crack (D20) | #101 – #150 | `contact_sheet_Alligator_crack.jpg` |
| **ATT_OS** | Attain | OS v1.0 | Alligator crack (D20) | #151 – #180 | `contact_sheet_OS_V1.0.jpg` |
| **ATT_WS1** | Attain | WS v1.0 | Alligator crack (D20) | #181 – #210 | `contact_sheet_WS_V1.0.jpg` |
| **ATT_WS2** | Attain | WS v2.0 | Alligator crack (D20) | #211 – #240 | `contact_sheet_WS_V2.0.jpg` |

---

## 5. Review Execution Instructions

1. **Open the Review Tool:**
   - Double-click or open [`reports/dataset_audit/review_interface.html`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/reports/dataset_audit/review_interface.html) in any modern browser (Chrome, Edge, Firefox).
2. **Review by Subsets:**
   - Use the top toolbar filter buttons (`McMaster D00`, `McMaster D10`, etc.) to review related classes in batches.
3. **Record Determinations:**
   - Press <kbd>1</kbd> for Correct, <kbd>2</kbd> for Questionable, <kbd>3</kbd> for Incorrect, or select from the UI.
   - For questionable or incorrect items, add a short explanation in the Notes box (e.g., "Construction joint along lane line", "Diagonal crack, not perpendicular").
4. **Export Findings:**
   - When finished or pausing, click the **💾 Export CSV** button at the top right to download `TASK_5_2_STEP_3C_HUMAN_REVIEW_UPDATED.csv`.
   - Replace or update `TASK_5_2_STEP_3C_HUMAN_REVIEW.csv` with the exported file to persist your determinations.

---

*Guide prepared for RoadWise Task 5.2 Step 3C. All raw data remains strictly unmodified.*

