# RoadWise — Task 4.1: Dataset Issues, Flaws and Architectural Risks

**Date:** 2026-11-08  
**Document Status:** Comprehensive Threat & Risk Assessment  
**Reference Codebase:** RoadWise ML Pipeline

---

## 1. Class-Mapping Risks & Semantic Integrity

### 1.1 The Dropped Classes in RDD2022 India (1,372 Bounding Boxes)
During the conversion of RDD2022 India XML annotations to YOLO format (`voc_to_yolo.py`), exactly **1,372 bounding boxes** were dropped because their labels were outside the 4 target classes:
- **D44 (Crosswalk Blur):** 1,062 bounding boxes across 869 images.
- **D01 (Longitudinal Construction / Repair Joint):** 179 bounding boxes across 118 images.
- **D43 (White Line Blur):** 57 bounding boxes across 57 images.
- **D11 (Transverse Construction / Repair Joint):** 45 bounding boxes across 36 images.
- **D50 (Manhole / Utility Cover):** 28 bounding boxes across 28 images.
- **D0w0 (Annotation Typo):** 1 box in `India_006129.xml`.

#### Semantic Consequence / Hidden Risk:
- When an image contains **only** unmapped classes (e.g. an image showing only crosswalk blur D44), all boxes are stripped, converting that image into an **empty background image**. This occurred in **562 images**.
- When an image contains **both** a target defect (e.g. D40 Pothole) and an unmapped defect (e.g. D44 Crosswalk Blur), the pothole is labeled, but the crosswalk blur is left **unlabeled in the foreground**.
- **Risk:** The YOLO loss function penalizes detections in unlabeled regions. The detector is penalized if it detects the unlabelled blur, but simultaneously sees visual degradation without bounding boxes, potentially confusing road paint wear with surface distress.

### 1.2 The Class-Remapping Clamping Guard in `03_prepare_dataset.py`
In `ml-pipeline/03_prepare_dataset.py`, the pseudo-label synthesis function contains:
```python
if cid not in (0, 1, 2, 3):
    cid = 3
```
- **The Risk:** If an external multi-class checkpoint (such as a 7-class or 80-class COCO model) is passed to `--pseudo_label_model`, any predicted object with class ID $\ge 4$ (e.g. crosswalk blur, cars, persons, manhole covers) would be silently remapped to **Class ID 3 (D40 Pothole)**.
- **Current Mitigation:** As verified in Task 3, `models/best.pt` has strict $nc = 4$ and only outputs IDs $\{0, 1, 2, 3\}$, meaning this branch never triggers with the production checkpoint. However, it remains a dangerous failure point if arbitrary external checkpoints are substituted.

---

## 2. Pseudo-Labeling Limitations & Confirmation Bias

### 2.1 The Confirmation Bias Trap
Using `models/best.pt` to label unannotated road imagery (`new dataset.zip`) creates a closed-loop confirmation bias:
1. **Self-Reinforcing Blind Spots:** If `best.pt` has low recall on small shallow potholes or water-filled potholes, it will not predict bounding boxes on them. These missed potholes become **implicit background (negative)** samples in the training set, explicitly teaching the fine-tuned model that those shapes are *not* potholes.
2. **Amplified False Positives:** If `best.pt` mistakes dark asphalt patches, tree shadows, or oil stains for potholes, those errors are written into candidate `.txt` files. Training on these files turns systematic model errors into hard ground truth.
3. **Loss of Small Cracks:** In `03_prepare_dataset.py`, `--pseudo_conf` defaults to `0.30`. Because fine transverse cracks (D10) frequently output confidence scores in the $0.12 - 0.25$ range, a $0.30$ confidence cutoff discards almost all candidate transverse cracks, further starving Class 1.

---

## 3. Duplication & Data Leakage Vulnerabilities

### 3.1 Duplicate Images in `new dataset.zip` (8 Exact Duplicate Pairs)
Forensic hashing discovered 8 exact duplicate image pairs in the 618-image collection:
- `184.jpg` $\leftrightarrow$ `156.jpg`
- `263.jpg` $\leftrightarrow$ `206.jpg`
- `346.jpg` $\leftrightarrow$ `301.jpg`
- `406.jpg` $\leftrightarrow$ `292.jpg`
- `495.jpg` $\leftrightarrow$ `317.jpg`
- `503.jpg` $\leftrightarrow$ `327.jpg`
- `560.jpg` $\leftrightarrow$ `332.jpg`
- `562.jpg` $\leftrightarrow$ `335.jpg`

If un-deduplicated data is split randomly into train and validation sets, identical images can fall into both splits, creating **direct data leakage** that artificially inflates validation metrics. Deduplication via SHA-256 (as implemented in `03_prepare_dataset.py`) is mandatory.

### 3.2 Synthetic Augmentation Leakage in Roboflow Exports
In `RoadWise_Extra_Dataset` (Desktop), Roboflow applied 3x offline image augmentation (horizontal flip, Gaussian blur, salt-and-pepper noise) **before** creating train, validation, and test splits:
- An augmented copy of Image $X$ resides in the train set, while another augmented copy of Image $X$ resides in the validation set.
- This represents severe test contamination and explains why this dataset was previously rejected.

---

## 4. Extreme Class Imbalance & Evaluation Reliability

### 4.1 Statistical Fragility of Validation Class 1 (Transverse Cracks)
- The validation split contains only **10 bounding boxes** for Class 1 (Transverse Crack).
- Ultralytics calculates mAP@50 per class by computing the area under the Precision-Recall curve.
- With only 10 ground-truth targets, each target represents $10\%$ of the recall denominator. If the model misses just 2 targets due to threshold fluctuations, recall drops by $20\%$, and class mAP fluctuates wildly between epochs.
- **Risk:** Validation loss and mAP metrics on Class 1 are statistically noisy and cannot be relied upon to assess checkpoint quality without augmenting the test/validation target sample size.

---

## 5. Summary Risk Register

| Risk ID | Severity | Description | Recommended Mitigation |
|---|---|---|---|
| **R-01** | **CRITICAL** | Transverse crack (D10) is starved (48 train boxes, 10 val boxes). | Target-acquire verified D10 annotations before full retraining. |
| **R-02** | **HIGH** | Unlabeled foreground defects in 562 RDD2022 images (D44/D01/etc.). | Accept as negative background suppression or filter images entirely. |
| **R-03** | **HIGH** | Unverified pseudo-labels generate confirmation bias and error propagation. | Require human-in-the-loop audit before ingesting pseudo-labeled data. |
| **R-04** | **MEDIUM** | 8 duplicate images in `new dataset.zip`. | Maintain SHA-256 deduplication filter in `03_prepare_dataset.py`. |
| **R-05** | **MEDIUM** | Synthetic augmentation leakage in external Roboflow datasets. | Enforce strict rule: augmentations must only occur on-the-fly during training. |

