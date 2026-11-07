# RoadWise — Code Documentation & Engineering Standards

> **Document Version:** 1.0.0  
> **Applicability:** All Future RoadWise Modules, Pipelines, APIs, and Frontend Components  
> **Enforcement:** Mandatory Pre-Commit Inspection  

---

## 1. Core Documentation Philosophy

Every line of code written in the RoadWise repository must be self-explanatory to an academic examiner, junior engineer, and production maintainer. We reject:
- "Self-documenting code" as an excuse for missing comments.
- Trivial restatements of code syntax (e.g. `# increment i by 1`).
- Undocumented mathematical constants or magic numbers.

All documentation must answer four questions:
1. **WHAT** does this code block accomplish?
2. **WHY** was this specific implementation approach chosen over alternatives?
3. **HOW** does data transform between input and output?
4. **WHERE** does this component fit within the dual-mode RoadWise architecture?

---

## 2. Python Module Header Standard

Every Python file (`.py`) must begin with a structured top-level docstring matching this schema:

```python
"""
RoadWise - [Module Name / Capability]
====================================

ROLE IN ROADWISE ARCHITECTURE:
    Explain whether this file belongs to Mode 1 (Inspection), Mode 2 (Dashboard),
    the ML training pipeline, or shared persistence. Detail its position in the pipeline.

KEY RESPONSIBILITIES:
    - Bullet point 1
    - Bullet point 2

MATHEMATICAL / ALGORITHMIC PRINCIPLES (If applicable):
    Detail any mathematical formulas, normalization ranges, or computer vision concepts.

INPUTS:
    Describe incoming data types, files, or network streams.

OUTPUTS:
    Describe return structures, database side-effects, or persisted files.
"""
```

---

## 3. Function & Method Docstring Standard

All public and internal functions must include Google-style docstrings with explicit type hints and design rationale:

```python
def calculate_risk_score(
    health_score: float,
    road_type: str,
    traffic: str,
    location_sensitivity: str
) -> float:
    """
    Calculate the overall RoadWise risk score using multiplicative amplification.

    DESIGN RATIONALE (Viva Note):
        Explain why this method was chosen. (e.g., Multiplicative scaling prevents
        undamaged roads from generating high-priority false alarms).

    FORMULA:
        Risk = min(100.0, DamageLevel * ContextMultiplier)

    Args:
        health_score (float): Condition score from health_score.py [0.0 to 100.0].
        road_type (str): Key matching ROAD_TYPE_SCORE dictionary.
        traffic (str): Key matching TRAFFIC_SCORE dictionary.
        location_sensitivity (str): Key matching LOCATION_SENSITIVITY_SCORE.

    Returns:
        float: Computed risk score rounded to 2 decimal places [0.0 to 100.0].

    Raises:
        ValueError: If input scores exceed valid boundaries.
    """
```

---

## 4. Inline Commenting Rules

### Rule 4.1: Explain Non-Obvious Engineering Decisions
Always document *why* a workaround or specific construct exists:
```python
# Re-open after verify because PIL verify() invalidates the image object
with Image.open(io.BytesIO(image_bytes)) as image:
    width, height = image.size
```

### Rule 4.2: Document Mathematical Formulas & Units
State the mathematical equation and unit space (e.g., pixels vs normalized $[0, 1]$):
```python
# Convert DMS rational tuples to decimal degrees: Degrees + (Minutes / 60) + (Seconds / 3600)
latitude = degrees + (minutes / 60.0) + (seconds / 3600.0)
```

### Rule 4.3: Clarify Data Format Transitions
When converting data structures across libraries (e.g., OpenCV to Pillow):
```python
# OpenCV returns BGR channel ordering; reverse third axis to RGB for Pillow
rgb_image = annotated[:, :, ::-1]
```

---

## 5. React & Frontend Documentation Standard

All React components (`.jsx`) and API client modules (`.js`) must use JSDoc annotations:

```javascript
/**
 * ComponentName
 * =============
 * 
 * ROLE IN ARCHITECTURE:
 *   Describe component role (e.g., Mode 2 GIS Map).
 * 
 * PROPS:
 *   @param {Array<Object>} props.inspections - List of inspection records from SQLite.
 *   @param {Function} props.onSelectInspection - Callback when a marker is clicked.
 * 
 * STATE:
 *   Describe any internal state hooks (useState, useRef).
 * 
 * LIFECYCLE & MEMORY:
 *   Detail unmount cleanup (e.g. map.remove(), URL.revokeObjectURL).
 */
```

---

## 6. SQL & Database Documentation Standard

1. **Schema Modifications:** Any table or column addition must document nullability, default values, and foreign key cascading behavior.
2. **Index Rationale:** Every `CREATE INDEX` statement must include a comment stating which query or JOIN operation it optimizes.
3. **Transactions:** Explicitly comment where transactions begin, commit, or roll back:
   ```python
   # Atomic transaction: If detection insert fails, rollback parent inspection
   try:
       cursor.execute(...)
       connection.commit()
   except Exception:
       connection.rollback()
       raise
   ```

---

## 7. Quality Gates & Enforcement Checklist

Before staging or committing any code in RoadWise, developers must verify:
- [ ] Every new or modified Python file has a comprehensive module docstring.
- [ ] Every function has type hints and an explanatory docstring.
- [ ] No magic numbers exist without named constants and mathematical explanations.
- [ ] `npm run build` succeeds with zero errors.
- [ ] Backend syntax check passes (`python -c "import <module>"`).
- [ ] Database invariants are preserved (active records and tables intact).
- [ ] Model weights are untouched (`models/best.pt`).

