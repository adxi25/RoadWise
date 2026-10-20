"""
RoadWise - per-class confidence calibration (READ-ONLY).

Runs the existing models/best.pt on the VALIDATION split only (never the test split)
at a very low confidence, then reports for each class the confidence that maximises F1,
next to the precision/recall you currently get at conf 0.25.

It does not modify best.pt, the dataset, or any app code.
Run from the RoadWise folder:   python src/detection/calibrate_thresholds.py
"""
import pathlib

import numpy as np
from ultralytics import YOLO

MODEL = "models/best.pt"
ROOT = pathlib.Path("data/processed/yolo").resolve()
NAMES = ["D00", "D10", "D20", "D40"]   # model class order: 0 longitudinal, 1 transverse, 2 alligator, 3 pothole

yaml_path = pathlib.Path("results/calib_data.yaml")
yaml_path.parent.mkdir(exist_ok=True)
yaml_path.write_text(
    f"path: {ROOT.as_posix()}\n"
    "train: images/train\n"
    "val: images/val\n"
    "test: images/test\n"
    "names:\n  0: longitudinal_crack\n  1: transverse_crack\n  2: alligator_crack\n  3: pothole\n"
)

model = YOLO(MODEL)
r = model.val(data=str(yaml_path), split="val", imgsz=640, conf=0.001, plots=False, verbose=False)

px = np.array(r.box.px)
f1 = np.array(r.box.f1_curve)
prec = np.array(r.box.p_curve)
rec = np.array(r.box.r_curve)
k25 = int(np.abs(px - 0.25).argmin())

print(f"\nValidation split: mAP50 {r.box.map50:.3f}  mAP50-95 {r.box.map:.3f}  (conf 0.001, imgsz 640)\n")
for row, cls_idx in enumerate(r.box.ap_class_index):
    name = NAMES[int(cls_idx)]
    j = int(f1[row].argmax())
    print(
        f"{name}: best-F1 conf {px[j]:.3f} -> P {prec[row][j]:.2f} R {rec[row][j]:.2f} F1 {f1[row][j]:.2f}"
        f"   |   at 0.25 -> P {prec[row][k25]:.2f} R {rec[row][k25]:.2f} F1 {f1[row][k25]:.2f}"
    )
