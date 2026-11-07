"""
RoadWise ML Pipeline — Step 01: Pre-Training Dataset Forensic Audit
===================================================================

ROLE IN ROADWISE ML LIFECYCLE:
    Before investing GPU/CPU hours into deep learning training or fine-tuning, this
    script performs a comprehensive quality assurance audit on a raw target dataset.
    It verifies file readability, checks for cryptographic duplicates, validates bounding-box
    label files, and flags corrupt or unannotated images.

TECHNICAL CHECKS PERFORMED:
    1. PIL Verification:
       Invokes `Image.open(p).verify()` to validate image file headers and bitstream
       integrity without fully decompressing raw pixels into memory, avoiding Out-Of-Memory
       crashes on large image collections.
    2. SHA256 Cryptographic Deduplication:
       Reads files in 64 KB blocks (`block=65536`) to compute SHA256 hashes. Detects
       identical images stored under different names or across different subfolders.
       Duplicate images in train and test splits cause data leakage and artificially
       inflated validation scores.
    3. Annotation Topology Audit:
       Identifies whether the dataset contains YOLO `.txt`, Pascal VOC `.xml`, or COCO `.json`,
       validates 5-token rows `(cls_id, cx, cy, w, h)`, and calculates class distribution.

OUTPUT:
    Generates a structured JSON audit report detailing total images, valid counts,
    corrupt files, duplicate groups, and data preparation recommendations.
"""

import argparse
import hashlib
import json
import logging
import os
import sys
from pathlib import Path
from collections import defaultdict

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("audit")

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"}
LABEL_EXTS = {".txt", ".xml", ".json"}


def sha256_of_file(path: Path, block=65536) -> str:
    """
    Compute cryptographic SHA256 hex digest of a file using chunked binary streaming.

    WHY CHUNKED BUFFERING? (Viva Note):
        Reading multi-gigabyte image datasets directly into RAM using `.read()` can exhaust
        available memory. Reading in 64 KB blocks (`block=65536`) maintains a constant,
        negligible memory footprint regardless of file size.

    Args:
        path (Path): Path to the target file.
        block (int): Byte buffer size for incremental updates (default: 65,536 bytes / 64 KB).

    Returns:
        str: 64-character lowercase SHA256 hexadecimal string.
    """
    h = hashlib.sha256()
    with open(path, "rb") as f:
        # Incrementally update hash until End-Of-File (EOF) returns empty bytes
        while chunk := f.read(block):
            h.update(chunk)
    return h.hexdigest()


def check_pil(path: Path):
    """
    Test image bitstream and format integrity using Pillow.

    WHAT IT DOES:
        Opens the image stream and invokes `img.verify()`.
        Unlike `img.load()`, which unpacks every uncompressed pixel into a large numpy-like
        matrix, `verify()` parses header structures, JPEG markers, and PNG chunks to detect
        file truncation or bit corruption with near-zero memory and compute overhead.

    Returns:
        tuple[bool, str | None]: (True, None) if valid, or (False, error_message) if corrupt.
    """
    try:
        from PIL import Image
        img = Image.open(path)
        img.verify()
        return True, None
    except Exception as exc:
        return False, str(exc)


def find_files(root: Path):
    """
    Recursively traverse target directory and categorize files into images, labels, and others.

    Uses `pathlib.Path.rglob("*")` to walk arbitrary nested subfolder structures.
    """
    images, labels, others = [], [], []
    for p in root.rglob("*"):
        if not p.is_file():
            continue
        ext = p.suffix.lower()
        if ext in IMAGE_EXTS:
            images.append(p)
        elif ext in LABEL_EXTS:
            labels.append(p)
        else:
            others.append(p)
    return images, labels, others


def parse_yolo_label(path: Path):
    """
    Parse and validate a standard YOLO-format `.txt` label file.

    Format per row: `<class_id> <x_center> <y_center> <width> <height>`
    Coordinates are normalized floats in range [0.0, 1.0].
    """
    rows = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            parts = line.split()
            # YOLO format strictly expects 5 tokens per line
            if len(parts) == 5:
                try:
                    cls_id = int(parts[0])
                    cx, cy, w, h = map(float, parts[1:])
                    rows.append((cls_id, cx, cy, w, h))
                except ValueError:
                    # Silently skip malformed non-numeric lines
                    pass
    return rows


