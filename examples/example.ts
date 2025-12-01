// example.ts - Sample usage of the Degree Audit Engine

import {
    auditMajor,
    auditMinor,
    auditGenEd,
    recommendMinors,
    getComprehensiveAudit,
    findGenEdOverlaps,
    CompletedCourse,
} from '../src/index';

/**
 * Sample student transcript
 */
const sampleTranscript: CompletedCourse[] = [
    // Business Core Courses
    { id: "ACCTG 211", grade: "B", credits_awarded: 4 },
    { id: "ECON 102", grade: "A", credits_awarded: 3 },
    { id: "ECON 104", grade: "A-", credits_awarded: 3 },
    { id: "MGMT 301", grade: "B+", credits_awarded: 3 },
    { id: "MKTG 301W", grade: "A-", credits_awarded: 3 },
    { id: "FIN 301", grade: "B", credits_awarded: 3 },

    // Math & Statistics
    { id: "MATH 110", grade: "C+", credits_awarded: 4 },
    { id: "STAT 200", grade: "C", credits_awarded: 4 },

    // GenEd Courses (with some overlap potential)
    { id: "ENGL 15", grade: "B", credits_awarded: 3 },
    { id: "ENGL 202D", grade: "A", credits_awarded: 3 },
    { id: "CAS 100", grade: "A-", credits_awarded: 3 },
    { id: "PSYCH 100", grade: "B+", credits_awarded: 3 },

    // Additional courses
    { id: "BA 243", grade: "B", credits_awarded: 3 },
    { id: "MIS 204", grade: "B-", credits_awarded: 3 },
];

/**
 * Example 1: Audit a major
 */
function example1_AuditMajor() {
    console.log("=".repeat(60));
    console.log("EXAMPLE 1: Major Audit");
    console.log("=".repeat(60));

    const majorAudit = auditMajor(sampleTranscript, "accounting_bs");

    console.log(`\nMajor: ${majorAudit.label}`);
    console.log(`Status: ${majorAudit.status}`);
    console.log(`Credits Earned: ${majorAudit.credits_earned} / ${majorAudit.credits_required}`);
    console.log(`Remaining: ${majorAudit.remaining_credits || 0} credits`);

    if (majorAudit.children_results) {
        console.log(`\nRequirement Breakdown:`);
        for (const child of majorAudit.children_results) {
            console.log(`  - ${child.label}: ${child.status} (${child.credits_earned}/${child.credits_required} credits)`);
        }
    }

    console.log(`\nCourses Applied:`);
    majorAudit.fulfilled_by.forEach(course => console.log(`  - ${course}`));
}

/**
 * Example 2: Audit a minor
 */
function example2_AuditMinor() {
    console.log("\n" + "=".repeat(60));
    console.log("EXAMPLE 2: Minor Audit");
    console.log("=".repeat(60));

    const minorAudit = auditMinor(sampleTranscript, "business_minor");

    console.log(`\nMinor: ${minorAudit.label}`);
    console.log(`Status: ${minorAudit.status}`);
    console.log(`Credits Earned: ${minorAudit.credits_earned} / ${minorAudit.credits_required}`);
    console.log(`Remaining: ${minorAudit.remaining_credits || 0} credits`);

    if (minorAudit.children_results) {
        console.log(`\nRequirement Sections:`);
        for (const child of minorAudit.children_results) {
            console.log(`  - ${child.label}: ${child.status} (${child.credits_earned}/${child.credits_required} credits)`);
        }
    }
}

/**
 * Example 3: Minor recommendations
 */
function example3_RecommendMinors() {
    console.log("\n" + "=".repeat(60));
    console.log("EXAMPLE 3: Minor Recommendations");
    console.log("=".repeat(60));

    const recommendations = recommendMinors(sampleTranscript, "software_engineering_bs", {
        topN: 5,
        minCompletion: 10, // At least 10% complete
    });

    console.log(`\nTop ${recommendations.length} Recommended Minors:\n`);

    for (let i = 0; i < recommendations.length; i++) {
        const rec = recommendations[i];
        console.log(`${i + 1}. ${rec.minor_name}`);
        console.log(`   Status: ${rec.completion_percentage.toFixed(1)}% complete`);
        console.log(`   Gap: ${rec.gap_credits} credits needed`);
        console.log(`   GenEd Overlap: ${rec.gen_ed_overlap.length} courses`);
        console.log(`   Strategic Score: ${rec.strategic_score.toFixed(2)}`);

        if (rec.gen_ed_overlap.length > 0) {
            console.log(`   Overlapping GenEd Courses:`);
            rec.gen_ed_overlap.forEach(overlap => {
                console.log(`     - ${overlap.course_id} (${overlap.gen_ed_categories.join(', ')})`);
            });
        }
        console.log();
    }
}

/**
 * Example 4: GenEd audit
 */
