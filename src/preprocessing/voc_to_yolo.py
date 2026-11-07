"""
RoadWise - Pascal VOC XML to YOLO Annotation Converter & Dataset Splitter
========================================================================

ROLE IN ROADWISE ML PIPELINE:
    This script converts raw Road Damage Dataset (RDD2022 India) annotations from Pascal
    VOC XML format into normalized YOLO format (.txt), constructs a reproducible
    70/15/15 train/val/test split, and outputs `data.yaml` for YOLOv8 model training.

DATA TRANSFORMATION & COORDINATE CONVERSION (Viva Core):
    1. Pascal VOC Format (Raw):
       - Pixel-based bounding box: `(xmin, ymin, xmax, ymax)`
       - Coordinate origin: Top-left corner (0,0) in integer pixels.
    2. YOLO Format (Target):
       - Normalized bounding box: `<class_id> <x_center> <y_center> <width> <height>`
       - Coordinate values normalized to range [0.0, 1.0]:
             x_center = (xmin + xmax) / (2 * ImageWidth)
             y_center = (ymin + ymax) / (2 * ImageHeight)
             width    = (xmax - xmin) / ImageWidth
             height   = (ymax - ymin) / ImageHeight

KEY ML & DATA ENGINEERING PRINCIPLES:
    - Rarest-Class Stratification:
      In road damage datasets, class imbalance is extreme (D10 transverse cracks constitute
      <3% of instances, while D40 potholes are dominant). Random splitting risks zero-shot
      evaluation on rare classes. By prioritizing `['D10', 'D00', 'D20', 'D40']`, images
      are grouped by their rarest defect first, ensuring balanced distribution across splits.
    - Background Negative Examples:
      Images containing no road damage are intentionally retained with empty `.txt` label files.
      This prevents false-positive hallucinations on clean asphalt during real-world inference.
    - Seed Reproducibility:
      A fixed pseudo-random seed (`seed=42`) guarantees identical train/val/test splits across runs.

INPUT DIRECTORY:
    `data/raw/RDD2022/India/train/` containing `images/*.jpg` and `annotations/xmls/*.xml`.
OUTPUT DIRECTORIES:
    `data/processed/yolo/{images,labels}/{train,val,test}/`
    `data/processed/yolo/data.yaml`
    `results/metrics/yolo_split_summary.json`
"""
import argparse, json, random, shutil
from collections import Counter, defaultdict
from pathlib import Path
import xml.etree.ElementTree as ET

CLASSES = ["longitudinal_crack", "transverse_crack", "alligator_crack", "pothole"]
RAW2ID = {"D00": 0, "D10": 1, "D20": 2, "D40": 3}
# rarest first, used to pick one stratification key per image
PRIORITY = ["D10", "D00", "D20", "D40"]
IMG_EXT = {".jpg", ".jpeg", ".png"}


def parse_xml(path):
    """
    Parse a single Pascal VOC XML annotation file using `xml.etree.ElementTree`.

    Extracts image dimensions (`<size><width>`, `<size><height>`) and all labeled
    ground-truth objects with bounding box coordinates (`xmin`, `ymin`, `xmax`, `ymax`).

    Args:
        path (Path): Path to the `.xml` annotation file.

    Returns:
        tuple[int, int, list[tuple[str, float, float, float, float]]]:
            (width, height, list of (class_name, xmin, ymin, xmax, ymax))
    """
    root = ET.parse(path).getroot()
    size = root.find("size")
    w, h = int(float(size.find("width").text)), int(float(size.find("height").text))
    objs = []
    for o in root.findall("object"):
        name = o.find("name").text.strip()
        bb = o.find("bndbox")
        x1, y1, x2, y2 = (float(bb.find(k).text) for k in ("xmin", "ymin", "xmax", "ymax"))
        objs.append((name, x1, y1, x2, y2))
    return w, h, objs


def to_yolo(w, h, x1, y1, x2, y2):
    """
    Transform absolute pixel bounding box coordinates to YOLO normalized coordinates.

    Mathematical mapping:
        x_center = ((xmin + xmax) / 2) / width
        y_center = ((ymin + ymax) / 2) / height
        box_width  = (xmax - xmin) / width
        box_height = (ymax - ymin) / height

    Performs defensive coordinate clamping to [0, width] and [0, height] to handle
    imperfect manual annotations that exceed image boundaries.

    Returns:
        tuple[float, float, float, float] | None:
            (x_center, y_center, box_width, box_height) in range (0, 1], or None if box has zero area.
    """
    # Defensive coordinate clamping: prevents negative values or values exceeding image dimensions
    x1, x2 = max(0.0, min(x1, w)), max(0.0, min(x2, w))
    y1, y2 = max(0.0, min(y1, h)), max(0.0, min(y2, h))

    # Calculate geometric width and height in pixel space
    bw, bh = x2 - x1, y2 - y1

    # Reject degenerate / inverted bounding boxes
    if bw <= 0 or bh <= 0:
        return None

    # Compute normalized center coordinates and dimensions in [0.0, 1.0] space
    return ((x1 + x2) / 2 / w, (y1 + y2) / 2 / h, bw / w, bh / h)


