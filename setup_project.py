"""Run once from the folder where you want the project: python setup_project.py"""
from pathlib import Path

DIRS = [
    "data/raw", "data/processed/yolo", "data/processed/roadwise", "data/local_test",
    "notebooks", "src/preprocessing", "src/detection", "src/analysis",
    "src/scoring", "src/gis", "models", "results/figures", "results/metrics",
    "results/predictions", "app", "reports",
]
for d in DIRS:
    Path(d).mkdir(parents=True, exist_ok=True)
Path(".gitignore").write_text("data/raw/\ndata/processed/\nmodels/*.pt\n__pycache__/\n.ipynb_checkpoints/\n")
print("RoadWise folder structure created.")
