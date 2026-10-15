"""
RoadWise - run the trained model on a whole folder and save every detection to a CSV.

Purpose: get REAL detections (confidence, box size per class) to design and tune the scoring.
Use the VALIDATION images for this, not the test images (test is kept for the final evaluation only).

Run from the RoadWise folder:
    python src/detection/batch_detect.py --images data/processed/yolo/images/val

Outputs:
    results/metrics/val_detections.csv   one row per detection
    results/metrics/val_detection_summary.csv   per-class summary
"""
import argparse
from pathlib import Path

import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[2]
CLASS_CODE = {"longitudinal_crack": "D00", "transverse_crack": "D10",
              "alligator_crack": "D20", "pothole": "D40"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--images", default="data/processed/yolo/images/val")
    ap.add_argument("--model", default=str(BASE_DIR / "models" / "best.pt"))
    ap.add_argument("--conf", type=float, default=0.25)
    ap.add_argument("--out", default="results/metrics/val_detections.csv")
    a = ap.parse_args()

    from ultralytics import YOLO
    model = YOLO(a.model)

    rows, n_images = [], 0
    for r in model.predict(source=a.images, conf=a.conf, imgsz=640, stream=True, verbose=False):
        n_images += 1
        image_id = Path(r.path).stem
        for cls, conf, xywhn in zip(r.boxes.cls.tolist(), r.boxes.conf.tolist(), r.boxes.xywhn.tolist()):
            name = r.names[int(cls)]
            rows.append({
                "image_id": image_id, "class_code": CLASS_CODE.get(name, "UNK"), "class_name": name,
                "confidence": round(float(conf), 4),
                "x_center": round(xywhn[0], 5), "y_center": round(xywhn[1], 5),
                "width": round(xywhn[2], 5), "height": round(xywhn[3], 5),
                "rel_area": round(xywhn[2] * xywhn[3], 5),
            })
        if n_images % 200 == 0:
            print(f"  processed {n_images} images...")

    df = pd.DataFrame(rows)
    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out, index=False)

    print(f"\nImages processed: {n_images} (confidence threshold {a.conf})")
    print(f"Images with at least one detection: {df.image_id.nunique() if not df.empty else 0}")
    print(f"Total detections: {len(df)}")
    if not df.empty:
        summ = df.groupby("class_name").agg(
            detections=("confidence", "size"),
            median_conf=("confidence", "median"),
            median_rel_area=("rel_area", "median"),
            p90_rel_area=("rel_area", lambda s: s.quantile(0.9)),
        ).round(3)
        summ.to_csv(out.with_name("val_detection_summary.csv"))
        print("\nPer-class summary:")
        print(summ.to_string())
        per_img = df.groupby("image_id").size()
        print(f"\nDetections per image (among images with any): median {per_img.median():.0f}, max {per_img.max()}")
    print(f"\nSaved: {out}")


if __name__ == "__main__":
    main()
