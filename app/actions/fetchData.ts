'use server'

import { getMajorList, getCourseList } from '@/lib/server-utils';
import { type MajorOption, type CourseOption } from '@/lib/utils';

/**
 * Get list of available majors
 */
export async function fetchMajors(): Promise<MajorOption[]> {
    return getMajorList();
}

/**
 * Get list of available courses
 */
export async function fetchCourses(): Promise<CourseOption[]> {
    return getCourseList();
}
