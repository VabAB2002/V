// engine/loader.ts - Data Access Layer
import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';
import {
    RequirementNode,
    CourseDetails,
    ProgramMetadata,
} from '../types';

/**
 * Paths to data files.
 * In Next.js, use process.cwd() to get project root instead of __dirname
 */
const DATA_DIR = path.join(process.cwd(), 'lib', 'data');
const DB_PATH = path.join(DATA_DIR, 'courses.db');
const MAJORS_PATH = path.join(DATA_DIR, 'penn_state_majors.json');
const MINORS_PATH = path.join(DATA_DIR, 'penn_state_minors.json');
const GENED_PATH = path.join(DATA_DIR, 'gen_ed_requirements.json');

/**
 * Database connection instance.
 * Lazy loaded on first access.
 */
let dbInstance: Database.Database | null = null;

function getDb(): Database.Database {
    if (!dbInstance) {
        // Open database in read-only mode for safety, though we might want read-write later
        // Using standard mode for now to avoid locking issues if we need to write
        dbInstance = new Database(DB_PATH, { readonly: true });
        // Enable WAL mode for better concurrency if needed, though mostly read-only here
        // dbInstance.pragma('journal_mode = WAL');
    }
    return dbInstance;
}

// Prepared statements cache
let stmtGetCourse: Database.Statement | null = null;
let stmtFindCourses: Database.Statement | null = null;

// In-memory cache for other data
let majorsData: any = null;
let minorsData: any = null;
let genEdData: any = null;

/**
 * Get course details for a specific course ID from SQLite.
 * @param courseId Course identifier (e.g., "ACCTG 211")
 * @returns Course details or undefined if not found
 */
export function getCourseDetails(courseId: string): CourseDetails | undefined {
    const db = getDb();

    if (!stmtGetCourse) {
        stmtGetCourse = db.prepare('SELECT * FROM courses WHERE id = ?');
    }

    const row = stmtGetCourse.get(courseId) as any;

    if (!row) {
        return undefined;
    }

    // Convert DB row back to CourseDetails object
    return {
        course_code: row.id,
        course_name: row.name,
        credits: row.credits_min === row.credits_max ? row.credits_min : { min: row.credits_min, max: row.credits_max },
        department: row.department,
        level: row.level,
        attributes: {
            gen_ed: JSON.parse(row.gen_ed_json || '[]'),
            writing: false, // Default
            cultural_diversity: [], // Default
        },
        // We could parse raw_json if we need full details, but this covers what the engine needs
        description: JSON.parse(row.raw_json || '{}').description
    };
}

/**
 * Get the credit value for a course.
 * Handles both fixed and variable credit courses.
 * @param courseId Course identifier
 * @returns Credit value (uses min for variable credits) or 3 as default
 */
export function getCourseCredits(courseId: string): number {
    const details = getCourseDetails(courseId);
    if (!details) {
        return 3; // Default assumption
    }

    if (typeof details.credits === 'number') {
        return details.credits;
    } else if (details.credits && typeof details.credits === 'object') {
        return details.credits.min; // Use minimum for variable credit courses
    }

    return 3;
}

/**
 * Load all majors data.
 */
function loadMajorsData(): any {
    if (majorsData) {
        return majorsData;
    }

    const rawData = fs.readFileSync(MAJORS_PATH, 'utf-8');
    majorsData = JSON.parse(rawData);
    return majorsData;
}

/**
 * Load all minors data.
 */
function loadMinorsData(): any {
    if (minorsData) {
        return minorsData;
    }

    const rawData = fs.readFileSync(MINORS_PATH, 'utf-8');
    minorsData = JSON.parse(rawData);
    return minorsData;
}

/**
 * Load GenEd requirements data.
 */
function loadGenEdData(): any {
    if (genEdData) {
        return genEdData;
    }

    const rawData = fs.readFileSync(GENED_PATH, 'utf-8');
    genEdData = JSON.parse(rawData);
    return genEdData;
}

/**
 * Load major requirements by major ID.
 * @param majorId Major identifier (e.g., "accounting_bs")
 * @returns Program metadata with requirements
 */
export function loadMajorRequirements(majorId: string): ProgramMetadata | null {
    const data = loadMajorsData();
    const majorData = data[majorId];

    if (!majorData) {
        console.warn(`⚠️ Major "${majorId}" not found in data. Available keys: ${Object.keys(data).length}`);
        if (Object.keys(data).length > 0) {
            console.warn(`First key: ${Object.keys(data)[0]}`);
            console.warn(`Has key "${majorId}"? ${Object.prototype.hasOwnProperty.call(data, majorId)}`);
        }
        return null;
    }

    return {
        program_id: majorData.major_id || majorId,
        name: majorData.name,
        degree_type: majorData.degree_type,
        department: majorData.department,
        credits_required: majorData.credits_required,
        entrance_requirements: majorData.entrance_requirements,
        requirements: normalizeRequirementNode({
            type: 'AND',
            label: 'Major Requirements',
            children: [
                majorData.common_requirements.prescribed_courses,
                majorData.common_requirements.additional_courses,
                majorData.common_requirements.supporting_courses
            ].filter(Boolean) // Remove undefined sections
        }),
    };
}

