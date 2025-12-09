/**
 * Initialize RAG - Populate Pinecone with course data
 * Usage: npx tsx scripts/initializeRAG.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import Database from 'better-sqlite3';
import { GoogleGenAI } from '@google/genai';
import { Pinecone } from '@pinecone-database/pinecone';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const DATA_DIR = path.join(process.cwd(), 'lib', 'data');
const DB_PATH = path.join(DATA_DIR, 'courses.db');
const MAJORS_PATH = path.join(DATA_DIR, 'penn_state_majors.json');
const MINORS_PATH = path.join(DATA_DIR, 'penn_state_minors.json');
const GENED_PATH = path.join(DATA_DIR, 'gen_ed_requirements.json');

interface RawDocument {
    id: string;
    type: string;
    content: string;
}

interface EmbeddedDocument {
    id: string;
    values: number[];
    metadata: Record<string, string | number | boolean | string[]>;
}

const BATCH_SIZE = 50;

// Initialize clients
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY || '' });

/**
 * Generate embeddings using Gemini
 */
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const text of texts) {
        try {
            // Add 2 second delay between calls to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 2000));

            const result = await genai.models.embedContent({
                model: 'gemini-embedding-001',
                contents: text
            });

            if (result.embeddings?.[0]?.values) {
                embeddings.push(result.embeddings[0].values);
                console.log(`     ✓ Embedded (${embeddings.length}/${texts.length})`);
            } else {
                console.log(`     ⚠ Empty embedding`);
                embeddings.push([]);
            }
        } catch (error: any) {
            console.error(`     ✗ Error: ${error.message?.substring(0, 50) || 'Unknown'}`);
            embeddings.push([]);
        }
    }

    return embeddings;
}

/**
 * Extract courses from requirement node safely
 */
function extractCoursesFromRequirement(node: any): string[] {
    if (!node || typeof node !== 'object') return [];

    const courses: string[] = [];
    if (node.course) courses.push(node.course);
    if (Array.isArray(node.courses)) courses.push(...node.courses);
    if (Array.isArray(node.options)) courses.push(...node.options);
    if (Array.isArray(node.valid_courses)) courses.push(...node.valid_courses.slice(0, 10));
    if (Array.isArray(node.children)) {
        for (const child of node.children) {
            courses.push(...extractCoursesFromRequirement(child));
        }
    }
    return courses;
}

/**
 * Load course documents from SQLite - using correct schema
 */
function loadCourseDocuments(): RawDocument[] {
    const documents: RawDocument[] = [];

    try {
        const db = new Database(DB_PATH);
        // Correct column names: id, name, gen_ed_json
        const courses = db.prepare(`
            SELECT id, name, credits_min, credits_max, department, level, gen_ed_json
            FROM courses LIMIT 5000
        `).all() as any[];

        for (const course of courses) {
            const credits = course.credits_min === course.credits_max
                ? `${course.credits_min}`
                : `${course.credits_min}-${course.credits_max}`;

            let genEdAttrs: string[] = [];
            if (course.gen_ed_json) {
                try {
                    const parsed = JSON.parse(course.gen_ed_json);
                    if (Array.isArray(parsed)) genEdAttrs = parsed;
                } catch { }
            }

            const content = `Course: ${course.id}
Title: ${course.name || 'No title'}
Credits: ${credits}
Department: ${course.department || course.id.split(' ')[0]}
Level: ${course.level || 'N/A'}
GenEd: ${genEdAttrs.length > 0 ? genEdAttrs.join(', ') : 'None'}`;

            documents.push({
                id: `course:${course.id.replace(/\s+/g, '_')}`,
                type: 'course',
                content
            });
        }

        db.close();
        console.log(`✓ Loaded ${documents.length} course documents`);
    } catch (error) {
        console.error('Error loading courses:', error);
    }

    return documents;
}

/**
 * Load minor documents
 */
function loadMinorDocuments(): RawDocument[] {
    const documents: RawDocument[] = [];

    try {
        const data = JSON.parse(fs.readFileSync(MINORS_PATH, 'utf-8'));
        const minors = data.minors || data;

        for (const [minorId, minor] of Object.entries(minors) as [string, any][]) {
            const requiredCourses = extractCoursesFromRequirement(minor.requirements || {});
            const uniqueCourses = [...new Set(requiredCourses)].slice(0, 20);

            const content = `Minor: ${minor.minor_name || minorId}
Department: ${minor.department || 'Various'}
Credits Required: ${minor.total_credits_required || 'Varies'}
Description: ${minor.description || 'No description'}
Key Courses: ${uniqueCourses.length > 0 ? uniqueCourses.join(', ') : 'See requirements'}`;

            documents.push({ id: `minor:${minorId}`, type: 'minor', content });
        }

        console.log(`✓ Loaded ${documents.length} minor documents`);
    } catch (error) {
        console.error('Error loading minors:', error);
    }

    return documents;
}

/**
 * Load major documents
 */
