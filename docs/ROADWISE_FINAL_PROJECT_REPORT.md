# RoadWise: Autonomous Pavement Distress Detection, Health Telemetry, and Municipal Maintenance Prioritization Platform

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
$$\text{Condition Score} = 100 \times \exp\left(-\frac{\text{Damage Load}}{K}\right)$$

Where $K = 2.0$ (calibrated civil decay constant). Individual defect severity is calculated as:
$$\text{Severity}_i = W_{\text{class}} \times \left(0.5 + 0.5 \times \text{conf}_i\right) \times \max\left(0.40, \sqrt{\frac{\text{Area}_i}{0.04}}\right)$$

- **Class Weights ($W_{\text{class}}$):** Pothole D40 (`1.00`), Alligator Crack D20 (`0.80`), Linear Crack D00 (`0.50`).
- **Overlap Discounting:** Secondary overlapping boxes of the same class (IoU > 0.30) are discounted by $0.40\times$.

### 4.2 Context-Calibrated Maintenance Risk
$$\text{Damage Level} = \min\left(100, \frac{100 - \text{Condition}}{40} \times 100\right)$$
$$\text{Context Factor} = 0.30 \times W_{\text{road}} + 0.30 \times W_{\text{traffic}} + 0.40 \times W_{\text{facility}}$$
$$\text{Multiplier} = 0.60 + 1.00 \times \text{Context Factor} \quad \in [0.60, 1.60]$$
$$\text{Risk Score} = \text{Damage Level} \times \text{Multiplier} \quad (\text{Clamped } [0, 100])$$

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
