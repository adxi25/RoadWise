"""
RoadWise - assemble the Candidate A training set and zip it for Colab. Copies only; changes nothing in your project.

Usage (from the RoadWise folder):
    python src/detection/make_candidate_dataset.py "C:\\RDD\\extra_yolo" "C:\\RDD\\candA"

train = ALL India train images (data/processed/yolo)  +  a random 2,700 of the extra train images (seed 42)
val   = India val ONLY (model selection happens here)
The India TEST split is NOT included (it is only used for the final evaluation, on your PC).
Refuses to write if the output folder is not empty. Also writes candA.yaml and <output>.zip.
"""
import collections
import pathlib
import random
import shutil
import sys
import zipfile

if len(sys.argv) != 3:
    sys.exit("usage: python make_candidate_dataset.py <extra_yolo folder> <output folder>")
EXTRA, OUT = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
INDIA = pathlib.Path("data/processed/yolo")
CAP, SEED = 2700, 42
if OUT.exists() and any(OUT.iterdir()):
    sys.exit(f"refusing to write: {OUT} already exists and is not empty")
for p in (INDIA / "images" / "train", INDIA / "images" / "val", EXTRA / "images" / "train"):
    if not p.exists():
        sys.exit(f"missing folder: {p}")

for s in ("train", "val"):
    (OUT / "images" / s).mkdir(parents=True)
    (OUT / "labels" / s).mkdir(parents=True)


def copy_pair(src_root, split, img, dst_split):
    lab = src_root / "labels" / split / (img.stem + ".txt")
    shutil.copy2(img, OUT / "images" / dst_split / img.name)
    if lab.exists():
        shutil.copy2(lab, OUT / "labels" / dst_split / lab.name)
    else:
        (OUT / "labels" / dst_split / lab.name).write_text("")


n_in = collections.Counter()
for s in ("train", "val"):
    for img in sorted((INDIA / "images" / s).glob("*")):
        copy_pair(INDIA, s, img, s)
        n_in[s] += 1
extra = sorted((EXTRA / "images" / "train").glob("*"))
picked = random.Random(SEED).sample(extra, min(CAP, len(extra)))
for img in picked:
    copy_pair(EXTRA, "train", img, "train")

NAMES = ["D00", "D10", "D20", "D40"]
print(f"\nIndia train {n_in['train']} + extra {len(picked)} (of {len(extra)}) -> train {len(list((OUT/'images'/'train').glob('*')))}")
print(f"val (India only): {len(list((OUT/'images'/'val').glob('*')))}")
for label, files in (
    ("train instances: India part", [OUT / "labels" / "train" / (p.stem + ".txt") for p in sorted((INDIA / "images" / "train").glob("*"))]),
    ("train instances: extra part", [OUT / "labels" / "train" / (p.stem + ".txt") for p in picked]),
    ("val instances (India)", sorted((OUT / "labels" / "val").glob("*.txt"))),
):
    c = collections.Counter()
    for f in files:
        for ln in f.read_text().splitlines():
            if ln.strip():
                c[NAMES[int(ln.split()[0])]] += 1
    print(f"{label}: {{{', '.join(f'{k}: {c[k]}' for k in NAMES)}}}")

(OUT / "candA.yaml").write_text(
    "path: /content/candA\ntrain: images/train\nval: images/val\n"
    "names:\n  0: longitudinal_crack\n  1: transverse_crack\n  2: alligator_crack\n  3: pothole\n"
)
zpath = OUT.parent / (OUT.name + ".zip")
with zipfile.ZipFile(zpath, "w", zipfile.ZIP_STORED) as z:
    for f in OUT.rglob("*"):
        if f.is_file():
            z.write(f, f.relative_to(OUT.parent))
print(f"\nzip: {zpath}  ({zpath.stat().st_size/1e6:.0f} MB)")
