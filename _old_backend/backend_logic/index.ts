// index.ts - Professional Entry Point for Degree Audit Engine

import {
    CompletedCourse,
    AuditResult,
    Transcript,
    MinorRecommendation,
    GenEdOverlap,
    RequirementNode,
} from './types';
import {
    loadMajorRequirements,
    loadMinorRequirements,
    loadGenEdRequirements,
    getAllMinorIds,
    getCourseDetails,
    courseHasGenEdAttribute,
} from './engine/loader';
import { auditRequirement } from './engine/evaluator';

/**
 * Audit a student's progress toward a major.
 * 
 * @param transcript Student's completed courses
 * @param majorId Major identifier (e.g., "accounting_bs")
 * @returns Detailed audit result
 * 
 * @example
 * ```typescript
 * const transcript = [
 *   { id: "ACCTG 211", grade: "B", credits_awarded: 4 },
 *   { id: "ECON 102", grade: "A", credits_awarded: 3 }
 * ];
 * const result = auditMajor(transcript, "accounting_bs");
 * console.log(result.status); // "PARTIAL", "MET", or "MISSING"
 * console.log(result.credits_earned, "/", result.credits_required);
 * ```
 */
export function auditMajor(
    transcript: CompletedCourse[],
    majorId: string
): AuditResult {
    const major = loadMajorRequirements(majorId);

    if (!major) {
        return {
            status: 'MISSING',
            credits_earned: 0,
            credits_required: 0,
            fulfilled_by: [],
            missing_reason: `Major "${majorId}" not found`,
        };
    }

    const usedCourses = new Set<string>();
    const result = auditRequirement(major.requirements, transcript, usedCourses);

    return {
        ...result,
        label: `${major.name} - Major Requirements`,
    };
}

/**
 * Audit a student's progress toward a minor.
 * 
 * @param transcript Student's completed courses
 * @param minorId Minor identifier (e.g., "business_minor")
 * @returns Detailed audit result
 * 
 * @example
 * ```typescript
 * const result = auditMinor(transcript, "business_minor");
 * ```
 */
export function auditMinor(
    transcript: CompletedCourse[],
    minorId: string
): AuditResult {
    const minor = loadMinorRequirements(minorId);

    if (!minor) {
        return {
            status: 'MISSING',
            credits_earned: 0,
            credits_required: 0,
            fulfilled_by: [],
            missing_reason: `Minor "${minorId}" not found`,
        };
    }

    const usedCourses = new Set<string>();
    const result = auditRequirement(minor.requirements, transcript, usedCourses);

    return {
        ...result,
        label: `${minor.name} - Minor Requirements`,
    };
}

/**
 * Audit a student's General Education requirement progress.
 * 
 * @param transcript Student's completed courses
 * @returns Detailed audit result for GenEd requirements
 * 
 * @example
 * ```typescript
 * const result = auditGenEd(transcript);
 * console.log(result.children_results); // Results for each GenEd category
 * ```
 */
export function auditGenEd(
    transcript: CompletedCourse[]
): AuditResult {
    const genEdRequirements = loadGenEdRequirements();
    const usedCourses = new Set<string>();

    return auditRequirement(genEdRequirements, transcript, usedCourses);
}

/**
 * Find GenEd courses in the transcript that could satisfy minor requirements.
 * This helps identify courses that can "double count" for both GenEd and a minor.
 * 
 * @param transcript Student's completed courses
 * @param minorId Minor identifier
 * @returns List of courses that satisfy both GenEd and minor requirements
 */
export function findGenEdOverlaps(
    transcript: CompletedCourse[],
    minorId: string
): GenEdOverlap[] {
    const overlaps: GenEdOverlap[] = [];
    const minor = loadMinorRequirements(minorId);

    if (!minor) {
        return overlaps;
    }

    // Get all courses used in the minor
    const usedInMinor = new Set<string>();
    auditRequirement(minor.requirements, transcript, usedInMinor);

    for (const course of transcript) {
        const details = getCourseDetails(course.id);
        if (!details) continue;

        const genEdCategories = details.attributes?.gen_ed || [];

        if (genEdCategories.length > 0 && usedInMinor.has(course.id)) {
            overlaps.push({
                course_id: course.id,
                gen_ed_categories: genEdCategories,
                credits: course.credits_awarded,
            });
        }
    }

    return overlaps;
}

/**
 * Extract all required course IDs from a requirement tree.
 * This recursively walks the tree to find all FIXED and FIXED_LIST courses.
 */
