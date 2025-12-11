// Course equivalency mappings (mirrors lib/data/course_equivalencies.json)

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

// Get equivalent courses for a course code
export function getEquivalentCourses(courseCode: string): string[] {
    const normalized = courseCode.trim().toUpperCase();
    return COURSE_EQUIVALENCIES[normalized] || [];
}

// Check if a required course is satisfied (exact match or equivalent)
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
