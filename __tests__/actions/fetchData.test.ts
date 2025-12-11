/**
 * Integration Tests: fetchData Server Actions
 * Tests major and course data fetching functionality
 */

import { getMajorList, getCourseList } from '../../lib/server-utils';

describe('fetchData - Major and Course Loading', () => {
    
    describe('getMajorList()', () => {
        
        it('should return an array of majors', () => {
            const majors = getMajorList();
            
            expect(Array.isArray(majors)).toBe(true);
            expect(majors.length).toBeGreaterThan(0);
        });

        it('should return majors with correct structure', () => {
            const majors = getMajorList();
            const firstMajor = majors[0];
            
            expect(firstMajor).toHaveProperty('id');
            expect(firstMajor).toHaveProperty('name');
            expect(typeof firstMajor.id).toBe('string');
            expect(typeof firstMajor.name).toBe('string');
        });

        it('should contain known majors', () => {
            const majors = getMajorList();
            const majorIds = majors.map(m => m.id);
            
            // Check for some expected majors
            expect(majorIds.some(id => id.includes('software'))).toBe(true);
        });

        it('should have unique major IDs', () => {
            const majors = getMajorList();
            const ids = majors.map(m => m.id);
            const uniqueIds = new Set(ids);
            
            expect(uniqueIds.size).toBe(ids.length);
        });
    });

    describe('getCourseList()', () => {
        
        it('should return an array of courses', () => {
            const courses = getCourseList();
            
            expect(Array.isArray(courses)).toBe(true);
            expect(courses.length).toBeGreaterThan(0);
        });

        it('should return courses with correct structure', () => {
            const courses = getCourseList();
            const firstCourse = courses[0];
            
            expect(firstCourse).toHaveProperty('code');
            expect(firstCourse).toHaveProperty('name');
            expect(typeof firstCourse.code).toBe('string');
            expect(typeof firstCourse.name).toBe('string');
        });

        it('should contain known courses', () => {
            const courses = getCourseList();
            const courseCodes = courses.map(c => c.code);
            
            // Check for some expected courses (CMPSC is common)
            expect(courseCodes.some(code => code.startsWith('CMPSC'))).toBe(true);
        });

        it('should have course codes in correct format', () => {
            const courses = getCourseList();
            
            // Course code format: DEPT 123 or DEPT 123X
            const validFormat = /^[A-Z]{2,6}\s+\d{1,4}[A-Z]?$/;
            
            // At least 90% of courses should match format
            const validCourses = courses.filter(c => validFormat.test(c.code));
            expect(validCourses.length / courses.length).toBeGreaterThan(0.9);
        });
    });
});

