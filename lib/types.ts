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
    label?: string;
    description?: string;
    requirement_id?: string;
    option_id?: string;
    note?: string;

    // Credit Requirements
    credits_needed?: number;
    credits_required?: number;
    credits_max?: number;
    total_credits?: number;
    credits_added?: number;

    // Grade Requirements
    min_grade?: string;
    min_grade_overrides?: Record<string, string>;

    // Recursive Structure
    children?: RequirementNode[];

    // Course Selectors (Leaf Nodes)
    course?: string;
    course_id?: string;
    courses?: string[];
    valid_courses?: string[];
    options?: string[];

    // Department/Level Selectors
    valid_departments?: string[];
    department_rules?: Record<string, { min_grade?: string }>;
    level_min?: number;                // Minimum course level (e.g., 300)
    level_max?: number;                // Maximum course level (e.g., 499)
    level_rules?: LevelRule[];         // Level-based credit requirements

    // Attribute Selectors (for GenEd)
    category?: string;
    required_attributes?: string[];
    valid_attributes?: string[];
    exclude_attributes?: string[];
    allow_inter_domain?: boolean;

    // Exclusions
    exclude_courses?: string[];

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
    credits: number | { min: number; max: number };
    attributes: {
        gen_ed: string[];
        writing: boolean;
        cultural_diversity: string[];
    };
    department: string;
    level: number;
    credit_type?: 'fixed' | 'variable';
    [key: string]: any;                // Allow additional fields from course data
}

/**
 * Result of auditing a requirement node.
 */
export interface AuditResult {
    status: 'MET' | 'MISSING' | 'PARTIAL';
    credits_earned: number;
    credits_required: number;
    fulfilled_by: string[];
    missing_reason?: string;
    children_results?: AuditResult[];
    label?: string;
    remaining_credits?: number;
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
    program_id: string;
    name: string;
    degree_type?: string;
    department?: string;
    credits_required: number;
    entrance_requirements?: RequirementNode;
    requirements: RequirementNode;
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
