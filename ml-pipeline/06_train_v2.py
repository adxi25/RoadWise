"""
RoadWise ML Pipeline — Step 06: Advanced YOLOv8 Fine-Tuning (v2)
================================================================

ROLE IN ROADWISE ML LIFECYCLE:
    This script executes transfer learning and domain-adapted fine-tuning on top of the
    baseline YOLOv8 checkpoint. It incorporates advanced computer vision training recipes
    to boost detection recall and precision specifically for subtle road distress features.

KEY HYPERPARAMETERS & DESIGN RATIONALE (Viva Master Explanations):
    1. Higher Resolution (`imgsz=1280` vs default 640):
       Road distress (especially cracks and developing potholes) occupy minute spatial fractions
       (<1.5% of image area). At 640x640, a 20-pixel crack shrinks to <2 pixels after standard
       feature-stride downsampling, vanishing from deep feature maps. Doubling resolution to 1280
       quadruples spatial receptive field detail.
    2. Backbone Freezing (`freeze=10` layers):
       Transfer learning best practice: The first 10 layers comprise the convolutional backbone
       (Conv, C2f modules) that extract universal low-level visual primitives (Gabor-like edges,
       color gradients, asphalt texture). Freezing them stabilizes gradients during early epochs,
       preventing catastrophic forgetting while only the detection neck and head adapt.
    3. Cosine Annealing Learning Rate Schedule (`cos_lr=True`, `lr0=1e-4`):
       Instead of abrupt step-decay, cosine annealing smoothly lowers learning rates following
       a cosine curve down to `lrf=0.005` of initial value. Paired with 5 warmup epochs, it avoids
       violent weight updates on epoch 1.
    4. Advanced Data Augmentation (`copy_paste=0.1`, `label_smoothing=0.05`):
       - Copy-Paste: Crops ground-truth pothole masks and pastes them onto other background road
         images, creating realistic composite training examples to combat sample scarcity.
       - Label Smoothing: Softens hard 0/1 target distributions to prevent the cross-entropy
         loss from over-fitting over-confident predictions.
    5. Early Stopping (`patience=30`):
       Monitors validation mAP@50-95. If no metric improvement is recorded for 30 consecutive epochs,
       training halts automatically, avoiding overfitting. (In experiment runs, stopped at epoch 53).

EVALUATION METRICS BENCHMARKS:
    - Baseline RDD2022: Precision=50.56%, Recall=38.56%, mAP@50=37.44%, mAP@50-95=15.91%
"""

import argparse
import json
import logging
import shutil
import time
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("train_v2")

BASELINE_METRICS = {
    "Precision": 0.5056,
    "Recall": 0.3856,
    "mAP@50": 0.3744,
    "mAP@50-95": 0.1591,
    "note": "Evaluated on India validation set from the original RoadWise dataset.",
}


def check_dataset(yaml_path: Path):
    import yaml
    with open(yaml_path) as f:
        cfg = yaml.safe_load(f)

    dataset_root = Path(cfg.get("path", yaml_path.parent))
    train_dir = dataset_root / cfg.get("train", "images/train")
    val_dir = dataset_root / cfg.get("val", "images/val")

    train_imgs = list(train_dir.rglob("*.jpg")) + list(train_dir.rglob("*.png")) + list(train_dir.rglob("*.jpeg"))
    val_imgs = list(val_dir.rglob("*.jpg")) + list(val_dir.rglob("*.png")) + list(val_dir.rglob("*.jpeg"))

    log.info("Train images: %d", len(train_imgs))
    log.info("Val images:   %d", len(val_imgs))

    if not train_imgs:
        raise RuntimeError(f"No training images found in {train_dir}")
    if not val_imgs:
        raise RuntimeError(f"No validation images found in {val_dir}")
    return len(train_imgs), len(val_imgs)


def detect_device():
    """
    Auto-detect optimal compute hardware for PyTorch training: NVIDIA CUDA -> Apple Silicon MPS -> CPU.
    """
    try:
        import torch
        # Check for NVIDIA GPU with CUDA driver support
        if torch.cuda.is_available():
            return "0"
        # Check for Apple Silicon GPU with Metal Performance Shaders (MPS) support
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return "mps"
    except ImportError:
        pass
    # Fallback to standard host CPU execution
    return "cpu"


