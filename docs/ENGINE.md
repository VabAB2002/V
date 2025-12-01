# University Degree Audit & Recommendation Engine

A deterministic, recursive, type-safe TypeScript engine for auditing student progress and recommending minors/certificates based on completed coursework and GenEd requirements.

## 🏗️ Architecture

```
├── types.ts              # Data contracts and interfaces
├── index.ts              # Main API entry point
├── engine/
│   ├── loader.ts         # Data access layer (loads JSON files)
│   └── evaluator.ts      # Recursive audit engine
└── data/
    ├── penn_state_courses.json
    ├── penn_state_majors.json
    ├── penn_state_minors.json
    └── gen_ed_requirements.json
```

## 🚀 Quick Start

### Installation

```bash
npm install
# or
yarn install
```

### Basic Usage

```typescript
import { auditMajor, auditMinor, recommendMinors, getComprehensiveAudit } from './index';

// Define student transcript
const transcript = [
  { id: "ACCTG 211", grade: "B", credits_awarded: 4 },
  { id: "ECON 102", grade: "A", credits_awarded: 3 },
  { id: "MGMT 301", grade: "B+", credits_awarded: 3 },
  { id: "MKTG 301W", grade: "A-", credits_awarded: 3 },
  { id: "STAT 200", grade: "C", credits_awarded: 4 },
];

// Audit major progress
const majorAudit = auditMajor(transcript, "accounting_bs");
console.log(`Major Status: ${majorAudit.status}`);
console.log(`Credits: ${majorAudit.credits_earned} / ${majorAudit.credits_required}`);

// Audit minor progress
const minorAudit = auditMinor(transcript, "business_minor");
console.log(`Minor Status: ${minorAudit.status}`);

// Get minor recommendations
const recommendations = recommendMinors(transcript, { topN: 5 });
for (const rec of recommendations) {
  console.log(`\n${rec.minor_name}`);
  console.log(`  Gap: ${rec.gap_credits} credits`);
  console.log(`  Completion: ${rec.completion_percentage.toFixed(1)}%`);
  console.log(`  GenEd Overlap: ${rec.gen_ed_overlap.length} courses`);
}

// Get comprehensive audit (major + GenEd + recommendations)
const comprehensive = getComprehensiveAudit(transcript, "accounting_bs");
console.log(comprehensive.summary);
```

## 📋 Core API Functions

### `auditMajor(transcript, majorId)`
Audits student progress toward a specific major.

**Returns:** `AuditResult` with status, credits, and fulfilled courses.

### `auditMinor(transcript, minorId)`
Audits student progress toward a specific minor.

**Returns:** `AuditResult` with status, credits, and fulfilled courses.

### `auditGenEd(transcript)`
Audits General Education requirements progress.

**Returns:** `AuditResult` with breakdown by GenEd category.

### `recommendMinors(transcript, options)`
Recommends best minors based on completed courses and GenEd synergy.

**Parameters:**
- `transcript`: Student's completed courses
- `options`: 
  - `topN`: Number of recommendations (default: 10)
  - `minCompletion`: Minimum completion % (default: 0)
  - `maxGap`: Maximum gap credits (default: Infinity)

**Returns:** Array of `MinorRecommendation` sorted by strategic score.

### `getComprehensiveAudit(transcript, majorId)`
Returns complete audit including major, GenEd, and top minor recommendations.

**Returns:** Object with major audit, GenEd audit, recommendations, and summary.

## 🧠 How It Works

### 1. Recursive Requirement Evaluation
The engine uses a tree-based requirement structure with the following node types:

- **Logic Gates**: `AND`, `OR`
- **Fixed Courses**: `FIXED`, `FIXED_LIST`
- **Flexible Selection**: `PICK_FROM_LIST`, `PICK_FROM_DEPT`, `PICK_FROM_CATEGORY`
- **Open Selection**: `ANY_COURSE`
- **Special**: `PROFICIENCY`

Each node is recursively evaluated against the student's transcript.