function example4_AuditGenEd() {
    console.log("=".repeat(60));
    console.log("EXAMPLE 4: General Education Audit");
    console.log("=".repeat(60));

    const genEdAudit = auditGenEd(sampleTranscript);

    console.log(`\nGenEd Status: ${genEdAudit.status}`);
    console.log(`Credits Earned: ${genEdAudit.credits_earned} / ${genEdAudit.credits_required}`);

    if (genEdAudit.children_results) {
        console.log(`\nGenEd Category Breakdown:`);
        for (const category of genEdAudit.children_results) {
            console.log(`\n  ${category.label}: ${category.status}`);
            console.log(`  Credits: ${category.credits_earned} / ${category.credits_required}`);

            if (category.children_results) {
                for (const component of category.children_results) {
                    const symbol = component.status === 'MET' ? '✓' : '✗';
                    console.log(`    ${symbol} ${component.label}: ${component.status}`);
                }
            }
        }
    }
}

/**
 * Example 5: Comprehensive audit
 */
function example5_ComprehensiveAudit() {
    console.log("\n" + "=".repeat(60));
    console.log("EXAMPLE 5: Comprehensive Degree Audit");
    console.log("=".repeat(60));

    const audit = getComprehensiveAudit(sampleTranscript, "business_bs");

    console.log(`\n=== DEGREE PROGRESS SUMMARY ===\n`);
    console.log(`Total Credits Completed: ${audit.summary.total_credits_completed}`);
    console.log(`Major Completion: ${audit.summary.major_completion_percentage.toFixed(1)}%`);
    console.log(`GenEd Completion: ${audit.summary.gen_ed_completion_percentage.toFixed(1)}%`);

    console.log(`\n=== MAJOR REQUIREMENTS ===`);
    console.log(`Status: ${audit.major.status}`);
    console.log(`Credits: ${audit.major.credits_earned} / ${audit.major.credits_required}`);

    console.log(`\n=== GENERAL EDUCATION ===`);
    console.log(`Status: ${audit.genEd.status}`);
    console.log(`Credits: ${audit.genEd.credits_earned} / ${audit.genEd.credits_required}`);

    console.log(`\n=== TOP MINOR RECOMMENDATIONS ===`);
    audit.recommendedMinors.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec.minor_name} (${rec.gap_credits} credits needed, ${rec.completion_percentage.toFixed(1)}% complete)`);
    });
}

/**
 * Example 6: Finding GenEd overlaps
 */
function example6_GenEdOverlaps() {
    console.log("\n" + "=".repeat(60));
    console.log("EXAMPLE 6: GenEd Overlap Analysis");
    console.log("=".repeat(60));

    const minorId = "business_minor";
    const overlaps = findGenEdOverlaps(sampleTranscript, minorId);

    console.log(`\nGenEd courses that count toward ${minorId}:\n`);

    if (overlaps.length === 0) {
        console.log("  No overlapping courses found.");
    } else {
        overlaps.forEach(overlap => {
            console.log(`  - ${overlap.course_id}`);
            console.log(`    GenEd Categories: ${overlap.gen_ed_categories.join(', ')}`);
            console.log(`    Credits: ${overlap.credits}`);
        });
    }
}

/**
 * Example 7: What-if scenario (testing adding a course)
 */
function example7_WhatIfScenario() {
    console.log("\n" + "=".repeat(60));
    console.log("EXAMPLE 7: What-If Scenario Analysis");
    console.log("=".repeat(60));

    const minorId = "finance_minor";

    // Current state
    const currentAudit = auditMinor(sampleTranscript, minorId);

    // What if we add FIN 420?
    const whatIfTranscript = [
        ...sampleTranscript,
        { id: "FIN 420", grade: "A", credits_awarded: 3 },
    ];
    const whatIfAudit = auditMinor(whatIfTranscript, minorId);

    console.log(`\n=== Current State ===`);
    console.log(`Finance Minor Status: ${currentAudit.status}`);
    console.log(`Credits: ${currentAudit.credits_earned} / ${currentAudit.credits_required}`);
    console.log(`Remaining: ${currentAudit.remaining_credits || 0} credits`);

    console.log(`\n=== What If: Adding FIN 420 ===`);
    console.log(`Finance Minor Status: ${whatIfAudit.status}`);
    console.log(`Credits: ${whatIfAudit.credits_earned} / ${whatIfAudit.credits_required}`);
    console.log(`Remaining: ${whatIfAudit.remaining_credits || 0} credits`);
    console.log(`Impact: ${(currentAudit.remaining_credits || 0) - (whatIfAudit.remaining_credits || 0)} credits closer`);
}

/**
 * Run all examples
 */
function main() {
    console.log("\n");
    console.log("╔═══════════════════════════════════════════════════════════╗");
    console.log("║  Penn State Degree Audit & Recommendation Engine Demo    ║");
    console.log("╚═══════════════════════════════════════════════════════════╝");

    try {
        example1_AuditMajor();
        example2_AuditMinor();
        example3_RecommendMinors();
        example4_AuditGenEd();
        example5_ComprehensiveAudit();
        example6_GenEdOverlaps();
        example7_WhatIfScenario();

        console.log("\n" + "=".repeat(60));
        console.log("All examples completed successfully!");
        console.log("=".repeat(60) + "\n");
    } catch (error) {
        console.error("\n❌ Error running examples:", error);
        if (error instanceof Error) {
            console.error("Stack trace:", error.stack);
        }
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main();
}

export { main };
