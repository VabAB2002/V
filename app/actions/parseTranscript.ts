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

// Intermediate structure for course candidates before DB validation
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

// Validate course codes against the database
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

// Parse Penn State transcript PDF and extract courses
export async function parseTranscriptPDF(fileBuffer: ArrayBuffer): Promise<ParsedCourse[]> {
    try {
        if (!fileBuffer || fileBuffer.byteLength === 0) {
            throw new Error('Invalid or empty file buffer');
        }

        const pdfParse = require('pdf-parse/lib/pdf-parse.js');
        const buffer = Buffer.from(fileBuffer);
        const data = await pdfParse(buffer);

        const text = data.text;
        if (!text || text.length === 0) {
            throw new Error('No text extracted from PDF');
        }

        // PASS 1: Extract course candidates with both code variants
        const candidates = extractCourseCandidates(text);

        // PASS 2: Validate codes against database
        const courses = await validateAndResolveCourses(candidates);

        return courses;
    } catch (error) {
        console.error('Error parsing PDF:', error);
        throw new Error(`Failed to parse transcript PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}


// Extract course candidates from transcript text
function extractCourseCandidates(text: string): CourseCandidate[] {
    const candidates: CourseCandidate[] = [];
    const lines = text.split('\n');

    // Track current term for context
    let currentTerm = '';

    // Pattern to match term headers (e.g., "FA 2022", "SP 2023", "SU 2023")
    const termPattern = /^(FA|SP|SU)\s+\d{4}$/;

    const coursePattern = /^([A-Z]{2,6})\s+(\d{1,4})([A-Z])(.+?)(\d+\.\d{3})(\d+\.\d{3})\s*([A-Z][A-Z+-]*|LD|IP|TR|)(\d+\.\d{3})$/;

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

// PASS 2: Validate candidates against database and resolve to final courses
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

// Convert parsed courses to simple course code array for the autocomplete
export async function extractCourseCodesFromParsed(courses: ParsedCourse[]): Promise<string[]> {
    return courses
        .filter(c => c.status === 'completed' || c.status === 'in-progress' || c.status === 'transfer')
        .map(c => c.code);
}

// Quick stats from parsed courses
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
