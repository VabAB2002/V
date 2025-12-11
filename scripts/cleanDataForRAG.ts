// Creates RAG-friendly documents from source data
// Usage: npx tsx scripts/cleanDataForRAG.ts

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), 'lib', 'data');
const RAG_DIR = path.join(DATA_DIR, 'rag');
const MAJORS_PATH = path.join(DATA_DIR, 'penn_state_majors.json');
const MINORS_PATH = path.join(DATA_DIR, 'penn_state_minors.json');
const GENED_PATH = path.join(DATA_DIR, 'gen_ed_requirements.json');

interface CleanedDocument {
    id: string;
    type: 'major' | 'minor' | 'gened' | 'summary';
    title: string;
    content: string;
}

// Extract course IDs from requirement nodes
function extractCourses(node: any): string[] {
    if (!node || typeof node !== 'object') return [];

    const courses: string[] = [];
    if (node.course) courses.push(node.course);
    if (Array.isArray(node.courses)) courses.push(...node.courses);
    if (Array.isArray(node.options)) courses.push(...node.options);
    if (Array.isArray(node.valid_courses)) courses.push(...node.valid_courses.slice(0, 15));
    if (Array.isArray(node.children)) {
        for (const child of node.children) {
            courses.push(...extractCourses(child));
        }
    }
    return [...new Set(courses)]; // Remove duplicates
}

function cleanMajors(): CleanedDocument[] {
    console.log('📚 Cleaning majors...');
    const documents: CleanedDocument[] = [];

    try {
        const data = JSON.parse(fs.readFileSync(MAJORS_PATH, 'utf-8'));
        const majorList: string[] = [];

        for (const [majorId, major] of Object.entries(data) as [string, any][]) {
            majorList.push(major.name || majorId);

            // Extract key courses from common requirements
            const allCourses: string[] = [];
            const commonReqs = major.common_requirements || {};
            if (commonReqs && typeof commonReqs === 'object') {
                for (const section of Object.values(commonReqs)) {
                    if (section && typeof section === 'object') {
                        allCourses.push(...extractCourses(section));
                    }
                }
            }
            const keyCourses = allCourses.slice(0, 20);

            // Extract specializations/options
            let specializations: string[] = [];
            if (major.sub_plans?.options && typeof major.sub_plans.options === 'object') {
                specializations = Object.values(major.sub_plans.options)
                    .filter((opt: any) => opt && opt.name)
                    .map((opt: any) => opt.name);
            }

            // Build clean content
            const content = `
Major: ${major.name || majorId}
Degree Type: ${major.degree_type || 'Bachelor of Science'}
Department: ${major.department || 'Unknown'}
Total Credits Required: ${major.credits_required || 120}
${specializations.length > 0 ? `Specializations/Options: ${specializations.join(', ')}` : ''}
${keyCourses.length > 0 ? `Key Required Courses: ${keyCourses.join(', ')}` : ''}
${major.entrance_requirements ? 'Has specific entrance requirements.' : ''}
            `.trim();

            documents.push({
                id: `major:${majorId}`,
                type: 'major',
                title: major.name || majorId,
                content
            });
        }

        // Add summary document
        documents.push({
            id: 'summary:majors',
            type: 'summary',
            title: 'All Penn State World Campus Majors',
            content: `
Penn State World Campus offers ${majorList.length} majors.

Complete list of majors:
${majorList.map((m, i) => `${i + 1}. ${m}`).join('\n')}

Total: ${majorList.length} majors available.
            `.trim()
        });

        console.log(`   ✓ Cleaned ${documents.length} major documents (including summary)`);
    } catch (error) {
        console.error('Error cleaning majors:', error);
    }

    return documents;
}

