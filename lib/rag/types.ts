// lib/rag/types.ts - Type definitions for RAG system

export interface RawDocument {
    id: string;
    type: 'course' | 'major' | 'minor' | 'certificate' | 'gened';
    content: string;
    metadata: DocumentMetadata;
}

export interface DocumentMetadata {
    type: 'course' | 'major' | 'minor' | 'certificate' | 'gened';
    title: string;
    content: string;
    credits?: number;
    department?: string;
    attributes?: string[];
    programId?: string;
}

export interface EmbeddedDocument {
    id: string;
    values: number[];
    metadata: DocumentMetadata;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export interface UserContext {
    majorId?: string;
    majorName?: string;
    completedCourses?: string[];
    inProgressCourses?: string[];
}

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