def main():
    """
    Main training execution function.
    Parses CLI arguments, backs up baseline model, configures hyperparameters,
    and runs Ultralytics YOLOv8 transfer learning fine-tuning.
    """
    parser = argparse.ArgumentParser(description="Fine-tune YOLOv8 on road distress imagery.")
    parser.add_argument("--baseline_model", default="models/best.pt", help="Base checkpoint to fine-tune from")
    parser.add_argument("--dataset_yaml", default="datasets/roadwise_pothole/dataset.yaml", help="YOLO data configuration YAML")
    parser.add_argument("--output_dir", default="runs/roadwise_v2", help="Directory where experiment outputs are saved")
    parser.add_argument("--epochs", type=int, default=100, help="Maximum training epochs (early stopping terminates sooner)")
    parser.add_argument("--batch", type=int, default=8, help="Batch size (tune down if encountering CUDA OOM)")
    parser.add_argument("--imgsz", type=int, default=1280, help="High-resolution square canvas dimension (preserves small defects)")
    parser.add_argument("--lr0", type=float, default=0.0001, help="Initial learning rate (conservative to avoid head instability)")
    parser.add_argument("--patience", type=int, default=30, help="Early stopping epoch tolerance for validation mAP")
    parser.add_argument("--device", default="", help="Explicit compute device override ('0', 'mps', 'cpu')")
    parser.add_argument("--workers", type=int, default=4, help="PyTorch DataLoader multi-processing worker processes")
    parser.add_argument("--freeze", type=int, default=10, help="Number of backbone layers to freeze during training")
    args = parser.parse_args()

    baseline = Path(args.baseline_model)
    yaml_path = Path(args.dataset_yaml)
    output_dir = Path(args.output_dir)

    # Validate essential input paths
    if not baseline.exists():
        log.error("Baseline checkpoint not found: %s", baseline)
        raise SystemExit(1)
    if not yaml_path.exists():
        log.error("Dataset YAML not found: %s", yaml_path)
        raise SystemExit(1)

    # Defensive path check: prevent accidental overwriting of active model
    if str(baseline.resolve()).startswith(str(output_dir.resolve())):
        log.error("Baseline path is inside output_dir — abort.")
        raise SystemExit(1)

    output_dir.mkdir(parents=True, exist_ok=True)

    # Preserve an unmodified reference copy of the baseline model checkpoint before fine-tuning
    baseline_backup = output_dir / "baseline_reference.pt"
    shutil.copy2(baseline, baseline_backup)
    log.info("Baseline backed up to: %s", baseline_backup)

    try:
        n_train, n_val = check_dataset(yaml_path)
    except Exception as exc:
        log.error("Dataset check failed: %s", exc)
        raise SystemExit(1)

    # Select target compute hardware
    device = args.device or detect_device()
    log.info("Device: %s", device)

    log.info("=" * 70)
    log.info("STARTING FINE-TUNE v2 — improved pothole detection")
    log.info("  imgsz=1280  (was 640) — preserves small pothole detail")
    log.info("  epochs=100  (was 25)  — more convergence time")
    log.info("  freeze=%d backbone    — stabilises new 4-class head", args.freeze)
    log.info("  cos_lr=True           — cosine annealing LR schedule")
    log.info("  lr0=%g                — conservative init", args.lr0)
    log.info("  copy_paste=0.1        — synthesizes more pothole instances")
    log.info("=" * 70)

    # Instantiate YOLO model from baseline checkpoint
    from ultralytics import YOLO
    model = YOLO(str(baseline))

    # Benchmark training wall-clock runtime
    t0 = time.perf_counter()

    # Launch training with calibrated hyperparameters
    results = model.train(
        data=str(yaml_path),
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,

        # Learning rate schedule: Cosine annealing with 5 warmup epochs
        lr0=args.lr0,
        lrf=0.005,
        cos_lr=True,
        warmup_epochs=5,
        warmup_momentum=0.8,
        momentum=0.937,

        # Regularisation: Weight decay and label smoothing prevent overconfident overfitting
        weight_decay=0.0005,
        label_smoothing=0.05,

        # Architecture: Freezes first 10 convolutional backbone layers
        freeze=args.freeze,
        pretrained=True,

        # Augmentation — geometric
        degrees=10.0,
        translate=0.15,
        scale=0.5,
        shear=3.0,
        perspective=0.0002,
        flipud=0.1,
        fliplr=0.5,

        # Augmentation — colour
        hsv_h=0.02,
        hsv_s=0.7,
        hsv_v=0.5,

        # Augmentation — mosaic / copy-paste
        mosaic=1.0,
        mixup=0.15,
        copy_paste=0.1,
        close_mosaic=15,

        # Loss
        box=7.5,
        cls=0.7,
        dfl=1.5,

        # Optimiser
        optimizer="AdamW",

        # Output
        device=device,
        workers=args.workers,
        patience=args.patience,
        project=str(output_dir.parent),
        name=output_dir.name,
        exist_ok=True,
        plots=True,
        save=True,
        save_period=10,
        val=True,
        verbose=True,
    )
    elapsed = time.perf_counter() - t0

    log.info("Training complete in %.1f s (%.1f min).", elapsed, elapsed / 60)

    config = {
        "script": "06_train_v2.py",
        "baseline_model": str(baseline),
        "dataset_yaml": str(yaml_path),
        "output_dir": str(output_dir),
        "epochs": args.epochs,
        "patience": args.patience,
        "batch": args.batch,
        "imgsz": args.imgsz,
        "lr0": args.lr0,
        "freeze_layers": args.freeze,
        "device": device,
        "train_images": n_train,
        "val_images": n_val,
        "elapsed_seconds": round(elapsed, 1),
        "baseline_metrics": BASELINE_METRICS,
    }
    with open(output_dir / "training_config_v2.json", "w") as f:
        json.dump(config, f, indent=2)

    best_pt = output_dir / "weights" / "best.pt"
    if best_pt.exists():
        log.info("Best checkpoint: %s", best_pt)
        log.info("The backend will automatically pick this up as the candidate model.")
    else:
        log.warning("best.pt not found at: %s", best_pt)

    log.info("Next: restart the FastAPI backend to load the new candidate model.")


if __name__ == "__main__":
    main()
