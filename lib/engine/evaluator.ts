// engine/evaluator.ts - Recursive Evaluation Engine

import {
    RequirementNode,
    CompletedCourse,
    AuditResult,
    GradeComparisonResult,
} from '../types';
import { getCourseDetails, getCourseCredits, courseHasGenEdAttribute, getEquivalentCourses } from './loader';

// Grade hierarchy (higher index = better)
const GRADE_HIERARCHY = ['F', 'D', 'D+', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+'];

const PASSING_GRADES = new Set(['D', 'D+', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+']);

// Compare two grades
export function compareGrade(
    earnedGrade: string,
    requiredGrade: string = 'D'
): GradeComparisonResult {
    const earnedIndex = GRADE_HIERARCHY.indexOf(earnedGrade);
    const requiredIndex = GRADE_HIERARCHY.indexOf(requiredGrade);

    if (earnedIndex === -1 || requiredIndex === -1) {
        // Unknown grade handling
        return PASSING_GRADES.has(earnedGrade) ? 'PASS' : 'FAIL';
    }

    return earnedIndex >= requiredIndex ? 'PASS' : 'FAIL';
}

// Core recursive evaluation function
export function auditRequirement(
    node: RequirementNode,
    transcript: CompletedCourse[],
    usedCourses: Set<string> = new Set()
): AuditResult {
    switch (node.type) {
        case 'AND':
            return auditAND(node, transcript, usedCourses);

        case 'OR':
            return auditOR(node, transcript, usedCourses);

        case 'FIXED':
        case 'COURSE':
            return auditFIXED(node, transcript, usedCourses);

        case 'FIXED_LIST':
            return auditFIXED_LIST(node, transcript, usedCourses);

        case 'PICK_FROM_LIST':
            return auditPICK_FROM_LIST(node, transcript, usedCourses);

        case 'PICK_FROM_DEPT':
            return auditPICK_FROM_DEPT(node, transcript, usedCourses);

        case 'PICK_FROM_CATEGORY':
        case 'PICK_BY_ATTRIBUTE':
            return auditPICK_FROM_CATEGORY(node, transcript, usedCourses);

        case 'ANY_COURSE':
            return auditANY_COURSE(node, transcript, usedCourses);

        case 'PROFICIENCY':
            return auditPROFICIENCY(node, transcript, usedCourses);

        default:
            return {
                status: 'MISSING',
                credits_earned: 0,
                credits_required: node.credits_needed || 0,
                fulfilled_by: [],
                missing_reason: `Unknown node type: ${node.type}`,
                label: node.label,
            };
    }
}

/**
 * Audit AND node - all children must be satisfied.
 */
function auditAND(
    node: RequirementNode,
    transcript: CompletedCourse[],
    usedCourses: Set<string>
): AuditResult {
    const childResults: AuditResult[] = [];
    let totalCreditsEarned = 0;
    let totalCreditsRequired = 0;
    const fulfilledBy: string[] = [];

    if (!node.children || node.children.length === 0) {
        return {
            status: 'MET',
            credits_earned: 0,
            credits_required: 0,
            fulfilled_by: [],
            label: node.label,
        };
    }

    for (const child of node.children) {
        const childResult = auditRequirement(child, transcript, usedCourses);
        childResults.push(childResult);

        totalCreditsEarned += childResult.credits_earned;
        totalCreditsRequired += childResult.credits_required;
        fulfilledBy.push(...childResult.fulfilled_by);
    }

    const allMet = childResults.every(r => r.status === 'MET');
    const someMet = childResults.some(r => r.status === 'MET' || r.status === 'PARTIAL');

    return {
        status: allMet ? 'MET' : (someMet ? 'PARTIAL' : 'MISSING'),
        credits_earned: totalCreditsEarned,
        credits_required: totalCreditsRequired,
        fulfilled_by: fulfilledBy,
        children_results: childResults,
        label: node.label,
        remaining_credits: Math.max(0, totalCreditsRequired - totalCreditsEarned),
    };
}

/**
 * Audit OR node - at least one child must be satisfied.
 */
function auditOR(
    node: RequirementNode,
    transcript: CompletedCourse[],
    usedCourses: Set<string>
): AuditResult {
    if (!node.children || node.children.length === 0) {
        // Check if this is a simple OR with options[] instead of children
        if (node.options && node.options.length > 0) {
            return auditSimpleOR(node, transcript, usedCourses);
        }

        return {
            status: 'MISSING',
            credits_earned: 0,
            credits_required: node.credits_needed || 0,
            fulfilled_by: [],
            missing_reason: 'No options available',
            label: node.label,
        };
    }

    const childResults: AuditResult[] = [];
    let bestResult: AuditResult | null = null;
    let bestCredits = 0;

    // Try each option and pick the best one
    for (const child of node.children) {
        const localUsed = new Set(usedCourses);
        const childResult = auditRequirement(child, transcript, localUsed);
        childResults.push(childResult);

        if (childResult.status === 'MET' && childResult.credits_earned >= bestCredits) {
            bestResult = childResult;
            bestCredits = childResult.credits_earned;

            // Update usedCourses with this option's courses
            childResult.fulfilled_by.forEach((c: string) => usedCourses.add(c));
        }
    }

    // If no perfect match, pick the one with most credits
    if (!bestResult) {
        bestResult = childResults.reduce((best, curr) =>
            curr.credits_earned > best.credits_earned ? curr : best
            , childResults[0]);

        bestResult?.fulfilled_by.forEach((c: string) => usedCourses.add(c));
    }

    return {
        status: bestResult?.status || 'MISSING',
        credits_earned: bestResult?.credits_earned || 0,
        credits_required: bestResult?.credits_required || node.credits_needed || 0,
        fulfilled_by: bestResult?.fulfilled_by || [],
        children_results: childResults,
        label: node.label,
    };
}

/**
 * Audit simple OR with options array (e.g., ["MATH 110", "MATH 140"]).
 */
function auditSimpleOR(
    node: RequirementNode,
    transcript: CompletedCourse[],
    usedCourses: Set<string>
): AuditResult {
    const options = node.options || [];
    const minGrade = node.min_grade || 'D';

    for (const courseId of options) {
        // Check both the exact course and equivalents
        const validCourses = [courseId, ...getEquivalentCourses(courseId)];
        const completed = transcript.find(c => validCourses.includes(c.id) && !usedCourses.has(c.id));

        if (completed && compareGrade(completed.grade, minGrade) === 'PASS') {
            usedCourses.add(completed.id);
            return {
                status: 'MET',
                credits_earned: completed.credits_awarded,
                credits_required: completed.credits_awarded,
                fulfilled_by: [completed.id],
                label: node.label,
            };
        }
    }

    return {
        status: 'MISSING',
        credits_earned: 0,
        credits_required: node.credits_needed || 3,
        fulfilled_by: [],
        missing_reason: `Need one of: ${options.join(', ')}`,
        label: node.label,
    };
}

/**
 * Audit FIXED node - specific single course required.
 */
function auditFIXED(
    node: RequirementNode,
    transcript: CompletedCourse[],
    usedCourses: Set<string>
): AuditResult {
    const courseId = node.course_id || node.course || node.courses?.[0];

    if (!courseId) {
        return {
            status: 'MISSING',
            credits_earned: 0,
            credits_required: 0,
            fulfilled_by: [],
            missing_reason: 'No course specified',
            label: node.label,
        };
    }

    const minGrade = node.min_grade || 'D';

    // Check both the exact course and equivalents
    const validCourses = [courseId, ...getEquivalentCourses(courseId)];
    const completed = transcript.find(c => validCourses.includes(c.id) && !usedCourses.has(c.id));

    if (completed && compareGrade(completed.grade, minGrade) === 'PASS') {
        usedCourses.add(completed.id);
        return {
            status: 'MET',
            credits_earned: completed.credits_awarded,
            credits_required: completed.credits_awarded,
            fulfilled_by: [completed.id],
            label: node.label,
        };
    }

    const expectedCredits = getCourseCredits(courseId);
    return {
        status: 'MISSING',
        credits_earned: 0,
        credits_required: expectedCredits,
        fulfilled_by: [],
        missing_reason: `Need ${courseId}${minGrade !== 'D' ? ` with grade ${minGrade} or better` : ''}`,
        label: node.label,
    };
}

/**
 * Audit FIXED_LIST - list of specific required courses.
 */
function auditFIXED_LIST(
    node: RequirementNode,
    transcript: CompletedCourse[],
    usedCourses: Set<string>
): AuditResult {
    const courses = node.courses || [];
    const minGrade = node.min_grade || 'D';
    const fulfilled: string[] = [];
    let creditsEarned = 0;
    let creditsRequired = 0;

    for (const courseId of courses) {
        const requiredGrade = node.min_grade_overrides?.[courseId] || minGrade;

        // Check both the exact course and equivalents
        const validCourses = [courseId, ...getEquivalentCourses(courseId)];
        const completed = transcript.find(c => validCourses.includes(c.id) && !usedCourses.has(c.id));

        creditsRequired += getCourseCredits(courseId);

        if (completed && compareGrade(completed.grade, requiredGrade) === 'PASS') {
            fulfilled.push(completed.id);
            creditsEarned += completed.credits_awarded;
            usedCourses.add(completed.id);
        }
    }

    const status = fulfilled.length === courses.length ? 'MET' :
        fulfilled.length > 0 ? 'PARTIAL' : 'MISSING';

    return {
        status,
        credits_earned: creditsEarned,
        credits_required: creditsRequired,
        fulfilled_by: fulfilled,
        missing_reason: status !== 'MET' ?
            `Need ${courses.length - fulfilled.length} more courses from list` : undefined,
        label: node.label,
    };
}

/**
 * Audit PICK_FROM_LIST - select N credits from a list of valid courses.
 */
function auditPICK_FROM_LIST(
    node: RequirementNode,
    transcript: CompletedCourse[],
    usedCourses: Set<string>
): AuditResult {
    const validCourses = node.valid_courses || [];
    const creditsNeeded = node.credits_needed || node.credits_required || 0;
    const minGrade = node.min_grade || 'D';
    const excludeCourses = new Set(node.exclude_courses || []);
    const fulfilled: string[] = [];
    let creditsEarned = 0;

    // Collect matching courses
    const candidates = transcript.filter(c =>
        validCourses.includes(c.id) &&
        !usedCourses.has(c.id) &&
        !excludeCourses.has(c.id)
    );

    // Sort by level (higher first) and grade
    candidates.sort((a, b) => {
        const aDetails = getCourseDetails(a.id);
        const bDetails = getCourseDetails(b.id);
        return (bDetails?.level || 0) - (aDetails?.level || 0);
    });

    // Pick courses until credits satisfied
    for (const completed of candidates) {
        if (creditsEarned >= creditsNeeded) break;

        const requiredGrade = node.min_grade_overrides?.[completed.id] || minGrade;
        if (compareGrade(completed.grade, requiredGrade) === 'PASS') {
            fulfilled.push(completed.id);
            creditsEarned += completed.credits_awarded;
            usedCourses.add(completed.id);
        }
    }

    // Check level rules
    if (node.level_rules && node.level_rules.length > 0) {
        const levelRulesMet = checkLevelRules(fulfilled, node.level_rules);
        if (!levelRulesMet) {
            return {
                status: 'PARTIAL',
                credits_earned: creditsEarned,
                credits_required: creditsNeeded,
                fulfilled_by: fulfilled,
                missing_reason: 'Level requirements not satisfied',
                label: node.label,
            };
        }
    }

    const status = creditsEarned >= creditsNeeded ? 'MET' :
        creditsEarned > 0 ? 'PARTIAL' : 'MISSING';

    return {
        status,
        credits_earned: creditsEarned,
        credits_required: creditsNeeded,
        fulfilled_by: fulfilled,
        remaining_credits: Math.max(0, creditsNeeded - creditsEarned),
        label: node.label,
    };
}

/**
 * Audit PICK_FROM_DEPT - select N credits from courses in specific departments.
 */
function auditPICK_FROM_DEPT(
    node: RequirementNode,
    transcript: CompletedCourse[],
    usedCourses: Set<string>
): AuditResult {
    const validDepartments = new Set(node.valid_departments || []);
    const creditsNeeded = node.credits_needed || node.credits_required || 0;
    const minGrade = node.min_grade || 'D';
    const levelMin = node.level_min;
    const levelMax = node.level_max;
    const fulfilled: string[] = [];
    let creditsEarned = 0;

    const candidates = transcript.filter(c => {
        if (usedCourses.has(c.id)) return false;

        const details = getCourseDetails(c.id);
        if (!details) return false;

        if (!validDepartments.has(details.department)) return false;

        if (levelMin !== undefined && details.level < levelMin) return false;
        if (levelMax !== undefined && details.level > levelMax) return false;

        return true;
    });

    // Sort by level (higher courses first)
    candidates.sort((a, b) => {
        const aDetails = getCourseDetails(a.id);
        const bDetails = getCourseDetails(b.id);
        return (bDetails?.level || 0) - (aDetails?.level || 0);
    });

    for (const completed of candidates) {
        if (creditsEarned >= creditsNeeded) break;

        const details = getCourseDetails(completed.id);
        const deptRules = node.department_rules?.[details?.department || ''];
        const requiredGrade = deptRules?.min_grade || minGrade;

        if (compareGrade(completed.grade, requiredGrade) === 'PASS') {
            fulfilled.push(completed.id);
            creditsEarned += completed.credits_awarded;
            usedCourses.add(completed.id);
        }
    }

    const status = creditsEarned >= creditsNeeded ? 'MET' :
        creditsEarned > 0 ? 'PARTIAL' : 'MISSING';

    return {
        status,
        credits_earned: creditsEarned,
        credits_required: creditsNeeded,
        fulfilled_by: fulfilled,
        remaining_credits: Math.max(0, creditsNeeded - creditsEarned),
        label: node.label,
    };
}

/**
 * Audit PICK_FROM_CATEGORY - select N credits from courses with specific GenEd attributes.
 */
function auditPICK_FROM_CATEGORY(
    node: RequirementNode,
    transcript: CompletedCourse[],
    usedCourses: Set<string>
): AuditResult {
    const category = node.category || node.required_attributes?.[0];
    const creditsNeeded = node.credits_needed || node.credits_required || 0;
    const minGrade = node.min_grade || 'D';
    const excludeAttributes = new Set(node.exclude_attributes || []);
    const fulfilled: string[] = [];
    let creditsEarned = 0;

    const candidates = transcript.filter(c => {
        if (usedCourses.has(c.id)) return false;

        const details = getCourseDetails(c.id);
        if (!details) return false;

        // Check if course has required category
        if (category && !details.attributes?.gen_ed?.includes(category)) {
            return false;
        }

        // Check excluded attributes
        if (node.allow_inter_domain === false || excludeAttributes.has('interdomain')) {
            if (details.attributes?.gen_ed?.includes('interdomain')) {
                return false;
            }
        }

        return true;
    });

    for (const completed of candidates) {
        if (creditsEarned >= creditsNeeded) break;

        if (compareGrade(completed.grade, minGrade) === 'PASS') {
            fulfilled.push(completed.id);
            creditsEarned += completed.credits_awarded;
            usedCourses.add(completed.id);
        }
    }

    const status = creditsEarned >= creditsNeeded ? 'MET' :
        creditsEarned > 0 ? 'PARTIAL' : 'MISSING';

    return {
        status,
        credits_earned: creditsEarned,
        credits_required: creditsNeeded,
        fulfilled_by: fulfilled,
        remaining_credits: Math.max(0, creditsNeeded - creditsEarned),
        label: node.label,
    };
}

/**
 * Audit ANY_COURSE - select N credits from any course (with optional level constraints).
 */
function auditANY_COURSE(
    node: RequirementNode,
    transcript: CompletedCourse[],
    usedCourses: Set<string>
): AuditResult {
    const creditsNeeded = node.credits_needed || 0;
    const minGrade = node.min_grade || 'D';
    const levelMin = node.level_min;
    const levelMax = node.level_max;
    const fulfilled: string[] = [];
    let creditsEarned = 0;

    const candidates = transcript.filter(c => {
        if (usedCourses.has(c.id)) return false;

        const details = getCourseDetails(c.id);
        if (!details) return true; // Allow unknown courses

        if (levelMin !== undefined && details.level < levelMin) return false;
        if (levelMax !== undefined && details.level > levelMax) return false;

        return true;
    });

    for (const completed of candidates) {
        if (creditsEarned >= creditsNeeded) break;

        if (compareGrade(completed.grade, minGrade) === 'PASS') {
            fulfilled.push(completed.id);
            creditsEarned += completed.credits_awarded;
            usedCourses.add(completed.id);
        }
    }

    const status = creditsEarned >= creditsNeeded ? 'MET' :
        creditsEarned > 0 ? 'PARTIAL' : 'MISSING';

    return {
        status,
        credits_earned: creditsEarned,
        credits_required: creditsNeeded,
        fulfilled_by: fulfilled,
        remaining_credits: Math.max(0, creditsNeeded - creditsEarned),
        label: node.label,
    };
}

/**
 * Audit PROFICIENCY - language or skill proficiency (placeholder).
 */
function auditPROFICIENCY(
    node: RequirementNode,
    transcript: CompletedCourse[],
    usedCourses: Set<string>
): AuditResult {
    // Proficiency requirements need custom logic
    // For now, mark as MISSING
    return {
        status: 'MISSING',
        credits_earned: 0,
        credits_required: node.credits_needed || 0,
        fulfilled_by: [],
        missing_reason: 'Proficiency requirements need manual verification',
        label: node.label,
    };
}

/**
 * Check if level rules are satisfied.
 */
function checkLevelRules(courseIds: string[], levelRules: any[]): boolean {
    for (const rule of levelRules) {
        const minLevel = rule.min_level;
        const creditsNeeded = rule.credits_needed;

        let creditsAtLevel = 0;
        for (const courseId of courseIds) {
            const details = getCourseDetails(courseId);
            if (details && details.level >= minLevel) {
                creditsAtLevel += getCourseCredits(courseId);
            }
        }

        if (creditsAtLevel < creditsNeeded) {
            return false;
        }
    }

    return true;
}
