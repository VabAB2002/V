'use server'

import { auditRequirement } from '@/lib/engine/evaluator';
import { loadMajorRequirements, loadMinorRequirements, getAllMinorIds, getCourseDetails } from '@/lib/engine/loader';
import type { CompletedCourse, RequirementNode } from '@/lib/types';
import type { ParsedCourse } from './parseTranscript';

export interface CourseSection {
    section_name: string;           // e.g., "Prescribed Courses"
    credits_needed: number;          // Total credits required for this section
    credits_completed: number;       // Credits already completed in this section
    completed_courses: string[];     // Courses completed in this section
    needed_courses: string[];        // Courses still needed in this section
}

export interface MinorRecommendation {
    minor_id: string;
    minor_name: string;
    gap_credits: number;
    completed_credits: number;
    total_credits_required: number;
    completion_percentage: number;
    strategic_score: number;
    missing_courses: string[];

    // Structured by sections
    sections: CourseSection[];

    // Legacy flat arrays (kept for backwards compatibility)
    completed_courses: string[]; // Courses already completed
    needed_courses: string[]; // Courses still needed
}

// Grab course IDs from requirement tree
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

    if (node.children) {
        for (const child of node.children) {
            courses.push(...extractRequiredCourses(child));
        }
    }

    return courses;
}

// Score for ranking minors
function calculateStrategicScore(
    completionPercentage: number,
    gapCredits: number,
    totalCredits: number
): number {
    const completionScore = completionPercentage;
    const gapScore = Math.max(0, 100 - (gapCredits / totalCredits) * 100);

    return completionScore * 0.7 + gapScore * 0.3;
}

// Get top N minor recommendations based on completed courses and major
export async function getMinorRecommendations(
    parsedCourses: ParsedCourse[],
    majorId: string,
    topN: number = 6
): Promise<MinorRecommendation[]> {
    // Convert ParsedCourse[] to CompletedCourse[] format
    const transcript: CompletedCourse[] = parsedCourses
        .filter(c => c.status === 'completed' || c.status === 'transfer')
        .map(course => ({
            id: course.code,
            grade: course.grade,
            credits_awarded: course.earnedCredits
        }));

    // Augment transcript with planned major courses
    let augmentedTranscript = [...transcript];
    const major = loadMajorRequirements(majorId);

    if (major) {
        const majorCourses = extractRequiredCourses(major.requirements);
        const plannedCourses = majorCourses.filter(
            courseId => !transcript.some(c => c.id === courseId)
        );

        for (const courseId of plannedCourses) {
            const details = getCourseDetails(courseId);
            let credits = 3;
            if (details) {
                if (typeof details.credits === 'number') {
                    credits = details.credits;
                } else if (details.credits && typeof details.credits === 'object') {
                    credits = details.credits.min;
                }
            }

            augmentedTranscript.push({
                id: courseId,
                grade: 'B',
                credits_awarded: credits,
            });
        }
    }

    const allMinorIds = getAllMinorIds();
    const recommendations: MinorRecommendation[] = [];

    for (const minorId of allMinorIds) {
        const minor = loadMinorRequirements(minorId);
        if (!minor) continue;

        const usedCourses = new Set<string>();
        const auditResult = auditRequirement(minor.requirements, augmentedTranscript, usedCourses);

        const completedCredits = auditResult.credits_earned;
        const totalCredits = minor.credits_required;
        const gapCredits = Math.max(0, totalCredits - completedCredits);
        const completionPercentage = (completedCredits / totalCredits) * 100;

        const strategicScore = calculateStrategicScore(completionPercentage, gapCredits, totalCredits);

        // Extract completed courses (courses that were used from transcript)
        const completedCourses = Array.from(usedCourses);

        // Extract needed courses - only from requirements that are NOT MET
        const neededCourses = extractNeededCoursesFromAudit(
            auditResult,
            minor.requirements,
            transcript
        );

        // Extract courses grouped by sections
        const sections = extractCoursesWithSections(
            auditResult,
            minor.requirements,
            transcript,
            usedCourses
        );


        recommendations.push({
            minor_id: minorId,
            minor_name: minor.name,
            gap_credits: gapCredits,
            completed_credits: completedCredits,
            total_credits_required: totalCredits,
            completion_percentage: Math.round(completionPercentage * 10) / 10,
            strategic_score: Math.round(strategicScore * 10) / 10,
            missing_courses: [], // Keep for compatibility
            sections: sections,
            completed_courses: completedCourses,
            needed_courses: neededCourses
        });
    }

    // Sort by strategic score descending
    recommendations.sort((a, b) => b.strategic_score - a.strategic_score);

    return recommendations.slice(0, topN);
}

