'use server'

import Database from 'better-sqlite3';
import path from 'path';
import type { CourseDetails } from './getCourseDetails';

// Batch fetch course details from SQLite (more efficient than individual calls)
export async function getBatchCourseDetails(
    courseCodes: string[]
): Promise<Record<string, CourseDetails>> {
    try {
        const dbPath = path.join(process.cwd(), 'lib', 'data', 'courses.db');
        const db = new Database(dbPath, { readonly: true });

        const result: Record<string, CourseDetails> = {};

        // Create placeholders for SQL query
        const placeholders = courseCodes.map(() => '?').join(',');
        const normalizedCodes = courseCodes.map(c => c.trim().toUpperCase());

        if (normalizedCodes.length === 0) {
            db.close();
            return result;
        }

        const query = `
            SELECT id, name, credits_min, credits_max, department, level, gen_ed_json, raw_json
            FROM courses
            WHERE id IN (${placeholders})
        `;

        const rows = db.prepare(query).all(...normalizedCodes) as Array<{
            id: string;
            name: string;
            credits_min: number | null;
            credits_max: number | null;
            department: string;
            level: number;
            gen_ed_json: string;
            raw_json: string;
        }>;

        for (const row of rows) {
            try {
                const rawData = JSON.parse(row.raw_json || '{}');
                const genEd = JSON.parse(row.gen_ed_json || '[]');

                // Handle credits
                let credits: number | { min: number; max: number } = 3;
                if (row.credits_min !== null && row.credits_max !== null) {
                    if (row.credits_min === row.credits_max) {
                        credits = row.credits_min;
                    } else {
                        credits = { min: row.credits_min, max: row.credits_max };
                    }
                } else if (row.credits_min !== null) {
                    credits = row.credits_min;
                }

                result[row.id] = {
                    course_code: row.id,
                    course_name: row.name || rawData.course_name || rawData.name || '',
                    credits,
                    credit_type: rawData.credit_type || 'standard',
                    description: rawData.description || '',
                    department: rawData.department || row.id.split(' ')[0],
                    level: rawData.level || parseInt(row.id.split(' ')[1]) || 100,
                    prerequisites: rawData.prerequisites || null,
                    attributes: {
                        gen_ed: genEd,
                        writing: rawData.attributes?.writing || false,
                        cultural_diversity: rawData.attributes?.cultural_diversity || []
                    }
                };
            } catch (parseError) {
                console.warn(`Error parsing course data for ${row.id}:`, parseError);
            }
        }

        db.close();
        // Debug log
        console.log('[getBatchCourseDetails] Returning courses:', Object.keys(result), 'First course attributes:', result[Object.keys(result)[0]]?.attributes);
        return result;
    } catch (error) {
        console.error('Error fetching batch course details:', error);
        return {};
    }
}
