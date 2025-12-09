// lib/rag/documentLoader.ts - Load and chunk academic data for RAG

import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';
import type { RawDocument, DocumentMetadata } from './types';

const DATA_DIR = path.join(process.cwd(), 'lib', 'data');
const DB_PATH = path.join(DATA_DIR, 'courses.db');
const MAJORS_PATH = path.join(DATA_DIR, 'penn_state_majors.json');
const MINORS_PATH = path.join(DATA_DIR, 'penn_state_minors.json');
const GENED_PATH = path.join(DATA_DIR, 'gen_ed_requirements.json');

/**
 * Load all course documents from SQLite database
 */
export async function loadCourseDocuments(): Promise<RawDocument[]> {
    const documents: RawDocument[] = [];

    try {
        const db = new Database(DB_PATH);

        // Get all courses from database
        const courses = db.prepare(`
      SELECT 
        course_id,
        title,
        description,
        credits_min,
        credits_max,
        prerequisites,
        gen_ed_attributes,
        department
      FROM courses
      LIMIT 5000
    `).all() as Array<{
            course_id: string;
            title: string;
            description: string;
            credits_min: number;
            credits_max: number;
            prerequisites: string;
            gen_ed_attributes: string;
            department: string;
        }>;

        for (const course of courses) {
            const courseId = course.course_id;
            const credits = course.credits_min === course.credits_max
                ? `${course.credits_min}`
                : `${course.credits_min}-${course.credits_max}`;

            // Parse GenEd attributes
            let genEdAttrs: string[] = [];
            if (course.gen_ed_attributes) {
                try {
                    genEdAttrs = JSON.parse(course.gen_ed_attributes);
                } catch {
                    genEdAttrs = [];
                }
            }

            // Parse prerequisites
            let prereqs = 'None';
            if (course.prerequisites) {
                try {
                    const prereqData = JSON.parse(course.prerequisites);
                    if (Array.isArray(prereqData) && prereqData.length > 0) {
                        prereqs = prereqData.join(', ');
                    }
                } catch {
                    prereqs = course.prerequisites;
                }
            }

            const content = `Course: ${courseId}
Title: ${course.title || 'No title'}
Description: ${course.description || 'No description available'}
Credits: ${credits}
Department: ${course.department || courseId.split(' ')[0]}
Prerequisites: ${prereqs}
GenEd Attributes: ${genEdAttrs.length > 0 ? genEdAttrs.join(', ') : 'None'}`;

            documents.push({
                id: `course:${courseId.replace(/\s+/g, '_')}`,
                type: 'course',
                content,
                metadata: {
                    type: 'course',
                    title: course.title || courseId,
                    content,
                    credits: course.credits_min,
                    department: course.department || courseId.split(' ')[0],
                    attributes: genEdAttrs
                }
            });
        }

        db.close();
        console.log(`Loaded ${documents.length} course documents`);
    } catch (error) {
        console.error('Error loading course documents:', error);
    }

    return documents;
}

/**
 * Extract required courses from a requirement node recursively
 */
function extractCoursesFromRequirement(node: any): string[] {
    const courses: string[] = [];

    if (node.course) courses.push(node.course);
    if (node.courses) courses.push(...node.courses);
    if (node.options) courses.push(...node.options);
    if (node.valid_courses) courses.push(...node.valid_courses.slice(0, 10)); // Limit for readability

    if (node.children) {
        for (const child of node.children) {
            courses.push(...extractCoursesFromRequirement(child));
        }
    }

    return courses;
}

/**
 * Load all minor documents from JSON
 */
export async function loadMinorDocuments(): Promise<RawDocument[]> {
    const documents: RawDocument[] = [];

    try {
        const data = JSON.parse(fs.readFileSync(MINORS_PATH, 'utf-8'));
        const minors = data.minors || data;

        for (const [minorId, minor] of Object.entries(minors) as [string, any][]) {
            const requiredCourses = extractCoursesFromRequirement(minor.requirements || {});
            const uniqueCourses = [...new Set(requiredCourses)].slice(0, 20);

            const content = `Minor: ${minor.minor_name || minorId}
Department: ${minor.department || 'Various'}
Total Credits Required: ${minor.total_credits_required || 'Varies'}
Description: ${minor.description || 'No description available'}
Key Courses: ${uniqueCourses.length > 0 ? uniqueCourses.join(', ') : 'See requirements'}`;

            documents.push({
                id: `minor:${minorId}`,
                type: 'minor',
                content,
                metadata: {
                    type: 'minor',
                    title: minor.minor_name || minorId,
                    content,
                    credits: minor.total_credits_required,
                    department: minor.department,
                    programId: minorId
                }
            });
        }

        console.log(`Loaded ${documents.length} minor documents`);
    } catch (error) {
        console.error('Error loading minor documents:', error);
    }

    return documents;
}

/**
 * Load all major documents from JSON
 */
