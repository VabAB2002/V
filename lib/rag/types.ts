// lib/rag/types.ts - Type definitions for RAG system

/**
 * Raw document before embedding
 */
export interface RawDocument {
    id: string;
    type: 'course' | 'major' | 'minor' | 'certificate' | 'gened';
    content: string;
    metadata: DocumentMetadata;
}

/**
 * Document metadata stored in Pinecone
 */
export interface DocumentMetadata {
    type: 'course' | 'major' | 'minor' | 'certificate' | 'gened';
    title: string;
    content: string;
    credits?: number;
    department?: string;
    attributes?: string[];
    programId?: string;
}

/**
 * Document with embedding ready for Pinecone
 */
export interface EmbeddedDocument {
    id: string;
    values: number[];
    metadata: DocumentMetadata;
}

/**
 * Chat message structure
 */
export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

/**
 * User academic context for personalized responses
 */
export interface UserContext {
    majorId?: string;
    majorName?: string;
    completedCourses?: string[];
    inProgressCourses?: string[];
}

/**
 * Search result from Pinecone
 */
export interface SearchResult {
    id: string;
    score: number;
    metadata: DocumentMetadata;
}

/**
 * RAG query result
 */
export interface RAGResponse {
    answer: string;
    sources: SearchResult[];
}
