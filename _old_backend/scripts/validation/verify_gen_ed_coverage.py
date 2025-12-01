#!/usr/bin/env python3
"""
Cross-verify Gen Ed requirements against Penn State courses database.
Analyzes course attributes to ensure Gen Ed coverage exists.
"""

import json
from collections import defaultdict, Counter
from pathlib import Path

# Get project root directory (2 levels up from this script)
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
DATA_DIR = PROJECT_ROOT / 'data'

def load_json(filename):
    """Load and parse JSON file from data directory"""
    filepath = DATA_DIR / filename
    with open(filepath, 'r') as f:
        return json.load(f)

def analyze_gen_ed_coverage():
    # Load data files
    print("Loading data files...")
    gen_ed_reqs = load_json('gen_ed_requirements.json')
    courses_data = load_json('penn_state_courses.json')
    
    # Extract courses from wrapper object
    courses = courses_data.get('courses', courses_data)
    
    print(f"✓ Loaded {len(courses)} courses\n")
    
    # Expected Gen Ed attributes from requirements
    expected_attributes = {
        'GWS': 'Writing/Speaking',
        'GQ': 'Quantification',
        'GHW': 'Health and Wellness',
        'GN': 'Natural Sciences',
        'GA': 'Arts',
        'GH': 'Humanities',
        'GS': 'Social and Behavioral Sciences',
        'interdomain': 'Integrative Studies'
    }
    
    # Track courses by Gen Ed attribute
    courses_by_gen_ed = defaultdict(list)
    courses_with_gen_ed = set()
    courses_without_gen_ed = []
    
    # Track all unique gen_ed values found
    all_gen_ed_values = set()
    
    # Analyze each course
    for course_code, course_data in courses.items():
        has_gen_ed = False
        
        # Check if course has attributes and gen_ed
        if 'attributes' in course_data and course_data['attributes']:
            attributes = course_data['attributes']
            
            if 'gen_ed' in attributes and attributes['gen_ed']:
                gen_ed_list = attributes['gen_ed']
                
                # Handle both single values and lists
                if isinstance(gen_ed_list, str):
                    gen_ed_list = [gen_ed_list]
                
                for gen_ed_attr in gen_ed_list:
                    all_gen_ed_values.add(gen_ed_attr)
                    courses_by_gen_ed[gen_ed_attr].append(course_code)
                    has_gen_ed = True
                    courses_with_gen_ed.add(course_code)
        
        if not has_gen_ed:
            courses_without_gen_ed.append(course_code)
    
    # Print comprehensive report
    print("=" * 80)
    print("GEN ED COVERAGE ANALYSIS")
    print("=" * 80)
    
    print(f"\n📊 OVERALL STATISTICS:")
    print(f"   Total courses in database: {len(courses)}")
    print(f"   Courses with Gen Ed attributes: {len(courses_with_gen_ed)}")
    print(f"   Courses without Gen Ed attributes: {len(courses_without_gen_ed)}")
    print(f"   Coverage: {len(courses_with_gen_ed)/len(courses)*100:.1f}%")
    
    print(f"\n{'=' * 80}")
    print("GEN ED ATTRIBUTE BREAKDOWN")
    print(f"{'=' * 80}")
    
    # Check each expected attribute
    for attr_code, attr_name in expected_attributes.items():
        course_count = len(courses_by_gen_ed.get(attr_code, []))
        status = "✓" if course_count > 0 else "✗"
        
        print(f"\n{status} {attr_code} ({attr_name})")
        print(f"   Courses available: {course_count}")
        
        if course_count > 0:
            # Show sample courses
            sample_courses = courses_by_gen_ed[attr_code][:5]
            print(f"   Sample courses: {', '.join(sample_courses)}")
            if course_count > 5:
                print(f"   ... and {course_count - 5} more")
    
    # Check for unexpected Gen Ed attributes
    unexpected_attrs = all_gen_ed_values - set(expected_attributes.keys())
    if unexpected_attrs:
        print(f"\n{'=' * 80}")
        print("⚠️  UNEXPECTED GEN ED ATTRIBUTES FOUND")
        print(f"{'=' * 80}")
        for attr in sorted(unexpected_attrs):
            print(f"   • {attr}: {len(courses_by_gen_ed[attr])} courses")
    
    # Required Gen Ed credits analysis
    print(f"\n{'=' * 80}")
    print("GEN ED REQUIREMENTS FEASIBILITY CHECK")
    print(f"{'=' * 80}")
    
    gen_ed_data = gen_ed_reqs['gen_ed_requirements']
    
    # Check Foundations
    print("\n📚 FOUNDATIONS (15 credits needed):")
    print("   Writing/Speaking (GWS): 9 credits needed")
    gws_courses = len(courses_by_gen_ed.get('GWS', []))
    print(f"      ✓ {gws_courses} courses available" if gws_courses >= 3 else f"      ✗ Only {gws_courses} courses available")
    
    print("   Quantification (GQ): 6 credits needed")
    gq_courses = len(courses_by_gen_ed.get('GQ', []))
    print(f"      ✓ {gq_courses} courses available" if gq_courses >= 2 else f"      ✗ Only {gq_courses} courses available")
    
    # Check Knowledge Domains
    print("\n🎓 KNOWLEDGE DOMAINS (15 credits needed, 3 each):")
    for attr_code, attr_name in [('GHW', 'Health and Wellness'),
                                   ('GN', 'Natural Sciences'),
                                   ('GA', 'Arts'),
                                   ('GH', 'Humanities'),
                                   ('GS', 'Social and Behavioral Sciences')]:
        count = len(courses_by_gen_ed.get(attr_code, []))
        status = "✓" if count >= 1 else "✗"
        print(f"   {status} {attr_code} ({attr_name}): {count} courses")
    
    # Check Integrative Studies
    print("\n🔗 INTEGRATIVE STUDIES (6 credits needed):")
    inter_domain_count = len(courses_by_gen_ed.get('interdomain', []))
    print(f"   {'✓' if inter_domain_count >= 2 else '✗'} interdomain: {inter_domain_count} courses")
    
    # Check Exploration
    print("\n🔍 EXPLORATION (9 credits needed):")
    print(f"   Natural Sciences (GN) can be used (Inter-Domain allowed)")
    print(f"   Additional from GA, GH, GN, GS, Inter-Domain needed")
    
    # Final summary
    print(f"\n{'=' * 80}")
    print("FINAL VERDICT")
    print(f"{'=' * 80}")
    
    all_required_present = all(
        len(courses_by_gen_ed.get(attr, [])) > 0 
        for attr in expected_attributes.keys()
    )
    
    if all_required_present:
        print("\n✅ SUCCESS: All required Gen Ed attributes are present in the course database!")
        print("   Students can fulfill all Gen Ed requirements with available courses.")
    else:
        missing = [attr for attr in expected_attributes.keys() 
                  if len(courses_by_gen_ed.get(attr, [])) == 0]
        print(f"\n⚠️  WARNING: Missing Gen Ed attributes: {', '.join(missing)}")
        print("   Some Gen Ed requirements may not be fulfillable.")
    
    # Export detailed statistics
    print(f"\n{'=' * 80}")
    print("DETAILED COURSE COUNTS BY GEN ED ATTRIBUTE")
    print(f"{'=' * 80}\n")
    
    stats = []
    for attr in sorted(all_gen_ed_values):
        count = len(courses_by_gen_ed[attr])
        required = "✓ Required" if attr in expected_attributes else "  Optional/Unknown"
        stats.append((attr, count, required))
    
    # Print as table
    print(f"{'Attribute':<20} {'Courses':<10} {'Status'}")
    print("-" * 50)
    for attr, count, status in sorted(stats, key=lambda x: x[1], reverse=True):
        print(f"{attr:<20} {count:<10} {status}")
    
    print(f"\n{'=' * 80}\n")

if __name__ == "__main__":
    analyze_gen_ed_coverage()
