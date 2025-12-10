// types.ts - Data Contracts for University Degree Audit Engine

/**
 * Node types supported by the audit engine.
 * Extended to support both spec and existing data formats.
 */
export type NodeType =
    // Logic Gates
    | 'AND'           // All children must be satisfied
    | 'OR'            // At least one child must be satisfied

    // Fixed Course Requirements  
    | 'FIXED'         // Single specific course (uses course_id)
    | 'FIXED_LIST'    // List of specific courses (uses courses[])
    | 'COURSE'        // Alias for FIXED (backwards compatibility)

    // Flexible Selection Requirements
    | 'PICK_FROM_LIST'      // Pick N credits from valid_courses[]
    | 'PICK_FROM_DEPT'      // Pick N credits from valid_departments[]
    | 'PICK_FROM_CATEGORY'  // Pick N credits by GenEd category
    | 'PICK_BY_ATTRIBUTE'   // Pick N credits by course attributes (for GenEd)
    | 'ANY_COURSE'          // Pick N credits from any course (with optional level constraints)

    // Special Requirements
    | 'PROFICIENCY';        // Language/skill proficiency requirement

/**
 * Recursive structure representing a degree requirement node.
 * This is the core data structure for major/minor/GenEd requirements.
 */
export interface RequirementNode {
    type: NodeType;

    // Metadata
    label?: string;                    // Human-readable label (e.g., "Accounting Core")
    description?: string;              // Detailed description
    requirement_id?: string;           // Unique identifier for this requirement
    option_id?: string;                // For OR branches
    note?: string;                     // Additional notes

    // Credit Requirements
    credits_needed?: number;           // Credits required (default: sum of children or course credits)
    credits_required?: number;         // Alias for credits_needed
    credits_max?: number;              // Maximum credits that can be applied
    total_credits?: number;            // Total credits in this section (informational)
    credits_added?: number;            // Credits added by sub-plan

    // Grade Requirements
    min_grade?: string;                // Minimum grade (default "D", often "C")
    min_grade_overrides?: Record<string, string>; // Per-course grade overrides

    // Recursive Structure
    children?: RequirementNode[];      // Child requirement nodes

    // Course Selectors (Leaf Nodes)
    course?: string;                   // Single course ID (for FIXED)
    course_id?: string;                // Alias for course
    courses?: string[];                // List of course IDs (for FIXED_LIST)
    valid_courses?: string[];          // Valid course list (for PICK_FROM_LIST)
    options?: string[];                // Course options (for OR nodes)

    // Department/Level Selectors
    valid_departments?: string[];      // Valid departments (for PICK_FROM_DEPT)
    department_rules?: Record<string, { min_grade?: string }>; // Per-dept rules
    level_min?: number;                // Minimum course level (e.g., 300)
    level_max?: number;                // Maximum course level (e.g., 499)
    level_rules?: LevelRule[];         // Level-based credit requirements

    // Attribute Selectors (for GenEd)
    category?: string;                 // GenEd category (e.g., "GN", "GQ")
    required_attributes?: string[];    // Required course attributes
    valid_attributes?: string[];       // Valid course attributes
    exclude_attributes?: string[];     // Excluded attributes (e.g., no interdomain)
    allow_inter_domain?: boolean;      // Allow interdomain courses

    // Exclusions
    exclude_courses?: string[];        // Courses that cannot be used

    // Special Fields
    world_language_option?: {          // For world language requirements
        allowed: boolean;
        credits_max: number;
        requirement: string;
    };
}

/**
 * Level-based credit rule (e.g., "at least 6 credits must be 400-level")
 */
export interface LevelRule {
    min_level: number;                 // Minimum course level
    credits_needed: number;            // Credits required at this level
}

/**
 * A course that a student has completed.
 */
export interface CompletedCourse {
    id: string;                        // Course ID (e.g., "ACCTG 211")
    grade: string;                     // Letter grade (e.g., "A", "B", "C", "D", "F")
    credits_awarded: number;           // Credits earned for this course
}

/**
 * Detailed information about a course from the course catalog.
 */
export interface CourseDetails {
    credits: number | { min: number; max: number }; // Fixed or variable credits
    attributes: {
        gen_ed: string[];                // GenEd attributes (e.g., ["GN", "GS"])
        writing: boolean;                // Writing intensive
        cultural_diversity: string[];    // Cultural diversity attributes
    };
    department: string;                // Department code (e.g., "ACCTG")
    level: number;                     // Course level (e.g., 211)
    credit_type?: 'fixed' | 'variable'; // Credit type
    [key: string]: any;                // Allow additional fields from course data
}

/**
 * Result of auditing a requirement node.
 */
export interface AuditResult {
    status: 'MET' | 'MISSING' | 'PARTIAL'; // Requirement status
    credits_earned: number;            // Credits earned toward this requirement
    credits_required: number;          // Credits required for this requirement
    fulfilled_by: string[];            // Course IDs that fulfilled this requirement
    missing_reason?: string;           // Reason if not met
    children_results?: AuditResult[];  // Results for child nodes
    label?: string;                    // Label from requirement node
    remaining_credits?: number;        // Credits still needed
    suggested_courses?: string[];      // Suggested courses to complete (future)
}

/**
 * Student's academic transcript.
 */
export interface Transcript {
    courses: CompletedCourse[];        // Completed courses
    student_id?: string;               // Student identifier
    gpa?: number;                      // Current GPA
}

/**
 * Program (major/minor) metadata.
 */
export interface ProgramMetadata {
    program_id: string;                // Unique program ID
    name: string;                      // Program name
    degree_type?: string;              // Degree type (BS, BA, etc.)
    department?: string;               // Primary department
    credits_required: number;          // Total credits required
    entrance_requirements?: RequirementNode; // Entrance requirements
    requirements: RequirementNode;     // Main program requirements
}

/**
 * Minor recommendation with gap analysis.
 */
export interface MinorRecommendation {
    minor_id: string;                  // Minor identifier
    minor_name: string;                // Minor name
    gap_credits: number;               // Credits needed to complete
    completed_credits: number;         // Credits already completed
    total_credits_required: number;    // Total credits for minor
    completion_percentage: number;     // Percentage complete (0-100)
    gen_ed_overlap: GenEdOverlap[];    // GenEd courses that can count
    strategic_score: number;           // Ranking score
    missing_courses: string[];         // Courses still needed
    audit_result: AuditResult;         // Full audit result
}

/**
 * GenEd course that can count toward a minor/certificate.
 */
export interface GenEdOverlap {
    course_id: string;                 // Course ID
    gen_ed_categories: string[];       // GenEd categories satisfied
    minor_requirement_id?: string;     // Minor requirement this satisfies
    credits: number;                   // Credit value
}

/**
 * Grade comparison result.
 */
export type GradeComparisonResult = 'PASS' | 'FAIL';

/**
 * Utility type for course lookup cache.
 */
export type CourseLookupCache = Map<string, CourseDetails>;

/**
 * Option for major selection dropdown/autocomplete.
 */
export interface MajorOption {
    id: string;                        // Major identifier
    name: string;                      // Major display name
}

/**
 * Option for course selection dropdown/autocomplete.
 */
export interface CourseOption {
    code: string;                      // Course code (e.g., "CMPSC 131")
    name: string;                      // Course name
}
