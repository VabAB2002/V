# Usage Examples

Common patterns and code examples for working with majors.json.

---

## Python Examples

### Loading and Basic Access

```python
import json

# Load the data
with open('majors.json', 'r') as f:
    majors = json.load(f)

# Get a specific major
accounting =majors['accounting_bs']
print(f"Major: {accounting['name']}")
print(f"Credits: {accounting['credits_required']}")
print(f"Department: {accounting.get('department', 'N/A')}")

# List all major names
for major_id, major in majors.items():
    print(f"{major_id}: {major['name']}")
```

### Finding Majors by Criteria

```python
# Find all BS degrees
bs_majors = {
    mid: m for mid, m in majors.items()
    if m['degree_type'] == 'BS'
}
print(f"Found {len(bs_majors)} BS degrees")

# Find majors in a specific department
acct_majors = {
    mid: m for mid, m in majors.items()
    if m.get('department') == 'ACCTG'
}

# Find majors requiring fewer than 125 credits
light_majors = {
    mid: m for mid, m in majors.items()
    if m['credits_required'] < 125
}
```

### Extracting Course Requirements

```python
def extract_all_courses(node, courses=None):
    """Recursively extract all course codes from requirement tree"""
    if courses is None:
        courses = set()
    
    if not isinstance(node, dict):
        return courses
    
    # Direct course
    if 'course' in node:
        courses.add(node['course'])
    
    # Course list
    if 'courses' in node:
        courses.update(node['courses'])
    
    # Options (OR gates)
    if 'options' in node:
        for opt in node['options']:
            if isinstance(opt, str):
                courses.add(opt)
    
    # Valid courses (electives)
    if 'valid_courses' in node:
        courses.update(node['valid_courses'])
    
    # Recurse into children
    if 'children' in node:
        for child in node['children']:
            extract_all_courses(child, courses)
    
    return courses

# Get all courses for a major
major = majors['accounting_bs']
all_courses = set()

# Entrance requirements
for req in major['entrance_requirements'].get('courses', []):
    if 'course' in req:
        all_courses.add(req['course'])
    if 'options' in req:
        all_courses.update(req['options'])

# Common requirements
for req_type in ['prescribed_courses', 'additional_courses', 'supporting_courses']:
    if req_type in major['common_requirements']:
        extract_all_courses(major['common_requirements'][req_type], all_courses)

print(f"Accounting major mentions {len(all_courses)} unique courses")
print(sorted(all_courses))
```

### Using Generated Indexes

```python
# Find majors requiring MATH 140
with open('data/indexes/course_to_majors.json') as f:
    course_index = json.load(f)

math140_majors = course_index['index'].get('MATH 140', [])
print(f"Majors requiring MATH 140:")
for item in math140_majors:
    major = majors[item['major_id']]
    print(f"  - {major['name']} ({item['context']})")

# Get all majors in IST department
with open('data/indexes/department_index.json') as f:
    dept_index = json.load(f)

ist_majors = dept_index['index'].get('IST', [])
print(f"\nIST Department majors:")
for item in ist_majors:
    print(f"  - {item['name']} ({item['credits_required']} credits)")
```

---

## JavaScript/TypeScript Examples

### Loading with Type Safety

```typescript
import majorsData from './majors.json';
import type { MajorsData, Major, RequirementNode } from './types/majors';

const majors: MajorsData = majorsData;

// Type-safe access
const accounting: Major = majors.accounting_bs;
console.log(accounting.name); // "Accounting, B.S."
console.log(accounting.credits_required); // 120
```

### Finding Majors

```typescript
// Find all BA degrees
const baMajors = Object.entries(majors)
  .filter(([_, major]) => major.degree_type === 'BA')
  .map(([id, major]) => ({ id, name: major.name }));

console.log(`Found ${baMajors.length} BA degrees`);

// Find majors with sub-plans
const majorsWithOptions = Object.entries(majors)
  .filter(([_, major]) => major.sub_plans !== null)
  .map(([id, major]) => ({
    id,
    name: major.name,
    optionCount: Object.keys(major.sub_plans!.options).length
  }));
```

### Recursively Process Requirements

```typescript
function extractCourses(node: RequirementNode): string[] {
  const courses: string[] = [];
  
  if (node.course) courses.push(node.course);
  if (node.courses) courses.push(...node.courses);
  if (node.options) {
    courses.push(...node.options.filter(o => typeof o === 'string'));
  }
  if (node.valid_courses) courses.push(...node.valid_courses);
  
  if (node.children) {
    for (const child of node.children) {
      courses.push(...extractCourses(child));
    }
  }
  
  return courses;
}

// Usage
const major = majors.accounting_bs;
const prescribed = major.common_requirements.prescribed_courses;
if (prescribed) {
  const courses = extractCourses(prescribed);
  console.log(`Prescribed courses:`, courses);
}
```

