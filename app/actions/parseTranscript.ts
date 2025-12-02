'use server'

export interface ParsedCourse {
    code: string;
    name: string;
    credits: number;
    earnedCredits: number;
    grade: string;
    status: 'completed' | 'in-progress' | 'dropped' | 'transfer';
    term?: string;
}

/**
 * Parse a Penn State transcript PDF and extract courses
 */
export async function parseTranscriptPDF(fileBuffer: ArrayBuffer): Promise<ParsedCourse[]> {
    try {
        console.log('Starting PDF parse...');
        console.log('FileBuffer type:', typeof fileBuffer);
        console.log('FileBuffer size:', fileBuffer.byteLength);

        // Validate input
        if (!fileBuffer || fileBuffer.byteLength === 0) {
            throw new Error('Invalid or empty file buffer');
        }

        // Import from lib directly to avoid debug code in index.js
        const pdfParse = require('pdf-parse/lib/pdf-parse.js');

        // Convert ArrayBuffer to Node.js Buffer
        const buffer = Buffer.from(fileBuffer);
        console.log('Buffer type:', Buffer.isBuffer(buffer));
        console.log('Buffer size:', buffer.length);
        console.log('First few bytes:', buffer.slice(0, 10).toString('hex'));

        // Call pdf-parse function with just the buffer
        console.log('Calling pdf-parse...');
        const data = await pdfParse(buffer);

        console.log('PDF parsed successfully!');
        console.log('Number of pages:', data.numpages);
        console.log('Text length:', data.text?.length || 0);

        const text = data.text;
        if (!text || text.length === 0) {
            throw new Error('No text extracted from PDF');
        }

        // Log a preview of the text to see the format
        console.log('=== TEXT PREVIEW (first 2000 chars) ===');
        console.log(text.substring(0, 2000));
        console.log('=== END PREVIEW ===');
        console.log('=== TEXT PREVIEW (last 1500 chars) ===');
        console.log(text.substring(text.length - 1500));
        console.log('=== END PREVIEW ===');

        const courses = extractCoursesFromText(text);
        console.log('Extracted', courses.length, 'courses');

        if (courses.length > 0) {
            console.log('Sample courses:', courses.slice(0, 3));

            // Calculate credit totals
            const completedCredits = courses
                .filter(c => c.status === 'completed')
                .reduce((sum, c) => sum + c.earnedCredits, 0);

            const inProgressCredits = courses
                .filter(c => c.status === 'in-progress')
                .reduce((sum, c) => sum + c.credits, 0);

            const transferCredits = courses
                .filter(c => c.status === 'transfer')
                .reduce((sum, c) => sum + c.earnedCredits, 0);

            console.log('=== CREDIT SUMMARY ===');
            console.log(`Completed courses: ${courses.filter(c => c.status === 'completed').length}`);
            console.log(`Completed credits: ${completedCredits}`);
            console.log(`In-progress courses: ${courses.filter(c => c.status === 'in-progress').length}`);
            console.log(`In-progress credits: ${inProgressCredits}`);
            console.log(`Transfer credits: ${transferCredits}`);
            console.log(`Total potential credits: ${completedCredits + inProgressCredits + transferCredits}`);
            console.log('===================');
        }

        return courses;
    } catch (error) {
        console.error('Error parsing PDF:', error);
        console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : typeof error
        });
        throw new Error(`Failed to parse transcript PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Extract courses from transcript text
 * Penn State format (from PDF): Text is concatenated without spaces
 * Example: ASTRO    6Stars and Galaxies3.0003.000B-8.010
 */
function extractCoursesFromText(text: string): ParsedCourse[] {
    const courses: ParsedCourse[] = [];
    const lines = text.split('\n');

    // Track current term for context
    let currentTerm = '';

    // Pattern to match term headers (e.g., "FA 2022", "SP 2023", "SU 2023")
    const termPattern = /^(FA|SP|SU)\s+\d{4}$/;

    // Pattern to match course lines in the concatenated format
    // Format: DEPT  CODEDescription...Attempted.EarnedGradePoints
    // Example: CMPSC  131PROG & COMP I3.0003.000C6.000
    // Example: ASTRO    6Stars and Galaxies3.0003.000B-8.010
    // Example: MATH  141CALC ANLY GEOM II4.0004.000 TR0.000 (note space before TR)
    // Pattern breakdown:
    // ([A-Z]{2,6})\s+ - Department code with spaces
    // (\d{1,4}) - Course number (NO optional letter - that's part of description!)
    // ([A-Z].+?) - Description starting with capital letter (non-greedy)
    // (\d+\.\d{3}) - Attempted credits
    // (\d+\.\d{3}) - Earned credits  
    // \s*([A-Z][A-Z+-]*|LD|IP|TR|) - Grade (may have leading space, especially for TR)
    // (\d+\.\d{3}) - Points
    const coursePattern = /^([A-Z]{2,6})\s+(\d{1,4})([A-Z].+?)(\d+\.\d{3})(\d+\.\d{3})\s*([A-Z][A-Z+-]*|LD|IP|TR|)(\d+\.\d{3})$/;

    console.log('Starting course extraction...');
    let courseCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip empty lines
        if (!line) continue;

        // Check if this is a term header
        if (termPattern.test(line)) {
            currentTerm = line;
            console.log('Found term:', currentTerm);
            continue;
        }

        // Try to match course pattern
        const match = coursePattern.exec(line);

        if (match) {
            const [, dept, code, description, attempted, earned, grade, points] = match;

            const courseCode = `${dept} ${code}`;
            const attemptedCredits = parseFloat(attempted);
            const earnedCredits = parseFloat(earned);
            const gradeTrimmed = grade.trim(); // Trim spaces from grade

            console.log(`Found course: ${courseCode}, Grade: "${gradeTrimmed}", Attempted: ${attemptedCredits}, Earned: ${earnedCredits}`);

            // Determine course status
            let status: ParsedCourse['status'] = 'completed';

            if (gradeTrimmed === 'IP') {
                // Explicitly marked as in-progress
                status = 'in-progress';
            } else if (gradeTrimmed === 'LD') {
                // Explicitly marked as late drop
                status = 'dropped';
            } else if (gradeTrimmed === 'TR') {
                // Transfer credit
                status = 'transfer';
            } else if (!gradeTrimmed && attemptedCredits > 0) {
                // No grade but has attempted credits = in-progress (future semester)
                status = 'in-progress';
            } else if (earnedCredits > 0) {
                // Has earned credits = completed
                status = 'completed';
            } else {
                // Attempted but not earned and not IP/TR = dropped
                status = 'dropped';
            }

            // Only add courses that are completed, in-progress, or transfer
            if (status !== 'dropped') {
                courses.push({
                    code: courseCode,
                    name: description.trim(),
                    credits: attemptedCredits,
                    earnedCredits: earnedCredits,
                    grade: gradeTrimmed || 'N/A',
                    status: status,
                    term: currentTerm
                });
                courseCount++;
                console.log(`Added ${courseCode} (${status})`);
            } else {
                console.log(`Skipped ${courseCode} (dropped)`);
            }
        }
    }

    console.log(`Total courses found: ${courseCount}`);

    // Remove duplicates - keep the latest occurrence (in case of retakes)
    const uniqueCourses = new Map<string, ParsedCourse>();

    for (const course of courses) {
        const existing = uniqueCourses.get(course.code);

        // If this is a retake, keep the one with the higher grade or more recent term
        if (!existing || course.earnedCredits > existing.earnedCredits) {
            uniqueCourses.set(course.code, course);
        }
    }

    console.log(`After deduplication: ${uniqueCourses.size} courses`);

    return Array.from(uniqueCourses.values());
}

/**
 * Convert parsed courses to simple course code array for the autocomplete
 * This must be async because it's exported from a 'use server' file
 */
export async function extractCourseCodesFromParsed(courses: ParsedCourse[]): Promise<string[]> {
    return courses
        .filter(c => c.status === 'completed' || c.status === 'in-progress' || c.status === 'transfer')
        .map(c => c.code);
}

/**
 * Helper to get summary stats from parsed courses
 */
export async function getTranscriptSummary(courses: ParsedCourse[]): Promise<{
    totalCourses: number;
    completedCourses: number;
    inProgressCourses: number;
    transferCourses: number;
    totalCredits: number;
    earnedCredits: number;
}> {
    const completed = courses.filter(c => c.status === 'completed');
    const inProgress = courses.filter(c => c.status === 'in-progress');
    const transfer = courses.filter(c => c.status === 'transfer');

    const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
    const earnedCredits = courses.reduce((sum, c) => sum + c.earnedCredits, 0);

    return {
        totalCourses: courses.length,
        completedCourses: completed.length,
        inProgressCourses: inProgress.length,
        transferCourses: transfer.length,
        totalCredits,
        earnedCredits
    };
}
