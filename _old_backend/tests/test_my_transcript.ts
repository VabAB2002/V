// test_my_transcript.ts - Test with user's actual Software Engineering transcript

import {
    CompletedCourse,
    auditMajor,
    auditMinor,
    auditGenEd,
    recommendMinors,
    getCourseDetails,
    getComprehensiveAudit,
} from '../src/index';

/**
 * Parse course list and create transcript with realistic grades/credits
 */
function createTranscript(courseList: string): CompletedCourse[] {
    const courseIds = courseList
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0);

    const transcript: CompletedCourse[] = [];
    const grades = ['A', 'A-', 'B+', 'B', 'B-']; // Good grades for realistic scenario

    for (const courseId of courseIds) {
        // Get actual course details to determine credits
        const details = getCourseDetails(courseId);
        let credits = 3; // Default

        if (details) {
            if (typeof details.credits === 'number') {
                credits = details.credits;
            } else if (details.credits && typeof details.credits === 'object') {
                credits = details.credits.min; // Use minimum for variable credit courses
            }
        }

        // Assign a random good grade
        const grade = grades[Math.floor(Math.random() * grades.length)];

        transcript.push({
            id: courseId,
            grade: grade,
            credits_awarded: credits,
        });
    }

    return transcript;
}

/**
 * Main test function
 */
