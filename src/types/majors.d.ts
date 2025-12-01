/**
 * TypeScript Type Definitions for Penn State University Academic Majors
 * Generated from majors.schema.json
 * @version 2.0.0
 */

export type DegreeType = 'BS' | 'BA' | 'BDes';
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';
export type RequirementType = 
  | 'AND' 
  | 'OR' 
  | 'FIXED' 
  | 'FIXED_LIST' 
  | 'PICK_FROM_LIST' 
  | 'PICK_FROM_DEPT' 
  | 'ANY_COURSE' 
  | 'CUSTOM_PLAN';

export type CourseRequirementType = 'FIXED' | 'OR';

/**
 * Main majors data structure - maps major_id to Major object
 */
export interface MajorsData {
  [major_id: string]: Major;
}

/**
 * Complete major definition
 */
export interface Major {
  /** Unique identifier for the major (snake_case) */
  major_id: string;
  
  /** Full name of the major (e.g., 'Accounting, B.S.') */
  name: string;
  
  /** Type of degree awarded */
  degree_type: DegreeType;
  
  /** Department code (e.g., 'ACCTG', 'IST') */
  department?: string;
  
  /** Total credits required for degree completion */
  credits_required: number;
  
  /** Requirements for entering the major */
  entrance_requirements: EntranceRequirements;
  
  /** Common requirements for all students in the major */
  common_requirements: CommonRequirements;
  
  /** Optional sub-plans (concentrations, options, etc.) */
  sub_plans?: SubPlans | null;
  
  /** Special credit transfer or unique requirements */
  special_requirements?: SpecialRequirement[];
}

/**
 * Entrance to major requirements
 */
export interface EntranceRequirements {
  /** Minimum GPA required */
  min_gpa?: number;
  
  /** Minimum GPA for transfer students */
  min_gpa_transfer?: number;
  
  /** Minimum credits for transfer students */
  min_credits_transfer?: number;
  
  /** Minimum semester standing (e.g., 3 for junior status) */
  min_semester_standing?: number;
  
  /** List of required courses */
  courses: CourseRequirement[];
}

/**
 * Course requirement for entrance or other purposes
 */
export interface CourseRequirement {
  /** Type of requirement */
  type: CourseRequirementType;
  
  /** Course code for FIXED type (e.g., 'ACCTG 211') */
  course?: string;
  
  /** List of course options for OR type */
  options?: string[];
  
  /** Minimum grade required */
  min_grade?: Grade;
  
  /** Course-specific grade overrides */
  min_grade_overrides?: Record<string, Grade>;
}

/**
 * Common requirements structure
 */
export interface CommonRequirements {
  /** Prescribed (required) courses */
  prescribed_courses?: RequirementNode;
  
  /** Additional courses (may include options) */
  additional_courses?: RequirementNode;
  
  /** Supporting courses */
  supporting_courses?: RequirementNode;
  
  /** Specialization courses */
  specialization_courses?: RequirementNode;
}

/**
 * Recursive requirement node - can represent AND/OR logic, course lists, etc.
 */
export interface RequirementNode {
  /** Type of requirement logic */
  type: RequirementType;
  
  /** Human-readable label */
  label?: string;
  
  /** Detailed description */
  description?: string;
  
  /** Additional notes or caveats */
  note?: string;
  
  /** Minimum grade required for all courses in this node */
  min_grade?: Grade;
  
  /** Number of credits required */
  credits_needed?: number;
  
  // Type-specific fields
  
  /** For FIXED: single course code */
  course?: string;
  
  /** For FIXED_LIST: array of course codes */
  courses?: string[];
  
  /** For OR: simple options (course codes) */
  options?: string[];
  
  /** For AND/OR: nested children nodes */
  children?: RequirementNode[];
  
  /** For PICK_FROM_LIST: valid course options */
  valid_courses?: string[];
  
  /** For PICK_FROM_LIST: course-specific grade overrides */
  min_grade_overrides?: Record<string, Grade>;
  
