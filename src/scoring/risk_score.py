"""
RoadWise - Risk and Maintenance Priority Scoring (version 2)

This module converts:

    road CONDITION SCORE (from health_score.py)
  + road CONTEXT (road type, traffic, location sensitivity)

into:

1. Risk Score (0-100)
2. Maintenance Priority (LOW / MEDIUM / HIGH / CRITICAL)

IMPORTANT:
These scoring rules are defined for the RoadWise prototype.
They are project-defined choices. They are NOT official government
standards and are NOT taken from any research paper.

DESIGN RULE (what changed from version 1):
Context AMPLIFIES detected damage. It no longer gets added on top of it.
In version 1 a perfect road near a school could receive the same priority as
a badly damaged residential road. In version 2 a road with no detected damage
always gets a risk of 0 (LOW), whatever its location.
"""


# ============================================================
# 1. ROAD TYPE
# ============================================================

ROAD_TYPE_SCORE = {

    # Major roads
    "national_highway": 100,
    "state_highway": 90,
    "expressway": 100,
    "major_arterial": 90,
    "main_road": 80,

    # Important urban roads
    "ring_road": 80,
    "bypass_road": 75,
    "collector_road": 65,
    "service_road": 50,

    # Commercial roads
    "commercial_road": 70,
    "market_road": 75,
    "industrial_road": 65,

    # Sensitive / important routes
    "school_road": 80,
    "hospital_road": 85,
    "emergency_route": 100,
    "public_facility_road": 70,

    # Public transport
    "bus_route": 75,
    "bus_terminal_road": 80,
    "railway_station_road": 80,
    "airport_road": 90,

    # Residential / local
    "residential": 40,
    "local_road": 35,
    "colony_road": 35,
    "apartment_road": 35,

    # Rural
    "rural_road": 30,
    "village_road": 25,
    "farm_road": 15,

    # Low usage
    "low_use": 10,

    # Unknown / other
    "other": 25
}


# ============================================================
# 2. TRAFFIC / USAGE
# ============================================================

TRAFFIC_SCORE = {

    "very_high": 100,
    "high": 80,
    "medium": 55,
    "low": 30,
    "very_low": 10
}


# ============================================================
# 3. LOCATION SENSITIVITY
# ============================================================

LOCATION_SENSITIVITY_SCORE = {

    # Very sensitive locations
    "school": 100,
    "hospital": 100,
    "emergency_service": 100,

    # Highly important public locations
    "railway_station": 85,
    "airport": 85,
    "bus_terminal": 80,

    # Public/community locations
    "college_university": 80,
    "government_office": 70,
    "public_facility": 70,

    # Commercial / crowded locations
    "market": 65,
    "shopping_area": 65,

    # Residential
    "residential_area": 40,

    # No special sensitivity
    "none": 0,

    # Unknown / other
    "other": 20
}


# ============================================================
# 4. PROJECT-DEFINED CONSTANTS
# ============================================================

# Damage scale
# ------------
# Damage = 100 - condition score. Real detections rarely give very low condition
# scores (on the validation set the lowest flagged score was 34.7 and the 10th
# percentile was 70.5), so damage is stretched: a damage of DAMAGE_REF or more
# counts as the maximum level (100).
# DAMAGE_REF = 40 means a condition score of 60 or below is the most severe level.
DAMAGE_REF = 40.0

# Context weights
# ---------------
# Same relative importance as version 1 (road 0.15 : traffic 0.15 : location
# sensitivity 0.20), rescaled so they add up to 1.
WEIGHT_ROAD = 0.30
WEIGHT_TRAFFIC = 0.30
WEIGHT_SENSITIVITY = 0.40

# Context multiplier range
# ------------------------
# The context factor (0 to 1) scales damage between these two values:
#   lowest-stakes location  -> damage x 0.6
#   highest-stakes location -> damage x 1.4
MULTIPLIER_MIN = 0.6
MULTIPLIER_MAX = 1.6

# Priority bands on the Risk Score
BAND_MEDIUM = 25
BAND_HIGH = 50
BAND_CRITICAL = 75


# ============================================================
# 5. DAMAGE LEVEL
# ============================================================

def calculate_damage_level(condition_score):
    """
    Convert the condition score into a stretched 0-100 damage level.

    Condition score:
        100 = no detected damage
          0 = very heavy detected damage

    Damage level:
          0 = no detected damage
        100 = most severe level (condition score of 60 or below)
    """

    condition_score = max(0.0, min(100.0, condition_score))

    damage = 100.0 - condition_score

    damage_level = min(100.0, damage / DAMAGE_REF * 100.0)

    return round(damage_level, 2)


# ============================================================
# 6. CONTEXT FACTOR
# ============================================================

