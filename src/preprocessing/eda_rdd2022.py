"""
RoadWise Task 1 - RDD2022 dataset understanding + EDA.

Usage (from the RoadWise/ folder):
    python src/preprocessing/eda_rdd2022.py --root data/raw/RDD2022 --country India

Expected layout (official RDD2022 release):
    RDD2022/<Country>/train/images/*.jpg
    RDD2022/<Country>/train/annotations/xmls/*.xml   (Pascal VOC)
    RDD2022/<Country>/test/images/*.jpg              (NO labels in the public release)

All numbers come from the data. Box areas are IMAGE-RELATIVE, not physical sizes.
"""
import argparse, json, random
from pathlib import Path
import xml.etree.ElementTree as ET

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from PIL import Image, ImageDraw
from tqdm import tqdm

TARGET = {"D00": "longitudinal_crack", "D10": "transverse_crack",
          "D20": "alligator_crack", "D40": "pothole"}
COLORS = {"D00": "yellow", "D10": "cyan", "D20": "magenta", "D40": "red"}
IMG_EXT = {".jpg", ".jpeg", ".png"}


def parse_xml(path):
    root = ET.parse(path).getroot()
    size = root.find("size")
    w = h = None
    if size is not None and size.find("width") is not None:
        w, h = int(float(size.find("width").text)), int(float(size.find("height").text))
    objs = []
    for o in root.findall("object"):
        name = o.find("name").text.strip()
        bb = o.find("bndbox")
        x1, y1, x2, y2 = (float(bb.find(k).text) for k in ("xmin", "ymin", "xmax", "ymax"))
        objs.append((name, x1, y1, x2, y2))
    return w, h, objs


def locate(root, country, split):
    base = Path(root) / country / split
    img_dir = base / "images"
    xml_dir = base / "annotations" / "xmls"
    if not xml_dir.exists():
        xml_dir = base / "annotations"
    return img_dir, xml_dir


def build_tables(img_dir, xml_dir, verify):
    xmls = {p.stem: p for p in xml_dir.glob("*.xml")} if xml_dir.exists() else {}
    images = sorted(p for p in img_dir.iterdir() if p.suffix.lower() in IMG_EXT)
    img_rows, ann_rows, problems = [], [], []

    for p in tqdm(images, desc="Scanning images"):
        row = dict(image_id=p.stem, has_xml=p.stem in xmls, corrupt=False,
                   img_w=None, img_h=None, xml_size_mismatch=False, n_objects=0)
        if verify:
            try:
                with Image.open(p) as im:
                    im.verify()
                with Image.open(p) as im:
                    row["img_w"], row["img_h"] = im.size
            except Exception as e:
                row["corrupt"] = True
                problems.append(f"corrupt image {p.name}: {e}")
        if row["has_xml"]:
            try:
                w, h, objs = parse_xml(xmls[p.stem])
                if row["img_w"] is None:
                    row["img_w"], row["img_h"] = w, h
                elif (w, h) != (row["img_w"], row["img_h"]):
                    row["xml_size_mismatch"] = True
                row["n_objects"] = len(objs)
                for name, x1, y1, x2, y2 in objs:
                    ann_rows.append(dict(image_id=p.stem, raw_class=name,
                                         xmin=x1, ymin=y1, xmax=x2, ymax=y2))
            except Exception as e:
                problems.append(f"bad xml {p.stem}.xml: {e}")
        img_rows.append(row)

    img_names = {p.stem for p in images}
    orphans = sorted(set(xmls) - img_names)
    for o in orphans:
        problems.append(f"xml without image: {o}.xml")

    imgs = pd.DataFrame(img_rows)
    ann = pd.DataFrame(ann_rows)
    if not ann.empty:
        ann = ann.merge(imgs[["image_id", "img_w", "img_h"]], on="image_id", how="left")
        ann["class_name"] = ann["raw_class"].map(TARGET).fillna("other")
        ann["is_target"] = ann["raw_class"].isin(TARGET)
        ann["box_w"] = ann.xmax - ann.xmin
        ann["box_h"] = ann.ymax - ann.ymin
        ann["rel_area"] = (ann.box_w * ann.box_h) / (ann.img_w * ann.img_h)
        ann["aspect_ratio"] = ann.box_w / ann.box_h.replace(0, np.nan)
        ann["invalid_box"] = ((ann.box_w <= 0) | (ann.box_h <= 0) | (ann.xmin < 0) |
                              (ann.ymin < 0) | (ann.xmax > ann.img_w) | (ann.ymax > ann.img_h))
    return imgs, ann, problems, len(orphans)


def savefig(fig, path):
    fig.tight_layout()
    fig.savefig(path, dpi=150)
    plt.close(fig)


