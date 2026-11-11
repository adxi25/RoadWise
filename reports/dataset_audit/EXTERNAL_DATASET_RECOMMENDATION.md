# RoadWise — Task 4.2: External Dataset Acquisition Strategy & Recommendations

**Date:** 2026-11-08  
**Document Status:** Final Strategic Acquisition Roadmap  
**Target Objective:** Resolve the critical Class 1 (D10 Transverse Crack) data deficit (currently 68 boxes in RDD2022 India) and reinforce Class 0 (D00 Longitudinal Crack) while maintaining the integrity of RoadWise's 4-class defect detector.

---

## 1. Prioritized Acquisition Classification

### Category Breakdown

```
+---------------------------------------------------------------------------------------------------+
| PRIORITY 1: ACQUIRE FIRST (Immediate Strategic Value)                                             |
| - CRDDC RDD2020 / RDD2022 (Czech Republic & Japan Subsets)                                       |
+---------------------------------------------------------------------------------------------------+
| PRIORITY 2: ACQUIRE SELECTIVELY (Requires Filtering / Re-Annotation / Deduplication)             |
| - McMaster Pavement Crack Detection (Roboflow Universe)                                          |
| - Attain Pavement Distress Dataset (Mendeley Data)                                                |
+---------------------------------------------------------------------------------------------------+
| PRIORITY 3: DO NOT ACQUIRE (Incompatible Taxonomy / Wrong Format / Restrictive License)          |
| - Crack500 (Binary segmentation masks only; no directional or multi-class labels)                |
| - Ultralytics Crack-Seg (Generic crack polygons; non-road surfaces; AGPL-3.0 license)             |
| - CQU-BPDD (Patch-level classification only; no bounding box coordinates)                         |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Priority 1 — Acquire First

### CRDDC / RDD2020 & RDD2022: Czech Republic & Japan Subsets

- **Source & Citations:**
  - Mendeley Data: [DOI 10.17632/5ty2wb6gvg.1](https://data.mendeley.com/datasets/5ty2wb6gvg/1) (RDD2020) and [DOI 10.17632/27c8pwsd6v](https://data.mendeley.com/datasets/27c8pwsd6v) (RDD2022).
  - Research Papers: Arya et al., *"Global Road Damage Detection: State-of-the-art Solutions"* (IEEE Big Data 2020) and *"Crowdsensing-based Road Damage Detection Challenge 2022"* (arXiv:2209.08538).
- **Target Classes:** **Class 1 (D10 Transverse Crack)** primary; **Class 0 (D00 Longitudinal Crack)** secondary.
- **Expected Benefit:**
  - *Verified Fact:* The global training benchmark contains over **4,446 D10 bounding boxes** in RDD2020 and **11,830 D10 bounding boxes** in RDD2022 across thousands of vehicle dashcam images.
  - Sourcing even 1,000–1,500 verified D10 annotations from the Czech and Japan subsets will increase RoadWise's transverse crack representation by **$1,500\%-2,000\%$**, moving D10 out of statistical irrelevance.
- **Annotation Conversion Requirements:**
  - **Zero Ontology Mapping Friction:** The annotations already use native Pascal VOC XML with exact tags `<name>D10</name>`, `<name>D00</name>`, `<name>D20</name>`, `<name>D40</name>`.
  - The existing RoadWise converter [`src/preprocessing/voc_to_yolo.py`](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/src/preprocessing/voc_to_yolo.py) can ingest and convert these XML files immediately. Non-target tags (`D43`, `D44`, `D50`) are automatically ignored.
- **Main Risks & Mitigations:**
  - *Risk:* Domain shift (Japanese roads have distinct lane striping and high-grade asphalt, which degraded India validation precision in past wholesale experiments).
  - *Mitigation (Targeted Harvesting):* Do **NOT** merge the entire 13,000+ image dataset. Use a selective extraction script (similar to `src/detection/build_extra_dataset.py`) to harvest **only images that contain D10 transverse cracks**, keeping background noise to a minimum.
  - *Mitigation (Evaluation Integrity):* Keep the India validation split (`data/processed/yolo/images/val`) strictly 100% Indian road imagery to evaluate real-world target domain performance.
- **License Considerations:** **CC BY-SA 4.0** / **CC BY 4.0** (Open benchmark license; allows research and adaptation with attribution).
- **Integration Effort:** **Minimal (1–2 engineering hours)**. Converter and schema already exist in the codebase.

---

## 3. Priority 2 — Acquire Selectively

### Candidate 1: McMaster Pavement Crack Detection (Roboflow Universe)

- **Source:** [Roboflow Universe](https://universe.roboflow.com/) (`pavement-crack-detection-r4n7n`).
- **Target Classes:** **Class 1 (D10 Transverse Crack)**, **Class 0 (D00 Longitudinal Crack)**, **Class 2 (D20 Alligator Crack)**.
- **Expected Benefit:** Contains explicit, human-delineated transverse crack bounding boxes on asphalt pavement.
- **Annotation Conversion Requirements:**
  - Map `transverse_crack` $\rightarrow$ `1` (D10).
  - Map `longitudinal_crack` $\rightarrow$ `0` (D00).
  - Map `alligator_crack` $\rightarrow$ `2` (D20).
  - Drop `oblique_crack`, `block_crack`, and `repair` into unmapped/discarded buckets.
- **Main Risks & Mitigations:**
  - *Risk:* Synthetic offline augmentations causing severe test contamination and duplicate leakage.
  - *Mitigation:* Download raw un-augmented export or run SHA-256 and perceptual hash deduplication prior to partitioning.
- **License Considerations:** **CC BY 4.0**.
- **Integration Effort:** **Moderate (3–4 engineering hours)** for schema conversion, deduplication, and visual spot-checks.

### Candidate 2: Attain Pavement Distress Dataset

- **Source:** Mendeley Data [DOI: 10.17632/nykrzdm74f.1](https://data.mendeley.com/datasets/nykrzdm74f/1).
- **Research Citation:** Rezaeimanesh et al., *"Attain: An inclusive, publicly available pavement distress dataset with multi-level severity annotations"* (Data in Brief, 2025).
- **Target Classes:** **Class 2 (D20 Alligator Crack)** and **Class 3 (D40 Pothole)** only.
- **Expected Benefit:** High-resolution smartphone dashcam footage with 19,761 high-quality multi-severity bounding boxes.
- **Annotation Conversion Requirements:**
  - Ingest `alligator_crack` as D20 and `pothole` as D40.
  - **CRITICAL RESTRICTION:** The `linear_crack` class MUST remain `UNMAPPED` unless manual human annotators review each box to assign longitudinal vs. transverse labels.
- **License Considerations:** **CC BY 4.0**.
- **Integration Effort:** **Moderate (2–3 engineering hours)** for Pascal VOC XML parsing and class filtering.

---

## 4. Priority 3 — Do Not Acquire (Rejected Datasets)

| Dataset | Primary Reason for Rejection | Detailed Failure Mode |
|---|---|---|
| **Crack500** | **Taxonomic & Format Incompatibility** | Provides binary segmentation masks only (`crack` vs `background`). Does not distinguish between longitudinal, transverse, or alligator cracking. Bounding boxes cannot be derived without severe spatial ambiguity. |
| **Ultralytics Crack-Seg** | **Non-Road Domain & Restrictive License** | Single generic crack class covering building walls, masonry, and concrete sidewalks. Distributes under **AGPL-3.0** (viral copyleft license), introducing severe legal barriers to downstream commercialization. |
| **CQU-BPDD** | **No Native Bounding Boxes** | Formatted as image-level / patch-level classification ($1200 \times 900$ patches). Does not provide object bounding box coordinates $[x, y, w, h]$. Generating bounding boxes would require training an intermediate weakly-supervised segmentation model or manual box creation. |

---

## 5. Concrete Action Plan for Next Phase (Task 4.3 Preview)

1. **Phase 1 — Targeted Harvesting of Czech & Japan CRDDC D10 Data:**
   - Use the verified RDD2020 / RDD2022 Czech and Japan archives.
   - Run a targeted extractor that selects **only images containing verified D10 transverse cracks** (plus accompanying D00/D20 boxes in those same scenes).
   - Convert VOC XML to YOLO format using RoadWise's native class mapping:
     - `D00` $\rightarrow 0$
     - `D10` $\rightarrow 1$
     - `D20` $\rightarrow 2$
     - `D40` $\rightarrow 3$
   - Target acquiring **$800 - 1,200$ high-quality transverse crack bounding boxes**.
2. **Phase 2 — Deduplication & Partitioning:**
   - Execute SHA-256 deduplication to guarantee zero image leakage.
   - Append harvested images **strictly to the training split (`train`)**.
   - **DO NOT TOUCH** the validation split (`val`) or test split (`test`) — preserve the 100% Indian road evaluation baseline.
3. **Phase 3 — Retraining Benchmark:**
   - Retrain YOLOv8s with balanced class representation and evaluate class-wise mAP@50 improvements on Class 1 (D10).

