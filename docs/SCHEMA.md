# Schema Reference

Complete documentation of all fields in the majors.json data structure.

---

## Table of Contents

- [Top-Level Structure](#top-level-structure)
- [Major Object](#major-object)
- [Entrance Requirements](#entrance-requirements)
- [Common Requirements](#common-requirements)
- [Requirement Node Types](#requirement-node-types)
- [Sub-Plans](#sub-plans)
- [Special Requirements](#special-requirements)

---

## Top-Level Structure

The root object is a dictionary/map where:
- **Key**: `major_id` (string, snake_case identifier)
- **Value**: `Major` object

```json
{
  "accounting_bs": { ... },
  "information_sciences_technology_bs": { ... }
}
```

---

## Major Object

Complete definition of an academic major.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `major_id` | string | ✅ | Unique identifier matching the key |
| `name` | string | ✅ | Full display name (e.g., "Accounting, B.S.") |
| `degree_type` | enum | ✅ | Degree type: `"BS"`, `"BA"`, or `"BDes"` |
| `department` | string | | Department code (e.g., `"ACCTG"`, `"IST"`) |
| `credits_required` | number | ✅ | Total credits for degree completion |
| `entrance_requirements` | object | ✅ | Requirements to enter the major |
| `common_requirements` | object | ✅ | Core major requirements |
| `sub_plans` | object\|null | | Optional concentrations/options |
| `special_requirements` | array | | Special credit transfer rules |

### Example

```json
{
  "major_id": "accounting_bs",
  "name": "Accounting, B.S.",
  "degree_type": "BS",
  "department": "ACCTG",
  "credits_required": 120,
  "entrance_requirements": { ... },
  "common_requirements": { ... },
  "sub_plans": null
}
```

---

## Entrance Requirements

Requirements to be admitted to the major.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `min_gpa` | number | Minimum cumulative GPA (0.0-4.0) |
| `min_gpa_transfer` | number | Minimum GPA for transfer students |
| `min_credits_transfer` | number | Minimum credits for transfer admission |
| `min_semester_standing` | number | Minimum semester (e.g., 3 = junior) |
| `courses` | array | List of required courses (see below) |

### Course Requirement Object

| Field | Type | Description |
|-------|------|-------------|
| `type` | enum | `"FIXED"` or `"OR"` |
| `course` | string | Course code (for FIXED type) |
| `options` | array[string] | Course options (for OR type) |
| `min_grade` | string | Minimum grade (`"A"`, `"B"`, `"C"`, `"D"`) |
| `min_grade_overrides` | object | Per-course grade overrides |

### Example

```json
{
  "entrance_requirements": {
    "min_gpa": 2.0,
    "min_semester_standing": 3,
    "courses": [
      { "type": "FIXED", "course": "ACCTG 211", "min_grade": "C" },
      { "type": "OR", "options": ["MATH 110", "MATH 140"], "min_grade": "C" }
    ]
  }
}
```

---

## Common Requirements

Core requirements for all students in the major.

### Structure

```json
{
  "common_requirements": {
    "prescribed_courses": { RequirementNode },
    "additional_courses": { RequirementNode },
    "supporting_courses": { RequirementNode },
    "specialization_courses": { RequirementNode }
  }
}
```

Each field is a **Requirement Node** (see below).

---

## Requirement Node Types

Recursive structure representing course requirements with AND/OR logic.

### Common Fields

All requirement nodes have:

| Field | Type | Description |
|-------|------|-------------|
| `type` | enum | Requirement type (see below) |
| `label` | string | Human-readable label |
| `description` | string | Detailed description |
| `note` | string | Additional notes/caveats |
| `min_grade` | string | Minimum grade for all courses |
| `credits_needed` | number | Credits required |

### Type: `FIXED`

Single required course.

```json
{
  "type": "FIXED",
  "course": "ACCTG 211",
  "min_grade": "C"
}
```

### Type: `FIXED_LIST`

All courses in list are required.

```json
{
  "type": "FIXED_LIST",
  "label": "Accounting Core",
  "min_grade": "C",
  "courses": ["ACCTG 310", "ACCTG 340", "ACCTG 403"]
}
```

### Type: `OR`

Choose one from options or children.

**Simple (course list)**:
```json
{
  "type": "OR",
  "options": ["MATH 110", "MATH 140"],
  "min_grade": "C"
}
```

**Complex (nested)**:
```json
{
  "type": "OR",
  "children": [
    { "type": "FIXED", "course": "ACCTG 211" },
    { "type": "AND", "courses": ["ACCTG 201", "ACCTG 202"] }
  ]
}
```

### Type: `AND`

All children or courses required.

**With children**:
```json
{
  "type": "AND",
  "children": [
    { "type": "FIXED", "course": "BA 243" },
    { "type": "FIXED", "course": "STAT 200", "min_grade": "C" }
  ]
}
```

**With course list**:
```json
{
  "type": "AND",
  "courses": ["ACCTG 201", "ACCTG 202"]
}
```

### Type: `PICK_FROM_LIST`

Choose N credits from a list of valid courses.

```json
{
  "type": "PICK_FROM_LIST",
  "label": "Accounting Electives",
  "credits_needed": 6,
  "valid_courses": ["ACCTG 410", "ACCTG 423", "ACCTG 462"],
  "min_grade_overrides": {
    "ACCTG 410": "C"
  },
  "level_rules": [
    { "min_level": 400, "credits_needed": 3 }
  ]
}
```

**Level Rules**: Specify that X credits must be at level Y or above.

### Type: `PICK_FROM_DEPT`

Choose N credits from specific department(s).

```json
{
  "type": "PICK_FROM_DEPT",
  "label": "Business Supporting Courses",
  "credits_needed": 6,
  "level_min": 200,
  "level_max": 499,
  "valid_departments": ["ACCTG", "BA", "ECON", "FIN"],
  "department_rules": {
    "ACCTG": { "min_grade": "C" }
  }
}
```

### Type: `ANY_COURSE`

Choose N credits from any course, optionally with level constraints.

```json
{
  "type": "ANY_COURSE",
  "label": "General Electives",
  "credits_needed": 12,
  "level_min": 300,
  "level_rules": [
    { "min_level": 400, "credits_needed": 6 }
  ]
}
```

### Type: `CUSTOM_PLAN`

Individualized plan with custom constraints.

```json
{
  "type": "CUSTOM_PLAN",
  "description": "18 credits developed with adviser",
  "constraints": {
    "max_100_level": 0,
    "max_200_level": 6,
    "min_400_level_business": 3
  }
}
```

---

## Sub-Plans

Optional concentrations, options, or tracks within a major.

### Structure

```json
{
  "sub_plans": {
    "type": "SELECT_ONE",  // or "SELECT_MULTIPLE"
    "options": {
      "accounting_option": {
        "name": "Accounting Option",
        "credits_added": 18,
        "note": "Optional notes",
        "requirements": {
          "prescribed_courses": { RequirementNode },
          "additional_courses": { RequirementNode },
          "supporting_courses": { RequirementNode }
        }
      }
    }
  }
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `type` | enum | `"SELECT_ONE"` or `"SELECT_MULTIPLE"` |
| `options` | object | Map of option_id to SubPlan |

### SubPlan Object

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Display name |
| `credits_added` | number | Additional credits for this option |
| `note` | string | Special notes |
| `requirements` | object | Same structure as common_requirements |

---

## Special Requirements

Unique rules (e.g., credit transfers for police training).

```json
{
  "special_requirements": [
    {
      "type": "CREDIT_TRANSFER",
      "label": "ACT 120 Training",
      "description": "Students with ACT 120 may receive up to 16.5 credits",
      "conditions": {
        "training_type": ["ACT 120"],
        "max_age_years": 10
      },
      "awards": {
        "standard": [
          { "course": "CRIMJ 100", "credits": 3 }
        ]
      }
    }
  ]
}
```

---

## Course Code Pattern

All course codes must match: `[A-Z]+ [0-9]+[A-Z]*`

**Examples**:
- ✅ `ACCTG 211`
- ✅ `ENGL 15`
- ✅ `BA 364Y`
- ❌ `acctg 211` (lowercase)
- ❌ `ACCTG211` (no space)

---

## Grade Values

Valid grades: `A`, `B`, `C`, `D`, `F`

---

## Null vs Omission

- `"sub_plans": null` - Field exists but has no value
- Omitting the field entirely is preferred for optional fields

---

## Validation

All data should validate against [majors.schema.json](../schema/majors.schema.json).

Run validation:
```bash
python scripts/validate.py majors.json
```
