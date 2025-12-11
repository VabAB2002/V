import { auditRequirement, compareGrade } from '../../lib/engine/evaluator';
import type { RequirementNode, CompletedCourse } from '../../lib/types';

describe('Evaluator - Grade Comparison', () => {

    describe('compareGrade()', () => {

        it('should pass when earned >= required', () => {
            expect(compareGrade('A', 'C')).toBe('PASS');
            expect(compareGrade('B+', 'B')).toBe('PASS');
            expect(compareGrade('C', 'C')).toBe('PASS');
        });

        it('should fail when earned < required', () => {
            expect(compareGrade('C', 'B')).toBe('FAIL');
            expect(compareGrade('D', 'C')).toBe('FAIL');
            expect(compareGrade('F', 'D')).toBe('FAIL');
        });

        it('should handle plus/minus grades', () => {
            expect(compareGrade('B+', 'B-')).toBe('PASS');
            expect(compareGrade('A-', 'B+')).toBe('PASS');
            expect(compareGrade('C+', 'B-')).toBe('FAIL');
        });

        it('should use D as default required grade', () => {
            expect(compareGrade('D')).toBe('PASS');
            expect(compareGrade('C')).toBe('PASS');
            expect(compareGrade('F')).toBe('FAIL');
        });
    });
});

