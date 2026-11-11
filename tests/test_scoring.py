"""
test_scoring.py - Automated Unit Tests for RoadWise Condition & Risk Scoring Engines
"""
import pytest
from src.scoring.health_score import calculate_condition, detection_severity
from src.scoring.risk_score import (
    analyze_risk,
    calculate_damage_level,
    calculate_context_factor,
    calculate_risk_score,
    get_priority,
    MULTIPLIER_MIN,
    MULTIPLIER_MAX
)


class TestConditionScore:
    def test_clean_road_scores_100(self):
        """A road with zero detections must score exactly 100.0."""
        res = calculate_condition([])
        assert res["condition_score"] == 100.0
        assert res["damage_load"] == 0.0
        assert res["detections_used"] == 0

    def test_single_pothole_degrades_condition(self):
        """A detected pothole (D40) must reduce the condition score below 100."""
        dets = [
            {"class_code": "D40", "confidence": 0.85, "width": 0.25, "height": 0.20, "x_center": 0.5, "y_center": 0.5}
        ]
        res = calculate_condition(dets)
        assert res["condition_score"] < 100.0
        assert res["damage_load"] > 0.0
        assert res["detections_used"] == 1

    def test_noise_filtered_below_min_confidence(self):
        """Detections below MIN_CONFIDENCE (0.10) must be rejected."""
        dets = [
            {"class_code": "D40", "confidence": 0.05, "width": 0.2, "height": 0.2, "x_center": 0.5, "y_center": 0.5}
        ]
        res = calculate_condition(dets)
        assert res["condition_score"] == 100.0
        assert res["detections_used"] == 0

    def test_same_class_duplicate_discounting(self):
        """Overlapping detections of the same defect must be discounted."""
        box1 = {"class_code": "D00", "confidence": 0.8, "width": 0.1, "height": 0.4, "x_center": 0.5, "y_center": 0.5}
        # 100% identical duplicate box
        box2 = {"class_code": "D00", "confidence": 0.7, "width": 0.1, "height": 0.4, "x_center": 0.5, "y_center": 0.5}
        
        single_res = calculate_condition([box1])
        double_res = calculate_condition([box1, box2])
        
        # 100% enclosed identical box has covered=1.0 -> 0.0 marginal damage added
        assert double_res["damage_load"] == single_res["damage_load"]
        assert double_res["condition_score"] == single_res["condition_score"]

        # Partial overlap (shifted box)
        box3 = {"class_code": "D00", "confidence": 0.7, "width": 0.1, "height": 0.4, "x_center": 0.55, "y_center": 0.5}
        partial_res = calculate_condition([box1, box3])
        assert partial_res["damage_load"] > single_res["damage_load"]
        assert partial_res["damage_load"] < single_res["damage_load"] * 2.0


class TestRiskScore:
    def test_pristine_road_has_zero_risk_regardless_of_context(self):
        """
        V2 Multiplicative Model Test:
        A pristine road (health = 100) outside a school or hospital must have 0.0 risk (LOW priority).
        """
        res = analyze_risk(
            health_score=100.0,
            road_type="school_road",
            traffic="very_high",
            location_sensitivity="school"
        )
        assert res["damage_level"] == 0.0
        assert res["risk_score"] == 0.0
        assert res["maintenance_priority"] == "LOW"

    def test_context_amplifies_damage(self):
        """The same physical damage must yield higher risk in high-sensitivity locations."""
        damaged_health = 65.0
        
        low_context = analyze_risk(
            health_score=damaged_health,
            road_type="rural_road",
            traffic="low",
            location_sensitivity="none"
        )
        
        high_context = analyze_risk(
            health_score=damaged_health,
            road_type="national_highway",
            traffic="very_high",
            location_sensitivity="hospital"
        )
        
        assert high_context["risk_score"] > low_context["risk_score"]

    def test_priority_threshold_bands(self):
        """Verify priority classifications at boundary scores."""
        assert get_priority(80.0) == "CRITICAL"
        assert get_priority(75.0) == "CRITICAL"
        assert get_priority(74.9) == "HIGH"
        assert get_priority(50.0) == "HIGH"
        assert get_priority(49.9) == "MEDIUM"
        assert get_priority(25.0) == "MEDIUM"
        assert get_priority(24.9) == "LOW"
        assert get_priority(0.0) == "LOW"
