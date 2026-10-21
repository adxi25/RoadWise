"""
04_train.py — Fine-tune YOLOv8s on the prepared dataset.

Starts from the original baseline checkpoint (models/best.pt).
Never overwrites the baseline — saves to runs/roadwise_600_finetune/.

Usage:
  python 04_train.py \
      --baseline_model /path/to/models/best.pt \
      --dataset_yaml   /path/to/datasets/roadwise_pothole/dataset.yaml \
      --output_dir     runs/roadwise_600_finetune \
      --epochs 50 \
      --batch 8 \
      --imgsz 640

IMPORTANT:
  - Run 01_dataset_audit.py and 02_baseline_inference.py first.
  - Run 03_prepare_dataset.py to create the YOLO dataset structure.
  - Do NOT train if the dataset audit shows missing or pseudo-labels.
  - Review pseudo-labels before training.
"""

import argparse
import json
import logging
import shutil
import time
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("train")

BASELINE_METRICS = {
    "Precision": 0.5056,
    "Recall": 0.3856,
    "mAP@50": 0.3744,
    "mAP@50-95": 0.1591,
    "note": "Evaluated on India validation set from the original RoadWise dataset.",
}


def check_dataset(yaml_path: Path):
    """Quick sanity check: verify train/val splits have images."""
    import yaml
    with open(yaml_path) as f:
        cfg = yaml.safe_load(f)

    dataset_root = Path(cfg.get("path", yaml_path.parent))
    train_dir = dataset_root / cfg.get("train", "images/train")
    val_dir = dataset_root / cfg.get("val", "images/val")

    train_imgs = list(train_dir.rglob("*.jpg")) + list(train_dir.rglob("*.png"))
    val_imgs = list(val_dir.rglob("*.jpg")) + list(val_dir.rglob("*.png"))

    log.info("Train images: %d", len(train_imgs))
    log.info("Val images:   %d", len(val_imgs))

    if not train_imgs:
        raise RuntimeError(f"No training images found in {train_dir}")
    if not val_imgs:
        raise RuntimeError(f"No validation images found in {val_dir}")
    return len(train_imgs), len(val_imgs)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline_model", required=True,
                        help="Path to original best.pt — will NOT be modified.")
    parser.add_argument("--dataset_yaml", required=True)
    parser.add_argument("--output_dir", default="runs/roadwise_600_finetune")
    parser.add_argument("--epochs", type=int, default=50)
    parser.add_argument("--batch", type=int, default=8,
                        help="Batch size — reduce to 4 if GPU OOM.")
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--lr0", type=float, default=0.001,
                        help="Initial LR — conservative for fine-tuning.")
    parser.add_argument("--patience", type=int, default=15,
                        help="Early stopping patience (epochs).")
    parser.add_argument("--device", default="",
                        help="'0' for GPU 0, 'cpu', or '' for auto-detect.")
    parser.add_argument("--workers", type=int, default=4)
    args = parser.parse_args()

    baseline = Path(args.baseline_model)
    yaml_path = Path(args.dataset_yaml)
    output_dir = Path(args.output_dir)

    if not baseline.exists():
        log.error("Baseline checkpoint not found: %s", baseline)
        raise SystemExit(1)
    if not yaml_path.exists():
        log.error("Dataset YAML not found: %s", yaml_path)
        raise SystemExit(1)

    # ── Verify baseline is not in output dir (safety guard) ──────────────────
    baseline_abs = baseline.resolve()
    output_abs = output_dir.resolve()
    if str(baseline_abs).startswith(str(output_abs)):
        log.error("Baseline path is inside the output directory — this would overwrite it. Abort.")
        raise SystemExit(1)

    output_dir.mkdir(parents=True, exist_ok=True)

    # ── Backup baseline ───────────────────────────────────────────────────────
    baseline_backup = output_dir / "baseline_reference.pt"
    shutil.copy2(baseline, baseline_backup)
    log.info("Baseline backed up to: %s", baseline_backup)

    # ── Dataset check ─────────────────────────────────────────────────────────
    try:
        n_train, n_val = check_dataset(yaml_path)
    except Exception as exc:
        log.error("Dataset check failed: %s", exc)
        raise SystemExit(1)

    # ── Train ─────────────────────────────────────────────────────────────────
    log.info("─" * 60)
    log.info("STARTING FINE-TUNE")
    log.info("  Baseline:   %s", baseline)
    log.info("  Dataset:    %s", yaml_path)
    log.info("  Output:     %s", output_dir)
    log.info("  Epochs:     %d  (patience=%d)", args.epochs, args.patience)
    log.info("  Batch:      %d", args.batch)
    log.info("  Img size:   %d", args.imgsz)
    log.info("  LR0:        %g", args.lr0)
    log.info("─" * 60)

    from ultralytics import YOLO
    model = YOLO(str(baseline))

    device = args.device
    if not device:
        try:
            import torch
            if torch.cuda.is_available():
                device = "0"
            elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
                device = "mps"
            else:
                device = "cpu"
        except ImportError:
            device = "cpu"
    log.info("Device: %s", device)

    t0 = time.perf_counter()
    results = model.train(
        data=str(yaml_path),
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        lr0=args.lr0,
        lrf=0.01,
        patience=args.patience,
        device=device,
        workers=args.workers,
        project=str(output_dir.parent),
        name=output_dir.name,
        exist_ok=True,
        plots=True,
        save=True,
        save_period=10,
        val=True,
        augment=True,
        mosaic=1.0,
        mixup=0.1,
        degrees=5.0,
        translate=0.1,
        scale=0.3,
        fliplr=0.5,
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        pretrained=True,
        freeze=None,        # Fine-tune entire network
        close_mosaic=10,
        warmup_epochs=3,
        warmup_momentum=0.8,
        optimizer="AdamW",
        weight_decay=0.0005,
        label_smoothing=0.0,
    )
    elapsed = time.perf_counter() - t0

    log.info("Training complete in %.1f s (%.1f min).", elapsed, elapsed / 60)

    # ── Save training config ──────────────────────────────────────────────────
    config = {
        "baseline_model": str(baseline),
        "dataset_yaml": str(yaml_path),
        "output_dir": str(output_dir),
        "epochs": args.epochs,
        "patience": args.patience,
        "batch": args.batch,
        "imgsz": args.imgsz,
        "lr0": args.lr0,
        "device": device,
        "train_images": n_train,
        "val_images": n_val,
        "elapsed_seconds": round(elapsed, 1),
        "baseline_metrics": BASELINE_METRICS,
    }
    with open(output_dir / "training_config.json", "w") as f:
        json.dump(config, f, indent=2)

    best_pt = output_dir / "weights" / "best.pt"
    if best_pt.exists():
        log.info("Best checkpoint: %s", best_pt)
    else:
        log.warning("best.pt not found at expected path: %s", best_pt)

    log.info("Next step: run 05_evaluate.py to compare baseline vs candidate.")


if __name__ == "__main__":
    main()