function cleanMinors(): CleanedDocument[] {
    console.log('📚 Cleaning minors...');
    const documents: CleanedDocument[] = [];

    try {
        const data = JSON.parse(fs.readFileSync(MINORS_PATH, 'utf-8'));
        const minors = data.minors || data;
        const minorList: string[] = [];

        for (const [minorId, minor] of Object.entries(minors) as [string, any][]) {
            const minorName = minor.minor_name || minorId;
            minorList.push(minorName);

            // Extract key courses
            const keyCourses = extractCourses(minor.requirements || {}).slice(0, 15);

            const content = `
Minor: ${minorName}
Department: ${minor.department || 'Unknown'}
Credits Required: ${minor.total_credits_required || 'Varies'}
${minor.description ? `Description: ${minor.description}` : ''}
${keyCourses.length > 0 ? `Key Courses: ${keyCourses.join(', ')}` : ''}
            `.trim();

            documents.push({
                id: `minor:${minorId}`,
                type: 'minor',
                title: minorName,
                content
            });
        }

        // Add summary document
        documents.push({
            id: 'summary:minors',
            type: 'summary',
            title: 'All Penn State World Campus Minors',
            content: `
Penn State World Campus offers ${minorList.length} minors.

Complete list of minors:
${minorList.map((m, i) => `${i + 1}. ${m}`).join('\n')}

Total: ${minorList.length} minors available.
            `.trim()
        });

        console.log(`   ✓ Cleaned ${documents.length} minor documents (including summary)`);
    } catch (error) {
        console.error('Error cleaning minors:', error);
    }

    return documents;
}

function cleanGenEd(): CleanedDocument[] {
    console.log('📚 Cleaning GenEd requirements...');
    const documents: CleanedDocument[] = [];

    try {
        const data = JSON.parse(fs.readFileSync(GENED_PATH, 'utf-8'));
        const genEdReqs = data.gen_ed_requirements;

        // Overview document
        const categories = genEdReqs.categories || {};
        const categoryNames = Object.values(categories).map((c: any) => c.label);

        documents.push({
            id: 'gened:overview',
            type: 'gened',
            title: 'Penn State General Education Overview',
            content: `
Penn State General Education Requirements Overview

Total GenEd Credits Required: ${genEdReqs.total_credits || 45} credits

Categories:
${categoryNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}

General Education ensures students develop skills in:
- Quantification (math and analytical thinking)
- Writing and Speaking (communication skills)
- Knowledge Domains (arts, humanities, natural sciences, social sciences)
- Health and Wellness
- Integrative Studies and Inter-Domain connections
            `.trim()
        });

        // Individual category documents
        for (const [catKey, category] of Object.entries(categories) as [string, any][]) {
            const subcategories = category.subcategories || {};
            const subNames = Object.values(subcategories)
                .map((sub: any) => `${sub.label} (${sub.credits_required || sub.total_credits || '?'} credits)`)
                .join(', ');

            documents.push({
                id: `gened:${catKey}`,
                type: 'gened',
                title: `GenEd: ${category.label}`,
                content: `
GenEd Category: ${category.label}
Credits Required: ${category.total_credits || 'Varies'}
${subNames ? `Subcategories: ${subNames}` : ''}
                `.trim()
            });
        }

        console.log(`   ✓ Cleaned ${documents.length} GenEd documents`);
    } catch (error) {
        console.error('Error cleaning GenEd:', error);
    }

    return documents;
}

async function main() {
    console.log('🧹 Starting data cleaning for RAG...\n');

    // Create RAG directory if it doesn't exist
    if (!fs.existsSync(RAG_DIR)) {
        fs.mkdirSync(RAG_DIR, { recursive: true });
        console.log(`📁 Created ${RAG_DIR}\n`);
    }

    // Clean all data
    const majors = cleanMajors();
    const minors = cleanMinors();
    const genEd = cleanGenEd();

    const allDocuments = [...majors, ...minors, ...genEd];

    // Save to file
    const outputPath = path.join(RAG_DIR, 'cleaned_documents.json');
    fs.writeFileSync(outputPath, JSON.stringify(allDocuments, null, 2));

    console.log(`\n✅ Saved ${allDocuments.length} cleaned documents to:`);
    console.log(`   ${outputPath}`);

    // Print summary
    console.log('\n📊 Summary:');
    console.log(`   - Majors: ${majors.length} documents`);
    console.log(`   - Minors: ${minors.length} documents`);
    console.log(`   - GenEd: ${genEd.length} documents`);
    console.log(`   - Total: ${allDocuments.length} documents`);
}

main();
