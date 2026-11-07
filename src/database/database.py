"""
RoadWise - SQLite Database & Persistence Layer
==============================================

ROLE IN ROADWISE ARCHITECTURE:
    This module manages the persistent relational storage for RoadWise, serving as the
    central data bridge between Mode 1 (Inspection Pipeline write operations) and
    Mode 2 (Authority Dashboard read operations).

DATABASE SCHEMA & RELATIONAL DESIGN:
    1. `inspections` Table (Parent):
       - Primary Key: `id` (INTEGER AUTOINCREMENT)
       - Unique Identifier: `report_id` (TEXT UNIQUE) e.g., 'RW-20261007-180530-A7F2'
       - Spatial & Regional Data: `latitude`, `longitude`, `state`, `city`, `area`
       - Operational Context: `road_type`, `traffic_level`, `location_sensitivity`
       - Analytical Results: `condition_score` [0-100], `risk_score` [0-100], `priority`
       - Asset References: `image_path`, `annotated_image_path`, `pdf_path`
       - Temporal Metadata: `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

    2. `detections` Table (Child):
       - Primary Key: `id` (INTEGER AUTOINCREMENT)
       - Foreign Key: `inspection_id` REFERENCES inspections(id) ON DELETE CASCADE
       - Classification: `class_code` (e.g., 'D40'), `class_name` (e.g., 'pothole')
       - Model Metrics: `confidence` [0.0 to 1.0]
       - Normalized Bounding Box: `x_center`, `y_center`, `width`, `height` [0.0 to 1.0]

KEY VIVA QUESTIONS & CONCEPTS:
    - Q: Why SQLite for RoadWise?
      A: Serverless, zero-configuration, self-contained single-file storage. It eliminates external
         database daemon dependencies during deployment and testing while handling millions of records.
    - Q: Why is `PRAGMA foreign_keys = ON` explicitly executed?
      A: For backward compatibility, SQLite defaults foreign key enforcement to OFF. RoadWise
         explicitly enables it on every connection to enforce cascading deletions and prevent orphaned records.
    - Q: What indexing strategy is implemented?
      A: Secondary B-Tree indexes are created on `priority`, `state`, `city`, `(latitude, longitude)`,
         and foreign key `inspection_id`. This accelerates filtering, regional grouping, spatial queries,
         and JOIN operations from O(N) linear scans to O(log N) tree lookups.
    - Q: How is atomicity guaranteed?
      A: `save_inspection()` wraps the parent insertion and all child detection insertions in a single
         transaction. If any box insertion fails, `connection.rollback()` is invoked so partial data is never committed.
"""

import sqlite3
from pathlib import Path


# Project root directory
BASE_DIR = Path(__file__).resolve().parents[2]

# Database location
DATABASE_DIR = BASE_DIR / "data"
DATABASE_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_PATH = DATABASE_DIR / "roadwise.db"


def get_connection():
    """
    Create and return an active connection to the RoadWise SQLite database.

    Enforces relational integrity via `PRAGMA foreign_keys = ON`.
    """
    connection = sqlite3.connect(DATABASE_PATH)
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def create_tables():
    """
    Create all RoadWise database tables.
    """

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS inspections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            report_id TEXT UNIQUE NOT NULL,

            image_path TEXT,
            annotated_image_path TEXT,

            latitude REAL,
            longitude REAL,

            state TEXT,
            city TEXT,
            area TEXT,

            road_type TEXT,
            traffic_level TEXT,
            location_sensitivity TEXT,

            condition_score REAL,
            risk_score REAL,
            priority TEXT,

            recommendation TEXT,

            pdf_path TEXT,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS detections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            inspection_id INTEGER NOT NULL,

            class_code TEXT NOT NULL,
            class_name TEXT NOT NULL,

            confidence REAL NOT NULL,

            x_center REAL,
            y_center REAL,
            width REAL,
            height REAL,

            FOREIGN KEY (inspection_id)
                REFERENCES inspections(id)
                ON DELETE CASCADE
        )
    """)

    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_inspections_priority
        ON inspections(priority)
    """)

    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_inspections_state
        ON inspections(state)
    """)

    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_inspections_city
        ON inspections(city)
    """)

    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_inspections_location
        ON inspections(latitude, longitude)
    """)

    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_detections_inspection
        ON detections(inspection_id)
    """)

    connection.commit()
    connection.close()


