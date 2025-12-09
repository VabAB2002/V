// lib/rag/pinecone.ts - Pinecone client for vector operations

import { Pinecone, RecordMetadata } from '@pinecone-database/pinecone';
import type { EmbeddedDocument, SearchResult, DocumentMetadata } from './types';

// Initialize Pinecone client
let pineconeClient: Pinecone | null = null;

function getPinecone(): Pinecone {
    if (!pineconeClient) {
        pineconeClient = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY || ''
        });
    }
    return pineconeClient;
}

/**
 * Get the Pinecone index for course data
 */
function getIndex() {
    const indexName = process.env.PINECONE_INDEX_NAME || 'penn-state-courses';
    return getPinecone().index(indexName);
}

/**
 * Convert DocumentMetadata to Pinecone RecordMetadata
 */
function toRecordMetadata(metadata: DocumentMetadata): RecordMetadata {
    return {
        type: metadata.type,
        title: metadata.title,
        content: metadata.content,
        credits: metadata.credits ?? 0,
        department: metadata.department ?? '',
        attributes: metadata.attributes ?? [],
        programId: metadata.programId ?? ''
    };
}

/**
 * Upsert documents to Pinecone
 * @param documents Array of embedded documents to store
 */
export async function upsertDocuments(documents: EmbeddedDocument[]): Promise<void> {
    if (documents.length === 0) return;

    const index = getIndex();

    // Pinecone has a limit on batch size, so we chunk the documents
    const BATCH_SIZE = 100;

    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
        const batch = documents.slice(i, i + BATCH_SIZE);

        await index.upsert(
            batch.map(doc => ({
                id: doc.id,
                values: doc.values,
                metadata: toRecordMetadata(doc.metadata)
            }))
        );

        console.log(`Upserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(documents.length / BATCH_SIZE)}`);
    }
}

/**
 * Search for similar documents in Pinecone
 * @param queryEmbedding Query vector
 * @param topK Number of results to return
 * @param filter Optional metadata filter
 * @returns Array of search results with scores
 */
export async function searchSimilar(
    queryEmbedding: number[],
    topK: number = 5,
    filter?: Record<string, unknown>
): Promise<SearchResult[]> {
    const index = getIndex();

    const queryOptions: {
        vector: number[];
        topK: number;
        includeMetadata: boolean;
        filter?: Record<string, unknown>;
    } = {
        vector: queryEmbedding,
        topK,
        includeMetadata: true
    };

    if (filter) {
        queryOptions.filter = filter;
    }

    const results = await index.query(queryOptions);

    return (results.matches || []).map(match => ({
        id: match.id,
        score: match.score || 0,
        metadata: match.metadata as unknown as DocumentMetadata
    }));
}

/**
 * Delete all documents from the index
 */
export async function clearIndex(): Promise<void> {
    const index = getIndex();
    await index.deleteAll();
}

/**
 * Get index statistics
 */
export async function getIndexStats() {
    const index = getIndex();
    return await index.describeIndexStats();
}

/**
 * Check if the index exists and is ready
 */
export async function checkIndexHealth(): Promise<boolean> {
    try {
        const stats = await getIndexStats();
        console.log('Pinecone index stats:', stats);
        return true;
    } catch (error) {
        console.error('Pinecone index health check failed:', error);
        return false;
    }
}