def main():
    parser = argparse.ArgumentParser(description="Audit road-damage dataset.")
    parser.add_argument("--dataset_dir", required=True, help="Root directory of the dataset.")
    parser.add_argument("--output", default="dataset_audit.json", help="Output JSON report path.")
    args = parser.parse_args()

    root = Path(args.dataset_dir)
    if not root.exists():
        log.error("Dataset directory not found: %s", root)
        sys.exit(1)

    log.info("Scanning: %s", root)
    images, labels, others = find_files(root)

    log.info("Found %d image files, %d label files, %d other files.", len(images), len(labels), len(others))

    # ── Check for corrupt images ─────────────────────────────────────────────
    corrupt = []
    valid_images = []
    log.info("Verifying image integrity (%d files)…", len(images))
    for p in images:
        ok, err = check_pil(p)
        if ok:
            valid_images.append(p)
        else:
            corrupt.append({"path": str(p), "error": err})
            log.warning("  CORRUPT: %s — %s", p.name, err)

    # ── Duplicates (hash-based) ───────────────────────────────────────────────
    log.info("Computing file hashes for duplicate detection…")
    hash_map = defaultdict(list)
    for p in valid_images:
        h = sha256_of_file(p)
        hash_map[h].append(str(p))
    duplicate_groups = [paths for paths in hash_map.values() if len(paths) > 1]
    n_duplicates = sum(len(g) - 1 for g in duplicate_groups)

    # ── Annotation analysis ──────────────────────────────────────────────────
    annotation_report = {
        "total_label_files": len(labels),
        "format": None,
        "note": "",
    }
    class_distribution = {}

    if labels:
        # Check if XML (Pascal VOC) or TXT (YOLO)
        txt_labels = [l for l in labels if l.suffix == ".txt"]
        xml_labels = [l for l in labels if l.suffix == ".xml"]
        json_labels = [l for l in labels if l.suffix == ".json"]

        if txt_labels:
            annotation_report["format"] = "YOLO TXT"
            annotation_report["total_txt"] = len(txt_labels)
            log.info("Found %d YOLO .txt label files.", len(txt_labels))
            for lp in txt_labels:
                rows = parse_yolo_label(lp)
                for cls_id, *_ in rows:
                    class_distribution[cls_id] = class_distribution.get(cls_id, 0) + 1
        if xml_labels:
            annotation_report["format"] = annotation_report.get("format", "") + " + Pascal VOC XML"
            annotation_report["total_xml"] = len(xml_labels)
            log.info("Found %d Pascal VOC .xml label files.", len(xml_labels))
        if json_labels:
            annotation_report["format"] = annotation_report.get("format", "") + " + JSON"
            annotation_report["total_json"] = len(json_labels)

        # Check for images without matching labels
        image_stems = {p.stem for p in valid_images}
        label_stems = {p.stem for p in labels}
        missing_labels = image_stems - label_stems
        extra_labels = label_stems - image_stems
        annotation_report["images_without_labels"] = len(missing_labels)
        annotation_report["labels_without_images"] = len(extra_labels)
    else:
        annotation_report["format"] = "NONE"
        annotation_report["note"] = (
            "No annotation files found.  This dataset contains IMAGES ONLY.  "
            "Bounding-box annotations are required for YOLO fine-tuning.  "
            "Options:\n"
            "  1. Use a tool such as LabelImg or Roboflow to draw bounding boxes.\n"
            "  2. Map class D40 (pothole) and annotate manually.\n"
            "  3. Use the baseline model's predictions as pseudo-labels — "
            "     review and correct them before training."
        )

    # ── Summary ──────────────────────────────────────────────────────────────
    roadwise_id_map = {0: "D00 Longitudinal", 1: "D10 Transverse", 2: "D20 Alligator", 3: "D40 Pothole"}
    class_summary = {
        roadwise_id_map.get(cid, f"class_{cid}"): cnt
        for cid, cnt in sorted(class_distribution.items())
    }

    report = {
        "dataset_dir": str(root),
        "total_files_found": len(images) + len(labels) + len(others),
        "total_image_files": len(images),
        "valid_images": len(valid_images),
        "corrupt_images": len(corrupt),
        "corrupt_details": corrupt,
        "duplicate_groups": len(duplicate_groups),
        "duplicate_image_count": n_duplicates,
        "duplicate_examples": duplicate_groups[:5],
        "annotations": annotation_report,
        "class_distribution": class_summary,
        "other_files": [str(p) for p in others[:10]],
        "verdict": "",
        "training_recommendation": "",
    }

    # ── Verdict ──────────────────────────────────────────────────────────────
    if not labels:
        report["verdict"] = "ANNOTATIONS MISSING — Cannot train without labels."
        report["training_recommendation"] = (
            "1. Annotate all pothole images using LabelImg / Roboflow / CVAT.\n"
            "2. Export in YOLO TXT format.\n"
            "3. Map potholes to class ID 3 (D40).\n"
            "4. Re-run this audit script to verify."
        )
    elif len(corrupt) > len(images) * 0.1:
        report["verdict"] = "WARNING — More than 10% of images are corrupt."
        report["training_recommendation"] = "Remove corrupt images before training."
    else:
        report["verdict"] = "DATASET APPEARS SUITABLE — proceed to dataset preparation."
        report["training_recommendation"] = "Run 03_prepare_dataset.py next."

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(report, f, indent=2)

    log.info("─" * 60)
    log.info("AUDIT REPORT")
    log.info("  Total images:      %d", len(images))
    log.info("  Valid images:      %d", len(valid_images))
    log.info("  Corrupt images:    %d", len(corrupt))
    log.info("  Duplicate images:  %d", n_duplicates)
    log.info("  Annotation files:  %d (%s)", len(labels), annotation_report["format"])
    if class_summary:
        for cls_name, cnt in class_summary.items():
            log.info("    %-25s %d instances", cls_name, cnt)
    log.info("─" * 60)
    log.info("VERDICT: %s", report["verdict"])
    if report["training_recommendation"]:
        log.info("NEXT STEP:\n%s", report["training_recommendation"])
    log.info("Full report saved to: %s", out_path)


if __name__ == "__main__":
    main()
