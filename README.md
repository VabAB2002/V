# Penn State Academic Programs Database

A comprehensive, structured database of Penn State World Campus academic programs, including courses, majors, minors, and General Education requirements.

## 📊 Database Stats

- **9,275+ courses** with full details and prerequisites
- **40 majors** with complete program requirements
- **20+ minors** with structured requirements
- **100% Gen Ed coverage** across all 8 categories

## 📁 Project Structure

```
majors_json/
├── data/                          # JSON data files
│   ├── penn_state_courses.json    # Complete course catalog
│   ├── penn_state_majors.json     # Major program requirements
│   ├── penn_state_minors.json     # Minor program requirements
│   └── gen_ed_requirements.json   # Gen Ed requirements (shared)
│
├── scripts/                       # Utility scripts
│   ├── data_management/           # Data modification scripts
│   └── validation/                # Validation scripts
│
├── tools/                         # Scrapers and advanced tools
│   ├── minors_scraper/            # Web scraper for minors
│   └── scripts/                   # Legacy/specialized scripts
│
├── docs/                          # Documentation
│   ├── SCHEMA.md                  # JSON schema documentation
│   ├── EXAMPLES.md                # Usage examples
│   └── reports/                   # Validation reports
│
├── src/                           # Source code
│   ├── schema/                    # JSON schemas
│   └── types/                     # TypeScript definitions
│
├── backups/                       # Timestamped backups
│
└── tests/                         # Test files
```

## 🚀 Quick Start

### View Data Files

```bash
# Course catalog (9,275+ courses)
cat data/penn_state_courses.json | jq '.'

# Major programs (40 majors)
cat data/penn_state_majors.json | jq '.'

# Gen Ed requirements
cat data/gen_ed_requirements.json | jq '.'
```

### Run Validation

```bash
# Verify Gen Ed coverage
python3 scripts/validation/verify_gen_ed_coverage.py
```

### Analyze Gen Ed Requirements

```bash
# Check if all majors have same Gen Ed rules
python3 scripts/data_management/analyze_gen_ed.py
```

## 📋 Data Format

### Courses

Each course includes:
- Course code and name
- Credits (fixed or variable)
- Description
- Prerequisites (structured with AND/OR logic)
- Gen Ed attributes (GWS, GQ, GHW, GN, GA, GH, GS, interdomain)
- Writing designation
- Cultural diversity flags

Example:
```json
{
  "CAS 100A": {
    "course_code": "CAS 100A",
    "course_name": "Effective Speech",
    "credits": 3.0,
    "credit_type": "fixed",
    "attributes": {
      "gen_ed": ["GWS"],
      "writing": false,
      "cultural_diversity": []
    },
    "prerequisites": {
      "type": "none"
    }
  }
}
```

### Majors

Each major includes:
- Basic info (ID, name, degree type, department)
- Credits required
- Entrance requirements
- Common requirements (prescribed, additional, supporting courses)
- Sub-plans/options (if applicable)

### Gen Ed Requirements

Structured requirements for:
- **Foundations** (15 credits): GWS + GQ
- **Knowledge Domains** (15 credits): GHW, GN, GA, GH, GS
- **Integrative Studies** (6 credits): interdomain courses
- **Exploration** (9 credits): Additional Gen Ed courses

## 🎯 Gen Ed Coverage

| Attribute | Description | Courses Available |
|-----------|-------------|-------------------|
| **GWS** | Writing/Speaking | 31 |
| **GQ** | Quantification | 10 |
| **GHW** | Health & Wellness | 7 |
| **GN** | Natural Sciences | 50 |
| **GA** | Arts | 111 |
| **GH** | Humanities | 55 |
| **GS** | Social & Behavioral Sciences | 55 |
| **interdomain** | Integrative Studies | 24 |

✅ **Status**: All Gen Ed requirements can be fulfilled

## 🛠️ Available Scripts

### Data Management
- `add_gws_attributes.py` - Add GWS attributes to writing/speaking courses
- `analyze_gen_ed.py` - Analyze Gen Ed rules across majors

### Validation
- `verify_gen_ed_coverage.py` - Verify Gen Ed attribute coverage

### Tools
- `minors_scraper/` - Web scraper for Penn State minors
- Various validation and data processing scripts in `tools/scripts/`

## 📖 Documentation

- **[SCHEMA.md](docs/SCHEMA.md)** - Complete JSON schema documentation
- **[EXAMPLES.md](docs/EXAMPLES.md)** - Usage examples and patterns
- **[Scripts README](scripts/README.md)** - Script usage guide
- **[Data README](data/README.md)** - Data files overview

## 🔄 Recent Updates

### 2025-11-30
- ✅ Added GWS attributes to 31 writing/speaking courses
- ✅ Verified 100% Gen Ed coverage across all categories
- ✅ Reorganized codebase into clean structure
- ✅ Created comprehensive documentation

### Previous
- Implemented Gen Ed requirements structure
- Scraped and structured 40 major programs
- Scraped 20+ minor programs
- Validated course references across all programs

## 📝 Notes

- All scripts should be run from the project root directory
- Scripts automatically reference data files in `data/` directory  
- Backups are created automatically for destructive operations
- JSON files are validated before and after modifications

## 🔗 Data Source

Data scraped from Penn State World Campus bulletin:
- https://bulletins.psu.edu/university-course-descriptions/undergraduate/

## 📄 License

Educational/Research use

---

**Last Updated**: 2025-11-30  
**Maintainer**: Academic Data Management Team
