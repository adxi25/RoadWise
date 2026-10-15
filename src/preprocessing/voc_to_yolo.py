"""
RoadWise - convert RDD2022 (Pascal VOC XML) to YOLO format with a train/val/test split.

Run from the RoadWise folder:
    python src/preprocessing/voc_to_yolo.py --rdd_root data/raw/RDD2022/India

Input : <rdd_root>/train/images/*.jpg  and  <rdd_root>/train/annotations/xmls/*.xml
Output: data/processed/yolo/{images,labels}/{train,val,test}/  +  data.yaml
        results/metrics/yolo_split_summary.json

Notes
- Only 4 classes are kept: D00, D10, D20, D40. Other raw classes are ignored.
- Images with no target damage are kept (empty label file) as negative examples.
- The RDD2022 public test folder has no labels, so we split the labelled train data ourselves.
- Split is stratified by the rarest class in each image so the rare transverse
  crack class appears in val and test. Seed is fixed for reproducibility.
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
    x1, x2 = max(0.0, min(x1, w)), max(0.0, min(x2, w))
    y1, y2 = max(0.0, min(y1, h)), max(0.0, min(y2, h))
    bw, bh = x2 - x1, y2 - y1
    if bw <= 0 or bh <= 0:
        return None
    return ((x1 + x2) / 2 / w, (y1 + y2) / 2 / h, bw / w, bh / h)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--rdd_root", default="data/raw/RDD2022/India")
    ap.add_argument("--out", default="data/processed/yolo")
    ap.add_argument("--metrics_dir", default="results/metrics")
    ap.add_argument("--train", type=float, default=0.70)
    ap.add_argument("--val", type=float, default=0.15)
    ap.add_argument("--seed", type=int, default=42)
    a = ap.parse_args()

    base = Path(a.rdd_root) / "train"
    img_dir, xml_dir = base / "images", base / "annotations" / "xmls"
    assert img_dir.exists(), f"Images folder not found: {img_dir}"
    assert xml_dir.exists(), f"XML folder not found: {xml_dir}"
    out = Path(a.out)

    images = sorted(p for p in img_dir.iterdir() if p.suffix.lower() in IMG_EXT)
    items = []  # (image_path, yolo_lines, raw_classes_present)
    skipped_no_xml = skipped_bad_box = 0
    for p in images:
        x = xml_dir / f"{p.stem}.xml"
        if not x.exists():
            skipped_no_xml += 1
            continue
        w, h, objs = parse_xml(x)
        lines, present = [], set()
        for name, x1, y1, x2, y2 in objs:
            if name not in RAW2ID:
                continue
            box = to_yolo(w, h, x1, y1, x2, y2)
            if box is None:
                skipped_bad_box += 1
                continue
            present.add(name)
            lines.append(f"{RAW2ID[name]} " + " ".join(f"{v:.6f}" for v in box))
        items.append((p, lines, present))

    # stratified split
    groups = defaultdict(list)
    for it in items:
        key = next((c for c in PRIORITY if c in it[2]), "empty")
        groups[key].append(it)
    rnd = random.Random(a.seed)
    split = {"train": [], "val": [], "test": []}
    for key, g in groups.items():
        rnd.shuffle(g)
        n = len(g)
        n_tr = round(n * a.train)
        n_va = round(n * a.val)
        split["train"] += g[:n_tr]
        split["val"] += g[n_tr:n_tr + n_va]
        split["test"] += g[n_tr + n_va:]

    # write files
    for sub in ("images", "labels"):
        shutil.rmtree(out / sub, ignore_errors=True)
    summary = {"seed": a.seed, "classes": CLASSES, "skipped_images_without_xml": skipped_no_xml,
               "skipped_invalid_boxes": skipped_bad_box, "splits": {}}
    for s, lst in split.items():
        (out / "images" / s).mkdir(parents=True, exist_ok=True)
        (out / "labels" / s).mkdir(parents=True, exist_ok=True)
        cc = Counter()
        for p, lines, _ in lst:
            shutil.copy2(p, out / "images" / s / p.name)
            (out / "labels" / s / f"{p.stem}.txt").write_text("\n".join(lines) + ("\n" if lines else ""))
            for ln in lines:
                cc[CLASSES[int(ln.split()[0])]] += 1
        summary["splits"][s] = {
            "images": len(lst),
            "images_without_target_damage": sum(1 for _, l, _ in lst if not l),
            "instances_per_class": {c: cc.get(c, 0) for c in CLASSES},
        }

    # data.yaml (no 'path' line on purpose: paths resolve from the yaml's own folder)
    yaml = ["train: images/train", "val: images/val", "test: images/test",
            f"nc: {len(CLASSES)}", "names:"] + [f"  {i}: {c}" for i, c in enumerate(CLASSES)]
    (out / "data.yaml").write_text("\n".join(yaml) + "\n")

    Path(a.metrics_dir).mkdir(parents=True, exist_ok=True)
    (Path(a.metrics_dir) / "yolo_split_summary.json").write_text(json.dumps(summary, indent=2))
    print(json.dumps(summary, indent=2))
    print(f"\nYOLO dataset written to: {out}\ndata.yaml: {out / 'data.yaml'}")


if __name__ == "__main__":
    main()
