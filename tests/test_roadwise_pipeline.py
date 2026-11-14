"""
test_roadwise_pipeline.py - Automated End-to-End Test Suite for RoadWise Platform
"""
import pytest
from pathlib import Path

from api.main import health_check, dashboard_stats
from src.detection.predict import detect, load_model, POTHOLE_MODEL, CRACK_MODEL
from src.scoring.health_score import calculate_condition
from src.scoring.risk_score import analyze_risk


def test_api_health():
    """Verify health endpoint responds with healthy status and dual-model readiness."""
    data = health_check()
    assert data["status"] == "healthy"
    assert data["service"] == "RoadWise API"
    assert data["model"]["exists"] is True
    assert data["model"]["status"] == "ready"
    assert data["inference_mode"] == "dual_model"
    assert data["dual_model"]["pothole_specialist"]["status"] == "ready"
    assert data["dual_model"]["crack_specialist"]["status"] == "ready"


def test_model_loading_and_classes():
    """Verify YOLOv8 pothole model loads and possesses the 4 canonical damage classes."""
    model = load_model(POTHOLE_MODEL)
    assert model is not None
    # 4 classes: D00, D10, D20, D40
    assert 0 in model.names and model.names[0] == "D00"
    assert 1 in model.names and model.names[1] == "D10"
    assert 2 in model.names and model.names[2] == "D20"
    assert 3 in model.names and model.names[3] == "D40"


def test_crack_specialist_loading_and_classes():
    """Verify Experiment C crack specialist model loads and possesses 2 classes."""
    model = load_model(CRACK_MODEL)
    assert model is not None
    assert 0 in model.names and model.names[0] in ["D00", "longitudinal_crack"]
    assert 1 in model.names and model.names[1] in ["D20", "alligator_crack"]


def test_condition_scoring_with_detections():
    """Verify condition score falls under damage load and does not falsely award 100%."""
    sample_detections = [
        {"class_code": "D40", "confidence": 0.21, "x_center": 0.42, "y_center": 0.45, "width": 0.74, "height": 0.47},
        {"class_code": "D40", "confidence": 0.20, "x_center": 0.32, "y_center": 0.46, "width": 0.48, "height": 0.43},
    ]
    res = calculate_condition(sample_detections, min_confidence=0.10)
    assert res["condition_score"] < 100.0
    assert res["condition_score"] > 0.0
    assert res["detections_used"] == 2


def test_condition_scoring_no_detections():
    """Verify condition score is 100% when no damage is detected."""
    res = calculate_condition([], min_confidence=0.10)
    assert res["condition_score"] == 100.0
    assert res["damage_load"] == 0.0


def test_contextual_risk_amplification():
    """Verify sensitive high-traffic locations escalate priority."""
    # Quiet village road
    low_risk = analyze_risk(85.0, "village_road", "low", "none")
    # National highway near hospital
    high_risk = analyze_risk(85.0, "national_highway", "high", "hospital")

    assert high_risk["risk_score"] > low_risk["risk_score"]
    assert high_risk["maintenance_priority"] in ["HIGH", "CRITICAL"]


def test_get_dashboard_stats():
    """Verify dashboard stats endpoint functions."""
    data = dashboard_stats()
    assert "total_inspections" in data
    assert "avg_condition_score" in data


def test_status_lifecycle_and_nearby_inspections():
    """Verify closed-loop status update and spatial proximity queries."""
    from src.database.database import (
        get_all_inspections,
        update_inspection_status,
        get_nearby_inspections,
        get_inspection,
    )

    inspections = get_all_inspections()
    if not inspections:
        return

    target = inspections[0]
    target_id = target["id"]

    # Test status update — returns the updated inspection dict
    updated = update_inspection_status(
        target_id,
        status="WORK_ORDER_ISSUED",
        official_remarks="Priority quick patch scheduled for tonight.",
        assigned_crew="Test Maintenance Crew Alpha",
    )
    assert updated is not None
    assert isinstance(updated, dict)
    assert updated.get("status") == "WORK_ORDER_ISSUED"

    record = get_inspection(target_id)
    assert record["status"] == "WORK_ORDER_ISSUED"
    assert record["assigned_crew"] == "Test Maintenance Crew Alpha"
    assert "Priority quick patch" in record["official_remarks"]

    # Test nearby spatial query if record has GPS
    if record.get("latitude") and record.get("longitude"):
        nearby = get_nearby_inspections(
            latitude=record["latitude"],
            longitude=record["longitude"],
            radius_meters=1000.0,
        )
        assert isinstance(nearby, list)
        assert any(item["id"] == target_id for item in nearby)


