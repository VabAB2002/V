'use server'

import { getMajorList, getCourseList, type MajorOption, type CourseOption } from '@/lib/utils';

/**
 * Server action to fetch the list of all available majors
 * Returns simplified {id, name} objects for autocomplete
 */
export async function fetchMajors(): Promise<MajorOption[]> {
    return getMajorList();
}

/**
 * Server action to fetch the list of all available courses
 * Returns simplified {code, name} objects for autocomplete
 */
export async function fetchCourses(): Promise<CourseOption[]> {
    return getCourseList();
}