function main() {
    console.log("\n" + "=".repeat(70));
    console.log("  SOFTWARE ENGINEERING DEGREE AUDIT - YOUR ACTUAL TRANSCRIPT");
    console.log("=".repeat(70) + "\n");

    // User's completed courses
    const courseList = `
    ASTRO 6, CMPSC 131, ESL 15, COMM 150N, ECON 102, ENGR 100, KINES 84,
    SPAN 131, CMPSC 132, CMPSC 221, CMPSC 360, ECON 104, MATH 140, PHYS 211,
        BISC 3, COMM 160, DS 120, EARTH 105N, EGEE 101, THEA 105, CAS 100A,
            ECON 302, ECON 304, ENGL 202C, MATH 220, STAT 184, STAT 200, CMPSC 465,
                DS 220, MATH 486, CMPSC 431W, DS 300, DS 435, ECON 442, STAT 414,
                    ECON 471, KINES 82, STAT 415, STAT 483, STAT 484, MATH 141, MATH 230
  `;

    const transcript = createTranscript(courseList);

    console.log(`📚 Total Courses Completed: ${transcript.length} `);
    console.log(`📊 Total Credits: ${transcript.reduce((sum, c) => sum + c.credits_awarded, 0)} `);
    console.log("\n" + "-".repeat(70) + "\n");

    try {
        // Test 1: Audit Software Engineering Major
        console.log("🎓 MAJOR AUDIT: Software Engineering\n");
        const majorAudit = auditMajor(transcript, "software_engineering_bs");

        if (majorAudit.missing_reason && majorAudit.missing_reason.includes("not found")) {
            console.log("⚠️  Software Engineering major not found in database.");
            console.log("   Checking available majors with 'software' or 'engineering'...\n");

            // Try to find similar majors
            const { getAllMajorIds } = require('./engine/loader');
            const allMajors = getAllMajorIds();
            const similar = allMajors.filter((id: string) =>
                id.includes('software') || id.includes('engineering') || id.includes('computer')
            );

            console.log("   Available related majors:");
            similar.forEach((id: string) => console.log(`   - ${id} `));
        } else {
            console.log(`   Status: ${majorAudit.status} `);
            console.log(`   Credits Earned: ${majorAudit.credits_earned} / ${majorAudit.credits_required}`);
            console.log(`   Completion: ${((majorAudit.credits_earned / majorAudit.credits_required) * 100).toFixed(1)}%`);

            if (majorAudit.remaining_credits) {
                console.log(`   Remaining: ${majorAudit.remaining_credits} credits`);
            }

            console.log(`\n   Courses Applied to Major: ${majorAudit.fulfilled_by.length}`);
            if (majorAudit.fulfilled_by.length > 0) {
                console.log(`   ${majorAudit.fulfilled_by.join(', ')}`);
            }
        }

        console.log("\n" + "-".repeat(70) + "\n");

        // Test 2: GenEd Audit
        console.log("📖 GENERAL EDUCATION AUDIT\n");
        const genEdAudit = auditGenEd(transcript);

        console.log(`   Status: ${genEdAudit.status}`);
        console.log(`   Credits Earned: ${genEdAudit.credits_earned} / ${genEdAudit.credits_required}`);
        console.log(`   Completion: ${((genEdAudit.credits_earned / genEdAudit.credits_required) * 100).toFixed(1)}%`);

        if (genEdAudit.children_results) {
            console.log("\n   Category Breakdown:");
            for (const category of genEdAudit.children_results) {
                const status = category.status === 'MET' ? '✅' :
                    category.status === 'PARTIAL' ? '🟡' : '❌';
                console.log(`   ${status} ${category.label}: ${category.credits_earned}/${category.credits_required} credits`);
            }
        }

        console.log("\n" + "-".repeat(70) + "\n");

        // Test 3: Minor Recommendations
        console.log("🎯 RECOMMENDED MINORS (Top 10)\n");
        const recommendations = recommendMinors(
            transcript,
            'software_engineering_bs', // ⭐ Your major (works for ANY major!)
            {
                topN: 10,
                minCompletion: 5  // At least 5% complete
            }
        );

        console.log("📝 Note: Gap credits shown are ADDITIONAL credits needed beyond");
        console.log("         your Software Engineering major requirements.\n");
        if (recommendations.length === 0) {
            console.log("   No minor recommendations found (this may indicate a data loading issue).");
        } else {
            recommendations.forEach((rec, i) => {
                console.log(`${i + 1}. ${rec.minor_name}`);
                console.log(`   ├─ Completion: ${rec.completion_percentage.toFixed(1)}%`);
                console.log(`   ├─ Gap: ${rec.gap_credits} credits needed`);
                console.log(`   ├─ Credits: ${rec.completed_credits} / ${rec.total_credits_required}`);
                console.log(`   ├─ GenEd Overlap: ${rec.gen_ed_overlap.length} courses`);
                console.log(`   └─ Score: ${rec.strategic_score.toFixed(2)}`);

                if (rec.gen_ed_overlap.length > 0) {
                    console.log(`      GenEd courses: ${rec.gen_ed_overlap.map(o => o.course_id).join(', ')}`);
                }
                console.log();
            });
        }

        console.log("-".repeat(70) + "\n");

        // Test 4: Detailed look at top recommendation
        if (recommendations.length > 0) {
            const topMinor = recommendations[0];
            console.log(`📋 DETAILED AUDIT: ${topMinor.minor_name}\n`);

            console.log(`   Status: ${topMinor.audit_result.status}`);
            console.log(`   Credits: ${topMinor.audit_result.credits_earned} / ${topMinor.audit_result.credits_required}`);
            console.log(`   Courses Used: ${topMinor.audit_result.fulfilled_by.length}`);

            if (topMinor.audit_result.fulfilled_by.length > 0) {
                console.log(`\n   Completed Courses Applied:`);
                topMinor.audit_result.fulfilled_by.forEach(course => {
                    console.log(`   - ${course}`);
                });
            }

            if (topMinor.missing_courses.length > 0) {
                console.log(`\n   Suggested Next Courses:`);
                topMinor.missing_courses.slice(0, 5).forEach(course => {
                    console.log(`   - ${course}`);
                });
            }

            console.log("\n" + "-".repeat(70) + "\n");
        }

        // Test 5: Quick stats
        console.log("📊 QUICK STATISTICS\n");

        const totalCredits = transcript.reduce((sum, c) => sum + c.credits_awarded, 0);
        const uniqueDepartments = new Set(
            transcript
                .map(c => c.id.split(' ')[0])
                .filter(d => d)
        );

        console.log(`   Total Credits Completed: ${totalCredits}`);
        console.log(`   Total Courses: ${transcript.length}`);
        console.log(`   Unique Departments: ${uniqueDepartments.size}`);
        console.log(`   Departments: ${Array.from(uniqueDepartments).sort().join(', ')}`);

        // Count courses by department
        const deptCounts = new Map<string, number>();
        for (const course of transcript) {
            const dept = course.id.split(' ')[0];
            deptCounts.set(dept, (deptCounts.get(dept) || 0) + 1);
        }

        console.log(`\n   Top Departments by Course Count:`);
        const sorted = Array.from(deptCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        sorted.forEach(([dept, count]) => {
            console.log(`   - ${dept}: ${count} courses`);
        });

    } catch (error) {
        console.error("\n❌ Error during audit:", error);
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Stack trace:", error.stack);
        }
    }

    console.log("\n" + "=".repeat(70));
    console.log("  END OF AUDIT");
    console.log("=".repeat(70) + "\n");
}

// Run the test
if (require.main === module) {
    main();
}

export { main };
