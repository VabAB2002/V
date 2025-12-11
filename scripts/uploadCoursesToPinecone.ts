// Uploads cleaned course documents to Pinecone
// Run: npx ts-node scripts/uploadCoursesToPinecone.ts
// Resume: npx ts-node scripts/uploadCoursesToPinecone.ts 500

import * as fs from 'fs';
import * as path from 'path';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Configuration - VERY conservative for free tier
const BATCH_SIZE = 10;          // Small batches
const DELAY_BETWEEN_DOCS = 500; // 500ms between each document
const DELAY_BETWEEN_BATCHES = 5000; // 5 seconds between batches
const MAX_RETRIES = 3;
const PROGRESS_FILE = 'lib/data/rag/upload_progress.json';

interface CleanedDocument {
    id: string;
    type: string;
    title: string;
    content: string;
}

interface Progress {
    lastSuccessfulIndex: number;
    successCount: number;
    errorCount: number;
    timestamp: string;
}

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateEmbeddingWithRetry(
    client: GoogleGenAI,
    text: string,
    maxRetries: number = MAX_RETRIES
): Promise<number[]> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await client.models.embedContent({
                model: 'gemini-embedding-001',
                contents: text,
            });
            return response.embeddings?.[0]?.values || [];
        } catch (error: any) {
            if (error.status === 429) {
                // Rate limit - wait exponentially longer
                const waitTime = Math.min(60000 * attempt, 180000); // Max 3 min
                console.log(`    ⏳ Rate limited, waiting ${waitTime / 1000}s (attempt ${attempt}/${maxRetries})`);
                await sleep(waitTime);
            } else {
                throw error;
            }
        }
    }
    throw new Error('Max retries exceeded');
}

function loadProgress(): Progress {
    try {
        if (fs.existsSync(PROGRESS_FILE)) {
            return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
        }
    } catch { }
    return { lastSuccessfulIndex: -1, successCount: 0, errorCount: 0, timestamp: '' };
}

function saveProgress(progress: Progress): void {
    progress.timestamp = new Date().toISOString();
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function main() {
    console.log('🚀 Starting Pinecone upload for course data...\n');
    console.log('⚠️  Using conservative rate limiting for free tier API.\n');

    // Check for resume argument
    const startFromArg = parseInt(process.argv[2], 10);

    // Validate environment variables
    const pineconeApiKey = process.env.PINECONE_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const indexName = process.env.PINECONE_INDEX_NAME || 'penn-state-courses';

    if (!pineconeApiKey || !geminiApiKey) {
        console.error('❌ Missing required environment variables:');
        if (!pineconeApiKey) console.error('  - PINECONE_API_KEY');
        if (!geminiApiKey) console.error('  - GEMINI_API_KEY');
        process.exit(1);
    }

    // Load cleaned course documents
    const inputPath = path.join(process.cwd(), 'lib', 'data', 'rag', 'cleaned_courses.json');

    if (!fs.existsSync(inputPath)) {
        console.error('❌ cleaned_courses.json not found. Run cleanCoursesForRAG.ts first.');
        process.exit(1);
    }

    const documents: CleanedDocument[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    console.log(`📊 Loaded ${documents.length} course documents\n`);

    // Initialize clients
    const pinecone = new Pinecone({ apiKey: pineconeApiKey });
    const gemini = new GoogleGenAI({ apiKey: geminiApiKey });
    const index = pinecone.index(indexName);

    // Check current index stats
    const statsBefore = await index.describeIndexStats();
    console.log(`📈 Current Pinecone vectors: ${statsBefore.totalRecordCount || 0}`);

    // Load or initialize progress
    let progress = loadProgress();

    // Handle resume from command line or saved progress
    let startIndex = 0;
    if (!isNaN(startFromArg) && startFromArg > 0) {
        startIndex = startFromArg;
        console.log(`📍 Resuming from command line arg: index ${startIndex}`);
    } else if (progress.lastSuccessfulIndex >= 0) {
        startIndex = progress.lastSuccessfulIndex + 1;
        console.log(`📍 Resuming from saved progress: index ${startIndex}`);
        console.log(`   Previous: ${progress.successCount} success, ${progress.errorCount} errors`);
    }

    if (startIndex >= documents.length) {
        console.log('✅ All documents already uploaded!');
        return;
    }

    // Process documents
    const totalRemaining = documents.length - startIndex;
    const totalBatches = Math.ceil(totalRemaining / BATCH_SIZE);

    console.log(`\n🔄 Processing ${totalRemaining} remaining docs in ~${totalBatches} batches...\n`);
    console.log(`⏱️  Estimated time: ${Math.ceil(totalRemaining * 0.6 / 60)} minutes\n`);

    for (let i = startIndex; i < documents.length; i += BATCH_SIZE) {
        const batchNum = Math.floor((i - startIndex) / BATCH_SIZE) + 1;
        const end = Math.min(i + BATCH_SIZE, documents.length);
        const batch = documents.slice(i, end);

        console.log(`📦 Batch ${batchNum}/${totalBatches} (docs ${i + 1}-${end})`);

        const vectors: { id: string; values: number[]; metadata: Record<string, string> }[] = [];

        for (let j = 0; j < batch.length; j++) {
            const doc = batch[j];
            const docIndex = i + j;

            try {
                // Generate embedding with retry logic
                const embedding = await generateEmbeddingWithRetry(gemini, doc.content);

                if (embedding.length === 0) {
                    console.warn(`  ⚠️ Empty embedding for ${doc.id}`);
                    progress.errorCount++;
                    continue;
                }

                vectors.push({
                    id: doc.id,
                    values: embedding,
                    metadata: {
                        type: doc.type,
                        title: doc.title,
                        content: doc.content.slice(0, 1000),
                    }
                });

                progress.lastSuccessfulIndex = docIndex;
                progress.successCount++;

                // Delay between each document
                await sleep(DELAY_BETWEEN_DOCS);

            } catch (error: any) {
                console.error(`  ❌ Failed ${doc.id}: ${error.message?.slice(0, 80) || error}`);
                progress.errorCount++;

                // Save progress on error
                saveProgress(progress);

                // If rate limited too many times, wait longer
                if (error.message?.includes('Max retries')) {
                    console.log('  💤 Extended cooldown (60s)...');
                    await sleep(60000);
                }
            }
        }

        // Upsert batch to Pinecone
        if (vectors.length > 0) {
            try {
                await index.upsert(vectors);
                console.log(`  ✅ Uploaded ${vectors.length} vectors`);
            } catch (error: any) {
                console.error(`  ❌ Batch upload failed: ${error.message?.slice(0, 60)}`);
            }
        }

        // Save progress after each batch
        saveProgress(progress);

        // Delay between batches
        if (i + BATCH_SIZE < documents.length) {
            console.log(`  💤 Cooling down ${DELAY_BETWEEN_BATCHES / 1000}s...`);
            await sleep(DELAY_BETWEEN_BATCHES);
        }
    }

    // Final stats
    console.log('\n' + '='.repeat(50));
    console.log('📊 Upload Complete!');
    console.log('='.repeat(50));
    console.log(`  ✅ Successfully uploaded: ${progress.successCount} documents`);
    console.log(`  ❌ Errors: ${progress.errorCount} documents`);

    // Verify final count
    await sleep(2000);
    const statsAfter = await index.describeIndexStats();
    console.log(`  📈 Total Pinecone vectors: ${statsAfter.totalRecordCount || 0}`);
}

main().catch(console.error);
