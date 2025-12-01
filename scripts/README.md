# Scripts

Utility scripts for data management and validation.

## Data Management (`data_management/`)

- `add_gws_attributes.py` - Add GWS (Writing/Speaking) attributes to courses
- `analyze_gen_ed.py` - Analyze Gen Ed coverage across majors

## Validation (`validation/`)

- `verify_gen_ed_coverage.py` - Verify Gen Ed attribute coverage in course database

## Usage

All scripts should be run from the project root directory:

```bash
# Run from: /Users/V-Personal/Desktop/SWENG PROJECTS/majors_json/
python3 scripts/validation/verify_gen_ed_coverage.py
```

**Note**: Scripts expect data files to be in the `data/` directory.