def save_inspection(inspection, detections):
    """
    Save one complete RoadWise inspection and its associated YOLO detections atomically.

    TRANSACTION MANAGEMENT & ATOMICITY (Viva Key Concept):
    ------------------------------------------------------
    Inserting an inspection requires modifying two relational tables: `inspections` (parent)
    and `detections` (children). If any error occurs while inserting child bounding boxes
    (e.g., malformed float or constraint violation), `connection.rollback()` cancels the
    entire transaction so partial or orphaned records are never committed to disk.

    SQL PARAMETERIZATION:
    --------------------
    All queries use parameterized placeholders (`?`) to prevent SQL injection attacks.

    Parameters:
    -----------
    inspection : dict
        Parent inspection data containing report_id, coordinates, scores, priority, etc.
    detections : list[dict]
        List of bounding box detections returned by predict.py.

    Returns:
    --------
    int: Autoincrement primary key ID of the newly inserted inspection row.
    """
    connection = get_connection()
    cursor = connection.cursor()

    try:
        # Step 1: Insert parent record into `inspections` table
        cursor.execute("""
            INSERT INTO inspections (
                report_id,
                image_path,
                annotated_image_path,
                latitude,
                longitude,
                state,
                city,
                area,
                road_type,
                traffic_level,
                location_sensitivity,
                condition_score,
                risk_score,
                priority,
                recommendation,
                pdf_path
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            inspection["report_id"],
            inspection.get("image_path"),
            inspection.get("annotated_image_path"),
            inspection.get("latitude"),
            inspection.get("longitude"),
            inspection.get("state"),
            inspection.get("city"),
            inspection.get("area"),
            inspection.get("road_type"),
            inspection.get("traffic_level"),
            inspection.get("location_sensitivity"),
            inspection.get("condition_score"),
            inspection.get("risk_score"),
            inspection.get("priority"),
            inspection.get("recommendation"),
            inspection.get("pdf_path")
        ))

        # Retrieve the newly generated autoincrement primary key for foreign key linking
        inspection_id = cursor.lastrowid

        # Step 2: Insert child records into `detections` table referencing `inspection_id`
        for detection in detections:
            cursor.execute("""
                INSERT INTO detections (
                    inspection_id,
                    class_code,
                    class_name,
                    confidence,
                    x_center,
                    y_center,
                    width,
                    height
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                inspection_id,
                detection["class_code"],
                detection["class_name"],
                detection["confidence"],
                detection.get("x_center"),
                detection.get("y_center"),
                detection.get("width"),
                detection.get("height")
            ))

        # Atomic commit: writes both parent and all children permanently to disk
        connection.commit()

        return inspection_id

    except Exception:
        # On any exception, undo all uncommitted changes in this transaction
        connection.rollback()
        raise

    finally:
        # Guarantee database socket connection is always closed to avoid file lock leaks
        connection.close()


def get_inspection(inspection_id):
    """
    Retrieve a single inspection record joined with all its child bounding box detections.

    Parameters:
    -----------
    inspection_id : int
        The primary key ID of the inspection record.

    Returns:
    --------
    dict | None: Dictionary representation of the inspection with nested 'detections' list,
                 or None if no record matches the ID.
    """
    connection = get_connection()
    cursor = connection.cursor()

    # Query parent record
    cursor.execute("""
        SELECT
            id,
            report_id,
            image_path,
            annotated_image_path,
            latitude,
            longitude,
            state,
            city,
            area,
            road_type,
            traffic_level,
            location_sensitivity,
            condition_score,
            risk_score,
            priority,
            recommendation,
            pdf_path,
            created_at
        FROM inspections
        WHERE id = ?
    """, (inspection_id,))

    inspection_row = cursor.fetchone()

    # If ID does not exist, close connection and return None (FastAPI maps this to HTTP 404)
    if inspection_row is None:
        connection.close()
        return None

    # Map raw SQL row tuple into a structured dictionary
    inspection_columns = [
        "id",
        "report_id",
        "image_path",
        "annotated_image_path",
        "latitude",
        "longitude",
        "state",
        "city",
        "area",
        "road_type",
        "traffic_level",
        "location_sensitivity",
        "condition_score",
        "risk_score",
        "priority",
        "recommendation",
        "pdf_path",
        "created_at"
    ]

    inspection = dict(zip(inspection_columns, inspection_row))

    # Query all child detection rows linked by foreign key
    cursor.execute("""
        SELECT
            id,
            class_code,
            class_name,
            confidence,
            x_center,
            y_center,
            width,
            height
        FROM detections
        WHERE inspection_id = ?
    """, (inspection_id,))

    detection_rows = cursor.fetchall()

    detection_columns = [
        "id",
        "class_code",
        "class_name",
        "confidence",
        "x_center",
        "y_center",
        "width",
        "height"
    ]

    # Attach nested detections list to parent dictionary
    inspection["detections"] = [
        dict(zip(detection_columns, row))
        for row in detection_rows
    ]

    connection.close()

    return inspection


