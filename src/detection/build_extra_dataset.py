"""
RoadWise - build the extra four-class YOLO training data from the RDD2020/RDD2022 train zip.
Reads the zip in place; writes ONLY to the output folder you give (refuses if it is not empty).
Does not touch your project, data/processed, or models/.

Usage (from the RoadWise folder):
    python src/detection/build_extra_dataset.py "C:\\RDD\\train.zip" "C:\\RDD\\extra_yolo"

Rules (from the audit):
  - countries used: Japan, Czech  (India is skipped: it is byte-identical to your own India data)
  - keep an image only if it has >=1 box AND every box is D00/D10/D20/D40
    (images that also contain D43/D44/D50 etc. are dropped whole, so no unlabelled objects remain)
  - class ids match best.pt: 0 D00 longitudinal, 1 D10 transverse, 2 D20 alligator, 3 D40 pothole
  - 10% of the kept images (seed 42) go to 'holdout' for reporting only; the rest go to 'train'
"""
import collections
import io
import pathlib
import random
import sys
import zipfile
import xml.etree.ElementTree as ET

from PIL import Image

if len(sys.argv) != 3:
    sys.exit('usage: python build_extra_dataset.py <train.zip> <output folder>')
ZIP, OUT = sys.argv[1], pathlib.Path(sys.argv[2])
if OUT.exists() and any(OUT.iterdir()):
    sys.exit(f"refusing to write: {OUT} already exists and is not empty")

MAP = {"D00": 0, "D10": 1, "D20": 2, "D40": 3}
CLS = ["D00", "D10", "D20", "D40"]
USE = ["Japan", "Czech"]
HOLDOUT, SEED = 0.10, 42

zf = zipfile.ZipFile(ZIP)
names = [n for n in zf.namelist() if "__MACOSX" not in n and not n.split("/")[-1].startswith("._")]


def country_of(path):
    for part in path.split("/"):
        if part in USE:
            return part
    return None


xmls, imgs = {}, {}
for n in names:
    c = country_of(n)
    if not c:
        continue
    stem = n.split("/")[-1].rsplit(".", 1)[0]
    if n.lower().endswith(".xml"):
        xmls[(c, stem)] = n
    elif n.lower().endswith((".jpg", ".jpeg", ".png")):
        imgs[(c, stem)] = n

skipped = collections.Counter()
kept = []  # (country, stem, ext, label_lines, classes)
for key, xp in sorted(xmls.items()):
    if key not in imgs:
        skipped["xml without image"] += 1
        continue
    root = ET.fromstring(zf.read(xp))
    objs = root.findall("object")
    names_here = [(o.findtext("name") or "").strip() for o in objs]
    if not objs:
        skipped["no boxes"] += 1
        continue
    if any(nm not in MAP for nm in names_here):
        skipped["has class outside D00/D10/D20/D40"] += 1
        continue
    data = zf.read(imgs[key])
    W, H = Image.open(io.BytesIO(data)).size
    lines, classes = [], []
    for o, nm in zip(objs, names_here):
        b = o.find("bndbox")
        x1, y1, x2, y2 = (float(b.findtext(t)) for t in ("xmin", "ymin", "xmax", "ymax"))
        x1, x2 = max(0.0, min(x1, W)), max(0.0, min(x2, W))
        y1, y2 = max(0.0, min(y1, H)), max(0.0, min(y2, H))
        if x2 - x1 < 2 or y2 - y1 < 2:
            skipped["degenerate box (box dropped)"] += 1
            continue
        lines.append(f"{MAP[nm]} {(x1+x2)/2/W:.6f} {(y1+y2)/2/H:.6f} {(x2-x1)/W:.6f} {(y2-y1)/H:.6f}")
        classes.append(nm)
    if not lines:
        skipped["no valid boxes left"] += 1
        continue
    kept.append((key[0], key[1], imgs[key].rsplit(".", 1)[1].lower(), lines, classes, data))

random.Random(SEED).shuffle(kept)
n_hold = int(len(kept) * HOLDOUT)
split_of = ["holdout"] * n_hold + ["train"] * (len(kept) - n_hold)

for s in ("train", "holdout"):
    (OUT / "images" / s).mkdir(parents=True)
    (OUT / "labels" / s).mkdir(parents=True)
inst = {s: collections.Counter() for s in ("train", "holdout")}
per = collections.Counter()
for (c, stem, ext, lines, classes, data), s in zip(kept, split_of):
    (OUT / "images" / s / f"{stem}.{ext}").write_bytes(data)
    (OUT / "labels" / s / f"{stem}.txt").write_text("\n".join(lines) + "\n")
    inst[s].update(classes)
    per[(c, s)] += 1

print(f"\nkept {len(kept)} images -> {OUT}")
for k, v in sorted(per.items()):
    print(f"  {k[0]} {k[1]}: {v}")
print("skipped:", dict(skipped))
for s in ("train", "holdout"):
    print(f"\n{s} instances:", {c: inst[s][c] for c in CLS})