// Extract courses grouped by sections
function extractCoursesWithSections(
    auditResult: any,
    requirements: RequirementNode,
    transcript: CompletedCourse[],
    usedCourses: Set<string>
): CourseSection[] {
    const sections: CourseSection[] = [];
    const completedIds = new Set(transcript.map(c => c.id));

    // Process top-level sections (children of root AND node)
    if (requirements.type === 'AND' && requirements.children && auditResult.children_results) {
        for (let i = 0; i < requirements.children.length; i++) {
            const sectionNode = requirements.children[i];
            const sectionAudit = auditResult.children_results[i];

            // Each top-level child is typically a section with a label
            const sectionName = sectionNode.label || `Section ${i + 1}`;
            const sectionCredits = (sectionNode as any).total_credits || sectionNode.credits_needed || 0;

            // Extract courses from this section
            const sectionCompleted: string[] = [];
            const sectionNeeded: string[] = [];

            function traverseSection(auditNode: any, reqNode: RequirementNode) {
                if (!auditNode || !reqNode) return;

                // Check if fully satisfied
                const isFullySatisfied = auditNode.status === 'MET' &&
                    (reqNode.type !== 'OR' || auditNode.credits_earned >= auditNode.credits_required);

                // For completed courses, check if any courses in fulfilled_by belong to this section
                if (auditNode.fulfilled_by && Array.isArray(auditNode.fulfilled_by)) {
                    for (const courseId of auditNode.fulfilled_by) {
                        if (usedCourses.has(courseId) && !sectionCompleted.includes(courseId)) {
                            sectionCompleted.push(courseId);
                        }
                    }
                }

                // If not fully satisfied, extract needed courses
                if (!isFullySatisfied) {
                    // Special handling for OR nodes - only extract from best child
                    if (reqNode.type === 'OR' && auditNode.children_results && reqNode.children) {
                        let bestIndex = 0;
                        let bestCredits = auditNode.children_results[0]?.credits_earned || 0;

                        for (let i = 1; i < auditNode.children_results.length; i++) {
                            const credits = auditNode.children_results[i]?.credits_earned || 0;
                            if (credits > bestCredits) {
                                bestCredits = credits;
                                bestIndex = i;
                            }
                        }

                        traverseSection(auditNode.children_results[bestIndex], reqNode.children[bestIndex]);
                        return;
                    }

                    // Extract courses based on node type
                    if (reqNode.type === 'FIXED') {
                        const courseId = reqNode.course_id || reqNode.course || reqNode.courses?.[0];
                        if (courseId && !completedIds.has(courseId) && !sectionNeeded.includes(courseId)) {
                            sectionNeeded.push(courseId);
                        }
                    }

                    if (reqNode.type === 'FIXED_LIST' && reqNode.courses) {
                        for (const courseId of reqNode.courses) {
                            if (!completedIds.has(courseId) && !sectionNeeded.includes(courseId)) {
                                sectionNeeded.push(courseId);
                            }
                        }
                    }

                    if (reqNode.type === 'PICK_FROM_LIST') {
                        const validCourses = (reqNode as any).valid_courses || reqNode.courses || [];
                        for (const courseId of validCourses) {
                            if (!completedIds.has(courseId) && !sectionNeeded.includes(courseId)) {
                                sectionNeeded.push(courseId);
                            }
                        }
                    }

                    if (reqNode.type === 'OR') {
                        const options = (reqNode as any).options || [];
                        for (const option of options) {
                            if (typeof option === 'string' && !completedIds.has(option) && !sectionNeeded.includes(option)) {
                                sectionNeeded.push(option);
                            }
                        }
                    }

                    if (reqNode.type === 'PICK_FROM_DEPT') {
                        const depts = (reqNode as any).valid_departments || [];
                        const levelMin = (reqNode as any).level_min;
                        const levelMax = (reqNode as any).level_max;

                        if (depts.length > 0) {
                            const deptStr = depts.join('/');
                            const levelStr = levelMin ? `${levelMin}-${levelMax || levelMin + 99}` : '';
                            const deptCourse = `${deptStr} ${levelStr} (Choose from department)`;
                            if (!sectionNeeded.includes(deptCourse)) {
                                sectionNeeded.push(deptCourse);
                            }
                        }
                    }
                }

                // Traverse children
                if (auditNode.children_results && reqNode.children && reqNode.type !== 'OR') {
                    for (let i = 0; i < reqNode.children.length; i++) {
                        const childReq = reqNode.children[i];
                        const childAudit = auditNode.children_results[i];
                        traverseSection(childAudit, childReq);
                    }
                }
            }

            // Start traversal for this section
            traverseSection(sectionAudit, sectionNode);

            // Count credits done in this section
            let creditsCompleted = 0;
            for (const courseId of sectionCompleted) {
                const course = transcript.find(c => c.id === courseId);
                if (course) {
                    creditsCompleted += course.credits_awarded || 0;
                }
            }

            // Add section to results
            sections.push({
                section_name: sectionName,
                credits_needed: sectionCredits,
                credits_completed: creditsCompleted,
                completed_courses: sectionCompleted,
                needed_courses: sectionNeeded
            });
        }
    }

    return sections;
}