describe('Evaluator - Requirement Auditing', () => {

    const sampleTranscript: CompletedCourse[] = [
        { id: 'CMPSC 131', grade: 'A', credits_awarded: 3 },
        { id: 'CMPSC 132', grade: 'B+', credits_awarded: 3 },
        { id: 'MATH 140', grade: 'B', credits_awarded: 4 },
        { id: 'MATH 141', grade: 'B', credits_awarded: 4 },
        { id: 'ENGL 15', grade: 'A-', credits_awarded: 3 },
    ];

    describe('FIXED node type', () => {

        it('should mark as MET when course is completed', () => {
            const node: RequirementNode = {
                type: 'FIXED',
                course_id: 'CMPSC 131',
                label: 'Programming I'
            };

            const result = auditRequirement(node, sampleTranscript, new Set());

            expect(result.status).toBe('MET');
            expect(result.fulfilled_by).toContain('CMPSC 131');
            expect(result.credits_earned).toBe(3);
        });

        it('should mark as MISSING when course not completed', () => {
            const node: RequirementNode = {
                type: 'FIXED',
                course_id: 'CMPSC 360',
                label: 'Discrete Math'
            };

            const result = auditRequirement(node, sampleTranscript, new Set());

            expect(result.status).toBe('MISSING');
            expect(result.fulfilled_by).toHaveLength(0);
        });

        it('should respect minimum grade requirement', () => {
            const node: RequirementNode = {
                type: 'FIXED',
                course_id: 'MATH 140',
                min_grade: 'A',
                label: 'Calculus I'
            };

            const result = auditRequirement(node, sampleTranscript, new Set());

            // B grade doesn't meet A requirement
            expect(result.status).toBe('MISSING');
        });
    });

    describe('AND node type', () => {

        it('should mark as MET when all children are met', () => {
            const node: RequirementNode = {
                type: 'AND',
                label: 'Math Requirements',
                children: [
                    { type: 'FIXED', course_id: 'MATH 140' },
                    { type: 'FIXED', course_id: 'MATH 141' }
                ]
            };

            const result = auditRequirement(node, sampleTranscript, new Set());

            expect(result.status).toBe('MET');
            expect(result.credits_earned).toBe(8); // 4 + 4
        });

        it('should mark as PARTIAL when some children are met', () => {
            const node: RequirementNode = {
                type: 'AND',
                label: 'Math Requirements',
                children: [
                    { type: 'FIXED', course_id: 'MATH 140' },
                    { type: 'FIXED', course_id: 'MATH 230' } // Not in transcript
                ]
            };

            const result = auditRequirement(node, sampleTranscript, new Set());

            expect(result.status).toBe('PARTIAL');
        });

        it('should mark as MISSING when no children are met', () => {
            const node: RequirementNode = {
                type: 'AND',
                label: 'Advanced Requirements',
                children: [
                    { type: 'FIXED', course_id: 'CMPSC 461' },
                    { type: 'FIXED', course_id: 'CMPSC 465' }
                ]
            };

            const result = auditRequirement(node, sampleTranscript, new Set());

            expect(result.status).toBe('MISSING');
        });
    });

    describe('OR node type', () => {

        it('should mark as MET when one option is met', () => {
            const node: RequirementNode = {
                type: 'OR',
                label: 'Programming Choice',
                children: [
                    { type: 'FIXED', course_id: 'CMPSC 131' },
                    { type: 'FIXED', course_id: 'CMPSC 121' }
                ]
            };

            const result = auditRequirement(node, sampleTranscript, new Set());

            expect(result.status).toBe('MET');
            expect(result.fulfilled_by).toHaveLength(1);
        });

        it('should handle simple OR with options array', () => {
            const node: RequirementNode = {
                type: 'OR',
                label: 'Math Choice',
                options: ['MATH 140', 'MATH 110']
            };

            const result = auditRequirement(node, sampleTranscript, new Set());

            expect(result.status).toBe('MET');
            expect(result.fulfilled_by).toContain('MATH 140');
        });
    });

    describe('FIXED_LIST node type', () => {

        it('should mark as MET when all courses completed', () => {
            const node: RequirementNode = {
                type: 'FIXED_LIST',
                courses: ['CMPSC 131', 'CMPSC 132'],
                label: 'Core CS'
            };

            const result = auditRequirement(node, sampleTranscript, new Set());

            expect(result.status).toBe('MET');
            expect(result.fulfilled_by).toContain('CMPSC 131');
            expect(result.fulfilled_by).toContain('CMPSC 132');
        });

        it('should mark as PARTIAL when some courses completed', () => {
            const node: RequirementNode = {
                type: 'FIXED_LIST',
                courses: ['CMPSC 131', 'CMPSC 360'],
                label: 'CS Requirements'
            };

            const result = auditRequirement(node, sampleTranscript, new Set());

            expect(result.status).toBe('PARTIAL');
        });
    });

    describe('PICK_FROM_LIST node type', () => {

        it('should count credits toward requirement', () => {
            const node: RequirementNode = {
                type: 'PICK_FROM_LIST',
                valid_courses: ['CMPSC 131', 'CMPSC 132', 'CMPSC 360'],
                credits_needed: 6,
                label: 'CS Electives'
            };

            const result = auditRequirement(node, sampleTranscript, new Set());

            expect(result.status).toBe('MET');
            expect(result.credits_earned).toBe(6); // CMPSC 131 + CMPSC 132
        });

        it('should mark as PARTIAL when credits not met', () => {
            const node: RequirementNode = {
                type: 'PICK_FROM_LIST',
                valid_courses: ['CMPSC 131', 'CMPSC 360', 'CMPSC 461'],
                credits_needed: 9,
                label: 'Advanced CS'
            };

            const result = auditRequirement(node, sampleTranscript, new Set());

            expect(result.status).toBe('PARTIAL');
            expect(result.credits_earned).toBe(3); // Only CMPSC 131
        });
    });

    describe('Double counting prevention', () => {

        it('should not count same course twice', () => {
            const node: RequirementNode = {
                type: 'AND',
                label: 'Requirements',
                children: [
                    { type: 'FIXED', course_id: 'CMPSC 131' },
                    {
                        type: 'PICK_FROM_LIST',
                        valid_courses: ['CMPSC 131', 'CMPSC 132'],
                        credits_needed: 3
                    }
                ]
            };

            const usedCourses = new Set<string>();
            const result = auditRequirement(node, sampleTranscript, usedCourses);

            // CMPSC 131 used for FIXED, CMPSC 132 used for PICK_FROM_LIST
            expect(result.children_results![0].fulfilled_by).toContain('CMPSC 131');
            expect(result.children_results![1].fulfilled_by).toContain('CMPSC 132');
        });
    });
});

