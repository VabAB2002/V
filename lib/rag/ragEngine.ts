// lib/rag/ragEngine.ts - Core RAG orchestration

import { generateQueryEmbedding, generateChatResponse, SYSTEM_PROMPT } from './gemini';
import { searchSimilar, checkIndexHealth } from './pinecone';
import type { UserContext, SearchResult, RAGResponse } from './types';

function buildContext(searchResults: SearchResult[], userContext: UserContext): string {
    const parts: string[] = [];

    // Add user context if available
    if (userContext.majorId || userContext.completedCourses?.length) {
        parts.push('## Student Information');

        if (userContext.majorId) {
            parts.push(`Major: ${userContext.majorName || userContext.majorId}`);
        }

        if (userContext.completedCourses && userContext.completedCourses.length > 0) {
            parts.push(`Completed Courses (${userContext.completedCourses.length} total): ${userContext.completedCourses.slice(0, 20).join(', ')}${userContext.completedCourses.length > 20 ? '...' : ''}`);
        }

        if (userContext.inProgressCourses && userContext.inProgressCourses.length > 0) {
            parts.push(`In-Progress Courses: ${userContext.inProgressCourses.join(', ')}`);
        }

        parts.push('');
    }

    // Add retrieved documents
    if (searchResults.length > 0) {
        parts.push('## Relevant Information from Course Catalog');

        for (const result of searchResults) {
            parts.push(`---`);
            parts.push(result.metadata.content || result.metadata.title);
        }
    }

    return parts.join('\n');
}

// Main RAG query pipeline
export async function processQuery(
    userMessage: string,
    userContext: UserContext
): Promise<RAGResponse> {
    try {
        const queryEmbedding = await generateQueryEmbedding(userMessage);

        if (!queryEmbedding || queryEmbedding.length === 0) {
            throw new Error('Failed to generate query embedding');
        }

        const searchResults = await searchSimilar(queryEmbedding, 10);

        console.log(`Found ${searchResults.length} relevant documents`);

        const context = buildContext(searchResults, userContext);

        const answer = await generateChatResponse(SYSTEM_PROMPT, userMessage, context);

        return {
            answer,
            sources: searchResults
        };
    } catch (error) {
        console.error('Error in RAG pipeline:', error);

        // Fallback response
        return {
            answer: "I apologize, but I encountered an error processing your question. Please try again or rephrase your question.",
            sources: []
        };
    }
}

/**
 * Simple query without RAG (for when Pinecone is not initialized)
 */
export async function processSimpleQuery(
    userMessage: string,
    userContext: UserContext
): Promise<string> {
    const contextParts: string[] = [];

    if (userContext.majorId) {
        contextParts.push(`The student is studying ${userContext.majorName || userContext.majorId}.`);
    }

    if (userContext.completedCourses?.length) {
        contextParts.push(`They have completed ${userContext.completedCourses.length} courses including: ${userContext.completedCourses.slice(0, 10).join(', ')}.`);
    }

    const context = contextParts.length > 0
        ? contextParts.join(' ')
        : 'No specific student information available.';

    try {
        return await generateChatResponse(SYSTEM_PROMPT, userMessage, context);
    } catch (error) {
        console.error('Error in simple query:', error);
        return "I apologize, but I encountered an error. Please try again.";
    }
}

/**
 * Check if the RAG system is ready
 */
export async function isRAGReady(): Promise<boolean> {
    try {
        return await checkIndexHealth();
    } catch {
        return false;
    }
}