/**
 * Load minor requirements by minor ID.
 * @param minorId Minor identifier (e.g., "business_minor")
 * @returns Program metadata with requirements
 */
export function loadMinorRequirements(minorId: string): ProgramMetadata | null {
    const data = loadMinorsData();
    const minorData = data.minors?.[minorId];

    if (!minorData) {
        return null;
    }

    return {
        program_id: minorData.minor_id || minorId,
        name: minorData.minor_name || minorData.name,
        credits_required: minorData.total_credits_required,
        department: minorData.department,
        requirements: normalizeRequirementNode(minorData.requirements),
    };
}

/**
 * Load GenEd requirements.
 * @returns GenEd requirements as RequirementNode
 */
export function loadGenEdRequirements(): RequirementNode {
    const data = loadGenEdData();
    const genEdReqs = data.gen_ed_requirements;

    // Transform GenEd structure to RequirementNode
    return {
        type: 'AND',
        label: 'General Education Requirements',
        credits_needed: genEdReqs.total_credits,
        children: transformGenEdCategories(genEdReqs.categories),
    };
}

/**
 * Transform GenEd categories to RequirementNode structure.
 */
function transformGenEdCategories(categories: any): RequirementNode[] {
    const nodes: RequirementNode[] = [];

    for (const [categoryKey, categoryData] of Object.entries(categories)) {
        const category = categoryData as any;
        const children: RequirementNode[] = [];

        if (category.components) {
            for (const [compKey, compData] of Object.entries(category.components)) {
                const comp = compData as any;
                children.push(normalizeRequirementNode(comp));
            }
        }

        nodes.push({
            type: 'AND',
            label: category.label,
            credits_needed: category.total_credits,
            min_grade: category.min_grade,
            children,
        });
    }

    return nodes;
}

/**
 * Normalize requirement node to ensure consistent structure.
 * Handles data variations and aliases in existing JSON files.
 */
function normalizeRequirementNode(node: any): RequirementNode {
    if (!node) {
        return { type: 'AND', children: [] };
    }

    // Handle PICK_BY_ATTRIBUTE -> PICK_FROM_CATEGORY transformation
    if (node.type === 'PICK_BY_ATTRIBUTE') {
        return {
            ...node,
            type: 'PICK_FROM_CATEGORY',
            category: node.required_attributes?.[0], // Use first attribute as category
        };
    }

    // Normalize credits fields
    const creditsNeeded = node.credits_needed ?? node.credits_required;

    // Normalize course fields
    const courseId = node.course_id ?? node.course;

    // Recursively normalize children
    const children = node.children?.map((child: any) => normalizeRequirementNode(child));

    return {
        ...node,
        credits_needed: creditsNeeded,
        course_id: courseId,
        children,
    };
}

/**
 * Get all available major IDs.
 */
export function getAllMajorIds(): string[] {
    const data = loadMajorsData();
    return Object.keys(data);
}

/**
 * Get all available minor IDs.
 */
export function getAllMinorIds(): string[] {
    const data = loadMinorsData();
    return Object.keys(data.minors || {});
}

/**
 * Check if a course satisfies GenEd requirements.
 * @param courseId Course identifier
 * @param genEdCategory GenEd category (e.g., "GN", "GQ")
 * @returns True if course satisfies the category
 */
export function courseHasGenEdAttribute(courseId: string, genEdCategory: string): boolean {
    const details = getCourseDetails(courseId);
    if (!details) {
        return false;
    }

    return details.attributes?.gen_ed?.includes(genEdCategory) || false;
}

/**
 * Search for courses by department and level range.
 * @param department Department code
 * @param minLevel Minimum course level
 * @param maxLevel Maximum course level
 * @returns Array of matching course IDs
 */
export function findCoursesByDepartment(
    department: string,
    minLevel?: number,
    maxLevel?: number
): string[] {
    const db = getDb();

    // Construct query dynamically based on provided params
    let query = 'SELECT id FROM courses WHERE department = ?';
    const params: any[] = [department];

    if (minLevel !== undefined) {
        query += ' AND level >= ?';
        params.push(minLevel);
    }

    if (maxLevel !== undefined) {
        query += ' AND level <= ?';
        params.push(maxLevel);
    }

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map(row => row.id);
}

/**
 * Clear all caches (useful for testing or reloading data).
 */
export function clearCache(): void {
    majorsData = null;
    minorsData = null;
    genEdData = null;
    // We don't close the DB connection here as it might be reused, 
    // but we could if we wanted to force a full reload
}