export async function loadMajorDocuments(): Promise<RawDocument[]> {
    const documents: RawDocument[] = [];

    try {
        const data = JSON.parse(fs.readFileSync(MAJORS_PATH, 'utf-8'));

        for (const [majorId, major] of Object.entries(data) as [string, any][]) {
            // Extract courses from common requirements
            const commonReqs = major.common_requirements || {};
            const allCourses: string[] = [];

            for (const section of Object.values(commonReqs) as any[]) {
                allCourses.push(...extractCoursesFromRequirement(section));
            }

            const uniqueCourses = [...new Set(allCourses)].slice(0, 25);

            // Build sub-plans info if available
            let subPlansInfo = '';
            if (major.sub_plans?.options) {
                const optionNames = Object.values(major.sub_plans.options)
                    .map((opt: any) => opt.name)
                    .join(', ');
                subPlansInfo = `\nSpecializations: ${optionNames}`;
            }

            const content = `Major: ${major.name || majorId}
Degree Type: ${major.degree_type || 'Bachelor\'s'}
Department: ${major.department || 'Various'}
Total Credits Required: ${major.credits_required || 120}${subPlansInfo}
Key Courses: ${uniqueCourses.length > 0 ? uniqueCourses.join(', ') : 'See requirements'}`;

            documents.push({
                id: `major:${majorId}`,
                type: 'major',
                content,
                metadata: {
                    type: 'major',
                    title: major.name || majorId,
                    content,
                    credits: major.credits_required,
                    department: major.department,
                    programId: majorId
                }
            });
        }

        console.log(`Loaded ${documents.length} major documents`);
    } catch (error) {
        console.error('Error loading major documents:', error);
    }

    return documents;
}

/**
 * Load GenEd requirement documents from JSON
 */
export async function loadGenEdDocuments(): Promise<RawDocument[]> {
    const documents: RawDocument[] = [];

    try {
        const data = JSON.parse(fs.readFileSync(GENED_PATH, 'utf-8'));
        const genEdReqs = data.gen_ed_requirements;

        // Overall GenEd overview
        documents.push({
            id: 'gened:overview',
            type: 'gened',
            content: `Penn State General Education Requirements
Total Credits: ${genEdReqs.total_credits || 45}
Description: ${genEdReqs.description || 'General education requirements for all Penn State students'}

Categories:
- Foundations (Writing/Speaking, Quantification): 15 credits
- Knowledge Domains (Health/Wellness, Sciences, Arts, Humanities, Social Sciences): 15 credits
- Integrative Studies (Inter-domain courses): 6 credits
- Exploration (Additional breadth): 9 credits

Notes:
- ${genEdReqs.rules?.overlap_note || 'Some courses may count toward both GenEd and major requirements'}
- Foundations courses require a grade of C or better`,
            metadata: {
                type: 'gened',
                title: 'General Education Overview',
                content: 'Overview of Penn State General Education Requirements'
            }
        });

        // Individual categories
        const categories = genEdReqs.categories || {};
        const attrDefs = genEdReqs.attribute_definitions || {};

        for (const [catKey, category] of Object.entries(categories) as [string, any][]) {
            const components = category.components || {};
            const componentList = Object.entries(components)
                .map(([, comp]: [string, any]) => `- ${comp.label}: ${comp.credits_needed} credits`)
                .join('\n');

            const content = `GenEd Category: ${category.label}
Total Credits for Category: ${category.total_credits}
${category.note ? `Note: ${category.note}` : ''}

Components:
${componentList}`;

            documents.push({
                id: `gened:${catKey}`,
                type: 'gened',
                content,
                metadata: {
                    type: 'gened',
                    title: category.label,
                    content,
                    credits: category.total_credits
                }
            });
        }

        // Attribute definitions
        const attrContent = Object.entries(attrDefs)
            .map(([code, desc]) => `- ${code}: ${desc}`)
            .join('\n');

        documents.push({
            id: 'gened:attributes',
            type: 'gened',
            content: `GenEd Attribute Codes and Meanings:
${attrContent}

These attributes appear on courses in the Penn State course catalog. A course with "GN" for example satisfies part of the Natural Sciences requirement. Some courses have multiple attributes and can satisfy multiple requirements ("double dipping" or "triple dipping").`,
            metadata: {
                type: 'gened',
                title: 'GenEd Attribute Codes',
                content: 'Explanation of GenEd attribute codes'
            }
        });

        console.log(`Loaded ${documents.length} GenEd documents`);
    } catch (error) {
        console.error('Error loading GenEd documents:', error);
    }

    return documents;
}

/**
 * Load all documents for RAG initialization
 */
export async function loadAllDocuments(): Promise<RawDocument[]> {
    console.log('Loading all documents for RAG...');

    const [courses, minors, majors, genEd] = await Promise.all([
        loadCourseDocuments(),
        loadMinorDocuments(),
        loadMajorDocuments(),
        loadGenEdDocuments()
    ]);

    const allDocs = [...courses, ...minors, ...majors, ...genEd];
    console.log(`Total documents loaded: ${allDocs.length}`);

    return allDocs;
}
