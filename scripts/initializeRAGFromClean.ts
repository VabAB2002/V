// Initialize RAG from cleaned data
// Usage: npx tsx scripts/initializeRAGFromClean.ts

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { Pinecone } from '@pinecone-database/pinecone';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const CLEANED_DATA_PATH = path.join(process.cwd(), 'lib', 'data', 'rag', 'cleaned_documents.json');

interface CleanedDocument {
    id: string;
    type: string;
    title: string;
    content: string;
}

interface EmbeddedDocument {
    id: string;
    values: number[];
    metadata: Record<string, string>;
}

// Initialize clients
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY || '' });

async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const result = await genai.models.embedContent({
            model: 'gemini-embedding-001',
            contents: text
        });

        if (result.embeddings?.[0]?.values) {
            return result.embeddings[0].values;
        }
    } catch (error: any) {
        console.error(`   ✗ Error: ${error.message?.substring(0, 50) || 'Unknown'}`);
    }
    return [];
}

async function main() {
    console.log('🚀 Starting RAG initialization from cleaned data...\n');

    if (!process.env.GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY not set');
        process.exit(1);
    }

    if (!process.env.PINECONE_API_KEY) {
        console.error('❌ PINECONE_API_KEY not set');
        process.exit(1);
    }

    // Load cleaned documents
    console.log('📚 Loading cleaned documents...');
    if (!fs.existsSync(CLEANED_DATA_PATH)) {
        console.error('❌ Cleaned data not found. Run cleanDataForRAG.ts first.');
        process.exit(1);
    }

    const documents: CleanedDocument[] = JSON.parse(fs.readFileSync(CLEANED_DATA_PATH, 'utf-8'));
    console.log(`   ✓ Loaded ${documents.length} documents\n`);

    // Generate embeddings
    console.log('🔢 Generating embeddings (with 2s delay between calls)...');
    const embeddedDocuments: EmbeddedDocument[] = [];

    for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];

        // 2 second delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));

        const embedding = await generateEmbedding(doc.content);

        if (embedding.length > 0) {
            embeddedDocuments.push({
                id: doc.id,
                values: embedding,
                metadata: {
                    type: doc.type,
                    title: doc.title,
                    content: doc.content.substring(0, 1000) // Truncate for metadata
                }
            });
            console.log(`   ✓ ${i + 1}/${documents.length}: ${doc.title.substring(0, 40)}`);
        } else {
            console.log(`   ✗ ${i + 1}/${documents.length}: Failed - ${doc.title.substring(0, 40)}`);
        }
    }

    console.log(`\n✓ Generated ${embeddedDocuments.length} embeddings\n`);

    if (embeddedDocuments.length === 0) {
        console.error('❌ No embeddings generated');
        process.exit(1);
    }

    // Clear and upload to Pinecone
    console.log('📤 Uploading to Pinecone...');
    const indexName = process.env.PINECONE_INDEX_NAME || 'penn-state-courses';
    const index = pinecone.index(indexName);

    // Delete all existing vectors first
    console.log('   Clearing existing vectors...');
    try {
        await index.deleteAll();
        console.log('   ✓ Cleared existing vectors');
    } catch (error) {
        console.log('   ⚠ Could not clear (might be empty)');
    }

    // Upsert new vectors
    const BATCH_SIZE = 50;
    for (let i = 0; i < embeddedDocuments.length; i += BATCH_SIZE) {
        const batch = embeddedDocuments.slice(i, i + BATCH_SIZE);
        await index.upsert(batch);
        console.log(`   Upserted ${Math.min(i + BATCH_SIZE, embeddedDocuments.length)}/${embeddedDocuments.length}`);
    }

    console.log('\n🎉 RAG initialization complete!');
    console.log(`   Total vectors in Pinecone: ${embeddedDocuments.length}`);
}

main();
