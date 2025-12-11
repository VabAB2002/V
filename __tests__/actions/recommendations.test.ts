/**
 * Integration Tests: Recommendations Server Actions
 * Tests minor recommendation generation functionality
 */

import { getMinorRecommendations } from '../../app/actions/getRecommendations';
import type { ParsedCourse } from '../../app/actions/parseTranscript';

describe('getMinorRecommendations', () => {
    
    // Sample completed courses for testing
    const sampleCourses: ParsedCourse[] = [
        { code: 'CMPSC 131', name: 'Programming and Computation I', credits: 3, earnedCredits: 3, grade: 'A', status: 'completed' },
        { code: 'CMPSC 132', name: 'Programming and Computation II', credits: 3, earnedCredits: 3, grade: 'A', status: 'completed' },
        { code: 'MATH 140', name: 'Calculus I', credits: 4, earnedCredits: 4, grade: 'B', status: 'completed' },
        { code: 'MATH 141', name: 'Calculus II', credits: 4, earnedCredits: 4, grade: 'B', status: 'completed' },
        { code: 'ENGL 15', name: 'Rhetoric and Composition', credits: 3, earnedCredits: 3, grade: 'B+', status: 'completed' },
        { code: 'ACCTG 211', name: 'Financial Accounting', credits: 4, earnedCredits: 4, grade: 'A-', status: 'completed' },
    ];

    it('should return an array of recommendations', async () => {
        const recommendations = await getMinorRecommendations(sampleCourses, 'software_engineering_bs', 6);
        
        expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should return at most topN recommendations', async () => {
        const topN = 4;
        const recommendations = await getMinorRecommendations(sampleCourses, 'software_engineering_bs', topN);
        
        expect(recommendations.length).toBeLessThanOrEqual(topN);
    });

    it('should return recommendations with correct structure', async () => {
        const recommendations = await getMinorRecommendations(sampleCourses, 'software_engineering_bs', 6);
        
        if (recommendations.length > 0) {
            const firstRec = recommendations[0];
            
            expect(firstRec).toHaveProperty('minor_id');
            expect(firstRec).toHaveProperty('minor_name');
            expect(firstRec).toHaveProperty('gap_credits');
            expect(firstRec).toHaveProperty('completed_credits');
            expect(firstRec).toHaveProperty('total_credits_required');
            expect(firstRec).toHaveProperty('completion_percentage');
            expect(firstRec).toHaveProperty('strategic_score');
            expect(firstRec).toHaveProperty('sections');
        }
    });

    it('should calculate completion percentage correctly', async () => {
        const recommendations = await getMinorRecommendations(sampleCourses, 'software_engineering_bs', 6);
        
        for (const rec of recommendations) {
            // Completion percentage should be between 0 and 100
            expect(rec.completion_percentage).toBeGreaterThanOrEqual(0);
            expect(rec.completion_percentage).toBeLessThanOrEqual(100);
            
            // Gap credits should be non-negative
            expect(rec.gap_credits).toBeGreaterThanOrEqual(0);
            
            // Completed + Gap should roughly equal total (with some flexibility)
            const calculatedTotal = rec.completed_credits + rec.gap_credits;
            expect(calculatedTotal).toBeLessThanOrEqual(rec.total_credits_required + 3);
        }
    });

    it('should sort recommendations by strategic score', async () => {
        const recommendations = await getMinorRecommendations(sampleCourses, 'software_engineering_bs', 6);
        
        // Check that recommendations are sorted by strategic_score descending
        for (let i = 0; i < recommendations.length - 1; i++) {
            expect(recommendations[i].strategic_score).toBeGreaterThanOrEqual(recommendations[i + 1].strategic_score);
        }
    });

    it('should handle empty course list', async () => {
        const recommendations = await getMinorRecommendations([], 'software_engineering_bs', 6);
        
        expect(Array.isArray(recommendations)).toBe(true);
        // Should still return recommendations (based on major overlap)
    });

    it('should include section breakdown', async () => {
        const recommendations = await getMinorRecommendations(sampleCourses, 'software_engineering_bs', 6);
        
        if (recommendations.length > 0 && recommendations[0].sections.length > 0) {
            const section = recommendations[0].sections[0];
            
            expect(section).toHaveProperty('section_name');
            expect(section).toHaveProperty('credits_needed');
            expect(section).toHaveProperty('credits_completed');
            expect(section).toHaveProperty('completed_courses');
            expect(section).toHaveProperty('needed_courses');
        }
    });
});

