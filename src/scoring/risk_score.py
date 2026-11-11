"""
RoadWise - Risk and Maintenance Priority Scoring (Version 2)
=============================================================

ROLE IN ROADWISE ARCHITECTURE:
    This module bridges raw structural road health with actionable civil infrastructure
    decision making. While `health_score.py` evaluates physical surface defects (cracks,
    potholes), this module evaluates practical danger to road users by combining:
        1. Road Condition Score (from health_score.py, range 0 to 100)
        2. Road Context (road classification, traffic volume, location sensitivity)

OUTPUTS:
    - Damage Level (0.0 to 100.0, stretched non-linear physical damage)
    - Context Factor (0.0 to 1.0, weighted socio-traffic criticality)
    - Risk Score (0.0 to 100.0, final maintenance urgency metric)
    - Maintenance Priority (CRITICAL, HIGH, MEDIUM, LOW)
    - Priority Description & Human-Readable Explanation

DESIGN RATIONALE (V1 vs V2 - VIVA KEY POINT):
    - In Version 1 (additive model):
          Risk = (100 - Condition) * 0.5 + ContextScore * 0.5
      Flaw: A brand-new, perfectly paved road in front of a school or hospital (Condition=100,
      Context=100) received a Risk Score of 50.0 (HIGH priority), triggering false alarms.
    - In Version 2 (multiplicative model):
          Risk = DamageLevel * ContextMultiplier
      Benefit: Context acts as an amplifier of detected damage. If Condition=100 (Damage=0),
      the Risk Score is mathematically guaranteed to be 0.0 (LOW priority) regardless of location.

MATHEMATICAL FORMULATIONS:
    1. Damage Level:
       Damage = 100.0 - ConditionScore
       DamageLevel = min(100.0, (Damage / DAMAGE_REF) * 100.0)
       Where DAMAGE_REF = 40.0 (Condition <= 60 represents severe structural distress).

    2. Context Factor:
       ContextFactor = (0.30 * RoadTypeScore + 0.30 * TrafficScore + 0.40 * LocationSensitivityScore) / 100.0
       Normalized to range [0.0, 1.0].

    3. Context Multiplier:
       Multiplier = MULTIPLIER_MIN + (MULTIPLIER_MAX - MULTIPLIER_MIN) * ContextFactor
       Where MULTIPLIER_MIN = 0.6 (calm rural/local roads discount damage urgency by 40%)
       and MULTIPLIER_MAX = 1.6 (highways/school zones amplify damage urgency by 60%).

    4. Risk Score:
       RiskScore = clamp(DamageLevel * Multiplier, 0.0, 100.0)

    5. Priority Thresholds:
       Risk >= 75.0 -> CRITICAL
       Risk >= 50.0 -> HIGH
       Risk >= 25.0 -> MEDIUM
       Risk <  25.0 -> LOW
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
#   highest-stakes location -> damage x 1.6
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
    Convert the road condition score into a stretched 0-100 physical damage index.

    WHY STRETCH DAMAGE? (Viva Note):
        In real-world computer vision inference on road datasets (such as RDD2022 India),
        an image capturing road distress rarely gives a condition score below 35.0 (the 10th
        percentile is ~70.5). If raw damage (100 - condition) were used directly without stretching,
        even heavily deteriorated roads would only score 30-40 damage points, rarely ever
        triggering CRITICAL priority alarms.
        By defining DAMAGE_REF = 40.0, any condition drop of 40 points (Condition <= 60)
        reaches full 100% damage level.

    Args:
        condition_score (float): Road surface health score [0.0 to 100.0],
                                 where 100 = flawless road, 0 = severe distress.

    Returns:
        float: Stretched damage level rounded to 2 decimal places [0.0 to 100.0].
               0.0 = no detected defects.
               100.0 = maximal actionable damage (condition <= 60.0).
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
    Synthesize operational environment parameters into a single normalized context factor.

    Combines road classification, vehicular traffic volume, and location sensitivity
    using calibrated weights:
        - WEIGHT_ROAD        = 0.30 (Hierarchy of road: Expressway=100 vs Farm Road=15)
        - WEIGHT_TRAFFIC     = 0.30 (Vehicle exposure: Very High=100 vs Very Low=10)
        - WEIGHT_SENSITIVITY = 0.40 (Vulnerability of users: School/Hospital=100 vs None=0)

    Args:
        road_type (str): Key matching ROAD_TYPE_SCORE dictionary (e.g. 'national_highway', 'residential').
        traffic (str): Key matching TRAFFIC_SCORE dictionary ('very_high', 'high', 'medium', 'low', 'very_low').
        location_sensitivity (str): Key matching LOCATION_SENSITIVITY_SCORE ('school', 'hospital', 'none', etc.).

    Returns:
        float: Context factor scalar between 0.000 (least sensitive) and 1.000 (most sensitive).
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
    Calculate the overall RoadWise risk score using multiplicative amplification.

    Formula:
        Risk Score = Damage Level * Context Multiplier   (bounded in [0.0, 100.0])
        where:
        Context Multiplier = MULTIPLIER_MIN + (MULTIPLIER_MAX - MULTIPLIER_MIN) * ContextFactor
                           = 0.6 + (1.6 - 0.6) * ContextFactor

    Behavioral Guarantees:
        - If health_score == 100.0 -> Damage Level = 0.0 -> Risk Score = 0.0 (no false alarms).
        - If damage is high on a rural farm road -> Damage Level * 0.6 (de-prioritized for heavy traffic).
        - If damage is high in a hospital/school zone -> Damage Level * 1.6 (urgently escalated).

    Args:
        health_score (float): Condition score from health_score.py [0.0, 100.0].
        road_type (str): Road category string.
        traffic (str): Traffic volume level string.
        location_sensitivity (str): Sensitive zone identifier.

    Returns:
        float: Final risk score rounded to 2 decimal places [0.0, 100.0].
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

    context_multiplier = round(
        MULTIPLIER_MIN + (MULTIPLIER_MAX - MULTIPLIER_MIN) * context_factor, 3
    )

    return {
        "health_score": health_score,
        "damage_level": damage_level,
        "context_factor": context_factor,
        "context_multiplier": context_multiplier,
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