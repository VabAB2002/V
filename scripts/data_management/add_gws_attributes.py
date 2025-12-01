#!/usr/bin/env python3
"""
Safely add GWS attribute to Gen Ed Writing/Speaking courses.
Only modifies the specific courses listed, preserves all other data.
"""

import json
import shutil
from datetime import datetime
from pathlib import Path

# Get project root directory (2 levels up from this script)
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
DATA_DIR = PROJECT_ROOT / 'data'

# Exact list of GWS courses from Penn State bulletin
GWS_COURSES = [
    "ABSM 391",
    "ABSM 392",
    "ADTED 100",
    "AIR 352",
    "BE 391",
    "BE 392",
    "BIOL 403",
    "CAS 100A",
    "CAS 100B",
    "CAS 100C",
    "CAS 100S",
    "CAS 137H",
    "CAS 138T",
    "EMSC 100S",
    "ENGL 15",
    "ENGL 15A",
    "ENGL 15E",
    "ENGL 15S",
    "ENGL 30H",
    "ENGL 30T",
    "ENGL 137H",
    "ENGL 138T",
    "ENGL 202A",
    "ENGL 202B",
    "ENGL 202C",
    "ENGL 202D",
    "ENGL 202H",
    "ESL 15",
    "GEOSC 435",
    "KINES 197N",
    "MATSE 203"
]

def validate_json_file(filepath):
    """Validate JSON file can be loaded"""
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
        print(f"✓ JSON validation passed: {filepath}")
        return True
    except json.JSONDecodeError as e:
        print(f"✗ JSON validation FAILED: {filepath}")
        print(f"  Error: {e}")
        return False

def create_backup(filepath):
    """Create timestamped backup"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = f"{filepath}.backup_{timestamp}"
    shutil.copy2(filepath, backup_path)
    print(f"✓ Backup created: {backup_path}")
    return backup_path

def add_gws_attributes():
    """Add GWS to gen_ed array for specific courses only"""
    
    filepath = DATA_DIR / 'penn_state_courses.json'
    
    print("=" * 80)
    print("ADDING GWS ATTRIBUTES TO COURSES")
    print("=" * 80)
    
    # Step 1: Validate original file
    print("\n[1/5] Validating original JSON...")
    if not validate_json_file(filepath):
        print("❌ ABORTED: Original JSON is invalid")
        return False
    
    # Step 2: Create backup
    print("\n[2/5] Creating backup...")
    backup_path = create_backup(filepath)
    
    # Step 3: Load data
    print("\n[3/5] Loading course data...")
    with open(filepath, 'r') as f:
        data = json.load(f)
    
    courses = data.get('courses', data)
    print(f"✓ Loaded {len(courses)} courses")
    
    # Step 4: Add GWS attribute (ONLY to specific courses)
    print("\n[4/5] Adding GWS attribute...")
    print(f"Target courses: {len(GWS_COURSES)}")
    
    found_courses = []
    not_found_courses = []
    already_has_gws = []
    modified_courses = []
    
    for course_code in GWS_COURSES:
        if course_code in courses:
            course = courses[course_code]
            
            # Ensure attributes structure exists
            if 'attributes' not in course:
                print(f"  ⚠️  {course_code}: No attributes field, skipping")
                not_found_courses.append(course_code)
                continue
            
            if 'gen_ed' not in course['attributes']:
                print(f"  ⚠️  {course_code}: No gen_ed field, skipping")
                not_found_courses.append(course_code)
                continue
            
            # Check if GWS already exists
            if 'GWS' in course['attributes']['gen_ed']:
                already_has_gws.append(course_code)
                found_courses.append(course_code)
            else:
                # Add GWS to gen_ed array
                course['attributes']['gen_ed'].append('GWS')
                modified_courses.append(course_code)
                found_courses.append(course_code)
                print(f"  ✓ {course_code}: Added GWS")
        else:
            not_found_courses.append(course_code)
            print(f"  ✗ {course_code}: Not found in database")
    
    # Step 5: Save modified data
    print("\n[5/5] Saving changes...")
    
    # Write with same structure as original
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Saved to {filepath}")
    
    # Validate saved file
    print("\nValidating saved JSON...")
    if not validate_json_file(filepath):
        print("❌ ERROR: Saved JSON is invalid!")
        print(f"Restoring from backup: {backup_path}")
        shutil.copy2(backup_path, filepath)
        return False
    
    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"✓ Courses found and modified: {len(modified_courses)}")
    print(f"  Courses already had GWS: {len(already_has_gws)}")
    print(f"✗ Courses not found: {len(not_found_courses)}")
    
    if modified_courses:
        print(f"\nModified courses ({len(modified_courses)}):")
        for course in modified_courses:
            print(f"  • {course}")
    
    if already_has_gws:
        print(f"\nAlready had GWS ({len(already_has_gws)}):")
        for course in already_has_gws:
            print(f"  • {course}")
    
    if not_found_courses:
        print(f"\nNot found in database ({len(not_found_courses)}):")
        for course in not_found_courses:
            print(f"  • {course}")
    
    print(f"\n✓ Backup saved at: {backup_path}")
    print("✓ JSON structure validated and preserved")
    print("\n" + "=" * 80)
    
    return True

if __name__ == "__main__":
    success = add_gws_attributes()
    exit(0 if success else 1)