// Extract needed courses from audit results (PARTIAL or MISSING only)
function extractNeededCoursesFromAudit(
    auditResult: any,
    requirements: RequirementNode,
    transcript: CompletedCourse[]
): string[] {
    const needed: string[] = [];
    const completedIds = new Set(transcript.map(c => c.id));

    function traverseAudit(auditNode: any, reqNode: RequirementNode) {
        if (!auditNode || !reqNode) return;

        // Only skip if fully satisfied (for OR nodes, check credits too)
        const isFullySatisfied = auditNode.status === 'MET' &&
            (reqNode.type !== 'OR' || auditNode.credits_earned >= auditNode.credits_required);

        if (isFullySatisfied) {
            return; // Skip this entire branch
        }

        // Special handling for OR nodes - only extract from the best child
        if (reqNode.type === 'OR' && auditNode.children_results && reqNode.children) {
            // Find the best child (highest credits_earned)
            let bestIndex = 0;
            let bestCredits = auditNode.children_results[0]?.credits_earned || 0;

            for (let i = 1; i < auditNode.children_results.length; i++) {
                const credits = auditNode.children_results[i]?.credits_earned || 0;
                if (credits > bestCredits) {
                    bestCredits = credits;
                    bestIndex = i;
                }
            }

            // Only traverse the best child
            traverseAudit(auditNode.children_results[bestIndex], reqNode.children[bestIndex]);
            return;
        }

        // Extract from this node based on type
        if (reqNode.type === 'FIXED') {
            const courseId = reqNode.course_id || reqNode.course || reqNode.courses?.[0];
            if (courseId && !completedIds.has(courseId)) {
                needed.push(courseId);
            }
        }

        if (reqNode.type === 'FIXED_LIST' && reqNode.courses) {
            for (const courseId of reqNode.courses) {
                if (!completedIds.has(courseId)) {
                    needed.push(courseId);
                }
            }
        }

        if (reqNode.type === 'PICK_FROM_LIST') {
            const validCourses = (reqNode as any).valid_courses || reqNode.courses || [];
            for (const courseId of validCourses) {
                if (!completedIds.has(courseId)) {
                    needed.push(courseId);
                }
            }
        }

        if (reqNode.type === 'OR') {
            const options = (reqNode as any).options || [];
            for (const option of options) {
                if (typeof option === 'string' && !completedIds.has(option)) {
                    needed.push(option);
                }
            }
        }

        if (reqNode.type === 'PICK_FROM_DEPT') {
            const depts = (reqNode as any).valid_departments || [];
            const levelMin = (reqNode as any).level_min;
            const levelMax = (reqNode as any).level_max;

            if (depts.length > 0) {
                const deptStr = depts.join('/');
                const levelStr = levelMin ? `${levelMin}-${levelMax || levelMin + 99}` : '';
                needed.push(`${deptStr} ${levelStr} (Choose from department)`);
            }
        }

        // Traverse children with matching audit children (for non-OR nodes)
        if (auditNode.children_results && reqNode.children && reqNode.type !== 'OR') {
            for (let i = 0; i < reqNode.children.length; i++) {
                const childReq = reqNode.children[i];
                const childAudit = auditNode.children_results[i];
                traverseAudit(childAudit, childReq);
            }
        }
    }

    traverseAudit(auditResult, requirements);

    return Array.from(new Set(needed));
}
