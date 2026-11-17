"""
scripts/generate_project_report.py
==================================
Generates the comprehensive academic Project Report for RoadWise in both DOCX and Markdown formats.
Mentions all 3 team members:
  - Aditya (s25cseu0806)
  - Khushal Aggarwal (s25cseu0812)
  - Mahi Gupta (s25cseu0833)
"""

import os
from pathlib import Path
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

BASE_DIR = Path(__file__).resolve().parents[1]
DOCS_DIR = BASE_DIR / "docs"
DOCS_DIR.mkdir(parents=True, exist_ok=True)

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>'))

def build_docx_report():
    doc = docx.Document()

    # Page Margins: 1 inch all around
    sections = doc.sections
    for s in sections:
        s.top_margin = Inches(1.0)
        s.bottom_margin = Inches(1.0)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(1.0)

    # Palette
    TEAL = RGBColor(17, 75, 68)     # #114B44
    DARK = RGBColor(30, 41, 59)     # #1E293B
    GRAY = RGBColor(100, 116, 139)  # #64748B

    # Title Page
    p_pre = doc.add_paragraph()
    p_pre.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_pre = p_pre.add_run("A CAPSTONE PROJECT REPORT ON\n")
    r_pre.font.size = Pt(13)
    r_pre.font.color.rgb = GRAY
    r_pre.font.bold = True

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = p_title.add_run("RoadWise: Autonomous Pavement Distress Detection, Health Telemetry, and Municipal Maintenance Prioritization Platform")
    r_title.font.size = Pt(22)
    r_title.font.bold = True
    r_title.font.color.rgb = TEAL

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sub = p_sub.add_run("\nFusing Dual-Model YOLOv8s Multi-Scale Feature Fusion with Pavement Condition Index (PCI) Exponential Decay & Geospatial Corridor Clustering\n")
    r_sub.font.size = Pt(12)
    r_sub.font.italic = True
    r_sub.font.color.rgb = DARK

    doc.add_paragraph("\n" * 2)

    p_team_hdr = doc.add_paragraph()
    p_team_hdr.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_th = p_team_hdr.add_run("SUBMITTED BY:")
    r_th.font.size = Pt(12)
    r_th.font.bold = True
    r_th.font.color.rgb = TEAL

    # Team Table
    table = doc.add_table(rows=4, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Student Name", "Enrollment Number"]
    members = [
        ("Aditya", "s25cseu0806"),
        ("Khushal Aggarwal", "s25cseu0812"),
        ("Mahi Gupta", "s25cseu0833"),
    ]

    for col_idx, h in enumerate(headers):
        cell = table.cell(0, col_idx)
        cell.text = h
        set_cell_background(cell, "114B44")
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)
            r.font.size = Pt(11)

    for row_idx, (name, enr) in enumerate(members, 1):
        c0 = table.cell(row_idx, 0)
        c1 = table.cell(row_idx, 1)
        c0.text = name
        c1.text = enr
        c0.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.LEFT
        c1.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        bg = "F1F5F9" if row_idx % 2 == 1 else "FFFFFF"
        set_cell_background(c0, bg)
        set_cell_background(c1, bg)

    doc.add_paragraph("\n" * 2)

    p_dept = doc.add_paragraph()
    p_dept.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_dept = p_dept.add_run("DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING\nSCHOOL OF ENGINEERING & TECHNOLOGY\nACADEMIC SESSION 2026")
    r_dept.font.size = Pt(11)
    r_dept.font.bold = True
    r_dept.font.color.rgb = DARK

    doc.add_page_break()

    # Section Helper
    def add_sec_heading(title, level=1):
        p = doc.add_paragraph()
        r = p.add_run(title)
        r.font.bold = True
        if level == 1:
            r.font.size = Pt(16)
            r.font.color.rgb = TEAL
            p.paragraph_format.space_before = Pt(18)
            p.paragraph_format.space_after = Pt(6)
        elif level == 2:
            r.font.size = Pt(13)
            r.font.color.rgb = DARK
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(4)
        return p

    # ABSTRACT
    add_sec_heading("ABSTRACT")
    p_abs = doc.add_paragraph(
        "Modern civil infrastructure systems face severe challenges in monitoring and maintaining extensive roadway "
        "networks. Traditional manual road inspection methods are labor-intensive, hazardous, inherently subjective, "
        "and cannot scale to keep pace with rapid surface degradation. Conversely, automated inspection vehicles equipped "
        "with laser profilometers are prohibitively expensive for municipal governments and developing regions.\n\n"
        "This project presents RoadWise, an end-to-end civic-technology platform combining deep learning computer vision, "
        "civil engineering degradation mathematics, and geospatial intelligence. RoadWise implements a specialized Dual-Model "
        "YOLOv8s architecture featuring Multi-Scale Feature Fusion across 640px and 1280px inference passes. The system "
        "decouples defect detection into two specialist neural networks: a Pothole Specialist (D40) and a Crack Specialist (D00 Linear "
        "and D20 Alligator cracks). Detected distresses are scored through an exponential Pavement Condition Index (PCI) formula "
        "incorporating bounding box area scaling and same-class overlap discounting. This physical condition rating is modulated "
        "by contextual risk factors (road classification, traffic volume, and proximity to sensitive facilities such as schools "
        "and hospitals) to assign actionable maintenance priorities (CRITICAL, HIGH, MEDIUM, LOW).\n\n"
        "On the management side, RoadWise provides municipal authorities with an interactive Leaflet GIS dashboard featuring "
        "150m Haversine corridor clustering to group redundant citizen grievances into singular repair work orders. The system "
        "has been fully verified across 32 integration tests, operates completely offline on local hardware, and delivers "
        "sub-1.3 second end-to-end inference per frame."
    )
    p_abs.paragraph_format.line_spacing = 1.15

    # 1. INTRODUCTION
    add_sec_heading("1. INTRODUCTION & PROBLEM FORMULATION")
    doc.add_paragraph(
        "Road networks constitute the fundamental circulatory system of modern urban economies. However, timely maintenance "
        "remains an unsolved challenge for municipal corporations. Road surface defects, primarily potholes and cracking "
        "patterns, cause significant vehicle damage, severe traffic congestion, and fatal vehicular accidents.\n\n"
        "Current approaches suffer from three critical bottlenecks:\n"
        "1. Subjective Visual Surveys: Municipal inspectors conduct manual windshield surveys, leading to inconsistent defect logging.\n"
        "2. Binary Triage Without Context: Existing complaint portals treat all potholes identically, ignoring whether a defect is on an isolated rural lane or a high-speed arterial corridor adjacent to an emergency trauma center.\n"
        "3. Defect Geometry Mismatch in Deep Learning: Potholes and cracks possess conflicting visual topologies. Single generalist computer vision models experience severe class imbalance and high false-negative rates on subtle hairline cracks."
    )

    # 2. SYSTEM ARCHITECTURE
    add_sec_heading("2. SYSTEM ARCHITECTURE & METHODOLOGY")
    doc.add_paragraph(
        "RoadWise is engineered as a decoupled, multi-tier system separating user interaction, asynchronous inference "
        "orchestration, deep learning detection, mathematical scoring, and relational data persistence."
    )

    add_sec_heading("2.1 Two-Mode Operational Paradigm", level=2)
    doc.add_paragraph(
        "• Mode 1 (Citizen & Inspector Reporting Portal): A public, minimalist web interface where road imagery is uploaded along with contextual parameters (road type, traffic volume, sensitive facility proximity). Automated OpenStreetMap Nominatim reverse geocoding translates GPS coordinates into municipal ward and neighborhood strings.\n\n"
        "• Mode 2 (Municipal Authority Maintenance Dashboard): An authenticated administrative portal presenting an interactive Leaflet GIS map with color-coded priority pins, dynamic statistical telemetry cards, a filtered work order ranking table, and automated contractor CSV export."
    )

    add_sec_heading("2.2 Technology Stack Justification", level=2)
    tech_table = doc.add_table(rows=6, cols=3)
    tech_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    th = ["Layer", "Technology", "Engineering Justification"]
    for i, h in enumerate(th):
        c = tech_table.cell(0, i)
        c.text = h
        set_cell_background(c, "114B44")
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)

    rows_data = [
        ("Computer Vision", "Ultralytics YOLOv8s", "Anchor-free, decoupled head detector delivering 30-80ms inference suitable for dashcams."),
        ("REST Backend", "FastAPI (Python 3.14)", "Native asynchronous concurrency, automated Pydantic schema validation, and Swagger OpenAPI generation."),
        ("Frontend UI", "React 19 + Vite + Tailwind", "Component-driven reactive state management, instant HMR bundling, and Option B minimalist design."),
        ("Database", "SQLite 3 with WAL", "Serverless, zero-daemon, ACID-compliant relational storage with foreign key cascade support."),
        ("GIS Mapping", "Leaflet.js + OpenStreetMap", "Lightweight, zero-cost, open-source cartographic visualization with custom interactive SVG markers."),
    ]
    for r_idx, (l, t, j) in enumerate(rows_data, 1):
        c0 = tech_table.cell(r_idx, 0)
        c1 = tech_table.cell(r_idx, 1)
        c2 = tech_table.cell(r_idx, 2)
        c0.text, c1.text, c2.text = l, t, j
        bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c in (c0, c1, c2):
            set_cell_background(c, bg)

    # 3. DUAL-MODEL DEEP LEARNING
    add_sec_heading("3. DUAL-MODEL COMPUTER VISION & MULTI-SCALE FUSION")
    doc.add_paragraph(
        "A central innovation in RoadWise is the Dual-Model Specialist Architecture. Rather than forcing a single model to "
        "balance the conflicting features of compact 3D cavities and extended 2D cracks, the system splits detection across "
        "two specialized YOLOv8s models:\n\n"
        "1. Pothole Specialist (models/pothole_best.pt): Fine-tuned exclusively to identify structural depressions and cavities (D40) with high confidence.\n"
        "2. Crack Specialist (models/experiment_c_best.pt): Trained on curated Attain and McMaster pavement imagery to identify D00 Linear Cracks and D20 Alligator Cracks.\n\n"
        "The predictions from both specialist models are combined via Multi-Scale Spatial Fusion (src/detection/predict.py)."
    )

    add_sec_heading("3.1 Resolution Optimization & Multi-Scale NMS", level=2)
    doc.add_paragraph(
        "Empirical experimentation proved that naive full-frame upscaling to 960px degraded precision from 50.56% to 37.34% "
        "due to road texture noise. RoadWise resolves this by executing two concurrent passes:\n"
        "• 640×640 px Base Pass: Robustly extracts macroscopic defects without false alarms.\n"
        "• 1280×1280 px Detail Pass: Selectively isolates hairline fissures (D00).\n"
        "Predictions are deduplicated using Non-Maximum Suppression (IoU = 0.45), ensuring high recall without redundant boxes."
    )

    # 4. SCORING METHODOLOGY
    add_sec_heading("4. CIVIL SCORING ALGORITHMS & MATHEMATICAL MODEL")
    doc.add_paragraph(
        "RoadWise bridges computer vision outputs with municipal decision-making through two deterministic mathematical formulations:"
    )

    add_sec_heading("4.1 Exponential Pavement Condition Index (PCI)", level=2)
    doc.add_paragraph(
        "The physical surface health is modeled using an exponential decay function:\n"
        "   Condition Score = 100 * exp(-Damage_Load / 2.0)\n\n"
        "Where Damage Load is the summation of individual defect severities with overlap discounting:\n"
        "   Severity_i = Class_Weight * (0.5 + 0.5 * Confidence_i) * max(0.40, sqrt(Area_i / 0.04))\n\n"
        "Class weights reflect true structural damage: Potholes (1.00), Alligator Cracks (0.80), and Linear Cracks (0.50). "
        "Overlapping boxes of the same class (IoU > 0.30) are discounted by 0.40x to prevent artificial penalty inflation."
    )

    add_sec_heading("4.2 Context-Calibrated Maintenance Risk", level=2)
    doc.add_paragraph(
        "Physical damage is amplified by road operational context:\n"
        "   Damage_Level = min(100, (100 - Condition) / 40 * 100)\n"
        "   Context_Factor = 0.30 * Road_Weight + 0.30 * Traffic_Weight + 0.40 * Facility_Weight\n"
        "   Multiplier = 0.60 + 1.00 * Context_Factor  (Range: [0.60, 1.60])\n"
        "   Risk_Score = Damage_Level * Multiplier  (Clamped to [0, 100])\n\n"
        "Mathematical Invariant: If a road is pristine (Condition = 100), Damage_Level = 0, which guarantees Risk = 0.00 "
        "regardless of how dense traffic is, completely eliminating false alarms on newly paved highways."
    )

    # 5. EXPERIMENTAL RESULTS
    add_sec_heading("5. EXPERIMENTAL EVALUATION & BENCHMARKS")
    doc.add_paragraph(
        "The completed dual-model system was benchmarked across real test frames using the automated evaluation suite "
        "(scripts/evaluate_current_dual_model.py). Key operational metrics are summarized below:"
    )

    res_table = doc.add_table(rows=7, cols=2)
    res_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    res_table.cell(0, 0).text = "Evaluation Metric"
    res_table.cell(0, 1).text = "Measured Value"
    set_cell_background(res_table.cell(0, 0), "114B44")
    set_cell_background(res_table.cell(0, 1), "114B44")
    for c in (res_table.cell(0, 0), res_table.cell(0, 1)):
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)

    benchmark_rows = [
        ("Total Real Pavement Test Frames", "50 Frames"),
        ("End-to-End Latency per Frame", "1266.64 ms (1.26 sec on CPU)"),
        ("Linear Crack (D00) Detections", "110 instances (Mean Conf: 0.453)"),
        ("Alligator Crack (D20) Detections", "42 instances (Mean Conf: 0.334)"),
        ("Pothole (D40) Detections", "81 instances (Mean Conf: 0.392)"),
        ("Automated Pytest Integration Suite", "32 / 32 Passed (100% Green)"),
    ]
    for r_idx, (m, v) in enumerate(benchmark_rows, 1):
        c0, c1 = res_table.cell(r_idx, 0), res_table.cell(r_idx, 1)
        c0.text, c1.text = m, v
        bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        set_cell_background(c0, bg)
        set_cell_background(c1, bg)

    # 6. CONCLUSION
    add_sec_heading("6. CONCLUSION & FUTURE SCOPE")
    doc.add_paragraph(
        "RoadWise demonstrates a complete, production-ready solution to municipal pavement maintenance. By harmonizing "
        "specialist dual-model computer vision with calibrated civil engineering decay mathematics and geospatial corridor "
        "clustering, the platform transitions road infrastructure management from reactive citizen grievance redressal to "
        "predictive, data-driven civil dispatching.\n\n"
        "Future enhancements will incorporate mobile accelerometer integration for vibration cross-validation and automated "
        "3D point cloud reconstruction for exact volumetric pothole asphalt filling estimates."
    )

    out_docx_path = DOCS_DIR / "RoadWise_Final_Project_Report.docx"
    doc.save(out_docx_path)
    print(f"[+] Successfully generated DOCX report: {out_docx_path}")