def get_all_inspections():
    """
    Retrieve all RoadWise inspections with defect counts, sorted deterministically by risk score.

    SQL DESIGN & PERFORMANCE NOTES (Viva Key Concept):
    ---------------------------------------------------
    - Uses a `LEFT JOIN` between `inspections` and `detections` so that roads with zero defects
      are still preserved in the query output with `detection_count = 0`.
    - `GROUP BY i.id` aggregates multiple child bounding boxes into a single row count per road.
    - `ORDER BY i.risk_score DESC, i.id DESC`: Ensures deterministic sorting order where high-risk
      roads appear first, with autoincrement `id` acting as a secondary tie-breaker.

    Returns:
    --------
    list[dict]: List of all inspection records formatted for Mode 2 table and map visualization.
    """
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            i.id,
            i.report_id,
            i.image_path,
            i.annotated_image_path,
            i.latitude,
            i.longitude,
            i.state,
            i.city,
            i.area,
            i.road_type,
            i.traffic_level,
            i.location_sensitivity,
            i.condition_score,
            i.risk_score,
            i.priority,
            i.recommendation,
            i.pdf_path,
            i.created_at,
            COUNT(d.id) AS detection_count
        FROM inspections i
        LEFT JOIN detections d ON i.id = d.inspection_id
        GROUP BY i.id
        ORDER BY i.risk_score DESC, i.id DESC
    """)

    rows = cursor.fetchall()

    columns = [
        "id",
        "report_id",
        "image_path",
        "annotated_image_path",
        "latitude",
        "longitude",
        "state",
        "city",
        "area",
        "road_type",
        "traffic_level",
        "location_sensitivity",
        "condition_score",
        "risk_score",
        "priority",
        "recommendation",
        "pdf_path",
        "created_at",
        "detection_count"
    ]

    # Convert list of row tuples to list of dictionaries
    inspections = [
        dict(zip(columns, row))
        for row in rows
    ]

    connection.close()

    return inspections


def get_inspection_stats():
    """
    Calculate aggregate infrastructure metrics across all stored inspections in a single query.

    SQL AGGREGATION HIGHLIGHTS:
    ---------------------------
    - Uses `SUM(CASE WHEN ... THEN 1 ELSE 0 END)` to compute conditional counts per priority tier
      in a single table pass, avoiding 4 separate round-trip queries.
    - `AVG(condition_score)` and `AVG(risk_score)` calculate fleet-wide health averages.
    - Counts valid non-null coordinates to measure GIS geographic map coverage.

    Returns:
    --------
    dict: Statistical KPI summary consumed by Mode 2 MetricCards component.
    """
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            COUNT(*) AS total_inspections,
            SUM(CASE WHEN UPPER(priority) = 'CRITICAL' THEN 1 ELSE 0 END) AS critical_count,
            SUM(CASE WHEN UPPER(priority) = 'HIGH' THEN 1 ELSE 0 END) AS high_count,
            SUM(CASE WHEN UPPER(priority) = 'MEDIUM' THEN 1 ELSE 0 END) AS medium_count,
            SUM(CASE WHEN UPPER(priority) = 'LOW' THEN 1 ELSE 0 END) AS low_count,
            AVG(condition_score) AS avg_condition_score,
            AVG(risk_score) AS avg_risk_score,
            SUM(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 ELSE 0 END) AS valid_gps_count
        FROM inspections
    """)
    row = cursor.fetchone()
    connection.close()

    # Defensive handling for empty database (zero inspections recorded)
    if not row or row[0] == 0:
        return {
            "total_inspections": 0,
            "critical_count": 0,
            "high_count": 0,
            "medium_count": 0,
            "low_count": 0,
            "avg_condition_score": 0.0,
            "avg_risk_score": 0.0,
            "valid_gps_count": 0,
        }

    return {
        "total_inspections": row[0] or 0,
        "critical_count": row[1] or 0,
        "high_count": row[2] or 0,
        "medium_count": row[3] or 0,
        "low_count": row[4] or 0,
        "avg_condition_score": round(row[5], 2) if row[5] is not None else 0.0,
        "avg_risk_score": round(row[6], 2) if row[6] is not None else 0.0,
        "valid_gps_count": row[7] or 0,
    }


if __name__ == "__main__":
    create_tables()

    print("RoadWise database is ready.")
    print(f"Database location: {DATABASE_PATH}")