### 2. Grade Comparison
Grades are compared using hierarchy: F < D < D+ < C- < C < C+ < B- < B < B+ < A- < A < A+

Minimum grade requirements (typically "C" or "D") are enforced per course or per requirement.

### 3. Strategic Recommendation Scoring
Minors are ranked using:
- **50%** Completion percentage (how much is done)
- **30%** Gap credits (inverse - fewer needed = higher score)  
- **20%** GenEd overlap (courses that count for both)

### 4. Double-Counting Prevention
Courses are tracked in a `usedCourses` set to prevent double-counting across requirements.

### 5. GenEd Integration
The system automatically detects when major/minor courses satisfy GenEd requirements, enabling strategic course selection recommendations.

## 📊 Data Contracts

### `CompletedCourse`
```typescript
interface CompletedCourse {
  id: string;                // e.g., "ACCTG 211"
  grade: string;             // e.g., "A", "B", "C"
  credits_awarded: number;   // Credits earned
}
```

### `AuditResult`
```typescript
interface AuditResult {
  status: 'MET' | 'MISSING' | 'PARTIAL';
  credits_earned: number;
  credits_required: number;
  fulfilled_by: string[];          // Course IDs used
  missing_reason?: string;
  children_results?: AuditResult[];
  label?: string;
  remaining_credits?: number;
}
```

### `MinorRecommendation`
```typescript
interface MinorRecommendation {
  minor_id: string;
  minor_name: string;
  gap_credits: number;
  completed_credits: number;
  total_credits_required: number;
  completion_percentage: number;
  gen_ed_overlap: GenEdOverlap[];
  strategic_score: number;
  missing_courses: string[];
  audit_result: AuditResult;
}
```

## 🎯 Use Cases

### 1. Degree Progress Tracking
Check how close a student is to completing their major:
```typescript
const audit = auditMajor(transcript, "software_engineering_bs");
console.log(`Progress: ${audit.credits_earned} / ${audit.credits_required} credits`);
```

### 2. Smart Minor Recommendations
Find minors with the highest synergy with completed courses:
```typescript
const recommendations = recommendMinors(transcript, { 
  topN: 3,
  maxGap: 15  // Only show minors within 15 credits
});
```

### 3. GenEd Course Planning
Identify which GenEd courses can count toward a desired minor:
```typescript
import { findGenEdOverlaps } from './index';
const overlaps = findGenEdOverlaps(transcript, "business_minor");
// Returns courses that satisfy both GenEd and minor requirements
```

### 4. What-If Analysis
Test different course combinations to optimize degree planning:
```typescript
const currentAudit = auditMinor(transcript, "finance_minor");
const withNewCourse = auditMinor(
  [...transcript, { id: "FIN 420", grade: "A", credits_awarded: 3 }],
  "finance_minor"
);
console.log(`Gap reduced by: ${currentAudit.remaining_credits - withNewCourse.remaining_credits}`);
```

## 🔧 Extending the Engine

### Adding New Node Types
1. Add the type to `NodeType` union in `types.ts`
2. Implement handler in `evaluator.ts`
3. Add case to `auditRequirement()` switch statement

### Custom Scoring Logic
Modify `calculateStrategicScore()` in `index.ts` to adjust recommendation weights.

### Additional Data Sources
Add new loader functions in `engine/loader.ts` for certificates, specializations, etc.

## 📝 Notes

- **Deterministic**: Same transcript always produces same results
- **Type-Safe**: Full TypeScript type checking
- **Recursive**: Handles nested requirement structures of any depth
- **Efficient**: Caches course catalog in memory
- **Extensible**: Easy to add new requirement types or scoring factors

## 🤝 Contributing

This is a production-grade academic audit engine. Key principles:

1. **Maintain determinism** - no randomness in evaluations
2. **Type safety first** - all data must conform to interfaces
3. **Document complex logic** - especially scoring algorithms
4. **Test recursively** - ensure deep requirement trees work correctly

## 📄 License

Built as a backend engineering solution for Penn State World Campus degree planning.
