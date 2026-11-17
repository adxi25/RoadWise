"""
scripts/evaluate_current_dual_model.py
======================================
Automated evaluation benchmark for the RoadWise Dual-Model Architecture (YOLOv8s Fusion).
Evaluates real test images using the production inference pipeline in `src/detection/predict.py`.

Outputs:
  - results/metrics/dual_model_system_benchmarks.csv
  - results/figures/dual_model_evaluation_metrics.png
"""

import sys
import time
from pathlib import Path
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR / "src"))

from src.detection.predict import detect
from src.scoring.health_score import calculate_condition
from src.scoring.risk_score import analyze_risk

def main():
    print("=" * 72)
    print(" ROADWISE: CURRENT DUAL-MODEL SYSTEM EVALUATION & BENCHMARK ")
    print("=" * 72)

    test_dirs = [
        BASE_DIR / "data" / "processed" / "crack_experiment_c_2class" / "test" / "images",
        BASE_DIR / "data" / "raw" / "pothole_image_data" / "Pothole_Image_Data"
    ]

    image_paths = []
    for d in test_dirs:
        if d.exists():
            image_paths.extend(list(d.glob("*.jpg"))[:25])

    if not image_paths:
        print("[!] No sample images found in processed/raw, scanning data/uploads...")
        uploads = BASE_DIR / "data" / "uploads"
        if uploads.exists():
            image_paths = list(uploads.glob("*.jpg"))[:30]

    print(f"[*] Benchmarking across {len(image_paths)} test frames...")

    latencies = []
    class_counts = {"D00": 0, "D20": 0, "D40": 0}
    class_confs = {"D00": [], "D20": [], "D40": []}
    conditions = []
    priorities = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}

    for idx, img_path in enumerate(image_paths, 1):
        t0 = time.perf_counter()
        dets, _ = detect(img_path, conf=0.15)
        dt = (time.perf_counter() - t0) * 1000.0
        latencies.append(dt)

        cond_res = calculate_condition(dets)
        conditions.append(cond_res["condition_score"])

        risk_res = analyze_risk(cond_res["condition_score"], road_type="main_city_road", traffic="high", location_sensitivity="none")
        priorities[risk_res["maintenance_priority"]] += 1

        for d in dets:
            c = d.get("class_code")
            if c in class_counts:
                class_counts[c] += 1
                class_confs[c].append(d.get("confidence", 0.0))

        if idx % 10 == 0 or idx == len(image_paths):
            print(f"  [{idx}/{len(image_paths)}] processed. Avg latency: {np.mean(latencies):.1f} ms")

    avg_lat = float(np.mean(latencies))
    p95_lat = float(np.percentile(latencies, 95))
    fps = 1000.0 / avg_lat if avg_lat > 0 else 0

    metrics_df = pd.DataFrame([
        {"Metric": "Total Frames Evaluated", "Value": len(image_paths)},
        {"Metric": "Average Inference Latency (Dual Model)", "Value": f"{avg_lat:.2f} ms"},
        {"Metric": "95th Percentile Latency", "Value": f"{p95_lat:.2f} ms"},
        {"Metric": "Throughput (FPS)", "Value": f"{fps:.1f} frames/sec"},
        {"Metric": "Linear Crack (D00) Detections", "Value": class_counts["D00"]},
        {"Metric": "Linear Crack Mean Confidence", "Value": f"{np.mean(class_confs['D00']):.3f}" if class_confs['D00'] else "N/A"},
        {"Metric": "Alligator Crack (D20) Detections", "Value": class_counts["D20"]},
        {"Metric": "Alligator Crack Mean Confidence", "Value": f"{np.mean(class_confs['D20']):.3f}" if class_confs['D20'] else "N/A"},
        {"Metric": "Pothole (D40) Detections", "Value": class_counts["D40"]},
        {"Metric": "Pothole Mean Confidence", "Value": f"{np.mean(class_confs['D40']):.3f}" if class_confs['D40'] else "N/A"},
        {"Metric": "Mean Surface Health (Condition Score)", "Value": f"{np.mean(conditions):.2f} / 100"},
    ])

    out_metrics_path = BASE_DIR / "results" / "metrics" / "dual_model_system_benchmarks.csv"
    out_metrics_path.parent.mkdir(parents=True, exist_ok=True)
    metrics_df.to_csv(out_metrics_path, index=False)
    print(f"\n[+] Saved metrics to: {out_metrics_path}")

    # Generate visual figure
    fig, axes = plt.subplots(1, 3, figsize=(16, 5))
    fig.patch.set_facecolor("#ffffff")

    # Plot 1: Detection distribution
    classes = ["D00\n(Linear)", "D20\n(Alligator)", "D40\n(Pothole)"]
    counts = [class_counts["D00"], class_counts["D20"], class_counts["D40"]]
    colors = ["#00a896", "#f4a261", "#e76f51"]
    bars = axes[0].bar(classes, counts, color=colors, edgecolor="#264653", linewidth=1.2)
    axes[0].set_title("Dual-Model Detections by Class", fontsize=12, fontweight="bold", pad=10)
    axes[0].set_ylabel("Count of Detected Boxes")
    axes[0].grid(axis="y", linestyle="--", alpha=0.5)
    for bar in bars:
        yval = bar.get_height()
        axes[0].text(bar.get_x() + bar.get_width()/2.0, yval + 0.5, f"{int(yval)}", ha="center", va="bottom", fontweight="bold")

    # Plot 2: Latency profile
    axes[1].hist(latencies, bins=12, color="#2a9d8f", edgecolor="#264653", alpha=0.85)
    axes[1].axvline(avg_lat, color="#e63946", linestyle="--", linewidth=2, label=f"Mean: {avg_lat:.1f}ms")
    axes[1].set_title("End-to-End Inference Latency Distribution", fontsize=12, fontweight="bold", pad=10)
    axes[1].set_xlabel("Latency (milliseconds)")
    axes[1].set_ylabel("Frame Count")
    axes[1].legend()
    axes[1].grid(axis="y", linestyle="--", alpha=0.5)

    # Plot 3: Priority Band Triage
    p_names = list(priorities.keys())
    p_counts = list(priorities.values())
    p_colors = ["#2a9d8f", "#e9c46a", "#f4a261", "#e76f51"]
    axes[2].pie(p_counts, labels=p_names, autopct="%1.1f%%", colors=p_colors, startangle=140,
                wedgeprops={"edgecolor": "#ffffff", "linewidth": 1.5})
    axes[2].set_title("Maintenance Priority Triage", fontsize=12, fontweight="bold", pad=10)

    plt.tight_layout()
    out_fig_path = BASE_DIR / "results" / "figures" / "dual_model_evaluation_metrics.png"
    out_fig_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(out_fig_path, dpi=200)
    plt.close()
    print(f"[+] Saved evaluation figure to: {out_fig_path}")

    print("\n" + "=" * 72)
    print(" SYSTEM BENCHMARK SUMMARY (READY TO PRESENT) ")
    print("=" * 72)
    for _, row in metrics_df.iterrows():
        print(f"  {row['Metric']:<42} : {row['Value']}")
    print("=" * 72)

if __name__ == "__main__":
    main()
