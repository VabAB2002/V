import fs from 'fs'
import path from 'path'
import { type MajorOption, type CourseOption } from './utils'



/**
 * Server-side utility to extract a simplified list of majors
 * Returns an array of {id, name} objects from penn_state_majors.json
 */
export function getMajorList(): MajorOption[] {
    const filePath = path.join(process.cwd(), 'lib', 'data', 'penn_state_majors.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const majorsData = JSON.parse(fileContents);

    return Object.entries(majorsData).map(([id, data]: [string, any]) => ({
        id,
        name: data.name
    }));
}

export function getCourseList(): CourseOption[] {
    const filePath = path.join(process.cwd(), 'lib', 'data', 'penn_state_courses.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const coursesData = JSON.parse(fileContents);

    return Object.entries(coursesData.courses).map(([code, data]: [string, any]) => ({
        code: code,
        name: data.course_name
    }));
}
