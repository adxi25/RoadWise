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
    Create and return a connection to the RoadWise SQLite database.
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
    Save one complete RoadWise inspection and its YOLO detections.

    Returns:
        int: ID of the newly created inspection.
    """

    connection = get_connection()
    cursor = connection.cursor()

    try:
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

        inspection_id = cursor.lastrowid

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

        connection.commit()

        return inspection_id

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


def get_inspection(inspection_id):
    """
    Get one inspection and all its detections.
    """

    connection = get_connection()
    cursor = connection.cursor()

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

    if inspection_row is None:
        connection.close()
        return None

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

    inspection["detections"] = [
        dict(zip(detection_columns, row))
        for row in detection_rows
    ]

    connection.close()

    return inspection


def get_all_inspections():
    """
    Get all RoadWise inspections.
    """

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            id,
            report_id,
            latitude,
            longitude,
            state,
            city,
            area,
            road_type,
            condition_score,
            risk_score,
            priority,
            created_at
        FROM inspections
        ORDER BY risk_score DESC
    """)

    rows = cursor.fetchall()

    columns = [
        "id",
        "report_id",
        "latitude",
        "longitude",
        "state",
        "city",
        "area",
        "road_type",
        "condition_score",
        "risk_score",
        "priority",
        "created_at"
    ]

    inspections = [
        dict(zip(columns, row))
        for row in rows
    ]

    connection.close()

    return inspections


if __name__ == "__main__":
    create_tables()

    print("RoadWise database is ready.")
    print(f"Database location: {DATABASE_PATH}")