function extractRequiredCourses(node: RequirementNode): string[] {
    const courses: string[] = [];

    if (node.type === 'FIXED' || node.type === 'COURSE') {
        const courseId = node.course_id || node.course || node.courses?.[0];
        if (courseId) courses.push(courseId);
    } else if (node.type === 'FIXED_LIST') {
        if (node.courses) {
            courses.push(...node.courses);
        }
    }

    // Recursively process children
    if (node.children) {
        for (const child of node.children) {
            courses.push(...extractRequiredCourses(child));
        }
    }

    return courses;
}

/**
 * Recommend minors based on the student's transcript and remaining GenEd requirements.
 * This is the core recommendation engine that suggests the best minors to pursue.
 * 
 * **Smart Feature:** Automatically includes courses from your major's academic plan
 * when calculating minor gaps, showing you the TRUE additional work needed beyond your major.
 * 
 * **Works for ANY major** - Accounting, Business, Computer Science, Engineering, etc.
 * Just pass the student's major ID and the engine handles the rest!
 * 
 * Strategy:
 * 1. Load student's major requirements to identify planned courses
 * 2. Audit all available minors (including planned major courses)
 * 3. Calculate gap (credits needed BEYOND your major)
 * 4. Identify GenEd overlaps
 * 5. Rank by: completion %, gap credits, and GenEd synergy
 * 
 * @param transcript Student's completed courses
 * @param majorId Student's major ID (REQUIRED) - e.g., 'accounting_bs', 'computer_science_bs'
 * @param options Additional recommendation options
 * @returns Ranked list of minor recommendations
 * 
 * @example
 * ```typescript
 * // Works for ANY major!
 * const recs = recommendMinors(transcript, 'accounting_bs', { topN: 5 });
 * const recs2 = recommendMinors(transcript, 'business_bs', { topN: 5 });
 * const recs3 = recommendMinors(transcript, 'computer_science_bs', { topN: 5 });
 * 
 * for (const rec of recs) {
 *   console.log(`${rec.minor_name}: ${rec.gap_credits} credits needed`);
 *   console.log(`  (beyond your major requirements)`);
 * }
 * ```
 */
export function recommendMinors(
    transcript: CompletedCourse[],
    majorId: string,  // ⭐ NOW REQUIRED for accurate gap calculation
    options: {
        topN?: number;           // Return top N recommendations (default: 10)
        minCompletion?: number;  // Minimum completion % to include (default: 0)
        maxGap?: number;         // Maximum gap credits to include (default: Infinity)
    } = {}
): MinorRecommendation[] {
    const { topN = 10, minCompletion = 0, maxGap = Infinity } = options;

    // Augment transcript with planned major courses
    let augmentedTranscript = [...transcript];
    let plannedCourses: string[] = [];

    const major = loadMajorRequirements(majorId);
    if (major) {
        // Extract all required courses from major
        const majorCourses = extractRequiredCourses(major.requirements);

        // Find courses that are required by major but not yet completed
        plannedCourses = majorCourses.filter(
            courseId => !transcript.some(c => c.id === courseId)
        );

        // Add planned courses to transcript with placeholder grades
        for (const courseId of plannedCourses) {
            const details = getCourseDetails(courseId);
            let credits = 3; // Default
            if (details) {
                if (typeof details.credits === 'number') {
                    credits = details.credits;
                } else if (details.credits && typeof details.credits === 'object') {
                    credits = details.credits.min;
                }
            }

            augmentedTranscript.push({
                id: courseId,
                grade: 'B', // Placeholder grade (will pass min requirements)
                credits_awarded: credits,
            });
        }
    }

    const allMinorIds = getAllMinorIds();
    const recommendations: MinorRecommendation[] = [];

    for (const minorId of allMinorIds) {
        const minor = loadMinorRequirements(minorId);
        if (!minor) continue;

        // Audit the minor using augmented transcript (includes planned major courses)
        const usedCourses = new Set<string>();
        const auditResult = auditRequirement(minor.requirements, augmentedTranscript, usedCourses);

        const completedCredits = auditResult.credits_earned;
        const totalCredits = minor.credits_required;
        const gapCredits = Math.max(0, totalCredits - completedCredits);
        const completionPercentage = (completedCredits / totalCredits) * 100;

        // Filter by criteria
        if (completionPercentage < minCompletion) continue;
        if (gapCredits > maxGap) continue;

        // Find GenEd overlaps
        const genEdOverlaps = findGenEdOverlaps(augmentedTranscript, minorId);

        // Calculate strategic score
        // Higher score = better recommendation
        // Factors: completion %, GenEd synergy, inverse of gap
        const strategicScore = calculateStrategicScore(
            completionPercentage,
            gapCredits,
            genEdOverlaps.length,
            totalCredits
        );

        // Find missing courses
        const missingCourses = extractMissingCourses(auditResult);

        recommendations.push({
            minor_id: minorId,
            minor_name: minor.name,
            gap_credits: gapCredits,
            completed_credits: completedCredits,
            total_credits_required: totalCredits,
            completion_percentage: completionPercentage,
            gen_ed_overlap: genEdOverlaps,
            strategic_score: strategicScore,
            missing_courses: missingCourses,
            audit_result: auditResult,
        });
    }

    // Sort by strategic score (descending)
    recommendations.sort((a, b) => b.strategic_score - a.strategic_score);

    // Return top N
    return recommendations.slice(0, topN);
}