function loadMajorDocuments(): RawDocument[] {
    const documents: RawDocument[] = [];

    try {
        const data = JSON.parse(fs.readFileSync(MAJORS_PATH, 'utf-8'));

        for (const [majorId, major] of Object.entries(data) as [string, any][]) {
            const commonReqs = major.common_requirements || {};
            const allCourses: string[] = [];

            // Safely iterate over requirement sections
            if (commonReqs && typeof commonReqs === 'object') {
                for (const section of Object.values(commonReqs)) {
                    if (section && typeof section === 'object') {
                        allCourses.push(...extractCoursesFromRequirement(section));
                    }
                }
            }

            const uniqueCourses = [...new Set(allCourses)].slice(0, 25);

            let subPlansInfo = '';
            if (major.sub_plans?.options && typeof major.sub_plans.options === 'object') {
                const optionNames = Object.values(major.sub_plans.options)
                    .filter((opt: any) => opt && opt.name)
                    .map((opt: any) => opt.name).join(', ');
                if (optionNames) subPlansInfo = `\nSpecializations: ${optionNames}`;
            }

            const content = `Major: ${major.name || majorId}
Degree: ${major.degree_type || 'Bachelor\'s'}
Department: ${major.department || 'Various'}
Credits Required: ${major.credits_required || 120}${subPlansInfo}
Key Courses: ${uniqueCourses.length > 0 ? uniqueCourses.join(', ') : 'See requirements'}`;

            documents.push({ id: `major:${majorId}`, type: 'major', content });
        }

        console.log(`✓ Loaded ${documents.length} major documents`);
    } catch (error) {
        console.error('Error loading majors:', error);
    }

    return documents;
}

/**
 * Load GenEd documents
 */
function loadGenEdDocuments(): RawDocument[] {
    const documents: RawDocument[] = [];

    try {
        const data = JSON.parse(fs.readFileSync(GENED_PATH, 'utf-8'));
        const genEdReqs = data.gen_ed_requirements;

        documents.push({
            id: 'gened:overview',
            type: 'gened',
            content: `Penn State General Education Requirements
Total Credits: ${genEdReqs.total_credits || 45}
Categories: Foundations (Writing/Speaking, Quantification), Knowledge Domains, Integrative Studies, Exploration`
        });

        const categories = genEdReqs.categories || {};
        for (const [catKey, category] of Object.entries(categories) as [string, any][]) {
            documents.push({
                id: `gened:${catKey}`,
                type: 'gened',
                content: `GenEd Category: ${category.label}\nCredits: ${category.total_credits}`
            });
        }

        console.log(`✓ Loaded ${documents.length} GenEd documents`);
    } catch (error) {
        console.error('Error loading GenEd:', error);
    }

    return documents;
}

/**
 * Main initialization function
 */
async function initializeRAG() {
    console.log('🚀 Starting RAG initialization...\n');

    if (!process.env.GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY not set');
        process.exit(1);
    }

    if (!process.env.PINECONE_API_KEY) {
        console.error('❌ PINECONE_API_KEY not set');
        process.exit(1);
    }

    try {
        // Load all documents - SKIP COURSES to stay within Gemini free tier limits
        console.log('📚 Loading documents (skipping courses for rate limit)...');
        // const courses = loadCourseDocuments();  // Commented out - 5000 docs exceeds free tier
        const minors = loadMinorDocuments();
        const majors = loadMajorDocuments();
        const genEd = loadGenEdDocuments();

        const allDocs = [...minors, ...majors, ...genEd];  // ~65 docs
        console.log(`\n📊 Total: ${allDocs.length} documents\n`);

        if (allDocs.length === 0) {
            console.error('❌ No documents loaded');
            process.exit(1);
        }

        // Generate embeddings
        console.log('🔢 Generating embeddings...');
        const embeddedDocuments: EmbeddedDocument[] = [];

        for (let i = 0; i < allDocs.length; i += BATCH_SIZE) {
            const batch = allDocs.slice(i, i + BATCH_SIZE);
            const batchNum = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(allDocs.length / BATCH_SIZE);

            console.log(`   Batch ${batchNum}/${totalBatches}...`);

            const contents = batch.map(doc => doc.content);
            const embeddings = await generateEmbeddings(contents);

            for (let j = 0; j < batch.length; j++) {
                if (embeddings[j] && embeddings[j].length > 0) {
                    embeddedDocuments.push({
                        id: batch[j].id,
                        values: embeddings[j],
                        metadata: {
                            type: batch[j].type,
                            content: batch[j].content
                        }
                    });
                }
            }

            // Delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log(`\n✓ Generated ${embeddedDocuments.length} embeddings\n`);

        // Upload to Pinecone
        console.log('📤 Uploading to Pinecone...');
        const indexName = process.env.PINECONE_INDEX_NAME || 'penn-state-courses';
        const index = pinecone.index(indexName);

        const UPSERT_BATCH = 100;
        for (let i = 0; i < embeddedDocuments.length; i += UPSERT_BATCH) {
            const batch = embeddedDocuments.slice(i, i + UPSERT_BATCH);
            await index.upsert(batch);
            console.log(`   Upserted ${Math.min(i + UPSERT_BATCH, embeddedDocuments.length)}/${embeddedDocuments.length}`);
        }

        console.log('\n🎉 RAG initialization complete!');
        console.log(`   Total vectors in Pinecone: ${embeddedDocuments.length}`);

    } catch (error) {
        console.error('❌ Initialization failed:', error);
        process.exit(1);
    }
}

initializeRAG();