def main():
    """
    Execute end-to-end dataset conversion, stratified splitting, and YOLO directory creation.
    """
    ap = argparse.ArgumentParser(description="Convert RDD2022 Pascal VOC annotations to YOLO format.")
    ap.add_argument("--rdd_root", default="data/raw/RDD2022/India", help="Root path of raw RDD2022 country folder")
    ap.add_argument("--out", default="data/processed/yolo", help="Destination path for structured YOLO dataset")
    ap.add_argument("--metrics_dir", default="results/metrics", help="Directory to save split summary metrics JSON")
    ap.add_argument("--train", type=float, default=0.70, help="Fraction of data allocated to training split")
    ap.add_argument("--val", type=float, default=0.15, help="Fraction of data allocated to validation split")
    ap.add_argument("--seed", type=int, default=42, help="Fixed random seed for reproducible splitting")
    a = ap.parse_args()

    # Resolve paths for training images and Pascal VOC annotation XMLs
    base = Path(a.rdd_root) / "train"
    img_dir, xml_dir = base / "images", base / "annotations" / "xmls"
    assert img_dir.exists(), f"Images folder not found: {img_dir}"
    assert xml_dir.exists(), f"XML folder not found: {xml_dir}"
    out = Path(a.out)

    # Collect and sort all valid image files
    images = sorted(p for p in img_dir.iterdir() if p.suffix.lower() in IMG_EXT)
    items = []  # List of tuples: (image_path, yolo_formatted_lines, set_of_raw_classes_present)
    skipped_no_xml = skipped_bad_box = 0

    # Iterate through all images, parse corresponding XMLs, and generate YOLO normalized lines
    for p in images:
        x = xml_dir / f"{p.stem}.xml"
        if not x.exists():
            skipped_no_xml += 1
            continue

        w, h, objs = parse_xml(x)
        lines, present = [], set()

        for name, x1, y1, x2, y2 in objs:
            # Filter out non-target defect classes (keep only D00, D10, D20, D40)
            if name not in RAW2ID:
                continue
            box = to_yolo(w, h, x1, y1, x2, y2)
            if box is None:
                skipped_bad_box += 1
                continue
            present.add(name)
            # Format single YOLO line: `<class_id> <x_center> <y_center> <width> <height>`
            lines.append(f"{RAW2ID[name]} " + " ".join(f"{v:.6f}" for v in box))

        # Retain even if `lines` is empty: serves as negative background example
        items.append((p, lines, present))

    # Stratified grouping: Group images by their rarest defect class
    # PRIORITY = ["D10", "D00", "D20", "D40"] ensures images with rare transverse cracks (D10)
    # are grouped together and distributed proportionally across all 3 splits.
    groups = defaultdict(list)
    for it in items:
        key = next((c for c in PRIORITY if c in it[2]), "empty")
        groups[key].append(it)

    # Initialize seeded pseudo-random generator for exact split reproducibility
    rnd = random.Random(a.seed)
    split = {"train": [], "val": [], "test": []}

    # Partition each stratum into train (70%), val (15%), and test (15%)
    for key, g in groups.items():
        rnd.shuffle(g)
        n = len(g)
        n_tr = round(n * a.train)
        n_va = round(n * a.val)
        split["train"] += g[:n_tr]
        split["val"] += g[n_tr:n_tr + n_va]
        split["test"] += g[n_tr + n_va:]

    # Clean prior output directories to avoid stale or orphaned files
    for sub in ("images", "labels"):
        shutil.rmtree(out / sub, ignore_errors=True)

    summary = {
        "seed": a.seed,
        "classes": CLASSES,
        "skipped_images_without_xml": skipped_no_xml,
        "skipped_invalid_boxes": skipped_bad_box,
        "splits": {}
    }

    # Write images and corresponding .txt label files for each split partition
    for s, lst in split.items():
        (out / "images" / s).mkdir(parents=True, exist_ok=True)
        (out / "labels" / s).mkdir(parents=True, exist_ok=True)
        cc = Counter()

        for p, lines, _ in lst:
            # Copy source image file to destination partition folder
            shutil.copy2(p, out / "images" / s / p.name)

            # Write normalized YOLO label file (or empty file for negative background examples)
            (out / "labels" / s / f"{p.stem}.txt").write_text("\n".join(lines) + ("\n" if lines else ""))

            for ln in lines:
                cc[CLASSES[int(ln.split()[0])]] += 1

        # Record split statistics for audit reporting
        summary["splits"][s] = {
            "images": len(lst),
            "images_without_target_damage": sum(1 for _, l, _ in lst if not l),
            "instances_per_class": {c: cc.get(c, 0) for c in CLASSES},
        }

    # Generate YOLO dataset configuration file: data.yaml
    # Notice: No absolute 'path:' directive is written, allowing the dataset folder to be
    # freely copied or moved between machines without breaking relative path lookups.
    yaml = ["train: images/train", "val: images/val", "test: images/test",
            f"nc: {len(CLASSES)}", "names:"] + [f"  {i}: {c}" for i, c in enumerate(CLASSES)]
    (out / "data.yaml").write_text("\n".join(yaml) + "\n")

    # Persist summary metrics JSON to disk
    Path(a.metrics_dir).mkdir(parents=True, exist_ok=True)
    (Path(a.metrics_dir) / "yolo_split_summary.json").write_text(json.dumps(summary, indent=2))
    print(json.dumps(summary, indent=2))
    print(f"\nYOLO dataset written to: {out}\ndata.yaml: {out / 'data.yaml'}")


if __name__ == "__main__":
    main()
