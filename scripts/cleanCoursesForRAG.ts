// Extracts courses with GenEd attributes for Pinecone upload
// Run: npx ts-node scripts/cleanCoursesForRAG.ts

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

// GenEd attribute labels for human-readable descriptions
const GENED_LABELS: Record<string, string> = {
    'GA': 'Arts (GA)',
    'GH': 'Humanities (GH)',
    'GN': 'Natural Sciences (GN)',
    'GS': 'Social and Behavioral Sciences (GS)',
    'GQ': 'Quantification (GQ)',
    'GWS': 'Writing/Speaking (GWS)',
    'GHW': 'Health and Wellness (GHW)',
    'interdomain': 'Inter-Domain',
    'US': 'US Cultures',
    'IL': 'International Cultures'
};

interface CourseRow {
    id: string;
    name: string;
    credits_min: number | null;
    credits_max: number | null;
    department: string;
    level: number;
    gen_ed_json: string;
}

interface CleanedDocument {
    id: string;
    type: string;
    title: string;
    content: string;
}

function main() {
    console.log('🚀 Starting course data cleaning for RAG...\n');

    // Open SQLite database
    const dbPath = path.join(process.cwd(), 'lib', 'data', 'courses.db');
    const db = new Database(dbPath, { readonly: true });

    // Query courses with GenEd attributes
    const query = `
        SELECT id, name, credits_min, credits_max, department, level, gen_ed_json
        FROM courses
        WHERE gen_ed_json IS NOT NULL AND gen_ed_json != '[]'
        ORDER BY department, level, id
    `;

    const rows = db.prepare(query).all() as CourseRow[];
    console.log(`📊 Found ${rows.length} courses with GenEd attributes\n`);

    const documents: CleanedDocument[] = [];

    for (const row of rows) {
        // Parse GenEd attributes
        let genEdAttrs: string[] = [];
        try {
            genEdAttrs = JSON.parse(row.gen_ed_json || '[]');
        } catch {
            continue; // Skip if invalid JSON
        }

        if (genEdAttrs.length === 0) continue;

        // Format GenEd attributes for human readability
        const genEdLabels = genEdAttrs
            .map(attr => GENED_LABELS[attr] || attr)
            .join(', ');

        // Calculate credits display
        const credits = row.credits_min
            ? (row.credits_max && row.credits_max !== row.credits_min
                ? `${row.credits_min}-${row.credits_max}`
                : `${row.credits_min}`)
            : '3';

        // Create document ID (sanitized for Pinecone)
        const docId = `course:${row.id.replace(/\s+/g, '_')}`;

        // Build rich content for RAG
        const content = [
            `Course: ${row.id} - ${row.name || 'No title available'}`,
            `Credits: ${credits}`,
            `Department: ${row.department || 'Unknown'}`,
            `Level: ${row.level || 'Unknown'}`,
            ``,
            `General Education Attributes: ${genEdLabels}`,
            ``,
            `This course satisfies the following Penn State general education requirements: ${genEdAttrs.join(', ')}.`,
            genEdAttrs.includes('interdomain')
                ? 'This is an Inter-Domain course that integrates multiple knowledge areas.'
                : '',
            genEdAttrs.length > 1
                ? `Taking this course can satisfy multiple GenEd requirements at once (${genEdAttrs.join(' and ')}).`
                : ''
        ].filter(line => line).join('\n');

        documents.push({
            id: docId,
            type: 'course',
            title: `${row.id}: ${row.name || 'Course'}`,
            content
        });
    }

    db.close();

    // Save to JSON file
    const outputPath = path.join(process.cwd(), 'lib', 'data', 'rag', 'cleaned_courses.json');
    fs.writeFileSync(outputPath, JSON.stringify(documents, null, 2));

    console.log(`✅ Successfully created ${documents.length} course documents`);
    console.log(`📁 Saved to: ${outputPath}`);

    // Print sample
    console.log('\n📝 Sample document:');
    console.log(JSON.stringify(documents[0], null, 2));

    // Print stats by GenEd type
    console.log('\n📈 GenEd Distribution:');
    const genEdCounts: Record<string, number> = {};
    for (const doc of documents) {
        const matches = doc.content.match(/Penn State general education requirements: ([^\n.]+)/);
        if (matches) {
            const attrs = matches[1].split(', ');
            for (const attr of attrs) {
                genEdCounts[attr] = (genEdCounts[attr] || 0) + 1;
            }
        }
    }
    Object.entries(genEdCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([attr, count]) => {
            console.log(`  ${GENED_LABELS[attr] || attr}: ${count} courses`);
        });
}

main();
