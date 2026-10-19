
from pathlib import Path

from ultralytics import YOLO
import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[2]
MODEL_PATH = BASE_DIR / "models" / "best.pt"
DATA_YAML = BASE_DIR / "data" / "processed" / "yolo" / "data.yaml"
OUTPUT_DIR = BASE_DIR / "results" / "metrics"

def main():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found: {MODEL_PATH}")

    if not DATA_YAML.exists():
        raise FileNotFoundError(
            f"Dataset config not found: {DATA_YAML}"
        )

    model = YOLO(str(MODEL_PATH))
    rows = []

    for imgsz in (640, 960):
        print(f"\nEvaluating full-image inference at {imgsz}px...")

        results = model.val(
            data=str(DATA_YAML),
            split="val",
            imgsz=imgsz,
            conf=0.001,
            iou=0.7,
            plots=True,
            project=str(OUTPUT_DIR / "ultralytics"),
            name=f"full_{imgsz}",
            exist_ok=True,
            verbose=False,
        )

        metrics = results.box

        rows.append({
            "Method": f"Full image {imgsz}px",
            "Precision": float(metrics.mp),
            "Recall": float(metrics.mr),
            "mAP50": float(metrics.map50),
            "mAP50-95": float(metrics.map),
        })

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    report = pd.DataFrame(rows)
    report_path = OUTPUT_DIR / "full_validation_resolution_comparison.csv"
    report.to_csv(report_path, index=False)

    print("\nFULL VALIDATION RESULTS")
    print(report.to_string(index=False))
    print(f"\nSaved results to: {report_path}")

if __name__ == "__main__":
    main()