  /** For PICK_FROM_DEPT: valid department codes */
  valid_departments?: string[];
  
  /** Minimum course level (e.g., 200, 300, 400) */
  level_min?: number;
  
  /** Maximum course level */
  level_max?: number;
  
  /** For PICK_FROM_DEPT: department-specific rules */
  department_rules?: Record<string, DepartmentRule>;
  
  /** Level-based credit requirements */
  level_rules?: LevelRule[];
  
  /** For CUSTOM_PLAN: custom constraints */
  constraints?: CustomPlanConstraints;
}

/**
 * Department-specific rule
 */
export interface DepartmentRule {
  /** Minimum grade for courses in this department */
  min_grade?: Grade;
}

/**
 * Level-based credit requirement
 */
export interface LevelRule {
  /** Minimum course level */
  min_level: number;
  
  /** Maximum course level */
  max_level?: number;
  
  /** Credits needed at this level range */
  credits_needed: number;
}

/**
 * Custom plan constraints (for individualized options)
 */
export interface CustomPlanConstraints {
  /** Maximum 100-level credits */
  max_100_level?: number;
  
  /** Maximum 200-level credits */
  max_200_level?: number;
  
  /** Minimum 400-level business credits */
  min_400_level_business?: number;
  
  /** Maximum non-business credits */
  max_non_business?: number;
  
  /** Additional custom constraints */
  [key: string]: any;
}

/**
 * Sub-plans (options, concentrations, etc.)
 */
export interface SubPlans {
  /** Whether student must select one or can choose multiple */
  type: 'SELECT_ONE' | 'SELECT_MULTIPLE';
  
  /** Map of option_id to SubPlan */
  options: Record<string, SubPlan>;
}

/**
 * Individual sub-plan option
 */
export interface SubPlan {
  /** Display name for the option */
  name: string;
  
  /** Additional credits required for this option */
  credits_added?: number;
  
  /** Special notes */
  note?: string;
  
  /** Requirements specific to this option */
  requirements?: {
    prescribed_courses?: RequirementNode;
    additional_courses?: RequirementNode;
    supporting_courses?: RequirementNode;
    custom_plan?: RequirementNode;
  };
}

/**
 * Special requirement (e.g., credit transfer rules)
 */
export interface SpecialRequirement {
  /** Type of special requirement */
  type: string;
  
  /** Label for this requirement */
  label: string;
  
  /** Detailed description */
  description?: string;
  
  /** Conditions that must be met */
  conditions?: Record<string, any>;
  
  /** Credits or courses awarded */
  awards?: Record<string, any>;
}

/**
 * Enhanced majors data with metadata (v2 format)
 */
export interface MajorsDataV2 {
  /** Metadata about the dataset */
  metadata: MajorsMetadata;
  
  /** The majors data */
  majors: MajorsData;
}

/**
 * Metadata for the majors dataset
 */
export interface MajorsMetadata {
  /** Schema version (semver) */
  schema_version: string;
  
  /** Data version (date-based or semver) */
  data_version: string;
  
  /** ISO timestamp of last update */
  last_updated: string;
  
  /** Total number of majors */
  total_majors: number;
  
  /** SHA256 checksum of majors data */
  checksum?: string;
  
  /** Data source */
  source?: string;
  
  /** Additional metadata */
  [key: string]: any;
}

// Utility types for common operations

/**
 * Extract all course codes from a requirement tree
 */
export type ExtractedCourse = {
  course_code: string;
  min_grade?: Grade;
  is_required: boolean;
  path: string; // JSON path to this course
};

/**
 * Flattened major summary for indexing
 */
export interface MajorSummary {
  major_id: string;
  name: string;
  degree_type: DegreeType;
  department?: string;
  credits_required: number;
  all_courses: string[]; // All course codes mentioned
  required_courses: string[]; // Only strictly required courses
  entrance_courses: string[]; // Entrance requirement courses
}
