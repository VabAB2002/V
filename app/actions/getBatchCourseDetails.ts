'use server'

import fs from 'fs';
import path from 'path';
import type { CourseDetails } from './getCourseDetails';

/**
 * Fetches multiple course details in a single batch operation
 * Much more efficient than calling getCourseDetails multiple times
 */
export async function getBatchCourseDetails(
    courseCodes: string[]
): Promise<Record<string, CourseDetails>> {
    try {
        const dataPath = path.join(process.cwd(), 'lib', 'data', 'penn_state_courses.json');
        const fileContents = fs.readFileSync(dataPath, 'utf8');
        const data = JSON.parse(fileContents);

        const result: Record<string, CourseDetails> = {};

        // Normalize and look up all course codes
        for (const courseCode of courseCodes) {
            const normalizedCode = courseCode.trim().toUpperCase();
            const course = data.courses?.[normalizedCode];

            if (course) {
                result[normalizedCode] = course as CourseDetails;
            } else {
                console.warn(`Course not found in batch: ${normalizedCode}`);
            }
        }

        return result;
    } catch (error) {
        console.error('Error fetching batch course details:', error);
        return {};
    }
}
