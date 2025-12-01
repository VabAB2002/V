#!/usr/bin/env python3
"""Analyze gen_ed_rules across all majors in penn_state_majors.json"""

import json
from collections import defaultdict
from pathlib import Path

# Get project root directory (2 levels up from this script)
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
DATA_DIR = PROJECT_ROOT / 'data'

def analyze_majors():
    # Load the majors file
    with open(DATA_DIR / 'penn_state_majors.json', 'r') as f:
        majors_data = json.load(f)
    
    print(f"Total number of majors: {len(majors_data)}\n")
    
    # Check for gen_ed_rules field
    majors_with_gen_ed = []
    majors_without_gen_ed = []
    
    # Collect all unique gen_ed_rules
    gen_ed_rules_variants = defaultdict(list)
    
    for major_id, major_data in majors_data.items():
        if 'gen_ed_rules' in major_data:
            majors_with_gen_ed.append(major_id)
            # Convert to JSON string for comparison
            gen_ed_json = json.dumps(major_data['gen_ed_rules'], sort_keys=True)
            gen_ed_rules_variants[gen_ed_json].append(major_id)
        else:
            majors_without_gen_ed.append(major_id)
    
    # Report findings
    print("=" * 80)
    print("ANALYSIS RESULTS")
    print("=" * 80)
    
    print(f"\nMajors WITH gen_ed_rules: {len(majors_with_gen_ed)}")
    print(f"Majors WITHOUT gen_ed_rules: {len(majors_without_gen_ed)}")
    
    if majors_with_gen_ed:
        print(f"\n{'=' * 80}")
        print(f"Number of unique gen_ed_rules variants: {len(gen_ed_rules_variants)}")
        print(f"{'=' * 80}")
        
        if len(gen_ed_rules_variants) == 1:
            print("\n✓ ALL majors have the SAME gen_ed_rules!")
            print("\nThe gen_ed_rules structure is:")
            print(json.dumps(list(gen_ed_rules_variants.keys())[0], indent=2))
        else:
            print("\n✗ Majors have DIFFERENT gen_ed_rules!")
            print(f"\nFound {len(gen_ed_rules_variants)} different variants:\n")
            
            for idx, (gen_ed_json, major_list) in enumerate(gen_ed_rules_variants.items(), 1):
                print(f"Variant {idx}: Used by {len(major_list)} major(s)")
                print(f"Majors: {', '.join(major_list[:5])}" + 
                      (f" ... and {len(major_list) - 5} more" if len(major_list) > 5 else ""))
                print(f"gen_ed_rules structure:")
                print(json.dumps(json.loads(gen_ed_json), indent=2))
                print("-" * 80)
    else:
        print("\n⚠ NO majors have gen_ed_rules defined!")
        print("\nShowing structure of first major for reference:")
        first_major_id = list(majors_data.keys())[0]
        print(f"\nMajor: {first_major_id}")
        print(f"Fields: {list(majors_data[first_major_id].keys())}")
        print(f"\nFull structure:")
        print(json.dumps(majors_data[first_major_id], indent=2)[:1000] + "...")

if __name__ == "__main__":
    analyze_majors()
