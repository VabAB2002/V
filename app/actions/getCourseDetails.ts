'use server'

import fs from 'fs';
import path from 'path';

export interface CourseDetails {
    course_code: string;
    course_name: string;
    credits: number | { min: number; max: number };
    credit_type: string;
    description: string;
    department: string;
    level: number;
    prerequisites: any;
}

/**
 * Fetches course details by course code from penn_state_courses.json
 */
export async function getCourseDetails(courseCode: string): Promise<CourseDetails | null> {
    try {
        const dataPath = path.join(process.cwd(), 'lib', 'data', 'penn_state_courses.json');
        const fileContents = fs.readFileSync(dataPath, 'utf8');
        const data = JSON.parse(fileContents);

        // Normalize course code (remove extra spaces)
        const normalizedCode = courseCode.trim().toUpperCase();

        // Look up in courses object
        const course = data.courses?.[normalizedCode];

        if (!course) {
            console.warn(`Course not found: ${normalizedCode}`);
            return null;
        }

        return course as CourseDetails;
    } catch (error) {
        console.error('Error fetching course details:', error);
        return null;
    }
}
