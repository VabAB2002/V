'use server'

import Database from 'better-sqlite3';
import path from 'path';

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
 * Intermediate structure for course candidates before DB validation
 */
interface CourseCandidate {
    codeWithLetter: string;      // e.g., "CMPSC 431W" 
    codeWithoutLetter: string;   // e.g., "CMPSC 431"
    potentialSuffix: string;     // e.g., "W"
    descriptionWithLetter: string;    // Description if code has letter
    descriptionWithoutLetter: string; // Description if code has no letter
    attemptedCredits: number;
    earnedCredits: number;
    grade: string;
    term: string;
}

/**
 * Validate course codes against the database
 * Returns a Set of valid course codes that exist in the DB
 */
async function validateCourseCodes(candidateCodes: string[]): Promise<Set<string>> {
    if (candidateCodes.length === 0) {
        return new Set();
    }

    try {
        const dbPath = path.join(process.cwd(), 'lib', 'data', 'courses.db');
        const db = new Database(dbPath, { readonly: true });

        // Create placeholders for parameterized query
        const placeholders = candidateCodes.map(() => '?').join(',');
        const query = `SELECT id FROM courses WHERE id IN (${placeholders})`;

        const rows = db.prepare(query).all(...candidateCodes) as Array<{ id: string }>;
        db.close();

        const validCodes = new Set(rows.map(r => r.id));
        console.log(`[DB Validation] Checked ${candidateCodes.length} candidates, found ${validCodes.size} valid codes`);

        return validCodes;
    } catch (error) {
        console.error('[DB Validation] Error querying database:', error);
        // On error, return empty set - fallback to code without letter
        return new Set();
    }
}

/**
 * Parse a Penn State transcript PDF and extract courses
 * Uses two-pass validation: extract candidates, then validate against DB
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

        // PASS 1: Extract course candidates with both code variants
        const candidates = extractCourseCandidates(text);
        console.log(`Pass 1: Extracted ${candidates.length} course candidates`);

        // PASS 2: Validate codes against database
        const courses = await validateAndResolveCourses(candidates);
        console.log(`Pass 2: Resolved ${courses.length} validated courses`);

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
 * PASS 1: Extract course candidates from transcript text
 * Extracts BOTH potential course codes (with and without letter suffix)
 * 
 * Penn State format (from PDF): Text is concatenated without spaces
 * Example: ASTRO    6Stars and Galaxies3.0003.000B-8.010
 * Example: CMPSC  431WDatabase Mgmt Syst3.0003.000A12.000
 */
function extractCourseCandidates(text: string): CourseCandidate[] {
    const candidates: CourseCandidate[] = [];
    const lines = text.split('\n');

    // Track current term for context
    let currentTerm = '';

    // Pattern to match term headers (e.g., "FA 2022", "SP 2023", "SU 2023")
    const termPattern = /^(FA|SP|SU)\s+\d{4}$/;

    // Modified pattern to capture the potential letter suffix separately
    // Pattern breakdown:
    // ([A-Z]{2,6})\s+ - Department code with spaces
    // (\d{1,4}) - Course number (digits only)
    // ([A-Z]) - First letter after number (could be suffix OR start of description)
    // (.+?) - Rest of description (non-greedy)
    // (\d+\.\d{3}) - Attempted credits
    // (\d+\.\d{3}) - Earned credits  
    // \s*([A-Z][A-Z+-]*|LD|IP|TR|) - Grade (may have leading space)
    // (\d+\.\d{3}) - Points
    const coursePattern = /^([A-Z]{2,6})\s+(\d{1,4})([A-Z])(.+?)(\d+\.\d{3})(\d+\.\d{3})\s*([A-Z][A-Z+-]*|LD|IP|TR|)(\d+\.\d{3})$/;

    console.log('Pass 1: Starting course candidate extraction...');

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
            const [, dept, number, firstLetter, restOfDescription, attempted, earned, grade, points] = match;

            // Generate BOTH candidate codes
            const codeWithLetter = `${dept} ${number}${firstLetter}`;      // e.g., "CMPSC 431W"
            const codeWithoutLetter = `${dept} ${number}`;                  // e.g., "CMPSC 431"

            // Generate corresponding descriptions
            const descriptionWithLetter = restOfDescription.trim();         // Description starts after suffix
            const descriptionWithoutLetter = (firstLetter + restOfDescription).trim(); // Description includes first letter

            const attemptedCredits = parseFloat(attempted);
            const earnedCredits = parseFloat(earned);
            const gradeTrimmed = grade.trim();

            console.log(`Candidate: ${codeWithoutLetter} OR ${codeWithLetter}`);

            candidates.push({
                codeWithLetter,
                codeWithoutLetter,
                potentialSuffix: firstLetter,
                descriptionWithLetter,
                descriptionWithoutLetter,
                attemptedCredits,
                earnedCredits,
                grade: gradeTrimmed,
                term: currentTerm
            });
        }
    }

    console.log(`Pass 1 complete: ${candidates.length} candidates extracted`);
    return candidates;
}