def calculate_context_factor(
    road_type,
    traffic,
    location_sensitivity
):
    """
    Combine road type, traffic and location sensitivity into one
    context factor from 0 (low-stakes location) to 1 (high-stakes location).
    """

    road_score = ROAD_TYPE_SCORE.get(
        road_type,
        ROAD_TYPE_SCORE["other"]
    )

    traffic_score = TRAFFIC_SCORE.get(
        traffic,
        TRAFFIC_SCORE["medium"]
    )

    sensitivity_score = LOCATION_SENSITIVITY_SCORE.get(
        location_sensitivity,
        LOCATION_SENSITIVITY_SCORE["other"]
    )

    context_factor = (
        WEIGHT_ROAD * road_score
        + WEIGHT_TRAFFIC * traffic_score
        + WEIGHT_SENSITIVITY * sensitivity_score
    ) / 100.0

    return round(context_factor, 3)


# ============================================================
# 7. RISK SCORE
# ============================================================

def calculate_risk_score(
    health_score,
    road_type,
    traffic,
    location_sensitivity
):
    """
    Calculate the overall RoadWise risk score.

        Risk Score = Damage Level x Context Multiplier   (capped at 100)

    where

        Context Multiplier = MULTIPLIER_MIN
                           + (MULTIPLIER_MAX - MULTIPLIER_MIN) x Context Factor

    Final score:
        0   = very low risk (no detected damage)
        100 = very high risk
    """

    damage_level = calculate_damage_level(health_score)

    context_factor = calculate_context_factor(
        road_type,
        traffic,
        location_sensitivity
    )

    multiplier = (
        MULTIPLIER_MIN
        + (MULTIPLIER_MAX - MULTIPLIER_MIN) * context_factor
    )

    risk_score = damage_level * multiplier

    # Keep score between 0 and 100
    risk_score = max(0.0, min(100.0, risk_score))

    return round(risk_score, 2)


# ============================================================
# 8. MAINTENANCE PRIORITY
# ============================================================

def get_priority(risk_score):
    """
    Convert risk score into a maintenance priority.
    """

    if risk_score >= BAND_CRITICAL:
        return "CRITICAL"

    elif risk_score >= BAND_HIGH:
        return "HIGH"

    elif risk_score >= BAND_MEDIUM:
        return "MEDIUM"

    else:
        return "LOW"


# ============================================================
# 9. PRIORITY DESCRIPTION
# ============================================================

def get_priority_description(priority):
    """
    Human-readable explanation for the dashboard.
    """

    descriptions = {

        "CRITICAL":
            "Immediate inspection and maintenance recommended.",

        "HIGH":
            "High priority. Maintenance should be scheduled soon.",

        "MEDIUM":
            "Moderate priority. Monitor and schedule maintenance.",

        "LOW":
            "Low priority. Continue monitoring road condition."
    }

    return descriptions.get(
        priority,
        "Priority could not be determined."
    )


# ============================================================
# 10. COMPLETE RISK ANALYSIS
# ============================================================

def analyze_risk(
    health_score,
    road_type,
    traffic,
    location_sensitivity
):
    """
    Run the complete RoadWise risk analysis.

    'health_score' is the condition score from health_score.py.

    Returns a dictionary that can be sent directly
    to the database and dashboard.
    """

    damage_level = calculate_damage_level(health_score)

    context_factor = calculate_context_factor(
        road_type,
        traffic,
        location_sensitivity
    )

    risk_score = calculate_risk_score(
        health_score,
        road_type,
        traffic,
        location_sensitivity
    )

    priority = get_priority(risk_score)

    description = get_priority_description(priority)

    explanation = (
        f"Condition score {health_score:.1f} gives damage level "
        f"{damage_level:.0f}/100; context factor {context_factor:.2f} "
        f"({road_type}, {traffic} traffic, {location_sensitivity})."
    )

    return {
        "health_score": health_score,
        "damage_level": damage_level,
        "context_factor": context_factor,
        "road_type": road_type,
        "traffic": traffic,
        "location_sensitivity": location_sensitivity,
        "risk_score": risk_score,
        "maintenance_priority": priority,
        "priority_description": description,
        "explanation": explanation
    }


# ============================================================
# 11. TEST
# ============================================================

if __name__ == "__main__":

    # Example cases for checking the logic ONLY.
    # These are NOT real YOLO/model results.

    cases = [
        ("Perfect road, school area", 100.0, "school_road", "high", "school"),
        ("Badly damaged, residential, low traffic", 35.0, "residential", "low", "none"),
        ("Typical flagged road, busy main road", 85.4, "main_road", "high", "none"),
        ("Same damage, school area", 85.4, "school_road", "high", "school"),
        ("Moderately heavy damage, school area", 70.0, "school_road", "high", "school"),
        ("Moderately heavy damage, residential", 70.0, "residential", "low", "none"),
    ]

    print("RoadWise Risk & Priority Test (example cases, not real results)")
    print("-" * 78)

    for name, health, road, traffic, location in cases:

        result = analyze_risk(health, road, traffic, location)

        print(
            f"{name:<42} "
            f"risk {result['risk_score']:>6}  "
            f"{result['maintenance_priority']}"
        )

    print()
    print("Detail for the last case:")
    print(result["explanation"])
    print(result["priority_description"])