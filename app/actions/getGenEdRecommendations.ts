'use server'

import Database from 'better-sqlite3';
import path from 'path';
import { loadMajorRequirements, getAllMajorIds } from '@/lib/engine/loader';
import type { RequirementNode } from '@/lib/types';

/**
 * Represents a single GenEd course recommendation
 */
export interface GenEdRecommendation {
    course_code: string;
    course_name: string;
    credits: number;
    gen_ed_attributes: string[];
    is_major_course: boolean;  // True if course counts toward selected major
    score: number;             // Higher = better recommendation
}

/**
 * Result containing recommendations grouped by GenEd attribute
 */
export interface GenEdRecommendationResult {
    [attribute: string]: GenEdRecommendation[];
}

/**
 * Major metadata for dropdown display
 */
export interface MajorOption {
    id: string;
    name: string;
}

// GenEd attributes we support
const GENED_ATTRIBUTES = ['GWS', 'GQ', 'GHW', 'GN', 'GA', 'GH', 'GS', 'interdomain'];

/**
 * Extract all course IDs from a requirement tree (recursively)
 * This identifies courses that count toward a major
 */
function extractMajorCourses(node: RequirementNode, courses: Set<string> = new Set()): Set<string> {
    if (!node) return courses;

    // Extract course from various node types
    if (node.type === 'FIXED' || node.type === 'COURSE') {
        const courseId = node.course_id || (node as any).course || (node as any).courses?.[0];
        if (courseId && typeof courseId === 'string') {
            courses.add(courseId.trim().toUpperCase());
        }
    }

    // Extract from FIXED_LIST
    if (node.type === 'FIXED_LIST' && node.courses) {
        for (const course of node.courses) {
            if (typeof course === 'string') {
                courses.add(course.trim().toUpperCase());
            }
        }
    }

    // Extract from PICK_FROM_LIST valid_courses
    if (node.type === 'PICK_FROM_LIST') {
        const validCourses = (node as any).valid_courses || node.courses || [];
        for (const course of validCourses) {
            if (typeof course === 'string') {
                courses.add(course.trim().toUpperCase());
            }
        }
    }

    // Extract from OR options
    if (node.type === 'OR' && (node as any).options) {
        for (const option of (node as any).options) {
            if (typeof option === 'string') {
                courses.add(option.trim().toUpperCase());
            }
        }
    }

    // Recursively process children
    if (node.children) {
        for (const child of node.children) {
            extractMajorCourses(child, courses);
        }
    }

    return courses;
}

/**
 * Get all available majors for the dropdown
 */
export async function getAllMajors(): Promise<MajorOption[]> {
    try {
        const majorIds = getAllMajorIds();
        const majors: MajorOption[] = [];

        for (const id of majorIds) {
            const major = loadMajorRequirements(id);
            if (major) {
                majors.push({
                    id,
                    name: major.name
                });
            }
        }

        // Sort alphabetically by name
        majors.sort((a, b) => a.name.localeCompare(b.name));
        return majors;
    } catch (error) {
        console.error('Error loading majors:', error);
        return [];
    }
}

/**
 * Get smart GenEd course recommendations based on:
 * 1. Missing GenEd attributes the student needs
 * 2. Student's major (to find double-dipping opportunities)
 * 3. Courses already completed (to exclude)
 * 
 * @param missingAttributes - Array of GenEd attributes student still needs (e.g., ["GA", "GH"])
 * @param majorId - The student's major ID (e.g., "computer_science_bs")
 * @param completedCourses - Array of course codes already completed
 * @param topN - Number of recommendations per attribute (default: 5)
 */
export async function getGenEdRecommendations(
    missingAttributes: string[],
    majorId: string | null,
    completedCourses: string[] = [],
    topN: number = 5
): Promise<GenEdRecommendationResult> {
    try {
        const dbPath = path.join(process.cwd(), 'lib', 'data', 'courses.db');
        const db = new Database(dbPath, { readonly: true });

        // Build set of completed courses for quick lookup
        const completedSet = new Set(completedCourses.map(c => c.trim().toUpperCase()));

        // Extract courses from major requirements for double-dipping detection
        let majorCourses = new Set<string>();
        if (majorId) {
            const major = loadMajorRequirements(majorId);
            if (major && major.requirements) {
                majorCourses = extractMajorCourses(major.requirements);
            }
        }

        const result: GenEdRecommendationResult = {};

        // Filter to only valid attributes
        const validAttributes = missingAttributes.filter(attr => GENED_ATTRIBUTES.includes(attr));

        for (const attribute of validAttributes) {
            // Query courses that have this GenEd attribute
            // We use LIKE for JSON array matching since gen_ed_json stores as JSON string
            const query = `
                SELECT id, name, credits_min, credits_max, gen_ed_json
                FROM courses
                WHERE gen_ed_json LIKE ?
                ORDER BY level ASC, id ASC
                LIMIT 100
            `;

            // Match attribute in JSON array (e.g., contains "GA" or "GH")
            const searchPattern = `%"${attribute}"%`;

            const rows = db.prepare(query).all(searchPattern) as Array<{
                id: string;
                name: string;
                credits_min: number | null;
                credits_max: number | null;
                gen_ed_json: string;
            }>;

            const recommendations: GenEdRecommendation[] = [];

            for (const row of rows) {
                // Skip if already completed
                if (completedSet.has(row.id.toUpperCase())) {
                    continue;
                }

                // Parse GenEd attributes
                let genEdAttrs: string[] = [];
                try {
                    genEdAttrs = JSON.parse(row.gen_ed_json || '[]');
                } catch {
                    genEdAttrs = [];
                }

                // Calculate credits
                const credits = row.credits_min || 3;

                // Check if this course is in the major requirements (double-dipping!)
                const isMajorCourse = majorCourses.has(row.id.toUpperCase());

                // Calculate score:
                // - Base score: 0
                // - Major course (double-dip): +10
                // - Multi-attribute: +2 per additional GenEd attribute
                let score = 0;
                if (isMajorCourse) {
                    score += 10;
                }
                // Bonus for courses with multiple GenEd attributes
                if (genEdAttrs.length > 1) {
                    score += (genEdAttrs.length - 1) * 2;
                }

                recommendations.push({
                    course_code: row.id,
                    course_name: row.name || '',
                    credits,
                    gen_ed_attributes: genEdAttrs,
                    is_major_course: isMajorCourse,
                    score
                });
            }

            // Sort by score (descending), then by course code
            recommendations.sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score;
                }
                return a.course_code.localeCompare(b.course_code);
            });

            // Take top N
            result[attribute] = recommendations.slice(0, topN);
        }

        db.close();
        return result;
    } catch (error) {
        console.error('Error getting GenEd recommendations:', error);
        return {};
    }
}