/**
 * PASS 2: Validate candidates against database and resolve to final courses
 */
async function validateAndResolveCourses(candidates: CourseCandidate[]): Promise<ParsedCourse[]> {
    if (candidates.length === 0) {
        return [];
    }

    // Collect all candidate codes for batch validation
    const allCandidateCodes: string[] = [];
    for (const candidate of candidates) {
        allCandidateCodes.push(candidate.codeWithLetter);
        allCandidateCodes.push(candidate.codeWithoutLetter);
    }

    // Single batch query to validate all codes
    const validCodes = await validateCourseCodes(allCandidateCodes);

    console.log('Pass 2: Resolving course codes based on DB validation...');

    const courses: ParsedCourse[] = [];

    for (const candidate of candidates) {
        // Priority: If code WITH letter exists in DB, use it
        // Otherwise, use code WITHOUT letter (fallback)
        let finalCode: string;
        let finalDescription: string;

        if (validCodes.has(candidate.codeWithLetter)) {
            // DB confirms this is a course with a letter suffix (e.g., CMPSC 431W)
            finalCode = candidate.codeWithLetter;
            finalDescription = candidate.descriptionWithLetter;
            console.log(`  ✓ ${finalCode} - validated with suffix`);
        } else if (validCodes.has(candidate.codeWithoutLetter)) {
            // DB confirms this is a regular course (e.g., CMPSC 131)
            finalCode = candidate.codeWithoutLetter;
            finalDescription = candidate.descriptionWithoutLetter;
            console.log(`  ✓ ${finalCode} - validated without suffix`);
        } else {
            // Neither found in DB - use code without letter as fallback
            // This handles courses that might not be in our database yet
            finalCode = candidate.codeWithoutLetter;
            finalDescription = candidate.descriptionWithoutLetter;
            console.log(`  ? ${finalCode} - not in DB, using fallback`);
        }

        // Determine course status
        let status: ParsedCourse['status'] = 'completed';

        if (candidate.grade === 'IP') {
            status = 'in-progress';
        } else if (candidate.grade === 'LD') {
            status = 'dropped';
        } else if (candidate.grade === 'TR') {
            status = 'transfer';
        } else if (!candidate.grade && candidate.attemptedCredits > 0) {
            status = 'in-progress';
        } else if (candidate.earnedCredits > 0) {
            status = 'completed';
        } else {
            status = 'dropped';
        }

        // Only add courses that are completed, in-progress, or transfer
        if (status !== 'dropped') {
            courses.push({
                code: finalCode,
                name: finalDescription,
                credits: candidate.attemptedCredits,
                earnedCredits: candidate.earnedCredits,
                grade: candidate.grade || 'N/A',
                status: status,
                term: candidate.term
            });
        }
    }

    console.log(`Pass 2 complete: ${courses.length} courses resolved`);

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
