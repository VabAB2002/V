// test_with_mgmt.ts - Test Business Minor with MGMT 301 added

import {
    auditMinor,
    CompletedCourse,
} from '../src/index';
import { getCourseDetails } from '../src/engine/loader';

// User's ACTUAL completed courses
const actualCourses = [
    "ASTRO 6", "CMPSC 131", "ESL 15", "COMM 150N", "ECON 102", "ENGR 100",
    "KINES 84", "SPAN 131", "CMPSC 132", "CMPSC 221", "CMPSC 360", "ECON 104",
    "MATH 140", "PHYS 211", "BISC 3", "COMM 160", "DS 120", "EARTH 105N",
    "EGEE 101", "THEA 105", "CAS 100A", "ECON 302", "ECON 304", "ENGL 202C",
    "MATH 220", "STAT 184", "STAT 200", "CMPSC 465", "DS 220", "MATH 486",
    "CMPSC 431W", "DS 300", "DS 435", "ECON 442", "STAT 414", "ECON 471",
    "KINES 82", "STAT 415", "STAT 483", "STAT 484", "MATH 141", "MATH 230"
];

function createTranscript(courses: string[]): CompletedCourse[] {
    const grades = ['A', 'A-', 'B+', 'B', 'B-'];

    return courses.map(courseId => {
        const details = getCourseDetails(courseId);
        let credits = 3;

        if (details) {
            if (typeof details.credits === 'number') {
                credits = details.credits;
            } else if (details.credits?.min) {
                credits = details.credits.min;
            }
        }

        return {
            id: courseId,
            grade: grades[Math.floor(Math.random() * grades.length)],
            credits_awarded: credits,
        };
    });
}

console.log("=".repeat(80));
console.log("BUSINESS MINOR COMPARISON TEST");
console.log("=".repeat(80) + "\n");

// Test 1: WITHOUT MGMT 301 (current state)
console.log("📊 TEST 1: Current State (WITHOUT MGMT 301)\n");
const transcriptWithout = createTranscript(actualCourses);
const auditWithout = auditMinor(transcriptWithout, 'business_minor');

console.log(`Total Required: 19 credits`);
console.log(`Credits Earned: ${auditWithout.credits_earned}`);
console.log(`Gap: ${19 - auditWithout.credits_earned} credits`);
console.log(`Status: ${auditWithout.status}\n`);

console.log("Courses Applied:");
auditWithout.fulfilled_by.forEach((c: string) => console.log(`  - ${c}`));

console.log("\n" + "-".repeat(80) + "\n");

// Test 2: WITH MGMT 301 (after taking it for your major)
console.log("📊 TEST 2: After Taking MGMT 301 (for your Software Engineering major)\n");
const coursesWithMGMT = [...actualCourses, "MGMT 301"];
const transcriptWith = createTranscript(coursesWithMGMT);
const auditWith = auditMinor(transcriptWith, 'business_minor');

console.log(`Total Required: 19 credits`);
console.log(`Credits Earned: ${auditWith.credits_earned}`);
console.log(`Gap: ${19 - auditWith.credits_earned} credits`);
console.log(`Status: ${auditWith.status}\n`);

console.log("Courses Applied:");
auditWith.fulfilled_by.forEach((c: string) => console.log(`  - ${c}`));

console.log("\n" + "-".repeat(80) + "\n");

// Calculate the difference
const additionalNeeded = (19 - auditWith.credits_earned);
const improvementFromMGMT = auditWith.credits_earned - auditWithout.credits_earned;

console.log("📈 IMPACT ANALYSIS\n");
console.log(`Gap WITHOUT MGMT 301: ${19 - auditWithout.credits_earned} credits`);
console.log(`Gap WITH MGMT 301:    ${additionalNeeded} credits`);
console.log(`Improvement:           ${improvementFromMGMT} credits\n`);

console.log("=".repeat(80));
console.log("CONCLUSION");
console.log("=".repeat(80) + "\n");

console.log(`After taking MGMT 301 for your Software Engineering major,`);
console.log(`you would need ${additionalNeeded} ADDITIONAL credits to complete Business Minor.\n`);

console.log("Remaining Requirements:");
const stillNeed = [];
if (!auditWith.fulfilled_by.includes("ACCTG 211") &&
    !auditWith.fulfilled_by.includes("ACCTG 201") &&
    !auditWith.fulfilled_by.includes("ACCTG 202")) {
    stillNeed.push("ACCTG 211 (or ACCTG 201+202) - 4 credits");
}
if (!auditWith.fulfilled_by.includes("MKTG 301W")) {
    stillNeed.push("MKTG 301W - 3 credits");
}

if (stillNeed.length > 0) {
    stillNeed.forEach(req => console.log(`  ❌ ${req}`));
} else {
    console.log("  ✅ All requirements met!");
}

console.log("\n" + "=".repeat(80) + "\n");