### Using Indexes

```typescript
import courseIndex from './data/indexes/course_to_majors.json';

// Find majors requiring a specific course
const course = 'STAT 200';
const majorList = courseIndex.index[course] || [];

console.log(`Majors requiring ${course}:`);
majorList.forEach(item => {
  const major = majors[item.major_id];
  console.log(`  - ${major.name} (${item.context})`);
});
```

---

## Common Queries

### 1. Get All Entrance Requirements for a Major

```python
major = majors['information_sciences_technology_bs']
entrance = major['entrance_requirements']

print(f"Minimum GPA: {entrance.get('min_gpa', 'N/A')}")
print(f"Required courses:")
for req in entrance.get('courses', []):
    if req['type'] == 'FIXED':
        print(f"  - {req['course']}", end='')
        if 'min_grade' in req:
            print(f" (min grade: {req['min_grade']})")
        else:
            print()
    elif req['type'] == 'OR':
        options = ' OR '.join(req['options'])
        print(f"  - One of: {options}", end='')
        if 'min_grade' in req:
            print(f" (min grade: {req['min_grade']})")
        else:
            print()
```

### 2. Find Majors with Lowest Credit Requirements

```python
sorted_majors = sorted(
    majors.items(),
    key=lambda x: x[1]['credits_required']
)

print("Majors with lowest credit requirements:")
for major_id, major in sorted_majors[:5]:
    print(f"  {major['name']}: {major['credits_required']} credits")
```

### 3. Count Majors by Degree Type

```python
from collections import Counter

degree_counts = Counter(m['degree_type'] for m in majors.values())
print("Majors by degree type:")
for deg_type, count in degree_counts.most_common():
    print(f"  {deg_type}: {count}")
```

### 4. Find All Sub-Plan Options

```python
for major_id, major in majors.items():
    if major.get('sub_plans'):
        print(f"\n{major['name']}:")
        for opt_id, option in major['sub_plans']['options'].items():
            credits = option.get('credits_added', 0)
            print(f"  - {option['name']} (+{credits} credits)")
```

### 5. Extract Department Statistics

```python
from collections import defaultdict

dept_stats = defaultdict(lambda: {'majors': [], 'total_credits': 0})

for major_id, major in majors.items():
    dept = major.get('department', 'Unknown')
    dept_stats[dept]['majors'].append(major['name'])
    dept_stats[dept]['total_credits'] += major['credits_required']

print("Department Statistics:")
for dept, stats in sorted(dept_stats.items()):
    avg_credits = stats['total_credits'] / len(stats['majors'])
    print(f"\n{dept}:")
    print(f"  Majors: {len(stats['majors'])}")
    print(f"  Avg Credits: {avg_credits:.1f}")
```

---

## Advanced Patterns

### Building a Prerequisite Graph

```python
from collections import defaultdict

prereq_graph = defaultdict(set)

def extract_prerequisites(node, current_course=None):
    """Extract course prerequisites from requirement tree"""
    if not isinstance(node, dict):
        return
    
    # If this is an entrance requirement, these are prerequisites
    if current_course and 'course' in node:
        prereq_graph[current_course].add(node['course'])
    if current_course and 'courses' in node:
        prereq_graph[current_course].update(node['courses'])
    
    # Recurse
    if 'children' in node:
        for child in node['children']:
            extract_prerequisites(child, current_course)

# Could be extended to build full dependency graph
```

### Generate Major Comparison

```python
def compare_majors(major_id1, major_id2):
    """Compare two majors"""
    m1 = majors[major_id1]
    m2 = majors[major_id2]
    
    # Extract all courses
    courses1 = extract_all_courses(m1['common_requirements'].get('prescribed_courses', {}))
    courses2 = extract_all_courses(m2['common_requirements'].get('prescribed_courses', {}))
    
    overlap = courses1 & courses2
    
    print(f"Comparing {m1['name']} vs {m2['name']}:")
    print(f"  Credits: {m1['credits_required']} vs {m2['credits_required']}")
    print(f"  Overlapping courses: {len(overlap)}")
    print(f"  Unique to {m1['name']}: {len(courses1 - courses2)}")
    print(f"  Unique to {m2['name']}: {len(courses2 - courses1)}")

compare_majors('accounting_bs', 'finance_bs')
```

---

## Validation Examples

```python
# Validate a single major
from scripts.validate import MajorsValidator

validator = MajorsValidator('majors.json')
validator.load_data()

# Check if all course codes are valid
validator.validate_course_codes()

# Generate statistics
stats = validator.generate_statistics()
print(f"Total unique courses: {stats['total_unique_courses']}")
```

---

## Performance Tips

1. **Load once**: Cache the majors.json in memory
2. **Use indexes**: Pre-generate indexes for frequent queries
3. **Lazy loading**: Only load sub-plans when needed
4. **Type safety**: Use TypeScript for compile-time checks