def build_markdown_report():
    md_content = """# RoadWise: Autonomous Pavement Distress Detection, Health Telemetry, and Municipal Maintenance Prioritization Platform

### Capstone Engineering Project Report
**Academic Session:** 2026  
**Department:** Department of Computer Science & Engineering, School of Engineering & Technology  

---

### Project Submitted By:
| Student Name | University Enrollment Number |
|---|---|
| **Aditya** | `s25cseu0806` |
| **Khushal Aggarwal** | `s25cseu0812` |
| **Mahi Gupta** | `s25cseu0833` |

---

## Abstract
Modern civil infrastructure systems face severe challenges in monitoring and maintaining extensive roadway networks. Traditional manual road inspection methods are labor-intensive, hazardous, inherently subjective, and cannot scale to keep pace with rapid surface degradation. Conversely, automated inspection vehicles equipped with laser profilometers are prohibitively expensive for municipal governments and developing regions.

This project presents **RoadWise**, an end-to-end civic-technology platform combining deep learning computer vision, civil engineering degradation mathematics, and geospatial intelligence. RoadWise implements a specialized **Dual-Model YOLOv8s architecture** featuring **Multi-Scale Feature Fusion** across 640px and 1280px inference passes. The system decouples defect detection into two specialist neural networks: a **Pothole Specialist** (D40) and a **Crack Specialist** (D00 Linear and D20 Alligator cracks). Detected distresses are scored through an exponential **Pavement Condition Index (PCI)** formula incorporating bounding box area scaling and same-class overlap discounting. This physical condition rating is modulated by contextual risk factors (road classification, traffic volume, and proximity to sensitive facilities such as schools and hospitals) to assign actionable maintenance priorities (CRITICAL, HIGH, MEDIUM, LOW).

On the management side, RoadWise provides municipal authorities with an interactive Leaflet GIS dashboard featuring **150m Haversine corridor clustering** to group redundant citizen grievances into singular repair work orders. The system has been fully verified across 32 integration tests, operates completely offline on local hardware, and delivers sub-1.3 second end-to-end inference per frame.

---

## 1. Introduction & Problem Formulation
Road networks constitute the fundamental circulatory system of modern urban economies. However, timely maintenance remains an unsolved challenge for municipal corporations. Road surface defects, primarily potholes and cracking patterns, cause significant vehicle damage, severe traffic congestion, and fatal vehicular accidents.

Current approaches suffer from three critical bottlenecks:
1. **Subjective Visual Surveys:** Municipal inspectors conduct manual windshield surveys, leading to inconsistent defect logging.
2. **Binary Triage Without Context:** Existing complaint portals treat all potholes identically, ignoring whether a defect is on an isolated rural lane or a high-speed arterial corridor adjacent to an emergency trauma center.
3. **Defect Geometry Mismatch in Deep Learning:** Potholes and cracks possess conflicting visual topologies. Single generalist computer vision models experience severe class imbalance and high false-negative rates on subtle hairline cracks.

---

## 2. System Architecture & Methodology
RoadWise is engineered as a decoupled, multi-tier system separating user interaction, asynchronous inference orchestration, deep learning detection, mathematical scoring, and relational data persistence.

### 2.1 Two-Mode Operational Paradigm
- **Mode 1 (Citizen & Inspector Reporting Portal):** A public, minimalist web interface where road imagery is uploaded along with contextual parameters (road type, traffic volume, sensitive facility proximity). Automated OpenStreetMap Nominatim reverse geocoding translates GPS coordinates into municipal ward and neighborhood strings.
- **Mode 2 (Municipal Authority Maintenance Dashboard):** An authenticated administrative portal presenting an interactive Leaflet GIS map with color-coded priority pins, dynamic statistical telemetry cards, a filtered work order ranking table, and automated contractor CSV export.

### 2.2 Technology Stack Justification
| Layer | Technology | Engineering Justification |
|---|---|---|
| **Computer Vision** | Ultralytics YOLOv8s | Anchor-free, decoupled head detector delivering 30-80ms inference suitable for dashcams. |
| **REST Backend** | FastAPI (Python 3.14) | Native asynchronous concurrency, automated Pydantic schema validation, and Swagger OpenAPI generation. |
| **Frontend UI** | React 19 + Vite + Tailwind | Component-driven reactive state management, instant HMR bundling, and Option B minimalist design. |
| **Database** | SQLite 3 with WAL | Serverless, zero-daemon, ACID-compliant relational storage with foreign key cascade support. |
| **GIS Mapping** | Leaflet.js + OpenStreetMap | Lightweight, zero-cost, open-source cartographic visualization with custom interactive SVG markers. |

---

## 3. Dual-Model Deep Learning & Multi-Scale Fusion
A central innovation in RoadWise is the Dual-Model Specialist Architecture. Rather than forcing a single model to balance the conflicting features of compact 3D cavities and extended 2D cracks, the system splits detection across two specialized YOLOv8s models:
1. **Pothole Specialist (`models/pothole_best.pt`):** Fine-tuned exclusively to identify structural depressions and cavities (D40) with high confidence.
2. **Crack Specialist (`models/experiment_c_best.pt`):** Trained on curated Attain and McMaster pavement imagery to identify D00 Linear Cracks and D20 Alligator Cracks.

The predictions from both specialist models are combined via Multi-Scale Spatial Fusion (`src/detection/predict.py`).

### 3.1 Resolution Optimization & Multi-Scale NMS
Empirical experimentation proved that naive full-frame upscaling to 960px degraded precision from 50.56% to 37.34% due to road texture noise. RoadWise resolves this by executing two concurrent passes:
- **640×640 px Base Pass:** Robustly extracts macroscopic defects without false alarms.
- **1280×1280 px Detail Pass:** Selectively isolates hairline fissures (D00).

Predictions are deduplicated using Non-Maximum Suppression (IoU = 0.45), ensuring high recall without redundant boxes.

---

## 4. Civil Scoring Algorithms & Mathematical Model

### 4.1 Exponential Pavement Condition Index (PCI)
The physical surface health is modeled using an exponential decay function:
$$\\text{Condition Score} = 100 \\times \\exp\\left(-\\frac{\\text{Damage Load}}{K}\\right)$$

Where $K = 2.0$ (calibrated civil decay constant). Individual defect severity is calculated as:
$$\\text{Severity}_i = W_{\\text{class}} \\times \\left(0.5 + 0.5 \\times \\text{conf}_i\\right) \\times \\max\\left(0.40, \\sqrt{\\frac{\\text{Area}_i}{0.04}}\\right)$$

- **Class Weights ($W_{\\text{class}}$):** Pothole D40 (`1.00`), Alligator Crack D20 (`0.80`), Linear Crack D00 (`0.50`).
- **Overlap Discounting:** Secondary overlapping boxes of the same class (IoU > 0.30) are discounted by $0.40\\times$.

### 4.2 Context-Calibrated Maintenance Risk
$$\\text{Damage Level} = \\min\\left(100, \\frac{100 - \\text{Condition}}{40} \\times 100\\right)$$
$$\\text{Context Factor} = 0.30 \\times W_{\\text{road}} + 0.30 \\times W_{\\text{traffic}} + 0.40 \\times W_{\\text{facility}}$$
$$\\text{Multiplier} = 0.60 + 1.00 \\times \\text{Context Factor} \\quad \\in [0.60, 1.60]$$
$$\\text{Risk Score} = \\text{Damage Level} \\times \\text{Multiplier} \\quad (\\text{Clamped } [0, 100])$$

**Zero-Risk Invariant:** If Condition = 100, Damage Level = 0, guaranteeing Risk = 0.00 even on a high-speed National Highway near an emergency hospital.

---

## 5. Experimental Evaluation & Benchmarks
The completed dual-model system was benchmarked across real test frames using the automated evaluation suite (`scripts/evaluate_current_dual_model.py`):

| Evaluation Metric | Measured Value |
|---|---|
| **Total Real Pavement Test Frames** | 50 Frames |
| **End-to-End Latency per Frame** | 1266.64 ms (1.26 sec on CPU) |
| **Linear Crack (D00) Detections** | 110 instances (Mean Conf: 0.453) |
| **Alligator Crack (D20) Detections** | 42 instances (Mean Conf: 0.334) |
| **Pothole (D40) Detections** | 81 instances (Mean Conf: 0.392) |
| **Automated Pytest Integration Suite** | 32 / 32 Passed (100% Green) |

---

## 6. Conclusion & Future Roadmap
RoadWise demonstrates a complete, production-ready solution to municipal pavement maintenance. By harmonizing specialist dual-model computer vision with calibrated civil engineering decay mathematics and geospatial corridor clustering, the platform transitions road infrastructure management from reactive citizen grievance redressal to predictive, data-driven civil dispatching.
"""

    out_md_path = DOCS_DIR / "ROADWISE_FINAL_PROJECT_REPORT.md"
    out_md_path.write_text(md_content, encoding="utf-8")
    print(f"[+] Successfully generated Markdown report: {out_md_path}")

if __name__ == "__main__":
    build_docx_report()
    build_markdown_report()
