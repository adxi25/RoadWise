"""
RoadWise - check the condition score against the real labels on the VALIDATION split.

Idea: compute the score two ways for every validation image
  (1) from the model's detections       -> what the system would report
  (2) from the true labels (conf = 1.0) -> what it SHOULD report if the model were perfect
If the model-based score tracks the label-based score, the pipeline behaves sensibly.
This does NOT prove the score matches real road condition.

Run from the RoadWise folder (after batch_detect.py has created val_detections.csv):
    python src/scoring/validate_scoring.py
"""
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
from health_score import calculate_condition  # noqa: E402

BASE = Path(__file__).resolve().parents[2]
DET_CSV = BASE / "results" / "metrics" / "val_detections.csv"
LABEL_DIR = BASE / "data" / "processed" / "yolo" / "labels" / "val"
ID2CODE = {0: "D00", 1: "D10", 2: "D20", 3: "D40"}


def main():
    pred = pd.read_csv(DET_CSV)
    pred_by_img = {k: g.to_dict("records") for k, g in pred.groupby("image_id")}

    rows = []
    for lf in sorted(LABEL_DIR.glob("*.txt")):
        gt = []
        for ln in lf.read_text().splitlines():
            p = ln.split()
            if len(p) == 5:
                gt.append({"class_code": ID2CODE[int(p[0])], "confidence": 1.0,
                           "x_center": float(p[1]), "y_center": float(p[2]),
                           "width": float(p[3]), "height": float(p[4])})
        rows.append({
            "image_id": lf.stem,
            "n_true": len(gt),
            "score_true": calculate_condition(gt)["condition_score"],
            "score_pred": calculate_condition(pred_by_img.get(lf.stem, []))["condition_score"],
        })
    df = pd.DataFrame(rows)
    df.to_csv(BASE / "results" / "metrics" / "val_scoring_check.csv", index=False)

    print(f"Validation images: {len(df)}")
    rho = df["score_true"].corr(df["score_pred"], method="spearman")
    print(f"Spearman correlation (score from labels vs score from model): {rho:.3f}")

    dmg = df[df.n_true > 0]
    clean = df[df.n_true == 0]
    print(f"\nImages with labelled damage ({len(dmg)}): mean model-based score {dmg.score_pred.mean():.1f}")
    print(f"Images without labelled damage ({len(clean)}): mean model-based score {clean.score_pred.mean():.1f}")

    print("\nModel-based score distribution among images the model flagged (any detection used):")
    flagged = df[df.score_pred < 100]
    print(flagged.score_pred.describe(percentiles=[.1, .25, .5, .75, .9]).round(1).to_string())
    print("\nSaved: results/metrics/val_scoring_check.csv")


if __name__ == "__main__":
    main()