/**
 * Calculate a strategic score for ranking minors.
 * Higher score = better recommendation.
 */
function calculateStrategicScore(
    completionPercentage: number,
    gapCredits: number,
    genEdOverlapCount: number,
    totalCredits: number
): number {
    // Normalize factors to 0-100 scale
    const completionScore = completionPercentage; // Already 0-100

    // Gap score: fewer credits needed = higher score (inverse relationship)
    // Max gap assumed to be total credits (0% completion)
    const gapScore = Math.max(0, 100 - (gapCredits / totalCredits) * 100);

    // GenEd synergy score: more overlaps = higher score
    // Assume max 5 overlaps for normalization
    const genEdScore = Math.min(100, (genEdOverlapCount / 5) * 100);

    // Weighted combination
    // - 50% weight on completion percentage
    // - 30% weight on gap (fewer credits needed)
    // - 20% weight on GenEd synergy
    return (
        completionScore * 0.5 +
        gapScore * 0.3 +
        genEdScore * 0.2
    );
}

/**
 * Extract missing course suggestions from audit result.
 */
function extractMissingCourses(result: AuditResult): string[] {
    const missing: string[] = [];

    if (result.status === 'MET') {
        return missing;
    }

    // Extract from missing_reason if it contains course IDs
    if (result.missing_reason) {
        // Simple heuristic: look for patterns like "Need COURSE 123"
        const coursePattern = /[A-Z]{2,6}\s+\d{1,3}[A-Z]?/g;
        const matches = result.missing_reason.match(coursePattern);
        if (matches) {
            missing.push(...matches);
        }
    }

    // Recursively check children
    if (result.children_results) {
        for (const child of result.children_results) {
            missing.push(...extractMissingCourses(child));
        }
    }

    // Remove duplicates
    return Array.from(new Set(missing));
}

/**
 * Get a comprehensive degree audit report.
 * Audits major, all recommended minors, and GenEd requirements.
 * 
 * @param transcript Student's completed courses
 * @param majorId Major identifier
 * @returns Comprehensive audit report
 */
export function getComprehensiveAudit(
    transcript: CompletedCourse[],
    majorId: string
): {
    major: AuditResult;
    genEd: AuditResult;
    recommendedMinors: MinorRecommendation[];
    summary: {
        total_credits_completed: number;
        major_completion_percentage: number;
        gen_ed_completion_percentage: number;
    };
} {
    const majorAudit = auditMajor(transcript, majorId);
    const genEdAudit = auditGenEd(transcript);
    const recommendations = recommendMinors(transcript, majorId, { topN: 5 });

    const totalCreditsCompleted = transcript.reduce(
        (sum, course) => sum + course.credits_awarded,
        0
    );

    const majorCompletionPercentage =
        (majorAudit.credits_earned / majorAudit.credits_required) * 100;

    const genEdCompletionPercentage =
        (genEdAudit.credits_earned / genEdAudit.credits_required) * 100;

    return {
        major: majorAudit,
        genEd: genEdAudit,
        recommendedMinors: recommendations,
        summary: {
            total_credits_completed: totalCreditsCompleted,
            major_completion_percentage: majorCompletionPercentage,
            gen_ed_completion_percentage: genEdCompletionPercentage,
        },
    };
}

// Export all types for external use
export * from './types';

// Re-export commonly used loader functions
export { getCourseDetails } from './engine/loader';

