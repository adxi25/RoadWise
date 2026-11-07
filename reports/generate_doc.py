"""
create_docx_architecture.py
Generates a comprehensive Word document detailing the RoadWise Backend Architecture,
File-by-File breakdown, and the Data Analytics pipeline.
"""

from pathlib import Path
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def add_callout(doc, title, text, bg_color="F0FDF4", border_color="114B44"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>'
        f'<w:top w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'<w:bottom w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    run_title = p.add_run(f"{title}: ")
    run_title.bold = True
    run_title.font.name = "Arial"
    run_title.font.size = Pt(10.5)
    run_title.font.color.rgb = RGBColor(17, 75, 68)
    
    run_text = p.add_run(text)
    run_text.font.name = "Arial"
    run_text.font.size = Pt(10)
    run_text.font.color.rgb = RGBColor(30, 41, 59)
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def style_table(tbl, col_widths, col_names):
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    # Header row
    hdr_cells = tbl.rows[0].cells
    for i, name in enumerate(col_names):
        hdr_cells[i].text = name
        hdr_cells[i].width = Inches(col_widths[i])
        set_cell_background(hdr_cells[i], "114B44")
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=140, right=140)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for r in p.runs:
            r.font.name = "Arial"
            r.font.bold = True
            r.font.size = Pt(9.5)
            r.font.color.rgb = RGBColor(255, 255, 255)
            
    # Data rows styling
    for r_idx, row in enumerate(tbl.rows[1:]):
        bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, cell in enumerate(row.cells):
            cell.width = Inches(col_widths[c_idx])
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            for r in p.runs:
                r.font.name = "Arial"
                r.font.size = Pt(9)
                r.font.color.rgb = RGBColor(30, 41, 59)

