# RoadWise Model Weights

## Model: `best.pt` (Fine-tuned YOLOv8s — roadwise_v2)

| Property | Value |
|---|---|
| Architecture | YOLOv8s |
| Training epochs | 83 (early stopping at epoch 53 best) |
| mAP@50 | **67.65%** |
| Precision | 66.4% |
| Recall | 61.8% |
| File size | ~7 MB |

## Classes (4-class head)

| Class ID | Code | Label |
|---|---|---|
| 0 | D00 | Longitudinal Crack |
| 1 | D10 | Transverse Crack |
| 2 | D20 | Alligator Crack |
| 3 | D40 | Pothole |

## Recommended Confidence Threshold
- **`0.15`** — Best for real-world road inspection (catches subtle damage)
- `0.25+` — Only for high-confidence detections

## Usage
```python
from ultralytics import YOLO
model = YOLO("models/best.pt")
results = model.predict(source="road_image.jpg", conf=0.15)
```

## Training Artifacts (Fine-Tuned Model)
The complete training run outputs are saved in [training_artifacts/](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/training_artifacts):
- [args.yaml](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/training_artifacts/args.yaml): Complete hyperparameters and training settings used for `roadwise_v2`.
- [results.csv](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/training_artifacts/results.csv): Epoch-by-epoch loss and validation metrics for all 83 epochs.
- [data.yaml](file:///c:/Users/aquad/OneDrive/Desktop/RoadWise/training_artifacts/data.yaml): Dataset specification and 4-class head mapping.

