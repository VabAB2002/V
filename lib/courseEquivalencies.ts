/**
 * Course equivalency mappings for client-side use.
 * This mirrors the data in lib/data/course_equivalencies.json
 * 
 * When checking if a course is completed, we need to check both:
 * 1. The exact course code
 * 2. Any equivalent courses
 * 
 * IMPORTANT: Keep this in sync with lib/data/course_equivalencies.json
 */

export const COURSE_EQUIVALENCIES: Record<string, string[]> = {
    // CMPSC 121/122 (C++/legacy) ↔ CMPSC 131/132 (Python/modern)
    "CMPSC 121": ["CMPSC 131"],
    "CMPSC 122": ["CMPSC 132"],
    "CMPSC 131": ["CMPSC 121"],
    "CMPSC 132": ["CMPSC 122"],
    // STAT 318 ↔ STAT 414
    "STAT 318": ["STAT 414"],
    "STAT 414": ["STAT 318"],
};

/**
 * Get equivalent courses for a given course code.
 * @param courseCode Course identifier (e.g., "CMPSC 121")
 * @returns Array of equivalent course codes
 */
export function getEquivalentCourses(courseCode: string): string[] {
    const normalized = courseCode.trim().toUpperCase();
    return COURSE_EQUIVALENCIES[normalized] || [];
}

/**
 * Check if a required course is satisfied by the selected courses.
 * This checks both the exact course AND any equivalent courses.
 * 
 * @param requiredCourse The course that is required (e.g., "CMPSC 121")
 * @param selectedCourses Array of courses the student has completed
 * @returns true if the requirement is satisfied
 */
export function isCourseCompleted(requiredCourse: string, selectedCourses: string[]): boolean {
    const requiredNormalized = requiredCourse.trim().toUpperCase();
    const selectedNormalized = selectedCourses.map(c => c.trim().toUpperCase());

    // Check exact match
    if (selectedNormalized.includes(requiredNormalized)) {
        return true;
    }

    // Check equivalent courses
    const equivalents = getEquivalentCourses(requiredNormalized);
    return equivalents.some(eq => selectedNormalized.includes(eq.toUpperCase()));
}
