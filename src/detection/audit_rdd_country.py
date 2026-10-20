"""
RoadWise - audit an RDD zip (official per-country zip OR a multi-country mirror). READ-ONLY.

Usage (from the RoadWise folder):
    python src/detection/audit_rdd_country.py "C:\\path\\to\\file.zip"

Per country (taken from the folder names inside the zip) it reports: annotated images, empty
annotations, target-only vs mixed images, per-class instances/images, median box area, and exact
(byte-identical) duplicates against your India val and test images.
"""
import collections
import hashlib
import pathlib
import statistics
import sys
import xml.etree.ElementTree as ET
import zipfile

TARGET = ["D00", "D10", "D20", "D40"]
COUNTRIES = ["India", "Japan", "Czech", "Norway", "United_States", "China_MotorBike", "China_Drone"]

if len(sys.argv) != 2:
    sys.exit("usage: python audit_rdd_country.py <zip file>")


def country_of(path):
    for part in path.replace("\\", "/").split("/"):
        if part in COUNTRIES:
            return part
    return "unknown"


zf = zipfile.ZipFile(sys.argv[1])
names = [n for n in zf.namelist() if "__MACOSX" not in n and not n.split("/")[-1].startswith("._")]
xmls = [n for n in names if n.lower().endswith(".xml")]
imgs = [n for n in names if n.lower().endswith((".jpg", ".jpeg", ".png"))]
print(f"zip: {len(imgs)} images, {len(xmls)} xml files")

# India val/test hashes
india = {}
for split in ("val", "test"):
    for p in pathlib.Path(f"data/processed/yolo/images/{split}").glob("*"):
        india[hashlib.md5(p.read_bytes()).hexdigest()] = (split, p.name)

bad_xml = 0
stats = collections.defaultdict(lambda: dict(
    n=0, empty=0, tgt=0, mixed=0, other=0,
    inst=collections.Counter(), has=collections.Counter(), areas=collections.defaultdict(list),
))
for n in xmls:
    s = stats[country_of(n)]
    try:
        root = ET.fromstring(zf.read(n))
    except ET.ParseError:
        bad_xml += 1
        continue
    w = float(root.findtext("size/width", "0") or 0)
    h = float(root.findtext("size/height", "0") or 0)
    present = set()
    for o in root.findall("object"):
        c = (o.findtext("name") or "").strip()
        s["inst"][c] += 1
        present.add(c)
        b = o.find("bndbox")
        if b is not None and w and h:
            bw = float(b.findtext("xmax")) - float(b.findtext("xmin"))
            bh = float(b.findtext("ymax")) - float(b.findtext("ymin"))
            s["areas"][c].append(max(bw, 0) * max(bh, 0) / (w * h))
    for c in present:
        s["has"][c] += 1
    s["n"] += 1
    if not present:
        s["empty"] += 1
    elif present & set(TARGET) and present - set(TARGET):
        s["mixed"] += 1
    elif present & set(TARGET):
        s["tgt"] += 1
    else:
        s["other"] += 1

dups = collections.defaultdict(list)
for n in imgs:
    d = hashlib.md5(zf.read(n)).hexdigest()
    if d in india:
        dups[country_of(n)].append((n, india[d]))

print(f"unparseable xml files skipped: {bad_xml}")
for country, s in sorted(stats.items()):
    print(f"\n=== {country}: {s['n']} annotated images | empty {s['empty']} | target-only {s['tgt']} | mixed target+other {s['mixed']} | other-only {s['other']}")
    print("class        instances   images   median box area")
    for c in TARGET + sorted(k for k in s["inst"] if k not in TARGET):
        med = f"{statistics.median(s['areas'][c]):.3f}" if s["areas"][c] else "-"
        tag = "" if c in TARGET else "   (outside RoadWise classes)"
        print(f"{c:<12} {s['inst'][c]:>9} {s['has'][c]:>8}   {med}{tag}")
    print(f"exact duplicates vs India val/test ({len(india)} hashed): {len(dups[country])}")
    for n, (split, name) in dups[country][:5]:
        print("   ", n, "==", split, name)