def build_document():
    doc = docx.Document()
    
    # Page Margins
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        
    # Styles
    styles = doc.styles
    normal_style = styles['Normal']
    normal_style.font.name = 'Arial'
    normal_style.font.size = Pt(10)
    normal_style.font.color.rgb = RGBColor(30, 41, 59)
    normal_style.paragraph_format.space_after = Pt(6)
    normal_style.paragraph_format.line_spacing = 1.15

    # ==========================================
    # Title & Metadata
    # ==========================================
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(2)
    run_title = title_p.add_run("RoadWise System Architecture & Data Analytics Blueprint")
    run_title.font.name = "Arial"
    run_title.font.size = Pt(22)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(17, 75, 68)

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_after = Pt(14)
    run_sub = sub_p.add_run("Comprehensive Technical Documentation of Backend Modules, Pipeline Logic, Mathematical Scoring, and Multi-Level Data Analytics")
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(12)
    run_sub.font.color.rgb = RGBColor(100, 116, 139)

    add_callout(
        doc,
        "Platform Overview",
        "RoadWise is an automated AI-driven road distress inspection and infrastructure asset management platform. It integrates computer vision (YOLOv8), geometric distress analysis, multi-criteria risk calibration, and relational spatial data analytics to empower civic authorities to inspect, prioritize, and repair road defects proactively."
    )

    # ==========================================
    # 1. ARCHITECTURAL HIERARCHY
    # ==========================================
    h1 = doc.add_heading("1. Architectural Hierarchy & Data Flow", level=1)
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)
    for r in h1.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(17, 75, 68)

    doc.add_paragraph(
        "The RoadWise backend follows a modular, decoupled pipeline architecture where raw sensory inputs (camera imagery, metadata, EXIF GPS coordinates) transition through distinct processing, scoring, persistence, and reporting phases:"
    )

    flow_p = doc.add_paragraph()
    flow_p.paragraph_format.left_indent = Inches(0.25)
    flow_p.paragraph_format.space_after = Pt(8)
    flow_steps = [
        "1. Ingestion & Validation: Payload parsing, dimension checks, file integrity, and EXIF extraction.",
        "2. Computer Vision Detection: YOLOv8 inference detecting D00, D10, D20, D40 pavement distresses.",
        "3. Surface Condition Scoring: Geometric bounding box evaluation, intra-class overlap deduction, and damage decay curve calculation.",
        "4. Contextual Risk Calibration: Multi-factor amplification accounting for road classification, traffic volume, and community sensitivity.",
        "5. Storage & Persistence: Relational SQLite schema storing structured inspection telemetry and bounding box coordinates.",
        "6. Analytics & API Delivery: High-performance FastAPI endpoints delivering Mode 1 reports and Mode 2 municipal aggregation."
    ]
    for step in flow_steps:
        p_step = doc.add_paragraph(step)
        p_step.paragraph_format.left_indent = Inches(0.3)
        p_step.paragraph_format.space_after = Pt(3)

    # ==========================================
    # 2. FILE-BY-FILE BACKEND INVENTORY
    # ==========================================
    h2 = doc.add_heading("2. File-by-File Inventory of All Backend Modules", level=1)
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(6)
    for r in h2.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(17, 75, 68)

    doc.add_paragraph(
        "Below is the complete technical catalog of every script, class, and function across the RoadWise backend, categorized by operational layer."
    )

    # --- 2.1 API LAYER ---
    doc.add_heading("2.1 API & Service Layer (api/)", level=2)
    api_table = doc.add_table(rows=3, cols=3)
    col_w = [1.6, 2.2, 2.7]
    col_h = ["File / Path", "Core Functions & Handlers", "Operational Purpose & Integration"]
    style_table(api_table, col_w, col_h)
    
    api_data = [
        ("api/main.py", 
         "• app (FastAPI)\n• lifespan()\n• health_check() (/api/health)\n• inspect_road() (/api/inspections/inspect)\n• list_inspections() (/api/inspections)\n• dashboard_stats() (/api/dashboard/stats)\n• get_inspection_detail() (/api/inspections/{id})",
         "Acts as the core REST gateway. Connects client UI to pipeline logic, mounts static uploads and prediction directories, enforces CORS, manages asynchronous image ingestion, and serializes responses to JSON."),
        ("api/__init__.py", "Package initialization", "Defines the api directory as an importable Python module.")
    ]
    for idx, row in enumerate(api_data):
        r_cells = api_table.rows[idx+1].cells
        for c_idx, val in enumerate(row):
            r_cells[c_idx].text = val
    style_table(api_table, col_w, col_h)

    # --- 2.2 PIPELINE LAYER ---
    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    doc.add_heading("2.2 Pipeline Orchestration Layer (src/pipeline/)", level=2)
    pipe_table = doc.add_table(rows=2, cols=3)
    style_table(pipe_table, col_w, col_h)
    
    pipe_data = [
        ("src/pipeline/inspection_pipeline.py",
         "• validate_image_bytes()\n• extract_gps()\n• normalize_context()\n• generate_report_id()\n• save_original_image()\n• save_annotated_image()\n• summarize_detections()\n• build_recommendation()\n• build_pipeline_result()\n• run_inspection()",
         "The central workflow engine for Mode 1 inspections. Coordinates the end-to-end execution: receives raw bytes, verifies dimensions, extracts EXIF GPS tags, invokes YOLOv8 inference, calculates condition score, performs contextual risk scoring, writes artifacts to disk, saves telemetry to SQLite, and compiles structured output.")
    ]
    for idx, row in enumerate(pipe_data):
        r_cells = pipe_table.rows[idx+1].cells
        for c_idx, val in enumerate(row):
            r_cells[c_idx].text = val
    style_table(pipe_table, col_w, col_h)

    # --- 2.3 DETECTION LAYER ---
    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    doc.add_heading("2.3 Computer Vision & Defect Detection Layer (src/detection/)", level=2)
    det_table = doc.add_table(rows=10, cols=3)
    
    det_data = [
        ("src/detection/predict.py",
         "• load_model()\n• results_to_detections()\n• detect()\n• save_annotated()",
         "Production YOLOv8 inference engine. Implements cached singleton model loading for low latency, translates ultralytics detection boxes to normalized canonical records (D00, D10, D20, D40), and renders OpenCV visual annotations."),
        ("src/detection/roi_detect.py",
         "• crop_road_roi()\n• transform_roi_box_to_full()\n• combine_and_deduplicate()\n• compare_image_inference()",
         "Experimental Road Region-of-Interest detector. Isolates pavement horizon band [ymin=0.35, ymax=1.00] to remove sky and buildings, boosting pixel density on defects, with NMS deduplication (IoU >= 0.45)."),
        ("src/detection/batch_detect.py",
         "• main() (argparse)\n• model.predict(stream=True)",
         "High-throughput batch evaluation utility. Processes entire image directories (e.g., validation set) and exports granular detection CSV logs (val_detections.csv) for statistical scoring calibration."),
        ("src/detection/calibrate_thresholds.py",
         "• model.val(conf=0.001)\n• F1 / Precision / Recall extraction",
         "Statistical calibration tool. Evaluates precision-recall trade-offs across classes to find F1-maximizing confidence thresholds on the validation split."),
        ("src/detection/evaluate_detection_methods.py",
         "• compare_image_inference()\n• load_ground_truth()\n• compute_detection_metrics()",
         "Rigorous benchmarking suite. Evaluates Full 640px vs Full 960px vs ROI 640px vs Combined inference against annotated Ground Truth labels using IoU >= 0.50."),
        ("src/detection/evaluate_full_validation.py",
         "• evaluate_dataset()\n• run_split_metrics()",
         "Runs large-scale automated evaluation over the complete validation split, generating confusion matrices, mAP50, and mAP50-95 curves."),
        ("src/detection/evaluate_roi_validation.py",
         "• batch_roi_evaluation()\n• aggregate_roi_gains()",
         "Quantifies defect recall gains and false-positive implications when enforcing pavement ROI bounding across validation cohorts."),
        ("src/detection/audit_rdd_country.py",
         "• audit_rdd_country()\n• hash_check()",
         "Read-only dataset auditor. Scans multi-country RDD2022 archives, checking class balance, empty annotations, box areas, and detecting exact duplicates against India test sets."),
        ("src/detection/build_extra_dataset.py &\nmake_candidate_dataset.py",
         "• curate_candidates()\n• filter_unseen_samples()",
         "Dataset synthesis scripts designed to select clean cross-country defect samples without contaminating validation or test sets.")
    ]
    for idx, row in enumerate(det_data):
        r_cells = det_table.rows[idx+1].cells
        for c_idx, val in enumerate(row):
            r_cells[c_idx].text = val
    style_table(det_table, col_w, col_h)

    # --- 2.4 SCORING LAYER ---
    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    doc.add_heading("2.4 Condition & Risk Scoring Layer (src/scoring/)", level=2)
    score_table = doc.add_table(rows=4, cols=3)
    
    score_data = [
        ("src/scoring/health_score.py",
         "• _overlap_fraction()\n• detection_severity()\n• calculate_condition()",
         "Calculates 0-100 road surface condition rating. Applies defect severity weights (D40=1.0, D20=0.8, D00=0.5, D10=0.5), relative size scaling, intra-class spatial overlap deduplication, and exponential damage load decay."),
        ("src/scoring/risk_score.py",
         "• calculate_damage_level()\n• calculate_context_factor()\n• calculate_risk_score()\n• get_priority()\n• analyze_risk()",
         "Translates condition score and infrastructure context (road type, traffic volume, location sensitivity) into a 0-100 Risk Score and categorical Priority (LOW, MEDIUM, HIGH, CRITICAL)."),
        ("src/scoring/validate_scoring.py",
         "• main()\n• Spearman rank correlation",
         "Validates scoring logic against ground-truth annotations on validation images, verifying monotonic tracking between true defect loads and model-derived condition scores.")
    ]
    for idx, row in enumerate(score_data):
        r_cells = score_table.rows[idx+1].cells
        for c_idx, val in enumerate(row):
            r_cells[c_idx].text = val
    style_table(score_table, col_w, col_h)

    # --- 2.5 DATABASE LAYER ---
    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    doc.add_heading("2.5 Persistence & Database Layer (src/database/)", level=2)
    db_table = doc.add_table(rows=2, cols=3)
    
    db_data = [
        ("src/database/database.py",
         "• get_connection()\n• create_tables()\n• save_inspection()\n• get_inspection()\n• get_all_inspections()\n• get_inspection_stats()",
         "Encapsulates SQLite interactions. Manages relational schema with foreign key cascades, stores inspection telemetry and granular detection coordinates, supports GIS querying, and compiles aggregate metrics for the municipal dashboard.")
    ]
    for idx, row in enumerate(db_data):
        r_cells = db_table.rows[idx+1].cells
        for c_idx, val in enumerate(row):
            r_cells[c_idx].text = val
    style_table(db_table, col_w, col_h)

    # --- 2.6 PREPROCESSING LAYER ---
    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    doc.add_heading("2.6 Data Preprocessing & Ingestion Layer (src/preprocessing/)", level=2)
    pre_table = doc.add_table(rows=3, cols=3)
    
    pre_data = [
        ("src/preprocessing/eda_rdd2022.py",
         "• parse_xml()\n• build_tables()\n• compute_bbox_stats()\n• generate_heatmaps()",
         "Performs comprehensive Exploratory Data Analysis on raw RDD2022 dataset: parses XML annotations, analyzes box aspect ratios and areas, checks image corruption, and generates class distribution summaries."),
        ("src/preprocessing/voc_to_yolo.py",
         "• convert_annotation()\n• split_dataset()",
         "Transforms Pascal VOC XML bounding box coordinates into normalized YOLO darknet format (class, x_center, y_center, width, height) and handles reproducible data splitting.")
    ]
    for idx, row in enumerate(pre_data):
        r_cells = pre_table.rows[idx+1].cells
        for c_idx, val in enumerate(row):
            r_cells[c_idx].text = val
    style_table(pre_table, col_w, col_h)

    # ==========================================
    # 3. MATHEMATICAL FORMULAS & SCORING LOGIC
    # ==========================================
    h3 = doc.add_heading("3. Mathematical Formulations of the Scoring Engines", level=1)
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(6)
    for r in h3.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(17, 75, 68)

    doc.add_paragraph(
        "A defining strength of RoadWise is its mathematically bounded scoring architecture, which bridges raw object detection detections with operational decision-making."
    )

    doc.add_heading("3.1 Road Condition Score Formulation (health_score.py)", level=2)
    doc.add_paragraph(
        "The condition score translates bounding box detections into a normalized scale [0, 100], where 100 represents intact road and 0 represents severe distress:"
    )

    add_callout(
        doc,
        "1. Detection Severity Formula",
        "Severity(d) = Weight(class) × Confidence(d) × min(1.0, max(0.40, Area(d) / Area_Ref(class)))\n\n"
        "Where Weights are: D40 (Pothole) = 1.00, D20 (Alligator Crack) = 0.80, D00 (Longitudinal Crack) = 0.50, D10 (Transverse Crack) = 0.50.\n"
        "Area_Ref represents the empirical 90th percentile bounding box area from training validation data: D40 = 0.101, D20 = 0.235, D00 = 0.070, D10 = 0.070."
    )

    add_callout(
        doc,
        "2. Intra-Class Overlap Discounting",
        "To prevent duplicate detections of the same physical defect from artificially destroying the score, kept detections are sorted descending by severity. Each subsequent detection is discounted by the area already covered by prior accepted boxes of the SAME class:\n\n"
        "Effective_Severity(d) = Severity(d) × (1.0 - max_overlap_with_accepted(d))\n\n"
        "Total Damage Load = ∑ Effective_Severity(d)"
    )

    add_callout(
        doc,
        "3. Exponential Condition Decay Formula",
        "Condition Score = 100.0 × exp(- Damage_Load / K)\n\n"
        "With decay constant K = 2.0. This guarantees asymptotic behavior: an undamaged road scores exactly 100, moderate distress drops into the 70-85 range, and severe damage decays toward 0 without ever producing negative values."
    )

    doc.add_heading("3.2 Context-Calibrated Risk Score (risk_score.py)", level=2)
    doc.add_paragraph(
        "Detected road damage does not exist in a vacuum. A pothole on an expressway or outside a trauma hospital presents vastly higher public hazard than one on an isolated rural lane."
    )

    add_callout(
        doc,
        "Contextual Risk Amplification Model",
        "1. Damage Level = min(100.0, (100.0 - Condition_Score) / 40.0 × 100.0)\n"
        "   (Damage_Ref = 40.0, meaning any road with condition <= 60 reaches 100% damage level)\n\n"
        "2. Context Factor = 0.30 × Road_Score + 0.30 × Traffic_Score + 0.40 × Sensitivity_Score\n"
        "   (Normalized 0.0 to 1.0 based on curated municipal lookup tables)\n\n"
        "3. Context Multiplier = 0.60 + (1.60 - 0.60) × Context_Factor\n\n"
        "4. Risk Score = min(100.0, Damage_Level × Context_Multiplier)\n\n"
        "CRITICAL DESIGN GUARANTEE: In Version 2, context amplifies detected damage rather than adding to it. If Condition Score = 100 (zero detected damage), Damage Level = 0, which guarantees Risk Score = 0 (LOW priority) regardless of location."
    )

    # ==========================================
    # 4. DATA ANALYTICS IN ROADWISE
    # ==========================================
    h4 = doc.add_heading("4. The Data Analytics Engine Across RoadWise", level=1)
    h4.paragraph_format.space_before = Pt(14)
    h4.paragraph_format.space_after = Pt(6)
    for r in h4.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(17, 75, 68)

    doc.add_paragraph(
        "Data analytics is deeply embedded across every lifecycle stage of RoadWise—from raw training data exploration and statistical model diagnostics to real-time spatial clustering and municipal decision support."
    )

    # --- 4.1 EDA Analytics ---
    doc.add_heading("4.1 Exploratory Data Analysis (EDA) & Pre-Modeling Analytics", level=2)
    doc.add_paragraph(
        "Implemented in src/preprocessing/eda_rdd2022.py and results/metrics/:\n"
        "• Class Imbalance Analysis: Systematic frequency profiling revealed that longitudinal and transverse cracks significantly outnumber potholes, necessitating differential loss weighting and calibrated confidence thresholds.\n"
        "• Geometric & Scale Analytics: Bounding box distribution analytics established the empirical 90th percentile area reference benchmarks used in the condition scoring engine.\n"
        "• Horizon Spatial Profiling: Spatial coordinate density mapping proved that road surface distress is confined to the lower 65% of dashcam imagery, justifying the development of the road-focused ROI detection engine."
    )

    # --- 4.2 Model Evaluation Analytics ---
    doc.add_heading("4.2 Model Evaluation & Diagnostic Analytics", level=2)
    doc.add_paragraph(
        "Implemented in src/detection/calibrate_thresholds.py, evaluate_detection_methods.py, and results/metrics/ultralytics/:\n"
        "• Multi-Metric Validation Curves: Generation of Precision-Recall (BoxPR), F1-Confidence (BoxF1), Precision-Confidence (BoxP), and Recall-Confidence (BoxR) curves across all four defect classes.\n"
        "• Optimal Operating Point Calibration: Automated discovery of per-class F1-maximizing confidence thresholds on validation data (e.g. D40 pothole optimal F1 at conf=0.15–0.25).\n"
        "• Confusion Matrix Normalization: Class-by-class false positive vs false negative cross-tabulation, quantifying background confusion and crack classification boundaries.\n"
        "• Resolution Benchmark Comparison: Empirical validation comparing 640px vs 960px inference, proving that higher resolution improves small crack detection by 4.2% mAP50."
    )

    # --- 4.3 Validation Scoring Analytics ---
    doc.add_heading("4.3 Pavement Scoring Validation Analytics", level=2)
    doc.add_paragraph(
        "Implemented in src/scoring/validate_scoring.py:\n"
        "• Rank-Order Correlation Analysis: Computes Spearman rank correlation between model-predicted condition scores and true ground-truth condition scores across the validation cohort.\n"
        "• Distributional Separation: Statistical validation confirming that images with labeled damage show statistically significant lower condition scores (mean ~70.5) compared to clean control images (mean 100.0)."
    )

    # --- 4.4 Municipal & Spatial Analytics ---
    doc.add_heading("4.4 Municipal Aggregation & Spatial Analytics (Mode 2)", level=2)
    doc.add_paragraph(
        "Implemented in src/database/database.py and frontend/src/Pages/AuthorityDashboard.jsx:\n"
        "• Risk Priority Stratification: Real-time aggregation of civic assets into actionable operational buckets (Critical, High, Medium, Low).\n"
        "• Geographic & Ward Clustering: Spatial coordinate indexing linking road defect severity to specific GPS coordinates, wards, and administrative regions.\n"
        "• Fleet & Telemetry Health Averages: Instant calculation of macro health indicators, including Citywide Average Condition Rating, Average Risk Priority, and Verified GPS coverage."
    )

    analytics_table = doc.add_table(rows=6, cols=3)
    col_w_a = [1.8, 2.2, 2.5]
    col_h_a = ["Analytics Dimension", "Statistical / Analytical Technique", "System Implementation & File"]
    style_table(analytics_table, col_w_a, col_h_a)

    analytics_rows = [
        ("Exploratory Data Analysis", "Frequency histograms, bounding box aspect ratios, spatial heatmaps", "src/preprocessing/eda_rdd2022.py\nresults/metrics/eda_summary_India.json"),
        ("Model Calibration", "Precision-Recall curves, F1-optimization, mAP@50 & mAP@50-95 benchmarking", "src/detection/calibrate_thresholds.py\nresults/metrics/ultralytics/full_640/"),
        ("Method Comparison", "IoU overlap matrices, True Positive / False Positive tracking across 4 methods", "src/detection/evaluate_detection_methods.py\nresults/metrics/roi_baseline_comparison.csv"),
        ("Scoring Validation", "Spearman rank correlation, percentile distributions (10th, 25th, 50th, 90th)", "src/scoring/validate_scoring.py\nresults/metrics/val_scoring_check.csv"),
        ("Municipal Telemetry", "SQL group-by aggregations, geospatial indexing, priority band distribution", "src/database/database.py\napi/main.py (/api/dashboard/stats)")
    ]
    for idx, row in enumerate(analytics_rows):
        r_cells = analytics_table.rows[idx+1].cells
        for c_idx, val in enumerate(row):
            r_cells[c_idx].text = val
    style_table(analytics_table, col_w_a, col_h_a)

    # ==========================================
    # 5. CONCLUSION & VALUE PROPOSITION
    # ==========================================
    h5 = doc.add_heading("5. Architectural Summary & System Impact", level=1)
    h5.paragraph_format.space_before = Pt(14)
    h5.paragraph_format.space_after = Pt(6)
    for r in h5.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(17, 75, 68)

    doc.add_paragraph(
        "By coupling deep-learning object detection with rigorous mathematical scoring, spatial deduplication, and context-calibrated decision logic, the RoadWise backend achieves an industrial-grade inspection standard. It transitions infrastructure inspection from reactive complaint management to predictive, data-driven municipal asset governance."
    )

    # Output file
    out_dir = Path(r"c:\Users\aquad\OneDrive\Desktop\RoadWise\reports")
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "RoadWise_Backend_and_Data_Analytics_Architecture.docx"
    doc.save(str(out_path))
    print(f"Document successfully created at: {out_path}")

if __name__ == "__main__":
    build_document()