def make_plots(imgs, ann, fig_dir):
    t = ann[ann.is_target]
    order = list(TARGET.values())
    counts = t.class_name.value_counts().reindex(order).fillna(0)

    fig, ax = plt.subplots(figsize=(7, 4))
    bars = ax.bar(counts.index, counts.values, color=[COLORS[k] for k in TARGET])
    ax.bar_label(bars)
    ax.set_title("Damage instances per class"); ax.set_ylabel("count")
    plt.setp(ax.get_xticklabels(), rotation=20)
    savefig(fig, fig_dir / "class_distribution.png")

    raw = ann.raw_class.value_counts()
    fig, ax = plt.subplots(figsize=(7, 4))
    ax.bar(raw.index, raw.values); ax.set_title("All raw classes in annotations")
    savefig(fig, fig_dir / "raw_class_distribution.png")

    fig, ax = plt.subplots(figsize=(7, 4))
    ax.hist(imgs.n_objects, bins=range(0, int(imgs.n_objects.max()) + 2), edgecolor="k")
    ax.set_title("Objects per image"); ax.set_xlabel("objects"); ax.set_ylabel("images")
    savefig(fig, fig_dir / "objects_per_image.png")

    for col, title, fname in [("rel_area", "Relative box area (box area / image area)", "bbox_rel_area_by_class.png"),
                              ("aspect_ratio", "Box aspect ratio (w/h)", "bbox_aspect_by_class.png")]:
        fig, ax = plt.subplots(figsize=(8, 4.5))
        data = [t[t.class_name == c][col].dropna().values for c in order]
        ax.boxplot(data, tick_labels=order, showfliers=False)
        ax.set_title(title); plt.setp(ax.get_xticklabels(), rotation=20)
        savefig(fig, fig_dir / fname)

    fig, ax = plt.subplots(figsize=(7, 4))
    for c in order:
        ax.hist(t[t.class_name == c].rel_area.clip(upper=0.5), bins=40, alpha=0.5, label=c)
    ax.set_title("Relative area distribution (clipped at 0.5)"); ax.legend()
    savefig(fig, fig_dir / "bbox_rel_area_hist.png")

    sizes = imgs.dropna(subset=["img_w"]).assign(s=lambda d: d.img_w.astype(int).astype(str) + "x" + d.img_h.astype(int).astype(str))
    vc = sizes.s.value_counts().head(8)
    fig, ax = plt.subplots(figsize=(7, 4))
    ax.bar(vc.index, vc.values); ax.set_title("Most common image sizes")
    plt.setp(ax.get_xticklabels(), rotation=25)
    savefig(fig, fig_dir / "image_sizes.png")


def sample_grid(imgs, ann, img_dir, fig_dir, n=12, seed=42):
    rnd = random.Random(seed)
    ids = imgs[imgs.n_objects > 0].image_id.tolist()
    ids = rnd.sample(ids, min(n, len(ids)))
    cols = 4
    rows = int(np.ceil(len(ids) / cols))
    fig, axes = plt.subplots(rows, cols, figsize=(cols * 4, rows * 3.2))
    axes = np.atleast_1d(axes).ravel()
    for ax in axes:
        ax.axis("off")
    for ax, iid in zip(axes, ids):
        path = next(p for p in (img_dir / f"{iid}{e}" for e in (".jpg", ".jpeg", ".png", ".JPG")) if p.exists())
        im = Image.open(path).convert("RGB")
        d = ImageDraw.Draw(im)
        for _, r in ann[ann.image_id == iid].iterrows():
            d.rectangle([r.xmin, r.ymin, r.xmax, r.ymax], outline=COLORS.get(r.raw_class, "white"), width=4)
            d.text((r.xmin + 3, r.ymin + 3), r.raw_class, fill="white")
        ax.imshow(im); ax.set_title(iid, fontsize=8)
    savefig(fig, fig_dir / "sample_annotations.png")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default="data/raw/RDD2022")
    ap.add_argument("--country", default="India")
    ap.add_argument("--split", default="train")
    ap.add_argument("--out", default="results")
    ap.add_argument("--skip-verify", action="store_true", help="skip opening every image (faster)")
    a = ap.parse_args()

    img_dir, xml_dir = locate(a.root, a.country, a.split)
    assert img_dir.exists(), f"Images folder not found: {img_dir}"
    out = Path(a.out); fig_dir = out / "figures"; met_dir = out / "metrics"
    fig_dir.mkdir(parents=True, exist_ok=True); met_dir.mkdir(parents=True, exist_ok=True)

    imgs, ann, problems, n_orphans = build_tables(img_dir, xml_dir, verify=not a.skip_verify)
    assert not ann.empty, f"No annotations found. Check xml folder: {xml_dir}"

    t = ann[ann.is_target]
    summary = {
        "country": a.country, "split": a.split,
        "n_images": int(len(imgs)),
        "images_with_xml": int(imgs.has_xml.sum()),
        "images_without_xml": int((~imgs.has_xml).sum()),
        "images_with_zero_objects": int(((imgs.has_xml) & (imgs.n_objects == 0)).sum()),
        "xml_without_image": n_orphans,
        "corrupt_images": int(imgs.corrupt.sum()),
        "xml_image_size_mismatch": int(imgs.xml_size_mismatch.sum()),
        "total_annotations_all_classes": int(len(ann)),
        "total_annotations_target_classes": int(len(t)),
        "raw_class_counts": ann.raw_class.value_counts().to_dict(),
        "target_class_counts": t.class_name.value_counts().to_dict(),
        "invalid_boxes": int(ann.invalid_box.sum()),
        "mean_objects_per_image": float(imgs.n_objects.mean()),
        "max_objects_per_image": int(imgs.n_objects.max()),
        "imbalance_ratio_max_over_min": float(t.class_name.value_counts().max() / t.class_name.value_counts().min()),
    }
    (met_dir / f"eda_summary_{a.country}.json").write_text(json.dumps(summary, indent=2))
    imgs.to_csv(met_dir / f"images_{a.country}.csv", index=False)
    ann.to_csv(met_dir / f"annotations_{a.country}.csv", index=False)
    stats = t.groupby("class_name")[["box_w", "box_h", "rel_area", "aspect_ratio"]].describe().T
    stats.to_csv(met_dir / f"bbox_stats_{a.country}.csv")
    (met_dir / f"problems_{a.country}.txt").write_text("\n".join(problems) or "none")

    make_plots(imgs, ann, fig_dir)
    sample_grid(imgs, ann, img_dir, fig_dir)

    print(json.dumps(summary, indent=2))
    print(f"\nProblems logged: {len(problems)} (see problems_{a.country}.txt)")
    print(f"Figures -> {fig_dir}\nMetrics -> {met_dir}")


if __name__ == "__main__":
    main()
