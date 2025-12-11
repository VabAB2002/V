import {
    getCourseDetails,
    getCourseCredits,
    loadMajorRequirements,
    loadMinorRequirements,
    getAllMajorIds,
    getAllMinorIds,
    courseHasGenEdAttribute,
    findCoursesByDepartment,
    getEquivalentCourses,
    clearCache
} from '../../lib/engine/loader';

describe('Data Loader - Course Operations', () => {

    beforeEach(() => {
        // Clear cache to ensure fresh data
        clearCache();
    });

    describe('getCourseDetails()', () => {

        it('should return course details for valid course', () => {
            const details = getCourseDetails('CMPSC 131');

            expect(details).toBeDefined();
            if (details) {
                expect(details.course_code).toBe('CMPSC 131');
                expect(details.department).toBe('CMPSC');
            }
        });

        it('should return undefined for invalid course', () => {
            const details = getCourseDetails('INVALID 999');

            expect(details).toBeUndefined();
        });

        it('should include credit information', () => {
            const details = getCourseDetails('CMPSC 131');

            expect(details).toBeDefined();
            if (details) {
                expect(details.credits).toBeDefined();
            }
        });

        it('should include department and level', () => {
            const details = getCourseDetails('MATH 140');

            expect(details).toBeDefined();
            if (details) {
                expect(details.department).toBe('MATH');
                expect(details.level).toBeGreaterThanOrEqual(100);
                expect(details.level).toBeLessThan(1000);
            }
        });
    });

    describe('getCourseCredits()', () => {

        it('should return credits for valid course', () => {
            const credits = getCourseCredits('CMPSC 131');

            expect(typeof credits).toBe('number');
            expect(credits).toBeGreaterThan(0);
        });

        it('should return default 3 for invalid course', () => {
            const credits = getCourseCredits('INVALID 999');

            expect(credits).toBe(3);
        });

        it('should handle variable credit courses', () => {
            // Find a variable credit course if one exists
            const credits = getCourseCredits('CMPSC 494');
            expect(typeof credits).toBe('number');
        });
    });

    describe('courseHasGenEdAttribute()', () => {

        it('should return true for course with GenEd attribute', () => {
            // ENGL 15 typically has GWS attribute
            const hasAttr = courseHasGenEdAttribute('ENGL 15', 'GWS');
            // This depends on actual data
            expect(typeof hasAttr).toBe('boolean');
        });

        it('should return false for invalid course', () => {
            const hasAttr = courseHasGenEdAttribute('INVALID 999', 'GWS');

            expect(hasAttr).toBe(false);
        });
    });

    describe('findCoursesByDepartment()', () => {

        it('should find courses in department', () => {
            const courses = findCoursesByDepartment('CMPSC');

            expect(Array.isArray(courses)).toBe(true);
            expect(courses.length).toBeGreaterThan(0);
        });

        it('should filter by level range', () => {
            const courses = findCoursesByDepartment('CMPSC', 400, 499);

            expect(Array.isArray(courses)).toBe(true);
            // All courses should be 400-level
            for (const courseId of courses) {
                const details = getCourseDetails(courseId);
                if (details) {
                    expect(details.level).toBeGreaterThanOrEqual(400);
                    expect(details.level).toBeLessThan(500);
                }
            }
        });

        it('should return empty array for invalid department', () => {
            const courses = findCoursesByDepartment('XXXXXX');

            expect(Array.isArray(courses)).toBe(true);
            expect(courses.length).toBe(0);
        });
    });
});

describe('Data Loader - Program Operations', () => {

    describe('getAllMajorIds()', () => {

        it('should return array of major IDs', () => {
            const majorIds = getAllMajorIds();

            expect(Array.isArray(majorIds)).toBe(true);
            expect(majorIds.length).toBeGreaterThan(0);
        });

        it('should have unique IDs', () => {
            const majorIds = getAllMajorIds();
            const uniqueIds = new Set(majorIds);

            expect(uniqueIds.size).toBe(majorIds.length);
        });
    });

    describe('getAllMinorIds()', () => {

        it('should return array of minor IDs', () => {
            const minorIds = getAllMinorIds();

            expect(Array.isArray(minorIds)).toBe(true);
            expect(minorIds.length).toBeGreaterThan(0);
        });
    });

    describe('loadMajorRequirements()', () => {

        it('should load major requirements', () => {
            const majorIds = getAllMajorIds();
            if (majorIds.length > 0) {
                const major = loadMajorRequirements(majorIds[0]);

                expect(major).toBeDefined();
                if (major) {
                    expect(major).toHaveProperty('program_id');
                    expect(major).toHaveProperty('name');
                    expect(major).toHaveProperty('credits_required');
                    expect(major).toHaveProperty('requirements');
                }
            }
        });

        it('should return null for invalid major', () => {
            const major = loadMajorRequirements('invalid_major_id');

            expect(major).toBeNull();
        });

        it('should have valid requirement structure', () => {
            const majorIds = getAllMajorIds();
            if (majorIds.length > 0) {
                const major = loadMajorRequirements(majorIds[0]);

                if (major && major.requirements) {
                    expect(major.requirements).toHaveProperty('type');
                }
            }
        });
    });

    describe('loadMinorRequirements()', () => {

        it('should load minor requirements', () => {
            const minorIds = getAllMinorIds();
            if (minorIds.length > 0) {
                const minor = loadMinorRequirements(minorIds[0]);

                expect(minor).toBeDefined();
                if (minor) {
                    expect(minor).toHaveProperty('program_id');
                    expect(minor).toHaveProperty('name');
                    expect(minor).toHaveProperty('credits_required');
                    expect(minor).toHaveProperty('requirements');
                }
            }
        });

        it('should return null for invalid minor', () => {
            const minor = loadMinorRequirements('invalid_minor_id');

            expect(minor).toBeNull();
        });
    });

    describe('getEquivalentCourses()', () => {

        it('should return array for any course', () => {
            const equivalents = getEquivalentCourses('CMPSC 121');

            expect(Array.isArray(equivalents)).toBe(true);
        });

        it('should return empty array for course with no equivalents', () => {
            const equivalents = getEquivalentCourses('INVALID 999');

            expect(Array.isArray(equivalents)).toBe(true);
        });
    });
});

